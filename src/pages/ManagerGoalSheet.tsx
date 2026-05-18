import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  X as XIcon,
  RotateCcw,
  Lock,
  Pencil,
  Save,
  Filter,
  ChevronDown,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { useGoalStore } from '../store/goalStore'
import Topbar from '../components/layout/Topbar'
import type { Goal, Employee } from '../types'

type FilterStatus = 'all' | 'submitted' | 'approved' | 'rejected' | 'draft'

export default function ManagerGoalSheet() {
  const user = useAuthStore((s) => s.user)!
  const getDirectReports = useOrgStore((s) => s.getDirectReports)
  const reports = getDirectReports(user.id)
  const approveGoal = useGoalStore((s) => s.approveGoal)
  const rejectGoal = useGoalStore((s) => s.rejectGoal)
  const updateGoal = useGoalStore((s) => s.updateGoal)

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [rejectingGoalId, setRejectingGoalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editingCell, setEditingCell] = useState<{ goalId: string; field: 'target' | 'weightage' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Flatten all goals from all reports, attaching employee info
  const allGoals = useMemo(() => {
    return reports.flatMap((emp) =>
      emp.goals.map((goal) => ({
        ...goal,
        employeeName: emp.name,
        employeeId: emp.id,
        employeeInitials: emp.initials,
        employeeDepartment: emp.department,
      }))
    )
  }, [reports])

  // Apply filters
  const filteredGoals = useMemo(() => {
    return allGoals.filter((g) => {
      if (filterStatus !== 'all' && g.approvalStatus !== filterStatus) return false
      if (filterEmployee !== 'all' && g.employeeId !== filterEmployee) return false
      return true
    })
  }, [allGoals, filterStatus, filterEmployee])

  // Stats
  const totalSubmitted = allGoals.filter((g) => g.approvalStatus === 'submitted').length
  const totalApproved = allGoals.filter((g) => g.approvalStatus === 'approved').length
  const totalRejected = allGoals.filter((g) => g.approvalStatus === 'rejected').length
  const totalDraft = allGoals.filter((g) => g.approvalStatus === 'draft').length

  const handleApprove = async (employeeId: string, goalId: string) => {
    await approveGoal(employeeId, goalId)
  }

  const handleReject = async (employeeId: string, goalId: string) => {
    if (!rejectReason.trim()) return
    await rejectGoal(employeeId, goalId, rejectReason.trim())
    setRejectingGoalId(null)
    setRejectReason('')
  }

  const startEdit = (goalId: string, field: 'target' | 'weightage', currentValue: number) => {
    setEditingCell({ goalId, field })
    setEditValue(String(currentValue))
  }

  const saveEdit = async (employeeId: string, goalId: string) => {
    if (!editingCell) return
    const numValue = Number(editValue)
    if (isNaN(numValue) || numValue < 0) return

    const update: Partial<Goal> = {}
    if (editingCell.field === 'target') update.target = numValue
    if (editingCell.field === 'weightage') update.weightage = numValue

    await updateGoal(employeeId, goalId, update)
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.draft}`}>
        {status === 'approved' && <Lock size={9} />}
        {status}
      </span>
    )
  }

  return (
    <>
      <Topbar
        title="Goal Sheet Review"
        subtitle="Review, edit, and approve your team's goals"
      />
      <div className="p-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending Review', value: totalSubmitted, color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
            { label: 'Approved', value: totalApproved, color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
            { label: 'Returned', value: totalRejected, color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5' },
            { label: 'Drafts', value: totalDraft, color: 'text-slate-400', bg: 'border-slate-500/20 bg-slate-500/5' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              <p className={`font-heading text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-all"
          >
            <Filter size={13} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterStatus !== 'all' && (
            <span className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-[10px] font-semibold text-accent-glow flex items-center gap-1.5">
              Status: {filterStatus}
              <button onClick={() => setFilterStatus('all')} className="hover:text-white">
                <XIcon size={10} />
              </button>
            </span>
          )}
          {filterEmployee !== 'all' && (
            <span className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-[10px] font-semibold text-accent-glow flex items-center gap-1.5">
              Employee: {reports.find((r) => r.id === filterEmployee)?.name}
              <button onClick={() => setFilterEmployee('all')} className="hover:text-white">
                <XIcon size={10} />
              </button>
            </span>
          )}
        </div>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="rounded-lg border border-white/10 bg-[#12101f] px-3 py-2 text-xs text-white"
                  >
                    <option value="all">All</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Returned</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Employee</label>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#12101f] px-3 py-2 text-xs text-white"
                  >
                    <option value="all">All team members</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals table */}
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="text-slate-600 mb-4" />
            <p className="text-sm text-slate-400">No goals match the current filters.</p>
            <p className="text-xs text-slate-500 mt-1">
              {allGoals.length === 0
                ? 'Your team members haven\'t created any goals yet.'
                : 'Try adjusting the filters above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface shadow-[0_0_30px_rgba(0,0,0,0.2)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs">
                  <th className="p-3 font-semibold">Employee</th>
                  <th className="p-3 font-semibold">Thrust Area</th>
                  <th className="p-3 font-semibold">Goal Title</th>
                  <th className="p-3 font-semibold">UoM</th>
                  <th className="p-3 font-semibold">Target</th>
                  <th className="p-3 font-semibold">Weight</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGoals.map((g, i) => (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Employee */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/80 to-violet-700/80 text-[10px] font-bold text-white">
                          {g.employeeInitials}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[var(--text-primary)] truncate max-w-[120px]">{g.employeeName}</p>
                          <p className="text-[10px] text-slate-500">{g.employeeDepartment}</p>
                        </div>
                      </div>
                    </td>

                    {/* Thrust Area */}
                    <td className="p-3 text-xs text-[var(--text-secondary)]">{g.thrustArea}</td>

                    {/* Title */}
                    <td className="p-3">
                      <p className="font-medium text-sm text-[var(--text-primary)]">{g.title}</p>
                      {g.description && (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{g.description}</p>
                      )}
                    </td>

                    {/* UoM */}
                    <td className="p-3 text-xs text-[var(--text-secondary)] capitalize">{g.uom.replace('_', ' ')}</td>

                    {/* Target - inline editable for submitted goals */}
                    <td className="p-3">
                      {editingCell?.goalId === g.id && editingCell.field === 'target' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(g.employeeId, g.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            autoFocus
                            className="w-20 rounded-md border border-accent-violet/50 bg-accent-violet/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent-violet/40"
                          />
                          <button onClick={() => saveEdit(g.employeeId, g.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Save size={12} />
                          </button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300">
                            <XIcon size={12} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm ${g.approvalStatus === 'submitted' && !g.locked ? 'cursor-pointer hover:text-accent-glow transition-colors group' : ''}`}
                          onClick={() => {
                            if (g.approvalStatus === 'submitted' && !g.locked) {
                              startEdit(g.id, 'target', g.target)
                            }
                          }}
                        >
                          {g.uom === 'timeline'
                            ? g.targetDate
                              ? new Date(g.targetDate).toLocaleDateString()
                              : '—'
                            : g.target}
                          {g.approvalStatus === 'submitted' && !g.locked && (
                            <Pencil size={10} className="inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </td>

                    {/* Weightage - inline editable for submitted goals */}
                    <td className="p-3">
                      {editingCell?.goalId === g.id && editingCell.field === 'weightage' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={5}
                            max={100}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(g.employeeId, g.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            autoFocus
                            className="w-16 rounded-md border border-accent-violet/50 bg-accent-violet/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent-violet/40"
                          />
                          <button onClick={() => saveEdit(g.employeeId, g.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Save size={12} />
                          </button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-300">
                            <XIcon size={12} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm ${g.approvalStatus === 'submitted' && !g.locked ? 'cursor-pointer hover:text-accent-glow transition-colors group' : ''}`}
                          onClick={() => {
                            if (g.approvalStatus === 'submitted' && !g.locked) {
                              startEdit(g.id, 'weightage', g.weightage)
                            }
                          }}
                        >
                          {g.weightage}%
                          {g.approvalStatus === 'submitted' && !g.locked && (
                            <Pencil size={10} className="inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">{statusBadge(g.approvalStatus)}</td>

                    {/* Actions */}
                    <td className="p-3">
                      {g.approvalStatus === 'submitted' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(g.employeeId, g.id)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            title="Approve & Lock"
                          >
                            <Check size={11} />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingGoalId(g.id)}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
                            title="Return for Rework"
                          >
                            <RotateCcw size={11} />
                            Rework
                          </button>
                        </div>
                      ) : g.approvalStatus === 'approved' ? (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400/60">
                          <Lock size={11} />
                          Locked
                        </div>
                      ) : g.approvalStatus === 'rejected' ? (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-400/60">
                          <AlertCircle size={11} />
                          Awaiting rework
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-500">—</div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject reason modal */}
        <AnimatePresence>
          {rejectingGoalId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => { setRejectingGoalId(null); setRejectReason('') }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12101f]/95 p-6 shadow-2xl backdrop-blur-xl"
              >
                <h3 className="font-heading text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <RotateCcw size={16} className="text-amber-400" />
                  Return for Rework
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Provide feedback so the employee knows what to change.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Please increase the target to at least 500 units..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => { setRejectingGoalId(null); setRejectReason('') }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const goal = filteredGoals.find((g) => g.id === rejectingGoalId)
                      if (goal) handleReject(goal.employeeId, goal.id)
                    }}
                    disabled={!rejectReason.trim()}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Return for Rework
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
