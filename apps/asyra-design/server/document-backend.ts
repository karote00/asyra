import { DocumentPersistenceError } from './document-persistence-error'
import { DocumentPublicationValidationError } from '../src/collaboration/document-publication'
import { createAiExecutionProfiler } from '@asyra/ai-agent-runtime'
import { createExecutionRecordSink } from '@asyra/ai-agent-runtime/node'
import { Buffer } from 'node:buffer'
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import { resolve } from 'node:path'
import process from 'node:process'
import type { AddressInfo } from 'node:net'
import type { AppDocumentData } from '../src/collaboration/app-protocol-types'
import { applyCanonicalChangesToDocument } from './document-canonical-reducer'
import { createFileDocumentMaterializationStore } from './document-backend-store'
import { createDocumentMaterializationService } from './document-materializer'

const DOCUMENT_ENDPOINT_PREFIX = '/api/documents/'
const BOOTSTRAP_CHECKPOINT_SUFFIX = '/bootstrap-checkpoint'
const PERSISTENCE_BATCH_SUFFIX = '/persistence-batches'
const MAX_REQUEST_BYTES = 64 * 1024 * 1024

export interface DocumentBackendServerOptions {
  readonly dataDirectory: string
  readonly host?: string
  readonly port?: number
}

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void => {
  response.statusCode = statusCode
  response.setHeader('cache-control', 'no-store')
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of request) {
    const bytes = Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > MAX_REQUEST_BYTES) {
      throw new DocumentPersistenceError(
        'request-too-large',
        '[document-backend] request exceeds the byte limit'
      )
    }
    chunks.push(bytes)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (cause) {
    throw new DocumentPersistenceError(
      'invalid-request',
      'Invalid request JSON',
      { cause }
    )
  }
}

const parseDocumentRoute = (
  request: IncomingMessage
):
  | Readonly<{
      documentId: string
      operation: 'bootstrap-checkpoint' | 'persistence-batch' | 'reset'
    }>
  | undefined => {
  const url = new URL(request.url ?? '/', 'http://document-backend.local')
  if (!url.pathname.startsWith(DOCUMENT_ENDPOINT_PREFIX)) {
    return
  }
  const encoded = url.pathname.slice(DOCUMENT_ENDPOINT_PREFIX.length)
  let operation:
    'bootstrap-checkpoint' | 'persistence-batch' | 'reset' | undefined
  if (encoded.endsWith(BOOTSTRAP_CHECKPOINT_SUFFIX)) {
    operation = 'bootstrap-checkpoint'
  } else if (encoded.endsWith(PERSISTENCE_BATCH_SUFFIX)) {
    operation = 'persistence-batch'
  } else if (!encoded.includes('/')) {
    operation = 'reset'
  } else {
    return
  }
  let encodedDocumentId = encoded
  if (operation === 'bootstrap-checkpoint') {
    encodedDocumentId = encoded.slice(0, -BOOTSTRAP_CHECKPOINT_SUFFIX.length)
  } else if (operation === 'persistence-batch') {
    encodedDocumentId = encoded.slice(0, -PERSISTENCE_BATCH_SUFFIX.length)
  }
  if (!encodedDocumentId) {
    throw new Error('[document-backend] documentId is required')
  }
  return {
    documentId: decodeURIComponent(encodedDocumentId),
    operation
  }
}

export const createDocumentBackendServer = ({
  dataDirectory,
  host = '127.0.0.1',
  port = 4201
}: DocumentBackendServerOptions) => {
  const store = createFileDocumentMaterializationStore(dataDirectory)
  const materializer = createDocumentMaterializationService<AppDocumentData>({
    store,
    authorize: async () => undefined,
    applyCanonicalChanges: applyCanonicalChangesToDocument
  })
  const server = createServer((request, response) => {
    void (async () => {
      if (request.url === '/health' && request.method === 'GET') {
        sendJson(response, 200, { ok: true })
        return
      }
      const route = parseDocumentRoute(request)
      if (!route) {
        sendJson(response, 404, { error: 'Not found' })
        return
      }
      if (route.operation === 'reset') {
        if (request.method !== 'DELETE') {
          response.setHeader('allow', 'DELETE')
          sendJson(response, 405, { error: 'Method not allowed' })
          return
        }
        const documentGeneration = await store.resetCheckpoint(route.documentId)
        sendJson(response, 200, { ok: true, documentGeneration })
        return
      }
      if (route.operation === 'bootstrap-checkpoint') {
        if (request.method !== 'GET') {
          response.setHeader('allow', 'GET')
          sendJson(response, 405, { error: 'Method not allowed' })
          return
        }
        const record = await store.readCheckpoint(route.documentId)
        sendJson(response, 200, {
          checkpoint: record.document,
          durableSequence: record.durableSequence,
          documentGeneration: record.documentGeneration ?? 0
        })
        return
      }
      if (request.method !== 'POST') {
        response.setHeader('allow', 'POST')
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }
      const batch = await readJsonBody(request)
      if (
        typeof batch !== 'object' ||
        batch === null ||
        !('documentId' in batch) ||
        batch.documentId !== route.documentId
      ) {
        sendJson(response, 400, {
          error: 'Persistence batch document identity is invalid'
        })
        return
      }
      let recording: ReturnType<typeof createAiExecutionProfiler> | undefined
      let sink: ReturnType<typeof createExecutionRecordSink> | undefined
      try {
        sink = createExecutionRecordSink(
          process.env.AI_EXECUTION_RECORD_DIR?.trim() || 'tmp/ai-executions'
        )
        recording = createAiExecutionProfiler(
          {
            intent: 'Persist admitted document batch',
            context: {},
            actions: [],
            attempt: 1
          },
          'none',
          {
            sink,
            lifecycle: true,
            provider: 'document-backend',
            purpose: 'durable-batch',
            log: () => undefined
          }
        )
      } catch {
        /* Storage diagnostics must not affect the document. */
      }
      let spanSequence = 0
      try {
        const acknowledgement = await materializer.materialize(batch, {
          span: (stage) =>
            recording?.span({
              callId: `${stage}-${++spanSequence}`,
              owner: 'app',
              purpose: stage
            }) ?? (() => undefined),
          detail: (values) => recording?.trace('settlement', values)
        })
        sendJson(response, 200, acknowledgement)
        recording?.finish('completed')
      } catch (error) {
        recording?.finish('failed')
        throw error
      } finally {
        try {
          void sink?.flush().catch(() => undefined)
        } catch {
          /* Nonblocking diagnostic delivery. */
        }
      }
    })().catch((error: unknown) => {
      let status = 500
      let code = 'internal-error'
      if (error instanceof DocumentPersistenceError) {
        status = error.status
        code = error.code
      } else if (error instanceof DocumentPublicationValidationError) {
        status = 422
        code = 'invalid-operation'
      }
      sendJson(response, status, {
        code,
        error: error instanceof Error ? error.message : String(error)
      })
    })
  })

  return {
    listen: () =>
      new Promise<Readonly<{ host: string; port: number }>>(
        (resolveListen, rejectListen) => {
          server.once('error', rejectListen)
          server.listen(port, host, () => {
            server.off('error', rejectListen)
            const address = server.address() as AddressInfo
            resolveListen({ host: address.address, port: address.port })
          })
        }
      ),
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error)
          } else {
            resolveClose()
          }
        })
      })
  }
}

const isDirectExecution = process.argv[1]?.endsWith('document-backend.js')
if (isDirectExecution) {
  const dataDirectory = resolve(
    process.env.DOCUMENT_BACKEND_DATA_DIR?.trim() ||
      resolve(process.cwd(), '.app-data/documents')
  )
  const host = process.env.DOCUMENT_BACKEND_HOST?.trim() || '127.0.0.1'
  const port = Number(process.env.DOCUMENT_BACKEND_PORT?.trim() || '4201')
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('DOCUMENT_BACKEND_PORT must be a valid port')
  }
  const backend = createDocumentBackendServer({
    dataDirectory,
    host,
    port
  })
  const address = await backend.listen()
  console.log(
    `[document-backend] listening on http://${address.host}:${String(
      address.port
    )}`
  )
  const shutdown = (): void => {
    void backend.close().finally(() => process.exit(0))
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
