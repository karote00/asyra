import type { IncomingMessage } from 'node:http'

export const admitsLocalProviderRequest = (
  request: IncomingMessage
): boolean => {
  const peer = request.socket.remoteAddress
  if (!peer || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer))
    return false
  if (
    request.headers['content-type']?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return false
  const site = request.headers['sec-fetch-site']
  if (site !== undefined && site !== 'same-origin') return false
  try {
    const protocol =
      'encrypted' in request.socket && request.socket.encrypted
        ? 'https:'
        : 'http:'
    const host = new URL(`${protocol}//${request.headers.host}`)
    if (
      !['localhost', '127.0.0.1', '[::1]'].includes(host.hostname) ||
      host.host !== request.headers.host
    )
      return false
    const origin = request.headers.origin
    return origin === undefined || new URL(origin).origin === host.origin
  } catch {
    return false
  }
}
