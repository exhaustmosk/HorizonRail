export type CanvasState = 'overview' | 'zoomed' | 'goal_detail'

export interface HoverTarget {
  type: 'emp' | 'goal' | 'center'
  idx: number
}
