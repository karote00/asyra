import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { localToolContent } from '../local-operation-tools'

const fixtureRoot = new URL(
  '../../test-data/knowledge-evaluation/fixtures/native-delivery/',
  import.meta.url
)
const fixture = JSON.parse(
  readFileSync(new URL('inspection.json', fixtureRoot), 'utf8')
)
const pixels = readFileSync(new URL('inspection.png', fixtureRoot))
const uri = 'data:image/png;base64,' + pixels.toString('base64')

import { createHash } from 'node:crypto'
import sharp from 'sharp'

const verifyImageDelivery = async (count: number, native: boolean) => {
  const receipt = structuredClone(fixture.receipt)
  const firstCapture = receipt.actionResults.find(
    (entry: { actionName: string }) => entry.actionName === 'inspect_drawing'
  )
  firstCapture.result.image.dataUrl = uri
  if (!count)
    receipt.actionResults = receipt.actionResults.filter(
      (entry: { actionName: string }) => entry.actionName !== 'inspect_drawing'
    )
  const expectedImages = count
    ? [
        {
          mediaType: 'image/png',
          bytes: pixels.length,
          sha256: fixture.imageSHA256
        }
      ]
    : []
  if (count === 2) {
    const second = await sharp({
      create: { width: 4, height: 3, channels: 3, background: '#126584' }
    })
      .png()
      .toBuffer()
    receipt.actionResults.push({
      actionName: 'inspect_drawing',
      result: {
        available: true,
        inspectionId: 'independent-image',
        image: {
          width: 4,
          height: 3,
          dataUrl: 'data:image/png;base64,' + second.toString('base64')
        }
      }
    })
    expectedImages.push({
      mediaType: 'image/png',
      bytes: second.length,
      sha256: createHash('sha256').update(second).digest('hex')
    })
  }
  const content = await localToolContent(JSON.stringify(receipt))
  const raw = content[0].type === 'inputText' ? content[0].text : ''
  expect(
    content
      .filter((item) => item.type === 'inputImage')
      .map((item) => {
        if (item.type !== 'inputImage') throw new Error('Expected image')
        const [header, base64] = item.imageUrl.split(',')
        expect(header).toBe('data:image/png;base64')
        const bytes = Buffer.from(base64, 'base64')
        return {
          mediaType: 'image/png',
          bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex')
        }
      })
  ).toEqual(expectedImages)
  expect(raw).not.toContain('base64,')
  if (!native) return
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery, loadFixtures } = await import(
    /* @vite-ignore */ nativeModule
  )
  const [versionFixture] = await loadFixtures()
  const evidence = await runNativeDelivery({
    fixture: {
      tool: 'receipt',
      namespace: 'fixture',
      input: {},
      raw,
      nativeVersion: versionFixture.nativeVersion,
      sha256: createHash('sha256').update(raw).digest('hex'),
      kind: 'saved-inspection-receipt',
      declaration: {
        type: 'namespace',
        name: 'fixture',
        description: 'Offline saved App result',
        tools: [
          {
            type: 'function',
            name: 'receipt',
            description: 'Return the saved App receipt and original images.',
            inputSchema: { type: 'object', additionalProperties: false },
            deferLoading: true
          }
        ]
      }
    },
    executions: [
      {
        input: {},
        reply: content,
        expected: raw
      }
    ]
  })
  expect(evidence.nativeReplies).toBe(1)
  expect(evidence.comparisons[0].containsSource).toBe(true)
  expect(evidence.comparisons[0].images).toEqual(expectedImages)
  expect(evidence.comparisons[0].imageBytesInText).toBe(false)
  expect(evidence.receipt.status).toBe('saved')
}
it.each([0, 1, 2])(
  'delivers complete App receipt text and image pixels without a native dependency - %i images',
  (count) => verifyImageDelivery(count, false)
)
it.runIf(Boolean(process.env.NATIVE_DELIVERY_CODEX)).each([0, 1, 2])(
  'delivers the App receipt directly through the native image interface with %i images',
  (count) => verifyImageDelivery(count, true),
  60000
)

it('verifies the permanent original image independently of ignored run artifacts', () => {
  expect(createHash('sha256').update(pixels).digest('hex')).toBe(
    fixture.imageSHA256
  )
  expect(pixels.length).toBe(fixture.imageBytes)
  expect(fixture.historicalForwardingError).toBe('unconfirmed')
})
