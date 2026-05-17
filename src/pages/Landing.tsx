import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import {
  Target,
  Network,
  BarChart3,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  CalendarClock,
  ClipboardList,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { PRODUCT_NAME, PRODUCT_TAGLINE, FISCAL_YEAR } from '../lib/constants'
import TopNav from '../components/layout/TopNav'
import LandingAnalysisPreview from '../components/landing/LandingAnalysisPreview'
import SiteFooter from '../components/landing/SiteFooter'

const features = [
  {
    icon: Network,
    title: 'Neuron knowledge maps',
    desc: 'Interactive graphs connect goals, tasks, and check-ins — with team and org zoom views.',
  },
  {
    icon: Target,
    title: 'Weighted goal sheets',
    desc: 'Thrust areas, UoM scoring, and 100% weightage validation on every submission.',
  },
  {
    icon: CalendarClock,
    title: 'Quarterly check-ins',
    desc: 'Employees log planned vs. actual with status. Managers document structured discussions.',
  },
  {
    icon: Shield,
    title: 'Governance & audit',
    desc: 'Cycle windows, admin policy controls, manager change requests, and full audit trail.',
  },
]

const stats = [
  { value: 98, suffix: '%', label: 'Goal sheet compliance' },
  { value: 4, suffix: '×', label: 'Faster check-ins' },
  { value: 150, suffix: '+', label: 'Teams onboarded' },
  { value: 24, suffix: '/7', label: 'Progress visibility' },
]

function AnimatedStat({ value, suffix, label }: (typeof stats)[0]) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' })
    return controls.stop
  }, [count, value])

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: 'rgba(167, 139, 250, 0.5)' }}
      className="rounded-xl border border-purple bg-bg-card/80 p-4 text-center backdrop-blur transition-shadow hover:shadow-lg hover:shadow-violet-500/10"
    >
      <p className="font-heading text-2xl font-bold text-accent-glow">
        <motion.span>{rounded}</motion.span>
        {suffix}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
    </motion.div>
  )
}

export default function Landing() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-mesh">
      <TopNav />

      <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:px-8 lg:pt-24">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-accent-violet/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 1 }}
          className="absolute -right-20 top-40 h-64 w-64 rounded-full bg-accent-glow/20 blur-3xl"
        />
        <motion.div
          className="absolute left-1/2 top-32 h-px w-[min(90%,800px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
          animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto max-w-4xl text-center"
        >
          <motion.p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple px-4 py-1.5 text-xs font-medium text-accent-glow"
            animate={{ boxShadow: ['0 0 0 rgba(124,58,237,0)', '0 0 24px rgba(124,58,237,0.35)', '0 0 0 rgba(124,58,237,0)'] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Zap size={14} />
            {PRODUCT_NAME} · {FISCAL_YEAR}
          </motion.p>
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Every goal on track.
            <br />
            <span className="text-gradient-purple">One horizon for your team.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            {PRODUCT_TAGLINE} Neuron maps for leaders, personal graphs for contributors,
            and enforced quarterly windows for achievement capture.
          </p>
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-strong bg-accent-violet px-6 py-3 font-medium text-white glow-purple-sm hover:bg-accent-violet/90"
            >
              {user ? 'Open your workspace' : 'Sign in when ready'}
              <ArrowRight size={18} />
            </Link>
            <a
              href="#analysis-preview"
              className="inline-flex items-center gap-2 rounded-xl border border-purple px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-purple-strong hover:text-[var(--text-primary)]"
            >
              <Network size={16} />
              See analysis view
            </a>
            <a
              href="#check-ins"
              className="rounded-xl border border-purple/60 px-6 py-3 text-sm font-medium text-[var(--text-muted)] hover:border-purple hover:text-[var(--text-secondary)]"
            >
              Quarterly check-ins
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {stats.map((s) => (
            <AnimatedStat key={s.label} {...s} />
          ))}
        </motion.div>
      </section>

      <section
        id="analysis-preview"
        className="relative border-t border-purple px-4 py-20 lg:px-8"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08),transparent_70%)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-glow">
              Live analysis preview
            </p>
            <h2 className="font-heading text-3xl font-bold">
              Your goals as a living graph
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
              You at the center. GOALS and TASKS as hubs. Each target orbits with
              real-time links — color-coded so status is obvious. The preview animates
              planned-vs-actual sync as check-ins land.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
              {[
                { c: '#22c55e', l: 'Completed / on track' },
                { c: '#eab308', l: 'In progress' },
                { c: '#ef4444', l: 'At risk' },
                { c: '#c4b5fd', l: 'Not started' },
              ].map((x) => (
                <li key={x.l} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ background: x.c, color: x.c }}
                  />
                  {x.l}
                </li>
              ))}
            </ul>
          </motion.div>
          <LandingAnalysisPreview />
        </div>
      </section>

      <section id="check-ins" className="border-t border-purple bg-bg-surface/40 px-4 py-20 lg:px-8">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold">Quarterly rhythm, built in</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
              Employees capture planned vs. actual with status. Managers record structured
              check-in comments — all inside enforced cycle windows.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: 'Employee update',
                desc: 'Log planned & actual per goal. Pick Not Started, On Track, or Completed.',
              },
              {
                icon: BarChart3,
                title: 'Manager review',
                desc: 'Compare achievement across the team. Add discussion summary, blockers, and next steps.',
              },
              {
                icon: Shield,
                title: 'Admin control',
                desc: 'Configure quotas, shift windows, and approve manager change requests.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="rounded-xl border border-purple bg-bg-card p-6 glow-purple-sm"
              >
                <item.icon className="mb-3 text-accent-glow" size={24} />
                <h3 className="font-heading font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="features" className="border-t border-purple px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="text-center font-heading text-3xl font-bold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Built for how modern teams work
          </motion.h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--text-secondary)]">
            From individual contributors to executives — one platform, multiple views.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl border border-purple bg-bg-card p-6 glow-purple-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-purple bg-accent-violet/15 text-accent-glow">
                  <f.icon size={20} />
                </div>
                <h3 className="font-heading font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl font-bold">Who we are</h2>
            <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
              {PRODUCT_NAME} is a performance operating system for organizations that want
              clarity without spreadsheet chaos. Goals connect to outcomes; check-ins
              stay on schedule; managers and HR share one source of truth.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Employees log quarterly actuals with explicit status',
                'Managers see planned vs. achievement and document discussions',
                'Admins configure cycles, quotas, and audit compliance',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <CheckCircle2 size={18} className="shrink-0 text-accent-glow" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-purple-strong bg-bg-card p-8 glow-purple"
          >
            <Users className="mb-4 text-accent-glow" size={32} />
            <h3 className="font-heading text-xl font-bold">Our mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Keep every person aligned to what matters this quarter — with live
              visibility, fair scoring, and respectful governance.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-purple px-4 py-16 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl rounded-2xl border border-purple-strong bg-bg-elevated p-10 text-center glow-purple"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-2xl font-bold">Ready to ride the rail?</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Explore the live preview above — sign in when you want your workspace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={user ? '/check-ins' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-violet px-6 py-3 font-medium text-white hover:bg-accent-violet/90"
            >
              {user ? 'Open check-ins' : 'Sign in'} <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  )
}
