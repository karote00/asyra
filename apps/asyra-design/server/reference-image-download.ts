import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { request } from 'node:https'

export interface ReferenceFailure {
  stage: 'url' | 'dns' | 'request' | 'response' | 'redirect' | 'decode'
  reason: string
  retryable: boolean
  status?: number
  attempts: number
  retryAfter?: string
}

/** Structured public acquisition evidence, never raw network error text. */
export class ReferenceAcquisitionError extends Error {
  constructor(readonly failure: ReferenceFailure) {
    super(
      `Reference ${failure.stage}: ${failure.reason}${failure.status ? ` (HTTP ${failure.status})` : ''}`
    )
  }
}

export const referenceFailure = (
  error: unknown,
  stage: ReferenceFailure['stage']
): ReferenceFailure => {
  if (error instanceof ReferenceAcquisitionError) return error.failure
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined
  const timeout = error instanceof Error && error.name === 'TimeoutError'
  let reason = 'network-error'
  if (timeout) reason = 'timeout'
  else if (stage === 'dns') reason = 'dns-failed'
  return {
    stage,
    reason,
    retryable:
      timeout ||
      ['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT'].includes(String(code)),
    attempts: 1
  }
}

export const referenceRejection = (
  stage: ReferenceFailure['stage'],
  reason: string,
  status?: number,
  retryAfter?: string
) =>
  new ReferenceAcquisitionError({
    stage,
    reason,
    retryable:
      status !== undefined && [408, 429, 500, 502, 503, 504].includes(status),
    ...(status === undefined ? {} : { status }),
    attempts: 1,
    ...(retryAfter ? { retryAfter: retryAfter.slice(0, 80) } : {})
  })

const awaitAddress = (
  value: Promise<string>,
  signal: AbortSignal
): Promise<string> =>
  new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
    value
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })

const blockedAddresses = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4]
] as const)
  blockedAddresses.addSubnet(address, prefix, 'ipv4')

export const validateReferenceImageUrl = (value: string): URL => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw referenceRejection('url', 'invalid-url')
  }
  if (
    value.length > 4096 ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.endsWith('.local') ||
    url.hostname.startsWith('[')
  )
    throw referenceRejection('url', 'unsupported-url')
  return url
}

/** Resolve once per hop and pin the connection to the admitted address, avoiding DNS rebinding. */
export const resolvePublicImageAddress = async (
  hostname: string,
  resolveAddresses: (
    host: string
  ) => Promise<readonly { address: string; family: number }[]> = (host) =>
    lookup(host, { all: true, family: 4 })
): Promise<string> => {
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await resolveAddresses(hostname)
  if (
    !addresses.length ||
    addresses.some(
      (item) =>
        item.family !== 4 ||
        !isIP(item.address) ||
        blockedAddresses.check(item.address, 'ipv4')
    )
  )
    throw referenceRejection('dns', 'non-public-host')
  const first = addresses[0]
  if (!first) throw referenceRejection('dns', 'missing-public-address')
  return first.address
}

/** Public source transport; every redirect is independently admitted and DNS-pinned. */
const downloadReference = async (
  value: string,
  signal: AbortSignal,
  kind: 'image' | 'page'
): Promise<{ response: Response; url: string }> => {
  const limit = (kind === 'page' ? 1 : 6) * 1024 * 1024
  const media =
    kind === 'page' ? /^text\/html(;|$)/i : /^image\/(png|jpeg|webp)(;|$)/i
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
  for (let attempt = 1; attempt <= 2; attempt++) {
    let stage: ReferenceFailure['stage'] = 'url'
    try {
      signal.throwIfAborted()
      let url = validateReferenceImageUrl(value)
      for (let hop = 0; hop <= 3; hop++) {
        deadline.throwIfAborted()
        stage = 'dns'
        const address = await awaitAddress(
          resolvePublicImageAddress(url.hostname),
          deadline
        )
        deadline.throwIfAborted()
        stage = 'request'
        const result = await new Promise<{
          status: number
          location?: string
          type: string
          bytes: Buffer
        }>((resolve, reject) => {
          const req = request(
            url,
            {
              agent: false,
              family: 4,
              signal: deadline,
              lookup: (_hostname, _options, callback) =>
                callback(null, address, 4),
              headers: {
                'User-Agent':
                  'asyra-design/1.0 (https://github.com/karote00/asyra)',
                Accept:
                  kind === 'page'
                    ? 'text/html'
                    : 'image/png,image/jpeg,image/webp'
              }
            },
            (response) => {
              const status = response.statusCode ?? 0
              const type = String(response.headers['content-type'] ?? '')
              if ([301, 302, 303, 307, 308].includes(status)) {
                response.destroy()
                if (!response.headers.location) {
                  reject(
                    referenceRejection('redirect', 'missing-location', status)
                  )
                  return
                }
                resolve({
                  status,
                  location: response.headers.location,
                  type,
                  bytes: Buffer.alloc(0)
                })
                return
              }
              if (
                status !== 200 ||
                !media.test(type) ||
                Number(response.headers['content-length']) > limit
              ) {
                response.destroy()
                reject(
                  status !== 200
                    ? referenceRejection(
                        'response',
                        'http',
                        status,
                        response.headers['retry-after']
                      )
                    : referenceRejection(
                        'response',
                        !media.test(type) ? 'unsupported-media' : 'size-limit'
                      )
                )
                return
              }
              const chunks: Buffer[] = []
              let size = 0
              response.on('error', reject)
              response.on('data', (chunk: Buffer) => {
                size += chunk.length
                if (size > limit) {
                  const error = referenceRejection('response', 'size-limit')
                  response.destroy(error)
                  reject(error)
                  return
                }
                chunks.push(chunk)
              })
              response.on('end', () =>
                resolve({ status, type, bytes: Buffer.concat(chunks) })
              )
            }
          )
          req.on('error', reject)
          req.end()
        })
        if (result.location) {
          stage = 'redirect'
          url = validateReferenceImageUrl(new URL(result.location, url).href)
          continue
        }
        return {
          url: url.href,
          response: new Response(result.bytes, {
            headers: {
              'content-type': result.type,
              'x-reference-attempt-count': String(attempt)
            }
          })
        }
      }
      throw referenceRejection('redirect', 'redirect-limit')
    } catch (error) {
      signal.throwIfAborted()
      const failure = {
        ...referenceFailure(deadline.aborted ? deadline.reason : error, stage),
        attempts: attempt
      }
      // Retry-After belongs to the source: never hammer it or sleep beyond this call's deadline.
      if (
        attempt === 1 &&
        failure.retryable &&
        !failure.retryAfter &&
        !deadline.aborted
      )
        continue
      throw new ReferenceAcquisitionError(failure)
    }
  }
  throw referenceRejection('request', 'attempt-limit')
}

/** Original raster bytes only; no thumbnail substitution or resampling. */
export const downloadReferenceImage = async (
  value: string,
  signal: AbortSignal
): Promise<Response> =>
  (await downloadReference(value, signal, 'image')).response

/** Bounded HTML only; returns the admitted final URL for relative metadata links. */
export const downloadReferencePage = (value: string, signal: AbortSignal) =>
  downloadReference(value, signal, 'page')
