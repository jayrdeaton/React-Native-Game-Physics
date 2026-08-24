import { scale, type Vec2 } from '@tastic/core'

// `retentionPerFrame` is the fraction of speed kept per nominal (60fps) frame — e.g. 0.98 means "98%
// of speed survives one frame's worth of time," a slider a designer can reason about directly (0 =
// stops instantly, 1 = frictionless). Raising it to the `dt`th power is what makes the decay
// frame-rate independent: retentionPerFrame^dt composes correctly across sub-stepping
// (retentionPerFrame^(dt/n), applied n times, is exactly retentionPerFrame^dt again), so splitting one
// frame into several smaller physics steps (see a collision engine's own tunneling-prevention
// sub-stepping) doesn't change the net friction applied.
export function applyFriction(velocity: Vec2, retentionPerFrame: number, dt: number): Vec2 {
  'worklet'
  return scale(velocity, Math.pow(retentionPerFrame, dt))
}
