import { useEffect, useState } from 'react'
import type { Goal } from '../../types'
import type { CheckInPeriod } from '../../types'
import { isCheckInQuarter } from '../../lib/checkInSchedule'
import Modal, { ModalActions } from '../ui/Modal'

export interface CheckInCommentDraft {
  summary: string
  strengths: string
  blockers: string
  nextSteps: string
}

interface ManagerCheckInModalProps {
  open: boolean
  goal: Goal | null
  employeeName: string
  activeQuarter?: CheckInPeriod
  onClose: () => void
  onSave: (draft: CheckInCommentDraft) => void
}

export default function ManagerCheckInModal({
  open,
  goal,
  employeeName,
  activeQuarter,
  onClose,
  onSave,
}: ManagerCheckInModalProps) {
  const quarter =
    activeQuarter && isCheckInQuarter(activeQuarter.quarter)
      ? activeQuarter.quarter
      : 'Q1'
  const record = goal?.quarterlyActuals.find((a) => a.quarter === quarter)
  const existing = record?.checkInComment

  const [summary, setSummary] = useState('')
  const [strengths, setStrengths] = useState('')
  const [blockers, setBlockers] = useState('')
  const [nextSteps, setNextSteps] = useState('')

  useEffect(() => {
    if (!open || !goal) return
    setSummary(existing?.summary ?? record?.managerComment ?? '')
    setStrengths(existing?.strengths ?? '')
    setBlockers(existing?.blockers ?? '')
    setNextSteps(existing?.nextSteps ?? '')
  }, [open, goal?.id, quarter])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Check-in discussion — ${goal?.title ?? ''}`}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => {
            if (!summary.trim()) {
              window.alert('Please add a discussion summary.')
              return
            }
            onSave({ summary, strengths, blockers, nextSteps })
          }}
          confirmLabel="Save check-in comment"
        />
      }
    >
      {goal && (
        <div className="space-y-4">
           <p className="text-xs text-[var(--text-secondary)]">
            {employeeName} · {quarter} · Planned{' '}
            {goal.uom === 'timeline' && record?.planned
              ? new Date(record.planned).toLocaleDateString()
              : record?.planned ?? '—'}{' '}
            vs actual{' '}
            {goal.uom === 'timeline' && record?.actual
              ? new Date(record.actual).toLocaleDateString()
              : record?.actual ?? '—'}
            {record?.status && (
              <span className="ml-2 capitalize">({record.status.replace('_', ' ')})</span>
            )}
          </p>
          <label className="block text-xs">
            <span className="font-medium text-[var(--text-primary)]">
              Discussion summary *
            </span>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summarize the check-in conversation and agreed outcomes…"
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-[var(--text-secondary)]">Strengths / wins</span>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-[var(--text-secondary)]">Blockers / risks</span>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-[var(--text-secondary)]">Next steps</span>
            <textarea
              rows={2}
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
            />
          </label>
        </div>
      )}
    </Modal>
  )
}
