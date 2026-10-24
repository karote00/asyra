import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
import {
  localToolContent,
  localToolResultExample,
  localToolResultRecoveryExample,
  localToolResultInstructions
} from '../local-operation-tools'

const fixtureRoot = new URL(
  '../../test-data/knowledge-evaluation/fixtures/native-delivery/',
  import.meta.url
)
const fixture = JSON.parse(
  readFileSync(new URL('inspection.json', fixtureRoot), 'utf8')
)
const pixels = readFileSync(new URL('inspection.png', fixtureRoot))
const uri = 'data:image/png;base64,' + pixels.toString('base64')

async function originalContent() {
  const receipt = structuredClone(fixture.receipt)
  const capture = receipt.actionResults.find(
    (entry: { actionName: string }) => entry.actionName === 'inspect_drawing'
  )
  capture.result.image.dataUrl = uri
  return localToolContent(JSON.stringify(receipt))
}

it('retains the original acknowledged receipt before the published image forwarding can fail', async () => {
  const content = await originalContent()
  const result = content
    .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
    .join('\n')
  const values = new Map<string, unknown>()
  const text = vi.fn()
  expect(() =>
    runInNewContext(localToolResultExample, {
      result,
      resultKey: 'part-result',
      text,
      store: (key: string, value: unknown) => values.set(key, value),
      image: () => {
        throw new Error('Injected display failure')
      }
    })
  ).toThrow('Injected display failure')
  expect(values.get('part-result') === result).toBe(true)
  expect(
    text.mock.calls[0][0].actionResults[0].result.appliedElementCount
  ).toBe(1931)
})

import { createHash } from 'node:crypto'
import sharp from 'sharp'

it.each([0, 1, 2])(
  'executes the published receipt through the native image interface with %i images',
  async (count) => {
    const nativeModule = new URL(
      '../../test-data/knowledge-evaluation/native-delivery.mjs',
      import.meta.url
    ).href
    const { runNativeDelivery, loadFixtures } = await import(
      /* @vite-ignore */ nativeModule
    )
    const [versionFixture] = await loadFixtures()
    const receipt = structuredClone(fixture.receipt)
    const firstCapture = receipt.actionResults.find(
      (entry: { actionName: string }) => entry.actionName === 'inspect_drawing'
    )
    firstCapture.result.image.dataUrl = uri
    if (!count)
      receipt.actionResults = receipt.actionResults.filter(
        (entry: { actionName: string }) =>
          entry.actionName !== 'inspect_drawing'
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
      mode: 'code',
      executions: [
        {
          code: `const resultKey = "receipt-${count}"; const result = await tools.fixture__receipt({});\n${localToolResultExample}`,
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
  },
  60000
)

it('recovers native image argument rejection from the saved result without invoking the producer again', async () => {
  const nativeModule = new URL(
    '../../test-data/knowledge-evaluation/native-delivery.mjs',
    import.meta.url
  ).href
  const { runNativeDelivery, loadFixtures } = await import(
    /* @vite-ignore */ nativeModule
  )
  const [versionFixture] = await loadFixtures()
  const content = await originalContent()
  const raw = content[0].type === 'inputText' ? content[0].text : ''
  const evidence = await runNativeDelivery({
    fixture: {
      tool: 'receipt',
      namespace: 'fixture',
      input: {},
      raw,
      nativeVersion: versionFixture.nativeVersion,
      sha256: createHash('sha256').update(raw).digest('hex'),
      kind: 'saved-inspection-recovery',
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
    mode: 'code',
    executions: [
      {
        // Deliberately corrupt only the display argument. This is not a reconstruction
        // of the historical error. The original stored result remains unchanged.
        code: `const resultKey = "retained-image"; const result = await tools.fixture__receipt({}); const nativeImage = image; try { const image = uri => nativeImage({invalid: uri}); ${localToolResultExample} } catch (error) { text({displayFailure: String(error)}); }`,
        reply: content,
        expected: raw
      },
      {
        code: `const resultKey = "retained-image"; ${localToolResultRecoveryExample}`,
        expected: raw
      },
      {
        code: `store("retained-image", null); const resultKey = "retained-image"; try { ${localToolResultRecoveryExample} } catch (error) { text({missing: String(error).includes("unavailable")}); }`,
        expected: '{"missing":true}'
      }
    ]
  })
  expect(evidence.nativeReplies).toBe(1)
  const records = readFileSync(evidence.receipt.path, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const request = records.find(
    (entry: { stage: string }) => entry.stage === 'request-2'
  )
  const wire = JSON.parse(
    readFileSync(join(evidence.directory, request.receipt.path), 'utf8')
  ).wireBody
  const successor = JSON.parse(wire)
  const output = successor.input.find(
    (entry: { type: string; call_id: string }) =>
      entry.type === 'custom_tool_call_output' &&
      entry.call_id === 'native_delivery_call_0'
  ).output
  const publicText =
    typeof output === 'string'
      ? output
      : output
          .filter((item: { type: string }) => item.type === 'input_text')
          .map((item: { text: string }) => item.text)
          .join('\n')
  expect(publicText).toContain('displayFailure')
  expect(publicText).toMatch(/image|Image/)
  expect(publicText).not.toContain(pixels.toString('base64'))
  expect(evidence.cleanup.errors).toEqual([])
  expect(evidence.comparisons[0].containsSource).toBe(true)
  expect(evidence.comparisons[0].images).toEqual([])
  expect(evidence.comparisons[1].containsSource).toBe(true)
  expect(evidence.comparisons[1].images).toEqual([
    {
      mediaType: 'image/png',
      bytes: pixels.length,
      sha256: fixture.imageSHA256
    }
  ])
  expect(evidence.comparisons[1].imageBytesInText).toBe(false)
  expect(evidence.comparisons[2].containsSource).toBe(true)
}, 60000)

it('uses isolated caller keys and rejects missing or malformed redisplay without tool calls', () => {
  const values = new Map<string, unknown>()
  const output = vi.fn()
  const context = {
    text: output,
    image: vi.fn(),
    store: (key: string, value: unknown) => values.set(key, value),
    load: (key: string) => values.get(key)
  }
  for (const resultKey of ['first-result', 'second-result'])
    runInNewContext(localToolResultExample, {
      ...context,
      resultKey,
      result: JSON.stringify({ resultKey })
    })
  runInNewContext(localToolResultRecoveryExample, {
    ...context,
    resultKey: 'first-result'
  })
  expect(output.mock.calls.at(-1)?.[0]).toEqual({ resultKey: 'first-result' })
  expect(() =>
    runInNewContext(localToolResultRecoveryExample, {
      ...context,
      resultKey: 'missing'
    })
  ).toThrow('unavailable')
  values.set('malformed', '{broken')
  expect(() =>
    runInNewContext(localToolResultRecoveryExample, {
      ...context,
      resultKey: 'malformed'
    })
  ).toThrow()
  expect(context.image).not.toHaveBeenCalled()
  expect(localToolResultInstructions).toContain(localToolResultExample)
  expect(localToolResultInstructions).toContain(localToolResultRecoveryExample)
})

it.each(['success', 'partial', 'cancelled'])(
  'retains %s execution semantics across display failure and recovery',
  (status) => {
    const values = new Map<string, unknown>()
    const value = {
      toolOutcome: {
        status,
        settlement: status === 'success' ? 'completed' : 'partial'
      },
      actionResults: [
        { result: { compositionId: 'completed-root', appliedElementCount: 1 } }
      ]
    }
    const context = {
      resultKey: status,
      store: (key: string, v: unknown) => values.set(key, v),
      load: (key: string) => values.get(key),
      text: vi.fn()
    }
    expect(() =>
      runInNewContext(localToolResultExample, {
        ...context,
        result: JSON.stringify(value) + '\n' + uri,
        image: () => {
          throw new Error('Display failed')
        }
      })
    ).toThrow('Display failed')
    runInNewContext(localToolResultRecoveryExample, {
      ...context,
      image: vi.fn()
    })
    expect(context.text.mock.calls.at(-1)?.[0]).toEqual(value)
  }
)

it('verifies the permanent original image independently of ignored run artifacts', () => {
  expect(createHash('sha256').update(pixels).digest('hex')).toBe(
    fixture.imageSHA256
  )
  expect(pixels.length).toBe(fixture.imageBytes)
  expect(fixture.historicalForwardingError).toBe('unconfirmed')
})
