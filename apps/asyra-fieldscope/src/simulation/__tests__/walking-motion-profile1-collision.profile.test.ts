import { describe, expect, it } from 'vitest'
import { dyadic } from '../../domain/scalar-arithmetic'
import { WalkingSourceRelationEvaluator } from '../walking-source-relation'
import {
  nonlinearAdd,
  nonlinearDiv,
  nonlinearExact,
  nonlinearFraction,
  nonlinearFixture,
  nonlinearMul,
  nonlinearRequired
} from './walking-motion-test-fixtures'

describe('canonical nonlinear retained profile1 collision', () => {
  it('retains the two reported material overlaps under the unchanged profile1 exact cycle frame', async (context) => {
    await context.annotate(
      'Starting retained profile1 original-material overlap proof',
      'info'
    )
    const { source, cycle, cycleOwner } = nonlinearFixture(
      'solid-articulation/1'
    )
    expect(source.definition.sourceModel.kind).toBe('solid-articulation/1')
    const parameter = nonlinearFraction(1n, 2n)
    const evaluated = cycleOwner.evaluate(cycle, 0, parameter)
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 2,
      maxExactPredicates: 5000000,
      maxBits: 24000
    })
    const frames = [
      ...evaluated.parts.map((p) => p.exact),
      ...evaluated.bodies.map((b) => b.exact)
    ]
    const node = evaluator.prepareRationalNode(frames, 24000)
    const fromDyadic = (v: ReturnType<typeof dyadic>) =>
      v.exponent >= 0
        ? nonlinearFraction(v.significand << BigInt(v.exponent))
        : nonlinearFraction(v.significand, 1n << BigInt(-v.exponent))
    const scale = fromDyadic(node.scale)
    const inputs = [
      ['chassis', 'region-1'],
      ['right-front-coxa', 'region-0'],
      ['right-rear-coxa', 'region-0']
    ].map(([partId, regionId]) => {
      const part = nonlinearRequired(source.parts.find((p) => p.id === partId))
      const region = nonlinearRequired(
        part.regions.find((r) => r.id === regionId)
      )
      const frameIndex = evaluated.parts.findIndex((p) => p.part === part)
      const exact = nonlinearRequired(evaluated.parts[frameIndex]).exact,
        compiled = node.frames[frameIndex]
      const offsets = Array.from(
        { length: region.indexCount / 3 },
        (_, i) => region.indexStart + i * 3
      )
      const indices = [
        ...new Set(
          offsets.flatMap((offset) =>
            part.shape.indices.slice(offset, offset + 3)
          )
        )
      ]
      const vertices = indices.map((index) => {
        const coordinates = part.shape.positions.slice(index * 3, index * 3 + 3)
        const original = coordinates.map(nonlinearExact)
        const world = exact.origin.map((v, k) =>
          exact.matrix[k].reduce(
            (sum, q, j) => nonlinearAdd(sum, nonlinearMul(q, original[j])),
            v
          )
        )
        const lifted = compiled.position.map((v, k) =>
          nonlinearDiv(
            compiled.matrix[k].reduce(
              (sum, q, j) =>
                nonlinearAdd(sum, nonlinearMul(fromDyadic(q), original[j])),
              fromDyadic(v)
            ),
            scale
          )
        )
        return {
          index,
          coordinates,
          original,
          world,
          lifted,
          equals: world.every(
            (v, k) =>
              v.numerator === lifted[k].numerator &&
              v.denominator === lifted[k].denominator
          )
        }
      })
      const prepared = evaluator.prepare(part.shape, region)
      return {
        part,
        region,
        frameIndex,
        exact,
        compiled,
        vertices,
        prepared,
        placement: evaluator.rationalPlacement(prepared, node, frameIndex),
        triangles: offsets.map((offset) => ({
          offset,
          indices: part.shape.indices.slice(offset, offset + 3)
        }))
      }
    })
    const secondInputs = inputs.slice(1)
    const results = secondInputs.map((input) => ({
      first: inputs[0].part.id,
      second: input.part.id,
      relation: evaluator.relateRational(
        inputs[0].placement,
        input.placement,
        node,
        0
      ),
      overlapDepth: null,
      depthReason:
        'The relation API does not publish quantitative overlap depth'
    }))
    const artifact = {
      format: 'walking-nonlinear-midpoint-witness/1',
      originalRun: '2026-09-15 00:22:31 - terminal session 25352',
      phase: 0,
      parameter,
      alpha: cycle.recipe.alpha,
      definitionId: source.definition.definitionId,
      sourceCurrent: cycleOwner.read(source, cycle.recipe) === cycle,
      pointSourceCurrent: evaluated.source === source,
      pointRecipeCurrent: evaluated.recipe === cycle.recipe,
      scale: node.scale,
      worldMargin: 0,
      coordinateAuthority:
        'Independent rational affine evaluation equals homogeneous placement divided by its common positive scale',
      inputs: inputs.map((input) => ({
        partId: input.part.id,
        bodyId: input.part.bodyId,
        region: input.region,
        frameIndex: input.frameIndex,
        exact: input.exact,
        compiled: input.compiled,
        vertices: input.vertices,
        triangles: input.triangles,
        closedConvex: input.prepared.certified
      })),
      results,
      work: evaluator.work,
      recoveredPairCount: 2,
      originalReportedBlockedCount: 6
    }
    const message = JSON.stringify(artifact, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
    expect(
      artifact.sourceCurrent &&
        artifact.pointSourceCurrent &&
        artifact.pointRecipeCurrent,
      message
    ).toBe(true)
    expect(
      inputs.every((input) => input.vertices.every((v) => v.equals)),
      message
    ).toBe(true)
    expect(evaluator.work.rationalNodePreparations, message).toBe(1)
    expect(
      results.every((result) => result.relation.kind === 'volume-overlap'),
      message
    ).toBe(true)
  }, 300000)
})
