import { beforeAll, expect, it } from 'vitest'
import type { AssetPart } from '../../assets/catalog'
import { createReferenceScene } from '../reference-scene'
import architecture from '../../../../../assets/asyra-office/models/architecture/architecture-model-spec.json'
import { OFFICE_FIT, OFFICE_FLOORS, OFFICE_SHELL } from '../office-layout'

const parts = new Map<string, AssetPart[]>()
beforeAll(() => {
  const scene = createReferenceScene('structure')
  let offset = 0
  for (const assembly of scene.assemblies) {
    parts.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
})
function bounds(id: string, region?: string) {
  const selected = parts
    .get(id)
    ?.filter((part) => !region || part.id === region)
  if (!selected?.length) {
    throw new Error('Missing entrance component: ' + id + '/' + region)
  }
  return [0, 1, 2].map((axis) => {
    const values = selected.flatMap((part) =>
      part.mesh.positions.filter((_, index) => index % 3 === axis)
    )
    return [Math.min(...values), Math.max(...values)]
  })
}

it('continues the same wall cap across the complete approved entrance', () => {
  const header = bounds('entry-header', 'body'),
    cap = bounds('entry-header', 'top-cap')
  const leftCap = bounds('front-facade-cap'),
    rightCap = bounds('entry-pier-cap')
  for (const axis of [1, 2]) {
    expect(cap[axis]).toEqual(leftCap[axis].map((v) => expect.closeTo(v, 8)))
    expect(cap[axis]).toEqual(rightCap[axis].map((v) => expect.closeTo(v, 8)))
  }
  expect(cap[0][0]).toBeCloseTo(leftCap[0][1], 8)
  expect(cap[0][1]).toBeCloseTo(rightCap[0][0], 8)
  expect(header[2][0]).toBeCloseTo(
    OFFICE_FLOORS.lounge + OFFICE_FIT.parameters.doorHeight,
    8
  )
  expect(header[0][1] - header[0][0]).toBeCloseTo(
    OFFICE_FIT.parameters.doorWidth,
    8
  )
  expect(parts.has('entrance-door')).toBe(true)
})

it('supports the entire front wall body and carries flooring to the slab edge', () => {
  const slab = bounds('office-slab'),
    facade = bounds('front-thin-wall')
  expect(slab[1][0]).toBeLessThanOrEqual(facade[1][0] + 1e-8)
  const floor = [...parts.keys()].filter((id) => id.startsWith('floor-'))
  const front = Math.min(...floor.map((id) => bounds(id)[1][0]))
  expect(front - slab[1][0]).toBeCloseTo(0.0015, 8)
  // Body contact, not cap overhang, defines the closed front-left corner.
  const west = bounds('left-wall')
  expect(west[1][0]).toBeLessThanOrEqual(facade[1][0])
  expect(facade[0][0]).toBeCloseTo(west[0][1], 8)
})

it('carries the terminal lounge wall to the rectangular shell outer face', () => {
  const east = bounds('office-slab')[0][1]
  for (const id of ['lounge-right-wall', 'lounge-right-wall-cap']) {
    for (const detail of ['near', 'distant'] as const) {
      const item = parts.get(id)?.[0]
      const mesh = detail === 'near' ? item?.mesh : item?.distant?.mesh
      if (!mesh) {
        throw new Error('Missing terminal wall representation')
      }
      const end = Math.max(
        ...mesh.positions.filter((_, index) => index % 3 === 0)
      )
      expect(end, id + '/' + detail).toBeCloseTo(east, 8)
    }
  }
})

it('installs the complete approved door and frame with its specified clear aperture and fitting gaps', () => {
  const spec = architecture.modules.find(
    (item) => item.moduleId === 'entry-door-set'
  )
  if (
    !spec?.mounting ||
    !spec.overallBoundsMetres ||
    !spec.openingClearSizeMetres
  ) {
    throw new Error('Missing approved entry dimensions')
  }
  const frame = parts.get('entrance-door')
  expect(
    frame
      ?.filter((p) => ['head', 'jamb-left', 'jamb-right'].includes(p.id))
      .map((p) => p.id)
      .sort()
  ).toEqual(['head', 'jamb-left', 'jamb-right'])
  const p = OFFICE_FIT.parameters
  const sx = p.doorWidth / spec.mounting.roughOpeningSizeMetres[0]
  const sz = p.doorHeight / spec.mounting.roughOpeningSizeMetres[1]
  const overall = bounds('entrance-door')
  const left = bounds('entrance-door', 'jamb-left')
  const right = bounds('entrance-door', 'jamb-right')
  const head = bounds('entrance-door', 'head')
  expect(overall[0][1] - overall[0][0]).toBeCloseTo(
    (spec.overallBoundsMetres.max[0] - spec.overallBoundsMetres.min[0]) * sx,
    8
  )
  expect(overall[2][1] - overall[2][0]).toBeCloseTo(
    spec.overallBoundsMetres.max[2] * sz,
    8
  )
  expect(overall[0][0] - (p.doorX - p.doorWidth / 2)).toBeCloseTo(0.01 * sx, 8)
  expect(p.doorX + p.doorWidth / 2 - overall[0][1]).toBeCloseTo(0.01 * sx, 8)
  expect(OFFICE_FLOORS.lounge + p.doorHeight - overall[2][1]).toBeCloseTo(
    0.01 * sz,
    8
  )
  expect(overall[2][0]).toBeCloseTo(OFFICE_FLOORS.lounge, 8)
  expect(overall[1][0]).toBeCloseTo(
    OFFICE_SHELL.frontY + spec.overallBoundsMetres.min[1] * sz,
    8
  )
  expect(overall[1][1]).toBeLessThan(
    OFFICE_SHELL.frontY + OFFICE_SHELL.facadeThickness / 2
  )
  expect(left[2][1]).toBeCloseTo(head[2][0], 8)
  expect(right[2][1]).toBeCloseTo(head[2][0], 8)
  expect(right[0][0] - left[0][1]).toBeCloseTo(
    spec.openingClearSizeMetres[0] * sx,
    8
  )
  expect(head[2][0] - OFFICE_FLOORS.lounge).toBeCloseTo(
    spec.openingClearSizeMetres[1] * sz,
    8
  )
  expect(parts.has('entrance-door')).toBe(true)
})
