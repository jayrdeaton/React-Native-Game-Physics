import type { Vec2 } from '@tastic/core'

export interface RoundedRectBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface AxisReflection {
  value: number
  velocity: number
  bounced: boolean
}

// The one piece of "bounce off a straight wall" math a rounded-rect boundary needs on a single axis —
// reflectCircleInRoundedRect below falls back to this per-axis everywhere except the four corner
// cells. Reflects the *overshoot* back inside (a fast-moving point 5px past the wall ends up 5px back
// inside it, not clamped flush to the wall) rather than merely stopping at the boundary, so a point
// that crosses the wall in one step doesn't lose the distance it should have traveled past it.
export function reflectAxis(value: number, velocity: number, min: number, max: number, restitution: number): AxisReflection {
  'worklet'
  if (value > max) return { value: max - (value - max), velocity: -velocity * restitution, bounced: true }
  if (value < min) return { value: min - (value - min), velocity: -velocity * restitution, bounced: true }
  return { value, velocity, bounced: false }
}

export interface CircleBoundaryReflection {
  position: Vec2
  velocity: Vec2
  bounced: boolean
}

// Keeps a circle of `radius` contained within a rounded-rectangle boundary (`bounds`, with corner
// radius `cornerRadius`), reflecting its velocity off whichever edge or corner it crosses. Degenerates
// to a plain axis-aligned rect at `cornerRadius = 0` (every point routes through reflectAxis, the four
// corner cells never trigger), and to a point (no inset) at `radius = 0` — so this one function covers
// a puck bouncing off a rink's outer wall (radius > 0, cornerRadius from a rounded-rink setting), a
// ball bouncing inside a rectangular play field (radius > 0, cornerRadius 0), and a drag point
// contained within a rounded screen boundary (radius 0) alike, rather than needing a separate function
// per shape.
//
// Internally insets `bounds` and `cornerRadius` by the circle's own radius (a circle of radius r
// touches a wall r px before its center would reach it), then applies the exact same rounded-rect
// reflection either function above already establishes: within the core cross of the rect (not near
// any corner) it's a plain per-axis reflectAxis; within a corner cell, once genuinely past the arc, it
// reflects the velocity about that arc's own outward normal instead of an axis. `restitution` scales
// how much speed survives the bounce — 1 is fully elastic, 0 stops the object dead along whichever
// normal it hit.
export function reflectCircleInRoundedRect(position: Vec2, velocity: Vec2, radius: number, bounds: RoundedRectBounds, cornerRadius: number, restitution: number): CircleBoundaryReflection {
  'worklet'
  const minX = bounds.minX + radius
  const maxX = bounds.maxX - radius
  const minY = bounds.minY + radius
  const maxY = bounds.maxY - radius
  const effCornerRadius = cornerRadius - radius

  const rectCenterX = (minX + maxX) / 2
  const rectCenterY = (minY + maxY) / 2
  const coreHalfWidth = (maxX - minX) / 2 - effCornerRadius
  const coreHalfHeight = (maxY - minY) / 2 - effCornerRadius
  const signX = position.x < rectCenterX ? -1 : 1
  const signY = position.y < rectCenterY ? -1 : 1
  const absX = Math.abs(position.x - rectCenterX)
  const absY = Math.abs(position.y - rectCenterY)

  if (absX <= coreHalfWidth || absY <= coreHalfHeight) {
    const rx = reflectAxis(position.x, velocity.x, minX, maxX, restitution)
    const ry = reflectAxis(position.y, velocity.y, minY, maxY, restitution)
    return { position: { x: rx.value, y: ry.value }, velocity: { x: rx.velocity, y: ry.velocity }, bounced: rx.bounced || ry.bounced }
  }

  const dx = absX - coreHalfWidth
  const dy = absY - coreHalfHeight
  const dist = Math.hypot(dx, dy)
  if (dist <= effCornerRadius) return { position, velocity, bounced: false }

  const nx = (signX * dx) / dist
  const ny = (signY * dy) / dist
  const velocityDotNormal = velocity.x * nx + velocity.y * ny
  const scale = effCornerRadius / dist
  const factor = (1 + restitution) * velocityDotNormal
  return {
    position: { x: rectCenterX + signX * (coreHalfWidth + dx * scale), y: rectCenterY + signY * (coreHalfHeight + dy * scale) },
    velocity: { x: velocity.x - factor * nx, y: velocity.y - factor * ny },
    bounced: true
  }
}
