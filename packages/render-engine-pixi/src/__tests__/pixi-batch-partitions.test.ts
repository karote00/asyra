import { Container, Graphics } from 'pixi.js'
import { describe, expect, it } from 'vitest'
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
    if (!child) throw new Error('Missing first child')
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
    for (let i = 0; i < 150; i++) partitions.append(parent, new Container())
    expect(parent.children).toHaveLength(150)
    expect(parent.children.every((node) => !node.isRenderGroup)).toBe(true)
    partitions.dispose(parent)
    parent.destroy({ children: true })
  })
})
