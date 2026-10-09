import { createHash } from 'node:crypto'

/** Local App-tool diagnostics only. Never call with provider prompts or thought events. */
export const serializeToolPayload = (value: unknown) => {
  const redactions: string[] = []
  const seen = new WeakSet<object>()
  const redact = (path: string, reason: string) => {
    redactions.push(path)
    return `[${reason}]`
  }
  const visit = (input: unknown, path: string, key = ''): unknown => {
    if (
      /password|secret|credential|authorization|api.?key|access.?token|refresh.?token|private.?key|^(token|cookie|set-cookie|headers|base64|imageBytes|imageData|dataUrl|prompt|instructions|reasoning|thoughts?)$/i.test(
        key
      )
    )
      return redact(path, 'redacted')
    if (typeof input === 'string') {
      if (/^data:|^Bearer\s/i.test(input))
        return redact(path, 'binary or credential omitted')
      if (/^https?:\/\//i.test(input)) {
        try {
          const url = new URL(input)
          if (url.search || url.username || url.password || url.hash) {
            url.search = ''
            url.username = ''
            url.password = ''
            url.hash = ''
            redactions.push(path)
          }
          return url.toString()
        } catch {
          return redact(path, 'invalid URL omitted')
        }
      }
      return input.replace(/Bearer\s+[^\s"']+/gi, () =>
        redact(path, 'credential omitted')
      )
    }
    if (!input || typeof input !== 'object') return input ?? null
    if (ArrayBuffer.isView(input) || input instanceof ArrayBuffer)
      return redact(path, 'binary omitted')
    if (seen.has(input)) return redact(path, 'cycle omitted')
    seen.add(input)
    const result = Array.isArray(input)
      ? input.map((item, index) => visit(item, `${path}[${index}]`))
      : Object.fromEntries(
          Object.entries(input).map(([name, item]) => [
            name,
            visit(item, `${path}.${name}`, name)
          ])
        )
    seen.delete(input)
    return result
  }
  const serialized = JSON.stringify(visit(value, '$'))
  return {
    serialized,
    bytes: Buffer.byteLength(serialized),
    sha256: createHash('sha256').update(serialized).digest('hex'),
    redactions
  }
}
