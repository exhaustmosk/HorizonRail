import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Target } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useCycleStore } from '../store/cycleStore'
import { useGoalStore } from '../store/goalStore'
import { useLiveClock } from '../hooks/useLiveClock'
import {
  canLogAchievement,
  formatCountdown,
  getPeriodWindowStatus,
  isCheckInQuarter,
  msUntil,
  resolveActivePeriod,
} from '../lib/checkInSchedule'
import { FISCAL_YEAR } from '../lib/constants'
import CheckInCalendar from '../components/checkin/CheckInCalendar'
import PeriodStatusBanner from '../components/checkin/PeriodStatusBanner'
import QuarterlyUpdateForm from '../components/checkin/QuarterlyUpdateForm'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function CheckIns() {
  const user = useAuthStore((s) => s.user)!
  const employees = useOrgStore((s) => s.employees)
  const periods = useOrgStore((s) => s.checkInPeriods)
  const forcedId = useCycleStore((s) => s.adminForcedPeriodId)
  const policy = useCycleStore((s) => s.policy)
  const submitQuarterlyCheckIn = useGoalStore((s) => s.submitQuarterlyCheckIn)
  const now = useLiveClock()

  const emp = employees.find((e) => e.id === user.id) ?? user
  const activePeriod = resolveActivePeriod(periods, now, forcedId)
  const canSubmit = canLogAchievement(activePeriod, policy, now)
  const isQuarterWindow =
    activePeriod && isCheckInQuarter(activePeriod.quarter)

  const nextPeriod = useMemo(() => {
    return periods.find((p) => getPeriodWindowStatus(p, now) === 'upcoming')
  }, [periods, now])

  const handleSubmit = (
    updates: Array<{
      goalId: string
      planned: number
      actual: number
      status: import('../types').GoalStatus
      narrative: string
    }>,
  ) => {
    if (!activePeriod || !isCheckInQuarter(activePeriod.quarter)) return
    const q = activePeriod.quarter
    updates.forEach((u) =>
      submitQuarterlyCheckIn(emp.id, u.goalId, q, {
        planned: u.planned,
        actual: u.actual,
        status: u.status,
        employeeNotes: u.narrative,
      }),
    )
    window.alert(`${q} progress submitted for ${updates.length} goal(s).`)
  }

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">Quarterly check-ins</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {FISCAL_YEAR} · Planned vs. actual progress capture
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <PeriodStatusBanner period={activePeriod} policy={policy} now={now} />
          {nextPeriod && !activePeriod && (
            <Card className="flex items-center gap-3 border-accent-amber/30 bg-accent-amber/5">
              <Clock size={18} className="text-accent-amber" />
              <p className="text-sm">
                Next: <strong>{nextPeriod.label}</strong> opens in{' '}
                <span className="font-mono text-accent-glow">
                  {formatCountdown(msUntil(nextPeriod.openDate, now))}
                </span>
              </p>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {activePeriod?.quarter === 'goal_setting' && (
              <Card className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-accent-violet" />
                  <h2 className="font-heading font-bold">Goal setting phase</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Create and submit your goal sheet for manager approval during this window.
                </p>
                <Link
                  to="/my-goals"
                  className="inline-flex text-sm font-medium text-accent-glow hover:underline"
                >
                  Open goal sheet →
                </Link>
              </Card>
            )}

            {isQuarterWindow && canSubmit && (
              <QuarterlyUpdateForm
                goals={emp.goals}
                period={activePeriod}
                onSubmit={handleSubmit}
              />
            )}

            {isQuarterWindow && !canSubmit && (
              <Card className="text-sm text-[var(--text-secondary)]">
                The {activePeriod.label} window is not open for submissions.{' '}
                {policy.checkInsMandatory && !policy.allowLateSubmissions && (
                  <span className="text-accent-amber">
                    Late submissions are disabled by org policy.
                  </span>
                )}
              </Card>
            )}

            {!activePeriod && (
              <Card className="text-sm text-[var(--text-secondary)]">
                No check-in window is open right now. Review the schedule for upcoming
                dates.
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-purple glow-purple-sm">
              <p className="text-xs text-[var(--text-secondary)]">Your goals</p>
              <p className="font-heading text-2xl font-bold">{emp.goals.length}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Max {policy.maxGoals} per policy · Min {policy.minGoals} required
              </p>
              {policy.checkInsMandatory && (
                <div className="mt-2">
                  <Badge variant="warning">Check-ins mandatory</Badge>
                </div>
              )}
            </Card>
            <CheckInCalendar />
          </div>
        </div>
      </div>
    </div>
  )
}
