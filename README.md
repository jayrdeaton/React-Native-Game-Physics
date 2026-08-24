# @tastic/physics

2D arcade-game physics: collision detection and resolution, friction, gravity, springs, and velocity
clamping. Pure, framework-agnostic functions built on [`@tastic/core`](https://github.com/jayrdeaton/react-native-game-core)'s
`Vec2` — no React or React Native dependency, callable equally from a plain JS reducer (a
`requestAnimationFrame`-driven game loop) or from inside a Reanimated worklet.

## What it does

**Narrow-phase collision detection** (`circleVsRect`, `circleVsCircle`) — does a moving circle overlap
a solid rectangle or circle, and if so, by how much and in which direction? Returns a unit `normal`
(outward from the solid) and `depth` (how far to push the circle out to resolve the overlap).

**Collision response:**
- `reflectOffNormal(velocity, normal, restitution)` — bounce a velocity off a surface normal.
- `resolveCircleCollision(a, b, minDistance, restitution)` — a full two-body elastic/inelastic circle
  collision: pushes overlapping circles apart and exchanges the normal component of their velocities,
  conserving momentum exactly (and kinetic energy too, at restitution 1).

**Boundary containment:**
- `reflectCircleInRoundedRect(position, velocity, radius, bounds, cornerRadius, restitution)` — keeps a
  circle contained within a rounded-rectangle boundary, bouncing it off whichever edge or corner it
  crosses. One function covers a puck bouncing off a rink wall (radius > 0, rounded corners), a ball in
  a rectangular play field (radius > 0, square corners), or a drag point contained within a rounded
  screen edge (radius 0) — no need for a separate function per shape.

**Forces:**
- `applyFriction(velocity, retentionPerFrame, dt)` — exponential drag, frame-rate independent.
- `applyGravityWells(position, velocity, wells, dt, options)` — a bounded, quadratic-falloff-to-zero
  attractor/repeller field, for one or more localized "wells" an object can enter and be pulled or
  pushed by.
- `applyGravityPull(position, velocity, center, gravity, dt)` — an unbounded linear pull toward a
  single always-on center. A different model from the wells above (grows with distance instead of
  falling off, no radius) — pick whichever shape matches what you're building.
- `applySpringForce(position, velocity, target, stiffness, damping, dt)` — a damped spring pull toward
  a point. Use `damping = 2*sqrt(stiffness)` for critical damping (settles without overshoot).
- `clampSpeed(velocity, maxSpeed)` — caps a velocity's magnitude without changing its direction.

## Install (local dev via yalc)

Not published to the public npm registry yet.

```bash
cd game-physics
npm run build
yalc publish

cd ../your-game
yalc add @tastic/physics
npm install
```

## Peer dependencies

`@tastic/core` (>=0.1.0) — required for the `Vec2` type every function here operates on.
