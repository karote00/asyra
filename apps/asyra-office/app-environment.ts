import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

/** One local origin shared by the App server and its browser verification. */
export function resolveAppEnvironment(
  environment: { APP_URL?: string } = { APP_URL: process.env.APP_URL }
) {
  const path = fileURLToPath(new URL('./.env', import.meta.url))
  const source = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const configured =
    environment.APP_URL ?? source.match(/^APP_URL\s*=\s*(.+)$/m)?.[1]?.trim()
  if (!configured)
    throw new Error('Set APP_URL in apps/asyra-office/.env (see .env.example)')
  const url = new URL(configured)
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      'APP_URL must be a local HTTP origin without credentials, path, query or fragment'
    )
  return Object.freeze({
    url: url.origin,
    host: url.hostname,
    port: Number(url.port || 80)
  })
}
