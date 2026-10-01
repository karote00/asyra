import { expect, it } from 'vitest'

import { WalkingMountedCrateOwner } from '../walking-mounted-crate'
import { readWalkingRobotDefinition } from '../walking-robot-definition'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { dyadic, type Dyadic } from '../scalar-arithmetic'
import type { WalkingRigidTransform } from '../walking-robot-definition'

const identity = () => ({
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0, 1] as const
})
function fixture() {
  const sourceOwner = new WalkingRobotSourceOwner()
  const source = sourceOwner.prepare(
    createSyntheticWalkingRobotDefinition({
      definitionId: 'complete-envelope',
      sourceProfile: 'solid-articulation/2'
    })
  )
  const mountOwner = new WalkingMountedCrateOwner(sourceOwner)
  const evidence = (id: string) => ({ kind: 'synthetic', id, label: id })
  let crate: ReturnType<typeof mountOwner.prepare> | undefined =
    mountOwner.prepare(source, {
      format: 'walking-mounted-crate-request/1',
      dimensions: {
        width: DEFAULT_ROBOT.width,
        length: DEFAULT_ROBOT.length,
        height: DEFAULT_ROBOT.height
      },
      minimumClearance: { metres: 0.003125, evidence: evidence('mount-gap') },
      retention: evidence('assumed-retention'),
      massIdentity: 'empty-crate-mass'
    })
  const owner = new WalkingRobotEnvelopeOwner(sourceOwner, {
    owner: mountOwner,
    getCurrent: () => crate
  })
  const request = {
    format: 'walking-stowed-envelope-request/1' as const,
    pose: { base: identity(), joints: source.rig.presets.stowed },
    crate: { kind: 'mounted' as const, product: crate },
    load: { kind: 'empty' as const, id: 'empty' }
  }
  return {
    sourceOwner,
    source,
    mountOwner,
    crate,
    owner,
    request,
    removeCrate: () => {
      crate = undefined
    }
  }
}
function sum(a: Dyadic, b: Dyadic): Dyadic {
  const exponent = Math.min(a.exponent, b.exponent)
  return {
    significand:
      (a.significand << BigInt(a.exponent - exponent)) +
      (b.significand << BigInt(b.exponent - exponent)),
    exponent
  }
}
const negative = (a: Dyadic): Dyadic => ({ ...a, significand: -a.significand })
const product = (a: Dyadic, b: Dyadic): Dyadic => ({
  significand: a.significand * b.significand,
  exponent: a.exponent + b.exponent
})
const compare = (a: Dyadic, b: Dyadic) => sum(a, negative(b)).significand
// Independent exact quaternion polynomial, retaining source binary64 coefficients.
function placed(f: WalkingRigidTransform, p: readonly Dyadic[]): Dyadic[] {
  const [x, y, z, w] = f.rotation.map(dyadic),
    [a, b, c] = p
  const tx = product(dyadic(2), sum(product(y, c), negative(product(z, b))))
  const ty = product(dyadic(2), sum(product(z, a), negative(product(x, c))))
  const tz = product(dyadic(2), sum(product(x, b), negative(product(y, a))))
  return [
    sum(
      dyadic(f.position[0]),
      sum(a, sum(product(w, tx), sum(product(y, tz), negative(product(z, ty)))))
    ),
    sum(
      dyadic(f.position[1]),
      sum(b, sum(product(w, ty), sum(product(z, tx), negative(product(x, tz)))))
    ),
    sum(
      dyadic(f.position[2]),
      sum(c, sum(product(w, tz), sum(product(x, ty), negative(product(y, tx)))))
    )
  ]
}
const loadPart = () => ({
  id: 'declared-load',
  shape: {
    kind: 'triangles' as const,
    positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
    indices: [0, 1, 2]
  },
  regions: [
    { id: 'load-region', kind: 'sheet' as const, indexStart: 0, indexCount: 3 }
  ],
  localFrame: { position: [2, 0, 0] as const, rotation: [0, 0, 0, 1] as const }
})
it('includes every original robot and mounted crate vertex and retains contributor bounds', () => {
  const f = fixture(),
    result = f.owner.prepare(f.source, f.request)
  expect(result.status).toBe('complete')
  if (result.status !== 'complete') throw new Error(result.reason)
  expect(result.contributors.filter((c) => c.kind === 'crate')).toHaveLength(11)
  const canonical = f.sourceOwner.evaluate(f.source, {
    base: identity(),
    joints: f.source.rig.presets.stowed
  })
  const transforms = new Map(
    canonical.bodyTransforms.map((b) => [b.id, b.transform])
  )
  let robotVertices = 0,
    crateVertices = 0
  for (const c of result.contributors) {
    for (let offset = 0; offset < c.part.shape.positions.length; offset += 3) {
      let p = c.part.shape.positions.slice(offset, offset + 3).map(dyadic)
      if (c.kind === 'robot') {
        const part = f.source.parts.find((p) => p === c.part)
        if (!part) throw new Error('Missing original part')
        const body = transforms.get(part.bodyId)
        if (!body) throw new Error('Missing original body frame')
        p = placed(body, placed(part.localFrame, p))
        robotVertices++
      } else {
        p = p.map((v, k) => sum(v, f.crate.placement.translation[k]))
        crateVertices++
      }
      p = placed(result.request.pose.base, p)
      p.forEach((v, k) => {
        expect(compare(v, dyadic(c.bounds.min[k])) >= 0n).toBe(true)
        expect(compare(v, dyadic(c.bounds.max[k])) <= 0n).toBe(true)
        expect(compare(v, dyadic(result.bounds.min[k])) >= 0n).toBe(true)
        expect(compare(v, dyadic(result.bounds.max[k])) <= 0n).toBe(true)
      })
    }
  }
  expect(result.work.sourceVertices).toBe(robotVertices)
  expect(result.work.attachmentVertices).toBe(crateVertices)
  expect(result.work.fk).toBe(1)
  expect(result.work.contributors).toBe(result.contributors.length)
  for (let k = 0; k < 3; k++) {
    expect(result.bounds.min[k]).toBe(
      Math.min(...result.contributors.map((c) => c.bounds.min[k]))
    )
    expect(result.bounds.max[k]).toBe(
      Math.max(...result.contributors.map((c) => c.bounds.max[k]))
    )
  }
  expect(Object.isFrozen(result.contributors[0].bounds)).toBe(true)
  expect('collision' in result || 'route' in result || 'clear' in result).toBe(
    false
  )
})
it('invalidates for source, pose, mounted identity and declared load without omitting geometry', () => {
  const f = fixture(),
    first = f.owner.prepare(f.source, f.request)
  if (first.status !== 'complete') throw new Error(first.reason)
  const before = { ...f.owner.work }
  expect(f.owner.read(f.source, first.request)).toBe(first)
  expect(f.owner.prepare(f.source, first.request)).toBe(first)
  expect(f.owner.work).toEqual(before)
  const load = {
    kind: 'geometry',
    id: 'loaded',
    source: f.source,
    requiredPartIds: ['declared-load'],
    parts: [loadPart()]
  }
  const second = f.owner.prepare(f.source, { ...first.request, load })
  if (second.status !== 'complete') throw new Error(second.reason)
  expect(second.bounds.max[0]).toBeGreaterThan(first.bounds.max[0])
  expect(second.work.fk).toBe(1)
  expect(second.contributors.filter((c) => c.kind === 'load')).toHaveLength(1)
  expect(f.owner.read(f.source, first.request)).toBeUndefined()
  expect(f.owner.read(f.source, second.request)).toBe(second)
  const third = f.owner.prepare(f.source, {
    ...second.request,
    pose: {
      ...second.request.pose,
      base: { ...identity(), position: [1, 0, 0] }
    }
  })
  if (third.status !== 'complete') throw new Error(third.reason)
  expect(third.bounds.min[0]).toBeCloseTo(second.bounds.min[0] + 1, 12)
  const unknown = f.owner.prepare(f.source, {
    ...third.request,
    load: { kind: 'unknown', id: 'unknown-load' }
  })
  expect(unknown.status).toBe('unavailable')
  expect(f.owner.read(f.source, third.request)).toBeUndefined()
  const replaced = f.owner.prepare(f.source, f.request)
  if (replaced.status !== 'complete') throw new Error(replaced.reason)
  f.removeCrate()
  expect(f.owner.read(f.source, replaced.request)).toBeUndefined()
  f.sourceOwner.clear()
  expect(f.owner.prepare(f.source, f.request).status).toBe('unavailable')
})
it('rejects omitted, foreign, partial and nonfinite contributors without mutating caller data', () => {
  const f = fixture()
  const load = {
    kind: 'geometry',
    id: 'loaded',
    source: f.source,
    requiredPartIds: ['declared-load'],
    parts: [loadPart()]
  }
  const fake = {
    ...f.crate,
    geometry: { ...f.crate.geometry, parts: f.crate.geometry.parts.slice(1) }
  }
  const bad = [
    { ...f.request, crate: { kind: 'none' } },
    { ...f.request, crate: { kind: 'mounted', product: fake } },
    { ...f.request, load: { ...load, parts: [] } },
    { ...f.request, load: { ...load, source: { ...f.source } } },
    {
      ...f.request,
      load: { ...load, parts: [{ ...loadPart(), regions: [] }] }
    },
    {
      ...f.request,
      load: {
        ...load,
        parts: [
          {
            ...loadPart(),
            shape: {
              ...loadPart().shape,
              positions: [NaN, 0, 0, 1, 0, 0, 0, 1, 0]
            }
          }
        ]
      }
    },
    {
      ...f.request,
      pose: { ...f.request.pose, joints: { ...f.source.rig.presets.stowed } }
    }
  ]
  for (const request of bad)
    expect(f.owner.prepare(f.source, request).status).toBe('unavailable')
  expect(Object.isFrozen(fake)).toBe(false)
  expect(f.owner.prepare({ ...f.source }, f.request).status).toBe('unavailable')
})
it('checks actual fixed source housings rather than only the declared chassis scalar', () => {
  const sourceOwner = new WalkingRobotSourceOwner()
  const original = createSyntheticWalkingRobotDefinition({
    definitionId: 'wide-fixed-clevis',
    sourceProfile: 'solid-articulation/2'
  })
  const raw = {
    ...original,
    legs: original.legs.map((l) => ({
      ...l,
      mount: {
        ...l.mount,
        position: [
          l.side === 'left' ? -0.5 : 0.5,
          l.mount.position[1],
          l.mount.position[2]
        ]
      }
    }))
  }
  const source = sourceOwner.prepare(readWalkingRobotDefinition(raw))
  const owner = new WalkingRobotEnvelopeOwner(sourceOwner)
  expect(
    owner.prepare(source, {
      format: 'walking-stowed-envelope-request/1',
      pose: { base: identity(), joints: source.rig.presets.stowed },
      crate: { kind: 'none' },
      load: { kind: 'empty', id: 'empty' }
    })
  ).toEqual({ status: 'unavailable', reason: 'body-width-exceeded' })
})

import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'
import { WalkingRobotEnvelopeOwner } from '../walking-robot-envelopes'

it('publishes the complete stowed envelope separately from active body width', () => {
  const sourceOwner = new WalkingRobotSourceOwner()
  const source = sourceOwner.prepare(
    createSyntheticWalkingRobotDefinition({
      definitionId: 'envelope-source',
      sourceProfile: 'solid-articulation/2'
    })
  )
  const owner = new WalkingRobotEnvelopeOwner(sourceOwner)
  const result = owner.prepare(source, {
    format: 'walking-stowed-envelope-request/1',
    pose: {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: source.rig.presets.stowed
    },
    crate: { kind: 'none' },
    load: { kind: 'empty', id: 'empty-load' }
  })
  expect(result.status).toBe('complete')
  if (result.status !== 'complete') throw new Error(result.reason)
  expect(result.bodyBounds.size[0]).toBeLessThanOrEqual(0.8)
  expect(result.bounds.size[0]).toBeCloseTo(0.94625, 12)
  expect(result.contributors).toHaveLength(source.parts.length)
  const before = { ...owner.work }
  expect(owner.prepare(source, result.request)).toBe(result)
  expect(owner.read(source, result.request)).toBe(result)
  expect(owner.work).toEqual(before)
})
