import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { expect } from '@playwright/test'
import { createTestDocumentIdentity } from './test-utils'

export async function prepareLargeNavigationDocument(
  baseURL: string | undefined
) {
  if (!baseURL || !process.env.E2E_DOCUMENT_BACKEND_URL)
    throw new Error('Isolated test URLs required')
  expect(new URL(baseURL).port).not.toBe('3000')
  const backend = new URL(process.env.E2E_DOCUMENT_BACKEND_URL)
  expect(backend.port).not.toBe('4201')
  const fixtureRoot = resolve('e2e/fixtures/large-document')
  const manifest = JSON.parse(
    await readFile(resolve(fixtureRoot, 'manifest.json'), 'utf8')
  )
  const bytes = gunzipSync(
    await readFile(resolve(fixtureRoot, 'document.json.gz'))
  )
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.sha256)
  const document = JSON.parse(bytes.toString('utf8'))
  const identity = createTestDocumentIdentity()
  const storage = resolve('test-results/document-backend')
  await mkdir(storage, { recursive: true })
  await writeFile(
    resolve(
      storage,
      `${Buffer.from(identity.fileId).toString('base64url')}.json`
    ),
    JSON.stringify({
      protocolVersion: 1,
      documentId: identity.fileId,
      record: {
        document,
        documentGeneration: 0,
        durableSequence: 0,
        publicationSequences: {},
        batches: {}
      }
    })
  )

  return { identity, manifest }
}
