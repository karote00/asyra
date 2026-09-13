import { afterEach, expect, it, vi } from 'vitest'
import { MeshFrontier, type FrontierWork } from '../mesh-frontier'
import { MeshFrontier as ImmutableFrontier } from '../__fixtures__/immutable-frontier'
import { OriginalMeshQuery as ImmutableQuery } from '../__fixtures__/immutable-mesh-query'
import { OriginalMeshQuery, MeshWorkLimit } from '../original-mesh-query'
import {
  buildMeshIndex,
  refineMeshIndex,
  type MeshNode,
  type PreparedMeshIndex
} from '../mesh-index'
import { frontierBox, frontierPrism } from '../__fixtures__/frontier-meshes'
import { IDENTITY_POSE } from '../../../domain/math'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { ConvexShape } from '../convex-query'
import type { MeshGeometry } from '../../../domain/part-geometry'
import * as convex from '../convex-query'
import * as projection from '../mesh-projection'

const noop = () => undefined
const index = (g: MeshGeometry) =>
  refineMeshIndex(buildMeshIndex(g, noop), noop)
function offsets(n: MeshNode | undefined): number[] {
  if (!n) return [-1]
  return n.children
    ? n.children.flatMap(offsets)
    : n.triangles.map((t) => t.offset)
}
type Cell = [MeshNode | undefined, MeshNode | undefined] & { next?: Cell }
function cover(frontier: MeshFrontier) {
  let cell = (frontier as unknown as { head?: Cell }).head
  const visited = new Set<Cell>(),
    result: string[] = []
  while (cell) {
    if (visited.has(cell)) throw new Error('Cyclic partition')
    visited.add(cell)
    result.push(
      ...offsets(cell[0]).flatMap((a) =>
        offsets(cell?.[1]).map((b) => `${a}:${b}`)
      )
    )
    cell = cell.next
  }
  return result.sort()
}
function descend(f: MeshFrontier) {
  while (f.hasPending) {
    const [a, b] = f.next()
    if (a?.children) f.split('a')
    else if (b?.children) f.split('b')
  }
}
afterEach(() => vi.restoreAllMocks())
it('conserves every source product and exact immutable visit order across mixed splits, rollback and reuse', () => {
  const a = frontierBox(),
    b = frontierPrism(),
    ai = index(a),
    bi = index(b)
  const expected = offsets(ai.root)
    .flatMap((a) => offsets(bi.root).map((b) => `${a}:${b}`))
    .sort()
  for (let schedule = 0; schedule < 128; schedule++) {
    const immutable = new ImmutableFrontier(noop),
      linked = new MeshFrontier(noop)
    for (let phase = 0; phase < 3; phase++) {
      immutable.observe(a, b)
      linked.enter()
      linked.observe(a, b)
      const old = immutable.start(ai, bi),
        pass = linked.start(ai, bi)
      if (!old || !pass) throw new Error('Missing transaction')
      let step = 0,
        interrupted = false
      while (old.hasPending) {
        expect(pass.hasPending).toBe(true)
        const [oa, ob] = old.next(),
          [na, nb] = pass.next()
        expect(na).toBe(oa)
        expect(nb).toBe(ob)
        if (phase === 1 && step === schedule % 11) {
          interrupted = true
          break
        }
        const split = ((phase === 2 ? 63 : schedule) >> (step++ % 6)) & 1
        if (split && (oa?.children || ob?.children)) {
          const side =
            oa?.children && (!(step & 1) || !ob?.children) ? 'a' : 'b'
          old.split(side)
          pass.split(side)
        } else old.retain()
        expect(cover(linked)).toEqual(expected)
        expect(new Set(cover(linked)).size).toBe(expected.length)
      }
      if (interrupted) linked.finish()
      else {
        expect(pass.hasPending).toBe(false)
        old.publish()
        pass.publish()
      }
      linked.leave()
    }
  }
})
it('eliminates all per-terminal capture operations: repeated complete leaf visits allocate or update no cell', () => {
  const g = frontierBox(),
    i = index(g),
    events: FrontierWork[] = [],
    f = new MeshFrontier((k) => events.push(k))
  f.enter()
  f.observe(g, g)
  f.start(i, i)
  descend(f)
  f.publish()
  f.leave()
  const start = events.length
  for (let n = 0; n < 4; n++) {
    f.enter()
    f.observe(g, g)
    f.start(i, i)
    let terminals = 0
    while (f.hasPending) {
      f.next()
      terminals++
    }
    expect(terminals).toBeGreaterThan(1)
    f.publish()
    f.leave()
  }
  expect(events.slice(start)).toEqual(
    Array.from({ length: 4 }, () => [
      'entry',
      'admission',
      'lookup',
      'begin',
      'cleanup',
      'publish'
    ]).flat()
  )
})
it('pays each real journal allocation, child allocation, mutation and undo exactly once', () => {
  const g = frontierBox(),
    i = index(g),
    events: FrontierWork[] = [],
    f = new MeshFrontier((k) => events.push(k))
  f.enter()
  f.observe(g, g)
  f.start(i, i)
  f.next()
  f.publish()
  f.leave()
  const prior = cover(f)
  f.enter()
  f.observe(g, g)
  f.start(i, i)
  const start = events.length
  descend(f)
  f.finish()
  f.leave()
  const changes = events.slice(start),
    splits = changes.filter((k) => k === 'journal').length
  expect(splits).toBeGreaterThan(0)
  expect(changes).toEqual([
    ...Array.from({ length: splits }, () => [
      'journal',
      'child-cell',
      'update'
    ]).flat(),
    ...Array.from({ length: splits }, () => 'undo')
  ])
  expect(cover(f)).toEqual(prior)
})
it.each([
  'entry',
  'lookup',
  'begin',
  'cleanup',
  'root-cell',
  'journal',
  'child-cell',
  'update',
  'undo',
  'publish'
] as const)(
  'invalidates all private state on cancellation at %s and retries from original roots',
  (stage) => {
    const g = frontierBox(),
      i = index(g),
      sentinel = new Error(stage)
    let armed = true
    const f = new MeshFrontier((k) => {
      if (armed && k === stage) throw sentinel
    })
    expect(() => {
      try {
        f.enter()
        f.observe(g, g)
        f.start(i, i)
        descend(f)
        if (stage === 'undo') f.finish()
        else f.publish()
      } catch (error) {
        f.cancel()
        throw error
      } finally {
        f.leave()
      }
    }).toThrow(sentinel)
    expect(cover(f)).toEqual([])
    armed = false
    f.enter()
    f.observe(g, g)
    f.start(i, i)
    const [a, b] = f.next()
    expect(a).toBe(i.root)
    expect(b).toBe(i.root)
    f.cancel()
    f.leave()
  }
)
it('preserves source/index/lazy hierarchy ownership and invalidates an old private cover', () => {
  const g = frontierBox(),
    h = frontierPrism(),
    i = index(g),
    j = index(h),
    f = new MeshFrontier(noop)
  f.enter()
  f.observe(g, h)
  f.start(i, j)
  descend(f)
  f.publish()
  f.leave()
  const replacement = buildMeshIndex(g, noop)
  f.enter()
  f.observe(g, h)
  f.start(replacement, j)
  expect(f.next()[0]).toBe(replacement.root)
  f.finish()
  f.leave()
  const refined = refineMeshIndex(replacement, noop)
  f.enter()
  f.observe(g, h)
  f.start(refined, j)
  expect(f.next()[0]).toBe(refined.root)
  f.finish()
  f.leave()
  f.enter()
  f.observe(h, g)
  f.start(j, i)
  expect(f.next()[0]).toBe(j.root)
  f.finish()
  f.leave()
  f.enter()
  expect(f.observe({ ...g }, h)).toBe(false)
  expect(f.start(i, j)).toBeUndefined()
  f.leave()
})
const ops = poseOperations(intervalAlgebra)
const shape = (g: MeshGeometry, x: number): ConvexShape => ({
  geometry: g,
  pose: ops.fromPose({ ...IDENTITY_POSE, position: [x, x, 0] })
})
it('preserves complete query outputs and convex/projection call order after failed full-interval work', () => {
  const g = frontierPrism(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  const p = vi.spyOn(projection, 'projectedBoundsGap'),
    c = vi.spyOn(convex, 'convexDistance')
  const runs = [
    new ImmutableQuery(undefined, 500000, true, prepared, true),
    new OriginalMeshQuery(undefined, 500000, true, prepared, true)
  ].map((q) => {
    p.mockClear()
    c.mockClear()
    const a = shape(g, 0),
      results = []
    for (const [x, threshold] of [
      [1.25, 0.1],
      [1.125, 0.5],
      [1.375, 0.8],
      [1.25, 0.1]
    ] as const) {
      const first = q.distance(a, shape(g, x), threshold, 1e-6, 64)
      results.push(first)
      results.push(
        q.lowerOver(
          a,
          {
            geometry: g,
            pose: {
              ...a.pose,
              position: [
                [-1.25, 1.25],
                [-1.25, 1.25],
                [0, 0]
              ]
            }
          },
          threshold,
          first,
          1e-6,
          64
        )
      )
    }
    return {
      results,
      projections: p.mock.calls.map((args) => args.slice(0, -1)),
      convex: c.mock.calls
    }
  })
  expect(runs[1]).toEqual(runs[0])
})
it('rejects checkpoint reentrancy before mutation while allowing the outer owned query to complete', () => {
  const g = frontierPrism()
  let armed = true,
    rejected = false
  const q = new OriginalMeshQuery(
    () => {
      if (armed) {
        armed = false
        expect(() =>
          q.distance(shape(g, 0), shape(g, 1.25), 0.1, 1e-6, 64)
        ).toThrow('Reentrant')
        rejected = true
      }
    },
    500000,
    true,
    undefined,
    true
  )
  expect(
    q.distance(shape(g, 0), shape(g, 1.25), 0.1, 1e-6, 64).lower
  ).toBeGreaterThan(0.1)
  expect(rejected).toBe(true)
})
it('preserves the fresh interval-zero result when rollback exhausts and prevents later solving', () => {
  const g = frontierPrism(),
    q = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
  const a = shape(g, 0),
    first = q.distance(a, shape(g, 3), 0.1, 1e-6, 64)
  const f = (
      q as unknown as {
        frontier: { charge: (kind: FrontierWork) => void; head?: unknown }
      }
    ).frontier,
    charge = f.charge,
    sentinel = new MeshWorkLimit('rollback exhausted')
  f.charge = (k) => {
    if (k === 'undo') throw sentinel
    charge(k)
  }
  // A larger threshold causes new splits before the incomplete interval exits.
  const result = q.lowerOver(
    a,
    {
      geometry: g,
      pose: {
        ...a.pose,
        position: [
          [-1.25, 1.25],
          [-1.25, 1.25],
          [0, 0]
        ]
      }
    },
    0.8,
    first,
    1e-6,
    64
  )
  expect(result).toBe(0)
  expect(f.head).toBeUndefined()
  expect(() => q.distance(a, shape(g, 1.25), 0.1, 1e-6, 64)).toThrow(sentinel)
})
it('preserves a newly completed static result when the actual rollback tick exhausts', () => {
  const g = frontierPrism(),
    a = shape(g, 0),
    control = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
  const owner = (
      control as unknown as { frontier: { charge: (k: FrontierWork) => void } }
    ).frontier,
    charge = owner.charge
  let firstUndo = -1
  owner.charge = (k) => {
    if (k === 'undo' && firstUndo < 0) firstUndo = control.work
    charge(k)
  }
  const expected = control.distance(a, a, 0.1, 1e-6, 64)
  expect(firstUndo).toBeGreaterThan(0)
  const q = new OriginalMeshQuery(undefined, firstUndo, true, undefined, true)
  const sample = q.createStaticSampler({
    threshold: 0.1,
    distanceTolerance: 1e-6,
    maxIterations: 64
  })
  const fresh = sample(a, a, {
    node: {},
    segment: 0,
    start: 0,
    end: 1,
    time: 0,
    capture: false
  })
  expect(fresh?.evidence).toEqual(expected)
  expect(q.work).toBe(firstUndo + 1)
  expect(
    (q as unknown as { frontier: { head?: unknown } }).frontier.head
  ).toBeUndefined()
  expect(() => q.distance(a, a, 0.1, 1e-6, 64)).toThrow(MeshWorkLimit)
  expect(q.work).toBe(firstUndo + 1)
})
it('rejects incomplete or substituted original source before linked ownership', () => {
  const g = frontierBox(),
    flat = buildMeshIndex(g, noop, false),
    f = new MeshFrontier(noop)
  f.enter()
  f.observe(g, g)
  expect(() => f.start(undefined, flat)).toThrow('Missing original')
  expect(() =>
    f.start(
      {
        ...flat,
        root: { ...flat.root, triangles: flat.root.triangles.slice(1) }
      },
      flat
    )
  ).toThrow('Incomplete original')
  expect(() =>
    f.start(buildMeshIndex(frontierBox(2), noop, false), flat)
  ).toThrow('geometry mismatch')
  f.cancel()
  f.leave()
})
it('does not allocate or mutate a cell when its preceding operation checkpoint rejects', () => {
  const g = frontierBox(),
    i = index(g)
  for (const stage of ['journal', 'child-cell', 'update'] as const) {
    let armed = false,
      actual: unknown
    const f = new MeshFrontier((k) => {
      if (armed && k === stage) {
        actual = {
          cover: cover(f),
          journal: Boolean((f as unknown as { journal?: unknown }).journal)
        }
        throw new Error(stage)
      }
    })
    f.enter()
    f.observe(g, g)
    f.start(i, i)
    const before = cover(f)
    f.next()
    armed = true
    expect(() => f.split('a')).toThrow(stage)
    expect(actual).toEqual({ cover: before, journal: stage !== 'journal' })
    f.cancel()
    f.leave()
  }
})
it('never publishes partial geometry when cancellation interrupts any actual query checkpoint', () => {
  const g = frontierPrism(),
    a = shape(g, 0),
    b = shape(g, 1.25),
    control = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
  control.distance(a, b, 0.1, 1e-6, 64)
  for (let stop = 1; stop <= control.work; stop++) {
    let ticks = 0
    const sentinel = new Error('cancel at actual checkpoint'),
      q = new OriginalMeshQuery(
        () => {
          if (++ticks === stop) throw sentinel
        },
        500000,
        true,
        undefined,
        true
      )
    expect(() => q.distance(a, b, 0.1, 1e-6, 64)).toThrow(sentinel)
    expect(
      (q as unknown as { frontier: { head?: unknown; busy: boolean } }).frontier
        .head
    ).toBeUndefined()
    expect(
      (q as unknown as { frontier: { busy: boolean } }).frontier.busy
    ).toBe(false)
  }
})
it('observes actual existing-cell reads and writes independently of fee labels on unchanged terminals', () => {
  const g = frontierBox(),
    i = index(g),
    f = new MeshFrontier(noop)
  f.enter()
  f.observe(g, g)
  f.start(i, i)
  descend(f)
  f.publish()
  f.leave()
  let cell = (f as unknown as { head?: Cell }).head,
    reads = 0,
    writes = 0,
    payloadReads = 0
  const cells: Cell[] = []
  while (cell) {
    cells.push(cell)
    let successor = cell.next
    Object.defineProperty(cell, 'next', {
      get: () => {
        reads++
        return successor
      },
      set: (value: Cell | undefined) => {
        writes++
        successor = value
      }
    })
    for (const axis of [0, 1] as const) {
      let value = cell[axis]
      Object.defineProperty(cell, axis, {
        get: () => {
          payloadReads++
          return value
        },
        set: (next: MeshNode | undefined) => {
          writes++
          value = next
        }
      })
    }
    cell = successor
  }
  const freezes = vi.spyOn(Object, 'freeze')
  for (let repeat = 0; repeat < 4; repeat++) {
    f.enter()
    f.observe(g, g)
    f.start(i, i)
    for (const expected of cells) expect(f.next()).toBe(expected)
    expect(f.hasPending).toBe(false)
    f.publish()
    f.leave()
    expect((f as unknown as { head?: Cell }).head).toBe(cells[0])
  }
  // Returning an existing cell reads exactly its successor. There is no payload
  // clone, relink, mark or freeze hidden behind a removed capture fee.
  expect(reads).toBe(4 * cells.length)
  expect(payloadReads).toBe(0)
  expect(writes).toBe(0)
  expect(freezes).not.toHaveBeenCalled()
})
it.each([new Error('entry cancelled'), new MeshWorkLimit('entry exhausted')])(
  'retires a previously completed frontier on its own failed entry: %s',
  (sentinel) => {
    const g = frontierPrism(),
      a = shape(g, 0),
      b = shape(g, 1.25),
      q = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
    const f = (
      q as unknown as {
        frontier: {
          charge: (kind: FrontierWork) => void
          head?: unknown
          cursor?: unknown
          active?: unknown
          journal?: unknown
          busy: boolean
        }
      }
    ).frontier
    const charge = f.charge,
      events: FrontierWork[] = []
    let armed = false
    f.charge = (kind) => {
      if (armed && kind === 'entry') throw sentinel
      events.push(kind)
      charge(kind)
    }
    const expected = q.distance(a, b, 0.1, 1e-6, 64)
    expect(f.head !== undefined).toBe(true)
    expect(events.filter((k) => k === 'cleanup')).toHaveLength(1)
    const before = q.work,
      recorded = events.length
    armed = true
    let thrown: unknown
    try {
      q.distance(a, b, 0.1, 1e-6, 64)
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBe(sentinel)
    expect(f.head === undefined).toBe(true)
    expect(f.cursor).toBeUndefined()
    expect(f.active).toBeUndefined()
    expect(f.journal).toBeUndefined()
    expect(f.busy).toBe(false)
    // The completed structure already holds its paid invalidation reservation;
    // cleanup cannot call another failing checkpoint or consume query work.
    expect(q.work).toBe(before)
    expect(events).toHaveLength(recorded)
    armed = false
    expect(q.distance(a, b, 0.1, 1e-6, 64)).toEqual(expected)
    expect(events.filter((k) => k === 'root-cell')).toHaveLength(2)
    expect(events.filter((k) => k === 'cleanup')).toHaveLength(2)
  }
)
it('clears a completed frontier when the actual next entry exceeds the logical budget', () => {
  const g = frontierPrism(),
    a = shape(g, 0),
    b = shape(g, 1.25),
    control = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
  const expected = control.distance(a, b, 0.1, 1e-6, 64),
    q = new OriginalMeshQuery(undefined, control.work, true, undefined, true)
  expect(q.distance(a, b, 0.1, 1e-6, 64)).toEqual(expected)
  const f = (q as unknown as { frontier: { head?: unknown; busy: boolean } })
    .frontier
  expect(f.head !== undefined).toBe(true)
  expect(() => q.distance(a, b, 0.1, 1e-6, 64)).toThrow(MeshWorkLimit)
  expect(f.head === undefined).toBe(true)
  expect(f.busy).toBe(false)
  expect(q.work).toBe(control.work + 1)
})
it('does not retire the outer completed frontier when a checkpoint attempts reentrant entry', () => {
  const g = frontierPrism(),
    a = shape(g, 0),
    b = shape(g, 1.25),
    q = new OriginalMeshQuery(undefined, 500000, true, undefined, true)
  const expected = q.distance(a, b, 0.1, 1e-6, 64)
  const f = (
      q as unknown as {
        frontier: {
          charge: (kind: FrontierWork) => void
          head?: unknown
          busy: boolean
        }
      }
    ).frontier,
    head = f.head,
    charge = f.charge
  let armed = true,
    rejected = false
  f.charge = (k) => {
    if (armed && k === 'entry') {
      armed = false
      expect(() => q.distance(a, b, 0.1, 1e-6, 64)).toThrow('Reentrant')
      expect(f.head).toBe(head)
      expect(f.busy).toBe(true)
      rejected = true
    }
    charge(k)
  }
  expect(q.distance(a, b, 0.1, 1e-6, 64)).toEqual(expected)
  expect(rejected).toBe(true)
  expect(f.busy).toBe(false)
})
