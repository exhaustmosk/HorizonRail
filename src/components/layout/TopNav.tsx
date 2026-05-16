import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  BarChart3,
  Users,
  Shield,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { COMPANY_NAME, FISCAL_YEAR } from '../../lib/constants'

const employeeLinks = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/my-goals', label: 'My Goals', icon: Target },
  { to: '/dashboard', label: 'Check-ins', icon: CalendarCheck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const managerLinks = [
  { to: '/manager', label: 'Team', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const adminLinks = [
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/audit', label: 'Audit', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function TopNav() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'manager'
        ? managerLinks
        : employeeLinks

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-purple bg-bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 lg:px-6">
        <Link to={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple bg-accent-violet/20 font-heading text-xs font-bold text-accent-glow">
            AQ
          </div>
          <div className="hidden sm:block">
            <p className="font-heading text-sm font-bold leading-none">{COMPANY_NAME}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{FISCAL_YEAR}</p>
          </div>
        </Link>

        {user && (
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-violet/15 text-accent-glow'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:block"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-purple bg-accent-violet px-4 py-2 text-sm font-medium text-white hover:bg-accent-violet/90"
              >
                Get started
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 rounded-lg border border-purple px-2 py-1.5 pl-1.5 hover:bg-[var(--bg-glass)]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-violet/30 text-xs font-bold text-accent-glow">
                  {user.initials}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm sm:block">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} className="text-[var(--text-secondary)]" />
              </button>
              {userOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-purple-strong bg-bg-elevated p-2 glow-purple-sm">
                    <p className="px-3 py-2 text-sm font-medium">{user.name}</p>
                    <p className="px-3 pb-2 text-xs capitalize text-[var(--text-secondary)]">
                      {user.role}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-red hover:bg-accent-red/10"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {user && (
            <button
              type="button"
              className="rounded-lg border border-purple p-2 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <nav className="border-t border-purple px-4 py-3 md:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? 'text-accent-glow' : 'text-[var(--text-secondary)]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
