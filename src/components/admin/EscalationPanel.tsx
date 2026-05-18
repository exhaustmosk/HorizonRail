import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, AlertTriangle, Play, ShieldAlert, X } from 'lucide-react'
import { useEscalationStore } from '../../store/escalationStore'
import { useOrgStore } from '../../store/orgStore'
import { runEscalationEngine } from '../../lib/escalationEngine'
import type { EscalationCondition, EscalationTarget } from '../../types'

interface EscalationPanelProps {
  orgId: string
}

export default function EscalationPanel({ orgId }: EscalationPanelProps) {
  const { policies, logs, fetchData, addPolicy, deletePolicy, updatePolicy, resolveEscalation } = useEscalationStore()
  const employees = useOrgStore((s) => s.employees)
  const periods = useOrgStore((s) => s.checkInPeriods)

  const [isAdding, setIsAdding] = useState(false)
  const [newCondition, setNewCondition] = useState<EscalationCondition>('goals_unapproved')
  const [newDays, setNewDays] = useState(3)
  const [newTarget, setNewTarget] = useState<EscalationTarget>('manager')
  
  const [isRunningEngine, setIsRunningEngine] = useState(false)
  const [runResult, setRunResult] = useState<number | null>(null)

  useEffect(() => {
    fetchData(orgId)
  }, [orgId, fetchData])

  const handleAdd = async () => {
    await addPolicy({
      orgId,
      condition: newCondition,
      daysThreshold: newDays,
      escalateTo: newTarget,
      enabled: true
    })
    setIsAdding(false)
  }

  const handleRunEngine = async () => {
    setIsRunningEngine(true)
    setRunResult(null)
    const newIncidents = await runEscalationEngine(orgId, policies, employees, periods)
    await fetchData(orgId) // Refresh logs
    setRunResult(newIncidents)
    setIsRunningEngine(false)
    setTimeout(() => setRunResult(null), 5000)
  }

  const conditionLabels: Record<EscalationCondition, string> = {
    no_goals_submitted: 'Goals not submitted',
    goals_unapproved: 'Goals unapproved',
    checkin_missed: 'Check-in missed'
  }

  const targetLabels: Record<EscalationTarget, string> = {
    manager: 'Direct Manager',
    skip_level: 'Skip-level Manager',
    admin: 'Platform Admin',
    hr: 'HR Department'
  }

  return (
    <div className="space-y-8">
      {/* Policy Builder Section */}
      <section className="rounded-xl border border-white/10 bg-bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-accent-red" size={20} />
              Escalation Policies
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Define rules for auto-escalating overdue actions.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-accent-violet/20 px-3 py-1.5 text-sm font-medium text-accent-glow hover:bg-accent-violet/30 transition-colors"
          >
            <Plus size={16} /> New Rule
          </button>
        </div>

        {isAdding && (
          <div className="mb-6 rounded-lg border border-purple-strong/30 bg-[#151226] p-4 flex flex-col md:flex-row gap-4 items-end">
            <label className="flex-1">
              <span className="text-xs text-[var(--text-muted)] mb-1 block">If this condition occurs...</span>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as EscalationCondition)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-purple-strong focus:outline-none"
              >
                <option value="no_goals_submitted">Goals not submitted</option>
                <option value="goals_unapproved">Goals unapproved</option>
                <option value="checkin_missed">Quarterly check-in missed</option>
              </select>
            </label>

            <label className="w-24">
              <span className="text-xs text-[var(--text-muted)] mb-1 block">For (Days)</span>
              <input
                type="number"
                min="1"
                value={newDays}
                onChange={(e) => setNewDays(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-purple-strong focus:outline-none"
              />
            </label>

            <label className="flex-1">
              <span className="text-xs text-[var(--text-muted)] mb-1 block">Escalate to...</span>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value as EscalationTarget)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-purple-strong focus:outline-none"
              >
                <option value="manager">Direct Manager</option>
                <option value="skip_level">Skip-level Manager</option>
                <option value="admin">Platform Admin</option>
                <option value="hr">HR Department</option>
              </select>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-accent-violet px-4 py-2 text-sm font-semibold text-white hover:bg-accent-violet/90"
              >
                Save Rule
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {policies.length === 0 && !isAdding && (
            <p className="text-sm text-[var(--text-muted)] italic">No escalation policies defined yet.</p>
          )}
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${p.enabled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-600'}`} />
                <span className="text-sm font-medium text-white">
                  If <strong className="text-accent-red/90">{conditionLabels[p.condition]}</strong> for {p.daysThreshold} days, escalate to <strong className="text-accent-glow">{targetLabels[p.escalateTo]}</strong>.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updatePolicy(p.id, { enabled: !p.enabled })}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-white"
                >
                  {p.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deletePolicy(p.id)}
                  className="text-accent-red/60 hover:text-accent-red transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escalation Logs Section */}
      <section className="rounded-xl border border-white/10 bg-bg-card shadow-xl overflow-hidden">
        <div className="border-b border-white/10 bg-black/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={20} />
              Active Escalations
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Review and resolve triggered escalations.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {runResult !== null && (
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full"
                >
                  Found {runResult} new incidents
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={handleRunEngine}
              disabled={isRunningEngine}
              className="flex items-center gap-2 rounded-lg bg-[#22c55e]/20 px-4 py-2 text-sm font-semibold text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/30 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
              title="Demo purpose: Runs the cron job logic instantly"
            >
              {isRunningEngine ? <span className="animate-spin">⏳</span> : <Play size={16} fill="currentColor" />}
              Run Engine (Demo)
            </button>
          </div>
        </div>

        <div className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <CheckCircle2 className="text-[var(--text-muted)]" size={24} />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">No escalations logged yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className={`rounded-xl border p-4 ${log.status === 'open' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-black/20 opacity-70'}`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {log.status === 'open' ? (
                          <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-500 border border-yellow-500/30">
                            Action Required
                          </span>
                        ) : (
                          <span className="rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/30">
                            Resolved
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">
                          {log.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {log.employee?.name || 'Unknown Employee'}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Triggered: <strong>{log.policy ? conditionLabels[log.policy.condition] : 'Unknown Rule'}</strong>
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Escalated to: {log.policy ? targetLabels[log.policy.escalateTo] : 'Unknown'}
                      </p>
                    </div>
                    
                    {log.status === 'open' && (
                      <div className="flex items-start">
                        <button
                          onClick={() => resolveEscalation(log.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                        >
                          <CheckCircle2 size={14} className="text-green-400" />
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
