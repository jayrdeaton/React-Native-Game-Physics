export interface GoalWedge {
  startAngle: number
  sweepAngle: number
}

// Divides a goal crease's half-circle (a 180° arc) into `count` equal pie wedges — one per point
// needed to win — so a renderer can fill in one wedge per point already scored as a running
// win-progress indicator drawn right on the crease itself. Wedges start from `baseAngle` (wherever
// the crease's own arc starts) and sweep in the same clockwise direction the arc is drawn in, so
// consecutive wedges tile the crease edge-to-edge with no gaps or overlaps.
export function computeGoalWedges(count: number, baseAngle: number): GoalWedge[] {
  const sweepAngle = 180 / count
  return Array.from({ length: count }, (_, i) => ({ startAngle: baseAngle + i * sweepAngle, sweepAngle }))
}
