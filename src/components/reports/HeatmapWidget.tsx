import { scoreColor, computeScore } from '../../lib/scoreEngine'
import type { Employee } from '../../types'
import Tooltip from '../ui/Tooltip'

interface HeatmapWidgetProps {
  employees: Employee[]
}

export default function HeatmapWidget({ employees }: HeatmapWidgetProps) {
  const maxGoals = Math.max(...employees.map((e) => e.goals.length), 1)

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-4">
      <h3 className="mb-4 font-heading text-sm font-bold">Achievement heatmap</h3>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-[var(--text-secondary)]">Employee</th>
            {Array.from({ length: maxGoals }, (_, i) => (
              <th key={i} className="p-2 text-center text-[var(--text-secondary)]">
                G{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees
            .filter((e) => e.role === 'employee')
            .map((emp) => (
              <tr key={emp.id}>
                <td className="p-2 font-medium">{emp.name}</td>
                {Array.from({ length: maxGoals }, (_, i) => {
                  const goal = emp.goals[i]
                  if (!goal)
                    return (
                      <td key={i} className="p-1">
                        <div className="h-8 w-12 rounded bg-[var(--bg-elevated)]" />
                      </td>
                    )
                  const actual = goal.quarterlyActuals.at(-1)?.actual ?? 0
                  const pct = Math.round(computeScore(goal, actual))
                  const color = scoreColor(pct)
                  return (
                    <td key={i} className="p-1">
                      <Tooltip content={`${pct}% · ${goal.title}`}>
                        <div
                          className="flex h-8 w-12 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {pct}
                        </div>
                      </Tooltip>
                    </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
