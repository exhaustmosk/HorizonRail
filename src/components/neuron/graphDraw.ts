/** Straight edge between two points with optional arrowhead at the end. */
export function drawEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number,
  arrow = true,
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()

  if (arrow && len > 20) {
    const angle = Math.atan2(dy, dx)
    const size = 5
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4))
    ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }
}

/** @deprecated Use drawEdge — kept for any stale imports */
export const drawCurvedEdge = drawEdge
