import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps scripts, Workers and connections on the deployed origin', () => {
  const headers = readFileSync(
    new URL('../../../public/_headers', import.meta.url),
    'utf8'
  )
  expect(headers).toContain('/*')
  expect(headers).toContain('X-Content-Type-Options: nosniff')
  expect(headers).toContain('Referrer-Policy: no-referrer')
  expect(headers).toContain('Cross-Origin-Resource-Policy: same-origin')
  for (const directive of [
    "script-src 'self'",
    "worker-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'"
  ]) {
    expect(headers).toContain(directive)
  }
})
