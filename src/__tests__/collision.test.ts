import { boardCornerQuadrant, circleVsCircle, circleVsRect, circleVsRoundedCorner, reflectOffNormal, resolveCircleCollision } from '../collision'

describe('circleVsRect', () => {
  const rect = { x: 0, y: 0, width: 100, height: 50 }

  it('reports no hit when clearly outside', () => {
    expect(circleVsRect({ position: { x: 200, y: 200 }, radius: 10 }, rect).hit).toBe(false)
  })

  it('reports a hit when overlapping an edge, with an outward normal', () => {
    const result = circleVsRect({ position: { x: 50, y: -5 }, radius: 10 }, rect)
    expect(result.hit).toBe(true)
    expect(result.normal).toEqual({ x: 0, y: -1 })
    expect(result.depth).toBeCloseTo(5)
  })

  it('reports a hit when overlapping a corner, with a diagonal normal', () => {
    const result = circleVsRect({ position: { x: -3, y: -4 }, radius: 10 }, rect)
    expect(result.hit).toBe(true)
    expect(result.normal.x).toBeLessThan(0)
    expect(result.normal.y).toBeLessThan(0)
  })
})

describe('circleVsCircle', () => {
  it('reports no hit when far apart', () => {
    const a = { position: { x: 0, y: 0 }, radius: 5 }
    const b = { position: { x: 100, y: 0 }, radius: 5 }
    expect(circleVsCircle(a, b).hit).toBe(false)
  })

  it('reports a hit with the correct overlap depth', () => {
    const a = { position: { x: 0, y: 0 }, radius: 10 }
    const b = { position: { x: 15, y: 0 }, radius: 10 }
    const result = circleVsCircle(a, b)
    expect(result.hit).toBe(true)
    expect(result.normal).toEqual({ x: -1, y: 0 })
    expect(result.depth).toBeCloseTo(5)
  })
})

describe('reflectOffNormal', () => {
  // normal = {1, 0} throughout: the solid is toward -x, free space toward +x — matching
  // circleVsRect/circleVsCircle's own convention of a normal pointing away from the solid.

  it('leaves velocity untouched when already moving away from the surface', () => {
    expect(reflectOffNormal({ x: 5, y: 0 }, { x: 1, y: 0 }, 1)).toEqual({ x: 5, y: 0 })
  })

  it('fully reverses the normal component at restitution 1 (elastic)', () => {
    const result = reflectOffNormal({ x: -5, y: 3 }, { x: 1, y: 0 }, 1)
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(3)
  })

  it('removes only the normal component at restitution 0 (inelastic), preserving tangential motion', () => {
    const result = reflectOffNormal({ x: -5, y: 3 }, { x: 1, y: 0 }, 0)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(3)
  })

  it('scales the bounce-back proportionally at a partial restitution', () => {
    const result = reflectOffNormal({ x: -10, y: 0 }, { x: 1, y: 0 }, 0.5)
    expect(result.x).toBeCloseTo(5)
  })
})

describe('circleVsRoundedCorner', () => {
  const arcCenterX = 100
  const arcCenterY = 100
  const cornerRadius = 50
  const r = 10
  // maxDist = cornerRadius - r = 40 throughout.

  it('reports no hit when well within the arc (closer than cornerRadius - r)', () => {
    const result = circleVsRoundedCorner(105, 100, r, arcCenterX, arcCenterY, cornerRadius)
    expect(result.hit).toBe(false)
    expect(result.x).toBe(105)
    expect(result.y).toBe(100)
  })

  it('clamps to the arc with an outward unit normal once past it', () => {
    const result = circleVsRoundedCorner(150, 100, r, arcCenterX, arcCenterY, cornerRadius)
    expect(result.hit).toBe(true)
    expect(result.x).toBeCloseTo(140)
    expect(result.y).toBeCloseTo(100)
    expect(result.nx).toBeCloseTo(1)
    expect(result.ny).toBeCloseTo(0)
  })

  it('does not divide by zero for a circle sitting exactly on the arc center', () => {
    const result = circleVsRoundedCorner(arcCenterX, arcCenterY, r, arcCenterX, arcCenterY, cornerRadius)
    expect(result.hit).toBe(false)
    expect(Number.isFinite(result.nx)).toBe(true)
    expect(Number.isFinite(result.ny)).toBe(true)
  })
})

describe('boardCornerQuadrant', () => {
  const board = { x: 0, y: 0, width: 200, height: 100, behindGoalDepth: 20, cornerRadius: 30 }
  // outerTop = y - behindGoalDepth = -20, outerBottom = y + height + behindGoalDepth = 120.

  it('returns null whenever cornerRadius is 0, regardless of position', () => {
    expect(boardCornerQuadrant(5, 5, { ...board, cornerRadius: 0 })).toBeNull()
  })

  it('returns null outside all 4 corner squares', () => {
    expect(boardCornerQuadrant(100, 50, board)).toBeNull()
  })

  it('identifies the top-left corner, anchored to the TRUE (behindGoalDepth-extended) outer boundary', () => {
    expect(boardCornerQuadrant(10, -15, board)).toEqual({ arcCenterX: 30, arcCenterY: -20 + 30 })
  })

  it('identifies the top-right corner', () => {
    expect(boardCornerQuadrant(190, -15, board)).toEqual({ arcCenterX: 200 - 30, arcCenterY: -20 + 30 })
  })

  it('identifies the bottom-left corner', () => {
    expect(boardCornerQuadrant(10, 110, board)).toEqual({ arcCenterX: 30, arcCenterY: 120 - 30 })
  })

  it('identifies the bottom-right corner', () => {
    expect(boardCornerQuadrant(190, 110, board)).toEqual({ arcCenterX: 200 - 30, arcCenterY: 120 - 30 })
  })
})

describe('resolveCircleCollision', () => {
  it('reports no collision when farther apart than minDistance', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: 1, y: 0 } }
    const b = { position: { x: 100, y: 0 }, velocity: { x: -1, y: 0 } }
    expect(resolveCircleCollision(a, b, 20, 1).collided).toBe(false)
  })

  it('pushes overlapping bodies apart even if not closing', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } }
    const b = { position: { x: 5, y: 0 }, velocity: { x: 0, y: 0 } }
    const result = resolveCircleCollision(a, b, 20, 1)
    expect(result.collided).toBe(true)
    // b sits to a's right, so pushing apart moves a further left (negative) and b further right
    // (past its own starting x) — the pair's combined position is conserved either way.
    expect(result.a.position.x).toBeLessThan(0)
    expect(result.b.position.x).toBeGreaterThan(5)
    expect(result.a.position.x + result.b.position.x).toBeCloseTo(5)
  })

  it('does not apply a velocity impulse to a pair that is overlapping but already separating', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: -1, y: 0 } }
    const b = { position: { x: 5, y: 0 }, velocity: { x: 1, y: 0 } }
    const result = resolveCircleCollision(a, b, 20, 1)
    expect(result.a.velocity).toEqual(a.velocity)
    expect(result.b.velocity).toEqual(b.velocity)
  })

  it('conserves total momentum for a head-on elastic collision between equal masses', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: 10, y: 0 } }
    const b = { position: { x: 15, y: 0 }, velocity: { x: -10, y: 0 } }
    const result = resolveCircleCollision(a, b, 20, 1)
    const totalBefore = a.velocity.x + b.velocity.x
    const totalAfter = result.a.velocity.x + result.b.velocity.x
    expect(totalAfter).toBeCloseTo(totalBefore)
  })

  it('conserves kinetic energy at restitution 1 and reduces it below 1', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: 10, y: 0 } }
    const b = { position: { x: 15, y: 0 }, velocity: { x: -10, y: 0 } }
    const kineticEnergy = (v: { x: number; y: number }) => v.x * v.x + v.y * v.y

    const elastic = resolveCircleCollision(a, b, 20, 1)
    const keBefore = kineticEnergy(a.velocity) + kineticEnergy(b.velocity)
    const keElasticAfter = kineticEnergy(elastic.a.velocity) + kineticEnergy(elastic.b.velocity)
    expect(keElasticAfter).toBeCloseTo(keBefore)

    const inelastic = resolveCircleCollision(a, b, 20, 0.3)
    const keInelasticAfter = kineticEnergy(inelastic.a.velocity) + kineticEnergy(inelastic.b.velocity)
    expect(keInelasticAfter).toBeLessThan(keBefore)
  })

  it('leaves tangential velocity untouched, only exchanging the normal component', () => {
    const a = { position: { x: 0, y: 0 }, velocity: { x: 10, y: 7 } }
    const b = { position: { x: 15, y: 0 }, velocity: { x: -10, y: -3 } }
    const result = resolveCircleCollision(a, b, 20, 1)
    expect(result.a.velocity.y).toBeCloseTo(7)
    expect(result.b.velocity.y).toBeCloseTo(-3)
  })

  it('falls back to a fixed normal rather than dividing by zero for coincident points', () => {
    const a = { position: { x: 5, y: 5 }, velocity: { x: 1, y: 0 } }
    const b = { position: { x: 5, y: 5 }, velocity: { x: -1, y: 0 } }
    expect(() => resolveCircleCollision(a, b, 20, 1)).not.toThrow()
  })
})
