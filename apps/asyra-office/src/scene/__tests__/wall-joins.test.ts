import { describe, expect, it } from 'vitest'
import architecture from '../../../../../assets/asyra-office/models/architecture/architecture-model-spec.json'
import type { AssetPart } from '../../assets/catalog'
import type { Mesh } from '../../assets/geometry'
import { createReferenceScene } from '../reference-scene'
import { OFFICE_FIT, OFFICE_SHELL } from '../office-layout'

function footprintContains(mesh: Mesh, point: readonly number[]) {
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const vertices = mesh.indices
      .slice(i, i + 3)
      .map((index) => mesh.positions.slice(index * 3, index * 3 + 3))
    const sides = vertices.map((a, j) => {
      const b = vertices[(j + 1) % 3]
      return (
        (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0])
      )
    })
    // Vertical/degenerate projected faces cannot cover a plan area.
    const [a, b, c] = vertices
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    if (Math.abs(area) < 1e-10) continue
    if (sides.every((v) => v >= -1e-10) || sides.every((v) => v <= 1e-10))
      return true
  }
  return false
}

describe('composed rear wall corners', () => {
  for (const [name, ids, x] of [
    ['rear-left', ['discussion-left-wall', 'back-wall'], -3.02],
    [
      'pantry-left',
      ['pantry-divider', 'pantry-back-wall'],
      OFFICE_FIT.parameters.pantryX
    ]
  ] as const) {
    it(`closes ${name} body and cap without holes or doubled coverage`, () => {
      const scene = createReferenceScene('structure')
      const parts = new Map<string, AssetPart[]>()
      let offset = 0
      for (const assembly of scene.assemblies) {
        parts.set(
          assembly.id,
          scene.parts.slice(offset, offset + assembly.parts.length)
        )
        offset += assembly.parts.length
      }
      for (const suffix of ['', '-cap']) {
        const pair = ids.map((id) => parts.get(id + suffix)?.[0])
        if (pair.some((part) => !part)) throw new Error('Missing joined wall')
        for (const detail of ['near', 'distant'] as const) {
          const meshes = pair.map((part) => {
            const mesh = detail === 'near' ? part?.mesh : part?.distant?.mesh
            if (!mesh) throw new Error('Missing wall representation')
            return mesh
          })
          // Samples cover all four quadrants, avoiding the diagonal seam itself.
          for (const dx of suffix
            ? [-0.085, -0.02, 0.02, 0.085]
            : [-0.06, -0.02, 0.02, 0.06])
            for (const dy of suffix
              ? [-0.082, -0.015, 0.015, 0.082]
              : [-0.055, -0.015, 0.015, 0.055]) {
              const point = [x + dx, OFFICE_FIT.parameters.rearY + dy]
              expect(
                meshes.filter((mesh) => footprintContains(mesh, point)).length,
                `${name}${suffix}/${detail} coverage at ${dx},${dy}`
              ).toBe(1)
            }
        }
      }
    })
  }
})

describe('partition wall abutments', () => {
  it('meets host faces and closes the lounge corner without intersecting solids', () => {
    const scene = createReferenceScene('structure')
    const parts = new Map<string, AssetPart[]>()
    let offset = 0
    for (const assembly of scene.assemblies) {
      parts.set(
        assembly.id,
        scene.parts.slice(offset, offset + assembly.parts.length)
      )
      offset += assembly.parts.length
    }
    const p = OFFICE_FIT.parameters
    const cases = [
      {
        name: 'entrance body corner',
        ids: ['left-wall', 'front-thin-wall'],
        points: [-0.06, 0.05, 0.12].flatMap((x) =>
          [-0.03, 0.03].map((y) => [-3.02 + x, OFFICE_SHELL.frontY + y])
        )
      },
      {
        name: 'facade cap against taller west body',
        ids: ['left-wall', 'front-thin-wall-cap'],
        points: [-0.06, 0.05, 0.12].flatMap((x) =>
          [-0.03, 0.03].map((y) => [-3.02 + x, OFFICE_SHELL.frontY + y])
        )
      },
      {
        name: 'work body',
        ids: ['left-wall', 'work-back-partition'],
        points: [-0.04, 0.04, 0.12].map((x) => [-3.02 + x, p.creamY + 0.02])
      },
      {
        name: 'work cap against taller body',
        ids: ['left-wall', 'work-back-partition-cap'],
        points: [-0.04, 0.04, 0.12].map((x) => [-3.02 + x, p.creamY + 0.02])
      },
      {
        name: 'pantry body',
        ids: ['pantry-back-wall', 'pantry-divider'],
        points: [-0.12, -0.04, 0.04].map((y) => [p.pantryX + 0.02, p.rearY + y])
      },
      {
        name: 'pantry caps',
        ids: ['pantry-back-wall-cap', 'pantry-divider-cap'],
        points: [-0.12, -0.085, -0.04, 0.04].map((y) => [
          p.pantryX + 0.02,
          p.rearY + y
        ])
      },
      {
        name: 'lounge unequal-height corner',
        ids: ['lounge-left-return', 'lounge-divider'],
        points: [-0.05, 0.05].flatMap((x) =>
          [-0.05, 0.05].map((y) => [p.loungeX + x, p.loungeY + y])
        )
      },
      {
        name: 'lounge lower cap against taller body',
        ids: ['lounge-left-return', 'lounge-divider-cap'],
        points: [-0.05, 0.05, 0.1].map((x) => [p.loungeX + x, p.loungeY + 0.02])
      }
    ]
    // Joining the hidden ends must not move reference-visible free ends.
    for (const [id, axis, end, expected] of [
      ['work-back-partition', 0, 'max', p.creamEnd],
      ['pantry-divider', 1, 'min', p.pantryFront],
      ['lounge-divider', 0, 'max', p.loungeSplit],
      ['lounge-left-return', 1, 'min', p.loungeY - p.returnLength]
    ] as const)
      for (const suffix of ['', '-cap']) {
        const positions = parts.get(id + suffix)?.[0].mesh.positions
        if (!positions) throw new Error('Missing wall endpoint')
        const values = positions.filter((_, index) => index % 3 === axis)
        const actual = end === 'max' ? Math.max(...values) : Math.min(...values)
        expect(actual, id + suffix + ' free endpoint').toBeCloseTo(expected, 8)
      }
    for (const fixture of cases)
      for (const detail of ['near', 'distant'] as const) {
        const meshes = fixture.ids.map((id) => {
          const part = parts.get(id)?.[0]
          const mesh = detail === 'near' ? part?.mesh : part?.distant?.mesh
          if (!mesh) throw new Error('Missing wall representation: ' + id)
          return mesh
        })
        for (const point of fixture.points)
          expect(
            meshes.filter((mesh) => footprintContains(mesh, point)).length,
            `${fixture.name}/${detail} coverage at ${point.join(',')}`
          ).toBe(1)
      }
  })
})

describe('reference rear-wall discontinuity', () => {
  it('leaves the visible interval behind the meeting wall end free of wall solids', () => {
    const scene = createReferenceScene('structure')
    const p = OFFICE_FIT.parameters
    const gapStart = p.discussionEnd
    const gapEnd =
      p.pantryX -
      (OFFICE_SHELL.exteriorThickness / 2) * OFFICE_SHELL.capDepthRatio
    expect(gapEnd).toBeGreaterThan(gapStart)
    let offset = 0
    for (const assembly of scene.assemblies) {
      const parts = scene.parts.slice(offset, offset + assembly.parts.length)
      offset += assembly.parts.length
      if (assembly.asset !== 'wall-segment') continue
      for (const detail of ['near', 'distant'] as const)
        for (const part of parts) {
          const mesh = detail === 'near' ? part.mesh : part.distant?.mesh
          if (!mesh) throw new Error('Missing wall representation')
          for (const ratio of [0.2, 0.5, 0.8])
            expect(
              footprintContains(mesh, [
                gapStart + (gapEnd - gapStart) * ratio,
                p.rearY
              ]),
              `${assembly.id}/${detail} seals the source-visible rear gap`
            ).toBe(false)
        }
    }
  })
})

it('joins the lounge rear return at body and cap faces while retaining a rear passage', () => {
  const scene = createReferenceScene('structure')
  const parts = new Map<string, AssetPart[]>()
  let offset = 0
  for (const assembly of scene.assemblies) {
    parts.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
  for (const suffix of ['', '-cap'])
    for (const detail of ['near', 'distant'] as const) {
      const member = parts.get('lounge-rear-return' + suffix)?.[0]
      const host = parts.get('lounge-right-wall' + suffix)?.[0]
      if (!member || !host) throw new Error('Missing actual T-return member')
      const a = detail === 'near' ? member.mesh : member.distant?.mesh
      const b = detail === 'near' ? host.mesh : host.distant?.mesh
      if (!a || !b) throw new Error('Missing wall representation')
      const extent = (mesh: Mesh, axis: number) => {
        const values = mesh.positions.filter((_, i) => i % 3 === axis)
        return [Math.min(...values), Math.max(...values)]
      }
      const x = extent(a, 0),
        y = extent(a, 1),
        z = extent(a, 2)
      expect(y[0]).toBeCloseTo(extent(b, 1)[1], 8)
      expect(z).toEqual(extent(b, 2).map((v) => expect.closeTo(v, 8)))
      for (const fraction of [0.2, 0.5, 0.8])
        for (const dy of [-0.005, 0.005])
          expect(
            [a, b].filter((mesh) =>
              footprintContains(mesh, [
                x[0] + (x[1] - x[0]) * fraction,
                y[0] + dy
              ])
            )
          ).toHaveLength(1)
      const door = (OFFICE_FIT.parameters.doorWidth / 1.66) * 1.52
      expect(
        OFFICE_FIT.parameters.rearY - OFFICE_SHELL.exteriorThickness / 2 - y[1]
      ).toBeGreaterThanOrEqual(door)
    }
})

it('keeps the indoor pantry entrance at least as wide as the reference main door leaf', () => {
  const scene = createReferenceScene('structure')
  const byId = new Map<string, AssetPart[]>()
  let offset = 0
  for (const assembly of scene.assemblies) {
    byId.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
  const bounds = (id: string, axis: number) => {
    const values = byId
      .get(id)
      ?.flatMap((part) => part.mesh.positions.filter((_, i) => i % 3 === axis))
    if (!values?.length) throw new Error(`Missing structural member ${id}`)
    return [Math.min(...values), Math.max(...values)]
  }
  const pantryBounds = [
    bounds('pantry-divider', 0),
    bounds('pantry-divider', 1)
  ]
  const clearGap = Math.min(
    ...['lounge-left-return', 'lounge-divider'].map((id) => {
      const memberBounds = [bounds(id, 0), bounds(id, 1)]
      return Math.hypot(
        ...memberBounds.map((range, axis) =>
          Math.max(
            0,
            range[0] - pantryBounds[axis][1],
            pantryBounds[axis][0] - range[1]
          )
        )
      )
    })
  )
  const frame = byId.get('entrance-door')
  if (!frame) throw new Error('Missing entrance frame')
  const jamb = (id: string, edge: 'min' | 'max') => {
    const member = frame.find((part) => part.id === id)
    if (!member) throw new Error(`Missing jamb ${id}`)
    const values = member.mesh.positions.filter((_, i) => i % 3 === 0)
    return edge === 'min' ? Math.min(...values) : Math.max(...values)
  }
  const aperture = jamb('jamb-right', 'min') - jamb('jamb-left', 'max')
  const specification = architecture.modules.find(
    (module) => module.moduleId === 'entry-door-set'
  )
  if (
    !specification?.mainLeafWidthMetres ||
    !specification.openingClearSizeMetres
  )
    throw new Error('Missing main door leaf dimensions')
  // The full frame also contains a fixed side panel; only the leaf supplies passage.
  const leafWidth =
    (aperture * specification.mainLeafWidthMetres) /
    specification.openingClearSizeMetres[0]
  expect(clearGap).toBeGreaterThanOrEqual(leafWidth - 1e-7)
})

it('meets the rear and lounge bodies with a flush pantry floor band', () => {
  const scene = createReferenceScene('structure')
  const members = new Map<string, AssetPart[]>()
  let offset = 0
  for (const assembly of scene.assemblies) {
    members.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
  expect(members.has('pantry-east-wall')).toBe(false)
  const bounds = (id: string, axis: number) => {
    const group = members.get(id)
    if (!group) throw new Error(`Missing structural member ${id}`)
    const values = group.flatMap((p) =>
      p.mesh.positions.filter((_, i) => i % 3 === axis)
    )
    return [Math.min(...values), Math.max(...values)]
  }
  expect(bounds('pantry-floor-band', 1)[0]).toBeCloseTo(
    bounds('lounge-right-wall', 1)[1],
    8
  )
  expect(bounds('pantry-floor-band', 1)[1]).toBeCloseTo(
    bounds('pantry-back-wall', 1)[0],
    8
  )
  expect(bounds('pantry-floor-band', 2)[1]).toBeCloseTo(
    OFFICE_FIT.floors.pantry,
    8
  )
})

it('places the cream and green west-room dividers end-to-end on one partition line', () => {
  const scene = createReferenceScene('structure')
  const members = new Map<string, AssetPart[]>()
  let offset = 0
  for (const assembly of scene.assemblies) {
    members.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
  for (const detail of ['near', 'distant'] as const) {
    const bounds = (id: string) => {
      const part = members.get(id)?.[0]
      const mesh = detail === 'near' ? part?.mesh : part?.distant?.mesh
      if (!mesh) throw new Error(`Missing divider ${id}/${detail}`)
      return [0, 1, 2].map((axis) => {
        const values = mesh.positions.filter((_, index) => index % 3 === axis)
        return [Math.min(...values), Math.max(...values)]
      })
    }
    const cream = bounds('work-back-partition')
    const green = bounds('work-divider')
    // Owner clarification plus enlarged source: adjacent lengths on one line,
    // with a visible opening between ends, not parallel walls in different rooms.
    expect((green[1][0] + green[1][1]) / 2).toBeCloseTo(
      (cream[1][0] + cream[1][1]) / 2,
      8
    )
    expect(green[0][0]).toBeGreaterThan(cream[0][1])
    expect(green[2][0]).toBeCloseTo(cream[2][0], 8)
    expect(green[2][1]).toBeLessThan(cream[2][1])
  }
})
