import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-glass)] text-[var(--text-secondary)]',
  success: 'bg-accent-teal/20 text-accent-teal',
  warning: 'bg-accent-amber/20 text-accent-amber',
  danger: 'bg-accent-red/20 text-accent-red',
  info: 'bg-accent-blue/20 text-accent-blue',
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}
