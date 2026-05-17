import { useState } from 'react'
import type { Goal, GoalStatus } from '../../types'
import type { CheckInPeriod } from '../../types'
import { CHECK_IN_STATUS_OPTIONS } from '../../lib/constants'
import { computeScore } from '../../lib/scoreEngine'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import Badge from '../ui/Badge'

const statusVariant = {
  not_started: 'default' as const,
  on_track: 'success' as const,
  completed: 'success' as const,
  at_risk: 'danger' as const,
}

interface QuarterlyUpdateFormProps {
  goals: Goal[]
  period: CheckInPeriod
  onSubmit: (
    updates: Array<{
      goalId: string
      planned: number
      actual: number
      status: GoalStatus
      narrative: string
    }>,
  ) => void
}

export default function QuarterlyUpdateForm({
  goals,
  period,
  onSubmit,
}: QuarterlyUpdateFormProps) {
  const quarter = period.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4'
  const [rows, setRows] = useState(() =>
    goals.map((g) => {
      const existing = g.quarterlyActuals.find((a) => a.quarter === quarter)
      const status =
        existing?.status === 'at_risk' ? 'on_track' : (existing?.status ?? 'not_started')
      return {
        goalId: g.id,
        title: g.title,
        target: g.target,
        planned: existing?.planned ?? g.target,
        actual: existing?.actual ?? 0,
        status: status as 'not_started' | 'on_track' | 'completed',
        narrative: existing?.employeeNotes ?? '',
      }
    }),
  )

  const patch = (
    goalId: string,
    field: 'planned' | 'actual' | 'narrative' | 'status',
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.goalId === goalId
          ? {
              ...r,
              [field]:
                field === 'narrative'
                  ? value
                  : field === 'status'
                    ? (value as typeof r.status)
                    : Number(value),
            }
          : r,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        {period.label} · Log planned vs. actual achievement and select status per goal.
      </p>
      {rows.map((row) => {
        const goal = goals.find((g) => g.id === row.goalId)!
        const score = Math.round(computeScore(goal, row.actual))
        const variance = row.actual - row.planned
        return (
          <div
            key={row.goalId}
            className="rounded-xl border border-[var(--border-subtle)] bg-bg-elevated/50 p-4"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Annual target: {row.target}
                </p>
              </div>
              <Badge variant={statusVariant[row.status]}>{row.status.replace('_', ' ')}</Badge>
            </div>
            <div className="mb-3">
              <ProgressBar value={score} showLabel />
            </div>
             <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs">
                <span className="text-[var(--text-secondary)]">Planned ({quarter})</span>
                {goal.uom === 'timeline' ? (
                  <input
                    type="date"
                    value={row.planned ? new Date(row.planned).toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      const ms = e.target.value ? new Date(e.target.value).getTime() : 0
                      patch(row.goalId, 'planned', String(ms))
                    }}
                    className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                ) : (
                  <input
                    type="number"
                    value={row.planned}
                    onChange={(e) => patch(row.goalId, 'planned', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                )}
              </label>
              <label className="block text-xs">
                <span className="text-[var(--text-secondary)]">
                  {goal.uom === 'timeline' ? 'Completion date' : 'Actual achievement'}
                </span>
                {goal.uom === 'timeline' ? (
                  <input
                    type="date"
                    value={row.actual ? new Date(row.actual).toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      const ms = e.target.value ? new Date(e.target.value).getTime() : 0
                      patch(row.goalId, 'actual', String(ms))
                    }}
                    className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                ) : (
                  <input
                    type="number"
                    value={row.actual}
                    onChange={(e) => patch(row.goalId, 'actual', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                )}
              </label>
              <label className="block text-xs">
                <span className="text-[var(--text-secondary)]">Status</span>
                <select
                  value={row.status}
                  onChange={(e) => patch(row.goalId, 'status', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm"
                >
                  {CHECK_IN_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p
              className={`mt-2 text-xs font-medium ${
                variance >= 0 ? 'text-accent-teal' : 'text-accent-amber'
              }`}
            >
              Variance: {variance >= 0 ? '+' : ''}
              {variance.toFixed(1)} vs plan
            </p>
            <label className="mt-3 block text-xs">
              <span className="text-[var(--text-secondary)]">Your progress notes</span>
              <textarea
                rows={2}
                value={row.narrative}
                onChange={(e) => patch(row.goalId, 'narrative', e.target.value)}
                placeholder="What moved the needle? Blockers?"
                className="mt-1 w-full rounded-lg border border-purple bg-bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>
        )
      })}
      <Button
        className="w-full sm:w-auto"
        onClick={() =>
          onSubmit(
            rows.map((r) => ({
              goalId: r.goalId,
              planned: r.planned,
              actual: r.actual,
              status: r.status,
              narrative: r.narrative,
            })),
          )
        }
      >
        Submit {quarter} check-in
      </Button>
    </div>
  )
}
