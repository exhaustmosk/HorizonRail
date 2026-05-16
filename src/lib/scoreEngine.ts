import type { Goal } from '../types'

export function computeScore(goal: Goal, actual: number): number {
  switch (goal.uom) {
    case 'numeric_min':
      return Math.min((actual / goal.target) * 100, 150)

    case 'numeric_max':
      if (actual === 0) return 150
      return Math.min((goal.target / actual) * 100, 150)

    case 'timeline': {
      const today = new Date()
      const deadline = new Date(goal.targetDate!)
      const diffDays = Math.floor(
        (today.getTime() - deadline.getTime()) / 86400000,
      )
      if (diffDays <= 0) return 100
      return Math.max(0, 100 - diffDays * 5)
    }

    case 'zero':
      return actual === 0 ? 100 : 0

    default:
      return 0
  }
}

export function computeWeightedScore(goals: Goal[]): number {
  return goals.reduce((sum, goal) => {
    const latestActual = goal.quarterlyActuals.at(-1)?.actual ?? 0
    const score = computeScore(goal, latestActual)
    return sum + (score * goal.weightage) / 100
  }, 0)
}

export function validateGoalSheet(goals: Goal[]): string[] {
  const errors: string[] = []
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0)
  if (totalWeight !== 100)
    errors.push(
      `Total weightage is ${totalWeight}%. Must be exactly 100%.`,
    )
  if (goals.length > 8) errors.push('Maximum 8 goals allowed.')
  goals.forEach((g) => {
    if (g.weightage < 10)
      errors.push(`"${g.title}" has weightage below 10%.`)
  })
  return errors
}

export function scoreColor(pct: number): string {
  if (pct >= 80) return '#1D9E75'
  if (pct >= 50) return '#F59E0B'
  return '#E24B4A'
}

export function goalStatusFromScore(pct: number): import('../types').GoalStatus {
  if (pct >= 100) return 'completed'
  if (pct >= 80) return 'on_track'
  if (pct >= 50) return 'on_track'
  return 'at_risk'
}
