import { scoreColor } from '../../lib/scoreEngine'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
}

export default function ProgressBar({
  value,
  max = 100,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const color = scoreColor(pct)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
          <span>Progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
