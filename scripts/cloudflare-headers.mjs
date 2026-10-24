import assert from 'node:assert/strict'

// App delivery currently permits global, literal response policies only.
// Reject unsupported rules so local and public verification cannot skip them.
export function parseGlobalHeaders(source) {
  const headers = Object.create(null)
  let global = false
  for (const line of source.split(/\r?\n/u)) {
    const value = line.trim()
    if (!value || value.startsWith('#')) continue
    assert.ok(line.length <= 2000, 'Pages header line exceeds 2,000 characters')
    if (!/^\s/u.test(line)) {
      assert.equal(
        value,
        '/*',
        'Review non-global response headers before publication'
      )
      assert.equal(global, false, 'Duplicate global header rule')
      global = true
      continue
    }
    assert.ok(global, 'Header must follow the global rule')
    const match = value.match(/^([!#$%&'*+.^_`|~0-9A-Za-z-]+):\s*(.+)$/u)
    assert.ok(match, 'Expected a literal header name and value')
    const key = match[1].toLowerCase()
    assert.ok(!Object.hasOwn(headers, key), 'Duplicate response header')
    assert.doesNotMatch(
      match[2],
      /:[A-Za-z]\w*/u,
      'Dynamic header placeholders require explicit verification'
    )
    headers[key] = match[2]
  }
  return headers
}
