import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { CheckInPeriod, Employee, Goal } from '../../types'
import { computeScore } from '../../lib/scoreEngine'
import { isCheckInQuarter } from '../../lib/checkInSchedule'
import { useAuthStore } from '../../store/authStore'
import { useGoalStore } from '../../store/goalStore'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import ManagerCheckInModal, { type CheckInCommentDraft } from './ManagerCheckInModal'

interface CheckInPanelProps {
  employee: Employee
  activeQuarter?: CheckInPeriod
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export default function CheckInPanel({ employee, activeQuarter }: CheckInPanelProps) {
  const user = useAuthStore((s) => s.user)
  const saveManagerCheckInComment = useGoalStore((s) => s.saveManagerCheckInComment)
  const highlightQ =
    activeQuarter && isCheckInQuarter(activeQuarter.quarter)
      ? activeQuarter.quarter
      : null
  const [commentGoal, setCommentGoal] = useState<Goal | null>(null)

  const cell = (goal: Goal, q: (typeof quarters)[number]) => {
    const rec = goal.quarterlyActuals.find((a) => a.quarter === q)
    if (!rec) return '—'
    if (goal.uom === 'timeline') {
      return (
        <span className="block text-xs">
          <span className="font-medium">
            {rec.actual ? new Date(rec.actual).toLocaleDateString() : '—'}
          </span>
          <span className="text-[var(--text-muted)]">
            {' '}
            / {rec.planned ? new Date(rec.planned).toLocaleDateString() : '—'}
          </span>
        </span>
      )
    }
    return (
      <span className="block">
        <span className="font-medium">{rec.actual}</span>
        <span className="text-[var(--text-muted)]"> / {rec.planned}</span>
      </span>
    )
  }

  const handleSaveComment = (draft: CheckInCommentDraft) => {
    if (!commentGoal || !user || !highlightQ) return
    saveManagerCheckInComment(employee.id, commentGoal.id, highlightQ, {
      ...draft,
      managerId: user.id,
      managerName: user.name,
    })
    setCommentGoal(null)
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
        {highlightQ && (
          <div className="border-b border-[var(--border-subtle)] px-3 py-2">
            <Badge variant="success">Active: {activeQuarter?.label}</Badge>
            <span className="ml-2 text-xs text-[var(--text-secondary)]">
              Planned vs. actual · structured check-in comments
            </span>
          </div>
        )}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <th className="p-3">Goal</th>
              <th className="p-3">Target</th>
              {quarters.map((q) => (
                <th
                  key={q}
                  className={`p-3 ${highlightQ === q ? 'text-accent-violet' : ''}`}
                >
                  {q}
                  <span className="block text-[10px] font-normal opacity-70">
                    Actual / Planned
                  </span>
                </th>
              ))}
              <th className="p-3">Status</th>
              <th className="p-3">Score</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {employee.goals.map((goal) => {
              const rec = highlightQ
                ? goal.quarterlyActuals.find((a) => a.quarter === highlightQ)
                : goal.quarterlyActuals.at(-1)
              const actual = rec?.actual ?? 0
              const score = Math.round(computeScore(goal, actual))
              const hasComment = highlightQ
                ? !!goal.quarterlyActuals.find((a) => a.quarter === highlightQ)
                    ?.checkInComment
                : false

              return (
                <tr
                  key={goal.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="p-3 font-medium">{goal.title}</td>
                  <td className="p-3">
                    {goal.uom === 'timeline'
                      ? goal.targetDate
                        ? new Date(goal.targetDate).toLocaleDateString()
                        : '—'
                      : goal.target}
                  </td>
                  {quarters.map((q) => (
                    <td key={q} className="p-3">
                      {cell(goal, q)}
                    </td>
                  ))}
                  <td className="p-3 capitalize">
                    {rec?.status?.replace('_', ' ') ?? '—'}
                  </td>
                  <td className="p-3">{score}%</td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant={hasComment ? 'secondary' : 'ghost'}
                      onClick={() => setCommentGoal(goal)}
                      disabled={!highlightQ}
                      title={
                        highlightQ
                          ? 'Document check-in discussion'
                          : 'Open during an active check-in window'
                      }
                    >
                      <MessageSquare size={14} className="mr-1 inline" />
                      {hasComment ? 'Edit comment' : 'Check-in comment'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ManagerCheckInModal
        open={!!commentGoal}
        goal={commentGoal}
        employeeName={employee.name}
        activeQuarter={activeQuarter}
        onClose={() => setCommentGoal(null)}
        onSave={handleSaveComment}
      />
    </>
  )
}
