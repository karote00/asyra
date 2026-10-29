import { expect, it } from 'vitest'
import structure from '../reference/office-structure.json'
import baseline from './fixtures/building-before-expansion.json'
import seating from '../reference/office-seating.json'
import evidence from '../reference/seating-measurements.json'

function item(id: string) {
  const value = seating.instances.find((instance) => instance.id === id)
  if (!value) throw new Error(`Missing seating ${id}`)
  return value
}
const front = structure.shell.frontY + structure.shell.facadeThickness / 2
const rear = structure.parameters.rearY - structure.shell.exteriorThickness / 2
const roomBounds = {
  work: [
    front,
    structure.parameters.creamY - structure.shell.exteriorThickness / 2
  ],
  discussion: [
    structure.parameters.creamY + structure.shell.exteriorThickness / 2,
    rear
  ],
  lounge: [
    front,
    structure.parameters.loungeY - structure.shell.partitionThickness / 2
  ]
}
for (const [room, source] of Object.entries(evidence.roomPlacement.rooms)) {
  it(`preserves the source table depth fraction and group spacing in ${room}`, () => {
    const bounds = roomBounds[room as keyof typeof roomBounds]
    const table = item(source.anchor)
    const fraction =
      (source.sourceAnchor[1] - source.sourceBoundsY[0]) /
      (source.sourceBoundsY[1] - source.sourceBoundsY[0])
    expect(
      (table.position[1] - bounds[0]) / (bounds[1] - bounds[0])
    ).toBeCloseTo(fraction, 8)
    expect(table.position[0]).toBe(source.sourceAnchor[0])
    for (const [id, member] of Object.entries(source.members)) {
      const actual = item(id)
      expect(actual.scale).toEqual(member.scale)
      for (const axis of [0, 1])
        expect(actual.position[axis] - table.position[axis]).toBeCloseTo(
          member.offset[axis],
          8
        )
    }
  })
}
it('preserves the accepted non-depth structural contract during authorized expansion', () => {
  expect(structure.shell).toEqual(baseline.structure.shell)
  expect(structure.floors).toEqual(baseline.structure.floors)
  expect(structure.doorScale).toBe(baseline.structure.doorScale)
  for (const key of [
    'doorX',
    'doorWidth',
    'doorHeight',
    'rearTop',
    'pantryTop',
    'creamTop',
    'greenTop',
    'loungeTop',
    'loungeRightTop'
  ] as const)
    expect(structure.parameters[key]).toBe(baseline.structure.parameters[key])
})
