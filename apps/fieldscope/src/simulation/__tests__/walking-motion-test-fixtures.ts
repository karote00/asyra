import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../../domain/walking-robot-definition'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import { evaluateExactPolynomialTrig } from '../../domain/kinematic-trigonometry'
import {
  dyadic,
  divide,
  subtract,
  multiply,
  interval
} from '../../domain/scalar-arithmetic'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import { WalkingMountedCrateOwner } from '../../domain/walking-mounted-crate'
import { DEFAULT_ROBOT } from '../../domain/robot-configuration'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'
import { validateSceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand } from '../scene-demand'
import { WalkingMotionOwner } from '../walking-motion'

export type NonlinearFraction = Readonly<{
  numerator: bigint
  denominator: bigint
}>
export const nonlinearGcd = (a: bigint, b: bigint): bigint =>
  (() => {
    if (b) {
      return nonlinearGcd(b, a % b)
    }
    if (a < 0n) {
      return -a
    }
    return a
  })()
export function nonlinearFraction(n: bigint, d = 1n): NonlinearFraction {
  if (d < 0n) {
    n = -n
    d = -d
  }
  const g = nonlinearGcd(n, d)
  return { numerator: n / g, denominator: d / g }
}
export function nonlinearExact(value: number) {
  const v = dyadic(value)
  return v.exponent >= 0
    ? nonlinearFraction(v.significand << BigInt(v.exponent))
    : nonlinearFraction(v.significand, 1n << BigInt(-v.exponent))
}
export const nonlinearAdd = (a: NonlinearFraction, b: NonlinearFraction) =>
  nonlinearFraction(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator
  )
export const nonlinearNeg = (a: NonlinearFraction) =>
  nonlinearFraction(-a.numerator, a.denominator)
export const nonlinearSub = (a: NonlinearFraction, b: NonlinearFraction) =>
  nonlinearAdd(a, nonlinearNeg(b))
export const nonlinearMul = (a: NonlinearFraction, b: NonlinearFraction) =>
  nonlinearFraction(a.numerator * b.numerator, a.denominator * b.denominator)
export const nonlinearDiv = (a: NonlinearFraction, b: NonlinearFraction) =>
  nonlinearFraction(a.numerator * b.denominator, a.denominator * b.numerator)
export function nonlinearRequired<T>(v: T | undefined | null): T {
  if (v == null) throw new Error('Missing current nonlinear fixture dependency')
  return v
}
export function firstVisitedReason<
  T extends {
    kind: string
    proofs: readonly { kind: string; reason?: string }[]
  }
>(rows: readonly T[]) {
  const selected = new Map<string, { row: T; proof: T['proofs'][number] }>()
  for (const row of rows) {
    if (row.kind !== 'unknown' && row.kind !== 'blocked') continue
    for (const proof of row.proofs) {
      if (proof.kind !== 'unknown' && proof.kind !== 'blocked') continue
      const reason = proof.reason ?? 'reason-unavailable'
      if (!selected.has(reason)) selected.set(reason, { row, proof })
    }
  }
  return [...selected.values()]
}
export function nonlinearFixture(
  sourceProfile:
    'solid-articulation/1' | 'solid-articulation/2' = 'solid-articulation/2',
  primitiveScene = false,
  trayCentreY?: number
) {
  const baseline = createSyntheticWalkingRobotDefinition({
    definitionId: 'nonlinear-baseline',
    sourceProfile
  })
  const stations = baseline.legs
    .filter((l) => l.side === 'left')
    .map((l) => l.mount.position[2])
    .sort((a, b) => a - b)
  const alpha = Math.min(
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
  const sourceOwner = new WalkingRobotSourceOwner()
  const source = sourceOwner.prepare(
    readWalkingRobotDefinition({
      ...baseline,
      base:
        trayCentreY === undefined
          ? baseline.base
          : {
              ...baseline.base,
              emptyPayloadTray: {
                ...baseline.base.emptyPayloadTray,
                centre: [0, trayCentreY, 0.24]
              }
            },
      definitionId: 'nonlinear-authored-profile',
      jointEvidence: evidence('nonlinear-authored-knee'),
      legs: baseline.legs.map((l) => ({
        ...l,
        jointRanges: { ...l.jointRanges, knee: [-alpha, l.jointRanges.knee[1]] }
      }))
    })
  )
  const farm = validateConfiguration(
      primitiveScene
        ? {
            ...DEFAULT_CONFIGURATION,
            length: 2,
            strips: [{ id: 'primitive-soil', kind: 'soil', width: 1.8 }]
          }
        : DEFAULT_CONFIGURATION
    ),
    geometry = new SiteGeometry(),
    scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  const soil = nonlinearRequired(
    farm.strips
      .filter((s) => s.kind === 'soil')
      .sort((a, b) => b.width - a.width)[0]
  )
  const xExtent =
    2 *
    Math.max(
      ...baseline.legs.map(
        (l) =>
          Math.abs(l.mount.position[0]) + l.coxa.length + l.foot.size[0] / 2
      )
    )
  const zExtent =
    nonlinearRequired(stations.at(-1)) -
    stations[0] +
    Math.max(...baseline.legs.map((l) => l.foot.size[2]))
  const travel =
    4 * Math.max(...baseline.legs.map((l) => l.upper.length)) * alpha
  const length = zExtent + 2 * travel + xExtent
  const from = (farm.length - length) / 2
  if (from < 0 || soil.width < xExtent)
    throw new Error('Current source route does not fit')
  const demand = prepareSceneDemand(
    farm,
    scene,
    validateSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: soil.id,
        from,
        until: from + length
      },
      evidence: evidence('nonlinear-scene'),
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
  )
  const route = nonlinearRequired(demand.route)
  const centre = [0, 1, 2].map((k) =>
    nonlinearDiv(
      nonlinearAdd(
        nonlinearExact(route.volume.min[k]),
        nonlinearExact(route.volume.max[k])
      ),
      nonlinearExact(2)
    )
  )
  const groups = [true, false].map((side) =>
    source.rig.legChains
      .filter(
        (c) => ((c.side === 'left') !== (c.station === 'middle')) === side
      )
      .map((c) => c.id)
  )
  const half = nonlinearDiv(nonlinearExact(alpha), nonlinearExact(2))
  const s = evaluateExactPolynomialTrig('sin', half).value,
    c = evaluateExactPolynomialTrig('cos', half).value
  const norm = nonlinearAdd(nonlinearMul(s, s), nonlinearMul(c, c))
  const sigma = nonlinearDiv(
    nonlinearMul(nonlinearExact(2), nonlinearMul(s, c)),
    norm
  )
  const cosine = nonlinearDiv(
    nonlinearSub(nonlinearMul(c, c), nonlinearMul(s, s)),
    norm
  )
  const local = source.rig.legChains.map((chain) => {
    const contact = nonlinearRequired(
      source.rig.contacts.feet.find((p) => p.part.bodyId === chain.footBodyId)
    )
    const frames = chain.jointIds.map(
      (id) =>
        nonlinearRequired(source.rig.joints.find((j) => j.id === id)).frame
    )
    const foot = nonlinearRequired(
      nonlinearRequired(
        source.rig.bodies.find((b) => b.id === chain.footBodyId)
      ).fixedFrame
    )
    const origin = [0, 1, 2].map((k) =>
      [...frames, foot, contact.localFrame].reduce(
        (v, f) => nonlinearAdd(v, nonlinearExact(f.position[k])),
        nonlinearExact(0)
      )
    )
    const upper = nonlinearRequired(
      source.definition.legs.find(
        (l) => l.side === chain.side && l.station === chain.station
      )
    ).upper.length
    origin[1] = nonlinearAdd(
      origin[1],
      nonlinearMul(
        nonlinearExact(upper),
        nonlinearSub(nonlinearExact(1), cosine)
      )
    )
    const dz = nonlinearMul(nonlinearExact(upper), sigma)
    origin[2] = nonlinearAdd(
      origin[2],
      groups[0].includes(chain.id) ? nonlinearNeg(dz) : dz
    )
    return {
      chainId: chain.id,
      part: contact.part,
      patch: contact.patch,
      anchorOrigin: origin
    }
  })
  const grounding = nonlinearNeg(local[0].anchorOrigin[1])
  const anchors = local.map((v) => ({
    ...v,
    anchorOrigin: v.anchorOrigin.map((n, k) =>
      nonlinearAdd(n, k === 1 ? grounding : centre[k])
    )
  }))
  const cycleOwner = new WalkingConstrainedCycleOwner()
  const cycle = cycleOwner.prepare(source, {
    format: 'walking-constrained-cycle/1',
    source,
    fixedJoints: source.rig.presets.stowed,
    baseOrientation: [
      nonlinearExact(0),
      nonlinearExact(0),
      nonlinearExact(0),
      nonlinearExact(1)
    ],
    alpha: nonlinearExact(alpha),
    groups,
    anchors,
    budget: { maxOperations: 10000000, maxBits: 24000 }
  })
  const minX = route.volume.min[0],
    maxX = route.volume.max[0],
    minZ = route.volume.min[2],
    maxZ = route.volume.max[2]
  const shape = {
    kind: 'triangles',
    positions: [minX, 0, minZ, maxX, 0, minZ, maxX, 0, maxZ, minX, 0, maxZ],
    indices: [0, 1, 2, 0, 2, 3]
  }
  const frame = { position: [0, 0, 0], rotation: [0, 0, 0, 1] }
  const terrain = {
    format: 'walking-terrain/1',
    id: 'nonlinear-terrain',
    revision: 1,
    sceneRevision: scene.revision,
    route: { bay: route.bay, stripId: route.stripId },
    provenance: evidence('nonlinear-terrain'),
    observations: Object.fromEntries(
      ['height', 'slope', 'rut', 'debris'].map((k) => [
        k,
        { coverage: 'complete', evidence: evidence('nonlinear-' + k) }
      ])
    ),
    regions: [
      {
        id: 'nonlinear-soil',
        classification: 'soil',
        sourceId: 'nonlinear-soil-source',
        shape,
        frame,
        binding: { kind: 'route-soil', bay: route.bay, stripId: route.stripId },
        keepOut: { kind: 'none' }
      }
    ],
    contactAssessments: source.rig.contacts.feet.map((contact) => ({
      id: 'nonlinear-contact-' + contact.patch.id,
      footPatchId: contact.patch.id,
      terrainRegionId: 'nonlinear-soil',
      pathId: 'nonlinear-path',
      from: 0,
      until: 2,
      loadCaseId: 'nonlinear-load',
      coverage: 'complete',
      ...Object.fromEntries(
        ['geometry', 'friction', 'bearing', 'sinkage'].map((k) => [
          k,
          { status: 'admitted', evidence: evidence('nonlinear-' + k) }
        ])
      )
    }))
  }
  const events = [
    { event: 'initial-a', phase: 0, u: 0, group: 0 },
    { event: 'initial-b', phase: 0, u: 0, group: 1 },
    { event: 'handoff-b', phase: 0, u: 1, group: 1 },
    { event: 'final-a', phase: 1, u: 1, group: 0 }
  ].map((event) => {
    const point = cycleOwner.evaluate(
      cycle,
      event.phase,
      nonlinearExact(event.u)
    )
    const seeds = groups[event.group].map((chainId) => {
      const chain = nonlinearRequired(
        source.rig.legChains.find((c) => c.id === chainId)
      )
      const contact = nonlinearRequired(
        source.rig.contacts.feet.find((c) => c.part.bodyId === chain.footBodyId)
      )
      const foot = nonlinearRequired(
        point.bodies.find((b) => b.body.id === chain.footBodyId)
      ).exact
      const p = foot.origin.map((v, k) =>
        nonlinearAdd(
          v,
          foot.matrix[k].reduce(
            (sum, q, j) =>
              nonlinearAdd(
                sum,
                nonlinearMul(q, nonlinearExact(contact.localFrame.position[j]))
              ),
            nonlinearExact(0)
          )
        )
      )
      const x = nonlinearDiv(
        nonlinearSub(p[0], nonlinearExact(minX)),
        nonlinearSub(nonlinearExact(maxX), nonlinearExact(minX))
      )
      const z = nonlinearDiv(
        nonlinearSub(p[2], nonlinearExact(minZ)),
        nonlinearSub(nonlinearExact(maxZ), nonlinearExact(minZ))
      )
      const first = nonlinearSub(x, z).numerator >= 0n
      return {
        chainId,
        footPart: contact.part,
        footPatch: contact.patch,
        contactAssessmentId: 'nonlinear-contact-' + contact.patch.id,
        terrainRegionId: 'nonlinear-soil',
        sourceRegionId: 'nonlinear-soil-sheet',
        triangleOffset: first ? 0 : 3,
        barycentric: first
          ? [nonlinearSub(nonlinearExact(1), x), nonlinearSub(x, z), z]
          : [nonlinearSub(nonlinearExact(1), z), x, nonlinearSub(z, x)]
      }
    })
    return { event: event.event, seeds }
  })
  const raw = {
    format: 'walking-motion-request/3' as const,
    requestId: 'nonlinear-request',
    source,
    demand,
    cycle,
    path: {
      id: 'nonlinear-path',
      phases: [
        { phase: 0, from: 0, until: 1 },
        { phase: 1, from: 1, until: 2 }
      ]
    },
    gait: { id: 'nonlinear-gait', provenance: evidence('nonlinear-gait') },
    terrain,
    load: {
      id: 'nonlinear-load',
      provenance: evidence('nonlinear-load'),
      crate: { kind: 'unknown' },
      carried: { kind: 'none' }
    },
    externalSources: [
      {
        sourceId: 'nonlinear-soil-source',
        regions: [
          {
            id: 'nonlinear-soil-sheet',
            kind: 'sheet',
            indexStart: 0,
            indexCount: 6
          }
        ]
      }
    ],
    terrainEvents: events,
    targetContacts: [],
    placementBudget: {
      maxInputValues: 100000,
      maxTrianglePairs: 10000,
      maxPredicates: 100000,
      maxBits: 24000,
      maxProjectionOperations: 1000000
    },
    budget: {
      maxPhaseNodes: 32,
      maxSubdivisions: 30,
      maxRegionPairs: 2000000,
      maxExactPredicates: 5000000,
      maxBits: 24000,
      maxCycleOperations: 20000000,
      maxInputValues: 500000,
      maxEnvelopePairs: 2000000
    }
  }
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => demand,
    getCurrentWalkingRobotSource: () => source,
    getCurrentWalkingCycle: () => ({ owner: cycleOwner, cycle })
  })
  return { source, sourceOwner, demand, cycle, cycleOwner, owner, raw }
}
const evidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: `${id} - synthetic walking admission evidence`
})

export function mountedConsumerFixture(trayCentreY?: number) {
  const f = nonlinearFixture('solid-articulation/2', true, trayCentreY)
  const mountOwner = new WalkingMountedCrateOwner(f.sourceOwner)
  const crate = mountOwner.prepare(f.source, {
    format: 'walking-mounted-crate-request/1',
    dimensions: {
      width: DEFAULT_ROBOT.width,
      length: DEFAULT_ROBOT.length,
      height: DEFAULT_ROBOT.height
    },
    minimumClearance: { metres: 0.003125, evidence: evidence('mounted-gap') },
    retention: evidence('mounted-retention'),
    massIdentity: 'mounted-mass'
  })
  return {
    ...f,
    mountOwner,
    crate,
    mounted: { owner: mountOwner, crate },
    current: { owner: f.cycleOwner, cycle: f.cycle }
  }
}
