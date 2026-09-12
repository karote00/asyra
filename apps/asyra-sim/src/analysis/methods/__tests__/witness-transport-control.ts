import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { localPoint } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'

const ops = poseOperations(intervalAlgebra)
interface TestQueryOwner {
  tick(): void
  witness(shape: ConvexShape): ReturnType<typeof localPoint>
}

/** Test-only interception of the existing owner, never a copied solver. */
export function seededDistance(
  context: OriginalMeshQuery,
  source: SourceWitness,
  target: Pick<SourceWitness, 'shapes' | 'time' | 'node'>,
  threshold: number,
  tolerance: number,
  iterations: number
) {
  const owner = context as unknown as TestQueryOwner
  const before = context.work
  const seed = transport(source, target, () => owner.tick())
  if (!seed) throw new Error('The controlled source witness is not eligible')
  const addedWork = context.work - before
  const evidence = withSourceWitness(context, target.shapes, seed, () =>
    OriginalMeshQuery.prototype.distance.call(
      context,
      target.shapes[0],
      target.shapes[1],
      threshold,
      tolerance,
      iterations
    )
  )
  return { evidence, seed, addedWork }
}

/** Synchronous test adapter; every caller supplies independently proven points. */
export function withSourceWitness(
  context: OriginalMeshQuery,
  shapes: readonly [ConvexShape, ConvexShape],
  seed: { a: DistanceEvidence['witnessA']; b: DistanceEvidence['witnessB'] },
  solve: () => DistanceEvidence
) {
  const owner = context as unknown as TestQueryOwner
  const descriptor = Object.getOwnPropertyDescriptor(owner, 'witness')
  let calls = 0
  owner.witness = (shape) => {
    calls++
    if (shape === shapes[0]) return seed.a
    if (shape === shapes[1]) return seed.b
    throw new Error('Witness interception escaped the exact target shapes')
  }
  try {
    const evidence = solve()
    if (calls !== 2)
      throw new Error('Expected exactly two original seed witnesses')
    return evidence
  } finally {
    if (descriptor) Object.defineProperty(owner, 'witness', descriptor)
    else Reflect.deleteProperty(owner, 'witness')
  }
}
export interface SourceWitness {
  shapes: readonly [ConvexShape, ConvexShape]
  time: number
  node: readonly [number, number]
  evidence: DistanceEvidence
}
// Test-owned passive operation: no result or source geometry is mutated.
export function transport(
  source: SourceWitness,
  target: Pick<SourceWitness, 'shapes' | 'time' | 'node'>,
  tick: () => void
) {
  tick()
  if (
    source.node !== target.node ||
    source.time < source.node[0] ||
    source.time > target.time ||
    target.time > source.node[1] ||
    source.evidence.penetration ||
    !Number.isFinite(source.evidence.upper) ||
    source.shapes.some(
      (shape, side) =>
        shape.geometry !== target.shapes[side].geometry ||
        !Object.isFrozen(shape.geometry)
    )
  )
    return undefined
  tick()
  const a = localPoint(source.shapes[0].pose, source.evidence.witnessA)
  tick()
  const b = localPoint(source.shapes[1].pose, source.evidence.witnessB)
  tick()
  const wa = ops.add(
    target.shapes[0].pose.position,
    ops.rotate(target.shapes[0].pose.rotation, a)
  )
  tick()
  const wb = ops.add(
    target.shapes[1].pose.position,
    ops.rotate(target.shapes[1].pose.rotation, b)
  )
  tick()
  return { a: wa, b: wb, upper: ops.norm(ops.sub(wa, wb))[1] }
}
