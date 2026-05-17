import type { Employee, Goal } from '../types'
import type { CheckInPeriod, CycleQuotaPolicy } from '../types'
import { canLogAchievement, isCheckInQuarter, resolveActivePeriod } from './checkInSchedule'

export interface EmployeeTask {
  id: string
  title: string
  done: boolean
  goalId?: string
  dueLabel?: string
  priority: 'high' | 'medium' | 'low'
}

export function buildEmployeeTasks(
  employee: Employee,
  periods: CheckInPeriod[] = [],
  policy?: CycleQuotaPolicy,
  now = new Date(),
  forcedPeriodId?: import('../types').CyclePhaseId | null,
): EmployeeTask[] {
  const tasks: EmployeeTask[] = []
  const activePeriod = periods.length
    ? resolveActivePeriod(periods, now, forcedPeriodId)
    : undefined
  const canCheckIn =
    activePeriod && policy
      ? canLogAchievement(activePeriod, policy, now)
      : false
  const activeQuarter =
    activePeriod && isCheckInQuarter(activePeriod.quarter)
      ? activePeriod.quarter
      : null

  employee.goals.forEach((g: Goal) => {
    if (g.approvalStatus === 'draft') {
      tasks.push({
        id: `task-submit-${g.id}`,
        title: `Submit "${g.title}" for approval`,
        done: false,
        goalId: g.id,
        dueLabel: activePeriod?.quarter === 'goal_setting' ? 'Goal setting window' : 'This week',
        priority: 'high',
      })
    }
    if (g.approvalStatus === 'rejected') {
      tasks.push({
        id: `task-revise-${g.id}`,
        title: `Revise rejected goal: ${g.title}`,
        done: false,
        goalId: g.id,
        priority: 'high',
      })
    }
    if (activeQuarter && g.locked && canCheckIn) {
      const hasQuarter = g.quarterlyActuals.some((q) => q.quarter === activeQuarter)
      if (!hasQuarter) {
        tasks.push({
          id: `task-log-${g.id}-${activeQuarter}`,
          title: `${activeQuarter} check-in: ${g.title}`,
          done: false,
          goalId: g.id,
          dueLabel: `${activePeriod?.label ?? activeQuarter} · Planned vs actual`,
          priority: 'high',
        })
      }
    }
    if (g.weightage < (policy?.minWeightagePerGoal ?? 10)) {
      tasks.push({
        id: `task-weight-${g.id}`,
        title: `Fix weightage on ${g.title}`,
        done: false,
        goalId: g.id,
        priority: 'medium',
      })
    }
  })

  const totalWeight = employee.goals.reduce((s, g) => s + g.weightage, 0)
  const required = policy?.totalWeightageRequired ?? 100
  if (employee.goals.length > 0 && totalWeight !== required) {
    tasks.push({
      id: 'task-weight-total',
      title: `Balance goal sheet to ${required}% (now ${totalWeight}%)`,
      done: false,
      priority: 'high',
    })
  }

  if (
    activePeriod?.quarter === 'goal_setting' &&
    policy?.goalSettingMandatory &&
    employee.goals.length < (policy.minGoals ?? 1)
  ) {
    tasks.push({
      id: 'task-min-goals',
      title: `Add at least ${policy.minGoals} goals before window closes`,
      done: false,
      dueLabel: 'Phase 1 — Goal Setting',
      priority: 'high',
    })
  }

  return tasks
}
