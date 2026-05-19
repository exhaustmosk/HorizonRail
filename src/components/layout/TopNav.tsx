import { useState } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LogOut, ChevronDown, Menu, X, Sun, Moon, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PRODUCT_NAME } from '../../lib/constants'

const employeeLinks = [
  { to: '/dashboard', label: 'Home' },
  { to: '/my-goals', label: 'My Goals' },
  { to: '/neuron-map', label: 'Neuron Map' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/reports', label: 'Reports' },
]

const managerLinks = [
  { to: '/manager', label: 'Team' },
  { to: '/manager/goals', label: 'Goal Sheet' },
  { to: '/neuron-map', label: 'Neuron Map' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/reports', label: 'Reports' },
]

const adminLinks = [
  { to: '/admin', label: 'Admin' },
  { to: '/neuron-map', label: 'Neuron Map' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/audit', label: 'Audit' },
  { to: '/reports', label: 'Reports' },
]

function BrandLogo() {
  return (
    <div className="glass-logo-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/50 to-violet-950/80">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-white" aria-hidden>
        <path
          fill="currentColor"
          d="M6 14V6h8l-3.2 3.2L14 12.4 10.4 9 6 14z"
          opacity="0.95"
        />
        <path fill="currentColor" d="M6 6h3.5L6 9.5V6z" opacity="0.55" />
      </svg>
    </div>
  )
}

export default function TopNav() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

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

  const closeMenus = () => {
    setMenuOpen(false)
    setUserOpen(false)
  }

  return (
    <header className="glass-header-shell sticky top-0 z-50">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-3"
          onClick={closeMenus}
        >
          <BrandLogo />
          <span className="font-heading text-base font-semibold text-white light:text-slate-900">
            {PRODUCT_NAME}
          </span>
        </Link>

        {user && (
          <nav className="glass-nav-bar absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full p-1 md:flex">
            {links.map(({ to, label }) => (
              <NavLink
                key={to + label}
                to={to}
                className={({ isActive }) =>
                  `glass-nav-link rounded-full px-4 py-2 text-sm font-medium ${isActive ? 'glass-nav-link-active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="glass-btn-ghost hidden rounded-full px-3 py-2 text-sm sm:block"
              >
                Log in
              </Link>
              <Link
                to="/login"
                className="glass-btn-primary rounded-full px-5 py-2 text-sm font-medium"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserOpen(!userOpen)}
                className="glass-btn-ghost flex items-center gap-2 text-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-700 text-xs font-bold text-white shadow-[0_0_16px_rgba(124,58,237,0.45)]">
                  {user.initials}
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${userOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#12101f]/95 p-2 backdrop-blur-xl">
                    <p className="px-3 py-2 text-sm font-medium text-white">{user.name}</p>
                    <p className="px-3 pb-2 text-xs capitalize text-slate-400">{user.role}</p>
                    <Link
                      to="/profile"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                      <User size={14} />
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="glass-btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user && (
            <button
              type="button"
              className="glass-btn-ghost rounded-full p-2 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <nav className="glass-nav-bar mx-4 mb-3 flex flex-col gap-0.5 rounded-2xl p-2 md:hidden lg:mx-8">
          {links.map(({ to, label }) => (
            <NavLink
              key={to + label}
              to={to}
              onClick={closeMenus}
              className={({ isActive }) =>
                `glass-nav-link rounded-xl px-4 py-2.5 text-sm ${isActive ? 'glass-nav-link-active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/profile"
            onClick={closeMenus}
            className="glass-nav-link flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
          >
            <User size={14} />
            My Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              closeMenus()
              handleLogout()
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </nav>
      )}
    </header>
  )
}
