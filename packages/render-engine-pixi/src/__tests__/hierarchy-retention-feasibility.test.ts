import {
  Container,
  Graphics,
  RenderLayer,
  updateRenderGroupTransforms
} from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'

/** Characterization of public SDK candidates, not an accepted product policy. */
describe('hierarchy retention feasibility', () => {
  it.each(['ordinary', 'layer', 'isolated'] as const)(
    'measures public %s reparent work and preserves subsequent edits',
    (mode) => {
      const scene = new Container({ isRenderGroup: true })
      const source = new Container()
      const target = new Container({ x: 40, y: 60 })
      const layer = new RenderLayer()
      const roots = Array.from({ length: 4 }, (_, index) => {
        const root = new Graphics({
          isRenderGroup: mode === 'isolated',
          x: index * 20
        })

        for (let i = 0; i < 1000; i++) {
          root.addChild(
            new Graphics()
              .rect(i % 100, Math.floor(i / 100), 1, 1)
              .fill(0xffffff)
          )
        }

        source.addChild(root)

        return root
      })

      scene.addChild(source, target, layer)
      if (mode === 'layer') {
        layer.attach(...roots)
      }

      const domain = scene.renderGroup

      if (!domain) {
        throw new Error('Missing render domain')
      }

      updateRenderGroupTransforms(domain, true)
      const leaves = roots.flatMap((root) => root.children)
      const before = leaves.map((leaf) => leaf.getGlobalPosition().clone())
      const beforeBounds = roots.map((root) => ({
        ...root.getBounds().rectangle
      }))
      const membership = vi.spyOn(domain, 'addChild')
      const descendants = new Set(leaves)
      const originalUpdate = Container.prototype.updateLocalTransform
      let descendantUpdates = 0
      const transform = vi
        .spyOn(Container.prototype, 'updateLocalTransform')
        .mockImplementation(function (this: Container) {
          if (descendants.has(this)) {
            descendantUpdates++
          }

          return originalUpdate.call(this)
        })

      try {
        roots.forEach((root, index) => target.reparentChildAt(root, index))
        if (mode === 'layer') {
          expect(roots.every((root) => root.parentRenderLayer === null)).toBe(
            true
          )
          layer.attach(...roots)
        }

        updateRenderGroupTransforms(domain, true)
        const work = {
          membership: membership.mock.calls.length,
          descendantUpdates
        }

        membership.mockRestore()
        transform.mockRestore()
        expect(work).toEqual(
          mode === 'isolated'
            ? { membership: 4, descendantUpdates: 0 }
            : { membership: 4004, descendantUpdates: 4000 }
        )
        expect(target.children).toEqual(roots)
        expect(leaves.map((leaf) => leaf.getGlobalPosition())).toEqual(before)
        expect(
          roots.map((root) => ({ ...root.getBounds().rectangle }))
        ).toEqual(beforeBounds)
        leaves[0].x += 3
        updateRenderGroupTransforms(domain, true)
        expect(leaves[0].getGlobalPosition().x).toBe(before[0].x + 3)
        expect(leaves[1].getGlobalPosition()).toEqual(before[1])
        roots[0].x += 7
        updateRenderGroupTransforms(domain, true)
        expect(leaves[0].getGlobalPosition().x).toBe(before[0].x + 10)
        expect(leaves[1].getGlobalPosition().x).toBe(before[1].x + 7)
        process.stdout.write(`${mode}: ${JSON.stringify(work)}\n`)
      } finally {
        membership.mockRestore()
        transform.mockRestore()
        scene.destroy({ children: true })
      }
    }
  )

  it('does not mistake a render-order layer for a retained logical parent', () => {
    const scene = new Container({ isRenderGroup: true })
    const source = new Container()
    const proposedParent = new RenderLayer()
    const leaf = new Graphics().rect(0, 0, 10, 10).fill(0xffffff)

    proposedParent.x = 40
    scene.addChild(source, proposedParent)
    source.addChild(leaf)
    expect(source.getLocalBounds().width).toBe(10)
    const before = leaf.getGlobalPosition().clone()

    proposedParent.attach(leaf)
    expect(leaf.parent).toBe(source)
    expect(proposedParent.renderLayerChildren).toEqual([leaf])
    // Native local-content bounds and transform inheritance still follow the
    // physical parent. The production snapshot query uses these bounds.
    expect(proposedParent.getLocalBounds().width).toBe(0)
    proposedParent.x += 20
    const domain = scene.renderGroup

    if (!domain) {
      throw new Error('Missing render domain')
    }

    updateRenderGroupTransforms(domain, true)
    expect(leaf.getGlobalPosition()).toEqual(before)
    scene.destroy({ children: true })
  })
})
