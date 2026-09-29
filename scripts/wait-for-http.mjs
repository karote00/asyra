import process from 'node:process'
import { URL } from 'node:url'

const [rawUrl, method, rawTimeout] = process.argv.slice(2)
const timeoutMs = Number(rawTimeout)

if (
  !rawUrl ||
  !['GET', 'HEAD'].includes(method) ||
  !Number.isSafeInteger(timeoutMs) ||
  timeoutMs < 1
) {
  process.stderr.write(
    'Usage: node scripts/wait-for-http.mjs <http-url> <GET|HEAD> <timeout-ms>\n'
  )
  process.exitCode = 2
} else {
  try {
    const target = new URL(rawUrl)
    if (!['http:', 'https:'].includes(target.protocol))
      throw new Error('URL must use HTTP or HTTPS')

    const deadline = Date.now() + timeoutMs
    let ready = false

    while (!ready && Date.now() < deadline) {
      const remainingMs = deadline - Date.now()
      try {
        const response = await globalThis.fetch(target, {
          method,
          signal: globalThis.AbortSignal.timeout(Math.min(5000, remainingMs))
        })
        ready = response.status >= 200 && response.status < 300
        if (method !== 'HEAD') await response.body?.cancel()
      } catch {
        // A refused or incomplete response means the local service is not ready.
      }

      if (!ready) {
        const delayMs = deadline - Date.now()
        if (delayMs > 0)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(250, delayMs))
          )
      }
    }

    if (!ready)
      throw new Error(
        `Timed out after ${timeoutMs} ms waiting for HTTP 2xx from ${target.href}`
      )
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
