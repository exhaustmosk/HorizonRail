import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target,
  Network,
  BarChart3,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import TopNav from '../components/layout/TopNav'

const features = [
  {
    icon: Network,
    title: 'Neuron knowledge maps',
    desc: 'Obsidian-style graphs connect goals, tasks, and check-ins — with live physics and team zoom views.',
  },
  {
    icon: Target,
    title: 'Weighted goal sheets',
    desc: 'Thrust areas, UoM scoring, and 100% weightage validation built into every submission.',
  },
  {
    icon: BarChart3,
    title: 'Achievement intelligence',
    desc: 'Heatmaps, QoQ trends, and exportable reports for leaders and HR.',
  },
  {
    icon: Shield,
    title: 'Governance & audit',
    desc: 'Approval workflows, admin KPI pushes, cycle locks, and a full audit trail.',
  },
]

const stats = [
  { value: '98%', label: 'Goal sheet compliance' },
  { value: '4×', label: 'Faster check-ins' },
  { value: '150+', label: 'Teams onboarded' },
  { value: '24/7', label: 'Progress visibility' },
]

export default function Landing() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-mesh">
      <TopNav />

      <section className="relative overflow-hidden px-4 pb-20 pt-16 lg:px-8 lg:pt-24">
        {/* Decorative Floating Elements */}
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto max-w-4xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple px-4 py-1.5 text-xs font-medium text-accent-glow">
            <Zap size={14} />
            Goal Setting & Tracking · FY 2025-26
          </p>
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Align every goal.
            <br />
            <span className="text-gradient-purple">See the whole picture.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            AtomQuest is Acme&apos;s performance portal — neuron maps for managers,
            personal knowledge graphs for employees, and enterprise-grade governance
            for HR.
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
            {user ? (
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 rounded-xl border border-purple px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-purple-strong hover:text-[var(--text-primary)]"
              >
                <Network size={16} />
                Solar analysis map
              </Link>
            ) : (
              <a
                href="#solar-preview"
                className="inline-flex items-center gap-2 rounded-xl border border-purple px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-purple-strong hover:text-[var(--text-primary)]"
              >
                <Network size={16} />
                See the graph model
              </a>
            )}
            <a
              href="#features"
              className="rounded-xl border border-purple/60 px-6 py-3 text-sm font-medium text-[var(--text-muted)] hover:border-purple hover:text-[var(--text-secondary)]"
            >
              Features
            </a>
          </motion.div>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-purple bg-bg-card/80 p-4 text-center backdrop-blur"
            >
              <p className="font-heading text-2xl font-bold text-accent-glow">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solar-preview" className="border-t border-purple px-4 py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-glow">
              Analysis view
            </p>
            <h2 className="font-heading text-3xl font-bold">
              Your goals as a solar system
            </h2>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              You at the center. GOALS as a planet. Each target orbits as a moon —
              color-coded green, yellow, red, or purple so status is obvious at a glance.
              Zoom out for the big picture; zoom in for titles and details.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Completed
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" /> In progress
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> At risk
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c4b5fd]" /> Not started
              </li>
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto aspect-square w-full max-w-md"
          >
            <div className="absolute inset-0 rounded-full border border-purple/40 bg-accent-violet/10 blur-sm" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 48, ease: 'linear' }}
              className="absolute inset-8 rounded-full border border-dashed border-purple/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
              className="absolute inset-16 rounded-full border border-purple/20"
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-violet font-heading text-xs font-bold text-white shadow-lg glow-purple-sm"
            >
              You
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute left-1/2 top-6 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-indigo-500/90 text-[10px] font-bold text-white"
            >
              GOALS
            </motion.div>
            {[
              { color: '#22c55e', top: '28%', left: '72%' },
              { color: '#fbbf24', top: '62%', left: '78%' },
              { color: '#ef4444', top: '70%', left: '35%' },
              { color: '#c4b5fd', top: '38%', left: '22%' },
            ].map((m, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, i % 2 ? 4 : -4, 0] }}
                transition={{ repeat: Infinity, duration: 3 + i, ease: 'easeInOut' }}
                className="absolute h-5 w-5 rounded-full shadow-md"
                style={{ background: m.color, top: m.top, left: m.left }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="border-t border-purple bg-bg-surface/50 px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-3xl font-bold">
            Built for how modern teams work
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--text-secondary)]">
            From individual contributors to VPs — one platform, multiple views.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
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
          <div>
            <h2 className="font-heading text-3xl font-bold">Who we are</h2>
            <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
              AtomQuest is Acme Corp&apos;s internal performance operating system.
              We believe goals should feel connected — not scattered across
              spreadsheets. Our neuron visualization layer makes dependencies
              visible: how your targets link to team outcomes and company thrust
              areas.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Employees get a personal graph of goals, tasks, and check-ins',
                'Managers see team health in one interactive bubble map',
                'Admins configure cycles, push KPIs, and maintain audit compliance',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-accent-glow"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-purple-strong bg-bg-card p-8 glow-purple">
            <Users className="mb-4 text-accent-glow" size={32} />
            <h3 className="font-heading text-xl font-bold">Our mission</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              Democratize clarity. Every person should know what matters this
              quarter, how they&apos;re tracking, and what to do next — without
              chasing status updates.
            </p>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Powered by weighted scoring engines, quarterly check-in cycles, and
              manager approval workflows aligned to Acme&apos;s FY26 operating plan.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-purple px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-purple-strong bg-bg-elevated p-10 text-center glow-purple">
          <h2 className="font-heading text-2xl font-bold">Ready to map your goals?</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Browse the product overview above — sign in only when you want your workspace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={user ? '/analysis' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-violet px-6 py-3 font-medium text-white hover:bg-accent-violet/90"
            >
              {user ? 'Open analysis map' : 'Sign in'} <ArrowRight size={16} />
            </Link>
            {!user && (
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-purple px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Keep exploring
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-purple px-4 py-8 text-center text-xs text-[var(--text-muted)]">
        © 2026 Acme Corp · AtomQuest Goal Portal
      </footer>
    </div>
  )
}
