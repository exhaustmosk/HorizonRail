import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  BarChart3,
  Users,
  Shield,
  FileText,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { COMPANY_NAME } from '../../lib/constants'

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-goals', label: 'My Goals', icon: Target },
  { to: '/dashboard', label: 'Check-ins', icon: CalendarCheck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const managerLinks = [
  { to: '/manager', label: 'Team Overview', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const adminLinks = [
  { to: '/admin', label: 'Admin Panel', icon: Shield },
  { to: '/audit', label: 'Audit Log', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'manager'
        ? managerLinks
        : employeeLinks

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-[var(--border-subtle)] bg-bg-surface">
      <div className="border-b border-[var(--border-subtle)] p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-violet font-heading text-sm font-bold">
          AQ
        </div>
        <p className="mt-2 font-heading text-sm font-bold">{COMPANY_NAME}</p>
        <p className="text-xs text-[var(--text-secondary)]">Goal Portal</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to + label}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent-violet/15 text-accent-violet'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="mb-2 rounded-lg bg-[var(--bg-glass)] px-3 py-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-[var(--text-secondary)] capitalize">
            {user?.role}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-accent-red"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
