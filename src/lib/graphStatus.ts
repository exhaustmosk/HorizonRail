import type { Goal } from '../types'
import { computeScore } from './scoreEngine'

/** Plain status colors for graph moons */
export const STATUS_COLORS = {
  untouched: '#94a3b8',
  partial: '#fbbf24',
  complete: '#22c55e',
  error: '#ef4444',
} as const

export type MoonStatus = keyof typeof STATUS_COLORS

export function getGoalMoonStatus(goal: Goal): MoonStatus {
  if (goal.approvalStatus === 'rejected') return 'error'
  const hasActual = goal.quarterlyActuals.length > 0
  if (!hasActual && goal.approvalStatus === 'draft') return 'untouched'

  const actual = goal.quarterlyActuals.at(-1)?.actual ?? 0
  const score = computeScore(goal, actual)
  const qStatus = goal.quarterlyActuals.at(-1)?.status

  if (qStatus === 'at_risk' || score < 40) return 'error'
  if (qStatus === 'completed' || score >= 80) return 'complete'
  if (score >= 40 && score < 80) return 'partial'
  if (!hasActual) return 'untouched'
  return 'partial'
}

export function getTaskMoonStatus(done: boolean, priority: string): MoonStatus {
  if (done) return 'complete'
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'partial'
  return 'untouched'
}

export function statusLabel(s: MoonStatus): string {
  switch (s) {
    case 'complete':
      return 'Completed'
    case 'partial':
      return 'In progress (~50%)'
    case 'error':
      return 'At risk / missed'
    default:
      return 'Not started'
  }
}
