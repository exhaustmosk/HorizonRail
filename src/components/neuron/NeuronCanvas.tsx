import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import type { Employee, Goal } from '../../types'
import { computeScore, computeWeightedScore, scoreColor } from '../../lib/scoreEngine'
import { useNeuronPhysics } from './useNeuronPhysics'
import type { CanvasState, HoverTarget } from './types'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useGoalStore } from '../../store/goalStore'

interface NeuronCanvasProps {
  employees: Employee[]
  companyName: string
}

const CENTER_R = 44
const EMP_R = 28
const GOAL_SAT_R = 10
const GOAL_ZOOM_R = 40

function shortTitle(title: string) {
  return title.length > 12 ? `${title.slice(0, 10)}…` : title
}

function goalScore(goal: Goal) {
  const actual = goal.quarterlyActuals.at(-1)?.actual ?? 0
  return computeScore(goal, actual)
}

function EmployeeDetailPanel({
  employee,
  onBack,
  onGoalClick,
}: {
  employee: Employee
  onBack: () => void
  onGoalClick: (idx: number) => void
}) {
  const score = Math.round(computeWeightedScore(employee.goals))
  const pending = employee.goals.some((g) => g.approvalStatus === 'submitted')

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </Button>
          <div>
            <h3 className="font-heading font-bold">{employee.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {employee.department} · {score}% overall
            </p>
          </div>
        </div>
        {pending && <Badge variant="warning">Pending approval</Badge>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {employee.goals.map((g, i) => {
          const pct = Math.round(goalScore(g))
          return (
            <motion.button
              key={g.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onGoalClick(i)}
              className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-3 text-left hover:border-[var(--border-hover)]"
            >
              <p className="text-sm font-medium">{g.title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {g.thrustArea}
              </p>
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: scoreColor(pct) }}
              >
                {pct}%
              </p>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

function GoalDetailPanel({
  goal,
  employee,
  onBack,
}: {
  goal: Goal
  employee: Employee
  onBack: () => void
}) {
  const approveGoal = useGoalStore((s) => s.approveGoal)
  const rejectGoal = useGoalStore((s) => s.rejectGoal)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const pct = Math.round(goalScore(goal))

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-5"
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
        <ArrowLeft size={16} /> Back to {employee.name}
      </Button>
      <h3 className="font-heading text-lg font-bold">{goal.title}</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{goal.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{goal.thrustArea}</Badge>
        <Badge variant="info">{goal.uom}</Badge>
        <Badge variant={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>
          {pct}% score
        </Badge>
        <Badge>{goal.weightage}% weight</Badge>
      </div>
      {goal.approvalStatus === 'submitted' && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => approveGoal(employee.id, goal.id)}>
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowReject(true)}
          >
            Reject
          </Button>
        </div>
      )}
      {showReject && (
        <div className="mt-3 space-y-2">
          <textarea
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-bg-elevated p-2 text-sm"
            placeholder="Rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              rejectGoal(employee.id, goal.id, rejectReason)
              setShowReject(false)
            }}
          >
            Confirm reject
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export default function NeuronCanvas({
  employees,
  companyName,
}: NeuronCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const { animT, tick, pulse } = useNeuronPhysics()

  const [state, setState] = useState<CanvasState>('overview')
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null)
  const [hovered, setHovered] = useState<HoverTarget | null>(null)
  const hoveredRef = useRef<HoverTarget | null>(null)

  const getEmpPos = useCallback(
    (i: number, W: number, H: number) => {
      const angle = (i / employees.length) * Math.PI * 2 - Math.PI / 2
      return {
        x: W / 2 + Math.cos(angle) * W * 0.32,
        y: H / 2 + Math.sin(angle) * H * 0.36,
      }
    },
    [employees.length],
  )

  const getGoalPos = useCallback(
    (
      empIdx: number,
      gIdx: number,
      total: number,
      W: number,
      H: number,
    ) => {
      const emp = getEmpPos(empIdx, W, H)
      const baseAngle =
        (empIdx / employees.length) * Math.PI * 2 - Math.PI / 2
      const angle = baseAngle + (gIdx - (total - 1) / 2) * 0.6
      return {
        x: emp.x + Math.cos(angle) * 75,
        y: emp.y + Math.sin(angle) * 75,
      }
    },
    [employees.length, getEmpPos],
  )

  const drawBubble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fill: string,
    stroke: string,
    label?: string,
    sublabel?: string,
    fillPct?: number,
    pulseAmt?: number,
  ) => {
    if (pulseAmt !== undefined) {
      const p = pulse(animT.current)
      ctx.beginPath()
      ctx.arc(x, y, r + p * pulseAmt, 0, Math.PI * 2)
      ctx.strokeStyle = stroke
      ctx.globalAlpha = 0.3
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (fillPct !== undefined && fillPct > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.clip()
      const h = (fillPct / 100) * r * 2
      ctx.fillStyle = fill.replace('0.25', '0.6').replace('30%', '60%')
      if (!fill.includes('rgba')) {
        ctx.globalAlpha = 0.6
        ctx.fillStyle = fill
      }
      ctx.fillRect(x - r, y + r - h, r * 2, h)
      ctx.restore()
    }

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()

    if (label) {
      ctx.fillStyle = '#E8E6F0'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = r > 30 ? 'bold 11px DM Sans, sans-serif' : 'bold 10px DM Sans, sans-serif'
      ctx.fillText(label, x, sublabel ? y - 6 : y)
      if (sublabel) {
        ctx.font = '10px DM Sans, sans-serif'
        ctx.fillStyle = '#888780'
        ctx.fillText(sublabel, x, y + 8)
      }
    }
  }

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashed = false,
    color = 'rgba(255,255,255,0.08)',
  ) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    if (dashed) ctx.setLineDash([4, 4])
    else ctx.setLineDash([])
    ctx.stroke()
    ctx.setLineDash([])
  }

  const drawOverview = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const cx = W / 2
    const cy = H / 2
    const t = tick()

    drawBubble(
      ctx,
      cx,
      cy,
      CENTER_R,
      '#6C63FF',
      '#6C63FF',
      companyName.slice(0, 8),
      undefined,
      undefined,
      6,
    )

    employees.forEach((emp, i) => {
      const pos = getEmpPos(i, W, H)
      const score = Math.round(computeWeightedScore(emp.goals))
      const color = scoreColor(score)

      drawLine(ctx, cx, cy, pos.x, pos.y, false)

      drawBubble(
        ctx,
        pos.x,
        pos.y,
        EMP_R,
        '#1D9E75',
        color,
        emp.initials,
        `${score}%`,
        score,
        hoveredRef.current?.type === 'emp' && hoveredRef.current.idx === i
          ? 6
          : 0,
      )

      emp.goals.forEach((g, gi) => {
        const gpos = getGoalPos(i, gi, emp.goals.length, W, H)
        const gpct = goalScore(g)
        const gc = scoreColor(gpct)
        drawLine(ctx, pos.x, pos.y, gpos.x, gpos.y, true, gc + '44')
        ctx.beginPath()
        ctx.arc(gpos.x, gpos.y, GOAL_SAT_R, 0, Math.PI * 2)
        ctx.fillStyle = gc + '4D'
        ctx.fill()
        ctx.strokeStyle = gc
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    })
    void t
  }

  const drawZoomed = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    empIdx: number,
  ) => {
    const emp = employees[empIdx]
    const cx = W / 2
    const cy = H / 2
    const score = Math.round(computeWeightedScore(emp.goals))
    const color = scoreColor(score)

    drawBubble(
      ctx,
      cx,
      cy,
      CENTER_R + 8,
      '#1D9E75',
      color,
      emp.initials,
      `${score}%`,
      score,
      6,
    )

    emp.goals.forEach((g, gi) => {
      const angle = (gi - (emp.goals.length - 1) / 2) * 0.8
      const gpos = {
        x: cx + Math.cos(angle - Math.PI / 2) * 130,
        y: cy + Math.sin(angle - Math.PI / 2) * 130,
      }
      const gpct = Math.round(goalScore(g))
      const gc = scoreColor(gpct)

      drawLine(ctx, cx, cy, gpos.x, gpos.y, true, gc + '66')

      drawBubble(
        ctx,
        gpos.x,
        gpos.y,
        GOAL_ZOOM_R,
        gc + '40',
        gc,
        shortTitle(g.title),
        `${gpct}%`,
        gpct,
        hoveredRef.current?.type === 'goal' &&
          hoveredRef.current.idx === gi
          ? 6
          : 0,
      )
    })
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.width / dpr
    const H = canvas.height / dpr

    ctx.clearRect(0, 0, W, H)

    if (state === 'overview') drawOverview(ctx, W, H)
    else if (state === 'zoomed' && selectedEmp !== null)
      drawZoomed(ctx, W, H, selectedEmp)

    animFrameRef.current = requestAnimationFrame(draw)
  }, [state, selectedEmp, employees, companyName, getEmpPos, getGoalPos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [state])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  const hitTest = (mx: number, my: number): HoverTarget | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = mx - rect.left
    const y = my - rect.top
    const W = rect.width
    const H = rect.height

    if (state === 'overview') {
      for (let i = employees.length - 1; i >= 0; i--) {
        const pos = getEmpPos(i, W, H)
        if (Math.hypot(x - pos.x, y - pos.y) < EMP_R + 4)
          return { type: 'emp' as const, idx: i }
      }
      const cx = W / 2
      const cy = H / 2
      if (Math.hypot(x - cx, y - cy) < CENTER_R) return { type: 'center', idx: 0 }
    } else if (state === 'zoomed' && selectedEmp !== null) {
      const emp = employees[selectedEmp]
      const cx = W / 2
      const cy = H / 2
      for (let gi = emp.goals.length - 1; gi >= 0; gi--) {
        const angle = (gi - (emp.goals.length - 1) / 2) * 0.8
        const gpos = {
          x: cx + Math.cos(angle - Math.PI / 2) * 130,
          y: cy + Math.sin(angle - Math.PI / 2) * 130,
        }
        if (Math.hypot(x - gpos.x, y - gpos.y) < GOAL_ZOOM_R + 4)
          return { type: 'goal' as const, idx: gi }
      }
    }
    return null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e.clientX, e.clientY)
    hoveredRef.current = hit
    setHovered(hit)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? 'pointer' : 'default'
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = hitTest(e.clientX, e.clientY)
    if (!hit) return

    if (state === 'overview' && hit.type === 'emp') {
      setSelectedEmp(hit.idx)
      setState('zoomed')
    } else if (state === 'zoomed' && hit.type === 'goal') {
      setSelectedGoal(hit.idx)
      setState('goal_detail')
    }
  }

  const height = state === 'overview' ? 580 : 380

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative w-full"
    >
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          hoveredRef.current = null
          setHovered(null)
        }}
        onClick={handleClick}
      />
      {hovered && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-bg-elevated px-2 py-1 text-xs text-[var(--text-secondary)]">
          {hovered.type === 'emp'
            ? employees[hovered.idx]?.name
            : 'Click to explore'}
        </div>
      )}

      <AnimatePresence>
        {state === 'zoomed' && selectedEmp !== null && (
          <EmployeeDetailPanel
            employee={employees[selectedEmp]}
            onBack={() => {
              setState('overview')
              setSelectedEmp(null)
            }}
            onGoalClick={(gIdx) => {
              setSelectedGoal(gIdx)
              setState('goal_detail')
            }}
          />
        )}
      </AnimatePresence>

      {state === 'goal_detail' &&
        selectedEmp !== null &&
        selectedGoal !== null && (
          <GoalDetailPanel
            goal={employees[selectedEmp].goals[selectedGoal]}
            employee={employees[selectedEmp]}
            onBack={() => setState('zoomed')}
          />
        )}
    </motion.div>
  )
}
