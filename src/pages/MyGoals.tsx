import { useState } from 'react'
import { Trash2, Pencil, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useGoalStore } from '../store/goalStore'
import { validateGoalSheet } from '../lib/scoreEngine'
import { MAX_GOALS } from '../lib/constants'
import type { Goal } from '../types'
import Topbar from '../components/layout/Topbar'
import Button from '../components/ui/Button'
import GoalSheet from '../components/goals/GoalSheet'
import GoalForm from '../components/goals/GoalForm'

export default function MyGoals() {
  const user = useAuthStore((s) => s.user)!
  const employees = useOrgStore((s) => s.employees)
  const addGoal = useGoalStore((s) => s.addGoal)
  const updateGoal = useGoalStore((s) => s.updateGoal)
  const deleteGoal = useGoalStore((s) => s.deleteGoal)
  const submitGoals = useGoalStore((s) => s.submitGoals)
  const distributeWeightageEqually = useGoalStore((s) => s.distributeWeightageEqually)

  const emp = employees.find((e) => e.id === user.id) ?? user
  const goals = emp.goals
  const pendingPushedGoals = goals.filter((g) => g.isAdminPushed && g.weightage === 0)
  const hasPendingPushed = pendingPushedGoals.length > 0
  const errors = validateGoalSheet(goals)
  const [formOpen, setFormOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | undefined>()
  const remaining =
    100 - goals.reduce((s, g) => s + g.weightage, 0) + (editGoal?.weightage ?? 0)

  const handleSave = (partial: Partial<Goal>) => {
    if (editGoal) {
      updateGoal(user.id, editGoal.id, {
        ...partial,
        // Revert to draft if it was submitted so manager has to re-approve
        approvalStatus: editGoal.approvalStatus === 'submitted' ? 'draft' : editGoal.approvalStatus
      })
    } else {
      const goal: Goal = {
        id: `g-${user.id}-${Date.now()}`,
        employeeId: user.id,
        thrustArea: partial.thrustArea ?? '',
        title: partial.title ?? '',
        description: partial.description ?? '',
        uom: partial.uom ?? 'numeric_min',
        target: partial.target ?? 0,
        targetDate: partial.targetDate,
        weightage: partial.weightage ?? 10,
        isAdminPushed: false,
        approvalStatus: 'draft',
        locked: false,
        quarterlyActuals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addGoal(goal)
    }
    setEditGoal(undefined)
  }

  return (
    <>
      <Topbar title="My Goals" subtitle="Goal sheet management" />
      <div className="space-y-6 p-6">
        {hasPendingPushed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border border-accent-amber/40 bg-accent-amber/5 px-5 py-4 text-sm text-[var(--text-primary)] shadow-lg glow-amber-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-amber/20 text-accent-amber animate-pulse">
                ⚠️
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-accent-amber">New Task Assigned Pending Weightage</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Your manager or administrator has pushed {pendingPushedGoals.length} new task(s) to your goal sheet:{' '}
                  <span className="font-semibold text-accent-amber">
                    {pendingPushedGoals.map((g) => `“${g.title}”`).join(', ')}
                  </span>
                  . These tasks currently carry 0% weightage. To make your sheet valid, you must allocate at least 10% weightage to each task inline in the table below and re-balance your other goals so your total weightage is exactly 100%.
                </p>
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => distributeWeightageEqually(user.id)}
                    className="text-accent-amber border-accent-amber/40 hover:bg-accent-amber/10 hover:text-accent-amber"
                  >
                    Auto-Distribute Weightage Equally
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <GoalSheet goals={goals} />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditGoal(undefined)
                setFormOpen(true)
              }}
              disabled={goals.length >= MAX_GOALS}
            >
              <Plus size={16} /> Add goal
            </Button>
            {goals.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => distributeWeightageEqually(user.id)}
                title="Distribute 100% weightage equally among all goals"
              >
                Distribute Weightage Equally
              </Button>
            )}
          </div>
          <Button
            disabled={errors.length > 0}
            onClick={() => submitGoals(user.id)}
          >
            Submit for approval
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <th className="p-3">Thrust area</th>
                <th className="p-3">Title</th>
                <th className="p-3">UoM</th>
                <th className="p-3">Target</th>
                <th className="p-3">Weight</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="p-3">{g.thrustArea}</td>
                  <td className="p-3">{g.title}</td>
                  <td className="p-3 capitalize">{g.uom.replace('_', ' ')}</td>
                  <td className="p-3">
                    {g.uom === 'timeline'
                      ? g.targetDate
                        ? new Date(g.targetDate).toLocaleDateString()
                        : '—'
                      : g.target}
                  </td>
                  <td className="p-3">
                    {g.approvalStatus !== 'approved' || g.isAdminPushed || hasPendingPushed ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={g.weightage}
                        onChange={(e) =>
                          updateGoal(user.id, g.id, {
                            weightage: Number(e.target.value)
                          })
                        }
                        className="w-16 rounded border border-[var(--border-subtle)] bg-bg-elevated px-2 py-1 font-semibold"
                      />
                    ) : (
                      `${g.weightage}%`
                    )}
                  </td>
                  <td className="p-3 capitalize">{g.approvalStatus}</td>
                  <td className="p-3">
                    {g.approvalStatus !== 'approved' && !g.isAdminPushed && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditGoal(g)
                            setFormOpen(true)
                          }}
                          className="rounded p-1 hover:bg-[var(--bg-glass)] text-blue-400"
                          title="Edit Goal"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGoal(user.id, g.id)}
                          className="rounded p-1 hover:bg-accent-red/20 text-accent-red"
                          title="Delete Goal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GoalForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditGoal(undefined)
        }}
        onSave={handleSave}
        initial={editGoal}
        remainingWeight={remaining}
        goalCount={goals.length}
      />
    </>
  )
}
