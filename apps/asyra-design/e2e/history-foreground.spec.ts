import { createServer } from 'node:net'
import { chromium, expect, test } from '@playwright/test'
import {
  createTestDocumentURL,
  waitForAppReady,
  createRectangle,
  getElementCount,
  getCoreDocumentDigest,
  undo,
  redo
} from './test-utils'

test('history interaction activates its page before replay with native browser focus', async ({
  baseURL
}, testInfo) => {
  const listener = createServer()

  await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve))
  const address = listener.address()

  await new Promise<void>((resolve) => listener.close(() => resolve()))
  if (!address || typeof address === 'string' || !baseURL) {
    throw new Error('Missing browser endpoint or App URL')
  }

  const server = await chromium.launchServer({
    channel: 'chrome',
    args: [`--remote-debugging-port=${address.port}`]
  })

  try {
    await testInfo.attach('owned-browser', {
      body: JSON.stringify({ pid: server.process().pid, port: address.port }),
      contentType: 'application/json'
    })
    const browser = await chromium.connectOverCDP(
      `http://127.0.0.1:${address.port}`,
      {
        noDefaults: true,
        artifactsDir: testInfo.outputPath('browser-artifacts')
      }
    )

    try {
      // Native focus is essential: Playwright normally emulates every tab as focused.
      const context = browser.contexts()[0]
      const page = await context.newPage()

      page.setDefaultTimeout(5000)
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto(new URL(createTestDocumentURL(), baseURL).href)
      await waitForAppReady(page)
      const before = await getElementCount(page)
      const initial = await getCoreDocumentDigest(page)

      await createRectangle(page, 0.3, 0.3)
      expect(await getElementCount(page)).toBe(before + 1)
      const created = await getCoreDocumentDigest(page)
      const otherPage = await context.newPage()

      await otherPage.goto('about:blank')
      await otherPage.bringToFront()
      expect(await page.evaluate(() => document.hasFocus())).toBe(false)
      await test.step('Activate the source page and undo', () => undo(page))
      expect(await page.evaluate(() => document.hasFocus())).toBe(true)
      expect(await getElementCount(page)).toBe(before)
      expect(await getCoreDocumentDigest(page)).toEqual(initial)
      await otherPage.bringToFront()
      expect(await page.evaluate(() => document.hasFocus())).toBe(false)
      await test.step('Activate the source page and redo', () => redo(page))
      expect(await page.evaluate(() => document.hasFocus())).toBe(true)
      expect(await getCoreDocumentDigest(page)).toEqual(created)
    } finally {
      await browser.close()
    }
  } finally {
    await server.close()
  }
})
