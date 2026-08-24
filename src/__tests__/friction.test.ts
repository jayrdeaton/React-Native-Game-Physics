import { applyFriction } from '../friction'

describe('applyFriction', () => {
  it('leaves velocity unchanged at retention 1 (frictionless)', () => {
    expect(applyFriction({ x: 10, y: -5 }, 1, 3)).toEqual({ x: 10, y: -5 })
  })

  it('zeroes velocity at retention 0 for any positive dt', () => {
    const result = applyFriction({ x: 10, y: -5 }, 0, 1)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0) // Math.pow(0, 1) * -5 is -0 in JS; toBeCloseTo treats it as equal to 0, toEqual/toBe don't
  })

  it('scales both axes by retentionPerFrame^dt', () => {
    const result = applyFriction({ x: 10, y: 20 }, 0.9, 2)
    const factor = Math.pow(0.9, 2)
    expect(result.x).toBeCloseTo(10 * factor)
    expect(result.y).toBeCloseTo(20 * factor)
  })

  it('composes across sub-steps the same as one full step (rate-independent of splitting)', () => {
    const oneStep = applyFriction({ x: 100, y: 0 }, 0.95, 2.5)
    const subStepped = applyFriction(applyFriction({ x: 100, y: 0 }, 0.95, 1.25), 0.95, 1.25)
    expect(subStepped.x).toBeCloseTo(oneStep.x)
  })
})
