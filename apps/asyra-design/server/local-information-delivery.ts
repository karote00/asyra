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
  'Large replies return contentDelivery JSON fragments, not a complete contract. Follow next with this same tool; combine matching byte ranges and verify totalBytes before parsing the complete JSON. A lastPage alone does not prove prior coverage. Print one page per Code Mode output; retain assembled data rather than printing all pages together. Use the selectors published by this tool to avoid unnecessary full reads. On stale continuation restart the original read; never replay design writes.'

// Published verbatim; native tests execute the delivered source, not a test copy.
// Include the canonical toolOutcome envelope within the existing 24 KB reply bound.
export const informationDeliveryExample = `(() => {
  const bytes = value => encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, "x").length;
  if (typeof deliveryKey !== "string" || !deliveryKey || typeof result !== "string" || bytes(result) > ${informationDeliveryBytes + 1000}) throw new Error("Use one bounded informational reply and a query-specific key.");
  const receipt = JSON.parse(result);
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) throw new Error("Expected an informational object.");
  if (receipt.toolOutcome && receipt.toolOutcome.status !== "success" && !receipt.contentDelivery) { text(result); return; }
  const previous = load(deliveryKey);
  const page = receipt.contentDelivery;
  if (!page) {
    if (previous && !previous.pages.includes(result)) throw new Error("Changed content requires a fresh key and ordinary read/refresh.");
    if (!previous) store(deliveryKey, { complete: true, pages: [result], value: receipt, next: null });
    text(result); return;
  }
  if (page.kind !== "json-fragment" || !/^[a-f0-9]{64}$/.test(page.revision) || ![page.startByte, page.endByte, page.totalBytes].every(Number.isSafeInteger) || page.startByte < 0 || page.endByte <= page.startByte || page.endByte > page.totalBytes || typeof page.text !== "string" || bytes(page.text) !== page.endByte - page.startByte || page.lastPage !== (page.endByte === page.totalBytes)) throw new Error("Invalid information fragment; retain prior state and correct the read.");
  if (page.lastPage ? page.next !== null : !page.next || typeof page.next.tool !== "string" || page.next.arguments?.contentPage?.revision !== page.revision || page.next.arguments?.contentPage?.offset !== page.endByte) throw new Error("Invalid information continuation.");
  if (previous && (previous.revision !== page.revision || previous.totalBytes !== page.totalBytes)) throw new Error("Mixed content requires a fresh key and ordinary read/refresh.");
  if (previous?.pages.includes(result)) { text(result); return; }
  if (page.startByte !== (previous?.endByte ?? 0)) throw new Error("Missing information page; follow the retained next read or refresh after context loss.");
  const pages = [...(previous?.pages ?? []), result];
  const retained = { revision: page.revision, totalBytes: page.totalBytes, endByte: page.endByte, pages, next: page.next, complete: page.lastPage };
  if (page.lastPage) retained.value = JSON.parse(pages.map(raw => JSON.parse(raw).contentDelivery.text).join(""));
  store(deliveryKey, retained);
  text(result);
})();`

export const informationDeliveryExampleInstructions = `
For text-only informational discovery replies, bind result to the returned STRING and deliveryKey to a fresh key for this query (for example "chosen-contract-1"). Run this example once per exec, with no other text output; do not loop several pages into the same exec. Reuse the key for continuation. load(deliveryKey).next supplies the next same-tool arguments; call only that read in a later exec, then run this example again. The complete parsed value is load(deliveryKey).value only when complete is true. Preserve required fields, local references, execution and recovery constraints; select narrower usage/schemaPaths through ordinary discovery rather than inventing summaries.
Information forwarding example (one execution):
\`\`\`javascript
${informationDeliveryExample}
\`\`\`
To redisplay a page after output loss, bind result = load(deliveryKey).pages[index] and run the SAME example once, without calling a tool. Never print the assembled value. Retained completeness is not model receipt or successful lookup coverage; partial/failed lookup pages keep their outcome and may contain useful sibling definitions. Missing storage or stale content permits normal read/refresh using a fresh key; never repeat a completed mutation to recover informational output. This example does not intercept arbitrary Code Mode output.
`

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
