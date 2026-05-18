import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useCycleStore } from '../store/cycleStore'
import { useLiveClock } from '../hooks/useLiveClock'
import { resolveActivePeriod } from '../lib/checkInSchedule'
import { computeWeightedScore } from '../lib/scoreEngine'
import { COMPANY_NAME, FISCAL_YEAR } from '../lib/constants'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import NeuronCanvas from '../components/neuron/NeuronCanvas'
import CheckInPanel from '../components/checkin/CheckInPanel'
import PushKpiPanel from '../components/goals/PushKpiPanel'
import PeriodStatusBanner from '../components/checkin/PeriodStatusBanner'
import TeamCheckInTracker from '../components/checkin/TeamCheckInTracker'
import CycleChangeRequestForm from '../components/checkin/CycleChangeRequestForm'
import { UserPlus, Check, X as XIcon } from 'lucide-react'

export default function ManagerView() {
  const user = useAuthStore((s) => s.user)!
  const getDirectReports = useOrgStore((s) => s.getDirectReports)
  const employees = useOrgStore((s) => s.employees)
  const checkInPeriods = useOrgStore((s) => s.checkInPeriods)
  const forcedId = useCycleStore((s) => s.adminForcedPeriodId)
  const policy = useCycleStore((s) => s.policy)
  const reports = getDirectReports(user.id)
  const now = useLiveClock()
  const activePeriod = resolveActivePeriod(checkInPeriods, now, forcedId)

  const org = useOrgStore((s) => s.organizations.find((o) => o.id === user.organizationId))
  const pendingRequests = org?.joinRequests.filter((r) => r.managerId === user.id) ?? []
  const approveRequest = useOrgStore((s) => s.approveJoinRequest)
  const denyRequest = useOrgStore((s) => s.denyJoinRequest)

  const [selectedId, setSelectedId] = useState(reports[0]?.id ?? '')

  const avgScore =
    reports.length > 0
      ? Math.round(
          reports.reduce((s, e) => s + computeWeightedScore(e.goals), 0) /
            reports.length,
        )
      : 0

  const submitted = reports.filter((e) =>
    e.goals.some((g) => g.approvalStatus === 'submitted'),
  ).length

  const pending = reports.filter((e) =>
    e.goals.some((g) => g.approvalStatus === 'submitted'),
  ).length

  const activeQuarter = activePeriod?.quarter
  const checkInsDone = reports.filter((e) =>
    activeQuarter && ['Q1', 'Q2', 'Q3', 'Q4'].includes(activeQuarter)
      ? e.goals.some((g) =>
          g.quarterlyActuals.some((a) => a.quarter === activeQuarter),
        )
      : e.goals.some((g) => g.quarterlyActuals.length > 0),
  ).length

  const exportCsv = () => {
    const rows = reports.flatMap((e) =>
      e.goals.map((g) => `${e.name},${g.title},${g.approvalStatus}`),
    )
    const blob = new Blob([`Employee,Goal,Status\n${rows.join('\n')}`], {
      type: 'text/csv',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'team-goals.csv'
    a.click()
  }

  const selectedForCheckIn =
    employees.find((e) => e.id === selectedId) ?? reports[0]

  return (
    <>
      <Topbar
        title={`Team Overview — ${FISCAL_YEAR}`}
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="space-y-4 px-6 pt-4">
        <PeriodStatusBanner period={activePeriod} policy={policy} now={now} />

        {pendingRequests.length > 0 && (
          <div className="rounded-xl border border-accent-violet/30 bg-accent-violet/5 p-4 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-violet" />
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <UserPlus size={16} className="text-accent-glow" />
              Pending Team Approvals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingRequests.map((r) => (
                <div key={r.employeeId} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#12101f]/80 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-white">{r.employeeName}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{r.employeeRole} • {r.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => org && approveRequest(org.id, r.employeeId, user.id)}
                      className="flex-1 py-1.5 rounded-md bg-green-500/10 border border-green-500/30 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => org && denyRequest(org.id, r.employeeId)}
                      className="flex-1 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <XIcon size={12} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-4">
            <NeuronCanvas employees={reports} companyName={COMPANY_NAME} />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-xs text-[var(--text-secondary)]">Avg team score</p>
            <p className="font-heading text-2xl font-bold text-accent-teal">
              {avgScore}%
            </p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-secondary)]">Goals submitted</p>
            <p className="font-heading text-2xl font-bold">{submitted}</p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-secondary)]">Pending approvals</p>
            <p className="font-heading text-2xl font-bold text-accent-amber">
              {pending}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-[var(--text-secondary)]">
              {activePeriod ? `${activePeriod.quarter} check-ins` : 'Check-ins done'}
            </p>
            <p className="font-heading text-2xl font-bold">
              {checkInsDone}/{reports.length}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-heading font-bold">Team check-in progress</h2>
          <TeamCheckInTracker reports={reports} period={activePeriod} />
        </div>
        <CycleChangeRequestForm
          managerId={user.id}
          managerName={user.name}
          periods={checkInPeriods}
          policy={policy}
        />
      </div>

      <div className="px-6 pb-6">
        <PushKpiPanel
          eligibleEmployees={reports}
          title="Push KPI to your team"
          description="KPIs are assigned only to people who report directly to you."
        />
      </div>

      {selectedForCheckIn && (
        <div className="px-6 pb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading font-bold">Member check-in detail</h2>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-1.5 text-sm"
            >
              {reports.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <CheckInPanel employee={selectedForCheckIn} activeQuarter={activePeriod} />
        </div>
      )}
    </>
  )
}
