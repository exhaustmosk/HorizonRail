import type { Employee, Goal } from '../types'

export interface EmployeeTask {
  id: string
  title: string
  done: boolean
  goalId?: string
  dueLabel?: string
  priority: 'high' | 'medium' | 'low'
}

export function buildEmployeeTasks(employee: Employee): EmployeeTask[] {
  const tasks: EmployeeTask[] = []

  employee.goals.forEach((g: Goal) => {
    if (g.approvalStatus === 'draft') {
      tasks.push({
        id: `task-submit-${g.id}`,
        title: `Submit "${g.title}" for approval`,
        done: false,
        goalId: g.id,
        dueLabel: 'This week',
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
    const hasQ1 = g.quarterlyActuals.some((q) => q.quarter === 'Q1')
    if (g.locked && !hasQ1) {
      tasks.push({
        id: `task-log-${g.id}`,
        title: `Log Q1 actual for ${g.title}`,
        done: false,
        goalId: g.id,
        dueLabel: 'Q1 check-in',
        priority: 'medium',
      })
    }
    if (g.weightage < 10) {
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
  if (employee.goals.length > 0 && totalWeight !== 100) {
    tasks.push({
      id: 'task-weight-total',
      title: `Balance goal sheet to 100% (now ${totalWeight}%)`,
      done: false,
      priority: 'high',
    })
  }

  tasks.push(
    {
      id: 'task-review-manager',
      title: 'Review manager comments on Q1',
      done: false,
      priority: 'low',
    },
    {
      id: 'task-update-profile',
      title: 'Confirm FY26 development plan',
      done: true,
      priority: 'low',
    },
  )

  return tasks
}
