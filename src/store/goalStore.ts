import { create } from 'zustand'
import type { Goal, GoalStatus } from '../types'
import { goalStatusFromScore, computeScore } from '../lib/scoreEngine'
import { useOrgStore } from './orgStore'
import { useAuthStore } from './authStore'

function syncEmployeeGoals(employeeId: string, goals: Goal[]) {
  const org = useOrgStore.getState()
  const emp = org.getEmployeeById(employeeId)
  if (!emp) return
  org.updateEmployee(employeeId, { goals })
}

function audit(action: string, targetId: string, targetLabel: string, oldValue: string, newValue: string) {
  const user = useAuthStore.getState().user
  useOrgStore.getState().addAuditEntry({
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

interface GoalStore {
  getGoalsForEmployee: (employeeId: string) => Goal[]
  addGoal: (goal: Goal) => void
  updateGoal: (employeeId: string, id: string, updates: Partial<Goal>) => void
  deleteGoal: (employeeId: string, id: string) => void
  logActual: (
    employeeId: string,
    goalId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    actual: number,
  ) => void
  approveGoal: (employeeId: string, goalId: string) => void
  rejectGoal: (employeeId: string, goalId: string, reason: string) => void
  submitGoals: (employeeId: string) => void
  pushKPI: (kpi: Partial<Goal>, employeeIds: string[]) => void
  lockAllApproved: () => void
  unlockGoal: (employeeId: string, goalId: string, reason: string) => void
}

export const useGoalStore = create<GoalStore>(() => ({
  getGoalsForEmployee: (employeeId) => {
    return useOrgStore.getState().getEmployeeById(employeeId)?.goals ?? []
  },

  addGoal: (goal) => {
    const goals = useGoalStore.getState().getGoalsForEmployee(goal.employeeId)
    syncEmployeeGoals(goal.employeeId, [...goals, goal])
    audit('GOAL_CREATED', goal.id, goal.title, '', 'created')
  },

  updateGoal: (employeeId, id, updates) => {
    const goals = useGoalStore.getState().getGoalsForEmployee(employeeId)
    const prev = goals.find((g) => g.id === id)
    const next = goals.map((g) =>
      g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g,
    )
    syncEmployeeGoals(employeeId, next)
    if (prev) {
      audit('GOAL_UPDATED', id, prev.title, JSON.stringify(prev), JSON.stringify(updates))
    }
  },

  deleteGoal: (employeeId, id) => {
    const goals = useGoalStore.getState().getGoalsForEmployee(employeeId)
    const prev = goals.find((g) => g.id === id)
    syncEmployeeGoals(
      employeeId,
      goals.filter((g) => g.id !== id),
    )
    if (prev) audit('GOAL_DELETED', id, prev.title, prev.title, '')
  },

  logActual: (employeeId, goalId, quarter, actual) => {
    const goals = useGoalStore.getState().getGoalsForEmployee(employeeId)
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const score = computeScore(goal, actual)
    const status: GoalStatus = goalStatusFromScore(score)
    const existing = goal.quarterlyActuals.filter((q) => q.quarter !== quarter)
    const updated: Goal = {
      ...goal,
      quarterlyActuals: [
        ...existing,
        { quarter, actual, status, submittedAt: new Date() },
      ],
      updatedAt: new Date(),
    }
    useGoalStore.getState().updateGoal(employeeId, goalId, {
      quarterlyActuals: updated.quarterlyActuals,
    })
    audit('ACTUAL_LOGGED', goalId, `${quarter} actual`, '0', String(actual))
  },

  approveGoal: (employeeId, goalId) => {
    useGoalStore.getState().updateGoal(employeeId, goalId, {
      approvalStatus: 'approved',
      locked: true,
    })
    const goal = useGoalStore.getState().getGoalsForEmployee(employeeId).find((g) => g.id === goalId)
    if (goal) audit('GOAL_APPROVED', goalId, goal.title, 'submitted', 'approved')
  },

  rejectGoal: (employeeId, goalId, reason) => {
    useGoalStore.getState().updateGoal(employeeId, goalId, {
      approvalStatus: 'rejected',
      locked: false,
    })
    const goal = useGoalStore.getState().getGoalsForEmployee(employeeId).find((g) => g.id === goalId)
    if (goal) audit('GOAL_REJECTED', goalId, goal.title, 'submitted', reason)
  },

  submitGoals: (employeeId) => {
    const goals = useGoalStore.getState().getGoalsForEmployee(employeeId)
    const next = goals.map((g) => ({
      ...g,
      approvalStatus: 'submitted' as const,
      updatedAt: new Date(),
    }))
    syncEmployeeGoals(employeeId, next)
    audit('GOALS_SUBMITTED', employeeId, 'Goal sheet', 'draft', 'submitted')
  },

  pushKPI: (kpi, employeeIds) => {
    employeeIds.forEach((empId) => {
      const goal: Goal = {
        id: `g-push-${empId}-${Date.now()}`,
        employeeId: empId,
        thrustArea: kpi.thrustArea ?? 'Operational Excellence',
        title: kpi.title ?? 'Admin KPI',
        description: kpi.description ?? '',
        uom: kpi.uom ?? 'numeric_min',
        target: kpi.target ?? 0,
        targetDate: kpi.targetDate,
        weightage: 10,
        isAdminPushed: true,
        approvalStatus: 'draft',
        locked: false,
        quarterlyActuals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      useGoalStore.getState().addGoal(goal)
    })
    audit('KPI_PUSHED', kpi.title ?? 'KPI', kpi.title ?? '', '', `${employeeIds.length} employees`)
  },

  lockAllApproved: () => {
    const org = useOrgStore.getState()
    org.employees.forEach((emp) => {
      const next = emp.goals.map((g) =>
        g.approvalStatus === 'approved' ? { ...g, locked: true } : g,
      )
      org.updateEmployee(emp.id, { goals: next })
    })
    audit('LOCK_ALL', 'all', 'Approved goals', '', 'locked')
  },

  unlockGoal: (employeeId, goalId, reason) => {
    useGoalStore.getState().updateGoal(employeeId, goalId, { locked: false })
    audit('GOAL_UNLOCKED', goalId, reason, 'locked', 'unlocked')
  },
}))
