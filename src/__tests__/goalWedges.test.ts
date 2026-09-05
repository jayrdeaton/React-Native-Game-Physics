import { computeGoalWedges } from '../goalWedges'

describe('computeGoalWedges', () => {
  it('splits the 180° crease into equal sweep angles for the requested count', () => {
    const wedges = computeGoalWedges(3, 0)
    expect(wedges).toHaveLength(3)
    wedges.forEach((wedge) => expect(wedge.sweepAngle).toBeCloseTo(60))
  })

  it('starts the first wedge at baseAngle and tiles edge-to-edge with no gaps or overlaps', () => {
    const wedges = computeGoalWedges(4, 180)
    expect(wedges[0].startAngle).toBe(180)
    for (let i = 1; i < wedges.length; i++) {
      expect(wedges[i].startAngle).toBeCloseTo(wedges[i - 1].startAngle + wedges[i - 1].sweepAngle)
    }
  })

  it('covers exactly the full 180° arc across all wedges combined', () => {
    const wedges = computeGoalWedges(5, 0)
    const totalSweep = wedges.reduce((sum, wedge) => sum + wedge.sweepAngle, 0)
    expect(totalSweep).toBeCloseTo(180)
  })
})
