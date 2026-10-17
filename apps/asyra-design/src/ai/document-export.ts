import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { AiActionExecutionError } from '@asyra/ai-agent-runtime'
import core from '../contexts'
import { AiActionNames } from '../constants'
import { observeDesignChanges } from '../common-apis/design-review'
import { getActiveCollaborationHandle } from '../collaboration/lifecycle'
import { toolResultObject, actionToolSemantics } from './tool-contract'

// Separate output-artifact budget; this never enlarges the HTTP receipt limit.
const exportByteBudget = 256 * 1024 * 1024
interface ExportSource {
  save(): Promise<unknown>
  identity(): unknown
  documentId(): string | null
  workspaceId(): string | null
  observe(listener: () => void): () => void
}
interface ExportDelivery {
  create(blob: Blob): string
  release(url: string): void
  download(url: string, filename: string): void
  digest(bytes: Uint8Array): Promise<string>
}
const source: ExportSource = {
  save: () => core.save(),
  identity: getActiveCollaborationHandle,
  documentId: () => getActiveCollaborationHandle()?.identity.documentId ?? null,
  workspaceId: () => core.getCurrentWorkspaceId() ?? null,
  observe: observeDesignChanges
}
const delivery: ExportDelivery = {
  create: (blob) => URL.createObjectURL(blob),
  release: (url) => URL.revokeObjectURL(url),
  download: (url, filename) => {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
  },
  digest: async (bytes) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
}
const metadataSchema = toolResultObject({
  artifactId: { type: 'string', minLength: 1 },
  documentId: { type: ['string', 'null'] },
  workspaceId: { type: ['string', 'null'] },
  revision: { type: 'integer', minimum: 0 },
  filename: { type: 'string' },
  format: { const: 'application/json' },
  bytes: { type: 'integer', minimum: 0 },
  sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
  available: { const: true }
})
const artifactInput = {
  type: 'object',
  additionalProperties: false,
  required: ['artifactId'],
  properties: { artifactId: { type: 'string', minLength: 1, maxLength: 160 } }
}

/** Immutable output owned by the browser runtime, never by a model request. */
export const createDocumentExport = (
  apis: ExportSource = source,
  output: ExportDelivery = delivery,
  maximumBytes = exportByteBudget
) => {
  interface Metadata {
    artifactId: string
    documentId: string | null
    workspaceId: string | null
    revision: number
    filename: string
    format: 'application/json'
    bytes: number
    sha256: string
    available: true
  }
  const artifacts = new Map<string, { url: string; metadata: Metadata }>()
  let retainedBytes = 0
  let revision = 0
  let busy = false
  let disposed = false
  let unsubscribe: (() => void) | undefined
  const assertOpen = (signal: AbortSignal) => {
    signal.throwIfAborted()
    if (disposed)
      throw new AiActionExecutionError('The export owner is disposed.')
  }
  const find = (id: string) => {
    const artifact = artifacts.get(id)
    if (!artifact)
      throw new AiActionExecutionError(
        'The document export is unavailable. Create a new export explicitly if needed.'
      )
    return artifact
  }
  const actions: AiActionDefinition[] = [
    {
      ...actionToolSemantics(
        AiActionNames.EXPORT_DOCUMENT,
        toolResultObject({
          status: { const: 'no-change' },
          artifact: metadataSchema
        })
      ),
      composition: 'control-plane',
      name: AiActionNames.EXPORT_DOCUMENT,
      description:
        'Create an immutable downloadable document export. This does not confirm document persistence. Then call download_document_export with artifact.artifactId. Release it when no longer needed. Full JSON is never returned to the model; request completion does not release the export.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      },
      execute: async (_input, context) => {
        assertOpen(context.signal)
        if (busy)
          throw new AiActionExecutionError(
            'A document export is already being prepared. No second snapshot was started.'
          )
        unsubscribe ??= apis.observe(() => {
          revision++
        })
        busy = true
        const captured = {
          identity: apis.identity(),
          documentId: apis.documentId(),
          workspaceId: apis.workspaceId(),
          revision
        }
        try {
          const snapshot = await apis.save()
          assertOpen(context.signal)
          const bytes = new TextEncoder().encode(JSON.stringify(snapshot))
          if (bytes.byteLength > maximumBytes - retainedBytes)
            throw new AiActionExecutionError(
              'Document export capacity is unavailable. Release retained exports before explicitly retrying. Existing exports remain available.'
            )
          const sha256 = await output.digest(bytes)
          assertOpen(context.signal)
          if (
            captured.identity !== apis.identity() ||
            captured.revision !== revision ||
            captured.documentId !== apis.documentId() ||
            captured.workspaceId !== apis.workspaceId()
          )
            throw new AiActionExecutionError(
              'The document changed during export. No artifact was published; explicitly request a new snapshot.'
            )
          const artifactId = crypto.randomUUID()
          const metadata: Metadata = Object.freeze({
            artifactId,
            documentId: captured.documentId,
            workspaceId: captured.workspaceId,
            revision: captured.revision,
            filename: `document-${artifactId}.json`,
            format: 'application/json',
            bytes: bytes.byteLength,
            sha256,
            available: true
          })
          const url = output.create(
            new Blob([bytes], { type: metadata.format })
          )
          artifacts.set(artifactId, { url, metadata })
          retainedBytes += bytes.byteLength
          return { status: 'no-change', artifact: metadata }
        } finally {
          busy = false
        }
      }
    },
    {
      ...actionToolSemantics(
        AiActionNames.DOWNLOAD_DOCUMENT_EXPORT,
        toolResultObject({
          status: { const: 'no-change' },
          artifact: metadataSchema,
          delivery: { const: 'download-requested' }
        })
      ),
      composition: 'control-plane',
      name: AiActionNames.DOWNLOAD_DOCUMENT_EXPORT,
      description:
        'Request a browser download of the exact retained document export. Does not serialize again or confirm a disk write. The immutable artifact remains available for explicit retry or release.',
      inputSchema: artifactInput,
      execute: async (input, context) => {
        assertOpen(context.signal)
        const artifact = find((input as { artifactId: string }).artifactId)
        output.download(artifact.url, artifact.metadata.filename)
        return {
          status: 'no-change',
          artifact: artifact.metadata,
          delivery: 'download-requested'
        }
      }
    },
    {
      ...actionToolSemantics(
        AiActionNames.RELEASE_DOCUMENT_EXPORT,
        toolResultObject({
          status: { const: 'no-change' },
          released: { type: 'boolean' }
        })
      ),
      composition: 'control-plane',
      name: AiActionNames.RELEASE_DOCUMENT_EXPORT,
      description:
        'Release an immutable browser document export after download or abandonment. Already released IDs are harmless; they never re-export current document data.',
      inputSchema: artifactInput,
      execute: async (input, context) => {
        assertOpen(context.signal)
        const id = (input as { artifactId: string }).artifactId
        const artifact = artifacts.get(id)
        if (!artifact) return { status: 'no-change', released: false }
        output.release(artifact.url)
        artifacts.delete(id)
        retainedBytes -= artifact.metadata.bytes
        return { status: 'no-change', released: true }
      }
    }
  ]
  return {
    actions,
    dispose() {
      disposed = true
      const failures: unknown[] = []
      try {
        unsubscribe?.()
        unsubscribe = undefined
      } catch (error) {
        failures.push(error)
      }
      for (const [id, artifact] of artifacts) {
        try {
          output.release(artifact.url)
          artifacts.delete(id)
          retainedBytes -= artifact.metadata.bytes
        } catch (error) {
          failures.push(error)
        }
      }
      if (failures.length)
        throw new AggregateError(failures, 'Document export release failed')
    }
  }
}
