import { describe, expect, it, vi } from 'vitest'
import type {
  CanonicalChange,
  SharedPublication
} from '../../collaboration/app-protocol-types'
import { createPublicationProcessor } from '../../collaboration/publication-processor'

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Missing fixture entry')
  return value
}

const change: CanonicalChange = {
  kind: 'property-components',
  updates: [{ propertyId: 'position-a', values: { x: 12 } }]
}
const publication = (canonical: boolean): SharedPublication => ({
  publicationId: 'publication-a',
  artifactId: 'artifact-a',
  transactionId: 1,
  origin: 'action',
  mode: 'atomic',
  slices: [
    {
      sliceId: 'slice-a',
      orderedIds: ['delivery-a'],
      batches: [
        {
          batchId: 'batch-a',
          channel: canonical ? 'document' : 'props',
          deliveries: [
            {
              deliveryId: 'delivery-a',
              orderedIds: ['delivery-a'],
              eventName: canonical ? 'applyCanonicalChanges' : 'updateProperty',
              payload: canonical
                ? { version: 1, changes: [change] }
                : {
                    action: 'updateProperty',
                    id: 'position-a',
                    key: 'x',
                    before: 0,
                    after: 12
                  }
            }
          ]
        }
      ]
    }
  ]
})
const processor = () => {
  const apply = vi.fn()
  return {
    apply,
    process: createPublicationProcessor({
      decideRemotePublication: (value) => value,
      applyRemoteCanonicalChangeSlices: apply
    })
  }
}

describe('explicit canonical document publication', () => {
  it('applies typed operations without reconstructing low-level channel evidence', () => {
    const { apply, process } = processor()
    expect(process(publication(true))).toBe(true)
    expect(apply).toHaveBeenCalledExactlyOnceWith({
      origin: 'action',
      slices: [[change]]
    })
  })

  it('rejects raw owner events at the receiving document boundary before mutation', () => {
    const { apply, process } = processor()
    expect(() => process(publication(false))).toThrow()
    expect(apply).not.toHaveBeenCalled()
  })

  it('preserves operations when transport batches are regrouped inside one semantic slice', () => {
    const input = publication(true)
    const first = required(required(input.slices[0]).batches[0])
    const second = {
      ...required(first.deliveries[0]),
      deliveryId: 'delivery-b',
      orderedIds: ['delivery-b']
    }
    const split = {
      ...input,
      slices: [
        {
          ...required(input.slices[0]),
          orderedIds: ['delivery-a', 'delivery-b'],
          batches: [
            first,
            { ...first, batchId: 'batch-b', deliveries: [second] }
          ]
        }
      ]
    }
    const joined = {
      ...split,
      slices: [
        {
          ...required(split.slices[0]),
          batches: [{ ...first, deliveries: [...first.deliveries, second] }]
        }
      ]
    }
    const a = processor(),
      b = processor()
    a.process(split)
    b.process(joined)
    expect(a.apply.mock.calls).toEqual(b.apply.mock.calls)
    expect(a.apply).toHaveBeenCalledExactlyOnceWith({
      origin: 'action',
      slices: [[change, change]]
    })
  })
})

it.each([
  { kind: 'unknown' },
  {
    kind: 'property-components',
    updates: [{ propertyId: 'a', values: { id: 'b' } }]
  },
  {
    kind: 'property-components',
    updates: [{ propertyId: 'a', values: { type: 'another' } }]
  },
  {
    kind: 'property-components',
    updates: [],
    records: [{ propertyId: 'a', key: 'id', remove: ['b'] }]
  },
  {
    kind: 'element-data',
    changes: [
      {
        id: 'a',
        action: 'updateElementData',
        eventName: 'updateElementData',
        changes: [{ key: 'parentId', before: 'a', after: 'b' }]
      }
    ]
  },
  {
    kind: 'hierarchy-moves',
    moves: [
      {
        elementId: 'a',
        before: { parentId: 'b', index: -1 },
        after: { parentId: 'c', index: 0 }
      }
    ]
  },
  { kind: 'element-creation', entries: [], properties: 'invalid' },
  {
    kind: 'subtree-restore',
    sceneSnapshot: {},
    propsSnapshot: { components: [] }
  },
  {
    kind: 'property-components',
    updates: [{ propertyId: 'a', values: { x: Infinity } }]
  }
])(
  'rejects malformed canonical data before any operation applies: %j',
  (invalidChange) => {
    const valid = publication(true)
    const first = required(required(valid.slices[0]).batches[0])
    const input = {
      ...valid,
      slices: [
        {
          ...required(valid.slices[0]),
          batches: [
            {
              ...first,
              deliveries: [
                {
                  ...required(first.deliveries[0]),
                  payload: { version: 1, changes: [change, invalidChange] }
                }
              ]
            }
          ]
        }
      ]
    }
    const { apply, process } = processor()
    expect(() => process(input)).toThrow()
    expect(apply).not.toHaveBeenCalled()
  }
)

it('preserves publication-level compensation without inventing owner delivery targets', () => {
  const { apply, process } = processor()
  expect(
    process({
      ...publication(true),
      origin: 'rollback-compensation',
      compensatesPublicationId: 'original-publication'
    })
  ).toBe(true)
  expect(apply).toHaveBeenCalledExactlyOnceWith({
    origin: 'rollback-compensation',
    slices: [[change]]
  })
})

it('accepts finite signed zero coordinates supported by the binary transport', () => {
  const input = publication(true)
  const slice = required(input.slices[0])
  const source = required(slice.batches[0])
  const delivery = required(source.deliveries[0])
  const { apply, process } = processor()
  process({
    ...input,
    slices: [
      {
        ...slice,
        batches: [
          {
            ...source,
            deliveries: [
              {
                ...delivery,
                payload: {
                  version: 1,
                  changes: [
                    {
                      kind: 'property-components',
                      updates: [{ propertyId: 'position-a', values: { x: -0 } }]
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  })
  expect(apply).toHaveBeenCalledExactlyOnceWith({
    origin: 'action',
    slices: [
      [
        {
          kind: 'property-components',
          updates: [{ propertyId: 'position-a', values: { x: -0 } }]
        }
      ]
    ]
  })
})

it('prepares element changes without transporting local execution options', async () => {
  const { prepareDocumentPublication, readDocumentPublicationSlices } =
    await import('../../collaboration/document-publication')
  const input = publication(false)
  const slice = required(input.slices[0])
  const source = required(slice.batches[0])
  const delivery = required(source.deliveries[0])
  const change = {
    action: 'updateElementData',
    eventName: 'updateElementData',
    id: 'element-a',
    changes: [{ key: 'visible', before: true, after: false }],
    options: { undoable: true }
  }
  const prepared = prepareDocumentPublication({
    ...input,
    slices: [
      {
        ...slice,
        batches: [
          {
            ...source,
            channel: 'sceneTree',
            deliveries: [
              { ...delivery, eventName: 'updateElementData', payload: change }
            ]
          }
        ]
      }
    ]
  })
  expect(readDocumentPublicationSlices(prepared)).toEqual([
    [
      {
        kind: 'element-data',
        changes: [
          {
            action: change.action,
            eventName: change.eventName,
            id: change.id,
            changes: change.changes
          }
        ]
      }
    ]
  ])
  expect(change.options).toEqual({ undoable: true })
})
