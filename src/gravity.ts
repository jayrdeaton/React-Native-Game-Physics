import { add, length, scale, subtract, type Vec2 } from '@tastic/core'

import { clampSpeed } from './velocity'

export interface GravityWell {
  center: Vec2
  radius: number
  strength: number
  // A well normally only pulls/repels while the object's own speed is above `stopThreshold` (see
  // applyGravityWells' options) — otherwise a strong-enough well could hold an object in a
  // friction/force equilibrium above that threshold forever, softlocking a "stopped" check that never
  // fires. Set this for a well whose entire purpose is to evict an already-stopped object (e.g. a
  // corner repeller meant to keep things from resting in a dead zone), where that softlock risk
  // doesn't apply.
  activeAtRest?: boolean
}

export interface ApplyGravityWellsOptions {
  // See GravityWell.activeAtRest — the speed below which a non-activeAtRest well stops pulling.
  stopThreshold: number
  // Caps the resulting speed after every well's pull is applied this step, so a dt-clamped frame
  // hitch near a strong well can't blow velocity up in one step.
  maxSpeed: number
  // Wells closer than this are skipped entirely, guarding the `dx/dist` normalization below against
  // a near-zero distance. Defaults to a small epsilon.
  minDistance?: number
}

const DEFAULT_MIN_DISTANCE = 0.01

// Localized attractor/repeller field: force falls off quadratically from `strength` at the well's own
// center to exactly 0 at `well.radius` (bounded, unlike an inverse-square field, so a single dt-clamped
// step near a strong well can't blow up velocity) — positive strength attracts, negative repels.
// Composable across multiple simultaneous wells: call once per well, or reduce over `wells` yourself,
// summing each well's own acceleration before integrating once. This version accumulates every well's
// acceleration and integrates once, matching that composed behavior for a whole list in one call.
export function applyGravityWells(position: Vec2, velocity: Vec2, wells: GravityWell[], dt: number, options: ApplyGravityWellsOptions): Vec2 {
  if (wells.length === 0) return velocity
  const minDistance = options.minDistance ?? DEFAULT_MIN_DISTANCE
  const speed = length(velocity)

  let ax = 0
  let ay = 0
  for (const well of wells) {
    if (!well.activeAtRest && speed < options.stopThreshold) continue
    const dx = well.center.x - position.x
    const dy = well.center.y - position.y
    const dist = Math.hypot(dx, dy)
    if (dist >= well.radius || dist < minDistance) continue
    const falloff = (1 - dist / well.radius) ** 2
    const accel = well.strength * falloff
    ax += (dx / dist) * accel
    ay += (dy / dist) * accel
  }
  if (ax === 0 && ay === 0) return velocity

  const pulled = { x: velocity.x + ax * dt, y: velocity.y + ay * dt }
  return clampSpeed(pulled, options.maxSpeed)
}

// An unbounded linear pull toward a single center — `a = -gravity*(position-center)`, strength grows
// with distance rather than falling off, and always applies (no radius, no stop-threshold gate). A
// different model from applyGravityWells' bounded, falloff-to-zero field: use this for a single
// always-on attractor/repeller with no edge to it (e.g. something drifting back toward a home point),
// and applyGravityWells for a bounded, enter-and-be-pulled well an object can be outside the influence
// of entirely. Positive gravity attracts (pulls toward center), negative repels.
export function applyGravityPull(position: Vec2, velocity: Vec2, center: Vec2, gravity: number, dt: number): Vec2 {
  'worklet'
  const pull = scale(subtract(position, center), -gravity * dt)
  return add(velocity, pull)
}
