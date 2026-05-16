import { useState } from 'react'
import type { Employee, Goal } from '../../types'
import { computeScore } from '../../lib/scoreEngine'
import { useGoalStore } from '../../store/goalStore'
import Button from '../ui/Button'
import Modal, { ModalActions } from '../ui/Modal'

interface CheckInPanelProps {
  employee: Employee
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export default function CheckInPanel({ employee }: CheckInPanelProps) {
  const updateGoal = useGoalStore((s) => s.updateGoal)
  const [commentGoal, setCommentGoal] = useState<Goal | null>(null)
  const [comment, setComment] = useState('')

  const getActual = (goal: Goal, q: typeof quarters[number]) =>
    goal.quarterlyActuals.find((a) => a.quarter === q)?.actual ?? '—'

  const saveComment = () => {
    if (!commentGoal) return
    const q1 = commentGoal.quarterlyActuals.find((a) => a.quarter === 'Q1')
    if (q1) {
      const updated = commentGoal.quarterlyActuals.map((a) =>
        a.quarter === 'Q1' ? { ...a, managerComment: comment } : a,
      )
      updateGoal(employee.id, commentGoal.id, { quarterlyActuals: updated })
    }
    setCommentGoal(null)
    setComment('')
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <th className="p-3">Goal</th>
            <th className="p-3">Target</th>
            {quarters.map((q) => (
              <th key={q} className="p-3">
                {q}
              </th>
            ))}
            <th className="p-3">Score</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {employee.goals.map((goal) => {
            const actual = goal.quarterlyActuals.at(-1)?.actual ?? 0
            const score = Math.round(computeScore(goal, actual))
            return (
              <tr
                key={goal.id}
                className="border-b border-[var(--border-subtle)] last:border-0"
              >
                <td className="p-3 font-medium">{goal.title}</td>
                <td className="p-3">{goal.target}</td>
                {quarters.map((q) => (
                  <td key={q} className="p-3">
                    {getActual(goal, q)}
                  </td>
                ))}
                <td className="p-3">{score}%</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCommentGoal(goal)
                      setComment(
                        goal.quarterlyActuals.find((a) => a.quarter === 'Q1')
                          ?.managerComment ?? '',
                      )
                    }}
                  >
                    Add comment
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Modal
        open={!!commentGoal}
        onClose={() => setCommentGoal(null)}
        title="Manager comment"
        footer={
          <ModalActions onCancel={() => setCommentGoal(null)} onConfirm={saveComment} />
        }
      >
        <textarea
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </div>
  )
}
