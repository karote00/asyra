import { describe, expect, it } from 'vitest'
import {
  ITEM_PROPERTY_TYPE,
  assertStarterDomainData,
  createItemPropertySchema,
  createStarterDocumentWrapper,
  parseStarterDocumentWrapper
} from '../item-domain.js'
import type { CoreRawData } from '@asyra/utils'

const coreDocument = (
  itemData: Record<string, unknown> = {
    id: 'property-1',
    type: ITEM_PROPERTY_TYPE,
    title: 'First item',
    status: 'todo'
  }
): CoreRawData =>
  ({
    version: '1.0.0',
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {}
    },
    props: {
      'property-1': itemData
    }
  }) as unknown as CoreRawData

describe('starter item domain admission', () => {
  it('shares title and status predicates with the runtime property schema', () => {
    const schema = createItemPropertySchema()
    const titleField = schema.fields.find((field) => field.key === 'title')
    const statusField = schema.fields.find((field) => field.key === 'status')

    expect(titleField?.validate?.('Readable title')).toBe(true)
    expect(titleField?.validate?.('')).toBe(false)
    expect(statusField?.validate?.('done')).toBe(true)
    expect(statusField?.validate?.('blocked')).toBe(false)
  })

  it('accepts a valid V1 wrapper round trip', () => {
    const wrapper = createStarterDocumentWrapper(
      coreDocument(),
      '2026-09-23T00:00:00.000Z'
    )

    expect(parseStarterDocumentWrapper(JSON.stringify(wrapper))).toEqual(
      wrapper
    )
  })

  it('rejects structurally present Item data with an invalid status', () => {
    expect(() =>
      assertStarterDomainData(
        coreDocument({
          id: 'property-1',
          type: ITEM_PROPERTY_TYPE,
          title: 'First item',
          status: 'blocked'
        })
      )
    ).toThrow('invalid status')
  })

  it('rejects structurally present Item data without title or status', () => {
    expect(() =>
      assertStarterDomainData(
        coreDocument({
          id: 'property-1',
          type: ITEM_PROPERTY_TYPE,
          status: 'todo'
        })
      )
    ).toThrow('valid title')
    expect(() =>
      assertStarterDomainData(
        coreDocument({
          id: 'property-1',
          type: ITEM_PROPERTY_TYPE,
          title: 'First item'
        })
      )
    ).toThrow('invalid status')
  })

  it('admits legacy missing offsets and rejects invalid present offsets', () => {
    expect(() => assertStarterDomainData(coreDocument())).not.toThrow()
    const schema = createItemPropertySchema()
    expect(
      schema.fields.find((field) => field.key === 'offsetX')?.validate?.(12)
    ).toBe(true)
    expect(
      schema.fields
        .find((field) => field.key === 'offsetY')
        ?.validate?.(Infinity)
    ).toBe(false)
    for (const invalid of [Infinity, '12', null]) {
      expect(() =>
        assertStarterDomainData(
          coreDocument({
            id: 'property-1',
            type: ITEM_PROPERTY_TYPE,
            title: 'First item',
            status: 'todo',
            offsetX: invalid,
            offsetY: 0
          })
        )
      ).toThrow('invalid position')
    }
  })
})
