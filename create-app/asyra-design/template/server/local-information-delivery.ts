import { createHash } from 'node:crypto'
import { LocalToolInputError } from './local-tool-invocation'

// Leave room for the canonical toolOutcome envelope below the native output budget.
export const informationDeliveryBytes = 23000
export const contentPageSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['revision', 'offset'],
  properties: {
    revision: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    offset: { type: 'integer', minimum: 0 }
  }
}
export const informationDeliverySchema = {
  type: 'object',
  required: ['contentDelivery'],
  additionalProperties: true,
  properties: {
    contentDelivery: {
      type: 'object',
      additionalProperties: false,
      required: [
        'kind',
        'revision',
        'startByte',
        'endByte',
        'totalBytes',
        'lastPage',
        'text',
        'next'
      ],
      properties: {
        kind: { const: 'json-fragment' },
        revision: { type: 'string' },
        startByte: { type: 'integer', minimum: 0 },
        endByte: { type: 'integer', minimum: 1 },
        totalBytes: { type: 'integer', minimum: 1 },
        lastPage: { type: 'boolean' },
        text: { type: 'string' },
        next: {
          anyOf: [
            { type: 'null' },
            {
              type: 'object',
              required: ['tool', 'arguments'],
              properties: {
                tool: { type: 'string' },
                arguments: { type: 'object' }
              }
            }
          ]
        }
      }
    }
  }
}

export const informationDeliveryInstructions =
  'Large replies return contentDelivery JSON fragments, not a complete contract. Call next.tool with next.arguments to continue. Read matching contiguous byte ranges through totalBytes before treating the contract as complete. A lastPage alone does not prove prior coverage. Each page is delivered directly as a tool result. Use the selectors published by this tool to avoid unnecessary full reads. On stale continuation restart the original read; never replay design writes.'

export const deliverInformation = (
  text: string,
  tool: string,
  args: Record<string, unknown>,
  requestId: string,
  receipt: Readonly<Record<string, unknown>> = {}
): string => {
  const { contentPage, rehydrate: _rehydrate, ...query } = args
  const bytes = Buffer.from(text, 'utf8')
  if (bytes.length <= informationDeliveryBytes) {
    if (contentPage !== undefined)
      throw new LocalToolInputError(
        'Content changed or no continuation exists; restart the original read.'
      )
    return text
  }
  const identity = JSON.stringify(
    Object.keys(query)
      .sort()
      .map((key) => [key, query[key]])
  )
  const revision = createHash('sha256')
    .update(requestId)
    .update('\0')
    .update(tool)
    .update('\0')
    .update(identity)
    .update('\0')
    .update(bytes)
    .digest('hex')
  let start = 0
  if (contentPage !== undefined) {
    const page = contentPage as { revision?: unknown; offset?: unknown }
    if (
      !page ||
      typeof page !== 'object' ||
      page.revision !== revision ||
      !Number.isSafeInteger(page.offset) ||
      Number(page.offset) < 0 ||
      Number(page.offset) >= bytes.length
    )
      throw new LocalToolInputError(
        'Invalid or stale content continuation; restart the original read.'
      )
    start = Number(page.offset)
    if ((bytes[start] & 0xc0) === 0x80)
      throw new LocalToolInputError('Content offset must be a UTF-8 boundary.')
  }
  const boundary = (end: number) => {
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80)
      end--
    return end
  }
  const encode = (end: number) =>
    JSON.stringify({
      ...receipt,
      contentDelivery: {
        kind: 'json-fragment',
        revision,
        startByte: start,
        endByte: end,
        totalBytes: bytes.length,
        lastPage: end === bytes.length,
        text: bytes.subarray(start, end).toString('utf8'),
        next:
          end === bytes.length
            ? null
            : {
                tool,
                arguments: { ...query, contentPage: { revision, offset: end } }
              }
      }
    })
  let low = start + 1,
    high = Math.min(bytes.length, start + informationDeliveryBytes),
    best = start
  while (low <= high) {
    const middle = Math.floor((low + high) / 2),
      end = boundary(middle)
    if (Buffer.byteLength(encode(end)) <= informationDeliveryBytes) {
      best = end
      low = middle + 1
    } else high = middle - 1
  }
  if (best <= start)
    throw new LocalToolInputError(
      'Selector metadata exceeds the delivery budget; narrow the read selector.'
    )
  return encode(best)
}
