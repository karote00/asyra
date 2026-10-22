import core from '@asyra/core'
import { createDefaultFill, PropertyTypes } from '@asyra/utils'
import { RenderGraphics } from '@asyra/render'
import { describe, expect, it } from 'vitest'
import {
  TEXT_PROPERTY_SCHEMA,
  TEXT_PROPERTY_DEFINITION,
  TEXT_PROPERTY_TYPE,
  DEFAULT_TEXT_DATA
} from '../props/components/text-component.js'
import {
  TEXT_COMPONENT_DEFINITION,
  TEXT_RENDER_STRATEGY
} from '../components/text.js'

describe('native editable text', () => {
  it('preserves text, rejects invalid writes and defaults invalid loaded typography', () => {
    core.registerPropertySchema(TEXT_PROPERTY_SCHEMA)
    const TextProperty = core.definePropertyComponent(TEXT_PROPERTY_DEFINITION)
    const property = new TextProperty({
      id: 'text-property-test',
      type: TEXT_PROPERTY_TYPE
    })
    property.set('text' as never, 'Hello 世界\n<b>literal</b>' as never)
    property.set('fontSize' as never, 32 as never)
    expect(property.save()).toMatchObject({
      text: 'Hello 世界\n<b>literal</b>',
      fontSize: 32
    })
    property.set('fontSize' as never, -10 as never)
    expect(property.get('fontSize' as never)).toBe(32)
    property.load({
      id: 'text-property-test',
      type: TEXT_PROPERTY_TYPE,
      fontSize: -5,
      text: 'Restored'
    } as never)
    expect(property.get('fontSize' as never)).toBe(DEFAULT_TEXT_DATA.fontSize)
    expect(property.get('text' as never)).toBe('Restored')
  })

  it.each([
    ['fontSize', 0],
    ['fontSize', Infinity],
    ['lineHeight', -1],
    ['letterSpacing', 101],
    ['fontFamily', ''],
    ['fontWeight', 'heavy'],
    ['fontStyle', 'oblique'],
    ['textAlign', 'justify'],
    ['text', null],
    ['text', 'x'.repeat(100_001)]
  ])('rejects invalid %s values through its canonical schema', (key, value) => {
    const field = TEXT_PROPERTY_SCHEMA.fields.find((field) => field.key === key)
    expect(field?.validate?.(value)).toBe(false)
  })

  it('exposes canonical field targets for all editable typography fields', () => {
    const definition = TEXT_COMPONENT_DEFINITION.properties.find(
      (entry) => entry.name === TEXT_PROPERTY_TYPE
    )
    expect(definition?.alias).toEqual(Object.keys(DEFAULT_TEXT_DATA))
  })

  it('registers the same canonical fills property as other paintable elements', () => {
    expect(
      TEXT_COMPONENT_DEFINITION.properties.some(
        (entry) => entry.type === PropertyTypes.FILLS
      )
    ).toBe(true)
  })

  it('projects only visible fills with independent opacity and preserves layer order', () => {
    const graphics = new RenderGraphics()
    TEXT_RENDER_STRATEGY(graphics, {
      ...DEFAULT_TEXT_DATA,
      text: 'Painted',
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      fills: [
        createDefaultFill({ color: '#ff0000', opacity: 0.25 }),
        createDefaultFill({ color: '#00ff00', visible: false }),
        createDefaultFill({ color: '#0000ff', opacity: 0.75 })
      ]
    } as never)
    const operations = graphics
      .getDrawOperations()
      .filter((operation) => operation.type === 'text')
    expect(operations).toHaveLength(2)
    expect(operations.map((operation) => operation.paint)).toEqual([
      { color: 0xff0000, alpha: 0.25 },
      { color: 0x0000ff, alpha: 0.75 }
    ])
    TEXT_RENDER_STRATEGY(graphics, {
      ...DEFAULT_TEXT_DATA,
      text: 'Painted',
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      fills: []
    } as never)
    expect(graphics.getDrawOperations()).toEqual([{ type: 'clear' }])
    expect(graphics.hitArea).toBeDefined()
  })

  it('projects editable content and typography without outlined glyphs', () => {
    const graphics = new RenderGraphics()
    TEXT_RENDER_STRATEGY(graphics, {
      id: 'text-test',
      type: 'text',
      x: 30,
      y: 40,
      width: 200,
      height: 80,
      ...DEFAULT_TEXT_DATA,
      text: 'Editable',
      fills: [createDefaultFill({ color: '#000000' })],
      fontSize: 30
    } as never)
    expect(graphics.getDrawOperations()).toEqual([
      { type: 'clear' },
      expect.objectContaining({
        type: 'text',
        text: 'Editable',
        fontSize: 30,
        width: 200,
        height: 80
      })
    ])
    expect(graphics.x).toBe(30)
    expect(graphics.y).toBe(40)
    expect(graphics.hitArea).toBeDefined()
  })
})
