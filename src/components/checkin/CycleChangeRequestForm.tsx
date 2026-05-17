import { useState } from 'react'
import { Send } from 'lucide-react'
import type { CheckInPeriod, CyclePhaseId, CycleQuotaPolicy } from '../../types'
import { useCycleStore } from '../../store/cycleStore'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface CycleChangeRequestFormProps {
  managerId: string
  managerName: string
  periods: CheckInPeriod[]
  policy: CycleQuotaPolicy
}

type RequestKind =
  | 'extend_period'
  | 'shift_period'
  | 'relax_enforcement'
  | 'increase_max_goals'
  | 'allow_late'

export default function CycleChangeRequestForm({
  managerId,
  managerName,
  periods,
  policy,
}: CycleChangeRequestFormProps) {
  const submitChangeRequest = useCycleStore((s) => s.submitChangeRequest)
  const [kind, setKind] = useState<RequestKind>('extend_period')
  const [periodId, setPeriodId] = useState<CyclePhaseId>('goal_setting')
  const [reason, setReason] = useState('')
  const [extraDays, setExtraDays] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (reason.trim().length < 20) {
      window.alert('Please provide a detailed reason (at least 20 characters).')
      return
    }

    const period = periods.find((p) => p.quarter === periodId)
    if (!period) return

    let summary = ''
    let periodPatch: import('../../types').CycleChangeRequest['periodPatch']
    let policyPatch: Partial<CycleQuotaPolicy> | undefined

    switch (kind) {
      case 'extend_period': {
        const close = new Date(period.closeDate)
        close.setDate(close.getDate() + extraDays)
        periodPatch = { closeDate: close }
        summary = `Extend ${period.label} close date by ${extraDays} days`
        break
      }
      case 'shift_period': {
        const open = new Date(period.openDate)
        const close = new Date(period.closeDate)
        open.setDate(open.getDate() + extraDays)
        close.setDate(close.getDate() + extraDays)
        periodPatch = { openDate: open, closeDate: close }
        summary = `Shift ${period.label} window by ${extraDays} days`
        break
      }
      case 'relax_enforcement':
        periodPatch = { enforced: false }
        summary = `Pause enforcement for ${period.label}`
        break
      case 'increase_max_goals':
        policyPatch = { maxGoals: policy.maxGoals + 1 }
        summary = `Increase max goals from ${policy.maxGoals} to ${policy.maxGoals + 1}`
        break
      case 'allow_late':
        policyPatch = { allowLateSubmissions: true, lateSubmissionGraceDays: extraDays }
        summary = `Enable late submissions (${extraDays}-day grace)`
        break
    }

    submitChangeRequest({
      requestedById: managerId,
      requestedByName: managerName,
      reason: reason.trim(),
      summary,
      targetPeriod: kind === 'increase_max_goals' || kind === 'allow_late' ? undefined : periodId,
      periodPatch,
      policyPatch,
    })
    setSubmitted(true)
    setReason('')
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-heading text-sm font-bold">Request cycle change</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Submit to admin with a clear business reason. Approved changes apply org-wide.
        </p>
      </div>

      <label className="block text-xs">
        <span className="text-[var(--text-secondary)]">Request type</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RequestKind)}
          className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
        >
          <option value="extend_period">Extend period close date</option>
          <option value="shift_period">Shift entire window</option>
          <option value="relax_enforcement">Pause enforcement for a period</option>
          <option value="increase_max_goals">Increase max goals quota</option>
          <option value="allow_late">Allow late check-in submissions</option>
        </select>
      </label>

      {kind !== 'increase_max_goals' && kind !== 'allow_late' && (
        <label className="block text-xs">
          <span className="text-[var(--text-secondary)]">Target period</span>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value as CyclePhaseId)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          >
            {periods.map((p) => (
              <option key={p.quarter} value={p.quarter}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {(kind === 'extend_period' || kind === 'shift_period' || kind === 'allow_late') && (
        <label className="block text-xs">
          <span className="text-[var(--text-secondary)]">Days</span>
          <input
            type="number"
            min={1}
            max={30}
            value={extraDays}
            onChange={(e) => setExtraDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          />
        </label>
      )}

      <label className="block text-xs">
        <span className="text-[var(--text-secondary)]">Reason for admin *</span>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain impact on your team, compliance risk, or delivery constraints…"
          className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
        />
      </label>

      <Button onClick={handleSubmit} className="gap-2">
        <Send size={14} />
        {submitted ? 'Request sent' : 'Send to admin'}
      </Button>
    </Card>
  )
}
