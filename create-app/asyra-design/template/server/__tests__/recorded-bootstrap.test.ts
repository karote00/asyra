import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import {
  encodeCollaborationControlMessage,
  decodeCollaborationControlMessage,
  parseCollaborationServerMessage
} from '../../src/collaboration/protocol'

it.skipIf(process.env.E2E_LARGE_DOCUMENT !== 'true')(
  'measures exact saved checkpoint bootstrap encoding and decoding',
  () => {
    const started = performance.now()
    const raw = gunzipSync(
      readFileSync(resolve('e2e/fixtures/recorded-101/document.fixture.gz'))
    )
    const document = JSON.parse(raw.toString())
    const readAt = performance.now()
    const message = {
      type: 'ready',
      bootstrap: {
        checkpoint: document,
        documentGeneration: 0,
        durableSequence: 0,
        headSequence: 0,
        pendingTail: []
      }
    }
    const encoded = encodeCollaborationControlMessage(message)
    const encodedAt = performance.now()
    const decoded = decodeCollaborationControlMessage(encoded)
    const decodedAt = performance.now()
    const parsed = parseCollaborationServerMessage(decoded)
    expect(parsed?.type).toBe('ready')
    if (parsed?.type !== 'ready') throw new Error('Missing parsed bootstrap')
    expect(
      createHash('sha256')
        .update(JSON.stringify(parsed.bootstrap.checkpoint))
        .digest('hex')
    ).toBe(createHash('sha256').update(JSON.stringify(document)).digest('hex'))
    expect(parsed.bootstrap).toMatchObject({
      documentGeneration: 0,
      durableSequence: 0,
      headSequence: 0,
      pendingTail: []
    })
    console.info(
      JSON.stringify({
        readMs: readAt - started,
        encodeMs: encodedAt - readAt,
        decodeMs: decodedAt - encodedAt,
        bytes: Buffer.byteLength(encoded)
      })
    )
  },
  30000
)
