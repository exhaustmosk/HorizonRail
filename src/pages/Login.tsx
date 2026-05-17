import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Atom, Activity, User, Building, Briefcase, Info } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import TopNav from '../components/layout/TopNav'
import { PRODUCT_NAME } from '../lib/constants'

type LoginTab = 'employee' | 'manager' | 'admin'

export default function Login() {
  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [tab, setTab] = useState<LoginTab>('employee')

  // Common Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')

  // Admin Specific Form States
  const [orgName, setOrgName] = useState('')
  const [orgIndustry, setOrgIndustry] = useState('Technology')
  const [orgSize, setOrgSize] = useState('10-50 employees')

  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    if (mode === 'login') {
      const { error: loginError } = await login(email, password)
      if (loginError) {
        setError(loginError + ' (Have you created this account in Supabase yet?)')
        return
      }
      
      const loggedUser = useAuthStore.getState().user
      if (!loggedUser) return

      if (loggedUser.organizationStatus !== 'joined') {
        navigate('/onboarding')
      } else if (loggedUser.role === 'admin') {
        navigate('/admin')
      } else if (loggedUser.role === 'manager') {
        navigate('/manager')
      } else {
        navigate('/dashboard')
      }
    } else {
      // Sign up flow
      if (!name.trim()) {
        setError('Please enter your full name.')
        return
      }

      if (tab === 'admin' && !orgName.trim()) {
        setError('Please specify your organization name.')
        return
      }

      if (tab !== 'admin' && !department.trim()) {
        setError('Please enter your department (e.g., Engineering, Sales).')
        return
      }

      const { error: regError, needsEmailConfirmation } = await register(
        name.trim(),
        email.trim(),
        password,
        tab,
        tab === 'admin' ? 'Management' : department.trim(),
        tab === 'admin' ? orgName.trim() : undefined,
        tab === 'admin' ? orgIndustry : undefined,
        tab === 'admin' ? orgSize : undefined
      )

      if (regError) {
        setError(regError)
        return
      }

      if (needsEmailConfirmation) {
        setError('Success! Please check your email to confirm your account.')
        return
      }

      // Automatically navigates via ProtectedRoute/App or Onboarding
      if (tab === 'admin') {
        navigate('/admin')
      } else {
        navigate('/onboarding')
      }
    }
  }

  const tabHint =
    tab === 'employee'
      ? 'priya@acme.com / pass'
      : tab === 'manager'
        ? 'ramesh@acme.com or leena@acme.com / pass'
        : 'divya@acme.com / pass'

  return (
    <div className="min-h-screen bg-mesh">
      <TopNav />

      <div className="flex flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-6 flex items-center gap-2 text-[var(--text-secondary)] hover:text-accent-glow">
          <Atom size={22} className="text-accent-glow" />
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">
            {PRODUCT_NAME}
          </span>
        </Link>
        <p className="mb-8 text-center text-sm text-[var(--text-secondary)]">
          Goals, check-ins & team clarity
        </p>

        {/* Tab Selection */}
        <div className="mb-6 flex gap-1 rounded-xl border border-purple bg-bg-card p-1">
          {(['employee', 'manager', 'admin'] as LoginTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t)
                setError('')
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-accent-violet/20 text-accent-glow shadow-[inset_0_-2px_0_#a855f7]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-accent-glow/80">
          <Activity size={14} className="text-accent-glow" />
          Performance cycle
          <Activity size={14} className="scale-x-[-1] text-accent-glow" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md rounded-2xl border border-purple-strong bg-bg-card p-8 glow-purple"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-purple bg-accent-violet/15">
            <Atom size={28} className="text-accent-glow" />
          </div>

          <h1 className="text-center font-heading text-2xl font-bold capitalize">
            {mode === 'login' ? `${tab} login` : `create ${tab} account`}
          </h1>
          <p className="mt-1 text-center text-sm text-[var(--text-secondary)]">
            {mode === 'login' ? 'Continue your goal journey' : 'Align your team & cycle goals'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-center text-sm text-accent-red"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {mode === 'signup' && (
              <motion.label
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="block"
              >
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Full Name
                </span>
                <div className="relative mt-1.5">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
                  />
                </div>
              </motion.label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Email Address
              </span>
              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@acme.com"
                  className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Password
              </span>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
                />
              </div>
            </label>

            {mode === 'signup' && tab !== 'admin' && (
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="block"
              >
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Department
                </span>
                <div className="relative mt-1.5">
                  <Briefcase
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering, Sales, Marketing..."
                    className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
                  />
                </div>
              </motion.label>
            )}

            {mode === 'signup' && tab === 'admin' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 pt-2 border-t border-white/5"
              >
                <div className="flex items-center gap-1.5 text-xs text-accent-glow font-medium">
                  <Info size={14} />
                  Organization setup details
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Organization Name
                  </span>
                  <div className="relative mt-1.5">
                    <Building
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Industry
                    </span>
                    <select
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value)}
                      className="w-full mt-1.5 rounded-xl border border-purple bg-bg-elevated py-3 px-3 text-sm text-[var(--text-primary)] focus:border-purple-strong focus:outline-none"
                    >
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>Education</option>
                      <option>Manufacturing</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Size
                    </span>
                    <select
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value)}
                      className="w-full mt-1.5 rounded-xl border border-purple bg-bg-elevated py-3 px-3 text-sm text-[var(--text-primary)] focus:border-purple-strong focus:outline-none"
                    >
                      <option>1-10 employees</option>
                      <option>10-50 employees</option>
                      <option>50-250 employees</option>
                      <option>250+ employees</option>
                    </select>
                  </label>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl border border-purple-strong bg-accent-violet py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:bg-accent-violet/90 transition-all duration-300"
            >
              {mode === 'login' ? 'Sign in' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center text-sm">
            <span className="text-[var(--text-muted)]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
              }}
              className="text-accent-glow hover:underline font-semibold"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Demo ({tab}): {tabHint}
          </p>
          <p className="mt-3 text-center text-sm">
            <Link to="/" className="text-accent-glow hover:underline">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
