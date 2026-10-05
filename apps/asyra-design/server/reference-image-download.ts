import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { request } from 'node:https'

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
  const url = new URL(value)
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
    throw new Error('Unsupported reference URL')
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
    throw new Error('Non-public image host')
  const first = addresses[0]
  if (!first) throw new Error('Missing public image address')
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
  let url = validateReferenceImageUrl(value)
  for (let hop = 0; hop <= 3; hop++) {
    deadline.throwIfAborted()
    const address = await resolvePublicImageAddress(url.hostname)
    deadline.throwIfAborted()
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
          lookup: (_hostname, _options, callback) => callback(null, address, 4),
          headers: {
            'User-Agent':
              'asyra-design/1.0 (https://github.com/karote00/asyra)',
            Accept:
              kind === 'page' ? 'text/html' : 'image/png,image/jpeg,image/webp'
          }
        },
        (response) => {
          const status = response.statusCode ?? 0
          const type = String(response.headers['content-type'] ?? '')
          if ([301, 302, 303, 307, 308].includes(status)) {
            response.destroy()
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
            reject(new Error('Unsupported reference response'))
            return
          }
          const chunks: Buffer[] = []
          let size = 0
          response.on('error', reject)
          response.on('data', (chunk: Buffer) => {
            size += chunk.length
            if (size > limit) {
              response.destroy(new Error('Reference size limit'))
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
      url = validateReferenceImageUrl(new URL(result.location, url).href)
      continue
    }
    if (result.status !== 200) throw new Error('Reference redirect failed')
    return {
      url: url.href,
      response: new Response(result.bytes, {
        headers: { 'content-type': result.type }
      })
    }
  }
  throw new Error('Reference redirect limit')
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
