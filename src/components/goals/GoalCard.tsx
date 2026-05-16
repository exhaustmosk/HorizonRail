import { Lock } from 'lucide-react'
import type { Goal } from '../../types'
import { computeScore } from '../../lib/scoreEngine'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'

interface GoalCardProps {
  goal: Goal
  onLogAchievement?: () => void
  checkInActive?: boolean
}

const statusVariant = {
  not_started: 'default' as const,
  on_track: 'success' as const,
  completed: 'success' as const,
  at_risk: 'danger' as const,
}

export default function GoalCard({
  goal,
  onLogAchievement,
  checkInActive = false,
}: GoalCardProps) {
  const actual = goal.quarterlyActuals.at(-1)?.actual ?? 0
  const score = computeScore(goal, actual)
  const status = goal.quarterlyActuals.at(-1)?.status ?? 'not_started'

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{goal.title}</h3>
            {goal.isAdminPushed && <Lock size={14} className="text-accent-amber" />}
          </div>
          <span className="mt-1 inline-block">
            <Badge>{goal.thrustArea}</Badge>
          </span>
        </div>
        <Badge variant={statusVariant[status]}>
          {status.replace('_', ' ')}
        </Badge>
      </div>
      <ProgressBar value={score} showLabel />
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[var(--bg-glass)] px-2 py-0.5 text-xs">
          {goal.weightage}% weight
        </span>
        {onLogAchievement && (
          <Button
            size="sm"
            variant="secondary"
            disabled={goal.locked || !checkInActive}
            onClick={onLogAchievement}
          >
            Log achievement
          </Button>
        )}
      </div>
    </Card>
  )
}
