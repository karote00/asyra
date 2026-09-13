import { vi } from 'vitest'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { ConvexShape } from '../convex-query'
import * as mesh from '../mesh-index'
import { OriginalMeshQuery } from '../original-mesh-query'
import {
  SourceEventCredits,
  SourceHullLifetime,
  type SourceHullPreparation,
  sourceHullSeparation,
  type SupportCharge,
  type SupportComponent
} from './source-hull-support'

export class SourceAdmissionStop extends Error {}
type Project = (
  a: ConvexShape,
  b: ConvexShape,
  ab: mesh.Bounds | undefined,
  bb: mesh.Bounds | undefined,
  gap: number,
  threshold: number
) => number
interface QueryOwner {
  projectGap: Project
  traversalIndex(
    shape: ConvexShape,
    index?: mesh.MeshIndex
  ): mesh.MeshIndex | undefined
}
interface Certificate {
  query: number
  componentPair: string
  after: number
  lower: number
  threshold: number
}
interface Attempt {
  query: number
  componentPair: string
  event: number
  threshold: number
  before: number
  after: number
  lower: number | null
}
interface PendingEvent {
  id: number
  componentPair: string
  a: SupportComponent
  b: SupportComponent
  node: boolean
  certificate?: Certificate
}

/** Passive test observer: calls original owners unchanged and records actual tick IDs. */
export function observeSourceHull(
  context: OriginalMeshQuery,
  lifetime: SourceHullLifetime,
  limits = { added: 157622, combined: 500000, milliseconds: 20000 }
) {
  const started = performance.now(),
    categories: Partial<Record<SupportCharge, number>> = {}
  let added = 0,
    query = 0
  const credits = new SourceEventCredits(),
    certificates: Certificate[] = [],
    attempts: Attempt[] = []
  const pay = (kind: SupportCharge) => {
    categories[kind] = (categories[kind] ?? 0) + 1
    added++
    // This is a research stop, not MeshWorkLimit: the ordinary method must not
    // catch it and return a misleading successful fallback or partial evidence.
    if (added > limits.added)
      throw new SourceAdmissionStop(
        'Added work alone exceeds admission ceiling'
      )
    if (context.work + added > limits.combined)
      throw new SourceAdmissionStop('Combined admission work exhausted')
    if (performance.now() - started > limits.milliseconds)
      throw new SourceAdmissionStop('Admission wall-time exhausted')
  }
  const consume = lifetime.invocation(pay),
    preparations = new Map<MeshGeometry, SourceHullPreparation>()
  let active:
    | {
        a: ConvexShape
        b: ConvexShape
        traversal: boolean
        first?: mesh.Bounds
        pending?: PendingEvent
        attempted: Set<string>
        certificates: Map<string, Certificate>
      }
    | undefined
  const flush = () => {
    if (!active?.pending) return
    const pending = active.pending
    credits.record({
      id: pending.id,
      query,
      componentPair: pending.componentPair,
      kind: pending.node ? 'node' : 'triangle'
    })
    const certificate = pending.certificate
    if (certificate) credits.credit(pending.id, certificate)
    active.pending = undefined
  }
  const owner = OriginalMeshQuery.prototype as unknown as QueryOwner
  const traversal = owner.traversalIndex
  vi.spyOn(owner, 'traversalIndex').mockImplementation(function (
    this: OriginalMeshQuery,
    shape,
    index
  ) {
    const result = traversal.call(this, shape, index)
    if (
      this === context &&
      active &&
      result &&
      shape.geometry.kind === 'mesh'
    ) {
      const geometry = shape.geometry
      if (
        !Object.isFrozen(geometry) ||
        !Object.isFrozen(geometry.positions) ||
        !Object.isFrozen(geometry.indices)
      )
        throw new Error('Admission requires immutable resolved source')
      preparations.set(geometry, consume(result))
      active.traversal = true
    }
    return result
  })
  const world = mesh.worldBounds
  vi.spyOn(mesh, 'worldBounds').mockImplementation((bounds, pose) => {
    const result = world(bounds, pose)
    if (!active?.traversal) return result
    if (!active.first) {
      flush()
      if (pose !== active.a.pose)
        throw new Error('Unexpected first source pose')
      active.first = bounds
    } else {
      if (pose !== active.b.pose)
        throw new Error('Unexpected second source pose')
      const ag = active.a.geometry,
        bg = active.b.geometry
      if (ag.kind !== 'mesh' || bg.kind !== 'mesh')
        throw new Error('Fixed admission requires two original meshes')
      const ap = preparations.get(ag),
        bp = preparations.get(bg)
      if (!ap || !bp) throw new Error('Missing complete source preparation')
      const a = ap.owner(active.first, pay),
        b = bp.owner(bounds, pay)
      active.first = undefined
      if (a && b) {
        pay('lookup')
        active.pending = {
          id: context.work,
          componentPair: `${a.id}:${b.id}`,
          a,
          b,
          node: false,
          certificate: active.certificates.get(`${a.id}:${b.id}`)
        }
      }
    }
    return result
  })
  const project = owner.projectGap
  vi.spyOn(owner, 'projectGap').mockImplementation(function (
    this: OriginalMeshQuery,
    a,
    b,
    ab,
    bb,
    gap,
    threshold
  ) {
    const before = context.work,
      result = project.call(this, a, b, ab, bb, gap, threshold)
    if (this !== context || !active?.traversal || !active.pending) return result
    const pending = active.pending
    pending.node = true
    const certificate = pending.certificate
    for (let id = before + 1; id <= context.work; id++) {
      credits.record({
        id,
        query,
        componentPair: pending.componentPair,
        kind: 'axis'
      })
      if (certificate) credits.credit(id, certificate)
    }
    if (result > threshold) return result
    pay('lookup')
    if (active.attempted.has(pending.componentPair)) return result
    active.attempted.add(pending.componentPair)
    const attempt: Attempt = {
      query,
      componentPair: pending.componentPair,
      event: pending.id,
      threshold,
      before: added,
      after: added,
      lower: null
    }
    attempts.push(attempt)
    try {
      attempt.lower = sourceHullSeparation(
        pending.a,
        a.pose,
        pending.b,
        b.pose,
        threshold,
        pay
      )
      if (attempt.lower > threshold) {
        const receipt = {
          query,
          componentPair: pending.componentPair,
          after: context.work,
          lower: attempt.lower,
          threshold
        }
        certificates.push(receipt)
        active.certificates.set(pending.componentPair, receipt)
      }
    } finally {
      attempt.after = added
    }
    return result
  })
  const begin = (a: ConvexShape, b: ConvexShape) => {
    query++
    active = {
      a,
      b,
      traversal: false,
      attempted: new Set(),
      certificates: new Map()
    }
  }
  const end = () => {
    flush()
    active = undefined
  }
  const distance = context.distance.bind(context),
    lower = context.lowerOver.bind(context)
  context.distance = (...args) => {
    begin(args[0], args[1])
    try {
      return distance(...args)
    } finally {
      end()
    }
  }
  context.lowerOver = (...args) => {
    begin(args[0], args[1])
    try {
      return lower(...args)
    } finally {
      end()
    }
  }
  return {
    get report() {
      return {
        added,
        categories,
        queries: query,
        attempts,
        certificates,
        events: credits.events,
        credited: credits.credited,
        credit: credits.credited.length,
        originalWork: context.work,
        combined: context.work + added,
        optimisticWork: context.work + added - credits.credited.length,
        milliseconds: performance.now() - started
      }
    }
  }
}
