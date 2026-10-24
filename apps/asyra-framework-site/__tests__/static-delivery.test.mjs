import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import { isProductionSite } from '../lib/site-environment.mjs'
import { siteSecurityHeaders } from '../lib/site-security-headers.mjs'
import { isIndexingAuthorized, resolveSiteOrigin } from '../lib/site-origin.ts'

test('production identity and indexing require an explicit environment for Cloudflare delivery', () => {
  const environment = {
    SITE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://asyra-framework.pages.dev',
    NEXT_PUBLIC_SITE_INDEXING: 'true'
  }
  assert.equal(isProductionSite({}), false)
  assert.equal(isIndexingAuthorized(environment), true)
  assert.equal(resolveSiteOrigin(environment), environment.NEXT_PUBLIC_SITE_URL)
  assert.equal(
    isIndexingAuthorized({ ...environment, SITE_ENV: 'preview' }),
    false
  )
  assert.equal(
    isIndexingAuthorized({
      ...environment,
      NEXT_PUBLIC_SITE_INDEXING: 'false'
    }),
    false
  )
  assert.throws(() =>
    resolveSiteOrigin({ NEXT_PUBLIC_SITE_URL: 'https://example.com/path' })
  )
  assert.equal(resolveSiteOrigin({}), 'https://asyra-framework.pages.dev')
})

test(
  'the static production artifact retains identity, discovery, GA and shared security headers',
  {
    skip: process.env.STATIC_EXPORT_TEST_ENABLED !== '1'
  },
  async () => {
    const root = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../out'
    )
    const origin = resolveSiteOrigin()
    const html = await readFile(path.join(root, 'index.html'), 'utf8')
    assert.ok(html.includes(`${origin}/brand/asyra-foundation-green-v1.jpg`))
    assert.ok(
      html.includes(`href="${origin}"`) || html.includes(`href="${origin}/"`)
    )
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && isProductionSite()) {
      assert.ok(html.includes(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID))
    }
    const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8')
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(
      (match) => match[1]
    )
    const manifest = JSON.parse(
      await readFile(
        path.resolve(root, '../../../docs/public/content-manifest.json'),
        'utf8'
      )
    )
    const expectedRoutes = [
      '/',
      '/atlas',
      '/asyra-design',
      '/releases',
      '/roadmap',
      ...manifest.pages.map((page) =>
        page.id === 'overview' ? '/docs' : `/docs/${page.id}`
      )
    ]
    assert.deepEqual(
      [...urls].sort(),
      [
        ...new Set(expectedRoutes.map((route) => new URL(route, origin).href))
      ].sort()
    )
    for (const url of urls) {
      assert.ok(url.startsWith(`${origin}/`))
      const route = url.slice(origin.length)
      const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`
      assert.ok(
        (await readFile(path.join(root, file), 'utf8')).includes('<html')
      )
    }
    const robots = await readFile(path.join(root, 'robots.txt'), 'utf8')
    assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
    assert.match(
      robots,
      isIndexingAuthorized() ? /^Allow: \/$/mu : /^Disallow: \/$/mu
    )
    const headers = await readFile(path.join(root, '_headers'), 'utf8')
    for (const { key, value } of siteSecurityHeaders({
      ...process.env,
      NODE_ENV: 'production'
    })) {
      assert.ok(headers.includes(`  ${key}: ${value}\n`))
    }
    assert.match(
      headers,
      /\/_next\/static\/\*\n {2}Cache-Control: public, max-age=31536000, immutable/u
    )
    assert.ok(
      (await readFile(path.join(root, '404.html'), 'utf8')).includes(
        'Nothing is built here.'
      )
    )
  }
)
