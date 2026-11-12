import { Container, Graphics, updateRenderGroupTransforms } from 'pixi.js'
import { describe, expect, it, vi } from 'vitest'
import { PixiBatchPartitions } from '../pixi-batch-partitions.js'

const ordered = (parent: Container) =>
  parent.children.flatMap((child) =>
    child.isRenderGroup ? child.children : [child]
  )

describe('ordered native batch partitions', () => {
  it('preserves order and coordinates across insertion, removal, reorder and reparent', () => {
    const partitions = new PixiBatchPartitions()
    const parent = new Container({ x: 20, y: 30, scale: 2 })
    const children = Array.from(
      { length: 400 },
      (_, i) => new Container({ label: String(i), x: i, y: i })
    )
    const expected = [...children]

    children.forEach((child) => partitions.append(parent, child))
    expect(parent.children).toHaveLength(4)
    expect(ordered(parent).map((node) => node.label)).toEqual(
      expected.map((node) => node.label)
    )
    expect(children[200].getGlobalPosition()).toMatchObject({ x: 420, y: 430 })
    for (const [from, to] of [
      [10, 350],
      [200, 0],
      [399, 128],
      [0, 399],
      [3, 250]
    ]) {
      const child = expected[from]

      expected.splice(from, 1)
      expected.splice(to, 0, child)
      partitions.setIndex(parent, child, to)
      expect(ordered(parent).map((node) => node.label)).toEqual(
        expected.map((node) => node.label)
      )
      expect(
        parent.children.every((block) => block.children.length <= 128)
      ).toBe(true)
    }

    const untouchedTail = parent.children[parent.children.length - 1]
    const child = expected.shift()

    if (!child) {
      throw new Error('Missing first child')
    }

    partitions.remove(parent, child)
    expect(ordered(parent).map((node) => node.label)).toEqual(
      expected.map((node) => node.label)
    )
    expect(parent.children[parent.children.length - 1] === untouchedTail).toBe(
      true
    )
    const other = new Container()

    partitions.append(other, expected[130])
    expected.splice(130, 1)
    expect(ordered(parent).map((node) => node.label)).toEqual(
      expected.map((node) => node.label)
    )
    expect(other.children).toHaveLength(1)
    expect(() => partitions.setIndex(parent, expected[0], -1)).toThrow()
    partitions.dispose(parent)
    expect(parent.children).toHaveLength(0)
    expect(
      expected.every((node) => !node.destroyed && node.parent === null)
    ).toBe(true)
    expected.forEach((node) => node.destroy())
    child.destroy()
    other.destroy({ children: true })
    parent.destroy()
  })
  it('keeps small and graphics-owned child hierarchies direct', () => {
    const partitions = new PixiBatchPartitions()
    const parent = new Graphics()

    for (let i = 0; i < 150; i++) {
      partitions.append(parent, new Container())
    }

    expect(parent.children).toHaveLength(150)
    expect(parent.children.every((node) => !node.isRenderGroup)).toBe(true)
    partitions.dispose(parent)
    parent.destroy({ children: true })
  })
})

describe('semantic container reparent work', () => {
  it('updates an edited descendant after reparent without updating its unchanged sibling', () => {
    const scene = new Container({ isRenderGroup: true })
    const source = new Graphics({ isRenderGroup: true })
    const target = new Graphics({ isRenderGroup: true, x: 100 })
    const group = new Graphics({ isRenderGroup: true, x: 20 })
    const changed = new Container({ x: 10 })
    const stable = new Container({ x: 40 })

    scene.addChild(source, target)
    source.addChild(group)
    group.addChild(changed, stable)
    const root = scene.renderGroup

    if (!root) {
      throw new Error('Missing root render group')
    }

    updateRenderGroupTransforms(root, true)
    const changedUpdates = vi.spyOn(changed, 'updateLocalTransform')
    const stableUpdates = vi.spyOn(stable, 'updateLocalTransform')

    try {
      target.addChild(group)
      group.x = -80
      updateRenderGroupTransforms(root, true)
      expect(changedUpdates).not.toHaveBeenCalled()
      expect(stableUpdates).not.toHaveBeenCalled()
      changed.x = 15
      changed.alpha = 0.5
      changed.visible = false
      updateRenderGroupTransforms(root, true)
      expect(changedUpdates).toHaveBeenCalledOnce()
      expect(stableUpdates).not.toHaveBeenCalled()
      expect(changed.localTransform.tx).toBe(15)
      expect(changed.groupAlpha).toBe(0.5)
      expect(changed.globalDisplayStatus).not.toBe(7)
      expect(changed.parentRenderGroup).toBe(group.renderGroup)
      changed.visible = true
      group.setChildIndex(changed, 1)
      updateRenderGroupTransforms(root, true)
      expect(changed.globalDisplayStatus).toBe(7)
      expect(group.children).toEqual([stable, changed])
      expect(changed.getGlobalPosition().x).toBe(35)
      expect(stable.getGlobalPosition().x).toBe(60)
      changedUpdates.mockClear()
      stableUpdates.mockClear()
      target.x = 150
      target.alpha = 0.5
      updateRenderGroupTransforms(root, true)
      expect(changedUpdates).not.toHaveBeenCalled()
      expect(stableUpdates).not.toHaveBeenCalled()
      expect(group.renderGroup?.worldAlpha).toBe(0.5)
      expect(changed.getGlobalPosition().x).toBe(85)
      expect(stable.getGlobalPosition().x).toBe(110)
    } finally {
      changedUpdates.mockRestore()
      stableUpdates.mockRestore()
      scene.destroy({ children: true })
    }
  })

  it('retains the recorded subtree transforms while avoiding descendant render membership rebuilds', () => {
    const measure = (isolated: boolean) => {
      const source = new Container({ isRenderGroup: true })
      const target = new Container({ isRenderGroup: true, x: 40, y: 60 })
      const counts = [6150, 9400, 1189, 8800]
      const roots = counts.map((count) => {
        const root = new Graphics({ isRenderGroup: isolated })

        for (let i = 0; i < count; i++) {
          root.addChild(new Container({ x: i, y: i % 30 }))
        }

        source.addChild(root)

        return root
      })
      const leaf = roots[1].children[128]
      const before = leaf.getGlobalPosition().clone()
      const renderGroup = target.renderGroup

      if (!renderGroup) {
        throw new Error('Missing target render group')
      }

      const calls = vi.spyOn(renderGroup, 'addChild')

      if (!source.renderGroup) {
        throw new Error('Missing source render group')
      }

      updateRenderGroupTransforms(source.renderGroup, true)
      const descendants = new Set(roots.flatMap((root) => root.children))
      const originalUpdate = Container.prototype.updateLocalTransform
      let descendantTransforms = 0
      const updates = vi
        .spyOn(Container.prototype, 'updateLocalTransform')
        .mockImplementation(function (this: Container) {
          if (descendants.has(this)) {
            descendantTransforms++
          }

          return originalUpdate.call(this)
        })

      roots.forEach((root) => {
        target.addChild(root)
        root.position.set(-40, -60)
      })
      updateRenderGroupTransforms(renderGroup, true)
      const count = calls.mock.calls.length

      updates.mockRestore()

      expect(leaf.getGlobalPosition()).toEqual(before)
      expect(target.children).toEqual(roots)
      expect(roots.map((root) => root.children.length)).toEqual(counts)
      calls.mockRestore()
      source.destroy({ children: true })
      target.destroy({ children: true })

      return { membership: count, descendantTransforms }
    }

    expect(measure(false)).toEqual({
      membership: 25543,
      descendantTransforms: 25539
    })
    expect(measure(true)).toEqual({ membership: 4, descendantTransforms: 0 })
  })
})
