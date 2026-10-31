import { describe, expect, it, vi } from 'vitest'
import {
  previewSpatialEdit,
  resolveSpatialEdit,
  type SpatialEditTarget
} from '../spatial/editing.js'

const target = (): SpatialEditTarget => ({
  id: 'part',
  revision: 3,
  allowScale: true,
  pose: { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] }
})
const plane = {
  origin: [1, 2, 3] as const,
  u: [1, 0, 0] as const,
  v: [0, 0, 1] as const,
  spacing: [0.5, 0.5] as const
}

describe('Generic transform preview and canonical handoff', () => {
  it('projects and snaps relative to the supplied plane origin without mutating its source', () => {
    const source = target()
    const next = previewSpatialEdit(source, {
      kind: 'translate',
      delta: [0.76, 99, 3.24],
      plane
    })
    expect(next.pose.position).toEqual([1, 2, 3])
    expect(source.pose.position).toEqual([0, 0, 0])
    expect(Object.isFrozen(next.pose.position)).toBe(true)
    expect(resolveSpatialEdit(next, source, () => true).status).toBe('ready')
  })
  it('supports oblique planes and deterministic half-grid ties', () => {
    const a = Math.SQRT1_2
    const next = previewSpatialEdit(target(), {
      kind: 'translate',
      delta: [a * 0.5, a * 0.5, 9],
      plane: { origin: [0, 0, 0], u: [a, a, 0], v: [0, 0, 1], spacing: [1, 1] }
    })
    expect(next.pose.position[0]).toBeCloseTo(a)
    expect(next.pose.position[1]).toBeCloseTo(a)
    expect(next.pose.position[2]).toBe(9)
  })
  it('rotates around an explicit axis and distinguishes local from world composition', () => {
    const source = target()
    const x = previewSpatialEdit(source, {
      kind: 'rotate',
      axis: [1, 0, 0],
      radians: Math.PI / 2,
      space: 'local'
    })
    const turned = { ...source, pose: x.pose }
    const local = previewSpatialEdit(turned, {
      kind: 'rotate',
      axis: [0, 1, 0],
      radians: Math.PI / 2,
      space: 'local'
    })
    const world = previewSpatialEdit(turned, {
      kind: 'rotate',
      axis: [0, 1, 0],
      radians: Math.PI / 2,
      space: 'world'
    })
    expect(local.pose.rotation[2]).toBeCloseTo(0.5)
    expect(world.pose.rotation[2]).toBeCloseTo(-0.5)
  })
  it('supports positive scale only when the current target capability permits it', () => {
    const source = target()
    const next = previewSpatialEdit(source, {
      kind: 'scale',
      factors: [2, 3, 4]
    })
    expect(next.pose.scale).toEqual([2, 3, 4])
    expect(
      resolveSpatialEdit(next, { ...source, allowScale: false }, () => true)
        .status
    ).toBe('rejected')
    expect(() =>
      previewSpatialEdit(
        { ...source, allowScale: false },
        { kind: 'scale', factors: [2, 1, 1] }
      )
    ).toThrow(/scale/i)
  })
  it.each([0, -1, Infinity, NaN])('rejects invalid scale %s', (n) => {
    expect(() =>
      previewSpatialEdit(target(), { kind: 'scale', factors: [n, 1, 1] })
    ).toThrow()
  })
  it('rejects degenerate planes, nonfinite translation and nonunit target rotation', () => {
    expect(() =>
      previewSpatialEdit(target(), {
        kind: 'translate',
        delta: [1, 0, 0],
        plane: { ...plane, v: plane.u }
      })
    ).toThrow()
    expect(() =>
      previewSpatialEdit(target(), {
        kind: 'translate',
        delta: [Infinity, 0, 0]
      })
    ).toThrow()
    expect(() =>
      previewSpatialEdit(
        { ...target(), pose: { position: [0, 0, 0], rotation: [0, 0, 0, 0] } },
        { kind: 'scale', factors: [1, 1, 1] }
      )
    ).toThrow()
  })
  it('rejects stale, deleted or replaced targets before calling the domain validator', () => {
    const source = target(),
      validator = vi.fn(() => true)
    const next = previewSpatialEdit(source, {
      kind: 'translate',
      delta: [1, 0, 0]
    })
    for (const current of [
      null,
      { ...source, id: 'other' },
      { ...source, revision: 4 }
    ]) {
      expect(resolveSpatialEdit(next, current, validator).status).toBe(
        'rejected'
      )
    }
    expect(validator).not.toHaveBeenCalled()
  })
  it('returns neutral rejected feedback for App constraints and no-op for equivalent quaternion signs', () => {
    const source = target()
    const next = previewSpatialEdit(source, {
      kind: 'translate',
      delta: [1, 0, 0]
    })
    expect(resolveSpatialEdit(next, source, () => false)).toEqual({
      status: 'rejected',
      reason: 'constraint'
    })
    const unchanged = previewSpatialEdit(source, {
      kind: 'set',
      pose: { ...source.pose, rotation: [0, 0, 0, -1] }
    })
    expect(resolveSpatialEdit(unchanged, source, () => true).status).toBe(
      'unchanged'
    )
  })
  it('owns no state or commit callback: repeated previews and discard perform no canonical work', () => {
    const source = target(),
      validate = vi.fn(() => true)
    for (let i = 0; i < 30; i++) {
      previewSpatialEdit(source, { kind: 'translate', delta: [i, 0, 0] })
    }
    expect(validate).not.toHaveBeenCalled()
    expect(source.pose.position).toEqual([0, 0, 0])
    const next = previewSpatialEdit(source, {
      kind: 'translate',
      delta: [2, 0, 0]
    })
    resolveSpatialEdit(next, source, validate)
    expect(validate).toHaveBeenCalledOnce()
  })
})
