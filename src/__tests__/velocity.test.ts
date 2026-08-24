import { clampSpeed } from '../velocity'

describe('clampSpeed', () => {
  it('leaves velocity untouched when already under maxSpeed', () => {
    expect(clampSpeed({ x: 3, y: 4 }, 10)).toEqual({ x: 3, y: 4 })
  })

  it('caps the magnitude while preserving direction when over maxSpeed', () => {
    const result = clampSpeed({ x: 3, y: 4 }, 5)
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(5)
    expect(result.x / result.y).toBeCloseTo(3 / 4)
  })

  it('leaves the zero vector untouched', () => {
    expect(clampSpeed({ x: 0, y: 0 }, 10)).toEqual({ x: 0, y: 0 })
  })
})
