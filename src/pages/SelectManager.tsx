import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCircle, ChevronRight, LogOut, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { PRODUCT_NAME } from '../lib/constants'

export default function SelectManager() {
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const user = useOrgStore((s) => s.employees.find((e) => e.id === authUser?.id)) || authUser
  const fetchOrgManagers = useOrgStore((s) => s.fetchOrgManagers)
  const reassignManager = useOrgStore((s) => s.reassignManager)

  const [managers, setManagers] = useState<{ id: string; name: string }[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.organizationId) {
      fetchOrgManagers(user.organizationId).then(setManagers)
    }
  }, [user?.organizationId, fetchOrgManagers])

  if (!user) return null

  // If manager is already assigned, redirect
  if (user.managerId) {
    navigate(user.role === 'manager' ? '/manager' : '/dashboard')
    return null
  }

  const handleSelect = async () => {
    if (!selectedManagerId) {
      setError('Please select your reporting manager.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await reassignManager(user.id, selectedManagerId)
      // Update auth store so ProtectedRoute sees the managerId immediately
      setUser({ ...user, managerId: selectedManagerId, goals: user.goals ?? [] })
      navigate('/dashboard')
    } catch {
      setError('Failed to assign manager. Please try again.')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between py-10 px-4">
      {/* Top Brand Nav */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="glass-logo-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/50 to-violet-950/80">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-white" aria-hidden>
              <path fill="currentColor" d="M6 14V6h8l-3.2 3.2L14 12.4 10.4 9 6 14z" opacity="0.95" />
              <path fill="currentColor" d="M6 6h3.5L6 9.5V6z" opacity="0.55" />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-wide">
            {PRODUCT_NAME}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-purple-strong bg-[#12101f]/90 p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />

            {/* Lock icon + heading */}
            <div className="mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-purple/30 bg-purple/10 mb-4 relative">
                <UserCircle size={26} className="text-accent-glow" />
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/90 border border-amber-400/50">
                  <Lock size={10} className="text-white" />
                </div>
              </div>
              <h1 className="font-heading text-2xl font-bold text-white">
                Select Your Manager
              </h1>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                You've been approved into <span className="font-semibold text-white">{user.organizationName}</span>! 
                Before you can access your workspace, please select your reporting manager.
              </p>
            </div>

            {/* Feature lock notice */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-6 flex items-start gap-3">
              <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300/90 leading-relaxed">
                All platform features — goals, check-ins, analysis, and reports — are locked until a manager is assigned to you.
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center mb-5">
                {error}
              </p>
            )}

            {/* Manager list */}
            <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
              {managers.length === 0 ? (
                <div className="text-center py-8">
                  <UserCircle size={36} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">No managers found in your organization yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Please contact your administrator.</p>
                </div>
              ) : (
                managers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedManagerId(m.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
                      selectedManagerId === m.id
                        ? 'border-accent-violet/60 bg-accent-violet/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                        : 'border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        selectedManagerId === m.id
                          ? 'bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      {m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${selectedManagerId === m.id ? 'text-white' : 'text-slate-300'}`}>
                        {m.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">Manager</p>
                    </div>
                    {selectedManagerId === m.id && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-violet/80">
                        <svg viewBox="0 0 20 20" className="h-3 w-3 text-white" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={handleSelect}
              disabled={!selectedManagerId || loading}
              className="w-full py-3.5 rounded-xl bg-accent-violet border border-purple-strong text-white font-semibold text-sm shadow-[0_0_24px_rgba(168,85,247,0.25)] hover:bg-accent-violet/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Confirm & Continue
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 max-w-4xl mx-auto w-full border-t border-white/5 pt-4">
        © 2026 {PRODUCT_NAME}. Empowering employees and aligning organizations, one rail at a time.
      </footer>
    </div>
  )
}
