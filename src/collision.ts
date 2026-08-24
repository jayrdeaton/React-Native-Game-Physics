import { dot, type Vec2 } from '@tastic/core'

export interface Collision {
  hit: boolean
  // Unit vector, outward from the solid, into the moving circle's own free space — the convention
  // every collision function in this package uses, so reflectOffNormal's single `dot < 0` check works
  // against all of them without each caller needing to know which way a given function's normal
  // happens to point. Must stay unit length for reflectOffNormal's reflection formula to be correct.
  normal: Vec2
  // How far the circle is currently overlapping the solid, along the normal — push the circle's
  // center out by `depth` along `normal` to resolve the overlap before reflecting velocity.
  depth: number
}

const NO_HIT: Collision = { hit: false, normal: { x: 0, y: 0 }, depth: 0 }

// Circle vs. an axis-aligned solid rectangle (an interior obstacle/brick, not a boundary the circle is
// contained within — see reflectCircleInRoundedRect for that shape instead).
export function circleVsRect(circle: { position: Vec2; radius: number }, rect: { x: number; y: number; width: number; height: number }): Collision {
  const nearX = Math.max(rect.x, Math.min(circle.position.x, rect.x + rect.width))
  const nearY = Math.max(rect.y, Math.min(circle.position.y, rect.y + rect.height))
  const dx = circle.position.x - nearX
  const dy = circle.position.y - nearY
  const distSq = dx * dx + dy * dy
  if (distSq >= circle.radius * circle.radius) return NO_HIT
  const dist = Math.sqrt(distSq)
  // The circle's center exactly on the rect's boundary (dist ~ 0, e.g. dead-center on a corner) has no
  // well-defined push-out direction from position alone — falls back to straight up, an arbitrary but
  // stable choice, rather than dividing by zero.
  const normal = dist < 0.001 ? { x: 0, y: -1 } : { x: dx / dist, y: dy / dist }
  return { hit: true, normal, depth: circle.radius - dist }
}

// Circle vs. a solid circle (e.g. a goalpost, or any round obstacle).
export function circleVsCircle(circle: { position: Vec2; radius: number }, other: { position: Vec2; radius: number }): Collision {
  const dx = circle.position.x - other.position.x
  const dy = circle.position.y - other.position.y
  const dist = Math.hypot(dx, dy)
  const combined = circle.radius + other.radius
  if (dist >= combined) return NO_HIT
  const normal = dist < 0.001 ? { x: 0, y: -1 } : { x: dx / dist, y: dy / dist }
  return { hit: true, normal, depth: combined - dist }
}

// Reflects `velocity` off a surface with the given outward unit normal (see Collision.normal's own
// convention), scaled by `restitution` — 1 is a perfectly elastic bounce (speed fully preserved along
// the normal), 0 is perfectly inelastic (the normal component of velocity is removed entirely, leaving
// only the tangential/sliding component — the object stops moving *into* the surface but keeps
// whatever motion runs along it). A velocity already moving away from or parallel to the surface
// (dot >= 0) is returned untouched — nothing to reflect.
export function reflectOffNormal(velocity: Vec2, normal: Vec2, restitution: number): Vec2 {
  'worklet'
  const d = dot(velocity, normal)
  if (d >= 0) return velocity
  const factor = (1 + restitution) * d
  return { x: velocity.x - factor * normal.x, y: velocity.y - factor * normal.y }
}

export interface CircleBody {
  position: Vec2
  velocity: Vec2
}

export interface CircleCollisionResult {
  a: CircleBody
  b: CircleBody
  collided: boolean
}

// Equal-mass, head-on collision between two circles along the line connecting their centers:
// exchanging the *normal* component of each circle's velocity is the exact, closed-form result for
// two equal masses — it conserves total momentum exactly, and (at restitution 1) total kinetic energy
// too. The tangential component is untouched, matching a real collision between two smooth circles.
// `minDistance` is the sum of both circles' own radii — closer than that, they're overlapping and get
// pushed apart (each moves back half the overlap) regardless of whether they're still approaching or
// already separating; the velocity exchange itself only applies while they're still closing the
// distance (moving toward each other along the line of centers) — a pair that's overlapping but
// already separating gets left alone there, since applying an impulse to a collision that isn't
// actually happening anymore would be a spurious extra kick. `restitution` is 1 for a fully elastic
// bounce, 0 for the pair simply matching velocity along that line (no bounce-back). Two circles landing
// on the exact same point (astronomically unlikely with floating point, not impossible) fall back to a
// fixed, arbitrary normal (+x) rather than dividing by zero.
export function resolveCircleCollision(a: CircleBody, b: CircleBody, minDistance: number, restitution: number): CircleCollisionResult {
  'worklet'
  const dx = b.position.x - a.position.x
  const dy = b.position.y - a.position.y
  const dist = Math.hypot(dx, dy)
  if (dist >= minDistance) return { a, b, collided: false }

  const nx = dist > 0 ? dx / dist : 1
  const ny = dist > 0 ? dy / dist : 0
  const overlap = minDistance - dist
  const pushX = (nx * overlap) / 2
  const pushY = (ny * overlap) / 2
  const nextA: CircleBody = { position: { x: a.position.x - pushX, y: a.position.y - pushY }, velocity: a.velocity }
  const nextB: CircleBody = { position: { x: b.position.x + pushX, y: b.position.y + pushY }, velocity: b.velocity }

  const velocityAlongNormal = (b.velocity.x - a.velocity.x) * nx + (b.velocity.y - a.velocity.y) * ny
  if (velocityAlongNormal >= 0) return { a: nextA, b: nextB, collided: true }

  const impulse = velocityAlongNormal * ((1 + restitution) / 2)
  return {
    a: { position: nextA.position, velocity: { x: a.velocity.x + impulse * nx, y: a.velocity.y + impulse * ny } },
    b: { position: nextB.position, velocity: { x: b.velocity.x - impulse * nx, y: b.velocity.y - impulse * ny } },
    collided: true
  }
}
