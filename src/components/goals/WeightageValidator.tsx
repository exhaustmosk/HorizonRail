import { validateGoalSheet } from '../../lib/scoreEngine'
import type { Goal } from '../../types'

interface WeightageValidatorProps {
  goals: Goal[]
}

export default function WeightageValidator({ goals }: WeightageValidatorProps) {
  const errors = validateGoalSheet(goals)
  const total = goals.reduce((s, g) => s + g.weightage, 0)
  const ok = errors.length === 0 && total === 100

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        ok
          ? 'border-accent-teal/40 bg-accent-teal/10 text-accent-teal'
          : 'border-accent-red/40 bg-accent-red/10 text-accent-red'
      }`}
    >
      {ok ? (
        <p>Goal sheet is valid — total weightage is 100%.</p>
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
