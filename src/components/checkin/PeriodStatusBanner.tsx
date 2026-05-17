import { AlertCircle, CalendarClock, CheckCircle2, Lock } from 'lucide-react'
import type { CheckInPeriod, CycleQuotaPolicy } from '../../types'
import {
  formatCountdown,
  getPeriodWindowStatus,
  isCheckInQuarter,
  msUntil,
} from '../../lib/checkInSchedule'
import Badge from '../ui/Badge'

interface PeriodStatusBannerProps {
  period: CheckInPeriod | undefined
  policy: CycleQuotaPolicy
  now: Date
}

export default function PeriodStatusBanner({
  period,
  policy,
  now,
}: PeriodStatusBannerProps) {
  if (!period) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-bg-elevated/80 px-4 py-3">
        <Lock size={18} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
        <div>
          <p className="font-medium">No active cycle window</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Achievement capture is closed. Check the schedule for the next opening.
          </p>
        </div>
      </div>
    )
  }

  const status = getPeriodWindowStatus(period, now)
  const closesIn = msUntil(period.closeDate, now)
  const opensIn = msUntil(period.openDate, now)

  const isCheckIn = isCheckInQuarter(period.quarter)

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        status === 'open'
          ? 'border-accent-violet/40 bg-accent-violet/10'
          : status === 'upcoming'
            ? 'border-accent-amber/30 bg-accent-amber/10'
            : 'border-[var(--border-subtle)] bg-bg-elevated/80'
      }`}
    >
      <div className="flex items-start gap-3">
        {status === 'open' ? (
          <CheckCircle2 size={20} className="shrink-0 text-accent-teal" />
        ) : status === 'upcoming' ? (
          <CalendarClock size={20} className="shrink-0 text-accent-amber" />
        ) : (
          <AlertCircle size={20} className="shrink-0 text-[var(--text-muted)]" />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{period.label}</p>
            <Badge
              variant={
                status === 'open' ? 'success' : status === 'upcoming' ? 'warning' : 'default'
              }
            >
              {status === 'open' ? 'Window open' : status === 'upcoming' ? 'Upcoming' : 'Closed'}
            </Badge>
            {period.enforced && policy.checkInsMandatory && isCheckIn && (
              <Badge variant="danger">Mandatory</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{period.action}</p>
        </div>
      </div>
      <div className="shrink-0 text-right font-mono text-sm">
        {status === 'open' && (
          <p className="text-accent-glow">
            Closes in <span className="font-semibold">{formatCountdown(closesIn)}</span>
          </p>
        )}
        {status === 'upcoming' && (
          <p className="text-accent-amber">
            Opens in <span className="font-semibold">{formatCountdown(opensIn)}</span>
          </p>
        )}
        {status === 'closed' && (
          <p className="text-[var(--text-muted)]">Window ended</p>
        )}
      </div>
    </div>
  )
}
