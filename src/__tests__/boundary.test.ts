import { reflectAxis, reflectCircleInRoundedRect } from '../boundary'

describe('reflectAxis', () => {
  it('leaves an in-range value untouched', () => {
    expect(reflectAxis(5, 2, 0, 10, 1)).toEqual({ value: 5, velocity: 2, bounced: false })
  })

  it('reflects the overshoot back inside when past the max', () => {
    const result = reflectAxis(105, 3, 0, 100, 1)
    expect(result.value).toBe(95)
    expect(result.velocity).toBe(-3)
    expect(result.bounced).toBe(true)
  })

  it('reflects the overshoot back inside when past the min', () => {
    const result = reflectAxis(-5, -3, 0, 100, 1)
    expect(result.value).toBe(5)
    expect(result.velocity).toBe(3)
    expect(result.bounced).toBe(true)
  })

  it('scales the rebound velocity by restitution', () => {
    const result = reflectAxis(105, 10, 0, 100, 0.5)
    expect(result.velocity).toBe(-5)
  })
})

describe('reflectCircleInRoundedRect', () => {
  const bounds = { minX: 0, maxX: 200, minY: 0, maxY: 100 }

  it('leaves a circle well within bounds untouched', () => {
    const result = reflectCircleInRoundedRect({ x: 100, y: 50 }, { x: 5, y: 5 }, 10, bounds, 0, 1)
    expect(result.bounced).toBe(false)
    expect(result.position).toEqual({ x: 100, y: 50 })
  })

  it('bounces off a flat wall, inset by the circle radius, at cornerRadius 0', () => {
    const result = reflectCircleInRoundedRect({ x: 5, y: 50 }, { x: -10, y: 0 }, 10, bounds, 0, 1)
    expect(result.bounced).toBe(true)
    expect(result.position.x).toBeCloseTo(15)
    expect(result.velocity.x).toBeCloseTo(10)
  })

  it('degenerates to a plain rect: a diagonal corner approach still resolves as two flat-axis bounces when cornerRadius is 0', () => {
    const result = reflectCircleInRoundedRect({ x: -3, y: -3 }, { x: -5, y: -5 }, 10, bounds, 0, 1)
    expect(result.bounced).toBe(true)
    expect(result.velocity.x).toBeCloseTo(5)
    expect(result.velocity.y).toBeCloseTo(5)
  })

  it('does not bounce a point moving through a genuine rounded corner while still within the arc', () => {
    // Corner cell center is at (200-30, 100-30) = (170, 70) with an effective (post-radius-inset)
    // corner radius of 30-10=20; a point 5px from that center is still inside the arc.
    const result = reflectCircleInRoundedRect({ x: 175, y: 75 }, { x: 5, y: 5 }, 10, bounds, 30, 1)
    expect(result.bounced).toBe(false)
  })

  it('bounces off the arc itself once genuinely past a rounded corner, off a diagonal normal', () => {
    const result = reflectCircleInRoundedRect({ x: 195, y: 95 }, { x: 10, y: 10 }, 10, bounds, 30, 1)
    expect(result.bounced).toBe(true)
    // Reflecting a (10, 10) velocity off a corner whose outward normal points into the +x+y
    // quadrant should end up moving back toward -x/-y (deflected away from the corner it hit).
    expect(result.velocity.x).toBeLessThan(10)
    expect(result.velocity.y).toBeLessThan(10)
  })

  it('scales the bounce by restitution', () => {
    const elastic = reflectCircleInRoundedRect({ x: 5, y: 50 }, { x: -10, y: 0 }, 10, bounds, 0, 1)
    const inelastic = reflectCircleInRoundedRect({ x: 5, y: 50 }, { x: -10, y: 0 }, 10, bounds, 0, 0)
    expect(elastic.velocity.x).toBeCloseTo(10)
    expect(inelastic.velocity.x).toBeCloseTo(0)
  })

  it('matches a zero-radius point bounce (Swirlio-equivalent) when radius is 0', () => {
    const result = reflectCircleInRoundedRect({ x: -5, y: 50 }, { x: -3, y: 0 }, 0, bounds, 0, 1)
    expect(result.position.x).toBe(5)
    expect(result.velocity.x).toBe(3)
  })
})
