import type { CheckInPeriod, CyclePhaseId, CycleQuotaPolicy } from '../types'

export type PeriodWindowStatus = 'upcoming' | 'open' | 'closed'

export function getPeriodWindowStatus(
  period: CheckInPeriod,
  now = new Date(),
): PeriodWindowStatus {
  const t = now.getTime()
  if (t < period.openDate.getTime()) return 'upcoming'
  if (t > period.closeDate.getTime()) return 'closed'
  return 'open'
}

export function resolveActivePeriod(
  periods: CheckInPeriod[],
  now = new Date(),
  forcedId?: CyclePhaseId | null,
): CheckInPeriod | undefined {
  if (forcedId) {
    const forced = periods.find((p) => p.quarter === forcedId)
    if (forced) return forced
  }
  return periods.find((p) => getPeriodWindowStatus(p, now) === 'open')
}

export function msUntil(date: Date, now = new Date()): number {
  return Math.max(0, date.getTime() - now.getTime())
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000)
}

export function isCheckInQuarter(
  id: CyclePhaseId,
): id is 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  return id === 'Q1' || id === 'Q2' || id === 'Q3' || id === 'Q4'
}

export function canLogAchievement(
  period: CheckInPeriod | undefined,
  policy: CycleQuotaPolicy,
  now = new Date(),
): boolean {
  if (!period) return false
  if (!isCheckInQuarter(period.quarter) && period.quarter !== 'goal_setting') {
    return false
  }
  if (period.quarter === 'goal_setting') return false
  const status = getPeriodWindowStatus(period, now)
  if (status === 'open') return true
  return policy.allowLateSubmissions && status === 'closed'
}

export function canEditGoals(
  period: CheckInPeriod | undefined,
  now = new Date(),
): boolean {
  if (!period || period.quarter !== 'goal_setting') return false
  return getPeriodWindowStatus(period, now) === 'open'
}

export const PHASE_TABLE: Array<{
  id: CyclePhaseId
  label: string
  windowLabel: string
  action: string
}> = [
  {
    id: 'goal_setting',
    label: 'Phase 1 — Goal Setting',
    windowLabel: '1st May',
    action: 'Goal Creation, Submission & Approval',
  },
  {
    id: 'Q1',
    label: 'Q1 Check-in',
    windowLabel: 'July',
    action: 'Progress Update — Planned vs. Actual',
  },
  {
    id: 'Q2',
    label: 'Q2 Check-in',
    windowLabel: 'October',
    action: 'Progress Update — Planned vs. Actual',
  },
  {
    id: 'Q3',
    label: 'Q3 Check-in',
    windowLabel: 'January',
    action: 'Progress Update — Planned vs. Actual',
  },
  {
    id: 'Q4',
    label: 'Q4 / Annual',
    windowLabel: 'March / April',
    action: 'Final Achievement Capture',
  },
]
