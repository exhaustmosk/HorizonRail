import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Goal } from '../../types'
import WeightageValidator from './WeightageValidator'

const COLORS = ['#6C63FF', '#1D9E75', '#378ADD', '#F59E0B', '#E24B4A', '#888780']

interface GoalSheetProps {
  goals: Goal[]
}

export default function GoalSheet({ goals }: GoalSheetProps) {
  const data = goals.map((g, i) => ({
    name: g.title.slice(0, 20),
    value: g.weightage,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-4">
        <h3 className="mb-2 font-heading text-sm font-bold">Weightage distribution</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-[var(--text-secondary)]">
          Target: 100% · Current:{' '}
          {goals.reduce((s, g) => s + g.weightage, 0)}%
        </p>
      </div>
      <WeightageValidator goals={goals} />
    </div>
  )
}
