import assert from 'node:assert/strict'
import test from 'node:test'
import { parseGlobalHeaders } from '../cloudflare-headers.mjs'

test('native global policy preserves literal values and case-insensitive names', () => {
  assert.deepEqual(
    {
      ...parseGlobalHeaders(
        '# Policy\r\n/*\r\n  X-Test: value\r\n  Content-Security-Policy: connect-src https://example.com; object-src none\r\n'
      )
    },
    {
      'x-test': 'value',
      'content-security-policy':
        'connect-src https://example.com; object-src none'
    }
  )
  assert.deepEqual({ ...parseGlobalHeaders('# Platform defaults\n') }, {})
})

test('unsupported rules fail instead of escaping publication verification', () => {
  for (const source of [
    '/api/*\n  X-Test: value',
    '  X-Test: value',
    '/*\n  X-Test: one\n  x-test: two',
    '/*\n/*\n  X-Test: one',
    '/*\n  ! X-Test',
    '/*\n  X-Test: :splat',
    `/*\n  X-Test: ${'a'.repeat(2000)}`
  ]) {
    assert.throws(() => parseGlobalHeaders(source), undefined, source)
  }
})
