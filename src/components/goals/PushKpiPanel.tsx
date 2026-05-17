import { useState } from 'react'
import { useGoalStore } from '../../store/goalStore'
import { THRUST_AREAS } from '../../lib/constants'
import type { Employee, UoMType } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface PushKpiPanelProps {
  /** Employees the current user may push KPIs to */
  eligibleEmployees: Employee[]
  title?: string
  description?: string
}

export default function PushKpiPanel({
  eligibleEmployees,
  title = 'Push KPI',
  description,
}: PushKpiPanelProps) {
  const pushKPI = useGoalStore((s) => s.pushKPI)
  const [kpiTitle, setKpiTitle] = useState('')
  const [kpiThrust, setKpiThrust] = useState<string>(THRUST_AREAS[0])
  const [kpiUom, setKpiUom] = useState<UoMType>('numeric_min')
  const [kpiTarget, setKpiTarget] = useState('100')
  const [selectedEmps, setSelectedEmps] = useState<string[]>([])

  const defaultDescription =
    eligibleEmployees.length === 0
      ? 'No team members available to receive KPIs.'
      : `Select team members below (${eligibleEmployees.length} eligible).`

  return (
    <Card className="max-w-xl space-y-4">
      <div>
        <h3 className="font-heading font-bold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description ?? defaultDescription}
        </p>
      </div>

      <input
        placeholder="KPI title"
        value={kpiTitle}
        onChange={(e) => setKpiTitle(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
      />
      <select
        value={kpiThrust}
        onChange={(e) => setKpiThrust(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
      >
        {THRUST_AREAS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        value={kpiUom}
        onChange={(e) => setKpiUom(e.target.value as UoMType)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
      >
        <option value="numeric_min">Numeric min</option>
        <option value="numeric_max">Numeric max</option>
        <option value="zero">Zero</option>
      </select>
      <input
        type="number"
        placeholder="Target"
        value={kpiTarget}
        onChange={(e) => setKpiTarget(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
      />

      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-bg-elevated/50 p-2">
        {eligibleEmployees.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No direct reports</p>
        ) : (
          eligibleEmployees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--bg-glass)]">
              <input
                type="checkbox"
                checked={selectedEmps.includes(e.id)}
                onChange={(ev) =>
                  setSelectedEmps((prev) =>
                    ev.target.checked
                      ? [...prev, e.id]
                      : prev.filter((id) => id !== e.id),
                  )
                }
              />
              <span className="font-medium">{e.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{e.department}</span>
            </label>
          ))
        )}
      </div>

      <Button
        onClick={() => {
          pushKPI(
            {
              title: kpiTitle,
              thrustArea: kpiThrust,
              uom: kpiUom,
              target: Number(kpiTarget),
            },
            selectedEmps,
          )
          setKpiTitle('')
          setSelectedEmps([])
        }}
        disabled={
          !kpiTitle || selectedEmps.length === 0 || eligibleEmployees.length === 0
        }
      >
        Push KPI
      </Button>
    </Card>
  )
}
