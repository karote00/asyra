import { createBasicApiActions } from '../../src/ai/basic-api-actions'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { resultDelivery } from '../local-result-delivery'
import type { LocalToolImage } from '../local-tool-media'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { createAiInspectionAction } from '../../src/ai/inspection'
import {
  projectToolDelivery,
  designActionOutcome
} from '../../src/ai/tool-contract'

vi.mock('../../src/common-apis', () => ({ inspectionApis: {} }))
import {
  localToolContent,
  createLocalOperationTools
} from '../local-operation-tools'
import { createLocalToolHost } from '../local-tool-host'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import selectedInspection from '../../test-data/ai-drawing/fixtures/selected-inspection-20261106.json'

const fixtureRoot = new URL(
  '../../test-data/knowledge-evaluation/fixtures/native-delivery/',
  import.meta.url
)
const fixture = JSON.parse(
  readFileSync(new URL('inspection.json', fixtureRoot), 'utf8')
)
const pixels = readFileSync(new URL('inspection.png', fixtureRoot))
const uri = 'data:image/png;base64,' + pixels.toString('base64')

it('delivers pixels selected under the recorded host receipt alias without Base64 text', async () => {
  const receipt = structuredClone(selectedInspection.response)
  const capture = receipt.fields.receipt.find(
    (entry) => entry.actionName === 'inspect_drawing'
  )

  if (!capture) {
    throw new Error('Missing recorded capture')
  }

  // Recorded payloads redact image bytes. Restore only transport pixels here.
  capture.result.image = {
    dataUrl: uri,
    width: pixels.readUInt32BE(16),
    height: pixels.readUInt32BE(20)
  }
  const before = structuredClone(receipt)
  const media: LocalToolImage[] = []
  const delivery = resultDelivery(
    selectedInspection.request,
    undefined,
    (items) => media.push(...items)
  )

  await delivery.capture(
    'group',
    { actionResults: receipt.fields.receipt },
    new Set(),
    { status: 'success', settlement: 'completed' }
  )
  const content = await localToolContent(JSON.stringify(receipt), media)

  expect(content.filter((item) => item.type === 'inputImage')).toEqual([
    { type: 'inputImage', imageUrl: uri }
  ])
  expect(content[0]).toMatchObject({ type: 'inputText' })
  expect(JSON.stringify(content[0])).not.toContain('base64,')
  expect(JSON.stringify(content[0])).toContain(capture.result.inspectionId)
  expect(receipt).toEqual(before)
})

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
            ? projectToolDelivery(
                inspection,
                entry.result,
                designActionOutcome(entry.result)
              ).value
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
    const delivered = projectToolDelivery(
      action,
      ownerResult,
      designActionOutcome(ownerResult)
    ).value
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

it.each(['direct', 'selected', 'full', 'status', 'input'])(
  'delivers %s inspection through the actual host without repeating capture',
  async (mode) => {
    const action =
      mode === 'direct'
        ? createAiInspectionAction()
        : createBasicApiActions().find(
            (item) => item.name === 'api_hierarchy_groupElements'
          )

    if (!action) {
      throw new Error('Missing grouping contract')
    }

    const receipt =
      mode === 'direct'
        ? structuredClone(fixture.receipt)
        : {
            actionResults: structuredClone(
              selectedInspection.response.fields.receipt
            )
          }
    const capture = receipt.actionResults.find(
      (entry: { actionName: string }) => entry.actionName === 'inspect_drawing'
    )

    capture.result.image = {
      dataUrl: uri,
      width: pixels.readUInt32BE(16),
      height: pixels.readUInt32BE(20)
    }
    if (mode === 'direct') {
      receipt.actionResults = [capture]
    }

    if (mode !== 'direct') {
      const grouping = receipt.actionResults[0].result
      const ids = selectedInspection.request.operations[0].arguments.elementIds

      Object.assign(grouping, {
        modelResult: structuredClone(grouping),
        value: { ...grouping.value, elementIds: ids },
        mutationScope: {
          complete: true,
          elementIds: ids,
          removedElementIds: []
        }
      })
      Object.assign(receipt, {
        batchSummary: {
          actionCount: 1,
          operationCount: 1,
          followupActionCount: 1,
          targetCount: ids.length
        }
      })
    }

    let publish: (() => void) | undefined
    const execute = vi.fn(async () => {
      publish?.()
      const value = structuredClone(receipt)

      return JSON.stringify({
        ...value,
        modelResult: {
          ...selectedInspection.response,
          actionResults:
            mode === 'direct'
              ? value.actionResults
              : structuredClone(selectedInspection.response.fields.receipt).map(
                  (entry) =>
                    entry.actionName === 'inspect_drawing' ? capture : entry
                )
        },
        toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
      })
    })
    const operations = createLocalOperationTools(
      [
        createAiToolContract(action),
        ...(mode === 'direct'
          ? []
          : [createAiToolContract(createAiInspectionAction())])
      ],
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

      createGroups: (ownership) => {
        publish = () => {
          if (mode !== 'direct') {
            const retained =
              selectedInspection.response.fields.receipt[0].result.retained

            if (!retained) {
              throw new Error('Missing retained fixture')
            }

            ownership.publish(
              retained.leaseId,
              () => undefined,
              () => undefined
            )
            ownership.publish(
              retained.snapshotId,
              () => undefined,
              () => undefined
            )
          }
        }

        return [
          {
            name: 'design_operations',
            description: 'Inspection delivery',
            owner: { ...operations, callInternal: execute }
          }
        ]
      }
    })

    try {
      const definition = host
        .definitions()
        .find((entry) => entry.name === action.name)

      if (!definition?.registeredName) {
        throw new Error('Missing inspection route')
      }

      const reply = await host.invoke({
        name:
          mode === 'direct'
            ? definition.registeredName
            : 'design_operations.execute_design',
        input:
          mode === 'direct'
            ? { arguments: { elementId: 'drawing' } }
            : {
                operations: selectedInspection.request.operations,
                ...(mode === 'full'
                  ? {}
                  : {
                      delivery:
                        mode === 'status'
                          ? 'status'
                          : {
                              fields: {
                                chosen: {
                                  step: 'group',
                                  ...(mode === 'input'
                                    ? { source: 'input' }
                                    : {}),
                                  path: mode === 'input' ? '' : '/actionResults'
                                }
                              }
                            }
                    })
              }
      })

      expect(reply.outcome, reply.text.slice(0, 1000)).toMatchObject({
        status: 'success'
      })
      const content = await localToolContent(reply.text, reply.media)
      const count = ['status', 'metadata', 'input'].includes(mode) ? 0 : 1

      expect(content.filter((item) => item.type === 'inputImage')).toHaveLength(
        count
      )
      expect(
        content.some(
          (item) => item.type === 'inputImage' && item.imageUrl === uri
        )
      ).toBe(count === 1)
      expect(JSON.stringify(content[0])).not.toContain('base64,')
      expect(execute).toHaveBeenCalledOnce()
      expect(capture.result.image.dataUrl).toBe(uri)
    } finally {
      await host.dispose()
    }
  }
)

it.each([
  'receipt',
  'image',
  'bytes',
  'metadata',
  'input',
  'invalid',
  'multiple'
])('preserves selected output media provenance for %s', async (mode) => {
  const source = {
    actionResults: [
      {
        actionName: 'inspect_drawing',
        result: {
          available: true,
          inspectionId: 'first',
          image: {
            dataUrl: mode === 'invalid' ? 'invalid' : uri,
            width: pixels.readUInt32BE(16),
            height: pixels.readUInt32BE(20)
          }
        }
      }
    ]
  }

  if (mode === 'multiple') {
    source.actionResults.push({
      ...source.actionResults[0],
      result: { ...source.actionResults[0].result, inspectionId: 'second' }
    })
  }

  const path =
    (
      {
        image: '/actionResults/0/result/image',
        bytes: '/actionResults/0/result/image/dataUrl',
        metadata: '/actionResults/0/result/image/width'
      } as Record<string, string>
    )[mode] ?? ''
  const media: LocalToolImage[] = []
  const delivery = resultDelivery(
    {
      delivery: {
        fields: {
          'view/one~': {
            path,
            ...(mode === 'input' ? { source: 'input' as const } : {})
          },
          ...(mode === 'multiple' ? { another: { path: '' } } : {})
        }
      }
    },
    undefined,
    (items) => media.push(...items)
  )

  await delivery.capture(
    undefined,
    source,
    new Set(),
    { status: 'success', settlement: 'completed' },
    {
      value: source,
      blocked: new Set()
    }
  )
  const receipt = delivery.finish(
    { status: 'success', settlement: 'completed' },
    [],
    []
  )
  const before = structuredClone(receipt)

  if (mode === 'invalid') {
    await expect(
      localToolContent(JSON.stringify(receipt), media)
    ).rejects.toThrow('Invalid drawing snapshot')

    return
  }

  const from = vi.spyOn(Buffer, 'from')

  try {
    const content = await localToolContent(JSON.stringify(receipt), media)
    const count = ['metadata', 'input'].includes(mode) ? 0 : 1

    expect(content.filter((item) => item.type === 'inputImage')).toHaveLength(
      count
    )
    expect(from.mock.calls.filter((args) => args[1] === 'base64')).toHaveLength(
      count
    )
    if (mode === 'input') {
      expect(JSON.stringify(content[0])).toContain('base64,')
    } else {
      expect(JSON.stringify(content[0])).not.toContain('base64,')
    }

    if (mode === 'multiple') {
      expect(JSON.stringify(content[0])).toContain('first')
      expect(JSON.stringify(content[0])).toContain('second')
    }

    expect(receipt).toEqual(before)
  } finally {
    from.mockRestore()
  }
})

it('delivers the recorded failure-prefix image through native media without scanning authored data', async () => {
  const { default: recorded } =
    await import('../../test-data/ai-drawing/fixtures/phase-continuity-20261108.json')
  const receipt = structuredClone(recorded.replacementOutput)
  const capture =
    receipt.failure.execution.recovery[0].value.actionResults[1].result

  capture.image = {
    dataUrl: uri,
    width: pixels.readUInt32BE(16),
    height: pixels.readUInt32BE(20)
  }
  const content = await localToolContent(JSON.stringify(receipt))

  const images = content.filter((item) => item.type === 'inputImage')

  expect(images).toHaveLength(1)
  expect(images[0].type === 'inputImage' && images[0].imageUrl === uri).toBe(
    true
  )
  expect(
    JSON.stringify(content.filter((item) => item.type === 'inputText'))
  ).not.toContain('base64,')
  expect(JSON.stringify(content)).toContain(capture.inspectionId)
  const authored = await localToolContent(
    JSON.stringify({ draft: { failure: receipt.failure } })
  )

  expect(authored.filter((item) => item.type === 'inputImage')).toEqual([])
})

it('declares and validates the actual capture observation without an approval revision', async () => {
  const { operationInputIssue } = await import('../operation-input-schema')
  const action = createAiInspectionAction()
  const owner = createLocalOperationTools(
    [createAiToolContract(action)],
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((item) => ({
        actionId: item.id,
        actionName: item.name,
        result: {
          available: true,
          image: {
            dataUrl: uri,
            width: pixels.readUInt32BE(16),
            height: pixels.readUInt32BE(20)
          }
        }
      }))
    })
  )
  const definition = owner.definitions.find((tool) => tool.name === action.name)

  if (!definition) {
    throw new Error('Missing capture definition')
  }

  const result = JSON.parse(
    await owner.call(
      action.name,
      { arguments: { elementId: 'drawing' } },
      new AbortController().signal
    )
  )

  expect(operationInputIssue(result, definition.outputSchema)).toBeUndefined()
  expect(result.actionResults[0].result.inspectionId).toEqual(
    expect.any(String)
  )
  expect(result.actionResults[0].result).not.toHaveProperty('revision')
})
