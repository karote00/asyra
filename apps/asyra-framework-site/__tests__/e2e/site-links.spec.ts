import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { publicPageHref } from '../../lib/content.mjs'

const escapePattern = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..'
)
const githubBlobPrefix = '/karote00/asyra/blob/main/'
const manifest = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, 'docs/public/content-manifest.json'),
    'utf8'
  )
) as { pages: { id: string }[] }
const publicRoutes = [
  '/',
  '/atlas',
  '/asyra-design',
  '/releases',
  '/roadmap',
  ...manifest.pages.map(({ id }) => publicPageHref(id))
]
const allowedExternalOrigins = new Set([
  'https://asyra-design.pages.dev',
  'https://asyra-sim.pages.dev',
  'https://asyra-fieldscope.pages.dev',
  'https://github.com',
  'https://www.npmjs.com'
])

test('the sitemap includes every independently checked public page', async ({
  request
}) => {
  const sitemapResponse = await request.get('/sitemap.xml')
  expect(sitemapResponse.status()).toBe(200)
  const sitemap = await sitemapResponse.text()
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => new URL(location).pathname
  )

  expect(routes).toHaveLength(51)
  expect([...routes].sort()).toEqual([...publicRoutes].sort())
})

for (const source of publicRoutes) {
  test(`public page ${source} and its server-rendered links resolve`, async ({
    request
  }) => {
    const response = await request.get(source)
    expect(response.status(), source).toBe(200)
    const body = await response.text()
    const routeBodies = new Map([[source, body]])
    const siteOrigin = new URL(response.url()).origin
    const externalOrigins = new Set<string>()
    const externalUrls = new Set<string>()

    const anchors = [...body.matchAll(/<a\b[^>]*>/g)].map(([anchor]) => anchor)

    for (const anchor of anchors) {
      const rawHref = anchor.match(/\bhref="([^"]+)"/)?.[1]
      if (!rawHref) continue

      const href = rawHref.replaceAll('&amp;', '&')
      const destination = new URL(href, new URL(source, siteOrigin))
      if (destination.origin !== siteOrigin) {
        externalOrigins.add(destination.origin)
        externalUrls.add(destination.href)
        expect(
          allowedExternalOrigins.has(destination.origin),
          `${source} -> ${destination.href}`
        ).toBe(true)
        expect(anchor, `${source} -> ${destination.href}`).toMatch(
          /\btarget="_blank"/
        )
        expect(anchor, `${source} -> ${destination.href}`).toMatch(
          /\brel="noopener noreferrer"/
        )

        if (
          destination.hostname === 'github.com' &&
          destination.pathname.startsWith(githubBlobPrefix)
        ) {
          const sourcePath = decodeURIComponent(
            destination.pathname.slice(githubBlobPrefix.length)
          )
          const localPath = path.resolve(repositoryRoot, sourcePath)
          expect(localPath.startsWith(`${repositoryRoot}${path.sep}`)).toBe(
            true
          )
          await expect(
            access(localPath),
            `${source} -> ${destination.href}`
          ).resolves.toBeUndefined()
        }
        continue
      }

      const destinationRoute = destination.pathname
      // Each known route has its own HTTP assertion above. Fetch additional
      // bodies only for fragment targets or routes outside the sitemap.
      if (!destination.hash && publicRoutes.includes(destinationRoute)) continue
      let destinationBody = routeBodies.get(destinationRoute)
      if (!destinationBody) {
        const response = await request.get(
          `${destinationRoute}${destination.search}`
        )
        expect(
          response.status(),
          `${source} -> ${destination.pathname}${destination.search}`
        ).toBe(200)
        destinationBody = await response.text()
        routeBodies.set(destinationRoute, destinationBody)
      }

      if (!destination.hash) continue

      const id = decodeURIComponent(destination.hash.slice(1))
      expect(
        destinationBody,
        `${source} -> ${destination.pathname}${destination.hash}`
      ).toMatch(new RegExp(`\\bid="${escapePattern(id)}"`))
    }
    if (source === '/') {
      for (const origin of [
        'https://asyra-design.pages.dev',
        'https://asyra-sim.pages.dev',
        'https://asyra-fieldscope.pages.dev',
        'https://github.com'
      ])
        expect(externalOrigins).toContain(origin)
      expect(externalUrls).toContain(
        'https://asyra-design.pages.dev/?fileId=demo'
      )
      expect(externalUrls).toContain('https://asyra-sim.pages.dev/')
    }
    if (source === '/docs') {
      expect(externalUrls).toContain(
        'https://www.npmjs.com/package/create-asyra-app'
      )
    }
  })
}
