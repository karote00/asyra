import { createDocumentPersistenceQueue } from '../document-persistence-queue'
import { Buffer } from 'node:buffer'
import { beforeEach, expect, it, vi } from 'vitest'
import { createDocumentBackendServer } from '../document-backend'
import { createFormalInitialDocument } from '../../src/collaboration/initial-document'
import {
  CollaborationMessageTypes,
  decodePublicationFramePublication,
  encodePublicationMessageFrames
} from '../../src/collaboration/protocol'
import { prepareDocumentPublication } from '../../src/collaboration/document-publication'
import type { AppDocumentData } from '../../src/collaboration/app-protocol-types'
import type {
  DocumentMaterializationStore,
  MaterializedDocumentRecord
} from '../document-materializer'

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Missing fixture entry')
  return value
}

const store = vi.hoisted(() => ({ transact: vi.fn() }))
vi.mock('../document-backend-store', () => ({
  createFileDocumentMaterializationStore: () => store
}))
let record: MaterializedDocumentRecord<AppDocumentData>
const committed = vi.fn()
beforeEach(() => {
  committed.mockClear()
  record = {
    document: createFormalInitialDocument(),
    durableSequence: 0,
    publicationSequences: {},
    batches: {}
  }
  record.document.props['position-a'] = {
    id: 'position-a',
    type: 'position',
    x: 0,
    y: 0
  }
  store.transact.mockImplementation(
    async (
      _id,
      execute: Parameters<
        DocumentMaterializationStore<AppDocumentData>['transact']
      >[1]
    ) =>
      execute(record, (next) => {
        committed()
        record = next
      })
  )
})
const batch = () => {
  const publication = prepareDocumentPublication({
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
            channel: 'props',
            deliveries: [
              {
                deliveryId: 'delivery-a',
                eventName: 'updateProperty',
                orderedIds: ['delivery-a'],
                payload: {
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
  return {
    protocolVersion: 1,
    documentId: 'document-a',
    batchId: 'batch-a',
    expectedDurableSequence: 0,
    firstSequence: 1,
    lastSequence: 1,
    entries: [
      {
        documentId: 'document-a',
        sequence: 1,
        publicationId: publication.publicationId,
        encodedPublicationFrames: encodePublicationMessageFrames({
          type: CollaborationMessageTypes.SEND_PUBLICATION,
          requestId: 'request-a',
          publication
        }).map((frame) => Buffer.from(frame).toString('base64'))
      }
    ]
  }
}
const request = async (body: unknown) => {
  const server = createDocumentBackendServer({
    dataDirectory: 'server/__tests__/.unused-memory-store',
    port: 0
  })
  const { host, port } = await server.listen()
  try {
    const response = await fetch(
      `http://${host}:${port}/api/documents/document-a/persistence-batches`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      }
    )
    return { status: response.status, body: await response.json() }
  } finally {
    await server.close()
  }
}
it('reports an invalid persistence request as 400 without opening storage', async () => {
  store.transact.mockClear()
  expect((await request({ documentId: 'document-a' })).status).toBe(400)
  expect(store.transact).not.toHaveBeenCalled()
})
it('reserves 409 for a genuine durable sequence conflict', async () => {
  record = { ...record, durableSequence: 5 }
  expect((await request(batch())).status).toBe(409)
  expect(committed).not.toHaveBeenCalled()
})
it('reports canonical reference rejection as 422 without advancing the checkpoint', async () => {
  delete record.document.props['position-a']
  expect((await request(batch())).status).toBe(422)
  expect(record.durableSequence).toBe(0)
  expect(committed).not.toHaveBeenCalled()
})
it('reports storage failure as 500 rather than a document conflict', async () => {
  store.transact.mockRejectedValueOnce(new Error('disk unavailable'))
  expect((await request(batch())).status).toBe(500)
  expect(committed).not.toHaveBeenCalled()
})
it('acknowledges an exact HTTP retry without committing the operation twice', async () => {
  const input = batch()
  expect((await request(input)).status).toBe(200)
  expect((await request(input)).status).toBe(200)
  expect(committed).toHaveBeenCalledOnce()
  expect(record.document.props['position-a']).toMatchObject({ x: 12 })
})

it('rejects changed operation content reusing a durable publication identity', async () => {
  const first = batch()
  expect((await request(first)).status).toBe(200)
  const decoded = decodePublicationFramePublication(
    required(first.entries[0]).encodedPublicationFrames.map(
      (frame) => new Uint8Array(Buffer.from(frame, 'base64'))
    )
  )
  const changed = structuredClone(decoded.publication)
  const payload = required(
    required(required(changed.slices[0]).batches[0]).deliveries[0]
  ).payload as {
    changes: { updates: { values: { x: number } }[] }[]
  }
  required(required(payload.changes[0]).updates[0]).values.x = 99
  const encodedPublicationFrames = encodePublicationMessageFrames({
    type: CollaborationMessageTypes.SEND_PUBLICATION,
    requestId: 'different-request',
    publication: changed
  }).map((frame) => Buffer.from(frame).toString('base64'))
  expect(
    (
      await request({
        ...first,
        entries: [{ ...required(first.entries[0]), encodedPublicationFrames }]
      })
    ).status
  ).toBe(409)
  expect(record.document.props['position-a']).toMatchObject({ x: 12 })
  expect(committed).toHaveBeenCalledOnce()
})

const rewritePublication = (
  input: ReturnType<typeof batch>,
  transform: (
    publication: import('../../src/collaboration/app-protocol-types').SharedPublication
  ) => import('../../src/collaboration/app-protocol-types').SharedPublication
) => {
  const entry = required(input.entries[0])
  const decoded = decodePublicationFramePublication(
    entry.encodedPublicationFrames.map(
      (frame) => new Uint8Array(Buffer.from(frame, 'base64'))
    )
  )
  const publication = transform(decoded.publication)
  return {
    ...input,
    entries: [
      {
        ...entry,
        publicationId: publication.publicationId,
        encodedPublicationFrames: encodePublicationMessageFrames({
          type: CollaborationMessageTypes.SEND_PUBLICATION,
          requestId: 'new-transport-request',
          publication
        }).map((frame) => Buffer.from(frame).toString('base64'))
      }
    ]
  }
}

it('acknowledges identical operations regrouped into different transport batches', async () => {
  const initial = rewritePublication(batch(), (publication) => {
    const slice = required(publication.slices[0])
    const source = required(slice.batches[0])
    const delivery = required(source.deliveries[0])
    return {
      ...publication,
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
                        updates: [
                          { propertyId: 'position-a', values: { x: 12 } }
                        ]
                      },
                      {
                        kind: 'property-components',
                        updates: [
                          { propertyId: 'position-a', values: { y: 24 } }
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  })
  expect((await request(initial)).status).toBe(200)
  const regrouped = rewritePublication(initial, (publication) => {
    const slice = required(publication.slices[0])
    const delivery = required(required(slice.batches[0]).deliveries[0])
    const payload = delivery.payload as { changes: unknown[] }
    return {
      ...publication,
      slices: [
        {
          ...slice,
          orderedIds: ['first', 'second'],
          batches: payload.changes.map((change, index) => {
            const id = index === 0 ? 'first' : 'second'
            return {
              batchId: id,
              channel: 'document',
              deliveries: [
                {
                  deliveryId: id,
                  orderedIds: [id],
                  eventName: 'applyCanonicalChanges',
                  payload: { version: 1, changes: [change] }
                }
              ]
            }
          })
        }
      ]
    }
  })
  expect(
    (await request({ ...regrouped, batchId: 'regrouped-batch' })).status
  ).toBe(200)
  expect(committed).toHaveBeenCalledOnce()
  expect(record.document.props['position-a']).toMatchObject({ x: 12, y: 24 })
})

it('does not acknowledge a retry when its saved content identity is missing', async () => {
  const input = batch()
  expect((await request(input)).status).toBe(200)
  const { publicationDigests: _discarded, ...checkpoint } = record
  record = checkpoint
  expect((await request(input)).status).toBe(409)
  expect(committed).toHaveBeenCalledOnce()
})

it('commits neither publication when a later operation in the persistence request fails', async () => {
  const first = batch()
  const second = rewritePublication(batch(), (publication) => ({
    ...publication,
    publicationId: 'publication-b',
    slices: publication.slices.map((slice) => ({
      ...slice,
      batches: slice.batches.map((source) => ({
        ...source,
        deliveries: source.deliveries.map((delivery) => ({
          ...delivery,
          payload: {
            version: 1,
            changes: [
              {
                kind: 'property-components',
                updates: [{ propertyId: 'missing', values: { x: 99 } }]
              }
            ]
          }
        }))
      }))
    }))
  }))
  const response = await request({
    ...first,
    lastSequence: 2,
    entries: [
      required(first.entries[0]),
      { ...required(second.entries[0]), sequence: 2 }
    ]
  })
  expect(response.status).toBe(422)
  expect(record.durableSequence).toBe(0)
  expect(record.document.props['position-a']).toMatchObject({ x: 0 })
  expect(committed).not.toHaveBeenCalled()
  expect((await request(first)).status).toBe(200)
})

it('persists an explicit compensation and acknowledges its retry without reapplying', async () => {
  expect((await request(batch())).status).toBe(200)
  const compensation = rewritePublication(batch(), (publication) => ({
    ...publication,
    publicationId: 'compensation-a',
    origin: 'rollback-compensation',
    compensatesPublicationId: publication.publicationId,
    slices: publication.slices.map((slice) => ({
      ...slice,
      batches: slice.batches.map((source) => ({
        ...source,
        deliveries: source.deliveries.map((delivery) => ({
          ...delivery,
          payload: {
            version: 1,
            changes: [
              {
                kind: 'property-components',
                updates: [{ propertyId: 'position-a', values: { x: 0 } }]
              }
            ]
          }
        }))
      }))
    }))
  }))
  const input = {
    ...compensation,
    batchId: 'compensation-batch',
    expectedDurableSequence: 1,
    firstSequence: 2,
    lastSequence: 2,
    entries: [{ ...required(compensation.entries[0]), sequence: 2 }]
  }
  expect((await request(input)).status).toBe(200)
  expect((await request(input)).status).toBe(200)
  expect(record.document.props['position-a']).toMatchObject({ x: 0 })
  expect(committed).toHaveBeenCalledTimes(2)
})

it('retries an unchanged request after storage failure and then records exact retry identity', async () => {
  const input = batch()
  store.transact.mockRejectedValueOnce(new Error('disk unavailable'))
  expect((await request(input)).status).toBe(500)
  expect(record.durableSequence).toBe(0)
  expect((await request(input)).status).toBe(200)
  expect((await request(input)).status).toBe(200)
  expect(committed).toHaveBeenCalledOnce()
})

it('acknowledges the retried batch boundary even after later publications become durable', async () => {
  const first = batch()
  expect((await request(first)).status).toBe(200)
  const later = rewritePublication(batch(), (publication) => ({
    ...publication,
    publicationId: 'later-publication'
  }))
  expect(
    (
      await request({
        ...later,
        batchId: 'later-batch',
        expectedDurableSequence: 1,
        firstSequence: 2,
        lastSequence: 2,
        entries: [{ ...required(later.entries[0]), sequence: 2 }]
      })
    ).status
  ).toBe(200)
  const retried = await request(first)
  expect(retried.status).toBe(200)
  expect(retried.body.durableSequence).toBe(1)
  expect(record.durableSequence).toBe(2)
  const queue = createDocumentPersistenceQueue({
    documentId: 'document-a',
    initialDurableSequence: 0,
    sendBatch: async (input) => {
      const response = await request(input)
      if (response.status !== 200)
        throw new Error(JSON.stringify(response.body))
      return response.body
    }
  })
  try {
    queue.enqueue({
      ...required(first.entries[0]),
      byteLength: required(first.entries[0]).encodedPublicationFrames.reduce(
        (sum, frame) => sum + Buffer.from(frame, 'base64').byteLength,
        0
      )
    })
    await queue.flushNow()
    expect(queue.getState()).toMatchObject({
      durableSequence: 1,
      editable: true,
      pendingCount: 0
    })
    queue.enqueue({
      ...required(later.entries[0]),
      sequence: 2,
      byteLength: required(later.entries[0]).encodedPublicationFrames.reduce(
        (sum, frame) => sum + Buffer.from(frame, 'base64').byteLength,
        0
      )
    })
    await queue.flushNow()
    expect(queue.getState()).toMatchObject({
      durableSequence: 2,
      editable: true,
      pendingCount: 0
    })
  } finally {
    queue.dispose()
  }
  expect(committed).toHaveBeenCalledTimes(2)
})
