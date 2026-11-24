import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import process from 'node:process'
import test from 'node:test'
import { build } from 'esbuild'
import { chromium } from 'playwright'

// Exercise the real Framework event owner in two independent browser realms.
test('an extension bound to one embedded runtime survives teardown of its sibling', async () => {
  const bundle = await build({
    entryPoints: ['packages/reactive-events/src/event-bus.ts'],
    alias: { rxjs: createRequire(import.meta.url).resolve('rxjs') },
    bundle: true,
    format: 'iife',
    globalName: 'events',
    write: false
  })
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined
  })

  try {
    const page = await browser.newPage()

    await page.setContent(
      '<iframe title="first"></iframe><iframe title="second"></iframe>'
    )
    for (const frame of page.frames().slice(1)) {
      await frame.addScriptTag({ content: bundle.outputFiles[0].text })
    }

    const result = await page.evaluate(() => {
      const [first, second] = [
        ...globalThis.document.querySelectorAll('iframe')
      ]
      const received = []

      const register = (api) =>
        api.getEventBus().subscribe(() => received.push('edit'))

      register(second.contentWindow.events)
      first.contentWindow.events.getEventBus().next({ type: 'edit' })
      first.contentWindow.events.disposeEventBus()
      first.remove()
      second.contentWindow.events.getEventBus().next({ type: 'edit' })

      return received
    })

    assert.deepEqual(result, ['edit'])
  } finally {
    await browser.close()
  }
})
