import { beforeAll, describe, expect, it } from 'vitest'
import { WalkingTerrainPlacementOwner } from '../walking-terrain-placement'
import { readWalkingTerrainPlacementRequest } from '../../domain/walking-terrain-placement-contract'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'
import { validateSceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../../domain/walking-robot-definition'
import {
  WalkingRobotSourceOwner,
  type WalkingRobotSource
} from '../../domain/walking-robot-source'
import {
  dyadic,
  divide,
  subtract,
  multiply,
  interval
} from '../../domain/scalar-arithmetic'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand, type SceneDemand } from '../scene-demand'
import type { ConstrainedFraction as F } from '../../domain/walking-constrained-kinematics'
import type {
  WalkingContactRelation,
  WalkingTerrainObservation
} from '../../domain/walking-motion-contract'
function required<T>(v: T | undefined | null): T {
  if (v == null) throw new Error('Missing actual fixture dependency')
  return v
}
function gcd(a: bigint, b: bigint): bigint {
  if (b) return gcd(b, a % b)
  return a < 0n ? -a : a
}
function f(n: bigint, d = 1n): F {
  if (d < 0n) {
    n = -n
    d = -d
  }
  const g = gcd(n, d)
  return { numerator: n / g, denominator: d / g }
}
function e(n: number): F {
  const v = dyadic(n)
  return v.exponent >= 0
    ? f(v.significand << BigInt(v.exponent))
    : f(v.significand, 1n << BigInt(-v.exponent))
}
function add(a: F, b: F) {
  return f(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator
  )
}
function sub(a: F, b: F) {
  return add(a, f(-b.numerator, b.denominator))
}
function div(a: F, b: F) {
  return f(a.numerator * b.denominator, a.denominator * b.numerator)
}
function num(a: F) {
  return Number(a.numerator) / Number(a.denominator)
}
let source: WalkingRobotSource, demand: SceneDemand, alpha: number
const evidence = {
  kind: 'synthetic' as const,
  id: 'terrain-scenario',
  label: 'Terrain scenario - authored plane'
}
beforeAll(() => {
  const baseline = createSyntheticWalkingRobotDefinition({
    definitionId: 'terrain-default'
  })
  const stations = baseline.legs
    .filter((l) => l.side === 'left')
    .map((l) => l.mount.position[2])
    .sort((a, b) => a - b)
  alpha = Math.min(
    ...baseline.legs.map(
      (l) =>
        divide(
          subtract(
            interval(stations[1] - stations[0]),
            interval(l.foot.size[2])
          ),
          multiply(interval(4), interval(l.upper.length))
        ).low
    )
  )
  source = new WalkingRobotSourceOwner().prepare(
    readWalkingRobotDefinition({
      ...baseline,
      definitionId: 'terrain-authored',
      jointEvidence: evidence,
      legs: baseline.legs.map((l) => ({
        ...l,
        jointRanges: { ...l.jointRanges, knee: [-alpha, l.jointRanges.knee[1]] }
      }))
    })
  )
  const farm = validateConfiguration(DEFAULT_CONFIGURATION),
    geometry = new SiteGeometry(),
    scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  const width =
    Math.max(
      ...baseline.legs.map(
        (l) =>
          Math.abs(l.mount.position[0]) + l.coxa.length + l.foot.size[0] / 2
      )
    ) * 2
  demand = prepareSceneDemand(
    farm,
    scene,
    validateSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'strip-3',
        from: 0,
        until: width * 4
      },
      evidence,
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
  )
}, 30000)
function fixture(opposite = false) {
  const route = required(demand.route),
    minX = route.volume.min[0],
    maxX = route.volume.max[0],
    centreZ = (route.volume.min[2] + route.volume.max[2]) / 2
  const width = maxX - minX,
    minZ = centreZ - width / 2,
    maxZ = centreZ + width / 2
  const origin = [
    div(add(e(minX), e(maxX)), f(2n)),
    e(0),
    div(add(e(minZ), e(maxZ)), f(2n))
  ]
  const chains = source.rig.legChains.filter(
    (c) => ((c.side === 'left') !== (c.station === 'middle')) !== opposite
  )
  const seeds = chains.map((chain) => {
    const contact = required(
      source.rig.contacts.feet.find((c) => c.part.bodyId === chain.footBodyId)
    )
    const frames = chain.jointIds.map(
      (id) => required(source.rig.joints.find((j) => j.id === id)).frame
    )
    const foot = required(
      required(source.rig.bodies.find((b) => b.id === chain.footBodyId))
        .fixedFrame
    )
    const local = [0, 1, 2].map((k) =>
      [...frames, foot, contact.localFrame].reduce(
        (sum, v) => add(sum, e(v.position[k])),
        f(0n)
      )
    )
    const anchor = [add(origin[0], local[0]), f(0n), add(origin[2], local[2])]
    const u = div(sub(anchor[0], e(minX)), sub(e(maxX), e(minX))),
      v = div(sub(anchor[2], e(minZ)), sub(e(maxZ), e(minZ)))
    const lower = sub(u, v).numerator >= 0n
    return {
      chainId: chain.id,
      footPart: contact.part,
      footPatch: contact.patch,
      contactAssessmentId: 'assessment-' + chain.id,
      terrainRegionId: 'soil',
      sourceRegionId: 'surface',
      triangleOffset: lower ? 0 : 3,
      barycentric: lower
        ? [sub(f(1n), u), sub(u, v), v]
        : [sub(f(1n), v), u, sub(v, u)]
    }
  })
  const relation: WalkingContactRelation = { status: 'admitted', evidence }
  const observations: WalkingTerrainObservation = {
    coverage: 'complete',
    evidence
  }
  return {
    format: 'walking-terrain-placement-request/1',
    source,
    demand,
    farm: demand.farm,
    route: demand.route,
    terrain: {
      format: 'walking-terrain/1',
      id: 'soil-scenario',
      revision: 1,
      sceneRevision: demand.scene.revision,
      route: { bay: route.bay, stripId: route.stripId },
      provenance: evidence,
      observations: {
        height: observations,
        slope: observations,
        rut: observations,
        debris: observations
      },
      regions: [
        {
          id: 'soil',
          classification: 'soil',
          sourceId: 'soil-source',
          shape: {
            kind: 'triangles',
            positions: [
              minX,
              0,
              minZ,
              maxX,
              0,
              minZ,
              maxX,
              0,
              maxZ,
              minX,
              0,
              maxZ
            ],
            indices: [0, 1, 2, 0, 2, 3]
          },
          frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
          binding: {
            kind: 'route-soil',
            bay: route.bay,
            stripId: route.stripId
          },
          keepOut: { kind: 'none' }
        }
      ],
      contactAssessments: seeds.map((s) => ({
        id: s.contactAssessmentId,
        footPatchId: s.footPatch.id,
        terrainRegionId: s.terrainRegionId,
        pathId: 'scenario-path',
        loadCaseId: 'scenario-load',
        from: 0,
        until: 1,
        coverage: 'complete',
        geometry: relation,
        friction: relation,
        bearing: relation,
        sinkage: relation
      }))
    },
    partitions: [
      {
        sourceId: 'soil-source',
        regions: [
          { id: 'surface', kind: 'sheet', indexStart: 0, indexCount: 6 }
        ]
      }
    ],
    seeds,
    baseOrientation: [f(0n), f(0n), f(0n), f(1n)],
    fixedJoints: source.rig.presets.stowed,
    interval: { low: -alpha, high: alpha },
    budget: {
      maxInputValues: 100000,
      maxTrianglePairs: 10000,
      maxPredicates: 2000000,
      maxBits: 24000,
      maxProjectionOperations: 1000000
    }
  }
}
describe('actual terrain placement geometry with unbound physical evidence', () => {
  it('rejects an unused assessment that names a foreign source foot patch', () => {
    const raw = fixture()
    raw.terrain.contactAssessments.push({
      ...raw.terrain.contactAssessments[0],
      id: 'unused-foreign',
      footPatchId: 'foreign-foot-patch'
    })
    expect(() =>
      readWalkingTerrainPlacementRequest(raw, { source, demand })
    ).toThrow()
  })
  it('does not infer solid interior exclusion from separated debris boundary triangles', () => {
    const raw = fixture(),
      soil = raw.terrain.regions[0],
      p = soil.shape.positions
    const x0 = p[0],
      x1 = p[3],
      z0 = p[2],
      z1 = p[8]
    const positions = [
      x0,
      -1,
      z0,
      x1,
      -1,
      z0,
      x1,
      -1,
      z1,
      x0,
      -1,
      z1,
      x0,
      1,
      z0,
      x1,
      1,
      z0,
      x1,
      1,
      z1,
      x0,
      1,
      z1
    ]
    const indices = [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2,
      3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7
    ]
    const edges = new Map<string, number>()
    for (let i = 0; i < indices.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const edge = [indices[i + j], indices[i + ((j + 1) % 3)]]
          .sort((a, b) => a - b)
          .join(':')
        edges.set(edge, (edges.get(edge) ?? 0) + 1)
      }
    expect([...edges.values()].every((count) => count === 2)).toBe(true)
    const result = new WalkingTerrainPlacementOwner().prepare(source, demand, {
      ...raw,
      terrain: {
        ...raw.terrain,
        regions: [
          soil,
          {
            ...soil,
            id: 'solid-debris',
            sourceId: 'solid-source',
            classification: 'debris',
            binding: { kind: 'debris' },
            shape: { kind: 'triangles', positions, indices }
          }
        ]
      },
      partitions: [
        ...raw.partitions,
        {
          sourceId: 'solid-source',
          regions: [
            {
              id: 'solid',
              kind: 'closed-solid',
              indexStart: 0,
              indexCount: indices.length
            }
          ]
        }
      ]
    })
    expect(result.sourceGeometry.status, result.reasons.join(';')).toBe(
      'unknown'
    )
    expect(result.reasons).toContain('terrain-solid-interior-unproved')
  })
  it('refuses an unsupported coplanar T junction without double-counting its boundary', () => {
    const raw = fixture(),
      shape = raw.terrain.regions[0].shape,
      x = shape.positions[3],
      z = (shape.positions[2] + shape.positions[8]) / 2
    shape.positions.push(x, 0, z, x + 0.1, 0, z + 0.1, x + 0.1, 0, z - 0.1)
    shape.indices.push(4, 5, 6)
    raw.partitions[0].regions[0].indexCount = 9
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      raw
    )
    expect(result.sourceGeometry.status).toBe('unknown')
    expect(result.reasons).toContain('terrain-soil-union-unproved')
  })
  it('retains exact compatible anchors while one original soil triangle covers only part of a sole', () => {
    const raw = fixture(),
      normal = new WalkingTerrainPlacementOwner().prepare(source, demand, raw),
      projected = required(normal.projection)
    const shape = raw.terrain.regions[0].shape,
      minX = shape.positions[0],
      maxZ = shape.positions[8],
      minZ = shape.positions[2],
      middleZ = (minZ + maxZ) / 2
    const maximum = projected.supports
      .flatMap((s) => s.fixedVertices)
      .reduce(
        (m, v) => (sub(v.position[0], m).numerator > 0n ? v.position[0] : m),
        e(minX)
      )
    const apex = num(maximum)
    shape.positions = [minX, 0, minZ, apex, 0, middleZ, minX, 0, maxZ]
    shape.indices = [0, 1, 2]
    raw.partitions[0].regions[0].indexCount = 3
    for (const seed of raw.seeds) {
      const anchor = required(
        projected.supports.find((s) => s.chainId === seed.chainId)
      ).anchorOrigin
      const u = div(sub(anchor[0], e(minX)), sub(e(apex), e(minX)))
      const product = f(
        u.numerator * sub(e(middleZ), e(minZ)).numerator,
        u.denominator * sub(e(middleZ), e(minZ)).denominator
      )
      const v = div(
        sub(sub(anchor[2], e(minZ)), product),
        sub(e(maxZ), e(minZ))
      )
      seed.triangleOffset = 0
      seed.barycentric = [sub(sub(f(1n), u), v), u, v]
    }
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      raw
    )
    expect(result.projection?.supports.map((s) => s.anchorOrigin)).toEqual(
      projected.supports.map((s) => s.anchorOrigin)
    )
    expect(result.sourceGeometry.status).toBe('unknown')
    expect(result.reasons).toContain('terrain-soil-coverage-incomplete')
  })
  it.each(['source', 'keep-out'] as const)(
    'blocks only supplied complete debris %s authority',
    (mode) => {
      const raw = fixture(),
        soil = raw.terrain.regions[0],
        route = required(demand.route)
      const debris = {
        ...soil,
        id: 'debris',
        sourceId: 'debris-source',
        classification: 'debris',
        binding: { kind: 'debris' },
        keepOut:
          mode === 'keep-out'
            ? {
                kind: 'bounded',
                min: route.volume.min,
                max: route.volume.max,
                evidence
              }
            : { kind: 'none' },
        frame:
          mode === 'keep-out'
            ? { position: [0, 10, 0], rotation: [0, 0, 0, 1] }
            : soil.frame
      }
      const result = new WalkingTerrainPlacementOwner().prepare(
        source,
        demand,
        {
          ...raw,
          terrain: { ...raw.terrain, regions: [soil, debris] },
          partitions: [
            ...raw.partitions,
            { sourceId: 'debris-source', regions: raw.partitions[0].regions }
          ]
        }
      )
      expect(result.sourceGeometry.status, result.reasons.join(';')).toBe(
        'blocked'
      )
      expect(result.reasons).toContain(
        mode === 'source'
          ? 'support-on-debris-source'
          : 'support-in-debris-keep-out'
      )
    }
  )
  it('rejects foreign source and malformed assessment binding without promoting supplied physical flags', () => {
    const raw = fixture(),
      other = new WalkingRobotSourceOwner().prepare(source.definition)
    expect(() =>
      new WalkingTerrainPlacementOwner().prepare(other, demand, raw)
    ).toThrow()
    expect(() =>
      new WalkingTerrainPlacementOwner().prepare(source, demand, {
        ...raw,
        terrain: {
          ...raw.terrain,
          contactAssessments: raw.terrain.contactAssessments.map((a, i) =>
            i === 0 ? { ...a, footPatchId: raw.seeds[1].footPatch.id } : a
          )
        }
      })
    ).toThrow()
    const altered = {
      ...raw,
      terrain: {
        ...raw.terrain,
        contactAssessments: raw.terrain.contactAssessments.map((a) => ({
          ...a,
          friction: { kind: 'unknown' },
          bearing: { kind: 'unknown' },
          sinkage: { kind: 'unknown' }
        }))
      }
    }
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      altered
    )
    expect(result.sourceGeometry.status).toBe('admitted')
    expect(result.physicalStatus).toBe('unknown')
  })
  it('binds successor interval, seed and assessment snapshots while retaining old immutable evidence', () => {
    const raw = fixture(),
      owner = new WalkingTerrainPlacementOwner(),
      first = owner.prepare(source, demand, raw)
    const second = owner.prepare(source, demand, {
      ...raw,
      interval: { low: 0, high: alpha }
    })
    const third = owner.prepare(source, demand, {
      ...raw,
      seeds: raw.seeds.map((s) => ({
        ...s,
        barycentric: s.barycentric.map((v) =>
          f(v.numerator * 2n, v.denominator * 2n)
        )
      }))
    })
    const fourth = owner.prepare(source, demand, {
      ...raw,
      terrain: {
        ...raw.terrain,
        contactAssessments: raw.terrain.contactAssessments.map((a) => ({
          ...a,
          coverage: 'sampled'
        }))
      }
    })
    expect(new Set([first, second, third, fourth]).size).toBe(4)
    expect(owner.work.preparations).toBe(4)
    expect(first.request?.interval.low).toBe(-alpha)
    expect(first.request?.terrain.contactAssessments[0].coverage).toBe(
      'complete'
    )
    expect(fourth.supports[0].assessment?.coverage).toBe('sampled')
  })
  it('blocks the current W1 opening at Y=0 despite caller soil labels and absent wall triangles', () => {
    const raw = fixture(),
      initial = new WalkingTerrainPlacementOwner().prepare(source, demand, raw)
    const channel = required(demand.channels[0]),
      support = required(initial.projection).supports[0]
    const minimum = support.fixedVertices.reduce(
      (m, v) => (sub(v.position[0], m).numerator < 0n ? v.position[0] : m),
      support.fixedVertices[0].position[0]
    )
    // Align this full sole's minimum X exactly to the channel's maximum X.
    // A binary64 frame plus an exact barycentric residual retains the true edge.
    const delta = sub(e(channel.bounds.max[0]), minimum),
      shift = num(delta),
      residual = sub(delta, e(shift))
    raw.terrain.regions[0].frame.position[0] = shift
    const width = sub(
        e(raw.terrain.regions[0].shape.positions[3]),
        e(raw.terrain.regions[0].shape.positions[0])
      ),
      du = div(residual, width)
    for (const seed of raw.seeds) {
      const b = seed.barycentric
      if (seed.triangleOffset === 0)
        seed.barycentric = [sub(b[0], du), add(b[1], du), b[2]]
      else seed.barycentric = [b[0], add(b[1], du), sub(b[2], du)]
    }
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      raw
    )
    expect(result.sourceGeometry.status, result.reasons.join(';')).toBe(
      'blocked'
    )
    expect(result.reasons).toContain('support-on-authored-channel')
    expect(
      result.request?.terrain.regions.every((r) => r.classification === 'soil')
    ).toBe(true)
    const placed = required(result.projection).supports[0].fixedVertices
    const min = placed.reduce(
      (m, v) => (sub(v.position[0], m).numerator < 0n ? v.position[0] : m),
      placed[0].position[0]
    )
    expect(min).toEqual(e(channel.bounds.max[0]))
  })
  it.each([false, true])(
    'proves complete coplanar original soil union for complementary tripod %s',
    (opposite) => {
      const raw = fixture(opposite),
        owner = new WalkingTerrainPlacementOwner(),
        result = owner.prepare(source, demand, raw)
      expect(result.sourceGeometry, result.reasons.join(';')).toMatchObject({
        status: 'admitted'
      })
      expect(result.physicalStatus).toBe('unknown')
      expect(result.assessmentApplicability).toBe('unbound')
      expect(result.projection?.source).toBe(source)
      expect(result.supports).toHaveLength(3)
      expect(
        result.supports.some(
          (s) => s.sourceGeometry.certificate?.contributors.length === 2
        )
      ).toBe(true)
      for (const s of result.supports) {
        expect(
          s.sourceGeometry.certificate?.footTriangleOffsets.length
        ).toBeGreaterThan(0)
        expect(s.assessment?.friction).toMatchObject({ status: 'admitted' })
        expect(s.physicalStatus).toBe('unknown')
      }
      expect(result.work).toMatchObject({
        shapes: 1,
        regions: 1,
        terrainVertices: 4,
        footVertices: 12,
        unvisited: 0,
        projectionPreparations: 1
      })
      expect(result.work.trianglePairs).toBe(16)
      const before = owner.work
      expect(owner.prepare(source, demand, required(result.request))).toBe(
        result
      )
      expect(owner.read(source, demand, required(result.request))).toBe(result)
      expect(owner.work).toEqual(before)
      expect(Object.isFrozen(result.supports[0].anchor[0])).toBe(true)
      raw.terrain.regions[0].shape.positions[0] -= 1
      expect(result.request?.terrain.regions[0].shape.positions[0]).not.toBe(
        raw.terrain.regions[0].shape.positions[0]
      )
    },
    30000
  )
  it.each(['gap', 'overlap', 'noncoplanar', 'degenerate', 'partial'] as const)(
    'does not admit %s source coverage',
    (kind) => {
      const raw = fixture(),
        r = raw.terrain.regions[0]
      if (kind === 'gap') {
        r.shape.positions.push(...r.shape.positions.slice(0, 3))
        r.shape.positions[r.shape.positions.length - 1] += 0.02
        r.shape.indices[3] = 4
      }
      if (kind === 'overlap') {
        r.shape.indices.push(0, 1, 2)
        raw.partitions[0].regions[0].indexCount = 9
      }
      if (kind === 'noncoplanar') r.shape.positions[10] = 0.01
      if (kind === 'degenerate') r.shape.indices[1] = 0
      if (kind === 'partial') raw.partitions[0].regions[0].indexCount = 3
      const result = new WalkingTerrainPlacementOwner().prepare(
        source,
        demand,
        raw
      )
      expect(result.sourceGeometry.status, result.reasons.join(';')).toBe(
        'unknown'
      )
    }
  )
  it('keeps physical records unbound, independently from valid geometry', () => {
    const raw = fixture()
    raw.terrain.contactAssessments[0].friction = { status: 'blocked', evidence }
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      raw
    )
    expect(result.sourceGeometry.status).toBe('admitted')
    expect(result.supports[0].assessmentApplicability).toBe('unbound')
    expect(result.physicalStatus).toBe('unknown')
    expect(
      result.request?.terrain.contactAssessments[0].friction
    ).toMatchObject({ status: 'blocked' })
  })
  it.each(['height', 'slope', 'rut', 'debris'] as const)(
    'does not let geometry flags replace complete %s observations',
    (key) => {
      const raw = fixture()
      raw.terrain.observations[key] = { coverage: 'sampled', evidence }
      const result = new WalkingTerrainPlacementOwner().prepare(
        source,
        demand,
        raw
      )
      expect(result.sourceGeometry.status).toBe('unknown')
    }
  )
  it.each([
    'maxTrianglePairs',
    'maxPredicates',
    'maxInputValues',
    'maxBits'
  ] as const)('returns bounded unknown for exhausted %s', (key) => {
    const raw = fixture()
    raw.budget[key] = 1
    const result = new WalkingTerrainPlacementOwner().prepare(
      source,
      demand,
      raw
    )
    expect(result.sourceGeometry.status).toBe('unknown')
    expect(result.reasons.join(';')).toMatch(/budget/)
    if (key === 'maxPredicates') expect(result.work.unvisited).toBe(16)
  })
  it('rejects currentness, original triangle and exact seed mismatches', () => {
    const raw = fixture(),
      read = (v: unknown) =>
        readWalkingTerrainPlacementRequest(v, { source, demand })
    expect(() => read({ ...raw, farm: { ...demand.farm } })).toThrow()
    expect(() =>
      read({ ...raw, route: { ...required(demand.route) } })
    ).toThrow()
    expect(() =>
      read({
        ...raw,
        seeds: [
          { ...raw.seeds[0], worldAnchor: [0, 0, 0] },
          ...raw.seeds.slice(1)
        ]
      })
    ).toThrow()
    expect(() =>
      read({
        ...raw,
        seeds: [
          { ...raw.seeds[0], footPatch: raw.seeds[1].footPatch },
          ...raw.seeds.slice(1)
        ]
      })
    ).toThrow()
    expect(() =>
      read({
        ...raw,
        seeds: [
          { ...raw.seeds[0], barycentric: [f(1n), f(1n), f(0n)] },
          ...raw.seeds.slice(1)
        ]
      })
    ).toThrow()
    expect(() =>
      read({
        ...raw,
        terrain: {
          ...raw.terrain,
          sceneRevision: raw.terrain.sceneRevision + 1
        }
      })
    ).toThrow()
    const result = new WalkingTerrainPlacementOwner().prepare(source, demand, {
      ...raw,
      seeds: [
        { ...raw.seeds[0], barycentric: [f(1n), f(0n), f(0n)] },
        ...raw.seeds.slice(1)
      ]
    })
    expect(result.sourceGeometry.status).toBe('unknown')
    expect(result.reasons.join(';')).toMatch(/anchor/)
  })
  it('replaces preparation only for successor scenario identities and retires old reads', () => {
    const owner = new WalkingTerrainPlacementOwner(),
      raw = fixture(),
      first = owner.prepare(source, demand, raw),
      next = owner.prepare(source, demand, {
        ...raw,
        terrain: { ...raw.terrain, revision: 2 }
      })
    expect(next).not.toBe(first)
    expect(owner.work.preparations).toBe(2)
    expect(owner.read(source, demand, required(first.request))).toBeNull()
    owner.dispose()
    expect(owner.current).toBeNull()
  })
})
