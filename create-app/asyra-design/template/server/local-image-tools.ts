import { Buffer } from 'node:buffer'
import { AiImageToolIds } from './ai-domain-prompt'
import type { AiProviderInput } from '../src/ai/action-batch-protocol'
import { AiActionNames } from '../src/constants/ai-actions'
import {
  LOCAL_VECTOR_REFERENCE_SCHEMA,
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact,
  vectorArtifactSummary,
  type LocalVectorArtifact
} from './local-vector-artifact'

interface ConversionInput {
  readonly bytes: Uint8Array
  readonly contentType: string
  readonly profile: 'photo-faithful'
  readonly signal: AbortSignal
}
const convertImage = async (input: ConversionInput): Promise<string> => {
  const { convertVTracerBuffer } = await import('../vtracer-tool-server.mjs')
  return convertVTracerBuffer(input)
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const createLocalImageTools = (
  input: Pick<AiProviderInput, 'metadata'>,
  convert: (input: ConversionInput) => Promise<string> = convertImage
) => {
  const metadata = input.metadata
  const attachments =
    isRecord(metadata) && Array.isArray(metadata.imageAttachments)
      ? metadata.imageAttachments
      : []
  const compatible = attachments.some(
    (attachment) =>
      isRecord(attachment) &&
      ['image/png', 'image/jpeg'].includes(String(attachment.mediaType))
  )
  const artifacts = new Map<string, LocalVectorArtifact>()
  const converted = new Map<number, string>()
  const definitions = compatible
    ? [
        {
          type: 'function',
          name: AiImageToolIds.VTRACER,
          description:
            'Vectorize one submitted PNG/JPEG attachment. Returns an imageArtifactId and path IDs with source-pixel bounds, colors, point counts and subpath counts. Use the reference in an insert/replace action with target bounds and optional excludePathIds and componentMappings from the returned componentTargets catalog. Review all shapes for supported App component representations before drawing. The server creates all editable coordinates. Do not request code execution, SVG parsing or raster editing to use this result. Separate marks can be omitted by their path IDs.',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: { attachmentIndex: { type: 'integer', minimum: 0 } },
            required: ['attachmentIndex']
          }
        }
      ]
    : []
  return {
    definitions,
    modelActions: (actions: AiProviderInput['actions']) =>
      actions.map((action) => {
        if (!compatible) return action
        if (action.name === AiActionNames.INSERT_VECTOR_COMPOSITION)
          return {
            ...action,
            description:
              'Insert the VTracer imageArtifactId at target bounds, optionally omitting whole path IDs or mapping selected whole single-contour paths to supported native components using componentMappings. Backend constructs the editable drawing.',
            inputSchema: LOCAL_VECTOR_REFERENCE_SCHEMA
          }
        if (action.name === AiActionNames.REPLACE_VECTOR_COMPOSITION)
          return {
            ...action,
            description:
              'Replace the revalidated compositionId with a VTracer drawing reference. Backend constructs editable geometry atomically.',
            inputSchema: {
              type: 'object',
              additionalProperties: false,
              required: ['compositionId', 'drawing'],
              properties: {
                compositionId: { type: 'string' },
                drawing: LOCAL_VECTOR_REFERENCE_SCHEMA
              }
            }
          }
        return action
      }),
    resolveBatch: (value: unknown) => {
      if (!isRecord(value) || !Array.isArray(value.actions))
        throw new Error('Invalid action batch')
      return {
        ...value,
        actions: value.actions.map((action: unknown) => {
          if (!isRecord(action)) throw new Error('Invalid action')
          const replacing =
            action.name === AiActionNames.REPLACE_VECTOR_COMPOSITION
          if (
            !compatible ||
            (!replacing &&
              action.name !== AiActionNames.INSERT_VECTOR_COMPOSITION)
          )
            return action
          const args = action.arguments
          if (!isRecord(args)) throw new Error('Invalid image reference')
          const reference = replacing ? args.drawing : args
          if (
            !isRecord(reference) ||
            typeof reference.imageArtifactId !== 'string'
          )
            throw new Error('Missing image reference')
          const artifact = artifacts.get(reference.imageArtifactId)
          if (!artifact) throw new Error('Unknown image reference')
          if (
            replacing &&
            (typeof args.compositionId !== 'string' ||
              !args.compositionId ||
              Object.keys(args).some(
                (key) => !['compositionId', 'drawing'].includes(key)
              ))
          )
            throw new Error('Invalid replacement')
          const drawing = prepareLocalVectorArtifact(artifact, reference)
          return {
            ...action,
            arguments: replacing
              ? { compositionId: args.compositionId, drawing }
              : drawing
          }
        })
      }
    },
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Image tool cancelled')
      if (
        name !== AiImageToolIds.VTRACER ||
        !isRecord(args) ||
        Object.keys(args).length !== 1 ||
        !Number.isSafeInteger(args.attachmentIndex)
      )
        throw new Error('Invalid image tool request')
      const attachment = attachments[args.attachmentIndex as number]
      if (
        !isRecord(attachment) ||
        typeof attachment.dataUrl !== 'string' ||
        !['image/png', 'image/jpeg'].includes(String(attachment.mediaType))
      )
        throw new Error('Unavailable attachment')
      const prefix = `data:${attachment.mediaType};base64,`
      const encoded = attachment.dataUrl.slice(prefix.length)
      if (
        !attachment.dataUrl.startsWith(prefix) ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
      )
        throw new Error('Invalid attachment')
      const bytes = Buffer.from(encoded, 'base64')
      if (
        bytes.length === 0 ||
        bytes.length > 16 * 1024 * 1024 ||
        bytes.length !== attachment.size ||
        bytes.toString('base64') !== encoded
      )
        throw new Error('Invalid attachment')
      const previous = converted.get(args.attachmentIndex as number)
      if (previous) return previous
      const svg = await convert({
        bytes,
        contentType: String(attachment.mediaType),
        profile: 'photo-faithful',
        signal
      })
      if (signal.aborted || Buffer.byteLength(svg) > 8 * 1024 * 1024)
        throw new Error('Image tool unavailable')
      const artifact = parseLocalVectorArtifact(svg)
      const summary = JSON.stringify(vectorArtifactSummary(artifact))
      artifacts.set(artifact.imageArtifactId, artifact)
      converted.set(args.attachmentIndex as number, summary)
      return summary
    }
  }
}
