import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../../lib/constants'

const links = [
  { to: '/policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/acceptable-use', label: 'Acceptable Use' },
  { to: '/cookies', label: 'Cookie Notice' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-purple bg-bg-surface/80 px-4 py-12 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-heading text-lg font-bold text-gradient-purple">
            {PRODUCT_NAME}
          </p>
          <p className="mt-2 max-w-xs text-sm text-[var(--text-secondary)]">
            Performance goals, quarterly check-ins, and team visibility — built for
            modern organizations.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Legal
          </p>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-[var(--text-secondary)] hover:text-accent-glow"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Product
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li>
              <a href="/#features" className="hover:text-accent-glow">
                Features
              </a>
            </li>
            <li>
              <a href="/#check-ins" className="hover:text-accent-glow">
                Quarterly check-ins
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-accent-glow">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Contact
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            support@horizonrail.app
            <br />
            Enterprise: sales@horizonrail.app
          </p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-purple/40 pt-6 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved. Demo environment —
        frontend prototype only.
      </p>
    </footer>
  )
}
