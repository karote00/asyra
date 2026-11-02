import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { createAiInspectionAction } from '../../src/ai/inspection'
import { projectToolDelivery } from '../../src/ai/tool-contract'

vi.mock('../../src/common-apis', () => ({ inspectionApis: {} }))
import {
  localToolContent,
  createLocalOperationTools
} from '../local-operation-tools'
import { createLocalToolHost } from '../local-tool-host'
import { createAiToolContract } from '@asyra/ai-agent-runtime'

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
  if (!count) {
    receipt.actionResults = receipt.actionResults.filter(
      (entry: { actionName: string }) => entry.actionName !== 'inspect_drawing'
    )
  }

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

  const inspection = createAiInspectionAction()
  const projected = {
    ...receipt,
    actionResults: receipt.actionResults.map(
      (entry: { actionName: string; result: unknown }) => ({
        ...entry,
        result:
          entry.actionName === inspection.name
            ? projectToolDelivery(inspection, entry.result)
            : entry.result
      })
    )
  }
  const content = await localToolContent(JSON.stringify(projected))
  const raw = content[0].type === 'inputText' ? content[0].text : ''

  expect(
    content
      .filter((item) => item.type === 'inputImage')
      .map((item) => {
        if (item.type !== 'inputImage') {
          throw new Error('Expected image')
        }

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
  if (!native) {
    return
  }

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

it.each([
  { name: 'overview', elementId: 'drawing', width: 874, height: 1024 },
  { name: 'region', elementId: 'drawing', width: 1000, height: 1000 },
  { name: 'workspace', elementId: 'workspace', width: 822, height: 1024 }
])(
  'delivers $name pixels through the declared inspection contract without recapture',
  async ({ name, elementId, width, height }) => {
    const bytes = await sharp({
      create: { width, height, channels: 3, background: '#126584' }
    })
      .png()
      .toBuffer()
    const imageUrl = 'data:image/png;base64,' + bytes.toString('base64')
    const result = {
      available: true,
      image: { dataUrl: imageUrl, width, height },
      toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
    }
    const capture = vi.fn(() => result)
    const action = createAiInspectionAction(capture)
    const args = {
      elementId,
      ...(name === 'region' ? { region: { x: 0, y: 0, width, height } } : {})
    }
    const ownerResult = await action.execute(args, {
      signal: new AbortController().signal
    } as never)
    const delivered = projectToolDelivery(action, ownerResult)
    const content = await localToolContent(
      JSON.stringify({
        actionResults: [{ actionName: action.name, result: delivered }]
      })
    )

    expect(content).toContainEqual({ type: 'inputImage', imageUrl })
    expect(capture).toHaveBeenCalledOnce()
    expect(result.image).toEqual({ dataUrl: imageUrl, width, height })
    expect(content[0]).toMatchObject({ type: 'inputText' })
    expect(JSON.stringify(content[0])).not.toContain('base64,')
  }
)

it('delivers inspection pixels through the actual host projection without repeating capture', async () => {
  const action = createAiInspectionAction()
  const receipt = structuredClone(fixture.receipt)
  const capture = receipt.actionResults.find(
    (entry: { actionName: string }) => entry.actionName === action.name
  )

  capture.result.image.dataUrl = uri
  receipt.actionResults = [capture]
  const execute = vi.fn(async () => JSON.stringify(receipt))
  const operations = createLocalOperationTools(
    [createAiToolContract(action)],
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    async () => {
      throw new Error('Unexpected capture replay')
    }
  )
  const host = createLocalToolHost({
    requestId: 'inspection-delivery',
    signal: new AbortController().signal,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw new Error('Unexpected persistence')
      }
    },
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: {
      steps: 16,
      bindings: 240,
      bindingDepth: 32,
      bytes: 24000,
      issues: 8
    },

    createGroups: () => [
      {
        name: 'operations',
        description: 'Inspection delivery',
        owner: { ...operations, callInternal: execute }
      }
    ]
  })

  try {
    const definition = host
      .definitions()
      .find((entry) => entry.name === action.name)

    if (!definition?.registeredName) {
      throw new Error('Missing inspection route')
    }

    const reply = await host.invoke({
      name: definition.registeredName,
      input: { arguments: { elementId: 'drawing' } }
    })

    expect(
      JSON.parse(reply.text).toolOutcome,
      reply.text.slice(0, 1000)
    ).toMatchObject({ status: 'success' })
    const content = await localToolContent(reply.text)

    expect(content.filter((item) => item.type === 'inputImage')).toHaveLength(1)
    expect(
      content.some(
        (item) => item.type === 'inputImage' && item.imageUrl === uri
      )
    ).toBe(true)
    expect(execute).toHaveBeenCalledOnce()
    expect(capture.result.image.dataUrl).toBe(uri)
  } finally {
    await host.dispose()
  }
})
