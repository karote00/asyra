import { Container } from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'
import {
  RetainedHierarchyProbe,
  type ProjectionMode
} from './retained-hierarchy-probe.js'

const workDuring = (probe: RetainedHierarchyProbe, apply: () => void) => {
  const leaves = new Set<Container>(probe.leaves)
  const original = Container.prototype.updateLocalTransform
  const domain = probe.groups.target.renderGroup ?? probe.scene.renderGroup

  if (!domain) {
    throw new Error('Missing domain')
  }

  const membership = vi.spyOn(domain, 'addChild')
  let descendants = 0
  const transform = vi
    .spyOn(Container.prototype, 'updateLocalTransform')
    .mockImplementation(function (this: Container) {
      if (leaves.has(this)) {
        descendants++
      }

      return original.call(this)
    })

  try {
    apply()
    probe.updateTransforms()

    return { descendants, membership: membership.mock.calls.length }
  } finally {
    transform.mockRestore()
    membership.mockRestore()
  }
}

describe('retained projection handoff experiment', () => {
  it.each<ProjectionMode>(['ordinary', 'isolated', 'retained'])(
    'preserves accepted coordinates, edits, order and parent lifetime in %s mode',
    (mode) => {
      const probe = new RetainedHierarchyProbe(mode)
      const before = probe.leaves.map((leaf) =>
        leaf.getGlobalPosition().clone()
      )

      try {
        const moved = workDuring(probe, () =>
          probe.accept(
            [0, 1, 2, 3].map((id) => ({ id, parent: 'target', x: -40, y: -60 }))
          )
        )

        expect(probe.leaves.map((leaf) => leaf.getGlobalPosition())).toEqual(
          before
        )
        const expected = {
          ordinary: { descendants: 4000, membership: 4004 },
          isolated: { descendants: 0, membership: 4 },
          retained: { descendants: 0, membership: 0 }
        }

        expect(moved).toEqual(expected[mode])
        expect(probe.work.classified).toBe(4)
        // Independent child work must survive a world-preserving root move.
        probe.leaves[0].x += 3
        probe.updateTransforms()
        expect(probe.leaves[0].getGlobalPosition().x).toBe(before[0].x + 3)
        expect(probe.leaves[1].getGlobalPosition()).toEqual(before[1])
        const translated = workDuring(probe, () =>
          probe.moveGroup('target', 47, 60)
        )

        expect(translated).toEqual({
          descendants: mode === 'isolated' ? 0 : 4000,
          membership: 0
        })
        expect(probe.leaves[0].getGlobalPosition().x).toBe(before[0].x + 10)
        expect(probe.leaves[1].getGlobalPosition().x).toBe(before[1].x + 7)
        probe.moveGroup('source', 100, 200)
        probe.removeEmptyGroup('source')
        probe.updateTransforms()
        expect(probe.leaves[1].getGlobalPosition().x).toBe(before[1].x + 7)
        expect(probe.leaves.every((leaf) => !leaf.destroyed)).toBe(true)
        process.stdout.write(
          JSON.stringify({ mode, moved, translated, work: probe.work }) + '\n'
        )
      } finally {
        probe.dispose()
      }
    }
  )

  it('flushes the currently accepted state instead of anticipating coordinate compensation', () => {
    const probe = new RetainedHierarchyProbe('retained', 4, 2)

    try {
      probe.accept([{ id: 0, parent: 'target', x: 0, y: 0 }])
      probe.updateTransforms()
      expect(probe.leaves[0].getGlobalPosition().x).toBe(40)
      probe.accept([{ id: 0, parent: 'target', x: -40, y: -60 }])
      probe.updateTransforms()
      expect(probe.leaves[0].getGlobalPosition().x).toBe(0)
      expect(probe.scene.children.slice(2)).toEqual([
        probe.roots[1],
        probe.roots[2],
        probe.roots[3],
        probe.roots[0]
      ])
      // An inverse accepted packet restores both membership and placement.
      probe.accept([{ id: 0, parent: 'source', x: 0, y: 0 }])
      probe.updateTransforms()
      expect(probe.leaves[0].getGlobalPosition().x).toBe(0)
    } finally {
      probe.dispose()
    }
  })

  it('exposes capture materialization work while preserving shared paint and logical bounds', () => {
    const probe = new RetainedHierarchyProbe('retained')

    try {
      probe.accept(
        [0, 1, 2, 3].map((id) => ({ id, parent: 'target', x: -40, y: -60 }))
      )
      probe.updateTransforms()
      const handles = [...probe.leaves]
      const contexts = probe.leaves.map((leaf) => leaf.context)
      const bounds = probe.bounds('target')

      for (let attempt = 0; attempt < 2; attempt++) {
        const capture = probe.captureTarget('target')

        try {
          expect(capture.clones).toBe(4004)
          expect(capture.target.getLocalBounds()).toMatchObject(bounds)
          expect(capture.target.children).toHaveLength(4)
          expect(
            (capture.target.children[0].children[0] as (typeof probe.leaves)[0])
              .context
          ).toBe(contexts[0])
        } finally {
          capture.release()
        }

        expect(probe.leaves).toEqual(handles)
        expect(contexts.every((context) => !context.destroyed)).toBe(true)
        expect(probe.leaves.every((leaf) => !leaf.destroyed)).toBe(true)
      }

      probe.leaves[0].clear().rect(-20, -20, 10, 10).fill(0xff0000)
      const changed = probe.bounds('target')

      expect(changed.x).toBe(bounds.x - 20)
      const capture = probe.captureTarget('target')

      try {
        expect(capture.target.getLocalBounds()).toMatchObject(changed)
      } finally {
        capture.release()
      }
    } finally {
      probe.dispose()
    }
  })
})
