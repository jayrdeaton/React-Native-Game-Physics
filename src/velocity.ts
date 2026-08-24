import { length, scale, type Vec2 } from '@tastic/core'

// Caps a velocity's magnitude without changing its direction — leaves it untouched when already at or
// under maxSpeed (including the zero vector, which has no direction to preserve anyway).
export function clampSpeed(velocity: Vec2, maxSpeed: number): Vec2 {
  'worklet'
  const speed = length(velocity)
  return speed > maxSpeed ? scale(velocity, maxSpeed / speed) : velocity
}
