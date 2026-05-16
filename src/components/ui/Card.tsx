import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={`rounded-xl border border-purple bg-bg-card p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-purple-strong' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
