import { useState } from 'react'
import { useOrgStore } from '../store/orgStore'
import { useCycleStore } from '../store/cycleStore'
import { useGoalStore } from '../store/goalStore'
import { useAuthStore } from '../store/authStore'
import { useLiveClock } from '../hooks/useLiveClock'
import { getPeriodWindowStatus, resolveActivePeriod } from '../lib/checkInSchedule'
import type { CyclePhaseId } from '../types'
import Topbar from '../components/layout/Topbar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PushKpiPanel from '../components/goals/PushKpiPanel'
import CyclePolicyEditor from '../components/checkin/CyclePolicyEditor'
import CycleChangeRequestQueue from '../components/checkin/CycleChangeRequestQueue'
import Badge from '../components/ui/Badge'
import { Check, X as XIcon, UserPlus, Building, Calendar, Mail } from 'lucide-react'

type Tab = 'requests' | 'org' | 'kpi' | 'cycle' | 'audit'

export default function AdminPanel() {
  const admin = useAuthStore((s) => s.user)
  const organizations = useOrgStore((s) => s.organizations)
  const adminOrg = organizations.find((o) => o.adminId === admin?.id)
  const joinRequests = adminOrg?.joinRequests ?? []

  const approveRequest = useOrgStore((s) => s.approveJoinRequest)
  const denyRequest = useOrgStore((s) => s.denyJoinRequest)

  const [tab, setTab] = useState<Tab>(joinRequests.length > 0 ? 'requests' : 'cycle')
  const employees = useOrgStore((s) => s.employees)
  const checkInPeriods = useOrgStore((s) => s.checkInPeriods)
  const updateCheckInPeriod = useOrgStore((s) => s.updateCheckInPeriod)
  const policy = useCycleStore((s) => s.policy)
  const updatePolicy = useCycleStore((s) => s.updatePolicy)
  const adminForcedPeriodId = useCycleStore((s) => s.adminForcedPeriodId)
  const setAdminForcedPeriod = useCycleStore((s) => s.setAdminForcedPeriod)
  const pendingCount = useCycleStore((s) =>
    s.changeRequests.filter((r) => r.status === 'pending').length,
  )
  const lockAllApproved = useGoalStore((s) => s.lockAllApproved)
  const unlockGoal = useGoalStore((s) => s.unlockGoal)
  const auditLog = useOrgStore((s) => s.getAuditLog)
  const now = useLiveClock()

  const [unlockEmp, setUnlockEmp] = useState('')
  const [unlockGoalId, setUnlockGoalId] = useState('')
  const [unlockReason, setUnlockReason] = useState('')

  const empList = employees.filter((e) => e.role === 'employee' && e.organizationStatus === 'joined')
  const activeComputed = resolveActivePeriod(checkInPeriods, now, adminForcedPeriodId)

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'requests', label: 'Join Requests', badge: joinRequests.length || undefined },
    { id: 'org', label: 'Org Management' },
    { id: 'kpi', label: 'Push KPI' },
    { id: 'cycle', label: 'Cycle & check-ins', badge: pendingCount || undefined },
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-accent-violet text-accent-violet'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <Badge variant="warning">{t.badge}</Badge>
              )}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-accent-glow" />
                Pending Join Requests
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Review and approve employees or managers who want to join <span className="font-semibold text-white">{adminOrg?.name}</span>.
              </p>
            </div>

            {joinRequests.length === 0 ? (
              <Card className="flex flex-col items-center justify-center text-center p-12 border border-[var(--border-subtle)] bg-[#12101f]/40">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-purple bg-purple/10">
                  <Building size={24} className="text-accent-glow" />
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-1">
                  No Pending Requests
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                  Everything is quiet here! When employees or managers sign up and request to join your organization, their requests will appear here for your approval.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joinRequests.map((r) => (
                  <Card
                    key={r.employeeId}
                    className="border border-purple-strong bg-[#12101f]/80 p-5 flex flex-col justify-between hover:border-purple transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600" />
                    
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-700 text-xs font-bold text-white">
                            {r.employeeName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{r.employeeName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] uppercase font-semibold text-accent-glow px-2 py-0.5 rounded bg-purple/20">
                                {r.employeeRole}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                in {r.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-3 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-500" />
                          <span>{r.employeeEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-500" />
                          <span>Requested {new Date(r.requestedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-white/5 pt-4">
                      <button
                        onClick={() => {
                          if (adminOrg) approveRequest(adminOrg.id, r.employeeId)
                        }}
                        className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (adminOrg) denyRequest(adminOrg.id, r.employeeId)
                        }}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <XIcon size={14} />
                        Deny
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

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
          <PushKpiPanel
            eligibleEmployees={empList}
            title="Push KPI to employees"
            description="Select any employee in the organization to receive this KPI."
          />
        )}

        {tab === 'cycle' && (
          <div className="space-y-8">
            <CyclePolicyEditor policy={policy} onChange={updatePolicy} />

            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-sm font-bold">Check-in schedule</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enforced quarterly windows · Active now:{' '}
                    <strong>{activeComputed?.label ?? 'None'}</strong>
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-secondary)]">Override active period</span>
                  <select
                    value={adminForcedPeriodId ?? ''}
                    onChange={(e) =>
                      setAdminForcedPeriod(
                        (e.target.value || null) as CyclePhaseId | null,
                      )
                    }
                    className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-2 py-1.5"
                  >
                    <option value="">Auto (by date)</option>
                    {checkInPeriods.map((p) => (
                      <option key={p.quarter} value={p.quarter}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <th className="p-3">Period</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Opens</th>
                      <th className="p-3">Closes</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Enforced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkInPeriods.map((p) => {
                      const status = getPeriodWindowStatus(p, now)
                      return (
                        <tr
                          key={p.quarter}
                          className="border-b border-[var(--border-subtle)] last:border-0"
                        >
                          <td className="p-3 font-medium">{p.label}</td>
                          <td className="max-w-[200px] p-3 text-xs text-[var(--text-secondary)]">
                            {p.action}
                          </td>
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
                          <td className="p-3">
                            <Badge
                              variant={
                                status === 'open'
                                  ? 'success'
                                  : status === 'upcoming'
                                    ? 'warning'
                                    : 'default'
                              }
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={p.enforced}
                              onChange={(e) =>
                                updateCheckInPeriod(p.quarter, {
                                  enforced: e.target.checked,
                                })
                              }
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div>
              <h3 className="mb-3 font-heading text-sm font-bold">
                Manager change requests
              </h3>
              <CycleChangeRequestQueue showAll />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={lockAllApproved}>Lock all approved goals</Button>
            </div>

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
