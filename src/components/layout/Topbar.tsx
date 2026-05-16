import type { ReactNode } from 'react'
import { FISCAL_YEAR } from '../../lib/constants'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="border-b border-purple bg-bg-surface/60 px-4 py-5 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">{title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {subtitle ?? FISCAL_YEAR}
          </p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
