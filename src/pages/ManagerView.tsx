import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { computeWeightedScore } from '../lib/scoreEngine'
import { COMPANY_NAME, FISCAL_YEAR } from '../lib/constants'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import NeuronCanvas from '../components/neuron/NeuronCanvas'
import CheckInPanel from '../components/checkin/CheckInPanel'
import PushKpiPanel from '../components/goals/PushKpiPanel'

export default function ManagerView() {
  const user = useAuthStore((s) => s.user)!
  const getDirectReports = useOrgStore((s) => s.getDirectReports)
  const employees = useOrgStore((s) => s.employees)
  const reports = getDirectReports(user.id)

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

  const checkInsDone = reports.filter((e) =>
    e.goals.some((g) => g.quarterlyActuals.length > 0),
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

  const selectedForCheckIn = reports[0]

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
            <p className="text-xs text-[var(--text-secondary)]">Check-ins done</p>
            <p className="font-heading text-2xl font-bold">
              {checkInsDone}/{reports.length}
            </p>
          </Card>
        </div>
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
          <h2 className="mb-3 font-heading font-bold">
            Check-in: {selectedForCheckIn.name}
          </h2>
          <CheckInPanel employee={employees.find((e) => e.id === selectedForCheckIn.id) ?? selectedForCheckIn} />
        </div>
      )}
    </>
  )
}
