import { Buffer } from 'node:buffer'
import { AiImageToolIds } from './ai-domain-prompt'
import type { AiProviderInput } from '../src/ai/action-batch-protocol'

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
  const definitions = compatible
    ? [
        {
          type: 'function',
          name: AiImageToolIds.VTRACER,
          description:
            'Vectorize one submitted PNG/JPEG attachment into exact editable SVG polygon paths. Use its zero-based attachmentIndex. The App cannot create or insert raster images. Preserve the returned paths when constructing vector descriptors.',
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
      const svg = await convert({
        bytes,
        contentType: String(attachment.mediaType),
        profile: 'photo-faithful',
        signal
      })
      if (signal.aborted || Buffer.byteLength(svg) > 8 * 1024 * 1024)
        throw new Error('Image tool unavailable')
      return svg
    }
  }
}
