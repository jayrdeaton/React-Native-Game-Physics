import { applySpringForce } from '../spring'

describe('applySpringForce', () => {
  it('accelerates toward the target when at rest and displaced', () => {
    const result = applySpringForce({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 4, 0, 1)
    expect(result.x).toBeGreaterThan(0)
    expect(result.y).toBe(0)
  })

  it('applies no force when already at the target with zero velocity', () => {
    expect(applySpringForce({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 5, y: 5 }, 4, 4, 1)).toEqual({ x: 0, y: 0 })
  })

  it('damping opposes existing velocity independent of displacement', () => {
    const result = applySpringForce({ x: 5, y: 5 }, { x: 10, y: 0 }, { x: 5, y: 5 }, 0, 2, 1)
    expect(result.x).toBeLessThan(10)
  })

  it('settles toward the target without overshooting under critical damping', () => {
    let position = { x: 0, y: 0 }
    let velocity = { x: 0, y: 0 }
    const target = { x: 100, y: 0 }
    const stiffness = 9
    const damping = 2 * Math.sqrt(stiffness)
    const dt = 1 / 60
    let maxX = 0
    for (let i = 0; i < 600; i++) {
      velocity = applySpringForce(position, velocity, target, stiffness, damping, dt)
      position = { x: position.x + velocity.x * dt, y: position.y + velocity.y * dt }
      maxX = Math.max(maxX, position.x)
    }
    expect(position.x).toBeCloseTo(target.x, 0)
    expect(maxX).toBeLessThanOrEqual(target.x + 1)
  })
})
