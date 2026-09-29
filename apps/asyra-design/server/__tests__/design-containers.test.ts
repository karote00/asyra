import { describe, expect, it } from 'vitest'
import { prepareDesign } from '../design-preparation'

const shape = {
  key: 'shape',
  type: 'rect',
  name: 'Shape',
  x: 20,
  y: 30,
  width: 40,
  height: 50
}
describe('semantic container selection', () => {
  it('derives Group bounds and preserves world placement in mixed nested containers', () => {
    const result = prepareDesign({
      type: 'group',
      name: 'Artwork',
      x: 10,
      y: 15,
      children: [
        {
          key: 'area',
          type: 'frame',
          name: 'Area',
          x: 100,
          y: 200,
          width: 300,
          height: 400,
          children: [
            {
              key: 'parts',
              type: 'group',
              name: 'Parts',
              x: 5,
              y: 6,
              children: [shape]
            }
          ]
        }
      ]
    })
    const ds = result.entries.map((e) => e.descriptor)
    expect(ds[0]).toMatchObject({
      type: 'group',
      x: 110,
      y: 215,
      width: 300,
      height: 400
    })
    expect(ds[1]).toMatchObject({
      type: 'frame',
      x: 0,
      y: 0,
      width: 300,
      height: 400
    })
    expect(ds[2]).toMatchObject({
      type: 'group',
      x: 25,
      y: 36,
      width: 40,
      height: 50
    })
    expect(ds[3]).toMatchObject({ x: 0, y: 0, width: 40, height: 50 })
    expect(ds[0].fills).toEqual([])
    expect(result.findings).toEqual([])
  })
  it('derives Group bounds from actual vector curves without changing world anchors', () => {
    const result = prepareDesign({
      type: 'group',
      name: 'Artwork',
      x: 10,
      y: 20,
      children: [
        {
          key: 'path',
          type: 'vector',
          name: 'Path',
          x: 5,
          y: 6,
          width: 100,
          height: 100,
          rings: [
            [
              { x: 20, y: 30 },
              { x: 70, y: 30 },
              { x: 70, y: 80 }
            ]
          ]
        }
      ]
    })
    expect(result.entries[0].descriptor).toMatchObject({
      x: 35,
      y: 56,
      width: 50,
      height: 50
    })
    expect(result.entries[1].descriptor).toMatchObject({
      x: 0,
      y: 0,
      width: 50,
      height: 50
    })
    expect(
      Object.values(result.entries[1].descriptor.points ?? {})[0]
    ).toMatchObject({ x: 35, y: 56 })
  })
  it('keeps Frame bounds independent of its children', () => {
    const result = prepareDesign({
      type: 'frame',
      name: 'Page',
      width: 300,
      height: 400,
      children: [shape]
    })
    expect(result.entries[0].descriptor).toMatchObject({
      type: 'frame',
      width: 300,
      height: 400
    })
  })
  it('supports empty Groups without inventing dimensions', () => {
    expect(
      prepareDesign({ type: 'group', name: 'Empty' }).entries[0].descriptor
    ).toMatchObject({ type: 'group', width: 0, height: 0 })
  })
  it.each([
    { fill: '#ffffff' },
    { width: 100 },
    { layout: 'row' },
    { padding: 10 }
  ])('rejects independent Group properties %j', (fields) => {
    expect(() =>
      prepareDesign({ type: 'group', name: 'Invalid', ...fields })
    ).toThrow()
  })
  it('requires an explicit container choice instead of silently using Frame', () => {
    expect(() =>
      prepareDesign({ name: 'Page', width: 100, height: 100 })
    ).toThrow()
    expect(() =>
      prepareDesign({ type: 'rect', name: 'Page', width: 100, height: 100 })
    ).toThrow()
  })
})
