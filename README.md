# @tastic/physics

2D arcade-game physics: collision detection and resolution, friction, gravity, springs, and velocity
clamping. Pure, framework-agnostic functions built on [`@tastic/core`](https://github.com/jayrdeaton/react-native-game-core)'s
`Vec2` - no React or React Native dependency, callable equally from a plain JS reducer (a
`requestAnimationFrame`-driven game loop) or from inside a Reanimated worklet: every function is
`'worklet'`-annotated.

## What it does

**Narrow-phase collision detection** (`circleVsRect`, `circleVsCircle`) - does a moving circle overlap
a solid rectangle or circle, and if so, by how much and in which direction? Returns a unit `normal`
(outward from the solid) and `depth` (how far to push the circle out to resolve the overlap).

**Rounded board corners** (`boardCornerQuadrant`, `circleVsRoundedCorner`) - for a board with rounded
outer corners that runs its own flat-wall checks:
- `boardCornerQuadrant(x, y, board)`: which of the board's four corner squares the point is in, as
  that corner arc's center `{ arcCenterX, arcCenterY }`, or `null` outside all four (always `null` when
  `board.cornerRadius <= 0`). `board` is `{ x, y, width, height, behindGoalDepth, cornerRadius }`;
  `behindGoalDepth` moves the true top and bottom walls that far past `y` and `y + height` (a goal
  pocket), `0` for a plain rect. Skip the flat-wall checks for a step that lands in a corner.
- `circleVsRoundedCorner(cx, cy, r, arcCenterX, arcCenterY, cornerRadius)`: keeps a circle of radius
  `r` inside that corner's arc. Returns `{ hit, x, y, nx, ny }`: `hit` once the center is more than
  `cornerRadius - r` from the arc center, `x`/`y` the center pulled back onto that limit, and `nx`/`ny`
  the unit normal from the arc center toward the circle (toward the wall). That's the opposite of the
  collision `normal` convention above, so negate it for `reflectOffNormal`. A miss returns the position
  unchanged and a zero normal.

**Collision response:**
- `reflectOffNormal(velocity, normal, restitution)`: bounce a velocity off a surface normal.
- `resolveCircleCollision(a, b, minDistance, restitution)`: a full two-body elastic/inelastic circle
  collision between equal masses: pushes overlapping circles apart and exchanges the normal component
  of their velocities, conserving momentum exactly (and kinetic energy too, at restitution 1). `a` and
  `b` are `{ position, velocity }`, `minDistance` is the sum of their radii, and it returns
  `{ a, b, collided }`. A pair that's overlapping but already separating is only pushed apart.

**Boundary containment:**
- `reflectCircleInRoundedRect(position, velocity, radius, bounds, cornerRadius, restitution)`: keeps a
  circle contained within a rounded-rectangle boundary, bouncing it off whichever edge or corner it
  crosses. One function covers a puck bouncing off a rink wall (radius > 0, rounded corners), a ball in
  a rectangular play field (radius > 0, square corners), or a drag point contained within a rounded
  screen edge (radius 0) - no need for a separate function per shape. Returns
  `{ position, velocity, bounced }`.
- `reflectAxis(value, velocity, min, max, restitution)`: the one-axis wall bounce
  `reflectCircleInRoundedRect` uses away from the corners. A `value` past `min` or `max` is reflected
  back inside by its overshoot (not clamped flush to the wall) and its `velocity` reversed and scaled
  by `restitution`. Returns `{ value, velocity, bounced }`.

**Forces:**
- `applyFriction(velocity, retentionPerFrame, dt)`: exponential drag, frame-rate independent.
- `applyGravityWells(position, velocity, wells, dt, options)`: a bounded, quadratic-falloff-to-zero
  attractor/repeller field, for one or more localized "wells" an object can enter and be pulled or
  pushed by. Each well is `{ center, radius, strength, activeAtRest? }` (positive `strength`
  attracts, negative repels); `options` is `{ stopThreshold, maxSpeed, minDistance? }`. A well only
  acts while the object's speed is at least `stopThreshold`, unless it's `activeAtRest`; the result's
  speed is capped at `maxSpeed`; and a well closer than `minDistance` (default `0.01`) is skipped.
- `applyGravityPull(position, velocity, center, gravity, dt)`: an unbounded linear pull toward a
  single always-on center. A different model from the wells above (grows with distance instead of
  falling off, no radius) - pick whichever shape matches what you're building.
- `applySpringForce(position, velocity, target, stiffness, damping, dt)`: a damped spring pull toward
  a point. Use `damping = 2*sqrt(stiffness)` for critical damping (settles without overshoot).
- `clampSpeed(velocity, maxSpeed)`: caps a velocity's magnitude without changing its direction.

**Goal wedges** (`computeGoalWedges(count, baseAngle)`) - splits a goal crease's half circle (180
degrees) into `count` equal wedges, one per point needed to win, as `{ startAngle, sweepAngle }` in
degrees starting at `baseAngle`, tiling the arc with no gaps. Fill one per point scored for a
win-progress ring; `@tastic/sprites/hockey`'s `ScoreWedges` draws them.

## Install

```bash
npm install @tastic/physics @tastic/core
```

## Peer dependencies

`@tastic/core` (>=0.10.0): required for the `Vec2` type and vector helpers every function here operates
on, imported from its dependency-free `@tastic/core/math` entry, so none of core's app-level modules or
peers are loaded.
