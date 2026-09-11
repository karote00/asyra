import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const readConfiguration = () =>
  JSON.parse(
    readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8')
  )

it('builds the Sim dependency graph and serves only its static output', () => {
  const config = readConfiguration()

  expect(config.framework).toBe('vite')
  expect(config.installCommand).toBe(
    'cd ../.. && corepack yarn install --immutable'
  )
  expect(config.buildCommand).toBe(
    'cd ../.. && corepack yarn gen:turbo:check && corepack yarn turbo run react:build --filter=@asyra/asyra-sim --concurrency=2'
  )
  expect(config.outputDirectory).toBe('dist')
  expect(config.git.deploymentEnabled).toBe(false)
  // An absent script/Worker must remain a 404, never an HTML app fallback.
  expect(config.rewrites).toBeUndefined()
  expect(config.functions).toBeUndefined()
})

it('keeps scripts, Workers and connections on the deployed origin', () => {
  const config = readConfiguration()
  const headers = Object.fromEntries(
    config.headers
      .find((rule: { source: string }) => rule.source === '/(.*)')
      .headers.map(({ key, value }: { key: string; value: string }) => [
        key.toLowerCase(),
        value
      ])
  )

  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('no-referrer')
  for (const directive of [
    "script-src 'self'",
    "worker-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'"
  ])
    expect(headers['content-security-policy'].split('; ')).toContain(directive)
})
