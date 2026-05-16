import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { Goal, UoMType } from '../../types'
import { THRUST_AREAS, MIN_WEIGHTAGE, MAX_GOALS } from '../../lib/constants'
import Modal, { ModalActions } from '../ui/Modal'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSave: (goal: Partial<Goal>) => void
  initial?: Goal
  remainingWeight: number
  goalCount: number
}

export default function GoalForm({
  open,
  onClose,
  onSave,
  initial,
  remainingWeight,
  goalCount,
}: GoalFormProps) {
  const locked = initial?.isAdminPushed ?? false
  const [thrustArea, setThrustArea] = useState(initial?.thrustArea ?? THRUST_AREAS[0])
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [uom, setUom] = useState<UoMType>(initial?.uom ?? 'numeric_min')
  const [target, setTarget] = useState(String(initial?.target ?? ''))
  const [targetDate, setTargetDate] = useState(
    initial?.targetDate
      ? new Date(initial.targetDate).toISOString().slice(0, 10)
      : '',
  )
  const [weightage, setWeightage] = useState(String(initial?.weightage ?? MIN_WEIGHTAGE))

  const handleSave = () => {
    onSave({
      thrustArea,
      title,
      description,
      uom,
      target: Number(target),
      targetDate: uom === 'timeline' && targetDate ? new Date(targetDate) : undefined,
      weightage: Number(weightage),
    })
    onClose()
  }

  const canAdd = goalCount < MAX_GOALS

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Goal' : 'Add Goal'}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={handleSave}
          confirmDisabled={!canAdd && !initial}
        />
      }
    >
      {!canAdd && !initial && (
        <p className="mb-3 text-accent-amber text-sm">Maximum {MAX_GOALS} goals reached.</p>
      )}
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs text-[var(--text-secondary)]">Thrust Area</span>
          <select
            value={thrustArea}
            onChange={(e) => setThrustArea(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          >
            {THRUST_AREAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            Title {locked && <Lock size={12} />}
          </span>
          <input
            disabled={locked}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-xs text-[var(--text-secondary)]">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          />
        </label>

        <fieldset>
          <legend className="text-xs text-[var(--text-secondary)]">Unit of Measure</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {(['numeric_min', 'numeric_max', 'timeline', 'zero'] as UoMType[]).map(
              (u) => (
                <label key={u} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={uom === u}
                    onChange={() => setUom(u)}
                    disabled={locked}
                  />
                  {u.replace('_', ' ')}
                </label>
              ),
            )}
          </div>
        </fieldset>

        {uom === 'timeline' ? (
          <label className="block">
            <span className="text-xs text-[var(--text-secondary)]">Target Date</span>
            <input
              type="date"
              disabled={locked}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
        ) : (
          <label className="block">
            <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              Target {locked && <Lock size={12} />}
            </span>
            <input
              type="number"
              disabled={locked}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
        )}

        <label className="block">
          <span className="text-xs text-[var(--text-secondary)]">
            Weightage (min {MIN_WEIGHTAGE}%) — {remainingWeight}% remaining
          </span>
          <input
            type="number"
            min={MIN_WEIGHTAGE}
            max={100}
            value={weightage}
            onChange={(e) => setWeightage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          />
        </label>
      </div>
    </Modal>
  )
}
