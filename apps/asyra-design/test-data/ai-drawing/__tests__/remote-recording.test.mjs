import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { saveRemoteRecording } from '../remote-recording.mjs'

test('saves a real remote browser video before server disposal', async () => {
  const root = fileURLToPath(new URL('../../../../../tmp/', import.meta.url))
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'remote-recording-'))
  const server = await chromium.launchServer({
    headless: true,
    channel: 'chrome'
  })
  const browser = await chromium.connect(server.wsEndpoint())
  try {
    const context = await browser.newContext({
      recordVideo: { dir: join(directory, 'capture') }
    })
    const page = await context.newPage()
    await page.setContent(
      '<body style="background:blue">Recording export proof</body>'
    )
    await page.waitForTimeout(350)
    const destination = join(directory, 'saved.webm')
    const result = await saveRemoteRecording(context, page, destination)
    await server.close()
    assert.ok(result.bytes > 1000)
    assert.equal(
      (await readFile(destination)).subarray(0, 4).toString('hex'),
      '1a45dfa3'
    )
  } finally {
    await browser.close().catch(() => undefined)
    await server.close()
    await rm(directory, { recursive: true, force: true })
  }
})
