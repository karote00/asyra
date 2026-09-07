import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

/** One origin contract; only browser verification may opt into hosted HTTPS. */
export function resolveAppEnvironment(
  environment = process.env,
  { allowHosted = false } = {}
) {
  const path = fileURLToPath(new URL('./.env', import.meta.url))
  const source = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const configured =
    environment.APP_URL ?? source.match(/^APP_URL\s*=\s*(.+)$/m)?.[1]?.trim()
  if (!configured)
    throw new Error('Set APP_URL in apps/asyra-sim/.env (see .env.example)')
  const url = new URL(configured)
  const local =
    url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  const hosted = allowHosted && url.protocol === 'https:'
  if (
    (!local && !hosted) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      allowHosted
        ? 'APP_URL must be a local HTTP or hosted HTTPS origin without credentials, path, query or fragment'
        : 'APP_URL must be a local HTTP origin without credentials or a path'
    )
  return Object.freeze({
    url: url.origin,
    host: url.hostname,
    port: Number(url.port || (url.protocol === 'https:' ? 443 : 80))
  })
}
