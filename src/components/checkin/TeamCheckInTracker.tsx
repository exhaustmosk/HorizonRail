import type { Employee } from '../../types'
import type { CheckInPeriod } from '../../types'
import { isCheckInQuarter } from '../../lib/checkInSchedule'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'

interface TeamCheckInTrackerProps {
  reports: Employee[]
  period: CheckInPeriod | undefined
}

export default function TeamCheckInTracker({ reports, period }: TeamCheckInTrackerProps) {
  const quarter =
    period && isCheckInQuarter(period.quarter) ? period.quarter : null

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <th className="p-3">Employee</th>
            <th className="p-3">Goals</th>
            <th className="p-3">
              {quarter ? `${quarter} submitted` : 'Check-in status'}
            </th>
            <th className="p-3">Completion</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((emp) => {
            const total = emp.goals.length
            const submitted = quarter
              ? emp.goals.filter((g) =>
                  g.quarterlyActuals.some((a) => a.quarter === quarter),
                ).length
              : emp.goals.filter((g) => g.quarterlyActuals.length > 0).length
            const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
            const done = total > 0 && submitted === total

            return (
              <tr
                key={emp.id}
                className="border-b border-[var(--border-subtle)] last:border-0"
              >
                <td className="p-3 font-medium">{emp.name}</td>
                <td className="p-3">{total}</td>
                <td className="p-3">
                  <Badge variant={done ? 'success' : submitted > 0 ? 'warning' : 'default'}>
                    {submitted}/{total}
                  </Badge>
                </td>
                <td className="min-w-[140px] p-3">
                  <ProgressBar value={pct} showLabel />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
