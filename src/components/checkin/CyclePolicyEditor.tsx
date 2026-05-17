import type { CycleQuotaPolicy } from '../../types'
import Card from '../ui/Card'

interface CyclePolicyEditorProps {
  policy: CycleQuotaPolicy
  onChange: (patch: Partial<CycleQuotaPolicy>) => void
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="block text-xs">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
      />
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-bg-elevated/40 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--text-secondary)]">{description}</p>
      </div>
    </label>
  )
}

export default function CyclePolicyEditor({ policy, onChange }: CyclePolicyEditorProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-heading text-sm font-bold">Quota & compulsions</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Controls goal limits and whether check-ins are mandatory for all employees.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumField
          label="Max goals per employee"
          value={policy.maxGoals}
          min={1}
          max={12}
          onChange={(maxGoals) => onChange({ maxGoals })}
        />
        <NumField
          label="Min goals required"
          value={policy.minGoals}
          min={1}
          max={policy.maxGoals}
          onChange={(minGoals) => onChange({ minGoals })}
        />
        <NumField
          label="Min weightage per goal (%)"
          value={policy.minWeightagePerGoal}
          min={5}
          max={50}
          onChange={(minWeightagePerGoal) => onChange({ minWeightagePerGoal })}
        />
        <NumField
          label="Total weightage required (%)"
          value={policy.totalWeightageRequired}
          min={80}
          max={100}
          onChange={(totalWeightageRequired) => onChange({ totalWeightageRequired })}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Mandatory quarterly check-ins"
          description="Employees cannot log achievements outside open windows unless late submissions are allowed."
          checked={policy.checkInsMandatory}
          onChange={(checkInsMandatory) => onChange({ checkInsMandatory })}
        />
        <Toggle
          label="Mandatory goal setting (Phase 1)"
          description="Goal sheet edits and submissions only during the May window."
          checked={policy.goalSettingMandatory}
          onChange={(goalSettingMandatory) => onChange({ goalSettingMandatory })}
        />
        <Toggle
          label="Allow late submissions"
          description="Permit logging for a grace period after a window closes."
          checked={policy.allowLateSubmissions}
          onChange={(allowLateSubmissions) => onChange({ allowLateSubmissions })}
        />
      </div>
      {policy.allowLateSubmissions && (
        <NumField
          label="Late submission grace (days)"
          value={policy.lateSubmissionGraceDays}
          min={1}
          max={30}
          onChange={(lateSubmissionGraceDays) => onChange({ lateSubmissionGraceDays })}
        />
      )}
    </Card>
  )
}
