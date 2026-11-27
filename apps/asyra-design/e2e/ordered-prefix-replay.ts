import { readFile } from 'node:fs/promises'
import { expect, type Page, type TestInfo } from '@playwright/test'
import { attachJsonEvidence } from './json-evidence'

export async function attachOrderedPrefixReplay(page: Page, info: TestInfo) {
  const replay = await page.evaluate(async () => {
    const runtime = await import('../src/testing/runtime-access')

    return {
      initial: runtime.testRuntimeState.get('ordered-prefix-initial'),
      publications: runtime.readTestCapture('ordered-prefix-publications'),
      final: await runtime.core.save()
    }
  })
  const name = 'ordered-prefix-publication-replay'

  await attachJsonEvidence(name, replay)
  const attachment = info.attachments.find((item) => item.name === name)

  expect(attachment?.contentType, name).toBe('application/json')
  expect(attachment?.body === undefined, name).toBe(true)
  if (!attachment?.path) {
    throw new Error('Missing evidence file: ' + name)
  }

  expect(await readFile(attachment.path, 'utf8')).toBe(JSON.stringify(replay))
}
