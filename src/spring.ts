import { type Vec2 } from '@tastic/core'

// A damped spring pull toward `target`: `a = stiffness*(target-position) - damping*velocity`. Plain
// `a = stiffness*displacement` with no damping term overshoots and oscillates around the target
// forever, no matter how the friction elsewhere in a scene is tuned — the damping has to be part of
// the spring itself. Pick `damping = 2*sqrt(stiffness)` for critical damping (settles smoothly,
// no overshoot); lower values ring/oscillate, higher values approach sluggishly without ever
// overshooting.
export function applySpringForce(position: Vec2, velocity: Vec2, target: Vec2, stiffness: number, damping: number, dt: number): Vec2 {
  'worklet'
  return {
    x: velocity.x + (stiffness * (target.x - position.x) - damping * velocity.x) * dt,
    y: velocity.y + (stiffness * (target.y - position.y) - damping * velocity.y) * dt
  }
}
