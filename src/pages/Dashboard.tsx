import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useCycleStore } from '../store/cycleStore'
import { useGoalStore } from '../store/goalStore'
import { useLiveClock } from '../hooks/useLiveClock'
import {
  canLogAchievement,
  formatCountdown,
  isCheckInQuarter,
  msUntil,
  resolveActivePeriod,
} from '../lib/checkInSchedule'
import { computeWeightedScore, validateGoalSheet } from '../lib/scoreEngine'
import { buildEmployeeTasks } from '../lib/employeeTasks'
import Card from '../components/ui/Card'
import GoalCard from '../components/goals/GoalCard'
import CheckInCalendar from '../components/checkin/CheckInCalendar'
import PeriodStatusBanner from '../components/checkin/PeriodStatusBanner'
import Modal, { ModalActions } from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)!
  const employees = useOrgStore((s) => s.employees)
  const checkInPeriods = useOrgStore((s) => s.checkInPeriods)
  const forcedId = useCycleStore((s) => s.adminForcedPeriodId)
  const policy = useCycleStore((s) => s.policy)
  const logActual = useGoalStore((s) => s.logActual)
  const now = useLiveClock()
  const emp = employees.find((e) => e.id === user.id) ?? user
  const goals = emp.goals
  const tasks = useMemo(
    () => buildEmployeeTasks(emp, checkInPeriods, policy, now, forcedId),
    [emp, checkInPeriods, policy, now, forcedId],
  )
  const weighted = Math.round(computeWeightedScore(goals))
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0)
  const sheetErrors = validateGoalSheet(goals)
  const activePeriod = resolveActivePeriod(checkInPeriods, now, forcedId)
  const closesIn = activePeriod ? msUntil(activePeriod.closeDate, now) : 0
  const canLog = canLogAchievement(activePeriod, policy, now)
  const pendingTasks = tasks.filter((t) => !t.done)
  const doneTasks = tasks.filter((t) => t.done)

  const [logGoalId, setLogGoalId] = useState<string | null>(null)
  const [actualValue, setActualValue] = useState('')
  const [taskDone, setTaskDone] = useState<Record<string, boolean>>({})

  const handleLog = () => {
    if (!logGoalId || !activePeriod || !isCheckInQuarter(activePeriod.quarter)) return
    if (!canLog) return
    const q = activePeriod.quarter
    const g = goals.find((x) => x.id === logGoalId)
    const val = g?.uom === 'timeline' ? (actualValue ? new Date(actualValue).getTime() : 0) : Number(actualValue)
    logActual(user.id, logGoalId, q, val)
    setLogGoalId(null)
    setActualValue('')
  }

  const displayTasks = tasks.map((t) => ({
    ...t,
    done: t.done || !!taskDone[t.id],
  }))

  return (
    <div className="bg-mesh">
      <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-heading text-2xl font-bold">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your workspace · goals and tasks at a glance
          </p>
        </motion.div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Overall progress',
              value: `${weighted}%`,
              accent: 'text-accent-glow',
              icon: TrendingUp,
            },
            {
              label: 'Active goals',
              value: `${goals.length}/8`,
              accent: '',
              icon: Target,
            },
            {
              label: 'Weightage',
              value: `${totalWeight}%`,
              accent: totalWeight === 100 ? 'text-accent-teal' : 'text-accent-amber',
              icon: Target,
            },
            {
              label: activePeriod ? 'Window closes' : 'Next window',
              value: activePeriod ? formatCountdown(closesIn) : '—',
              accent: activePeriod ? 'text-accent-glow font-mono text-lg' : '',
              icon: Calendar,
            },
          ].map((m) => (
            <Card key={m.label} className="border-purple glow-purple-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">{m.label}</p>
                  <p className={`mt-1 font-heading text-2xl font-bold ${m.accent}`}>
                    {m.value}
                  </p>
                </div>
                <m.icon size={18} className="text-accent-glow/60" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <PeriodStatusBanner period={activePeriod} policy={policy} now={now} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {sheetErrors.length > 0 && (
              <div className="rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-accent-amber">
                {sheetErrors[0]}
                <Link to="/my-goals" className="ml-2 underline">
                  Fix in goal sheet
                </Link>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading font-bold">Your goals</h2>
                <Link
                  to="/my-goals"
                  className="flex items-center gap-1 text-sm text-accent-glow hover:underline"
                >
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    checkInActive={canLog}
                    onLogAchievement={() => setLogGoalId(goal.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-purple glow-purple-sm">
              <h2 className="mb-3 flex items-center gap-2 font-heading font-bold">
                Tasks
                <Badge variant="warning">{pendingTasks.length}</Badge>
              </h2>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {displayTasks
                  .filter((t) => !t.done)
                  .map((t) => (
                    <li
                      key={t.id}
                      className="flex gap-2 rounded-lg border border-purple/50 bg-bg-elevated/50 p-2.5 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setTaskDone((d) => ({ ...d, [t.id]: true }))
                        }
                        className="shrink-0 text-[var(--text-muted)] hover:text-accent-teal"
                      >
                        <Circle size={16} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{t.title}</p>
                        {t.dueLabel && (
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {t.dueLabel}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-[10px] uppercase ${
                          t.priority === 'high'
                            ? 'text-accent-red'
                            : t.priority === 'medium'
                              ? 'text-accent-amber'
                              : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </li>
                  ))}
              </ul>
              {doneTasks.length > 0 && (
                <div className="mt-4 border-t border-purple pt-3">
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Completed</p>
                  {displayTasks
                    .filter((t) => t.done)
                    .slice(0, 3)
                    .map((t) => (
                      <p
                        key={t.id}
                        className="flex items-center gap-2 py-1 text-xs text-[var(--text-secondary)] line-through"
                      >
                        <CheckCircle2 size={12} className="text-accent-teal" />
                        {t.title}
                      </p>
                    ))}
                </div>
              )}
            </Card>

            <CheckInCalendar />
          </div>
        </div>
      </div>

      <Modal
        open={!!logGoalId}
        onClose={() => setLogGoalId(null)}
        title="Log achievement"
        footer={
          <ModalActions
            onCancel={() => setLogGoalId(null)}
            onConfirm={handleLog}
            confirmLabel="Submit"
          />
        }
      >
        <label className="block">
          <span className="text-xs text-[var(--text-secondary)]">
            {goals.find((g) => g.id === logGoalId)?.uom === 'timeline'
              ? 'Completion date'
              : `Actual value (${activePeriod?.quarter})`}
          </span>
          {goals.find((g) => g.id === logGoalId)?.uom === 'timeline' ? (
            <input
              type="date"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-purple bg-bg-elevated px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          ) : (
            <input
              type="number"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-purple bg-bg-elevated px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          )}
        </label>
      </Modal>
    </div>
  )
}
