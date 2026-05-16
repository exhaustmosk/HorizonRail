import { useOrgStore } from '../../store/orgStore'

export default function CheckInCalendar() {
  const periods = useOrgStore((s) => s.checkInPeriods)

  return (
    <div className="rounded-xl border border-purple bg-bg-card p-4 glow-purple-sm">
      <h3 className="mb-4 font-heading text-sm font-bold">Check-in periods</h3>
      <div className="relative space-y-0">
        {periods.map((p, i) => (
          <div key={p.quarter} className="relative flex gap-3 pb-6 last:pb-0">
            {i < periods.length - 1 && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-[var(--border-subtle)]" />
            )}
            <div
              className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                p.isActive
                  ? 'border-accent-violet bg-accent-violet shadow-[0_0_8px_#6C63FF]'
                  : 'border-[var(--text-muted)] bg-bg-elevated'
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${p.isActive ? 'text-accent-violet' : ''}`}
              >
                {p.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {p.openDate.toLocaleDateString()} –{' '}
                {p.closeDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
