import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { CheckInComment, Goal, GoalStatus } from '../types'
import { goalStatusFromScore, computeScore } from '../lib/scoreEngine'
import { useOrgStore } from './orgStore'
import { useAuthStore } from './authStore'
import { notifyGoalSubmitted, notifyGoalApproved, notifyGoalRejected } from '../lib/notificationService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function audit(
  action: string,
  targetId: string,
  targetLabel: string,
  oldValue: string,
  newValue: string,
) {
  const user = useAuthStore.getState().user
  await useOrgStore.getState().addAuditEntry({
    timestamp: new Date(),
    actorId: user?.id ?? 'system',
    actorName: user?.name ?? 'System',
    action,
    targetId,
    targetLabel,
    oldValue,
    newValue,
  })
}

// Re-fetch a single employee's goals from Supabase and sync to orgStore
async function refreshEmployeeGoals(employeeId: string) {
  const { data: goals } = await supabase
    .from('goals')
    .select('*, quarterly_actuals(*), checkin_comments(*)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: true })

  const mappedGoals: Goal[] = (goals ?? []).map((g) => ({
    id: g.id as string,
    employeeId: g.employee_id as string,
    thrustArea: g.thrust_area as string,
    title: g.title as string,
    description: (g.description as string) ?? '',
    uom: g.uom as Goal['uom'],
    target: Number(g.target),
    targetDate: g.target_date ? new Date(g.target_date as string) : undefined,
    weightage: Number(g.weightage),
    isAdminPushed: Boolean(g.is_admin_pushed),
    approvalStatus: g.approval_status as Goal['approvalStatus'],
    locked: Boolean(g.locked),
    createdAt: new Date(g.created_at as string),
    updatedAt: new Date(g.updated_at as string),
    quarterlyActuals: ((g.quarterly_actuals as Record<string, unknown>[]) ?? []).map((qa) => {
      const comment = ((g.checkin_comments as Record<string, unknown>[]) ?? []).find(
        (c) => c.quarter === qa.quarter
      )
      return {
        quarter: qa.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4',
        planned: Number(qa.planned),
        actual: Number(qa.actual),
        status: qa.status as GoalStatus,
        employeeNotes: (qa.employee_notes as string) ?? '',
        managerComment: (qa.manager_comment as string) ?? '',
        submittedAt: new Date(qa.submitted_at as string),
        checkInComment: comment
          ? {
              summary: (comment.summary as string) ?? '',
              strengths: (comment.strengths as string) ?? '',
              blockers: (comment.blockers as string) ?? '',
              nextSteps: (comment.next_steps as string) ?? '',
              managerId: comment.manager_id as string,
              managerName: comment.manager_name as string,
              submittedAt: new Date(comment.submitted_at as string),
            }
          : undefined,
      }
    }),
  }))

  useOrgStore.getState().updateEmployee(employeeId, { goals: mappedGoals })
  return mappedGoals
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface GoalStore {
  getGoalsForEmployee: (employeeId: string) => Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'quarterlyActuals'>) => Promise<void>
  updateGoal: (employeeId: string, id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (employeeId: string, id: string) => Promise<void>
  logActual: (employeeId: string, goalId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', actual: number) => Promise<void>
  submitQuarterlyCheckIn: (
    employeeId: string,
    goalId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    data: { planned: number; actual: number; status: GoalStatus; employeeNotes?: string },
  ) => Promise<void>
  saveManagerCheckInComment: (
    employeeId: string,
    goalId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    comment: Omit<CheckInComment, 'submittedAt'>,
  ) => Promise<void>
  approveGoal: (employeeId: string, goalId: string) => Promise<void>
  rejectGoal: (employeeId: string, goalId: string, reason: string) => Promise<void>
  submitGoals: (employeeId: string) => Promise<void>
  pushKPI: (kpi: Partial<Goal>, employeeIds: string[]) => Promise<void>
  lockAllApproved: () => Promise<void>
  unlockGoal: (employeeId: string, goalId: string, reason: string) => Promise<void>
  distributeWeightageEqually: (employeeId: string) => Promise<void>
}

export const useGoalStore = create<GoalStore>(() => ({
  getGoalsForEmployee: (employeeId) =>
    useOrgStore.getState().getEmployeeById(employeeId)?.goals ?? [],

  addGoal: async (goal) => {
    const user = useAuthStore.getState().user
    const { data, error } = await supabase
      .from('goals')
      .insert({
        employee_id: goal.employeeId,
        org_id: user?.organizationId ?? null,
        thrust_area: goal.thrustArea,
        title: goal.title,
        description: goal.description ?? '',
        uom: goal.uom,
        target: goal.target,
        target_date: goal.targetDate?.toISOString() ?? null,
        weightage: goal.weightage,
        is_admin_pushed: goal.isAdminPushed ?? false,
        approval_status: goal.isAdminPushed ? 'approved' : 'draft',
        locked: goal.isAdminPushed ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Seed blank quarterly actuals for Q1-Q4
    if (data) {
      const actuals = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({
        goal_id: data.id as string,
        quarter: q,
        planned: goal.target,
        actual: 0,
        status: 'not_started',
        employee_notes: '',
        manager_comment: '',
      }))
      await supabase.from('quarterly_actuals').insert(actuals)
    }

    await refreshEmployeeGoals(goal.employeeId)
    await audit('GOAL_CREATED', data?.id ?? '', goal.title, '', 'draft')
  },

  updateGoal: async (employeeId, id, updates) => {
    const patch: Record<string, unknown> = {}
    if (updates.thrustArea !== undefined) patch.thrust_area = updates.thrustArea
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.uom !== undefined) patch.uom = updates.uom
    if (updates.target !== undefined) patch.target = updates.target
    if (updates.targetDate !== undefined) patch.target_date = updates.targetDate?.toISOString() ?? null
    if (updates.weightage !== undefined) patch.weightage = updates.weightage
    if (updates.approvalStatus !== undefined) patch.approval_status = updates.approvalStatus
    if (updates.locked !== undefined) patch.locked = updates.locked

    const { error } = await supabase.from('goals').update(patch).eq('id', id)
    if (error) throw new Error(error.message)

    await refreshEmployeeGoals(employeeId)

    if (updates.approvalStatus) {
      const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === id)
      await audit(
        updates.approvalStatus === 'approved'
          ? 'GOAL_APPROVED'
          : updates.approvalStatus === 'rejected'
          ? 'GOAL_REJECTED'
          : updates.approvalStatus === 'submitted'
          ? 'GOAL_SUBMITTED'
          : 'GOAL_UPDATED',
        id,
        goal?.title ?? id,
        '',
        updates.approvalStatus,
      )
    }
  },

  deleteGoal: async (employeeId, id) => {
    const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === id)
    await supabase.from('goals').delete().eq('id', id)
    await refreshEmployeeGoals(employeeId)
    await audit('GOAL_DELETED', id, goal?.title ?? id, goal?.title ?? '', '')
  },

  logActual: async (employeeId, goalId, quarter, actual) => {
    const goals = useOrgStore.getState().getEmployeeById(employeeId)?.goals ?? []
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const score = computeScore(goal, actual)
    const status: GoalStatus = goalStatusFromScore(score)

    await supabase.from('quarterly_actuals').upsert(
      {
        goal_id: goalId,
        quarter,
        planned: actual,
        actual,
        status,
        employee_notes: '',
        manager_comment: '',
      },
      { onConflict: 'goal_id,quarter' }
    )

    await refreshEmployeeGoals(employeeId)
    await audit('ACTUAL_LOGGED', goalId, `${quarter} actual`, '0', String(actual))
  },

  submitQuarterlyCheckIn: async (employeeId, goalId, quarter, data) => {
    await supabase.from('quarterly_actuals').upsert(
      {
        goal_id: goalId,
        quarter,
        planned: data.planned,
        actual: data.actual,
        status: data.status,
        employee_notes: data.employeeNotes ?? '',
      },
      { onConflict: 'goal_id,quarter' }
    )

    await refreshEmployeeGoals(employeeId)
    const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === goalId)
    await audit('QUARTERLY_CHECKIN', goalId, goal?.title ?? goalId, `${quarter} planned`, `${data.actual} (${data.status})`)
  },

  saveManagerCheckInComment: async (employeeId, goalId, quarter, comment) => {
    // Update manager_comment on quarterly_actuals
    await supabase
      .from('quarterly_actuals')
      .update({ manager_comment: comment.summary })
      .eq('goal_id', goalId)
      .eq('quarter', quarter)

    // Upsert structured comment in checkin_comments
    await supabase.from('checkin_comments').upsert(
      {
        goal_id: goalId,
        quarter,
        summary: comment.summary,
        strengths: comment.strengths ?? '',
        blockers: comment.blockers ?? '',
        next_steps: comment.nextSteps ?? '',
        manager_id: comment.managerId,
        manager_name: comment.managerName,
      },
      { onConflict: 'goal_id,quarter' }
    )

    await refreshEmployeeGoals(employeeId)
    const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === goalId)
    await audit('CHECKIN_COMMENT', goalId, goal?.title ?? goalId, quarter, comment.summary.slice(0, 80))
  },

  approveGoal: async (employeeId, goalId) => {
    await supabase
      .from('goals')
      .update({ approval_status: 'approved', locked: true })
      .eq('id', goalId)

    await refreshEmployeeGoals(employeeId)
    const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === goalId)
    await audit('GOAL_APPROVED', goalId, goal?.title ?? goalId, 'submitted', 'approved')

    // Notify employee their goal was approved
    try {
      const emp = useOrgStore.getState().getEmployeeById(employeeId)
      const manager = useAuthStore.getState().user
      if (emp && manager && goal) {
        notifyGoalApproved(emp.id, emp.email, emp.name, goal.title, manager.name, emp.organizationId)
      }
    } catch { /* notification failure should not break the flow */ }
  },

  rejectGoal: async (employeeId, goalId, reason) => {
    await supabase
      .from('goals')
      .update({ approval_status: 'rejected', locked: false })
      .eq('id', goalId)

    await refreshEmployeeGoals(employeeId)
    const goal = useOrgStore.getState().getEmployeeById(employeeId)?.goals.find((g) => g.id === goalId)
    await audit('GOAL_REJECTED', goalId, goal?.title ?? goalId, 'submitted', reason)

    // Notify employee their goal was returned for rework
    try {
      const emp = useOrgStore.getState().getEmployeeById(employeeId)
      const manager = useAuthStore.getState().user
      if (emp && manager && goal) {
        notifyGoalRejected(emp.id, emp.email, emp.name, goal.title, manager.name, reason, emp.organizationId)
      }
    } catch { /* notification failure should not break the flow */ }
  },

  submitGoals: async (employeeId) => {
    const goals = useOrgStore.getState().getEmployeeById(employeeId)?.goals ?? []
    const draftGoals = goals.filter((g) => g.approvalStatus === 'draft')

    for (const g of draftGoals) {
      await supabase
        .from('goals')
        .update({ approval_status: 'submitted' })
        .eq('id', g.id)
    }

    await refreshEmployeeGoals(employeeId)
    await audit('GOALS_SUBMITTED', employeeId, 'Goal sheet', 'draft', 'submitted')

    // Notify the manager that goals were submitted
    try {
      const emp = useOrgStore.getState().getEmployeeById(employeeId)
      if (emp?.managerId) {
        const mgr = useOrgStore.getState().getEmployeeById(emp.managerId)
        if (mgr) {
          notifyGoalSubmitted(emp.name, emp.email, mgr.id, mgr.email, mgr.name, draftGoals.length, emp.organizationId)
        }
      }
    } catch { /* notification failure should not break the flow */ }
  },

  pushKPI: async (kpi, employeeIds) => {
    const user = useAuthStore.getState().user
    let ids = employeeIds

    if (user?.role === 'manager') {
      const allowed = new Set(
        useOrgStore.getState().getDirectReports(user.id).map((e) => e.id),
      )
      ids = employeeIds.filter((id) => allowed.has(id))
      if (ids.length === 0) return
    }

    for (const empId of ids) {
      const emp = useOrgStore.getState().getEmployeeById(empId)
      if (!emp) continue

      const { data: newGoal } = await supabase
        .from('goals')
        .insert({
          employee_id: empId,
          org_id: user?.organizationId ?? null,
          thrust_area: kpi.thrustArea ?? 'Operational Excellence',
          title: kpi.title ?? 'Admin KPI',
          description: kpi.description ?? '',
          uom: kpi.uom ?? 'numeric_min',
          target: kpi.target ?? 0,
          target_date: kpi.targetDate?.toISOString() ?? null,
          weightage: 0,
          is_admin_pushed: true,
          approval_status: 'approved',
          locked: true,
        })
        .select()
        .single()

      if (newGoal) {
        const actuals = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({
          goal_id: newGoal.id as string,
          quarter: q,
          planned: kpi.target ?? 0,
          actual: 0,
          status: 'not_started',
          employee_notes: '',
          manager_comment: '',
        }))
        await supabase.from('quarterly_actuals').insert(actuals)
        await refreshEmployeeGoals(empId)
      }
    }

    await audit('KPI_PUSHED', kpi.title ?? 'KPI', kpi.title ?? '', '', `${ids.length} employees`)
  },

  lockAllApproved: async () => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    await supabase
      .from('goals')
      .update({ locked: true })
      .eq('org_id', user.organizationId)
      .eq('approval_status', 'approved')

    await useOrgStore.getState().fetchAll()
    await audit('LOCK_ALL', 'all', 'Approved goals', '', 'locked')
  },

  unlockGoal: async (employeeId, goalId, reason) => {
    await supabase.from('goals').update({ locked: false }).eq('id', goalId)
    await refreshEmployeeGoals(employeeId)
    await audit('GOAL_UNLOCKED', goalId, reason, 'locked', 'unlocked')
  },

  distributeWeightageEqually: async (employeeId) => {
    const goals = useOrgStore.getState().getEmployeeById(employeeId)?.goals ?? []
    if (goals.length === 0) return

    const N = goals.length
    const base = Math.floor(100 / N)
    const remainder = 100 % N

    const updates = goals.map((g, idx) => {
      const weightage = base + (idx < remainder ? 1 : 0)
      return {
        id: g.id,
        weightage,
      }
    })

    // Update in Supabase in parallel
    await Promise.all(
      updates.map(({ id, weightage }) =>
        supabase
          .from('goals')
          .update({ weightage })
          .eq('id', id)
      )
    )

    await refreshEmployeeGoals(employeeId)
    await audit('GOALS_REBALANCED', employeeId, 'Goal sheet', '', 'Equally distributed weightage')
  },
}))
