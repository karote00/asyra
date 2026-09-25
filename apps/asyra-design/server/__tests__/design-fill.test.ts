import { describe, expect, it } from 'vitest'
import { prepareDesign } from '../design-preparation'
import { admitPreparedDesign } from '../../src/ai/prepared-design-admission'

const gradient = (gradientType = 'linear') => ({
  gradientType,
  gradientHandles: [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ],
  gradientStops: [
    { position: 0, color: '#164354', opacity: 1 },
    { position: 0.5, color: '#cceeff', opacity: 0.7 },
    { position: 1, color: '#448899', opacity: 1 }
  ]
})
const draft = (fill: unknown) => ({
  type: 'frame',
  name: 'Glass',
  width: 200,
  height: 100,
  fill,
  children: [
    { key: 'pane', name: 'Pane', type: 'rect', width: 80, height: 80, fill }
  ]
})

describe('AI gradient fill contract', () => {
  it.each(['linear'])(
    'preserves native %s gradients through preparation and admission',
    (kind) => {
      const fill = gradient(kind)
      const design = prepareDesign(draft(fill))
      expect(admitPreparedDesign(JSON.parse(JSON.stringify(design)))).toEqual(
        design
      )
      for (const entry of design.entries) {
        expect(entry.descriptor.fills).toEqual([
          expect.objectContaining({ kind: 'gradient', gradient: fill })
        ])
      }
      expect(design.entries).toHaveLength(2)
    }
  )
  it('preserves gradients on projected and repeated visible faces', () => {
    const fill = gradient()
    const design = prepareDesign({
      type: 'group',
      name: 'Repeated glass',
      projection: {
        azimuth: 30,
        elevation: 30,
        scale: 1,
        originX: 200,
        originY: 200
      },
      children: [
        {
          key: 'panes',
          name: 'Panes',
          type: 'pattern',
          origin: { x: 0, y: 0, z: 0 },
          axes: [{ count: 2, step: { x: 30, y: 0, z: 0 } }],
          faces: [
            {
              key: 'face',
              name: 'Glass',
              fill,
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 20, y: 0, z: 0 },
                { x: 20, y: 0, z: 20 },
                { x: 0, y: 0, z: 20 }
              ]
            }
          ]
        }
      ]
    })
    expect(admitPreparedDesign(JSON.parse(JSON.stringify(design)))).toEqual(
      design
    )
    expect(
      design.entries.filter((e) => e.descriptor.type === 'vector')
    ).toHaveLength(2)
    expect(design.entries.at(-1)?.descriptor.fills).toEqual([
      expect.objectContaining({ gradient: fill })
    ])
  })
  it.each([
    { ...gradient(), gradientType: 'unknown' },
    ...['radial', 'angular', 'diamond'].map((gradientType) => ({
      ...gradient(),
      gradientType
    })),
    { ...gradient(), metadata: { executable: 'no' } },
    {
      ...gradient(),
      gradientHandles: [
        { x: 0, y: 0 },
        { x: NaN, y: 1 }
      ]
    },
    { ...gradient(), gradientStops: [] },
    { ...gradient(), gradientStops: gradient().gradientStops.toReversed() },
    {
      ...gradient(),
      gradientStops: [
        { position: 0, color: '#112233', opacity: 2 },
        { position: 1, color: '#445566', opacity: 1 }
      ]
    }
  ])('rejects malformed fill without producing a drawing', (fill) => {
    expect(() => prepareDesign(draft(fill))).toThrow()
  })
  it('rejects tampered prepared gradients and retains existing solid compatibility', () => {
    const design = prepareDesign(draft('#112233'))
    expect(admitPreparedDesign(design)).toBeDefined()
    const changed = JSON.parse(JSON.stringify(design))
    changed.entries[0].descriptor.fills[0].kind = 'gradient'
    changed.entries[0].descriptor.fills[0].gradient = {
      ...gradient(),
      gradientStops: []
    }
    expect(() => admitPreparedDesign(changed)).toThrow()
  })
})
