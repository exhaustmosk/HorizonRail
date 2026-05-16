import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Atom, Activity } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import TopNav from '../components/layout/TopNav'

type LoginTab = 'employee' | 'manager'

export default function Login() {
  const [tab, setTab] = useState<LoginTab>('employee')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = login(email, password)
    if (!ok) {
      setError('Invalid credentials. Try priya@acme.com / pass')
      return
    }
    const user = useAuthStore.getState().user
    if (user?.role === 'manager') navigate('/manager')
    else if (user?.role === 'admin') navigate('/admin')
    else navigate('/dashboard')
  }

  const tabHint =
    tab === 'employee'
      ? 'priya@acme.com / pass'
      : 'ramesh@acme.com or divya@acme.com / pass'

  return (
    <div className="min-h-screen bg-mesh">
      <TopNav />

      <div className="flex flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-6 flex items-center gap-2 text-[var(--text-secondary)] hover:text-accent-glow">
          <Atom size={22} className="text-accent-glow" />
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">
            AtomQuest
          </span>
        </Link>
        <p className="mb-8 text-center text-sm text-[var(--text-secondary)]">
          Goal Setting & Performance Portal
        </p>

        <div className="mb-6 flex gap-1 rounded-xl border border-purple bg-bg-card p-1">
          {(['employee', 'manager'] as LoginTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? 'bg-accent-violet/20 text-accent-glow shadow-[inset_0_-2px_0_#a855f7]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t} login
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
            {tab} login
          </h1>
          <p className="mt-1 text-center text-sm text-[var(--text-secondary)]">
            Continue your FY26 goal journey
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <p className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-center text-sm text-accent-red">
                {error}
              </p>
            )}

            <label className="block">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Email
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
                  className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
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
                  className="w-full rounded-xl border border-purple bg-bg-elevated py-3 pl-10 pr-4 text-sm placeholder:text-[var(--text-muted)] focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/50"
                />
              </div>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl border border-purple-strong bg-accent-violet py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:bg-accent-violet/90"
            >
              Sign in
            </button>

            <button
              type="button"
              className="w-full rounded-xl border border-purple py-3 text-sm text-[var(--text-secondary)] hover:border-purple-strong hover:text-[var(--text-primary)]"
            >
              Sign in with Microsoft
            </button>
          </form>

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
