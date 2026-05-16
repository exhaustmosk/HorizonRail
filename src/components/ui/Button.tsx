import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary:
    'bg-accent-violet border border-purple-strong text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:bg-accent-violet/90',
  secondary:
    'bg-bg-elevated border border-purple hover:border-purple-strong text-[var(--text-primary)]',
  ghost:
    'bg-transparent border border-transparent hover:border-purple text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger:
    'bg-accent-red/15 text-accent-red border border-accent-red/40 hover:bg-accent-red/25',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
