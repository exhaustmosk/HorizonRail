import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../../components/layout/TopNav'
import SiteFooter from '../../components/landing/SiteFooter'
import { PRODUCT_NAME } from '../../lib/constants'

interface LegalLayoutProps {
  title: string
  updated: string
  children: ReactNode
}

export default function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-mesh">
      <TopNav />
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Link
          to="/"
          className="text-sm text-accent-glow hover:underline"
        >
          ← Back to {PRODUCT_NAME}
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: {updated}</p>
        <div className="prose-legal mt-8 space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {children}
        </div>
      </article>
      <SiteFooter />
    </div>
  )
}
