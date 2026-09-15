import { beforeAll, describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { evaluateWalkingRobotPose } from '../../domain/walking-robot-kinematics'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import { readWalkingMotionRequest } from '../../domain/walking-motion-contract'
import { validateSceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand } from '../scene-demand'
import {
  prepareWalkingMotionIntervals,
  walkingSourcePointBounds
} from '../walking-motion-interval'
import { WalkingMotionOwner } from '../walking-motion'
import { TriangleBuilder } from '../../domain/mesh'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { prepareQueryExactForwardFrame } from '../ray-query'
import {
  WalkingSourceRelationEvaluator,
  WalkingSelectedChainRelationOwner,
  prepareWalkingSourceRelations
} from '../walking-source-relation'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import {
  cycleFixture,
  exact,
  fraction,
  over
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'

describe('selected-chain source relations', () => {
  it('requires both original named patches for a complete boundary locus', () => {
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000,
      maxBits: 24000
    })
    const input = material()
    const prepared = evaluator.prepare(input.shape, input.region)
    const first = { region: prepared, frames: Object.freeze([frame(0)]) }
    const second = { region: prepared, frames: Object.freeze([frame(1)]) }
    const relation = evaluator.relate(first, second, 0)
    expect(relation.kind).toBe('boundary')
    const patch = Object.freeze({
      id: 'complete-boundary-source',
      region: input.region,
      ranges: Object.freeze([
        Object.freeze({
          indexStart: input.region.indexStart,
          indexCount: input.region.indexCount
        })
      ])
    })
    const firstPart = Object.freeze({
      shape: input.shape,
      patches: Object.freeze([patch])
    })
    const secondPart = Object.freeze({
      shape: input.shape,
      patches: Object.freeze([patch])
    })
    const firstReferences = [{ part: firstPart, patch }]
    const secondReferences = [{ part: secondPart, patch }]
    const prove = (left = firstReferences, right = secondReferences) =>
      WalkingSelectedChainRelationOwner.proveNamedBoundaryLocus(
        evaluator,
        first,
        second,
        relation,
        firstPart,
        secondPart,
        left,
        right
      )
    expect(prove()).toBeDefined()
    expect(prove([], secondReferences)).toBeUndefined()
    expect(prove(firstReferences, [])).toBeUndefined()
    expect(
      prove([{ part: firstPart, patch: Object.freeze({ ...patch }) }])
    ).toBeUndefined()
    expect(
      prove(firstReferences, [
        { part: secondPart, patch: Object.freeze({ ...patch }) }
      ])
    ).toBeUndefined()
    expect(
      prove([{ part: Object.freeze({ ...firstPart }), patch }])
    ).toBeUndefined()
  })
  it('retains unknown coverage after real subdivision exhaustion', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    const chain = source.rig.legChains.find(
      (entry) => entry.id === 'right-front'
    )
    if (!chain) throw new Error('Missing selected chain')
    const rootJoint = source.rig.joints.find(
      (entry) => entry.id === chain.jointIds[0]
    )
    if (!rootJoint) throw new Error('Missing selected root')
    const motion = owner.prepareSelectedChainMotion(cycle, {
      format: 'walking-selected-chain-root-motion/1',
      cycle,
      phase: 0,
      at: fraction(1n, 2n),
      chainId: chain.id,
      targetAbduction: exact(rootJoint.domain[1])
    })
    const result = new WalkingSelectedChainRelationOwner().prepare(
      { owner, cycle },
      {
        format: 'walking-selected-chain-source-relation-request/1',
        motion,
        budget: {
          maxSubdivisions: 1,
          maxRegionPairs: 2000000,
          maxExactPredicates: 5000000,
          maxBits: 24000
        }
      }
    )
    console.info(
      'selected-chain subdivision',
      JSON.stringify({
        status: result.status,
        coverage: result.coverage,
        subdivisions: result.work.subdivisions,
        nodes: result.work.selectedBoundPreparations,
        predicates: result.work.evaluator.exactPredicates,
        reasons: result.reasons
      })
    )
    expect(result.work.subdivisions).toBe(1)
    expect(result.work.selectedBoundPreparations).toBeGreaterThan(1)
    expect(result.work.evaluator.exactPredicates).toBeLessThan(5000000)
    expect(
      result.reasons.some((reason) =>
        reason.endsWith('interval-subdivision-exhausted')
      )
    ).toBe(true)
    expect(result.status).toBe('unknown')
    expect(result.coverage.unknown + result.coverage.unvisited).toBeGreaterThan(
      0
    )
    expect(
      result.coverage.strictBounds +
        result.coverage.exactSeparated +
        result.coverage.declaredBoundary +
        result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(result.coverage.required)
  })
  it('extends admitted fixed frames with exact full-compiler equivalence', () => {
    const scalar = (numerator: bigint, denominator = 1n) => ({
      numerator,
      denominator
    })
    const fixed = {
      origin: [scalar(1n, 3n), scalar(0n), scalar(0n)] as const,
      matrix: [
        [scalar(1n), scalar(0n), scalar(0n)],
        [scalar(0n), scalar(1n), scalar(0n)],
        [scalar(0n), scalar(0n), scalar(1n)]
      ] as const
    }
    const limits = {
      maxRegionPairs: 100,
      maxExactPredicates: 100000,
      maxBits: 24000
    }
    const evaluator = new WalkingSourceRelationEvaluator(limits)
    const template = evaluator.prepareRationalFrameTemplate(
      [fixed],
      limits.maxBits
    )
    const input = material(),
      prepared = evaluator.prepare(input.shape, input.region)
    for (const numerator of [4n, 8n]) {
      const moving = {
        ...fixed,
        origin: [scalar(numerator, 5n), scalar(0n), scalar(0n)] as const
      }
      const before = evaluator.work.nodeScalarVisits
      const extended = evaluator.extendRationalFrameTemplate(
        template,
        [moving],
        [0]
      )
      expect(evaluator.work.nodeScalarVisits - before).toBe(12)
      const reference = evaluator.prepareRationalNode(
        [fixed, moving],
        limits.maxBits
      )
      expect(extended.scale).toEqual(reference.scale)
      expect(extended.frames).toEqual(reference.frames)
      const relation = (
        node: ReturnType<WalkingSourceRelationEvaluator['prepareRationalNode']>
      ) =>
        evaluator.relateRational(
          evaluator.rationalPlacement(prepared, node, 0),
          evaluator.rationalPlacement(prepared, node, 1),
          node,
          0
        )
      expect(relation(extended)).toEqual(relation(reference))
    }
    expect(evaluator.work.fixedFrameRescales).toBe(2)
    expect(() =>
      new WalkingSourceRelationEvaluator(limits).extendRationalFrameTemplate(
        template,
        [fixed],
        [0]
      )
    ).toThrow()
    evaluator.retireSourceQueryWork()
    expect(() =>
      evaluator.extendRationalFrameTemplate(template, [fixed], [0])
    ).toThrow()
  })
  it('reissues certified material into the current budget and rejects foreign or incomplete evidence', () => {
    const input = material()
    const limits = {
      maxRegionPairs: 100,
      maxExactPredicates: 100000,
      maxBits: 24000
    }
    const first = new WalkingSourceRelationEvaluator(limits)
    const product = first.prepare(input.shape, input.region)
    expect(product.certified).toBe(true)
    const second = new WalkingSourceRelationEvaluator(limits)
    const rebound = second.reuseCertifiedSource(
      first,
      product,
      input.shape,
      input.region
    )
    expect(second.work.regionPreparations).toBe(0)
    expect(second.work.sourceCertificationReuses).toBe(1)
    expect(second.work.sourceScalarRebindings).toBe(product.points.length * 3)
    expect(
      second.reuseCertifiedSource(first, product, input.shape, input.region)
    ).toBe(rebound)
    expect(second.work.sourceCertificationReuses).toBe(1)
    expect(() =>
      second.reuseCertifiedSource(
        new WalkingSourceRelationEvaluator(limits),
        product,
        input.shape,
        input.region
      )
    ).toThrow()
    const shell = material('open-shell'),
      incomplete = first.prepare(shell.shape, shell.region)
    expect(() =>
      second.reuseCertifiedSource(first, incomplete, shell.shape, shell.region)
    ).toThrow()
    const exhausted = new WalkingSourceRelationEvaluator({
      ...limits,
      maxExactPredicates: 1
    })
    expect(() =>
      exhausted.reuseCertifiedSource(first, product, input.shape, input.region)
    ).toThrow()
    expect(exhausted.work.sourceCertificationReuses).toBe(0)
  })
  it('maps actual convex volume overlap to blocked and never admits an unproved boundary', () => {
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000,
      maxBits: 24000
    })
    const input = material(),
      region = evaluator.prepare(input.shape, input.region)
    const scalar = (numerator: bigint) => ({ numerator, denominator: 1n })
    const identity = {
      origin: [scalar(0n), scalar(0n), scalar(0n)] as const,
      matrix: [
        [scalar(1n), scalar(0n), scalar(0n)],
        [scalar(0n), scalar(1n), scalar(0n)],
        [scalar(0n), scalar(0n), scalar(1n)]
      ] as const
    }
    const node = evaluator.prepareRationalNode(
      [identity, { ...identity, origin: [scalar(1n), scalar(0n), scalar(0n)] }],
      24000
    )
    const first = evaluator.rationalPlacement(region, node, 0)
    const overlap = WalkingSelectedChainRelationOwner.classifyLeaf(
      evaluator,
      first,
      first,
      node
    )
    expect(overlap.relation.kind).toBe('volume-overlap')
    expect(overlap.kind).toBe('blocked')
    const boundary = WalkingSelectedChainRelationOwner.classifyLeaf(
      evaluator,
      first,
      evaluator.rationalPlacement(region, node, 1),
      node
    )
    expect(boundary.relation.kind).toBe('boundary')
    expect(boundary.kind).toBe('pending')
  })
  it('proves the actual root half-abduction with exhaustive local work', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner(),
      cycle = owner.prepare(source, raw)
    const motion = owner.prepareSelectedChainMotion(cycle, {
      format: 'walking-selected-chain-root-motion/1',
      cycle,
      phase: 0,
      at: fraction(1n, 2n),
      chainId: 'right-front',
      targetAbduction: over(cycle.recipe.alpha, exact(2))
    })
    const relations = new WalkingSelectedChainRelationOwner()
    const current = { owner, cycle }
    const result = relations.prepare(current, {
      format: 'walking-selected-chain-source-relation-request/1',
      motion,
      budget: {
        maxSubdivisions: 30,
        maxRegionPairs: 2000000,
        maxExactPredicates: 5000000,
        maxBits: 24000
      }
    })
    const required =
      motion.parts.reduce((n, p) => n + p.part.regions.length, 0) *
      motion.fixed.parts.reduce((n, p) => n + p.part.regions.length, 0)
    expect(result.coverage.required).toBe(required)
    expect(
      result.coverage.strictBounds +
        result.coverage.exactSeparated +
        result.coverage.declaredBoundary +
        result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(required)
    expect(result.work.rootPartOverlaps).toBeGreaterThan(0)
    expect(result.work.fixedFixedPairs).toBe(0)
    expect(result.work.movingMovingPairs).toBe(0)
    expect(result.work.externalPairs).toBe(0)
    expect(result.work.terrainPairs).toBe(0)
    expect(result.work.exactLeafPairs).toBeLessThan(required)
    expect(
      result.status,
      JSON.stringify({ reasons: result.reasons, work: result.work })
    ).toBe('clear')
    expect(
      result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(0)
    console.info(
      'selected-chain work',
      JSON.stringify({
        required,
        strictBounds: result.coverage.strictBounds,
        exactSeparated: result.coverage.exactSeparated,
        declaredBoundary: result.coverage.declaredBoundary,
        exactLeafPairs: result.work.exactLeafPairs,
        rootPartOverlaps: result.work.rootPartOverlaps,
        nodes: result.work.selectedBoundPreparations,
        selectedBodyVisits: result.work.selectedBodyVisits,
        fixedFramePreparations: result.work.fixedFramePreparations,
        fixedFrameRescales: result.work.evaluator.fixedFrameRescales,
        sourceCertifications: result.work.evaluator.regionPreparations,
        predicates: result.work.evaluator.exactPredicates
      })
    )
    const work = relations.work
    expect(relations.read(current, motion)).toBe(result)
    expect(relations.work).toEqual(work)
    expect(relations.prepare(current, result.request)).toBe(result)
    expect(relations.work).toEqual(work)
    const nextMotion = owner.prepareSelectedChainMotion(cycle, {
      ...motion.recipe,
      targetAbduction: {
        numerator: cycle.recipe.alpha.numerator * 3n,
        denominator: cycle.recipe.alpha.denominator * 4n
      }
    })
    const reused = relations.prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    const fresh = new WalkingSelectedChainRelationOwner().prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    expect(reused.status).toBe('clear')
    expect(reused.coverage).toEqual(fresh.coverage)
    expect(reused.work.evaluator.regionPreparations).toBe(0)
    expect(reused.work.evaluator.sourceCertificationReuses).toBeGreaterThan(0)
    expect(reused.work.evaluator.sourceScalarRebindings).toBeGreaterThan(0)
    expect(reused.work.sourceLocalBoundsVertices).toBe(0)
    expect(reused.work.sourceRegionIndexReads).toBe(0)
    expect(
      result.covers.reduce((n, cover) => n + cover.cardinality, 0) +
        result.pairs.length
    ).toBe(required)
    expect(
      result.pairs.every((pair) =>
        pair.proofs.every((proof) =>
          ['exactSeparated', 'declaredBoundary'].includes(proof.kind)
        )
      )
    ).toBe(true)
    const exhausted = relations.prepare(current, {
      ...result.request,
      budget: { ...result.request.budget, maxExactPredicates: 1 }
    })
    expect(exhausted.status).toBe('unknown')
    expect(exhausted.coverage.unvisited).toBe(required)
    expect(
      exhausted.coverage.strictBounds +
        exhausted.coverage.exactSeparated +
        exhausted.coverage.declaredBoundary
    ).toBe(0)
    expect(
      relations.read(
        { owner: new WalkingConstrainedCycleOwner(), cycle },
        motion
      )
    ).toBeUndefined()
    const replacement = cycleFixture({ sourceProfile: 'solid-articulation/2' })
    const replacementCycle = owner.prepare(replacement.source, replacement.raw)
    expect(relations.read(current, motion)).toBeUndefined()
    const replacementMotion = owner.prepareSelectedChainMotion(
      replacementCycle,
      {
        ...motion.recipe,
        cycle: replacementCycle,
        targetAbduction: over(replacementCycle.recipe.alpha, exact(2))
      }
    )
    const replaced = relations.prepare(
      { owner, cycle: replacementCycle },
      { ...result.request, motion: replacementMotion }
    )
    expect(replaced.status).toBe('clear')
    expect(replaced.work.evaluator.sourceCertificationReuses).toBe(0)
    expect(replaced.work.evaluator.regionPreparations).toBe(
      result.work.evaluator.regionPreparations
    )
    owner.dispose()
    expect(relations.read(current, motion)).toBeUndefined()
  })
})

function material(kind: 'closed-solid' | 'open-shell' = 'closed-solid') {
  const builder = new TriangleBuilder()
  builder.box([0, 0, 0], [1, 1, 1])
  const descriptor = readSpatialDescriptor({
    kind: 'mesh',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    shape: {
      kind: 'triangles',
      positions: builder.positions,
      indices: builder.indices
    },
    color: 0,
    opacity: 1,
    wireframe: false,
    selectable: false
  })
  if (descriptor.kind !== 'mesh' || descriptor.shape.kind !== 'triangles')
    throw new Error('Missing test material')
  return {
    shape: descriptor.shape,
    region: Object.freeze({ ...builder.regions()[0], kind })
  }
}
const frame = (x: number) =>
  prepareQueryExactForwardFrame({ position: [x, 0, 0], rotation: [0, 0, 0, 1] })
describe('canonical nonlinear exact axis work', () => {
  type Vector = readonly [number, number, number]
  type Matrix = readonly [Vector, Vector, Vector]
  const identity: Matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
  const faceMatrix: Matrix = [
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, -1]
  ]
  const firstRod: Matrix = [
    [4, 0, 0.5],
    [4, 0, -0.5],
    [0, 0.5, 0]
  ]
  const secondRod: Matrix = [
    [0, 0.5, 0],
    [4, 0, 0.5],
    [4, 0, -0.5]
  ]
  function fixture(
    firstMatrix = faceMatrix,
    secondMatrix = faceMatrix,
    origin: Vector = [-1.5, -1.5, 1.5],
    maxExactPredicates = 1000000
  ) {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates,
      maxBits: 24000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const fraction = (n: number) => {
      let numerator = BigInt(n * 4),
        denominator = 4n,
        x = numerator < 0n ? -numerator : numerator,
        y = denominator
      while (y) {
        const r = x % y
        x = y
        y = r
      }
      numerator /= x
      denominator /= x
      return Object.freeze({ numerator, denominator })
    }
    const exact = (m: Matrix, p: Vector) =>
      Object.freeze({
        origin: Object.freeze([
          fraction(p[0]),
          fraction(p[1]),
          fraction(p[2])
        ] as const),
        matrix: Object.freeze([
          Object.freeze([
            fraction(m[0][0]),
            fraction(m[0][1]),
            fraction(m[0][2])
          ] as const),
          Object.freeze([
            fraction(m[1][0]),
            fraction(m[1][1]),
            fraction(m[1][2])
          ] as const),
          Object.freeze([
            fraction(m[2][0]),
            fraction(m[2][1]),
            fraction(m[2][2])
          ] as const)
        ] as const)
      })
    const node = owner.prepareRationalNode(
      [exact(firstMatrix, [0, 0, 0]), exact(secondMatrix, origin)],
      24000
    )
    const first = owner.rationalPlacement(solid, node, 0),
      second = owner.rationalPlacement(solid, node, 1)
    return {
      owner,
      node,
      solid,
      first,
      second,
      firstMatrix,
      secondMatrix,
      origin
    }
  }
  type IntegerVector = readonly [bigint, bigint, bigint]
  function sheetFixture(
    positions: readonly number[],
    indices: readonly number[],
    kind: 'sheet' | 'open-shell' = 'sheet',
    maxExactPredicates = 1000000
  ) {
    const input = fixture(identity, identity, [0, 0, 0], maxExactPredicates)
    const shape = Object.freeze({
      kind: 'triangles' as const,
      positions: Object.freeze([...positions]),
      indices: Object.freeze([...indices])
    })
    const region = Object.freeze({
      id: 'original-sheet',
      kind,
      indexStart: 0,
      indexCount: indices.length
    })
    const prepared = input.owner.prepare(shape, region)
    return {
      ...input,
      sheet: input.owner.rationalPlacement(prepared, input.node, 1)
    }
  }
  it('separates each noncoplanar original sheet triangle without filling the aggregate sheet', () => {
    const input = sheetFixture(
      [-2, -1, -1, -2, 1, -1, -2, 0, 1, -1, -1, 2, 1, -1, 2, 0, 1, 2],
      [0, 1, 2, 3, 4, 5]
    )
    expect(input.sheet.region.certified).toBe(false)
    const proofs = [0, 3].map((offset) =>
      input.owner.relateRationalSheetTriangle(
        input.first,
        input.sheet,
        input.node,
        offset
      )
    )
    expect(proofs.map((p) => p.kind)).toEqual(['separated', 'separated'])
    expect(proofs.map((p) => p.triangleOffset)).toEqual([0, 3])
    expect(input.owner.work.sheetTrianglePairs).toBe(2)
    expect(input.owner.work.regionPairs).toBe(0)
  })
  it.each([
    { name: 'crossing', points: [-1, 0, 0, 1, 0, 0, 0, 1, 0] },
    {
      name: 'contained',
      points: [-0.25, 0, -0.25, 0.25, 0, -0.25, 0, 0, 0.25]
    },
    {
      name: 'boundary',
      points: [0.5, -0.25, -0.25, 0.5, 0.25, -0.25, 0.5, 0, 0.25]
    }
  ])(
    'retains an original triangle witness for $name sheet surface intersection',
    (item) => {
      const input = sheetFixture(item.points, [0, 1, 2])
      expect(
        input.owner.relateRationalSheetTriangle(
          input.first,
          input.sheet,
          input.node,
          0
        )
      ).toMatchObject({
        kind: 'surface-intersection',
        proof: 'complete-triangle-sat',
        triangleOffset: 0
      })
      expect(input.sheet.region.certified).toBe(false)
    }
  )
  it('does not promote degenerate or unresolved open-shell geometry into a sheet certificate', () => {
    for (const kind of ['sheet', 'open-shell'] as const) {
      const input = sheetFixture([0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 1, 2], kind)
      expect(
        input.owner.relateRationalSheetTriangle(
          input.first,
          input.sheet,
          input.node,
          0
        ).kind
      ).toBe('unknown')
    }
  })
  it('matches an independent eager cube/triangle SAT oracle for original source triangles', () => {
    const triangles = [
      [-2, -1, -1, -2, 1, -1, -2, 0, 1],
      [-1, 0, 0, 1, 0, 0, 0, 1, 0],
      [-0.25, 0, -0.25, 0.25, 0, -0.25, 0, 0, 0.25],
      [0.5, -0.25, -0.25, 0.5, 0.25, -0.25, 0.5, 0, 0.25],
      [0.75, 0.75, 0, 0.75, 0, 0.75, 0, 0.75, 0.75]
    ]
    const cross = (a: readonly bigint[], b: readonly bigint[]) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ]
    const sub = (a: readonly bigint[], b: readonly bigint[]) =>
      a.map((v, k) => v - b[k])
    const dot = (a: readonly bigint[], b: readonly bigint[]) =>
      a.reduce((n, v, k) => n + v * b[k], 0n)
    const cube = [-2n, 2n].flatMap((x) =>
      [-2n, 2n].flatMap((y) => [-2n, 2n].map((z) => [x, y, z]))
    )
    const basis = [
      [1n, 0n, 0n],
      [0n, 1n, 0n],
      [0n, 0n, 1n]
    ]
    for (const triangle of triangles) {
      const points = [0, 3, 6].map((i) =>
        triangle.slice(i, i + 3).map((v) => BigInt(v * 4))
      )
      const edges = points.map((p, i) => sub(points[(i + 1) % 3], p))
      const axes = [
        ...basis,
        cross(edges[0], sub(points[2], points[0])),
        ...basis.flatMap((axis) => edges.map((edge) => cross(axis, edge)))
      ]
      const separated = axes
        .filter((a) => a.some((v) => v !== 0n))
        .some((axis) => {
          const a = cube.map((p) => dot(p, axis)),
            b = points.map((p) => dot(p, axis))
          const min = (v: bigint[]) => v.reduce((a, b) => (a < b ? a : b)),
            max = (v: bigint[]) => v.reduce((a, b) => (a > b ? a : b))
          return max(a) < min(b) || max(b) < min(a)
        })
      const input = sheetFixture(triangle, [0, 1, 2])
      expect(
        input.owner.relateRationalSheetTriangle(
          input.first,
          input.sheet,
          input.node,
          0
        ).kind
      ).toBe(separated ? 'separated' : 'surface-intersection')
    }
  })
  it('preserves duplicate-coordinate original offsets and rejects foreign, unaligned or exhausted triangle work', () => {
    const positions = [-1, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, 0, 1, 0]
    const input = sheetFixture(positions, [0, 1, 2, 3, 4, 5])
    expect(input.sheet.region.points).toHaveLength(3)
    expect(
      input.owner.relateRationalSheetTriangle(
        input.first,
        input.sheet,
        input.node,
        3
      )
    ).toMatchObject({ kind: 'surface-intersection', triangleOffset: 3 })
    expect(() =>
      input.owner.relateRationalSheetTriangle(
        input.first,
        input.sheet,
        input.node,
        1
      )
    ).toThrow()
    expect(() =>
      input.owner.relateRationalSheetTriangle(
        input.first,
        input.sheet,
        input.node,
        6
      )
    ).toThrow()
    const foreign = sheetFixture(positions, [0, 1, 2])
    expect(() =>
      input.owner.relateRationalSheetTriangle(
        input.first,
        foreign.sheet,
        input.node,
        0
      )
    ).toThrow()
    const baseline = sheetFixture(positions, [0, 1, 2])
    const cap = baseline.owner.work.exactPredicates + 1
    const limited = sheetFixture(positions, [0, 1, 2], 'sheet', cap)
    expect(
      limited.owner.relateRationalSheetTriangle(
        limited.first,
        limited.sheet,
        limited.node,
        0
      ).kind
    ).toBe('unknown')
    expect(limited.owner.work.exactPredicates).toBe(cap)
    expect(limited.owner.work.sheetTrianglePairs).toBe(1)
    expect(limited.owner.work.sheetTriangleIntersections).toBe(0)
    expect(limited.owner.work.sheetTriangleUnknown).toBe(1)
  })
  const originalIntervalBounds = (
    placement: ReturnType<typeof fixture>['first']
  ) => {
    const { shape, region } = placement.region
    const indices = [
      ...new Set(
        shape.indices.slice(
          region.indexStart,
          region.indexStart + region.indexCount
        )
      )
    ]
    const vertices = indices.map(
      (index) =>
        [0, 1, 2].map((k) => ({
          low: shape.positions[index * 3 + k],
          high: shape.positions[index * 3 + k]
        })) as [
          { low: number; high: number },
          { low: number; high: number },
          { low: number; high: number }
        ]
    )
    return { placement, indices, vertices }
  }
  it('dispatches original sheet region interval coverage and preserves mathematical input identities', () => {
    const input = sheetFixture([-2, -1, -1, -2, 1, -1, -2, 0, 1], [0, 1, 2])
    const solid = originalIntervalBounds(input.first),
      sheet = originalIntervalBounds(input.sheet)
    const parameter = {
      low: { numerator: 0n, denominator: 1n },
      high: { numerator: 1n, denominator: 1n }
    }
    const evidence = { solid, sheet, node: input.node, parameter, margin: 0 }
    const result = input.owner.relateRationalSheetRegion(evidence)
    expect(result.kind).toBe('separated')
    expect(result.input).toBe(evidence)
    expect(result.work).toMatchObject({ required: 1, visited: 1, unvisited: 0 })
    const wide = {
      ...evidence,
      sheet: {
        ...sheet,
        vertices: sheet.vertices.map(
          (p) => [{ low: -2, high: 2 }, p[1], p[2]] as typeof p
        )
      }
    }
    expect(input.owner.relateRationalSheetRegion(wide).kind).toBe('pending')
    const half = { numerator: 1n, denominator: 2n }
    const children = [
      { low: parameter.low, high: half },
      { low: half, high: parameter.high }
    ]
    expect(
      children.map(
        (parameter) =>
          input.owner.relateRationalSheetRegion({ ...evidence, parameter }).kind
      )
    ).toEqual(['separated', 'separated'])
    expect(
      input.owner.relateRationalSheetRegion({ ...evidence, margin: 2 }).kind
    ).toBe('pending')
    expect(() =>
      input.owner.relateRationalSheetRegion({
        ...evidence,
        sheet: { ...sheet, indices: [] }
      })
    ).toThrow()
    expect(() =>
      input.owner.relateRationalSheetRegion({
        ...evidence,
        sheet: { ...sheet, indices: [0, 0, 2] }
      })
    ).toThrow()
    expect(() =>
      input.owner.relateRationalSheetRegion({
        ...evidence,
        sheet: {
          ...sheet,
          vertices: sheet.vertices.map((p) => [{ low: 1, high: 0 }, p[1], p[2]])
        }
      })
    ).toThrow()
    expect(() =>
      input.owner.relateRationalSheetRegion({
        ...evidence,
        parameter: { low: parameter.high, high: parameter.low }
      })
    ).toThrow()
    expect(Object.isFrozen(evidence)).toBe(false)
  })
  it('retains complete original region triangle accounting on a later surface hit or exhausted prefix', () => {
    const positions = [
      -2, -1, -1, -2, 1, -1, -2, 0, 1, -0.25, 0, -0.25, 0.25, 0, -0.25, 0, 0,
      0.25
    ]
    const make = (cap = 1000000) =>
      sheetFixture(positions, [0, 1, 2, 3, 4, 5], 'sheet', cap)
    const run = (input: ReturnType<typeof make>) =>
      input.owner.relateRationalSheetRegion({
        solid: originalIntervalBounds(input.first),
        sheet: originalIntervalBounds(input.sheet),
        node: input.node,
        parameter: {
          low: { numerator: 0n, denominator: 1n },
          high: { numerator: 1n, denominator: 1n }
        },
        margin: 0
      })
    const input = make()
    expect(run(input)).toMatchObject({
      kind: 'blocked',
      triangleOffset: 3,
      work: { required: 2, visited: 2, unvisited: 0 }
    })
    const baseline = make()
    const limited = make(baseline.owner.work.exactPredicates + 1)
    const partial = run(limited)
    expect(partial.kind).toBe('unknown')
    expect(partial.work.required).toBe(
      partial.work.visited + partial.work.unvisited
    )
    expect(partial.work.unvisited).toBe(2)
    expect(limited.owner.work.sheetTriangleIntersections).toBe(0)
  })
  it.each([
    { name: 'static', translation: [0, 0, 0] as Vector, margin: 0 },
    { name: 'linear', translation: [-1, 0, 0] as Vector, margin: 0 },
    { name: 'metric margin', translation: [0, 0, 0] as Vector, margin: 0.5 }
  ])('uses no placement directions for a complete XYZ $name gap', (item) => {
    const input = fixture(identity, identity, [2, 0, 0])
    const relation = input.owner.relate(
      { ...input.first, translation: item.translation },
      input.second,
      item.margin
    )
    expect(canonicalResult(relation)).toEqual(
      eager(input, item.margin, item.translation)
    )
    expect(input.owner.work.transformPreparations).toBe(2)
    expect(
      input.owner.work.stages.placementDirections.arithmeticOperations
    ).toBe(0)
    expect(input.owner.work.directionPreparationAttempts).toBe(0)
  })
  it('keeps semantic point witnesses independent of complete placement directions', () => {
    const input = fixture(identity, identity, [2, 0, 0])
    expect(
      input.owner.rationalVertexInBounds(input.first, input.node, {
        min: [-1, -1, -1],
        max: [1, 1, 1]
      })
    ).toBeDefined()
    expect(
      input.owner.work.stages.placementDirections.arithmeticOperations
    ).toBe(0)
    expect(input.owner.work.directionPreparationAttempts).toBe(0)
  })
  it('proves a horizontal source sheet from points without SAT direction preparation', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 100000,
      maxBits: 24000
    })
    const shape = Object.freeze({
      kind: 'triangles' as const,
      positions: Object.freeze([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]),
      indices: Object.freeze([0, 1, 2, 0, 2, 3])
    })
    const region = Object.freeze({
      id: 'plane',
      kind: 'sheet' as const,
      indexStart: 0,
      indexCount: 6
    })
    const placed = {
      region: owner.prepare(shape, region),
      frames: Object.freeze([frame(0)])
    }
    expect(
      owner.proveHorizontalPlane(placed, { numerator: 0n, denominator: 1n })
    ).toBe(true)
    expect(owner.work.stages.placementDirections.arithmeticOperations).toBe(0)
    expect(owner.work.directionPreparationAttempts).toBe(0)
  })
  it('prepares complete directions once per current point product across equivalent pair wrappers', () => {
    const input = fixture()
    expect(
      input.owner.relateRational(input.first, input.second, input.node, 0).kind
    ).toBe('separated')
    expect(input.owner.work.directionPreparations).toBe(2)
    const before = input.owner.work
    expect(
      input.owner.relate({ ...input.first }, { ...input.second }, 0).kind
    ).toBe('separated')
    expect(input.owner.work.directionPreparations).toBe(2)
    expect(input.owner.work.transformPreparations).toBe(
      before.transformPreparations
    )
    expect(input.owner.work.stages.placementDirections).toEqual(
      before.stages.placementDirections
    )
    const changed = {
      ...input.second,
      frames: Object.freeze([...input.second.frames])
    }
    expect(input.owner.relate(input.first, changed, 0).kind).toBe('separated')
    expect(input.owner.work.directionPreparations).toBe(3)
    expect(input.owner.work.directionOperatorPreparations).toBe(2)
    const mutable = { ...input.second, frames: [...input.second.frames] }
    input.owner.relate(input.first, mutable, 0)
    input.owner.relate(input.first, mutable, 0)
    expect(input.owner.work.directionPreparations).toBe(5)
    expect(input.owner.work.directionOperatorPreparations).toBe(4)
    const foreign = fixture()
    expect(() =>
      input.owner.relateRational(input.first, foreign.second, input.node, 0)
    ).toThrow()
    expect(input.owner.work.directionPreparations).toBe(5)
  })
  it('does not publish or rebuild an exhausted partial direction product', () => {
    const full = fixture()
    full.owner.relateRational(full.first, full.second, full.node, 0)
    const beforeDirections =
      full.owner.work.stages.sourceCertification.predicates +
      full.owner.work.stages.rationalNodeCompilation.predicates +
      full.owner.work.stages.localChainPreparation.predicates +
      full.owner.work.stages.placementFrameValidation.predicates +
      full.owner.work.stages.placementVertices.predicates +
      full.owner.work.stages.relationSetupAndXYZ.predicates
    const input = fixture(
      faceMatrix,
      faceMatrix,
      [-1.5, -1.5, 1.5],
      beforeDirections + 1
    )
    expect(
      input.owner.relateRational(input.first, input.second, input.node, 0)
    ).toEqual({ kind: 'unknown', proof: 'unproved' })
    expect(input.owner.work.directionPreparationAttempts).toBe(1)
    expect(input.owner.work.directionPreparationFailures).toBe(1)
    expect(input.owner.work.directionPreparations).toBe(0)
    const before = input.owner.work
    expect(
      input.owner.relateRational(input.first, input.second, input.node, 0)
    ).toEqual({ kind: 'unknown', proof: 'unproved' })
    expect(input.owner.work.directionPreparationAttempts).toBe(1)
    expect(input.owner.work.stages.placementDirections).toEqual(
      before.stages.placementDirections
    )
    expect(input.owner.work.exactPredicates).toBe(before.exactPredicates)
    expect(
      Object.values(input.owner.work.stages).reduce(
        (n, s) => n + s.predicates,
        0
      )
    ).toBe(before.exactPredicates)
  })
  const dotInteger = (a: IntegerVector, b: IntegerVector) =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const subtractInteger = (
    a: IntegerVector,
    b: IntegerVector
  ): IntegerVector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const crossInteger = (a: IntegerVector, b: IntegerVector): IntegerVector => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
  const gcdInteger = (left: bigint, right: bigint) => {
    let a = left < 0n ? -left : left,
      b = right < 0n ? -right : right
    while (b) {
      const r = a % b
      a = b
      b = r
    }
    return a
  }
  const direction = (v: IntegerVector): IntegerVector => {
    const d = v.reduce(gcdInteger, 0n)
    return d ? [v[0] / d, v[1] / d, v[2] / d] : v
  }
  const unique = (values: readonly IntegerVector[]) => {
    const result = new Map<string, IntegerVector>()
    for (const value of values) {
      const reduced = direction(value),
        first = reduced.find((v) => v !== 0n)
      if (first === undefined) continue
      const key = reduced.map((v) => (first < 0n ? -v : v)).join(',')
      if (!result.has(key)) result.set(key, reduced)
    }
    return [...result.values()]
  }

  // Independent old point-derived direction oracle. All intermediate integer
  // operands are checked against the same formal 24000-bit ceiling.
  const oldPointDirections = (
    placed: ReturnType<WalkingSourceRelationEvaluator['place']>
  ) => {
    const exponent = Math.min(
      ...placed.points.flatMap((p) => p.map((v) => v.exponent))
    )
    const check = (v: bigint) => {
      expect((v < 0n ? -v : v).toString(2).length).toBeLessThanOrEqual(24000)
      return v
    }
    const points = placed.points.map(
      (p) =>
        p.map((v) => check(v.significand << BigInt(v.exponent - exponent))) as [
          bigint,
          bigint,
          bigint
        ]
    )
    const subtract = (a: IntegerVector, b: IntegerVector): IntegerVector => [
      check(a[0] - b[0]),
      check(a[1] - b[1]),
      check(a[2] - b[2])
    ]
    const multiply = (a: bigint, b: bigint) => {
      expect(
        (a < 0n ? -a : a).toString(2).length +
          (b < 0n ? -b : b).toString(2).length
      ).toBeLessThanOrEqual(24000)
      return check(a * b)
    }
    const normal = (a: IntegerVector, b: IntegerVector): IntegerVector => [
      check(multiply(a[1], b[2]) - multiply(a[2], b[1])),
      check(multiply(a[2], b[0]) - multiply(a[0], b[2])),
      check(multiply(a[0], b[1]) - multiply(a[1], b[0]))
    ]
    const normals: IntegerVector[] = [],
      edges: IntegerVector[] = []
    for (const [a, b, c] of placed.triangles) {
      normals.push(
        normal(subtract(points[b], points[a]), subtract(points[c], points[a]))
      )
      edges.push(
        subtract(points[b], points[a]),
        subtract(points[c], points[b]),
        subtract(points[a], points[c])
      )
    }
    return { normals: unique(normals), edges: unique(edges) }
  }
  const primitiveDirections = (
    value: ReturnType<WalkingSourceRelationEvaluator['directions']>
  ) => ({
    normals: value.normals.map((p) =>
      p.map((v) => {
        expect(v.exponent).toBe(0)
        return v.significand
      })
    ),
    edges: value.edges.map((p) =>
      p.map((v) => {
        expect(v.exponent).toBe(0)
        return v.significand
      })
    )
  })
  it('reuses completed transported direction values across regions sharing an operator', () => {
    const input = fixture()
    const first = input.owner['place'](input.first)
    input.owner['directions'](first)
    const before = input.owner.work
    const region = input.owner.prepare(
      input.solid.shape,
      Object.freeze({ ...input.solid.region })
    )
    const second = input.owner['place'](
      input.owner.rationalPlacement(region, input.node, 0)
    )
    expect(primitiveDirections(input.owner['directions'](second))).toEqual(
      oldPointDirections(second)
    )
    expect(input.owner.work.directionVectorPreparations).toBe(
      before.directionVectorPreparations
    )
    expect(input.owner.work.directionVectorReuses).toBeGreaterThan(
      before.directionVectorReuses
    )
    expect(input.owner.work.stages.directionFinalKey).toEqual(
      before.stages.directionFinalKey
    )
  })
  it('compiles each exact node scalar and denominator once without lending admission to later inputs', () => {
    const input = fixture()
    const f = (numerator: bigint, denominator = 1n) => ({
      numerator,
      denominator
    })
    const frame = {
      origin: [f(1n, 3n), f(0n), f(0n)] as const,
      matrix: [
        [f(1n), f(0n), f(0n)],
        [f(0n), f(1n), f(0n)],
        [f(0n), f(0n), f(1n)]
      ] as const
    }
    const before = input.owner.work
    const node = input.owner.prepareRationalNode(
      [frame, structuredClone(frame)],
      24000
    )
    expect(node.frames[0]).toEqual(node.frames[1])
    expect(node.scale.significand).toBe(3n)
    expect(input.owner.work.nodeScalarProofs - before.nodeScalarProofs).toBe(3)
    expect(
      input.owner.work.nodeDenominatorSteps - before.nodeDenominatorSteps
    ).toBe(2)
    expect(input.owner.work.nodeScalarVisits - before.nodeScalarVisits).toBe(24)
    expect(
      input.owner.work.nodeIntegerPreparations - before.nodeIntegerPreparations
    ).toBe(3)
    const bad = structuredClone(frame)
    bad.origin[0].denominator = -3n
    expect(() => input.owner.prepareRationalNode([frame, bad], 24000)).toThrow()
    bad.origin[0].numerator = 2n
    bad.origin[0].denominator = 6n
    expect(() => input.owner.prepareRationalNode([frame, bad], 24000)).toThrow()
    bad.origin[0].numerator = 1n
    bad.origin[0].denominator = 1n << 24001n
    expect(() => input.owner.prepareRationalNode([frame, bad], 24000)).toThrow()
    frame.origin[0].numerator = 2n
    const changed = input.owner.prepareRationalNode([frame], 24000)
    expect(changed.frames[0].position).not.toEqual(node.frames[0].position)
  })
  it('prepares projective local directions once and transports each distinct placement without reconstructing triangles', () => {
    const input = fixture()
    const a = input.owner['place'](input.first),
      b = input.owner['place'](input.second)
    const before = input.owner.work
    expect(before.directionPreparationAttempts).toBe(0)
    for (const placed of [a, b]) {
      const expected = oldPointDirections(placed)
      expect(primitiveDirections(input.owner['directions'](placed))).toEqual(
        expected
      )
    }
    expect(input.owner.work).toMatchObject({
      localDirectionPreparations: 1,
      directionPreparations: 2,
      localDirectionTriangles: input.solid.triangles.length,
      directionTransports: 2
    })
    const work = input.owner.work
    expect(input.owner['directions'](a)).toBe(input.owner['directions'](a))
    expect(input.owner.work).toEqual(work)
    const changed = input.owner['place']({
      ...input.first,
      frames: Object.freeze([...input.first.frames])
    })
    input.owner['directions'](changed)
    expect(input.owner.work).toMatchObject({
      localDirectionPreparations: 1,
      directionTransports: 3
    })
    const replacement = input.owner.prepare(
      input.solid.shape,
      Object.freeze({ ...input.solid.region })
    )
    const replacementPoint = input.owner['place'](
      input.owner.rationalPlacement(replacement, input.node, 0)
    )
    input.owner['directions'](replacementPoint)
    expect(input.owner.work).toMatchObject({
      localDirectionPreparations: 2,
      directionTransports: 4,
      directionOperatorPreparations: 2
    })
    const newFrame = input.owner['place']({
      ...input.first,
      frames: Object.freeze([Object.freeze({ ...input.first.frames[0] })])
    })
    expect(primitiveDirections(input.owner['directions'](newFrame))).toEqual(
      oldPointDirections(newFrame)
    )
    expect(input.owner.work).toMatchObject({
      localDirectionPreparations: 2,
      directionTransports: 5,
      directionOperatorPreparations: 3
    })
  })
  it.each([
    { name: 'translation', first: identity, second: identity },
    { name: 'shear', first: faceMatrix, second: firstRod },
    {
      name: 'reflection and nonuniform scale',
      first: [
        [-2, 0, 0],
        [0, 3, 0],
        [0, 0, 0.5]
      ] as Matrix,
      second: faceMatrix
    }
  ])(
    'matches ordered old primitive directions and unchanged point witnesses for projective $name composition',
    ({ first, second }) => {
      const input = fixture(first, second, [0.25, -0.5, 1.5])
      const placement = {
        ...input.first,
        frames: Object.freeze([...input.first.frames, ...input.second.frames])
      }
      const placed = input.owner['place'](placement)
      const points = placed.points,
        triangles = placed.triangles
      const expected = oldPointDirections(placed)
      expect(primitiveDirections(input.owner['directions'](placed))).toEqual(
        expected
      )
      expect(placed.points).toBe(points)
      expect(placed.triangles).toBe(triangles)
      expect(input.owner['place'](placement)).toBe(placed)
    }
  )
  it('removes a positive homogeneous direction factor within the unchanged bit guard', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 1000000,
      maxBits: 24000
    })
    const m = material(),
      solid = owner.prepare(m.shape, m.region)
    const factor = 1n << 1500n
    const f = (numerator: bigint) => ({ numerator, denominator: 1n })
    const node = owner.prepareRationalNode(
      [
        {
          origin: [f(factor), f(0n), f(0n)],
          matrix: [
            [f(factor), f(factor), f(0n)],
            [f(0n), f(-factor), f(0n)],
            [f(0n), f(0n), f(2n * factor)]
          ]
        }
      ],
      24000
    )
    const placed = owner['place'](owner.rationalPlacement(solid, node, 0))
    expect(primitiveDirections(owner['directions'](placed))).toEqual(
      oldPointDirections(placed)
    )
    expect(owner.work).toMatchObject({
      localDirectionPreparations: 1,
      directionTransports: 1
    })
    expect(owner.work.maxRationalBitsRequired).toBeLessThanOrEqual(24000)
  })

  it('preserves untagged legacy raw direction scales and original triangles', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 1000000
    })
    const m = material(),
      region = owner.prepare(m.shape, m.region)
    const placed = owner['place']({ region, frames: Object.freeze([frame(2)]) })
    type D = (typeof placed.points)[number][number]
    type P = (typeof placed.points)[number]
    const sub = (a: D, b: D): D => {
      const exponent = Math.min(a.exponent, b.exponent)
      return {
        significand:
          (a.significand << BigInt(a.exponent - exponent)) -
          (b.significand << BigInt(b.exponent - exponent)),
        exponent
      }
    }
    const mul = (a: D, b: D): D => ({
      significand: a.significand * b.significand,
      exponent: a.exponent + b.exponent
    })
    const delta = (a: P, b: P): P => [
      sub(a[0], b[0]),
      sub(a[1], b[1]),
      sub(a[2], b[2])
    ]
    const cross = (a: P, b: P): P => [
      sub(mul(a[1], b[2]), mul(a[2], b[1])),
      sub(mul(a[2], b[0]), mul(a[0], b[2])),
      sub(mul(a[0], b[1]), mul(a[1], b[0]))
    ]
    const uniqueRaw = (values: P[]) => {
      const seen = new Set<string>()
      return values.filter((p) => {
        const e = Math.min(...p.map((v) => v.exponent))
        const v = direction(
          p.map((n) => n.significand << BigInt(n.exponent - e)) as [
            bigint,
            bigint,
            bigint
          ]
        )
        const sign = v.find((n) => n !== 0n)
        if (!sign) return false
        const key = v.map((n) => (sign < 0n ? -n : n)).join(',')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    const normals: P[] = [],
      edges: P[] = []
    for (const [a, b, c] of placed.triangles) {
      normals.push(
        cross(
          delta(placed.points[b], placed.points[a]),
          delta(placed.points[c], placed.points[a])
        )
      )
      edges.push(
        delta(placed.points[b], placed.points[a]),
        delta(placed.points[c], placed.points[b]),
        delta(placed.points[a], placed.points[c])
      )
    }
    expect(owner['directions'](placed)).toEqual({
      normals: uniqueRaw(normals),
      edges: uniqueRaw(edges)
    })
    expect(owner.work).toMatchObject({
      localDirectionPreparations: 0,
      directionTransports: 0,
      rationalArithmeticOperations: 0
    })
  })
  it('attributes required bits to the actual exclusive stage without extra predicates', () => {
    const input = fixture()
    input.owner.relateRational(input.first, input.second, input.node, 0)
    const work = input.owner.work
    expect(
      Object.values(work.requiredBitsByStage).reduce(
        (n, s) => Math.max(n, s.maxRequired),
        0
      )
    ).toBe(work.maxRationalBitsRequired)
    expect(
      Object.values(work.requiredBitsByStage).every(
        (s) => s.firstExcess === null
      )
    ).toBe(true)
    expect(
      work.requiredBitsByStage.rationalNodeCompilation.maxRequired
    ).toBeGreaterThan(0)
    expect(
      work.requiredBitsByStage.directionCofactor.maxRequired
    ).toBeGreaterThan(0)
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 100000,
      maxBits: 64
    })
    const f = (numerator: bigint) => ({ numerator, denominator: 1n })
    expect(() =>
      owner.prepareRationalNode(
        [
          {
            origin: [f(1n << 80n), f(0n), f(0n)],
            matrix: [
              [f(1n), f(0n), f(0n)],
              [f(0n), f(1n), f(0n)],
              [f(0n), f(0n), f(1n)]
            ]
          }
        ],
        64
      )
    ).toThrow('budget exhausted')
    expect(owner.work.requiredBitsByStage.rationalNodeCompilation).toEqual({
      maxRequired: 81,
      firstExcess: 81
    })
    expect(
      Object.values(owner.work.stages).reduce((n, s) => n + s.predicates, 0)
    ).toBe(owner.work.exactPredicates)
  })

  function largeStrictGap(kind: 'XYZ' | 'axisConstraint') {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 1000000,
      maxBits: 24000
    })
    const input = material()
    const triangles = Array.from(
      { length: input.shape.indices.length / 3 },
      (_, i) => input.shape.indices.slice(i * 3, i * 3 + 3)
    )
    // Keep every original source triangle; only author X-normal faces first.
    const hasXNormal = (triangle: readonly number[]) => {
      const p = triangle.map((i) =>
        input.shape.positions.slice(i * 3, i * 3 + 3)
      )
      return (
        (p[1][1] - p[0][1]) * (p[2][2] - p[0][2]) -
          (p[1][2] - p[0][2]) * (p[2][1] - p[0][1]) !==
        0
      )
    }
    triangles.sort((a, b) => Number(hasXNormal(b)) - Number(hasXNormal(a)))
    const shape = Object.freeze({
      ...input.shape,
      indices: Object.freeze(triangles.flat())
    })
    expect([...shape.indices].sort()).toEqual([...input.shape.indices].sort())
    const solid = owner.prepare(shape, input.region)
    expect(solid.certified).toBe(true)
    const f = (numerator: bigint, denominator = 1n) => ({
      numerator,
      denominator
    })
    const n = kind === 'axisConstraint' ? 1n << 6500n : 0n
    const matrix = [
      [f(1n), f(n), f(0n)],
      [f(0n), f(1n), f(n)],
      [f(0n), f(0n), f(1n)]
    ] as const
    const node = owner.prepareRationalNode(
      [
        { matrix, origin: [f(0n), f(0n), f(0n)] },
        {
          matrix,
          origin:
            kind === 'XYZ'
              ? [f(1n << 12500n), f(0n), f(0n)]
              : [f(0n), f(0n), f(1n, 2n)]
        }
      ],
      24000
    )
    const first = owner.rationalPlacement(solid, node, 0),
      second = owner.rationalPlacement(solid, node, 1)
    const a = owner['place'](first),
      b = owner['place'](second)
    const expectedAxis: IntegerVector =
      kind === 'XYZ' ? [1n, 0n, 0n] : oldPointDirections(a).normals[0]
    const exponent = Math.min(
      ...[...a.points, ...b.points].flatMap((p) => p.map((v) => v.exponent))
    )
    const bits = (n: bigint) => (n < 0n ? -n : n).toString(2).length
    const project = (points: typeof a.points, axis: IntegerVector) =>
      points.map((p) => {
        const value = p.reduce((sum, v, i) => {
          const integer = v.significand << BigInt(v.exponent - exponent)
          expect(bits(integer) + bits(axis[i])).toBeLessThanOrEqual(24000)
          return sum + integer * axis[i]
        }, 0n)
        expect(bits(value)).toBeLessThanOrEqual(24000)
        return value
      })
    const strict = (axis: IntegerVector) => {
      const left = project(a.points, axis),
        right = project(b.points, axis)
      const min = (p: bigint[]) => p.reduce((a, b) => (a < b ? a : b)),
        max = (p: bigint[]) => p.reduce((a, b) => (a > b ? a : b))
      return max(left) < min(right) || max(right) < min(left)
    }
    if (kind === 'axisConstraint')
      for (const axis of [
        [1n, 0n, 0n],
        [0n, 1n, 0n],
        [0n, 0n, 1n]
      ] as const)
        expect(strict(axis)).toBe(false)
    expect(strict(expectedAxis)).toBe(true)
    // The oracle needs only ordered exact projection signs, never gap².
    expect(
      Object.values(owner.work.requiredBitsByStage).every(
        (s) => s.firstExcess === null
      )
    ).toBe(true)
    return { owner, node, first, second, expectedAxis }
  }
  it.each(['XYZ', 'axisConstraint'] as const)(
    'proves a positive zero-margin %s gap without unnecessary squared overflow',
    (stage) => {
      const input = largeStrictGap(stage)
      const actual = input.owner.relateRational(
        input.first,
        input.second,
        input.node,
        0
      )
      const work = input.owner.work
      const excess = Object.entries(work.requiredBitsByStage).filter(
        ([, v]) => v.firstExcess !== null
      )
      const expectedStage =
        stage === 'XYZ' ? 'relationSetupAndXYZ' : 'axisConstraint'
      expect(excess.every(([key]) => key === expectedStage)).toBe(true)
      expect(
        actual.kind,
        JSON.stringify({
          stage: expectedStage,
          bits: work.maxRationalBitsRequired,
          excess
        })
      ).toBe('separated')
      expect(canonicalResult(actual)).toEqual({
        kind: 'separated',
        proof: stage === 'XYZ' ? 'strict-bounds' : 'complete-sat',
        axis: input.expectedAxis
      })
      expect(excess).toEqual([])
      if (stage === 'XYZ') expect(work.directionPreparationAttempts).toBe(0)
      else {
        expect(work.axisProjectionPairs).toBe(1)
        expect(work.edgeCrossProducts).toBe(0)
      }
    }
  )
  it('retains positive-margin overflow as unknown and treats negative zero as zero', () => {
    const large = largeStrictGap('axisConstraint')
    expect(
      large.owner.relateRational(
        large.first,
        large.second,
        large.node,
        Number.MIN_VALUE
      )
    ).toEqual({ kind: 'unknown', proof: 'unproved' })
    expect(
      large.owner.work.requiredBitsByStage.axisConstraint.firstExcess
    ).not.toBeNull()
    const small = fixture()
    expect(
      canonicalResult(
        small.owner.relateRational(small.first, small.second, small.node, -0)
      )
    ).toEqual(eager(small, 0))
  })
  const canonicalResult = (
    result: ReturnType<WalkingSourceRelationEvaluator['relate']>
  ) => {
    if (!result.axis) return result
    const exponent = Math.min(...result.axis.map((v) => v.exponent))
    const vector = result.axis.map(
      (v) => v.significand << BigInt(v.exponent - exponent)
    ) as [bigint, bigint, bigint]
    return { ...result, axis: direction(vector) }
  }
  // Test-private eager SAT: integer coordinates represent exact world eighths.
  // All fixture coefficients are quarters; divisibility is checked, never rounded.
  function eager(
    input: ReturnType<typeof fixture>,
    margin: number,
    translation: Vector = [0, 0, 0]
  ) {
    const source = input.solid.points.map(
      (p) =>
        p.map((v) => {
          const power = v.exponent + 3
          if (power >= 0) return v.significand << BigInt(power)
          const denominator = 1n << BigInt(-power)
          expect(v.significand % denominator).toBe(0n)
          return v.significand / denominator
        }) as [bigint, bigint, bigint]
    )
    const placed = (matrix: Matrix, origin: Vector) => {
      const points = source.map(
        (p) =>
          matrix.map((row, k) => {
            const numerator = row.reduce(
              (sum, n, j) => sum + BigInt(n * 4) * p[j],
              0n
            )
            expect(numerator % 4n).toBe(0n)
            return numerator / 4n + BigInt(origin[k] * 8)
          }) as [bigint, bigint, bigint]
      )
      const normals: IntegerVector[] = [],
        edges: IntegerVector[] = []
      for (const [a, b, c] of input.solid.triangles) {
        normals.push(
          crossInteger(
            subtractInteger(points[b], points[a]),
            subtractInteger(points[c], points[a])
          )
        )
        edges.push(
          subtractInteger(points[b], points[a]),
          subtractInteger(points[c], points[b]),
          subtractInteger(points[a], points[c])
        )
      }
      return { points, normals: unique(normals), edges: unique(edges) }
    }
    const a = placed(input.firstMatrix, [0, 0, 0]),
      b = placed(input.secondMatrix, input.origin)
    const velocity = translation.map((n) => BigInt(n * 8)) as [
      bigint,
      bigint,
      bigint
    ]
    const zero = velocity.every((v) => v === 0n),
      proof = zero ? 'complete-sat' : 'linear-time-sat'
    const projection = (
      points: readonly IntegerVector[],
      axis: IntegerVector
    ) => {
      const values = points.map((p) => dotInteger(p, axis))
      return {
        min: values.reduce((x, y) => (x < y ? x : y)),
        max: values.reduce((x, y) => (x > y ? x : y))
      }
    }
    const enough = (gap: bigint, axis: IntegerVector) =>
      gap > 0n && gap * gap >= BigInt(margin * 8) ** 2n * dotInteger(axis, axis)
    const whole = (
      left: { min: bigint; max: bigint },
      right: { min: bigint; max: bigint },
      slope: bigint,
      axis: IntegerVector
    ) =>
      enough(right.min - left.max - (slope > 0n ? slope : 0n), axis) ||
      enough(left.min - right.max + (slope < 0n ? slope : 0n), axis)
    for (const axis of [
      [1n, 0n, 0n],
      [0n, 1n, 0n],
      [0n, 0n, 1n]
    ] as const)
      if (
        whole(
          projection(a.points, axis),
          projection(b.points, axis),
          dotInteger(velocity, axis),
          axis
        )
      )
        return { kind: 'separated', proof: 'strict-bounds', axis }
    const axes = unique([
      ...a.normals,
      ...b.normals,
      ...a.edges.flatMap((edge) =>
        b.edges.map((other) => crossInteger(edge, other))
      )
    ])
    interface Bound {
      n: bigint
      d: bigint
      strict: boolean
    }
    const compare = (a: Bound, b: Bound) => {
      const x = a.n * b.d - b.n * a.d
      if (x < 0n) return -1
      return x > 0n ? 1 : 0
    }
    const timeRange = () => ({
      low: { n: 0n, d: 1n, strict: false },
      high: { n: 1n, d: 1n, strict: false },
      empty: false
    })
    const closed = timeRange(),
      interior = timeRange()
    const constrain = (
      range: ReturnType<typeof timeRange>,
      offset: bigint,
      slope: bigint,
      strict: boolean
    ) => {
      if (range.empty) return
      if (slope === 0n) {
        range.empty = strict ? offset <= 0n : offset < 0n
        return
      }
      const threshold = {
        n: slope < 0n ? offset : -offset,
        d: slope < 0n ? -slope : slope,
        strict
      }
      const key = slope > 0n ? 'low' : 'high',
        order = compare(threshold, range[key])
      if ((key === 'low' && order > 0) || (key === 'high' && order < 0))
        range[key] = threshold
      else if (order === 0) range[key].strict ||= strict
      const crossed = compare(range.low, range.high)
      range.empty =
        crossed > 0 ||
        (crossed === 0 && (range.low.strict || range.high.strict))
    }
    let separating: IntegerVector | undefined,
      contact: IntegerVector | undefined,
      level: bigint | undefined
    for (const axis of axes) {
      const left = projection(a.points, axis),
        right = projection(b.points, axis),
        slope = dotInteger(velocity, axis)
      if (!separating && whole(left, right, slope, axis)) separating = axis
      constrain(closed, left.max - right.min, slope, false)
      constrain(closed, right.max - left.min, -slope, false)
      constrain(interior, left.max - right.min, slope, true)
      constrain(interior, right.max - left.min, -slope, true)
      if (zero) {
        if (left.max === right.min) {
          contact = axis
          level = left.max
        } else if (right.max === left.min) {
          contact = [-axis[0], -axis[1], -axis[2]]
          level = -left.min
        }
      }
    }
    if (separating) return { kind: 'separated', proof, axis: separating }
    if (!interior.empty) return { kind: 'volume-overlap', proof }
    if (closed.empty)
      return margin === 0
        ? { kind: 'separated', proof }
        : { kind: 'unknown', proof: 'unproved' }
    if (margin !== 0) return { kind: 'unknown', proof: 'unproved' }
    if (contact && level !== undefined) {
      const axis = contact,
        feature = (points: readonly IntegerVector[]) =>
          points.flatMap((p, i) => (dotInteger(p, axis) === level ? [i] : []))
      return {
        kind: 'boundary',
        proof,
        axis,
        firstFeature: feature(a.points),
        secondFeature: feature(b.points)
      }
    }
    return { kind: 'boundary', proof }
  }
  it.each([
    {
      name: 'first face',
      first: faceMatrix,
      second: faceMatrix,
      origin: [-1.5, -1.5, 1.5] as Vector,
      margin: 0
    },
    {
      name: 'reverse face',
      first: faceMatrix,
      second: faceMatrix,
      origin: [1.5, 1.5, -1.5] as Vector,
      margin: 0
    },
    {
      name: 'first cross',
      first: firstRod,
      second: secondRod,
      origin: [0.75, -0.75, 0.75] as Vector,
      margin: 0
    },
    {
      name: 'overlap',
      first: identity,
      second: identity,
      origin: [0, 0, 0] as Vector,
      margin: 0
    },
    {
      name: 'boundary',
      first: identity,
      second: identity,
      origin: [1, 0, 0] as Vector,
      margin: 0
    },
    {
      name: 'margin pass',
      first: faceMatrix,
      second: faceMatrix,
      origin: [-1.5, -1.5, 1.5] as Vector,
      margin: 0.5
    },
    {
      name: 'margin fail',
      first: faceMatrix,
      second: faceMatrix,
      origin: [-1.5, -1.5, 1.5] as Vector,
      margin: 1
    }
  ])(
    'matches the test-private eager source/axis/features reference for $name',
    (item) => {
      const input = fixture(item.first, item.second, item.origin)
      const actual = input.owner.relateRational(
        input.first,
        input.second,
        input.node,
        item.margin
      )
      expect(canonicalResult(actual)).toEqual(eager(input, item.margin))
    }
  )
  it.each([
    {
      name: 'middle crossing',
      origin: [2, 0, 0] as Vector,
      translation: [4, 0, 0] as Vector
    },
    {
      name: 'closed time intersection empty',
      origin: [2, 5, 0] as Vector,
      translation: [4, 4, 0] as Vector
    }
  ])('matches eager linear-time constraints for $name', (item) => {
    const input = fixture(identity, identity, item.origin)
    expect(input.node.scale.significand).toBe(1n)
    const actual = input.owner.relate(
      { ...input.first, translation: item.translation },
      input.second,
      0
    )
    expect(canonicalResult(actual)).toEqual(eager(input, 0, item.translation))
  })
  it('does not publish separation when preparation, projection or constraint work exhausts', () => {
    const full = fixture()
    full.owner.relateRational(full.first, full.second, full.node, 0)
    const work = full.owner.work
    const before =
      work.exactPredicates -
      work.axisPreparationPredicates -
      work.axisProjectionPredicates -
      work.axisConstraintPredicates
    const caps = [
      before + 1,
      before + work.axisPreparationPredicates + 1,
      before +
        work.axisPreparationPredicates +
        work.axisProjectionPredicates +
        1
    ]
    for (const [stage, cap] of caps.entries()) {
      const input = fixture(faceMatrix, faceMatrix, [-1.5, -1.5, 1.5], cap)
      expect(
        input.owner.relateRational(input.first, input.second, input.node, 0)
      ).toEqual({ kind: 'unknown', proof: 'unproved' })
      expect(input.owner.work.exactPredicates).toBe(cap)
      expect(input.owner.work.earlySeparatedPairs).toBe(0)
      const observed = input.owner.work
      expect(observed.axisPreparationPredicates).toBe(
        stage === 0 ? 1 : work.axisPreparationPredicates
      )
      expect(observed.axisProjectionPredicates).toBe(
        stage === 0
          ? 0
          : Math.min(
              1 + (stage - 1) * work.axisProjectionPredicates,
              work.axisProjectionPredicates
            )
      )
      expect(observed.axisConstraintPredicates).toBe(stage === 2 ? 1 : 0)
      expect(
        input.owner.work.axisPreparationPredicates +
          input.owner.work.axisProjectionPredicates +
          input.owner.work.axisConstraintPredicates
      ).toBe(cap - before)
    }
  })
  it('attributes counted exact work and stops at the first complete normal gap', () => {
    const { owner, node, first, second } = fixture()
    expect(owner.relateRational(first, second, node, 0).kind).toBe('separated')
    const work = owner.work,
      summary = JSON.stringify(work)
    expect(work.axisCandidates, summary).toBe(1)
    expect(work.normalAxisCandidates, summary).toBe(1)
    expect(work.edgeCrossProducts, summary).toBe(0)
    expect(work.axisProjectionPairs, summary).toBe(1)
    expect(work.earlySeparatedPairs, summary).toBe(1)
    expect(work.axisPreparationOperations, summary).toBeGreaterThan(0)
    expect(work.axisProjectionOperations, summary).toBeGreaterThan(0)
    expect(work.axisConstraintOperations, summary).toBeGreaterThan(0)
  })
  it('attributes exclusive work with node reuse and unchanged warm reads', () => {
    const input = fixture()
    const prepared = input.owner.work
    expect(
      input.owner.relateRational(input.first, input.second, input.node, 0).kind
    ).toBe('separated')
    const work = input.owner.work
    expect(work.stages, JSON.stringify({ prepared, work })).toBeDefined()
    expect(
      Object.values(work.stages).reduce((n, s) => n + s.arithmeticOperations, 0)
    ).toBe(work.rationalArithmeticOperations)
    expect(
      Object.values(work.stages).reduce((n, s) => n + s.predicates, 0)
    ).toBe(work.exactPredicates)
    const before = input.owner.work
    expect(prepared.rationalArithmeticOperations).toBe(1496)
    expect(prepared.exactPredicates).toBe(1604)
    // Old point-derived preparation was 4378 scalar / 4552 predicates.
    // Projective preparation removes 262; zero-margin sufficiency removes
    // another 12 squared-gap/norm/comparison operations.
    // Repeated node values remove 54 operations from the prior preparation
    // baseline (1550/1658); vector lookup work is included in stage sums.
    // This cold two-placement fixture has no vector reuse: its 72 counted
    // lookup operations exceed the 54 node savings by 18. Reuse benefits are
    // proved separately by the repeated-region oracle, not inferred here.
    expect(work.rationalArithmeticOperations).toBe(4122)
    expect(work.exactPredicates).toBe(4296)
    input.owner.prepare(input.solid.shape, input.solid.region)
    input.owner.rationalPlacement(input.first.region, input.node, 0)
    expect(input.owner.work).toEqual(before)
  })
  it('retains exclusive partial work and resource-incomplete certification on exhaustion', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 1,
      maxBits: 24000
    })
    const input = material()
    expect(owner.prepare(input.shape, input.region).certified).toBe(false)
    const work = owner.work
    expect(work.stages, JSON.stringify(work)).toBeDefined()
    expect(work.certificationOutcomes.resourceIncomplete).toBe(1)
    expect(
      Object.values(work.stages).reduce((n, s) => n + s.predicates, 0)
    ).toBe(work.exactPredicates)
    expect(
      Object.values(work.stages).reduce((n, s) => n + s.arithmeticOperations, 0)
    ).toBe(work.rationalArithmeticOperations)
  })
  it('stops at the first separating edge cross product after all face normals', () => {
    const { owner, node, first, second } = fixture(
      firstRod,
      secondRod,
      [0.75, -0.75, 0.75]
    )
    expect(owner.relateRational(first, second, node, 0).kind).toBe('separated')
    const work = owner.work,
      summary = JSON.stringify(work)
    expect(work.edgeCrossProducts, summary).toBe(1)
    expect(work.crossAxisCandidates, summary).toBe(1)
    expect(work.earlySeparatedPairs, summary).toBe(1)
    expect(work.axisCandidates, summary).toBe(
      work.uniqueAxes + work.duplicateAxes + work.zeroAxes
    )
  })
  it.each([0, 1])(
    'exhausts the complete unique axis set for overlap or boundary at x=%i',
    (x) => {
      const { owner, node, first, second } = fixture(identity, identity, [
        x,
        0,
        0
      ])
      expect(owner.relateRational(first, second, node, 0).kind).toBe(
        x ? 'boundary' : 'volume-overlap'
      )
      const work = owner.work,
        summary = JSON.stringify(work)
      expect(work.earlySeparatedPairs, summary).toBe(0)
      expect(work.edgeCrossProducts, summary).toBeGreaterThan(0)
      expect(work.axisCandidates, summary).toBe(
        work.uniqueAxes + work.duplicateAxes + work.zeroAxes
      )
      expect(work.axisProjectionPairs, summary).toBe(work.uniqueAxes)
      expect(work.duplicateAxes, summary).toBeGreaterThan(0)
      expect(work.zeroAxes, summary).toBeGreaterThan(0)
    }
  )
})
describe('canonical nonlinear rational source placement', () => {
  it('retains original-world metric margin and closed-set classification under a shared positive denominator', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 20,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const f = (n: bigint, d = 1n) =>
      Object.freeze({ numerator: n, denominator: d })
    const transform = (x: ReturnType<typeof f>) =>
      Object.freeze({
        origin: Object.freeze([x, f(0n), f(0n)] as const),
        matrix: Object.freeze([
          Object.freeze([f(1n), f(0n), f(0n)] as const),
          Object.freeze([f(0n), f(1n), f(0n)] as const),
          Object.freeze([f(0n), f(0n), f(1n)] as const)
        ] as const)
      })
    const node = owner.prepareRationalNode(
      [
        transform(f(0n)),
        transform(f(4n, 3n)),
        transform(f(1n)),
        transform(f(2n, 3n))
      ],
      24000
    )
    const placements = [0, 1, 2, 3].map((index) =>
      owner.rationalPlacement(solid, node, index)
    )
    expect(
      owner.relateRational(placements[0], placements[1], node, 0.25).kind
    ).toBe('separated')
    expect(
      owner.relateRational(placements[0], placements[1], node, 0.5).kind
    ).toBe('unknown')
    expect(
      owner.relateRational(placements[0], placements[2], node, 0).kind
    ).toBe('boundary')
    expect(
      owner.relateRational(placements[0], placements[3], node, 0).kind
    ).toBe('volume-overlap')
    const prepared = owner.work.transformPreparations
    owner.relateRational(placements[0], placements[1], node, 0)
    expect(owner.work.transformPreparations).toBe(prepared)
    expect(() => owner.rationalPlacement(solid, { ...node }, 0)).toThrow()
    expect(() =>
      owner.prepareRationalNode([transform(f(1n, -3n))], 24000)
    ).toThrow()
    expect(() =>
      owner.prepareRationalNode([transform(f(1n, 1n << 25000n))], 24000)
    ).toThrow()
  })
})
describe('canonical nonlinear budgeted region covers', () => {
  function inputs(count: number) {
    const builder = new TriangleBuilder()
    for (let i = 0; i < count; i++) builder.box([i / 1000, 0, 0], [1, 1, 1])
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: {
        kind: 'triangles',
        positions: builder.positions,
        indices: builder.indices
      },
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    })
    if (descriptor.kind !== 'mesh' || descriptor.shape.kind !== 'triangles')
      throw new Error('Missing cover source')
    return {
      shape: descriptor.shape,
      regions: Object.freeze(builder.regions().map((r) => Object.freeze(r)))
    }
  }
  function setup(positions: readonly number[]) {
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const fraction = (n: number) =>
      Object.freeze({ numerator: BigInt(n), denominator: 1n })
    const node = evaluator.prepareRationalNode(
      positions.map((x) => ({
        origin: [fraction(x), fraction(0), fraction(0)] as const,
        matrix: [
          [fraction(1), fraction(0), fraction(0)],
          [fraction(0), fraction(1), fraction(0)],
          [fraction(0), fraction(0), fraction(1)]
        ] as const
      })),
      24000
    )
    return { evaluator, node }
  }
  it('covers a 100 by 100 original-region product with one source-bound proof and no SAT preparation', () => {
    const material = inputs(100),
      { evaluator, node } = setup([0, 3])
    const cover = evaluator.prepareRegionCover(
      [
        { parts: [{ ...material, frameIndex: 0 }] },
        { parts: [{ ...material, frameIndex: 1 }] }
      ],
      node,
      { movingGroups: 1, maxGroupPairs: 100, maxLeaves: 10000, margin: 0 }
    )
    const proof = cover.next()
    expect(proof?.kind).toBe('strictBounds')
    expect(proof?.cardinality).toBe(10000)
    expect(proof?.ordinal).toEqual([0, 10000])
    expect(cover.next()).toBeUndefined()
    expect(cover.finish()).toEqual([])
    expect(cover.required).toBe(10000)
    expect(cover.work.groupPairs).toBe(1)
    expect(cover.work.leafPairs).toBe(0)
    expect(evaluator.work.regionPreparations).toBe(0)
  })
  it('descends overlapping body bounds to separated actual parts', () => {
    const material = inputs(1),
      { evaluator, node } = setup([0, 2, 4, 6])
    const cover = evaluator.prepareRegionCover(
      [
        {
          parts: [
            { ...material, frameIndex: 0 },
            { ...material, frameIndex: 2 }
          ]
        },
        {
          parts: [
            { ...material, frameIndex: 1 },
            { ...material, frameIndex: 3 }
          ]
        }
      ],
      node,
      { movingGroups: 1, maxGroupPairs: 100, maxLeaves: 100, margin: 0 }
    )
    const proofs = []
    for (let proof = cover.next(); proof; proof = cover.next())
      proofs.push(proof)
    expect(proofs.every((p) => p.kind === 'strictBounds')).toBe(true)
    expect(proofs.reduce((sum, p) => sum + p.cardinality, 0)).toBe(4)
    expect(cover.work.groupPairs).toBe(5)
    expect(cover.finish()).toEqual([])
    expect(evaluator.work.regionPreparations).toBe(0)
  })
  it('expands disjoint covers and row-major leaves to exactly the brute-force original pair classifications', () => {
    const material = inputs(1),
      { evaluator, node } = setup([0, 1, 4, 4])
    const cover = evaluator.prepareRegionCover(
      [
        {
          parts: [
            { ...material, frameIndex: 0 },
            { ...material, frameIndex: 2 }
          ]
        },
        {
          parts: [
            { ...material, frameIndex: 1 },
            { ...material, frameIndex: 3 }
          ]
        }
      ],
      node,
      { movingGroups: 1, maxGroupPairs: 100, maxLeaves: 100, margin: 0 }
    )
    const actual = new Map<string, string>(),
      order: number[] = []
    const relation = (i: number, j: number) => {
      const a = cover.inventory[i],
        b = cover.inventory[j]
      return evaluator.relateRational(
        evaluator.rationalPlacement(
          evaluator.prepare(a.shape, a.region),
          node,
          a.frameIndex
        ),
        evaluator.rationalPlacement(
          evaluator.prepare(b.shape, b.region),
          node,
          b.frameIndex
        ),
        node,
        0
      ).kind
    }
    for (let proof = cover.next(); proof; proof = cover.next()) {
      for (let k = proof.ordinal[0]; k < proof.ordinal[1]; k++) {
        const i = proof.first.start + Math.floor(k / proof.second.count),
          j = proof.second.start + (k % proof.second.count),
          key = i + ':' + j
        expect(actual.has(key)).toBe(false)
        actual.set(
          key,
          proof.kind === 'strictBounds' ? 'separated' : relation(i, j)
        )
        if (proof.kind === 'leaf') order.push(i * cover.inventory.length + j)
      }
    }
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(cover.finish()).toEqual([])
    expect(actual.size).toBe(4)
    for (let i = 0; i < 2; i++)
      for (let j = 2; j < 4; j++)
        expect(actual.get(i + ':' + j)).toBe(relation(i, j))
    expect(cover.coRigidOwner).toBe(1)
    expect(cover.required).toBe(4)
  })
  it('retains an exact unvisited ordinal product when one group budget cannot descend', () => {
    const material = inputs(100),
      { evaluator, node } = setup([0, 0])
    const cover = evaluator.prepareRegionCover(
      [
        { parts: [{ ...material, frameIndex: 0 }] },
        { parts: [{ ...material, frameIndex: 1 }] }
      ],
      node,
      { movingGroups: 1, maxGroupPairs: 1, maxLeaves: 1, margin: 0 }
    )
    expect(cover.next()).toBeUndefined()
    const remainder = cover.finish()
    expect(remainder.reduce((sum, p) => sum + p.cardinality, 0)).toBe(10000)
    expect(remainder).toHaveLength(1)
    expect(remainder[0].ordinal).toEqual([0, 10000])
    expect(cover.finish()).toBe(remainder)
    expect(cover.work.groupPairs).toBe(1)
    expect(evaluator.work.regionPreparations).toBe(0)
  })
  it('retains world-unit margins and independent roots while rejecting foreign frames and incomplete partitions', () => {
    const material = inputs(2),
      { evaluator, node } = setup([0, 2])
    const groups = [
      { parts: [{ ...material, frameIndex: 0 }] },
      { parts: [{ ...material, frameIndex: 1 }] }
    ]
    const options = {
      movingGroups: 2,
      maxGroupPairs: 100,
      maxLeaves: 100,
      margin: 2
    }
    const cover = evaluator.prepareRegionCover(groups, node, options)
    const leaves = []
    for (let p = cover.next(); p; p = cover.next()) leaves.push(p)
    expect(leaves).toHaveLength(4)
    expect(leaves.every((p) => p.kind === 'leaf')).toBe(true)
    expect(cover.coRigidOwner).toBe(2)
    expect(cover.required).toBe(4)
    expect(cover.finish()).toEqual([])
    expect(() =>
      evaluator.prepareRegionCover(groups, { ...node }, options)
    ).toThrow('Foreign')
    expect(() =>
      evaluator.prepareRegionCover(
        [
          {
            parts: [
              {
                ...material,
                regions: Object.freeze(material.regions.slice(1)),
                frameIndex: 0
              }
            ]
          }
        ],
        node,
        { ...options, movingGroups: 1 }
      )
    ).toThrow('Incomplete')
    expect(() =>
      evaluator.prepareRegionCover(groups, node, {
        ...options,
        maxGroupPairs: Infinity
      })
    ).toThrow('Invalid')
  })
})
describe('walking source region relations', () => {
  it('admits a boundary only with both complete named closures and an original triangle witness', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = { region: solid, frames: Object.freeze([frame(0)]) },
      second = { region: solid, frames: Object.freeze([frame(1)]) }
    const relation = owner.relate(first, second, 0)
    const ranges = [
      Object.freeze({
        indexStart: input.region.indexStart,
        indexCount: input.region.indexCount
      })
    ]
    const witness = owner.proveBoundary(first, second, relation, ranges, ranges)
    expect(witness).toBeDefined()
    expect(witness?.firstTriangle).toBeGreaterThanOrEqual(
      input.region.indexStart
    )
    expect(witness?.secondTriangle).toBeLessThan(
      input.region.indexStart + input.region.indexCount
    )
    expect(
      owner.proveBoundary(first, second, relation, [], ranges)
    ).toBeUndefined()
    expect(
      owner.proveBoundary(first, second, relation, ranges, [])
    ).toBeUndefined()
  })
  it('distinguishes original closed material, boundary and unproved open shell', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const relation = (x: number) =>
      owner.relate(
        { region: solid, frames: [frame(0)] },
        { region: solid, frames: [frame(x)] },
        0
      )
    expect(relation(2).kind).toBe('separated')
    expect(relation(0.5).kind).toBe('volume-overlap')
    // The second source centre is outside the first material's bounds, but
    // its original triangles still enter that material.
    expect(relation(0.9).kind).toBe('volume-overlap')
    expect(relation(1).kind).toBe('boundary')
    const shell = material('open-shell')
    expect(
      owner.relate(
        {
          region: owner.prepare(shell.shape, shell.region),
          frames: [frame(0)]
        },
        { region: solid, frames: [frame(0.5)] },
        0
      ).kind
    ).toBe('unknown')
    expect(owner.prepare(input.shape, input.region)).toBe(solid)
    expect(owner.work.regionPreparations).toBe(2)
  })
  it.each([1, -1])(
    'proves a middle crossing for a fixed translation in direction %s',
    (direction) => {
      const owner = new WalkingSourceRelationEvaluator({
        maxRegionPairs: 100,
        maxExactPredicates: 100000
      })
      const input = material(),
        solid = owner.prepare(input.shape, input.region)
      const stationary = { region: solid, frames: [frame(0)] }
      expect(
        owner.relate(
          { region: solid, frames: [frame(-2 * direction)] },
          stationary,
          0
        ).kind
      ).toBe('separated')
      expect(
        owner.relate(
          { region: solid, frames: [frame(2 * direction)] },
          stationary,
          0
        ).kind
      ).toBe('separated')
      expect(
        owner.relate(
          {
            region: solid,
            frames: [frame(-2 * direction)],
            translation: [4 * direction, 0, 0]
          },
          stationary,
          0
        ).kind
      ).toBe('volume-overlap')
    }
  )
  it('does not replace margin or unsupported motion with a clear endpoint', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = { region: solid, frames: [frame(0)] },
      second = { region: solid, frames: [frame(1.1)] }
    expect(owner.relate(first, second, 0.2).kind).toBe('unknown')
    expect(owner.relate(first, second, 0.05).kind).toBe('separated')
    expect(owner.relate({ ...first, motion: 'unproved' }, second, 0).kind).toBe(
      'unknown'
    )
  })
  it('never turns exhausted exact work into a partial clear result', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 1,
      maxExactPredicates: 1
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    expect(
      owner.relate(
        { region: solid, frames: [frame(0)] },
        { region: solid, frames: [frame(2)] },
        0
      ).kind
    ).toBe('unknown')
    expect(owner.work.exactPredicates).toBeLessThanOrEqual(1)
  })
  it('keeps collision times inside the exact stance subinterval and rejects singular frames', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 20,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = {
      region: solid,
      frames: Object.freeze([frame(-2)]),
      displacement: { from: [0, 0, 0] as const, until: [4, 0, 0] as const }
    }
    const second = { region: solid, frames: Object.freeze([frame(0)]) }
    expect(
      owner.relate(first, second, 0, {
        from: 0,
        until: 0.2,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('separated')
    expect(
      owner.relate(first, second, 0, {
        from: 0.4,
        until: 0.6,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('volume-overlap')
    expect(
      owner.relate(first, second, 0, {
        from: 0.8,
        until: 1,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('separated')
    expect(() =>
      prepareQueryExactForwardFrame({
        position: [0, 0, 0],
        rotation: [0.5, 0.5, 0, 0]
      })
    ).toThrow()
    const preparations = owner.work.regionPreparations,
      transforms = owner.work.transformPreparations
    owner.relate(first, second, 0)
    expect(owner.work.regionPreparations).toBe(preparations)
    expect(owner.work.transformPreparations).toBe(transforms)
  })
})

describe('current whole walking source relations', () => {
  let source: ReturnType<WalkingRobotSourceOwner['prepare']>
  let demand: ReturnType<typeof prepareSceneDemand>
  let groundingOffset: number
  let robotExtent: readonly number[]
  const evidence = {
    kind: 'synthetic',
    id: 'source-relation-functional',
    label: 'Source relation - synthetic functional evidence'
  } as const
  beforeAll(() => {
    source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'source-relations'
      })
    )
    const pose = evaluateWalkingRobotPose(source, {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: source.rig.presets.stowed
    })
    const soleHeights = pose.frames.contacts.feet.map(
      (contact) => contact.position[1]
    )
    expect(soleHeights.every((value) => value === soleHeights[0])).toBe(true)
    groundingOffset = -soleHeights[0]
    const frames = new Map(
      pose.bodyTransforms.map((body) => [body.id, body.transform])
    )
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (const part of source.parts) {
      const body = frames.get(part.bodyId)
      if (!body) throw new Error('Missing actual source body')
      for (const point of walkingSourcePointBounds(part.shape, [
        part.localFrame,
        body
      ]))
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], point.min[axis])
          max[axis] = Math.max(max[axis], point.max[axis])
        }
    }
    robotExtent = max.map((value, axis) => value - min[axis])
    const farm = validateConfiguration(DEFAULT_CONFIGURATION),
      geometry = new SiteGeometry()
    const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
    const soil = farm.strips
      .filter((strip) => strip.kind === 'soil')
      .sort((a, b) => b.width - a.width)[0]
    if (!soil) throw new Error('Missing current soil strip')
    const routeLength = robotExtent[2] + robotExtent[2] / 2
    const routeFrom = (farm.length - routeLength) / 2
    if (routeFrom < 0 || soil.width < robotExtent[0])
      throw new Error('Current source does not fit the chosen route envelope')
    demand = prepareSceneDemand(
      farm,
      scene,
      validateSceneDemandConfiguration({
        version: 1,
        route: {
          kind: 'soil-strip',
          bay: 0,
          stripId: soil.id,
          from: routeFrom,
          until: routeFrom + routeLength
        },
        evidence,
        growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
        clearanceMargin: { kind: 'bounded', metres: 0 }
      })
    )
  }, 30000)
  const request = (
    preset: 'stowed' | 'leftWorking' | 'rightWorking',
    displacement = 0
  ) => {
    const route = demand.freePassage.route
    if (
      !route ||
      !demand.route ||
      demand.configuration.route.kind !== 'soil-strip'
    )
      throw new Error('Missing actual W1 route')
    const center = route.min.map((value, axis) => (value + route.max[axis]) / 2)
    const usableLength = route.max[2] - route.min[2] - robotExtent[2]
    const travel =
      displacement * Math.max(0, Math.min(usableLength, robotExtent[2]) / 4)
    const terrainShape = {
      kind: 'triangles',
      positions: [
        route.min[0],
        0,
        route.min[2],
        route.max[0],
        0,
        route.min[2],
        route.max[0],
        0,
        route.max[2],
        route.min[0],
        0,
        route.max[2]
      ],
      indices: [0, 1, 2, 0, 2, 3]
    }
    const raw = {
      format: 'walking-motion-request/2',
      requestId: 'relation-' + preset,
      source,
      demand,
      path: {
        id: 'relation-path',
        intent: displacement < 0 ? 'reverse' : 'straight',
        knots: [0, 1].map((time) => ({
          time,
          base: {
            position: [center[0], groundingOffset, center[2] + time * travel],
            heading: 0,
            pitch: 0,
            roll: 0
          },
          joints: source.rig.presets[preset]
        }))
      },
      evaluation: { from: 0, until: 1 },
      stance: {
        id: 'relation-stance',
        phases: [
          {
            from: 0,
            until: 1,
            legs: source.rig.legChains.map((chain) => ({
              chainId: chain.id,
              state: { kind: 'swing' }
            }))
          }
        ]
      },
      gait: { id: 'relation-gait', provenance: evidence },
      terrain: {
        format: 'walking-terrain/1',
        id: 'relation-terrain',
        revision: 1,
        sceneRevision: demand.scene.revision,
        route: { bay: 0, stripId: demand.configuration.route.stripId },
        provenance: evidence,
        observations: Object.fromEntries(
          ['height', 'slope', 'rut', 'debris'].map((key) => [
            key,
            { coverage: 'complete', evidence }
          ])
        ),
        regions: [
          {
            id: 'relation-soil',
            classification: 'soil',
            sourceId: 'relation-soil-source',
            shape: terrainShape,
            frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
            binding: {
              kind: 'route-soil',
              bay: 0,
              stripId: demand.configuration.route.stripId
            },
            keepOut: { kind: 'none' }
          }
        ],
        contactAssessments: []
      },
      load: {
        id: 'relation-load',
        provenance: evidence,
        crate: { kind: 'unknown' },
        carried: { kind: 'none' }
      },
      externalSources: [
        {
          sourceId: 'relation-soil-source',
          regions: [
            { id: 'soil-sheet', kind: 'sheet', indexStart: 0, indexCount: 6 }
          ]
        }
      ],
      targetContacts: [],
      budget: {
        maxIntervals: 8,
        maxEnvelopePairs: 2000000,
        maxRegionPairs: 2000000,
        maxExactPredicates: 20000000
      }
    }
    const admitted = readWalkingMotionRequest(raw, source, demand)
    if (admitted.format !== 'walking-motion-request/2')
      throw new Error('Missing current source request')
    return admitted
  }
  it.each(['evaluation', 'load'] as const)(
    'rejects stale interval provenance with the same path and different %s',
    (component) => {
      const input = request('stowed')
      const foreign =
        component === 'evaluation'
          ? { ...input, evaluation: { from: 0, until: 0.5 } }
          : { ...input, load: { ...input.load, id: 'another-load' } }
      const intervals = prepareWalkingMotionIntervals(source, foreign)
      expect(intervals.path).toBe(input.path)
      expect(() =>
        prepareWalkingSourceRelations(source, demand, input, intervals)
      ).toThrow('Stale source relation inputs')
    }
  )
  it.each(['stowed', 'leftWorking', 'rightWorking'] as const)(
    'accounts for every original region pair in actual %s material',
    (preset) => {
      const input = request(preset)
      const result = prepareWalkingSourceRelations(
        source,
        demand,
        input,
        prepareWalkingMotionIntervals(source, input)
      )
      expect(result.request).toBe(input)
      expect(result.source).toBe(source)
      expect(result.demand).toBe(demand)
      for (const segment of result.segments) {
        expect(segment.self.blocked).toBe(0)
        expect(segment.self.unknown).toBe(0)
        expect(segment.self.unvisited).toBe(0)
        expect(segment.self.declaredBoundary).toBe(18)
        expect(segment.coverage.candidate).toBe(
          segment.coverage.coRigidOwner + segment.coverage.required
        )
        expect(segment.coverage.required).toBe(
          segment.coverage.strictBounds +
            segment.coverage.exactSeparated +
            segment.coverage.declaredBoundary +
            segment.coverage.blocked +
            segment.coverage.targetRefinement +
            segment.coverage.unknown +
            segment.coverage.unvisited
        )
      }
      expect(result.work.regionPreparations).toBeLessThanOrEqual(
        source.parts.reduce((sum, part) => sum + part.regions.length, 0) +
          demand.freePassage.exclusions.filter((item) => item.kind === 'source')
            .length +
          1
      )
    },
    60000
  )
  it('publishes request-bound accounting and reuses admitted reads without repeated source work', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      { ...original, budget: { ...original.budget, maxRegionPairs: 1 } },
      source,
      demand
    )
    let currentDemand: typeof demand | undefined = demand
    const owner = new WalkingMotionOwner({
      getCurrentWalkingRobotSource: () => source,
      getCurrentSceneDemand: () => currentDemand
    })
    const admitted = owner.prepare(input)
    expect(admitted.sourceRelations?.request).toBe(input)
    expect(admitted.sourceRelations?.status).toBe('unknown')
    const work = admitted.sourceRelations?.work
    expect(owner.prepare(input)).toBe(admitted)
    expect(owner.read()).toBe(admitted)
    expect(admitted.sourceRelations?.work).toBe(work)
    expect(owner.work.preparations).toBe(1)
    currentDemand = undefined
    expect(owner.read()).toBeUndefined()
  }, 30000)
  it.each([1, -1])(
    'keeps actual stowed translation %s unknown when support feet slide',
    (direction) => {
      const original = request('stowed', direction)
      const assessments = source.rig.contacts.feet.map(({ patch }, index) => ({
        id: 'support-' + index,
        footPatchId: patch.id,
        terrainRegionId: 'relation-soil',
        pathId: original.path.id,
        from: 0,
        until: 1,
        loadCaseId: original.load.id,
        coverage: 'complete',
        geometry: { status: 'admitted', evidence },
        friction: { status: 'admitted', evidence },
        bearing: { status: 'admitted', evidence },
        sinkage: { status: 'admitted', evidence }
      }))
      const input = readWalkingMotionRequest(
        {
          ...original,
          terrain: { ...original.terrain, contactAssessments: assessments },
          stance: {
            ...original.stance,
            phases: [
              {
                from: 0,
                until: 1,
                legs: source.rig.legChains.map((chain, index) => ({
                  chainId: chain.id,
                  state: {
                    kind: 'support',
                    contactAssessmentId: assessments[index].id
                  }
                }))
              }
            ]
          }
        },
        source,
        demand
      )
      if (input.format !== 'walking-motion-request/2')
        throw new Error('Missing source request')
      const intervals = prepareWalkingMotionIntervals(source, input)
      const result = prepareWalkingSourceRelations(
        source,
        demand,
        input,
        intervals
      )
      expect(result.reasons).toContain('support-contact-motion-unproved')
      const route = demand.freePassage.route
      if (!route) throw new Error('Missing source route')
      for (const envelope of intervals.segments[0].envelopes)
        for (const axis of [0, 2]) {
          expect(envelope.bounds.min[axis]).toBeGreaterThanOrEqual(
            route.min[axis]
          )
          expect(envelope.bounds.max[axis]).toBeLessThanOrEqual(route.max[axis])
        }
      expect(result.status).not.toBe('clear')
      expect(result.segments[0].self.blocked).toBe(0)
      expect(result.segments[0].self.unknown).toBe(0)
      expect(result.segments[0].self.declaredBoundary).toBe(18)
    },
    60000
  )
  it('retains the whole remaining pair inventory when an interval or pair budget ends', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      {
        ...original,
        budget: { ...original.budget, maxIntervals: 1, maxRegionPairs: 1 },
        path: {
          ...original.path,
          knots: [
            original.path.knots[0],
            { ...original.path.knots[0], time: 0.5 },
            original.path.knots[1]
          ]
        },
        stance: {
          ...original.stance,
          phases: [
            { ...original.stance.phases[0], until: 0.5 },
            { ...original.stance.phases[0], from: 0.5 }
          ]
        }
      },
      source,
      demand
    )
    if (input.format !== 'walking-motion-request/2')
      throw new Error('Missing source request')
    const result = prepareWalkingSourceRelations(
      source,
      demand,
      input,
      prepareWalkingMotionIntervals(source, input)
    )
    expect(result.segments).toHaveLength(2)
    expect(result.segments[1].coverage.required).toBe(
      result.segments[1].coverage.unvisited
    )
    expect(result.segments[1].coverage.candidate).toBe(
      result.segments[0].coverage.candidate
    )
    expect(result.work.regionPairs).toBeLessThanOrEqual(1)
    expect(result.status).toBe('unknown')
  }, 30000)
  it('counts each current target partition once', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      { ...original, budget: { ...original.budget, maxRegionPairs: 1 } },
      source,
      demand
    )
    if (input.format !== 'walking-motion-request/2')
      throw new Error('Missing source request')
    const intervals = prepareWalkingMotionIntervals(source, input)
    const result = prepareWalkingSourceRelations(
      source,
      demand,
      input,
      intervals
    )
    const partitions = [
      ...demand.targets.left,
      ...demand.targets.right,
      ...demand.targets.unassigned
    ].reduce((sum, target) => sum + target.partitions.length, 0)
    expect(result.work.targetPartitionVisits).toBe(partitions)
    const sourceExclusions = demand.freePassage.exclusions.filter(
      (item) => item.kind === 'source'
    ).length
    expect(result.work.sourceExclusionBindings).toBe(sourceExclusions)
    const moving = source.parts.reduce(
      (sum, part) => sum + part.regions.length,
      0
    )
    expect(result.segments[0].environment.candidate).toBe(
      moving * (sourceExclusions + 1)
    )
    const route = demand.freePassage.route
    if (!route) throw new Error('Missing current route')
    for (const envelope of intervals.segments[0].envelopes)
      for (const axis of [0, 2]) {
        expect(envelope.bounds.min[axis]).toBeGreaterThanOrEqual(
          route.min[axis]
        )
        expect(envelope.bounds.max[axis]).toBeLessThanOrEqual(route.max[axis])
      }
  }, 30000)
})
