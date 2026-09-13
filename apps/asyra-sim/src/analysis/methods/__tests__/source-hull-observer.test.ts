import { afterEach, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { PreparedMeshIndex } from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import { SourceHullLifetime } from '../__fixtures__/source-hull-support'
import {
  observeSourceHull,
  SourceAdmissionStop
} from '../__fixtures__/source-hull-observer'

afterEach(() => vi.restoreAllMocks())
const ops = poseOperations(intervalAlgebra)
// A triangular prism with a diagonal face missing from its AABB directions.
const geometry: MeshGeometry = Object.freeze({
  kind: 'mesh',
  version: 1,
  source: { assetId: 'b'.repeat(64), scale: [1, 1, 1] as const },
  positions: Object.freeze([
    0, 0, -0.25, 2, 0, -0.25, 0, 2, -0.25, 0, 0, 0.25, 2, 0, 0.25, 0, 2, 0.25
  ]),
  indices: Object.freeze([
    2, 1, 0, 3, 4, 5, 0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 2, 0, 3, 2, 3, 5
  ])
})
const shape = (offset: number) => ({
  geometry,
  pose: ops.fromPose({ position: [offset, offset, 0], rotation: [0, 0, 0, 1] })
})
const run = (context: OriginalMeshQuery) =>
  context.distance(shape(0), shape(1.25), 0.01, 1e-6, 64)

it('observes unchanged source evidence and actual paid IDs, with equivalent cold/hot preparation and credit', () => {
  const control = new OriginalMeshQuery(),
    expected = run(control)
  const lifetime = new SourceHullLifetime(),
    prepared = new WeakMap<MeshGeometry, PreparedMeshIndex>()
  const results = []
  for (const mode of ['cold', 'hot']) {
    vi.restoreAllMocks()
    const context = new OriginalMeshQuery(undefined, 500000, true, prepared)
    const owner = context as unknown as { tick: (units?: number) => void },
      tick = owner.tick,
      actual = new Set<number>()
    owner.tick = (units = 1) => {
      const before = context.work
      tick(units)
      for (let id = before + 1; id <= context.work; id++) actual.add(id)
    }
    const observer = observeSourceHull(context, lifetime)
    expect(run(context), mode).toEqual(expected)
    const report = observer.report
    expect(context.work).toBe(control.work)
    expect(actual.size).toBe(control.work)
    expect(report.certificates.length).toBeGreaterThan(0)
    expect(report.credit).toBeGreaterThan(0)
    for (const id of report.credited) expect(actual.has(id)).toBe(true)
    expect(new Set(report.events.map((event) => event.id)).size).toBe(
      report.events.length
    )
    expect(
      report.events
        .filter((event) => report.credited.includes(event.id))
        .every((event) => ['node', 'axis', 'triangle'].includes(event.kind))
    ).toBe(true)
    results.push(report)
  }
  expect(results[1].categories).toEqual(results[0].categories)
  expect(results[1].credited).toEqual(results[0].credited)
  expect(results[1].attempts).toEqual(results[0].attempts)
})

it('propagates the admission stop instead of letting the canonical method swallow it as no certificate', () => {
  const context = new OriginalMeshQuery(),
    observer = observeSourceHull(context, new SourceHullLifetime(), {
      added: 1,
      combined: 500000,
      milliseconds: 20000
    })
  expect(() => run(context)).toThrow(SourceAdmissionStop)
  expect(observer.report.added).toBe(2)
  expect(observer.report.certificates).toHaveLength(0)
})
