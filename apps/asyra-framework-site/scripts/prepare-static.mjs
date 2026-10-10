import console from 'node:console'
import assert from 'node:assert/strict'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { siteSecurityHeaders } from '../lib/site-security-headers.mjs'

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const outputRoot = path.join(siteRoot, 'out')
const headers = siteSecurityHeaders({ ...process.env, NODE_ENV: 'production' })
await writeFile(
  path.join(outputRoot, '_headers'),
  [
    '/*',
    ...headers.map(({ key, value }) => `  ${key}: ${value}`),
    '/_next/static/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    ''
  ].join('\n')
)

// A real 404 disables Pages' default SPA catch-all for missing documents.
assert.ok(
  (await readFile(path.join(outputRoot, '404.html'), 'utf8')).includes(
    'Nothing is built here.'
  )
)
const files = await readdir(outputRoot, {
  recursive: true,
  withFileTypes: true
})
const assets = files.filter((entry) => entry.isFile())
assert.ok(
  assets.length <= 1000,
  'Pages dashboard upload supports at most 1,000 files'
)
for (const entry of assets) {
  assert.ok(
    !entry.name.startsWith('.env'),
    'environment files must never be published'
  )
  assert.notEqual(
    entry.name,
    '_worker.js',
    'this deployment must remain entirely static'
  )
  assert.ok(
    (await stat(path.join(entry.parentPath, entry.name))).size <=
      25 * 1024 * 1024
  )
}
console.log(`Static deployment ready: ${assets.length} assets in ${outputRoot}`)
