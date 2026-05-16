import { useState } from 'react'
import { useOrgStore } from '../store/orgStore'
import { useGoalStore } from '../store/goalStore'
import { THRUST_AREAS } from '../lib/constants'
import type { UoMType } from '../types'
import Topbar from '../components/layout/Topbar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

type Tab = 'org' | 'kpi' | 'cycle' | 'audit'

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('org')
  const employees = useOrgStore((s) => s.employees)
  const checkInPeriods = useOrgStore((s) => s.checkInPeriods)
  const updateCheckInPeriod = useOrgStore((s) => s.updateCheckInPeriod)
  const pushKPI = useGoalStore((s) => s.pushKPI)
  const lockAllApproved = useGoalStore((s) => s.lockAllApproved)
  const unlockGoal = useGoalStore((s) => s.unlockGoal)
  const auditLog = useOrgStore((s) => s.getAuditLog)

  const [kpiTitle, setKpiTitle] = useState('')
  const [kpiThrust, setKpiThrust] = useState<string>(THRUST_AREAS[0])
  const [kpiUom, setKpiUom] = useState<UoMType>('numeric_min')
  const [kpiTarget, setKpiTarget] = useState('100')
  const [selectedEmps, setSelectedEmps] = useState<string[]>([])
  const [unlockEmp, setUnlockEmp] = useState('')
  const [unlockGoalId, setUnlockGoalId] = useState('')
  const [unlockReason, setUnlockReason] = useState('')

  const empList = employees.filter((e) => e.role === 'employee')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'org', label: 'Org Management' },
    { id: 'kpi', label: 'Push KPI' },
    { id: 'cycle', label: 'Cycle Config' },
    { id: 'audit', label: 'Audit Log' },
  ]

  return (
    <>
      <Topbar title="Admin Panel" />
      <div className="p-6">
        <div className="mb-6 flex gap-2 border-b border-[var(--border-subtle)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-accent-violet text-accent-violet'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'org' && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="p-3">Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Manager</th>
                  <th className="p-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <td className="p-3">{e.name}</td>
                    <td className="p-3">{e.department}</td>
                    <td className="p-3">
                      {employees.find((m) => m.id === e.managerId)?.name ?? '—'}
                    </td>
                    <td className="p-3 capitalize">{e.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'kpi' && (
          <Card className="max-w-xl space-y-4">
            <h3 className="font-heading font-bold">Push KPI to employees</h3>
            <input
              placeholder="Title"
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
              className="w-full rounded-lg border border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
            />
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {empList.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
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
                  {e.name}
                </label>
              ))}
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
              disabled={!kpiTitle || selectedEmps.length === 0}
            >
              Push KPI
            </Button>
          </Card>
        )}

        {tab === 'cycle' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="p-3">Period</th>
                    <th className="p-3">Open</th>
                    <th className="p-3">Close</th>
                    <th className="p-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {checkInPeriods.map((p) => (
                    <tr
                      key={p.quarter}
                      className="border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">
                        <input
                          type="date"
                          defaultValue={p.openDate.toISOString().slice(0, 10)}
                          onChange={(e) =>
                            updateCheckInPeriod(p.quarter, {
                              openDate: new Date(e.target.value),
                            })
                          }
                          className="rounded border border-[var(--border-subtle)] bg-bg-elevated px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          defaultValue={p.closeDate.toISOString().slice(0, 10)}
                          onChange={(e) =>
                            updateCheckInPeriod(p.quarter, {
                              closeDate: new Date(e.target.value),
                            })
                          }
                          className="rounded border border-[var(--border-subtle)] bg-bg-elevated px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-3">{p.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={lockAllApproved}>Lock all approved goals</Button>
            <Card className="max-w-md space-y-3">
              <h3 className="font-heading text-sm font-bold">Unlock goal</h3>
              <select
                value={unlockEmp}
                onChange={(e) => setUnlockEmp(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
              >
                <option value="">Select employee</option>
                {empList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <select
                value={unlockGoalId}
                onChange={(e) => setUnlockGoalId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
              >
                <option value="">Select goal</option>
                {empList
                  .find((e) => e.id === unlockEmp)
                  ?.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
              <input
                placeholder="Reason"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (unlockEmp && unlockGoalId)
                    unlockGoal(unlockEmp, unlockGoalId, unlockReason)
                }}
              >
                Unlock
              </Button>
            </Card>
          </div>
        )}

        {tab === 'audit' && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="p-3">Time</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Change</th>
                </tr>
              </thead>
              <tbody>
                {auditLog().slice(0, 20).map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <td className="p-3 text-xs">
                      {a.timestamp.toLocaleString()}
                    </td>
                    <td className="p-3">{a.actorName}</td>
                    <td className="p-3">{a.action}</td>
                    <td className="p-3">{a.targetLabel}</td>
                    <td className="p-3 text-xs text-[var(--text-secondary)]">
                      {a.oldValue} → {a.newValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
