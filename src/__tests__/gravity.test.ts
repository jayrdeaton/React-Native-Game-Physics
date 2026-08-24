import { applyGravityPull, applyGravityWells, type GravityWell } from '../gravity'

describe('applyGravityWells', () => {
  const options = { stopThreshold: 1, maxSpeed: 1000 }

  it('returns velocity unchanged with no wells', () => {
    expect(applyGravityWells({ x: 0, y: 0 }, { x: 5, y: 5 }, [], 1, options)).toEqual({ x: 5, y: 5 })
  })

  it('pulls a moving object toward an attracting well within range', () => {
    const well: GravityWell = { center: { x: 100, y: 0 }, radius: 50, strength: 10 }
    const result = applyGravityWells({ x: 90, y: 0 }, { x: 0, y: 5 }, [well], 1, options)
    expect(result.x).toBeGreaterThan(0)
  })

  it('pushes a moving object away from a repelling (negative strength) well', () => {
    const well: GravityWell = { center: { x: 100, y: 0 }, radius: 50, strength: -10 }
    const result = applyGravityWells({ x: 90, y: 0 }, { x: 0, y: 5 }, [well], 1, options)
    expect(result.x).toBeLessThan(0)
  })

  it('ignores a well outside its own radius', () => {
    const well: GravityWell = { center: { x: 1000, y: 0 }, radius: 50, strength: 10 }
    expect(applyGravityWells({ x: 0, y: 0 }, { x: 0, y: 5 }, [well], 1, options)).toEqual({ x: 0, y: 5 })
  })

  it('falls off to exactly 0 pull at the well boundary', () => {
    const well: GravityWell = { center: { x: 49.999, y: 0 }, radius: 50, strength: 1000 }
    const result = applyGravityWells({ x: 0, y: 0 }, { x: 0, y: 5 }, [well], 1, options)
    expect(result.x).toBeCloseTo(0, 1)
  })

  it('does not pull a below-threshold (near-stopped) object by default', () => {
    const well: GravityWell = { center: { x: 100, y: 0 }, radius: 50, strength: 10 }
    const result = applyGravityWells({ x: 90, y: 0 }, { x: 0, y: 0 }, [well], 1, { stopThreshold: 5, maxSpeed: 1000 })
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('does pull a stopped object when activeAtRest is set', () => {
    const well: GravityWell = { center: { x: 100, y: 0 }, radius: 50, strength: 10, activeAtRest: true }
    const result = applyGravityWells({ x: 90, y: 0 }, { x: 0, y: 0 }, [well], 1, { stopThreshold: 5, maxSpeed: 1000 })
    expect(result.x).toBeGreaterThan(0)
  })

  it('caps the resulting speed at maxSpeed', () => {
    const well: GravityWell = { center: { x: 50, y: 0 }, radius: 1000, strength: 100_000 }
    const result = applyGravityWells({ x: 0, y: 0 }, { x: 0, y: 0 }, [well], 1, { stopThreshold: 0, maxSpeed: 20 })
    expect(Math.hypot(result.x, result.y)).toBeLessThanOrEqual(20 + 1e-6)
  })

  it('sums the pull from multiple simultaneous wells', () => {
    const wells: GravityWell[] = [
      { center: { x: 100, y: 0 }, radius: 200, strength: 10 },
      { center: { x: -100, y: 0 }, radius: 200, strength: 10 }
    ]
    const result = applyGravityWells({ x: 0, y: 0 }, { x: 0, y: 5 }, wells, 1, options)
    expect(result.x).toBeCloseTo(0, 5)
  })
})

describe('applyGravityPull', () => {
  it('accelerates toward the center for positive gravity', () => {
    const result = applyGravityPull({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, 1, 1)
    expect(result.x).toBeLessThan(0)
  })

  it('accelerates away from the center for negative gravity', () => {
    const result = applyGravityPull({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, -1, 1)
    expect(result.x).toBeGreaterThan(0)
  })

  it('applies no pull exactly at the center', () => {
    expect(applyGravityPull({ x: 0, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 0 }, 5, 1)).toEqual({ x: 3, y: 3 })
  })

  it('grows unbounded with distance, unlike applyGravityWells', () => {
    const near = applyGravityPull({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, 1, 1)
    const far = applyGravityPull({ x: 10_000, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, 1, 1)
    expect(Math.abs(far.x)).toBeGreaterThan(Math.abs(near.x))
  })
})
