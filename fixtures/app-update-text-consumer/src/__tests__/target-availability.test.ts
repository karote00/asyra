import { describe, expect, it } from 'vitest'
import core from '@asyra/core'
import {
  TEXT_COMPONENT_DEFINITION,
  TEXT_COMPONENT_TYPE,
  TEXT_PROPERTY_DEFINITION,
  TEXT_PROPERTY_SCHEMA,
  TEXT_PROPERTY_TYPE,
  TEXT_RENDER_STRATEGY
} from '@asyra/preset'

describe('installed Text target', () => {
  it('exposes the public definitions and composition APIs required by the guide', () => {
    expect(TEXT_COMPONENT_TYPE).toBe('text')
    expect(TEXT_COMPONENT_DEFINITION.type).toBe(TEXT_COMPONENT_TYPE)
    expect(TEXT_PROPERTY_TYPE).toBe('typography')
    expect(TEXT_PROPERTY_DEFINITION.type).toBe(TEXT_PROPERTY_TYPE)
    expect(TEXT_PROPERTY_SCHEMA.fields.map((field) => field.key)).toContain(
      'lineHeight'
    )
    expect(TEXT_PROPERTY_SCHEMA.fields).toHaveLength(9)
    expect(TEXT_RENDER_STRATEGY).toBeTypeOf('function')
    for (const api of [
      core.getPropertyTypeDefinition,
      core.redefinePropertyType,
      core.getComponentPropertyRelations,
      core.removeComponentPropertyRelation,
      core.defineComponentPropertyRelation,
      core.registerLoadHook
    ]) {
      expect(api).toBeTypeOf('function')
    }
  })
})
