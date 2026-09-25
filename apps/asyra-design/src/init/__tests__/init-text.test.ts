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
      definePropertyComponent: vi.fn(),
      defineComponent: vi.fn(),
      registerRenderStrategy: vi.fn(),
      defineUIProperty: vi.fn()
    }
    initText(core as never)
    expect(core.defineComponent).toHaveBeenCalledWith(
      expect.objectContaining({ type: TEXT_COMPONENT_TYPE })
    )
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
