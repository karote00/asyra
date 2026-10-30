import { describe, expect, it, vi } from 'vitest'
import {
  TEXT_COMPONENT_TYPE,
  TEXT_PROPERTY_TYPE,
  DEFAULT_TEXT_DATA
} from '@asyra/preset'
import { initText } from '../capabilities/init-text'

describe('text installation', () => {
  it('installs public definitions and a typography-only selection projection', () => {
    const core = {
      registerPropertySchema: vi.fn(),
      registerLoadHook: vi.fn(),
      definePropertyComponent: vi.fn(),
      defineComponent: vi.fn(),
      registerRenderStrategy: vi.fn(),
      defineUIProperty: vi.fn()
    }
    initText(core as never)
    expect(core.defineComponent).toHaveBeenCalledWith(
      expect.objectContaining({ type: TEXT_COMPONENT_TYPE })
    )
    expect(
      core.registerRenderStrategy.mock.calls[0][2].relations
    ).toContainEqual(
      expect.objectContaining({ target: { kind: 'property', key: 'fills' } })
    )
    const migrate = core.registerLoadHook.mock.calls[0]?.[0]
    expect(migrate).toBeTypeOf('function')
    const saved = {
      version: '1.0.0',
      sceneTree: {
        elements: {
          text: {
            id: 'text',
            type: 'text',
            name: 'User text',
            props: { typography: 'type-data' }
          },
          other: { id: 'other', type: 'rect', props: {} }
        }
      },
      props: {
        'text-fills': { id: 'text-fills', type: 'position', x: 7 },
        'text-fill': { id: 'text-fill', type: 'position', x: 9 },
        'type-data': {
          id: 'type-data',
          type: 'typography',
          text: 'User content',
          textColor: '#314F32'
        }
      }
    }
    const original = structuredClone(saved)
    const migrated = migrate(saved)
    expect(saved).toEqual(original)
    const fillsId = migrated.sceneTree.elements.text.props.fills
    const fillId = migrated.props[fillsId].fills[0]
    expect(fillsId).toBe('text-fills-1')
    expect(fillId).toBe('text-fill-1')
    expect(migrated.props['text-fills']).toEqual(saved.props['text-fills'])
    expect(migrated.props['text-fill']).toEqual(saved.props['text-fill'])
    expect(migrated.props[fillId]).toMatchObject({
      type: 'fill',
      color: '#314F32',
      opacity: 1,
      visible: true
    })
    expect(migrated.props['type-data']).toEqual({
      id: 'type-data',
      type: 'typography',
      text: 'User content'
    })
    expect(migrated.sceneTree.elements.other).toEqual(
      saved.sceneTree.elements.other
    )
    expect(migrate(migrated)).toBe(migrated)
    const [key, config] = core.defineUIProperty.mock.calls[0]
    expect(key).toBe(TEXT_PROPERTY_TYPE)
    expect(config.triggers).toMatchObject({
      onSelectionChange: true
    })
    expect(config.compute({ selectedIds: new Set(), elements: [] })).toBeNull()
    const typography = { ...DEFAULT_TEXT_DATA, text: 'Heading' }
    expect(
      config.compute({
        selectedIds: new Set(['text']),
        elements: [typography]
      })
    ).toEqual(typography)
    expect(
      config.compute({
        selectedIds: new Set(['text', 'rect']),
        elements: [{ typography }, {}]
      })
    ).toBeNull()
  })
})
