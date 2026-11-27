import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

const root = fileURLToPath(new URL('../', import.meta.url))

const exercise = (mutation = '') =>
  spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
  import assert from 'node:assert/strict'
  import { loadVerifiedPublicContent } from './lib/content.mjs'
  const { pages } = await loadVerifiedPublicContent()
  const origin = 'https://site.example'
  const routes = new Map([
    ['/', 'An idea worth building. Change the rule. Keep the work. Choose your starting point.'],
    ['/atlas', 'Don’t take the architecture on faith. Run it.'],
    ['/docs', 'Asyra Framework'],
    ['/asyra-design', 'A complete design tool. Built with Asyra.'],
    ['/releases', 'Know exactly what your product composes.'],
    ['/roadmap', 'Build from today’s contracts. See tomorrow clearly.'],
    ...pages.map(({ href, title }) => [href, title])
  ])
  const urls = [...routes.keys()].map(route => origin + route)
  ${mutation}
  const visited = new Set()
  globalThis.fetch = async (input) => {
    const url = new URL(input)
    assert.equal(url.origin, origin)
    visited.add(url.pathname)
    let body = routes.get(url.pathname)
    let status = 200
    if (url.pathname === '/robots.txt') body = 'Allow: /'
    if (url.pathname === '/sitemap.xml') body = '<urlset>' + urls.map(url => '<url><loc>' + url + '</loc></url>').join('') + '</urlset>'
    if (url.pathname === '/llms.txt') body = '# Asyra Framework\\nPublic, source-mapped documentation'
    if (url.pathname === '/launch-missing-route') {
      status = 404
      body = 'Nothing is built here.'
    }
    assert.ok(body, 'Unexpected request: ' + url)
    return { status, url: url.href, headers: { get: () => 'present' }, text: async () => body }
  }
  process.env.SITE_URL = origin
  await import('./scripts/production-smoke.mjs')
  for (const route of routes.keys()) assert.ok(visited.has(route), 'Unverified route: ' + route)
`
    ],
    { cwd: root, encoding: 'utf8' }
  )

test('production smoke follows the current content inventory instead of a frozen page count', () => {
  const result = exercise()

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Production smoke passed: \d+ public pages/u)
})

test('production smoke rejects missing, duplicate, unexpected and wrong-origin sitemap entries', () => {
  for (const mutation of [
    'urls.pop()',
    'urls[urls.length - 1] = urls[0]',
    "urls[urls.length - 1] = origin + '/unexpected'",
    "urls[urls.length - 1] = 'https://retired.example/docs'"
  ]) {
    const result = exercise(mutation)

    assert.notEqual(result.status, 0, mutation)
    assert.match(result.stderr, /AssertionError/u)
  }
})
