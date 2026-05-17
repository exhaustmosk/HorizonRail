import { useOrgStore } from '../../store/orgStore'
import { useCycleStore } from '../../store/cycleStore'
import { useLiveClock } from '../../hooks/useLiveClock'
import {
  formatCountdown,
  getPeriodWindowStatus,
  msUntil,
  resolveActivePeriod,
} from '../../lib/checkInSchedule'
import Badge from '../ui/Badge'

export default function CheckInCalendar() {
  const periods = useOrgStore((s) => s.checkInPeriods)
  const forcedId = useCycleStore((s) => s.adminForcedPeriodId)
  const now = useLiveClock()
  const active = resolveActivePeriod(periods, now, forcedId)

  return (
    <div className="rounded-xl border border-purple bg-bg-card p-4 glow-purple-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-bold">Check-in schedule</h3>
        {active && (
          <span className="animate-pulse">
            <Badge variant="success">Live</Badge>
          </span>
        )}
      </div>
      <div className="relative space-y-0">
        {periods.map((p, i) => {
          const status = getPeriodWindowStatus(p, now)
          const isCurrent = active?.quarter === p.quarter
          const countdown =
            status === 'open'
              ? msUntil(p.closeDate, now)
              : status === 'upcoming'
                ? msUntil(p.openDate, now)
                : 0

          return (
            <div key={p.quarter} className="relative flex gap-3 pb-6 last:pb-0">
              {i < periods.length - 1 && (
                <div className="absolute left-[7px] top-4 h-full w-px bg-[var(--border-subtle)]" />
              )}
              <div
                className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                  isCurrent
                    ? 'border-accent-violet bg-accent-violet shadow-[0_0_8px_#6C63FF]'
                    : status === 'closed'
                      ? 'border-[var(--text-muted)]/50 bg-bg-elevated'
                      : 'border-accent-teal/60 bg-accent-teal/20'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-medium ${isCurrent ? 'text-accent-violet' : ''}`}
                  >
                    {p.label}
                  </p>
                  <Badge
                    variant={
                      status === 'open'
                        ? 'success'
                        : status === 'upcoming'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {status}
                  </Badge>
                  {!p.enforced && <Badge>Not enforced</Badge>}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{p.action}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {p.openDate.toLocaleDateString()} – {p.closeDate.toLocaleDateString()}
                </p>
                {countdown > 0 && (
                  <p className="mt-1 font-mono text-[10px] text-accent-glow">
                    {status === 'open' ? 'Closes' : 'Opens'} in {formatCountdown(countdown)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
