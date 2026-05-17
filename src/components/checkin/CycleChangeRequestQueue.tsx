import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useCycleStore } from '../../store/cycleStore'
import { useAuthStore } from '../../store/authStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface CycleChangeRequestQueueProps {
  showAll?: boolean
}

export default function CycleChangeRequestQueue({
  showAll = false,
}: CycleChangeRequestQueueProps) {
  const user = useAuthStore((s) => s.user)
  const requests = useCycleStore((s) => s.changeRequests)
  const reviewChangeRequest = useCycleStore((s) => s.reviewChangeRequest)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const visible = showAll
    ? requests
    : requests.filter((r) => r.status === 'pending')

  if (visible.length === 0) {
    return (
      <Card className="text-center text-sm text-[var(--text-secondary)]">
        No pending cycle change requests.
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {visible.map((r) => (
        <Card key={r.id} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{r.summary}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {r.requestedByName} · {r.requestedAt.toLocaleString()}
              </p>
            </div>
            <Badge
              variant={
                r.status === 'approved'
                  ? 'success'
                  : r.status === 'rejected'
                    ? 'danger'
                    : 'warning'
              }
            >
              {r.status}
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{r.reason}</p>
          {r.reviewNote && (
            <p className="rounded-lg bg-bg-elevated px-3 py-2 text-xs">
              Admin: {r.reviewNote}
            </p>
          )}
          {r.status === 'pending' && user?.role === 'admin' && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
              {reviewId === r.id ? (
                <>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Review note (optional)"
                    className="min-w-[200px] flex-1 rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-1.5 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      reviewChangeRequest(
                        r.id,
                        'approved',
                        note,
                        user.id,
                        user.name,
                      )
                      setReviewId(null)
                      setNote('')
                    }}
                  >
                    <Check size={14} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      reviewChangeRequest(
                        r.id,
                        'rejected',
                        note || 'Rejected',
                        user.id,
                        user.name,
                      )
                      setReviewId(null)
                      setNote('')
                    }}
                  >
                    <X size={14} /> Reject
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setReviewId(r.id)}>
                  Review
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
