import { withConversationApp } from './fixtures/conversation-app'
import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { isRecord, type EVENT_OPTIONS } from '@asyra/utils'
import { createNativeProviderFixture } from '../server/__tests__/native-provider-fixture'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getUndoHistoryDepth,
  getCoreDocumentDigest,
  undo,
  redo
} from './test-utils'

for (const fault of [undefined, 'swap-attachment-association'] as const) {
  test(
    fault
      ? 'detects corrupted attachment association at the actual native consumer'
      : 'carries isolated draft images and clarification history through the real App into native requests',
    async ({ page }, testInfo) => {
      test.setTimeout(150000)
      const question = 'Which swatch should guide the advice?'

      const modelReply = (
        id: string,
        name: string,
        args: Record<string, unknown>
      ) => ({
        type: 'message',
        id,
        role: 'assistant',
        status: 'completed',
        content: [
          {
            type: 'output_text',
            annotations: [],
            text: JSON.stringify({
              batchId: id,
              actions: [
                { id, name, arguments: args, summary: 'Reference advice' }
              ]
            })
          }
        ]
      })

      const advice = (id: string, message: string) =>
        modelReply(id, 'report_outcome', { outcome: 'completed', message })

      const fixture = await createNativeProviderFixture(
        [
          advice('origin', 'Ready to discuss your references.'),
          advice('separate', 'This conversation has no references.'),
          modelReply('clarify', 'request_clarification', { question }),
          advice('answer', 'Use the blue swatch for the intended emphasis.'),
          advice('follow-up', 'The same two swatches remain the references.')
        ],
        fault
      )
      const swatches = await Promise.all([
        sharp({
          create: { width: 8, height: 8, channels: 3, background: '#ff0000' }
        })
          .png()
          .toBuffer(),
        sharp({
          create: { width: 8, height: 8, channels: 3, background: '#0000ff' }
        })
          .png()
          .toBuffer()
      ])

      await withConversationApp(page, testInfo, fixture, async (appURL) => {
        await page.goto(appURL + createTestDocumentIdentity().url)
        await waitForAppReady(page)
        const before = await getCoreDocumentDigest(page)
        const history = await getUndoHistoryDepth(page)

        await page.getByRole('button', { name: 'Open Agent' }).click()
        const composer = page.getByLabel('Message Agent')
        const send = page.getByRole('button', { name: 'Send', exact: true })

        const settle = async (requests: number) => {
          await expect
            .poll(() => fixture.requests.length, { timeout: 45000 })
            .toBe(requests)
          await expect(
            page.getByTestId('ai-agent-message').last()
          ).toHaveAttribute('data-outcome', 'no-change', { timeout: 15000 })
        }

        await composer.fill('Reference advice')
        await send.click()
        await settle(1)
        await page.evaluate(() => {
          const read = FileReader.prototype.readAsDataURL
          const pending: (() => void)[] = []

          FileReader.prototype.readAsDataURL = function (file) {
            pending.push(() => read.call(this, file))
          }

          window.addEventListener(
            'release-reference-reads',
            () => {
              FileReader.prototype.readAsDataURL = read
              pending.splice(0).forEach((complete) => complete())
            },
            { once: true }
          )
        })
        await page.getByLabel('Choose images').setInputFiles([
          {
            name: 'red-swatch.png',
            mimeType: 'image/png',
            buffer: swatches[0]
          },
          {
            name: 'blue-swatch.png',
            mimeType: 'image/png',
            buffer: swatches[1]
          }
        ])
        await composer.fill('Compare the two attached swatches.')
        await page.getByRole('button', { name: 'New conversation' }).click()
        await page.evaluate(() =>
          window.dispatchEvent(new Event('release-reference-reads'))
        )
        await expect(
          page.getByRole('button', { name: 'Remove red-swatch.png' })
        ).toHaveCount(0)
        await expect(
          page.getByRole('button', { name: 'Remove blue-swatch.png' })
        ).toHaveCount(0)
        await composer.fill('Separate note')
        await send.click()
        await settle(2)
        await page
          .getByRole('button', { name: 'Toggle conversation history' })
          .click()
        await page
          .getByRole('region', { name: 'Conversation history' })
          .getByRole('button', { name: 'Reference advice', exact: true })
          .click()
        await expect(composer).toHaveValue('Compare the two attached swatches.')
        await expect(
          page.getByRole('button', { name: 'Remove red-swatch.png' })
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'Remove blue-swatch.png' })
        ).toBeVisible()
        await send.click()
        await expect(page.getByText(question, { exact: true })).toBeVisible({
          timeout: 45000
        })
        await expect.poll(() => fixture.requests.length).toBe(3)
        await page.screenshot({
          path: testInfo.outputPath('reference-question.png')
        })
        await composer.fill('Use the blue swatch.')
        await send.click()
        await settle(4)
        await composer.fill('Keep the same references and explain.')
        await send.click()
        await settle(5)

        // Native history contains previous turns. Select the actual current App
        // message, then independently verify accumulated history below.
        const appMessages = (request: Record<string, unknown>) => {
          if (!Array.isArray(request.input)) {
            throw Error('Missing actual native input')
          }

          return request.input
            .filter(isRecord)
            .filter(
              (message) =>
                message.role === 'user' &&
                Array.isArray(message.content) &&
                message.content.some(
                  (item) =>
                    isRecord(item) &&
                    item.type === 'input_text' &&
                    typeof item.text === 'string' &&
                    item.text.startsWith('{"input":')
                )
            )
        }

        const currentContent = (request: Record<string, unknown>) => {
          const messages = appMessages(request)
          const current = messages[messages.length - 1]

          if (!current || !Array.isArray(current.content)) {
            throw Error('Missing current App message')
          }

          return current.content.filter(isRecord)
        }

        expect(
          fixture.requests.map((request) => appMessages(request).length)
        ).toEqual([1, 1, 2, 3, 4])
        const receivedImages = fixture.requests.map((request) =>
          currentContent(request)
            .filter((item) => item.type === 'input_image')
            .map((item) => item.image_url)
        )
        const originalImages = swatches.map(
          (bytes) => 'data:image/png;base64,' + bytes.toString('base64')
        )

        expect(receivedImages).toEqual([
          [],
          [],
          originalImages,
          originalImages,
          originalImages
        ])

        // Decode only the observed wire envelope. Expected associations below are
        // independent of the App context builder and native serialization helpers.
        const envelope = (texts: unknown[]) => {
          const values = texts
            .filter(
              (text): text is string =>
                typeof text === 'string' && text.startsWith('{')
            )
            .map((text): unknown => JSON.parse(text))
            .filter(isRecord)
            .filter(
              (value) => value.protocolVersion === 1 && isRecord(value.input)
            )

          expect(values).toHaveLength(1)
          const input = values[0].input

          if (!isRecord(input) || !isRecord(input.metadata)) {
            throw Error('Missing actual request metadata')
          }

          return { intent: input.intent, metadata: input.metadata }
        }

        const inputs = fixture.requests.map((request) =>
          envelope(
            currentContent(request)
              .filter((item) => item.type === 'input_text')
              .map((item) => item.text)
          )
        )
        const historicalInputs = appMessages(fixture.requests[4]).map(
          (message) => {
            if (!Array.isArray(message.content)) {
              throw Error('Missing historical App content')
            }

            return envelope(
              message.content
                .filter(isRecord)
                .filter((item) => item.type === 'input_text')
                .map((item) => item.text)
            )
          }
        )

        expect(historicalInputs.map((input) => input.intent)).toEqual([
          'Reference advice',
          'Compare the two attached swatches.',
          'Use the blue swatch.',
          'Keep the same references and explain.'
        ])
        expect(JSON.stringify(fixture.requests[4].input)).toContain(question)
        expect(JSON.stringify(fixture.requests[4].input)).not.toContain(
          'Separate note'
        )
        const published = fixture
          .appPackets()
          .filter((packet) => packet.method === 'turn/start')
          .map((packet) => {
            if (
              !isRecord(packet.params) ||
              !Array.isArray(packet.params.input)
            ) {
              throw Error('Missing original App request')
            }

            return envelope(
              packet.params.input
                .filter(isRecord)
                .filter((item) => item.type === 'text')
                .map((item) => item.text)
            )
          })

        expect(inputs.map((input) => input.intent)).toEqual([
          'Reference advice',
          'Separate note',
          'Compare the two attached swatches.',
          'Use the blue swatch.',
          'Keep the same references and explain.'
        ])
        expect(new Set(inputs.map((input) => input.metadata.turnId)).size).toBe(
          5
        )
        expect(inputs[1].metadata.conversationId).not.toBe(
          inputs[0].metadata.conversationId
        )
        expect(inputs[1].metadata).not.toHaveProperty('conversationContext')

        const sourceAssociation = (metadata: Record<string, unknown>) => {
          expect(
            metadata.conversationContext,
            'Source attachment association'
          ).toEqual({
            turns: [],
            attachmentIndexes: [0, 1]
          })
        }

        sourceAssociation(published[2].metadata)
        if (fault) {
          expect(() => sourceAssociation(inputs[2].metadata)).toThrow(
            /Source attachment association/
          )
          const original = published[2].metadata.conversationContext

          if (!isRecord(original)) {
            throw Error('Missing original source context')
          }

          expect(inputs[2]).toEqual({
            ...published[2],
            metadata: {
              ...published[2].metadata,
              conversationContext: { ...original, attachmentIndexes: [1, 0] }
            }
          })
        } else {
          sourceAssociation(inputs[2].metadata)
          expect(inputs[2]).toEqual(published[2])
        }

        for (const index of [0, 1, 3, 4]) {
          expect(inputs[index]).toEqual(published[index])
        }

        for (const index of [3, 4]) {
          const metadata = inputs[index].metadata

          expect(metadata.conversationId).toBe(
            inputs[0].metadata.conversationId
          )
          expect(metadata.imageAttachments).toEqual(
            inputs[2].metadata.imageAttachments
          )
          if (!isRecord(metadata.conversationContext)) {
            throw Error('Missing history context')
          }

          expect(metadata.conversationContext.attachmentIndexes).toEqual([])
          const turns = metadata.conversationContext.turns

          if (!Array.isArray(turns)) {
            throw Error('Missing settled turns')
          }

          expect(turns).toEqual([])
        }

        expect(inputs[3].metadata.replyTo).toEqual({
          turnId: inputs[2].metadata.turnId,
          intent: 'Compare the two attached swatches.'
        })
        expect(historicalInputs.map((input) => input.metadata.turnId)).toEqual([
          inputs[0].metadata.turnId,
          inputs[2].metadata.turnId,
          inputs[3].metadata.turnId,
          inputs[4].metadata.turnId
        ])
        expect(historicalInputs[2].metadata.replyTo).toEqual(
          inputs[3].metadata.replyTo
        )
        await expect(
          page.getByRole('img', { name: 'red-swatch.png', exact: true })
        ).toHaveCount(1)
        await expect(
          page.getByRole('img', { name: 'blue-swatch.png', exact: true })
        ).toHaveCount(1)
        expect(await getCoreDocumentDigest(page)).toEqual(before)
        expect(await getUndoHistoryDepth(page)).toBe(history)
        expect(fixture.toolCalls()).toHaveLength(0)
        const starts = fixture
          .appPackets()
          .filter((packet) => packet.method === 'thread/start')
        const probes = starts.filter(
          (packet) =>
            isRecord(packet.params) &&
            Array.isArray(packet.params.dynamicTools) &&
            packet.params.dynamicTools.length === 0
        )
        const turns = fixture
          .appPackets()
          .filter((packet) => packet.method === 'turn/start')

        expect(starts).toHaveLength(3)
        expect(probes).toHaveLength(1)
        expect(turns).toHaveLength(5)
        const threads = turns.map((packet) => {
          if (
            !isRecord(packet.params) ||
            typeof packet.params.threadId !== 'string'
          ) {
            throw Error('Missing actual native thread identity')
          }

          return packet.params.threadId
        })

        expect(new Set(threads).size).toBe(2)
        expect([threads[2], threads[3], threads[4]]).toEqual([
          threads[0],
          threads[0],
          threads[0]
        ])
        expect(threads[1]).not.toBe(threads[0])
        expect(
          fixture
            .appPackets()
            .filter((packet) => packet.method === 'thread/resume')
        ).toHaveLength(3)
        await page.screenshot({
          path: testInfo.outputPath('reference-follow-up.png')
        })
      })
    }
  )
}

// Model decisions are scripted. The actual App owns the UI, transport, Host,
// Runtime, canonical mutation, rendering, capture, receipt and native delivery.
test('submits a translated hierarchy through the real App and delivers its actual capture with reversible canonical state', async ({
  page
}, testInfo) => {
  test.setTimeout(120000)
  const fixture = await createNativeProviderFixture([
    {
      type: 'function_call',
      id: 'build',
      call_id: 'build',
      namespace: 'design_operations',
      name: 'execute_design',
      arguments: JSON.stringify({
        operations: [
          {
            id: 'create',
            name: 'prepare_and_apply_design',
            arguments: {
              inspection: 'defer',
              draft: {
                type: 'frame',
                key: 'frame',
                name: 'Coordinate sample',
                x: 100,
                y: 80,
                width: 200,
                height: 160,
                fill: '#ffffff',
                children: [
                  {
                    type: 'group',
                    key: 'group',
                    name: 'Translated group',
                    x: 20,
                    y: 10,
                    children: [
                      {
                        type: 'rect',
                        key: 'red',
                        name: 'Red square',
                        x: -5,
                        y: 7,
                        width: 20,
                        height: 20,
                        fill: '#ff0000'
                      },
                      {
                        type: 'rect',
                        key: 'blue',
                        name: 'Blue square',
                        x: 55,
                        y: 37,
                        width: 20,
                        height: 20,
                        fill: '#0000ff'
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            id: 'capture',
            name: 'design_operations.inspect_drawing',
            arguments: {
              arguments: {
                elementId: {
                  kind: 'step',
                  step: 'create',
                  path: '/compositionIds/0'
                },
                view: 'overview'
              }
            }
          }
        ],
        inspection: 'defer'
      })
    },
    {
      type: 'message',
      id: 'done',
      role: 'assistant',
      status: 'completed',
      content: [
        {
          type: 'output_text',
          text: JSON.stringify({
            batchId: 'done',
            actions: [
              {
                id: 'report',
                name: 'report_outcome',
                arguments: {
                  outcome: 'completed',
                  message: 'Created and captured the coordinate sample.'
                },
                summary: 'Report completion'
              }
            ]
          }),
          annotations: []
        }
      ]
    }
  ])

  await withConversationApp(page, testInfo, fixture, async (appURL) => {
    const document = createTestDocumentIdentity()

    await page.goto(appURL + document.url)
    await waitForAppReady(page)
    const peer = await page.context().newPage()

    await peer.goto(appURL + document.url)
    await waitForAppReady(peer)
    const historyBefore = await getUndoHistoryDepth(page)

    await page.bringToFront()
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill(
        'Create a white frame containing two colored squares in a translated group, then capture it.'
      )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect.poll(() => fixture.requests.length, { timeout: 45000 }).toBe(2)
    const creationReply = fixture.toolReply('build')

    expect(creationReply.success, JSON.stringify(creationReply)).toBe(true)
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    expect(fixture.requests).toHaveLength(2)
    expect(fixture.toolCalls()).toHaveLength(1)
    const output = fixture.successorContent('build')

    expect(Array.isArray(output)).toBe(true)
    if (!Array.isArray(output)) {
      throw Error('Missing real native image blocks')
    }

    const images = output
      .filter(isRecord)
      .filter((item) => item.type === 'input_image')

    expect(images).toHaveLength(1)
    const imageUrl = images[0].image_url

    if (
      typeof imageUrl !== 'string' ||
      !imageUrl.startsWith('data:image/png;base64,')
    ) {
      throw Error('Missing actual PNG capture')
    }

    const bytes = Buffer.from(imageUrl.split(',')[1], 'base64')

    await writeFile(testInfo.outputPath('native-capture.png'), bytes)
    const { data, info } = await sharp(bytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixel = (x: number, y: number) => {
      const offset =
        (Math.floor((y * info.height) / 160) * info.width +
          Math.floor((x * info.width) / 200)) *
        info.channels

      return [...data.subarray(offset, offset + 4)]
    }

    // These workspace points derive from the authored parent/local offsets,
    // independently of the preparation and capture implementations.
    expect(pixel(25, 27)).toEqual([255, 0, 0, 255])
    expect(pixel(85, 57)).toEqual([0, 0, 255, 255])
    expect(pixel(150, 120)).toEqual([255, 255, 255, 255])

    const names = (target = page) =>
      target.evaluate(async () => {
        const { default: core } = await import('../src/contexts')

        return [...core.deps.sceneTree.getAllElements().values()].map(
          (element) => element.get('name')
        )
      })

    expect(await names()).toEqual(
      expect.arrayContaining([
        'Coordinate sample',
        'Translated group',
        'Red square',
        'Blue square'
      ])
    )
    const collaborator = peer

    await collaborator.bringToFront()
    await expect
      .poll(() => names(collaborator))
      .toEqual(
        expect.arrayContaining([
          'Coordinate sample',
          'Translated group',
          'Red square',
          'Blue square'
        ])
      )
    const createdDigest = await getCoreDocumentDigest(page)

    await expect
      .poll(() => getCoreDocumentDigest(collaborator))
      .toEqual(createdDigest)
    expect(await getUndoHistoryDepth(collaborator)).toBe(0)
    expect(await getUndoHistoryDepth(page)).toBe(historyBefore + 1)
    // Replay may settle after the old helper's fixed sleep on slower runners.
    // Delay the actual App API, preserving its real implementation and result.
    await page.evaluate(async () => {
      const { historyApis } = await import('../src/common-apis')
      const {
        yieldToCooperativeHost,
        waitForCooperativePaint,
        testRuntimeState
      } = await import('../src/testing/runtime-access')
      const phases: { phase: string; at: number }[] = []

      const record = (phase: string) => {
        phases.push({ phase, at: performance.now() })
      }

      testRuntimeState.set('native-history-phases', phases)

      for (const direction of ['undo', 'redo'] as const) {
        const original = historyApis[direction]

        historyApis[direction] = async (...args) => {
          await new Promise((resolve) => setTimeout(resolve, 1200))

          const options = args[0] ?? {}

          record(`${direction}:start`)
          try {
            await original({
              ...options,

              yieldToHost: async () => {
                record(`${direction}:host:start`)
                await (options.yieldToHost ?? yieldToCooperativeHost)()
                record(`${direction}:host:complete`)
              },

              waitForPaint: async () => {
                record(`${direction}:paint:start`)
                await (options.waitForPaint ?? waitForCooperativePaint)()
                record(`${direction}:paint:complete`)
              }
            })
          } finally {
            record(`${direction}:exit`)
          }
        }
      }
    })
    try {
      await undo(page)
      expect(await names()).not.toContain('Coordinate sample')
      await collaborator.bringToFront()
      await expect
        .poll(() => names(collaborator))
        .not.toContain('Coordinate sample')
      await redo(page)
      expect(await names()).toContain('Coordinate sample')
      await collaborator.bringToFront()
      await expect
        .poll(() => names(collaborator))
        .toContain('Coordinate sample')
      // Exercise the other supported platform shortcut on this browser too.
      const alternateModifier =
        process.platform === 'darwin' ? 'Control' : 'Meta'

      await page.bringToFront()
      await page.keyboard.press(`${alternateModifier}+z`)
      await expect.poll(() => getUndoHistoryDepth(page)).toBe(historyBefore)
      expect(await names()).not.toContain('Coordinate sample')
      await collaborator.bringToFront()
      await expect
        .poll(() => names(collaborator))
        .not.toContain('Coordinate sample')
      await page.bringToFront()
      await page.keyboard.press(`${alternateModifier}+Shift+z`)
      await expect.poll(() => getUndoHistoryDepth(page)).toBe(historyBefore + 1)
      await expect
        .poll(() => getCoreDocumentDigest(page))
        .toEqual(createdDigest)
      await collaborator.bringToFront()
      await expect
        .poll(() => getCoreDocumentDigest(collaborator))
        .toEqual(createdDigest)
      await page.screenshot({
        path: testInfo.outputPath('conversation-capture.png')
      })
    } finally {
      await testInfo.attach('history-replay-phases', {
        body: JSON.stringify(
          await page.evaluate(async () => {
            const { testRuntimeState } =
              await import('../src/testing/runtime-access')

            return testRuntimeState.get('native-history-phases')
          })
        ),
        contentType: 'application/json'
      })
    }
  })
})

for (const removeImages of [false, true]) {
  test(
    removeImages
      ? 'detects loss of two captured images after a real canonical sequence'
      : 'groups and edits created region targets and delivers two captures in one actual native handoff',
    async ({ page }, testInfo) => {
      test.setTimeout(150000)
      const groupPath = '/actionResults/0/result/value/groupId'
      const fixture = await createNativeProviderFixture(
        [
          {
            type: 'function_call',
            id: 'sequence',
            call_id: 'sequence',
            namespace: 'design_operations',
            name: 'execute_design',
            arguments: JSON.stringify({
              operations: [
                {
                  id: 'create',
                  name: 'prepare_and_apply_design',
                  arguments: {
                    inspection: 'defer',

                    draft: {
                      type: 'frame',
                      key: 'frame',
                      name: 'Sequence sample',
                      x: 100,
                      y: 80,
                      width: 200,
                      height: 160,
                      fill: '#ffffff',
                      children: [
                        {
                          type: 'group',
                          key: 'parent',
                          name: 'Original parent',
                          x: 20,
                          y: 10,
                          children: [
                            {
                              type: 'rect',
                              key: 'red',
                              name: 'Patch red',
                              x: -5,
                              y: 7,
                              width: 20,
                              height: 20,
                              fill: '#ff0000'
                            },
                            {
                              type: 'rect',
                              key: 'blue',
                              name: 'Patch blue',
                              x: 55,
                              y: 37,
                              width: 20,
                              height: 20,
                              fill: '#0000ff'
                            }
                          ]
                        }
                      ]
                    }
                  }
                },
                {
                  id: 'group',
                  name: 'api_hierarchy_groupElements',
                  arguments: {},
                  selectAt: 'step',
                  target: {
                    field: 'elementIds',
                    query: {
                      scope: 'region',
                      bounds: { x: 100, y: 80, width: 200, height: 160 },
                      filter: { name: { prefix: 'Patch ' } },
                      expectedCount: 2
                    }
                  }
                },
                {
                  id: 'move',
                  name: 'api_element_updateElementProperties',
                  arguments: {
                    elementIds: [
                      { kind: 'step', step: 'group', path: groupPath }
                    ],
                    values: { x: 5, y: 10 }
                  }
                },
                {
                  id: 'overview',
                  name: 'design_operations.inspect_drawing',
                  arguments: {
                    arguments: {
                      elementId: {
                        kind: 'step',
                        step: 'group',
                        path: groupPath
                      },
                      view: 'overview'
                    }
                  }
                },
                {
                  id: 'detail',
                  name: 'design_operations.inspect_drawing',
                  arguments: {
                    arguments: {
                      elementId: {
                        kind: 'step',
                        step: 'group',
                        path: groupPath
                      },
                      region: { x: 0, y: 0, width: 40, height: 30 }
                    }
                  }
                }
              ],
              inspection: 'defer',
              delivery: {
                fields: {
                  groupId: { step: 'group', path: groupPath },
                  targets: { step: 'create', path: '/createdTargets' },
                  overview: { step: 'overview', path: '/actionResults' },
                  detail: { step: 'detail', path: '/actionResults' }
                }
              }
            })
          },
          {
            type: 'message',
            id: 'sequence-done',
            role: 'assistant',
            status: 'completed',
            content: [
              {
                type: 'output_text',
                annotations: [],
                text: JSON.stringify({
                  batchId: 'sequence-done',
                  actions: [
                    {
                      id: 'report',
                      name: 'report_outcome',
                      arguments: {
                        outcome: 'completed',
                        message:
                          'Grouped the patches and moved their parent, then captured overview and detail.'
                      },
                      summary: 'Report the sequence'
                    }
                  ]
                })
              }
            ]
          }
        ],
        removeImages ? 'omit-image' : undefined
      )

      await withConversationApp(page, testInfo, fixture, async (appURL) => {
        const document = createTestDocumentIdentity()

        await page.goto(appURL + document.url)
        await waitForAppReady(page)
        const peer = await page.context().newPage()

        await peer.goto(appURL + document.url)
        await waitForAppReady(peer)
        const history = await getUndoHistoryDepth(page)

        const count = (target = page) =>
          target.evaluate(async () => {
            const { default: core } = await import('../src/contexts')

            return core.getCanonicalElementCount()
          })

        const beforeCount = await count()

        await page.bringToFront()
        await page.getByRole('button', { name: 'Open Agent' }).click()
        await page
          .getByLabel('Message Agent')
          .fill(
            'Create two patches under a translated parent, group the current regional targets, move the new group and capture overview and detail.'
          )
        await page.getByRole('button', { name: 'Send', exact: true }).click()
        await expect
          .poll(() => fixture.requests.length, { timeout: 45000 })
          .toBe(2)
        const reply = fixture.toolReply('sequence')

        expect(reply.success, JSON.stringify(reply)).toBe(true)
        await expect(
          page.getByTestId('ai-agent-message').last()
        ).toHaveAttribute('data-outcome', 'success')
        expect(fixture.toolCalls()).toHaveLength(1)
        const values: unknown[] = reply.contentItems.flatMap((item) =>
          'text' in item ? [JSON.parse(item.text)] : []
        )
        const value = values
          .filter(isRecord)
          .find((item) => isRecord(item.fields))

        if (
          !value ||
          !isRecord(value.fields) ||
          typeof value.fields.groupId !== 'string'
        ) {
          throw Error('Missing actual group result identity')
        }

        const groupId = value.fields.groupId
        const state = await page.evaluate(async (groupId) => {
          const { default: core } = await import('../src/contexts')
          const all = [...core.deps.sceneTree.getAllElements().entries()]
          const red = all.find(
            ([, element]) => element.get('name') === 'Patch red'
          )
          const blue = all.find(
            ([, element]) => element.get('name') === 'Patch blue'
          )
          const parent = all.find(
            ([, element]) => element.get('name') === 'Original parent'
          )

          if (!red || !blue || !parent) {
            throw Error('Missing actual created objects')
          }

          return {
            redId: red[0],
            blueId: blue[0],
            redWorld: core.elementLocalToWorkspace(red[0], { x: 0, y: 0 }),
            blueWorld: core.elementLocalToWorkspace(blue[0], { x: 0, y: 0 }),
            redParent: core.getElementMetadata(red[0])?.parentId,
            blueParent: core.getElementMetadata(blue[0])?.parentId,
            groupParent: core.getElementMetadata(groupId)?.parentId,
            originalParent: parent[0],
            parentWorld: core.elementLocalToWorkspace(parent[0], {
              x: 0,
              y: 0
            }),
            childOrder: core.getElementChildren(groupId, 0, 10).elementIds
          }
        }, groupId)

        // Preparation normalizes the parent's minimum child offset (-5, 7).
        // Explicit Group geometry updates also normalize enclosing Group bounds.
        // The later move adds (5, 10) without moving children a second time.
        expect.soft(state.parentWorld).toEqual({ x: 120, y: 107 })
        expect.soft(state.redWorld).toEqual({ x: 120, y: 107 })
        expect.soft(state.blueWorld).toEqual({ x: 180, y: 137 })
        expect.soft(state.redParent).toBe(groupId)
        expect.soft(state.blueParent).toBe(groupId)
        expect.soft(state.groupParent).toBe(state.originalParent)
        expect.soft(state.childOrder).toEqual([state.redId, state.blueId])
        expect(value.fields.targets).toEqual([
          {
            compositionId: expect.any(String),
            keyToId: expect.objectContaining({
              red: state.redId,
              blue: state.blueId,
              parent: state.originalParent
            })
          }
        ])
        expect(await count()).toBe(beforeCount + 5)

        const originals = reply.contentItems.flatMap((item) =>
          'imageUrl' in item && typeof item.imageUrl === 'string'
            ? [item.imageUrl]
            : []
        )

        expect(originals).toHaveLength(2)
        expect(new Set(originals).size).toBe(2)
        const output = fixture.successorContent('sequence')

        if (!Array.isArray(output)) {
          throw Error('Missing actual native content')
        }

        const delivered = output
          .filter(isRecord)
          .filter((item) => item.type === 'input_image')
          .map((item) => item.image_url)

        const assertImages = () =>
          expect(delivered, 'Ordered complete capture delivery').toEqual(
            originals
          )

        if (removeImages) {
          expect(delivered).toEqual([])
          expect(assertImages).toThrow(/Ordered complete capture delivery/)
        } else {
          assertImages()
        }

        for (const [index, url] of originals.entries()) {
          expect(url).toMatch(/^data:image\/png;base64,/)
          const bytes = Buffer.from(url.split(',')[1], 'base64')

          await writeFile(
            testInfo.outputPath(
              index ? 'sequence-detail.png' : 'sequence-overview.png'
            ),
            bytes
          )
          const { data, info } = await sharp(bytes)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true })
          const size = index
            ? { width: 40, height: 30 }
            : { width: 80, height: 50 }

          const pixel = (x: number, y: number) => {
            const offset =
              (Math.floor((y * info.height) / size.height) * info.width +
                Math.floor((x * info.width) / size.width)) *
              info.channels

            return [...data.subarray(offset, offset + 4)]
          }

          expect.soft(pixel(2, 2)).toEqual([255, 0, 0, 255])
          expect.soft(pixel(35, 20)).toEqual([255, 255, 255, 255])
          if (index) {
            expect({ width: info.width, height: info.height }).toEqual(size)
          } else {
            expect.soft(pixel(65, 37)).toEqual([0, 0, 255, 255])
          }
        }

        const completed = await getCoreDocumentDigest(page)

        await peer.bringToFront()
        await expect
          .poll(() => getCoreDocumentDigest(peer, beforeCount + 5))
          .toEqual(completed)
        expect(await getUndoHistoryDepth(page)).toBe(history + 1)
        expect(await getUndoHistoryDepth(peer)).toBe(0)
        await undo(page)
        await expect.poll(() => count()).toBe(beforeCount)
        await peer.bringToFront()
        await expect.poll(() => count(peer)).toBe(beforeCount)
        await redo(page)
        await expect
          .poll(() => getCoreDocumentDigest(page, beforeCount + 5))
          .toEqual(completed)
        await peer.bringToFront()
        await expect
          .poll(() => getCoreDocumentDigest(peer, beforeCount + 5))
          .toEqual(completed)
        await page.screenshot({
          path: testInfo.outputPath('completed-sequence.png')
        })
      })
    }
  )
}

test('executes real staged template reuse and mechanical repair before applying the next part', async ({
  page
}, testInfo) => {
  test.setTimeout(150000)
  const framePath = '/actionResults/0/result/compositionId'
  const frame = { kind: 'step', step: 'base-apply', path: framePath }
  const adjustmentTarget = {
    field: 'elementIds',
    query: {
      scope: 'region',
      bounds: { x: 0, y: 0, width: 220, height: 180 },
      filter: { name: { prefix: 'Adjustment target' } },
      expectedCount: 1
    }
  }
  const grid = {
    type: 'surface-grid',
    key: 'marks',
    name: 'Markers',
    rows: 1,
    columns: 2,
    order: 'cell-major',
    boundary: [
      { x: 0, y: 0, z: 0 },
      { x: 40, y: 0, z: 0 },
      { x: 40, y: 0, z: 20 },
      { x: 0, y: 0, z: 20 }
    ],
    motifs: { template: 'marks' }
  }
  const projection = {
    azimuth: 0,
    elevation: 0,
    scale: 1,
    originX: 0,
    originY: 20
  }
  const fixture = await createNativeProviderFixture([
    {
      type: 'function_call',
      id: 'stages',
      call_id: 'stages',
      namespace: 'design_operations',
      name: 'execute_design',
      arguments: JSON.stringify({
        inspection: 'defer',
        stages: [
          {
            id: 'base',
            operations: [
              {
                id: 'base-source',
                name: 'prepare_design',
                arguments: {
                  draft: {
                    type: 'frame',
                    key: 'base',
                    name: 'Stage base',
                    x: 10,
                    y: 10,
                    width: 140,
                    height: 100,
                    projection,
                    motifTemplates: {
                      marks: [
                        {
                          key: 'square',
                          name: 'Square',
                          fill: '#e02020',
                          vertices: [
                            { u: 0.1, v: 0.1 },
                            { u: 0.9, v: 0.1 },
                            { u: 0.9, v: 0.9 },
                            { u: 0.1, v: 0.9 }
                          ]
                        }
                      ]
                    },
                    children: [
                      grid,
                      {
                        type: 'rect',
                        key: 'adjust',
                        name: 'Adjustment target',
                        x: 110,
                        y: 20,
                        width: 10,
                        height: 10,
                        fill: '#303030'
                      }
                    ]
                  }
                }
              }
            ],
            apply: [
              {
                id: 'base-apply',
                name: 'apply_prepared_design',
                arguments: {
                  artifactId: {
                    kind: 'step',
                    step: 'base-source',
                    path: '/artifactId'
                  }
                }
              },
              {
                id: 'resize-child',
                name: 'api_element_updateElementProperties',
                arguments: { values: { width: 40 } },
                selectAt: 'step',
                target: adjustmentTarget
              }
            ]
          },
          {
            id: 'detail',
            operations: [
              {
                id: 'detail-source',
                name: 'prepare_design',
                arguments: {
                  draft: {
                    type: 'group',
                    key: 'detail',
                    name: 'Stage detail',
                    x: 50,
                    y: 50,
                    projection,
                    motifTemplates: {
                      kind: 'named',
                      name: 'markerTemplate',
                      path: ''
                    },
                    children: [
                      {
                        ...grid,
                        motifs: {
                          template: 'marks',
                          overrides: { square: { fill: '#2040e0' } }
                        }
                      }
                    ]
                  }
                }
              }
            ],
            iteration: {
              id: 'fit',
              stateSchema: { type: 'null' },
              state: null,
              check: {
                id: 'fit-check',
                name: 'review_design',
                arguments: { arguments: { elementId: frame } }
              },
              repairs: [
                {
                  id: 'fit-repair',
                  name: 'api_element_updateElementProperties',
                  arguments: { values: { x: 10, y: 20 } },
                  selectAt: 'step',
                  target: adjustmentTarget
                }
              ],
              next: { kind: 'state', path: '' },
              maxIterations: 1
            },
            apply: [
              {
                id: 'detail-apply',
                name: 'apply_prepared_design',
                arguments: {
                  artifactId: {
                    kind: 'step',
                    step: 'detail-source',
                    path: '/artifactId'
                  },
                  parentId: frame
                }
              },
              {
                id: 'capture',
                name: 'inspect_drawing',
                arguments: { arguments: { elementId: frame, view: 'overview' } }
              }
            ]
          }
        ],
        retain: {
          markerTemplate: {
            step: 'base-source',
            source: 'input',
            path: '/draft/motifTemplates'
          }
        },
        delivery: {
          fields: {
            baseId: { step: 'base-apply', path: framePath },
            detailId: { step: 'detail-apply', path: framePath },
            image: { step: 'capture', path: '/actionResults' }
          }
        }
      })
    },
    {
      type: 'message',
      id: 'stage-done',
      role: 'assistant',
      status: 'completed',
      content: [
        {
          type: 'output_text',
          annotations: [],
          text: JSON.stringify({
            batchId: 'stage-done',
            actions: [
              {
                id: 'report',
                name: 'report_outcome',
                arguments: {
                  outcome: 'completed',
                  message: 'Both parts applied after the prescribed correction.'
                },
                summary: 'Report staged completion'
              }
            ]
          })
        }
      ]
    }
  ])

  await withConversationApp(page, testInfo, fixture, async (appURL) => {
    const receipts: Record<string, unknown>[] = []

    page.on('request', (request) => {
      if (
        request.method() !== 'POST' ||
        !request.url().endsWith('/api/ai/action-batch')
      ) {
        return
      }

      const value: unknown = request.postDataJSON()

      if (isRecord(value) && Array.isArray(value.actionResults)) {
        receipts.push(value)
      }
    })
    await page.goto(appURL + createTestDocumentIdentity().url)
    await waitForAppReady(page)
    const history = await getUndoHistoryDepth(page)
    const before = await getCoreDocumentDigest(page)

    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill(
        'Build the base, widen the adjustment rectangle to 40 pixels, move it to local (10,20) if it overflows, then reuse the square motif in blue for the detail part.'
      )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect.poll(() => fixture.requests.length, { timeout: 60000 }).toBe(2)
    const reply = fixture.toolReply('stages')

    await writeFile(
      testInfo.outputPath('stage-receipts.json'),
      JSON.stringify({ receipts, reply }, null, 2)
    )
    expect(reply.success, JSON.stringify(reply)).toBe(true)
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    expect(fixture.toolCalls()).toHaveLength(1)
    const values: unknown[] = reply.contentItems.flatMap((item) =>
      'text' in item ? [JSON.parse(item.text)] : []
    )
    const result = values
      .filter(isRecord)
      .find((value) => isRecord(value.fields))

    if (
      !result ||
      !isRecord(result.fields) ||
      typeof result.fields.baseId !== 'string' ||
      typeof result.fields.detailId !== 'string'
    ) {
      throw Error('Missing actual stage identities')
    }

    expect(result.stages).toEqual([
      { id: 'base', status: 'applied' },
      { id: 'detail', status: 'applied' }
    ])
    expect(result.saved).toEqual([
      expect.objectContaining({ name: 'markerTemplate' })
    ])
    const actions = receipts.flatMap((receipt) =>
      Array.isArray(receipt.actionResults)
        ? receipt.actionResults.filter(isRecord)
        : []
    )

    expect(actions.map((action) => action.actionName)).toEqual([
      'apply_prepared_design',
      'resolve_design_targets',
      'api_element_updateElementProperties',
      'review_design',
      'resolve_design_targets',
      'api_element_updateElementProperties',
      'review_design',
      'apply_prepared_design',
      'inspect_drawing'
    ])
    expect(actions[3]).toHaveProperty(
      'result.verification.status',
      'repairable'
    )
    expect(actions[6]).toHaveProperty('result.verification.status', 'pass')
    const ids = { base: result.fields.baseId, detail: result.fields.detailId }
    const state = await page.evaluate(async (ids) => {
      const { default: core } = await import('../src/contexts')
      const all = [...core.deps.sceneTree.getAllElements().entries()]
      const target = all.find(
        ([, element]) => element.get('name') === 'Adjustment target'
      )

      if (!target) {
        throw Error('Missing correction target')
      }

      return {
        types: all
          .filter(([, e]) => e.get('type') !== 'workspace')
          .map(([, e]) => e.get('type'))
          .sort(),
        baseWidth: core.getElementComputedData(ids.base)?.width,
        targetId: target[0],
        target: {
          ...core.getElementComputedData(target[0]),
          parentId: core.getElementMetadata(target[0])?.parentId
        },
        detailParent: core.getElementMetadata(ids.detail)?.parentId,
        vectors: all
          .filter(([, e]) => e.get('type') === 'vector')
          .map(([id]) => ({
            parentId: core.getElementMetadata(id)?.parentId,
            fills: core.getElementComputedData(id)?.fills
          }))
      }
    }, ids)

    expect(state.types).toEqual([
      'frame',
      'group',
      'rect',
      'vector',
      'vector',
      'vector',
      'vector'
    ])
    expect(actions[3]).toHaveProperty('result.findings', [
      expect.objectContaining({
        kind: 'container-overflow',
        elementId: state.targetId,
        parentId: ids.base,
        right: 10
      })
    ])
    expect(actions[6]).toHaveProperty('result.findings', [])
    expect(state.baseWidth).toBe(140)
    expect(state.target).toMatchObject({
      x: 10,
      y: 20,
      width: 40,
      height: 10,
      parentId: ids.base
    })
    for (const index of [1, 4]) {
      expect(actions[index]).toHaveProperty('result.elementIds', [
        state.targetId
      ])
      expect(actions[index + 1]).toHaveProperty('result.value.acceptedIds', [
        state.targetId
      ])
    }

    expect(state.detailParent).toBe(ids.base)
    for (const [id, color] of [
      [ids.base, '#e02020'],
      [ids.detail, '#2040e0']
    ]) {
      const vectors = state.vectors.filter((vector) => vector.parentId === id)

      expect(vectors).toHaveLength(2)
      for (const vector of vectors) {
        expect(JSON.stringify(vector.fills)).toContain(color)
      }
    }

    const images = reply.contentItems.filter((item) => 'imageUrl' in item)

    expect(images).toHaveLength(1)
    const successor = fixture.successorContent('stages')

    if (!Array.isArray(successor)) {
      throw Error('Missing actual staged successor')
    }

    expect(
      successor.filter(isRecord).filter((item) => item.type === 'input_image')
    ).toHaveLength(1)
    const completed = await getCoreDocumentDigest(page)

    expect(await getUndoHistoryDepth(page)).toBe(history + 1)
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(before)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(completed)
    await page.screenshot({ path: testInfo.outputPath('completed-stages.png') })
  })
})

for (const corruptVerdict of [false, true]) {
  test(
    corruptVerdict
      ? 'detects a corrupted mechanical verdict at the canonical consumer despite native success'
      : 'repairs a current canonical target through a real host iteration without a model round trip',
    async ({ page }, testInfo) => {
      test.setTimeout(150000)
      let target: { frame: string; child: string } | undefined
      const fixture = await createNativeProviderFixture([
        () => {
          if (!target) {
            throw Error('Missing current selected targets')
          }

          return {
            type: 'function_call',
            id: 'repair',
            call_id: 'repair',
            namespace: 'design_operations',
            name: 'execute_design',
            arguments: JSON.stringify({
              operations: [
                {
                  id: 'current',
                  name: 'api_core_getElementMetadata',
                  arguments: { elementId: target.frame }
                }
              ],
              inspection: 'defer',
              iteration: {
                id: 'fit',
                stateSchema: { type: 'null' },
                state: null,
                check: {
                  id: 'check',
                  name: 'design_operations.review_design',
                  arguments: { arguments: { elementId: target.frame } }
                },
                repairs: [
                  {
                    id: 'move',
                    name: 'api_element_updateElementProperties',
                    arguments: {
                      elementIds: [target.child],
                      values: { x: 10, y: 20 }
                    }
                  }
                ],
                next: { kind: 'state', path: '' },
                maxIterations: 1
              }
            })
          }
        },
        {
          type: 'message',
          id: 'repair-done',
          role: 'assistant',
          status: 'completed',
          content: [
            {
              type: 'output_text',
              annotations: [],
              text: JSON.stringify({
                batchId: 'repair-done',
                actions: [
                  {
                    id: 'report',
                    name: 'report_outcome',
                    arguments: {
                      outcome: 'completed',
                      message: 'The mechanical iteration passed.'
                    },
                    summary: 'Report mechanical completion'
                  }
                ]
              })
            }
          ]
        }
      ])

      await withConversationApp(page, testInfo, fixture, async (appURL) => {
        const receipts: Record<string, unknown>[] = []
        let corruptions = 0

        await page.route('**/api/ai/action-batch', async (route) => {
          const request = route.request()

          if (request.method() !== 'POST') {
            await route.continue()

            return
          }

          const value: unknown = request.postDataJSON()

          if (!isRecord(value) || !Array.isArray(value.actionResults)) {
            await route.continue()

            return
          }

          receipts.push(structuredClone(value))
          if (corruptVerdict && corruptions === 0) {
            const check = value.actionResults
              .filter(isRecord)
              .find((action) => action.actionName === 'review_design')

            if (
              check &&
              isRecord(check.result) &&
              isRecord(check.result.verification) &&
              check.result.verification.status === 'repairable'
            ) {
              check.result.verification.status = 'pass'
              corruptions++
              await route.continue({ postData: JSON.stringify(value) })

              return
            }
          }

          await route.continue()
        })
        await page.goto(appURL + createTestDocumentIdentity().url)
        await waitForAppReady(page)
        target = await page.evaluate(async () => {
          const { elementApis, selectionApis, transactionApis } =
            await import('../src/common-apis')
          const { default: core } = await import('../src/contexts')

          return transactionApis.runTransaction(() => {
            const options: EVENT_OPTIONS = {
              sharedDelivery: 'immediate',
              undoable: true
            }
            const frame = elementApis.createElement(
              {
                type: 'frame',
                workspacePosition: { x: 0, y: 0 },
                width: 100,
                height: 100
              },
              options
            )

            if (!frame) {
              throw Error('Missing initial Frame')
            }

            const child = core.createElementInParent(
              {
                type: 'rect',
                name: 'Iteration child',
                x: 110,
                y: 20,
                width: 10,
                height: 10
              },
              frame,
              undefined,
              options
            )

            if (!child) {
              throw Error('Missing initial child')
            }

            selectionApis.selectElements([frame])

            return { frame, child }
          })
        })
        const initial = await getCoreDocumentDigest(page)
        const peer = await page.context().newPage()

        await peer.goto(page.url())
        await waitForAppReady(peer)
        await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(initial)
        const history = await getUndoHistoryDepth(page)

        await page.bringToFront()
        await page.getByRole('button', { name: 'Open Agent' }).click()
        await page
          .getByLabel('Message Agent')
          .fill(
            `Review Frame ${target.frame}; if its child ${target.child} overflows, set that child's local position to (10,20) and review again.`
          )
        await page.getByRole('button', { name: 'Send', exact: true }).click()
        await expect
          .poll(() => fixture.requests.length, { timeout: 60000 })
          .toBe(2)
        const reply = fixture.toolReply('repair')

        await writeFile(
          testInfo.outputPath('iteration-receipts.json'),
          JSON.stringify({ receipts, reply, corruptions }, null, 2)
        )
        expect(reply.success, JSON.stringify(reply)).toBe(true)
        expect(fixture.toolCalls()).toHaveLength(1)
        expect(JSON.stringify(fixture.requests[0].input)).toContain(
          target.child
        )
        await expect(
          page.getByTestId('ai-agent-message').last()
        ).toHaveAttribute(
          'data-outcome',
          corruptVerdict ? 'no-change' : 'success'
        )
        const actions = receipts.flatMap((receipt) =>
          Array.isArray(receipt.actionResults)
            ? receipt.actionResults.filter(isRecord)
            : []
        )

        expect(actions.map((action) => action.actionName)).toEqual(
          corruptVerdict
            ? ['api_core_getElementMetadata', 'review_design']
            : [
                'api_core_getElementMetadata',
                'review_design',
                'api_element_updateElementProperties',
                'review_design'
              ]
        )
        expect(actions[1]).toHaveProperty(
          'result.verification.status',
          'repairable'
        )
        if (!corruptVerdict) {
          expect(actions[3]).toHaveProperty(
            'result.verification.status',
            'pass'
          )
        }

        const position = await page.evaluate(async (id) => {
          const { default: core } = await import('../src/contexts')
          const value = core.getElementComputedData(id)

          return { x: value?.x, y: value?.y }
        }, target.child)

        const assertPosition = () =>
          expect(
            position,
            'Prescribed position after mechanical review'
          ).toEqual({ x: 10, y: 20 })

        if (corruptVerdict) {
          expect(corruptions).toBe(1)
          expect(assertPosition).toThrow(
            /Prescribed position after mechanical review/
          )
          expect(position).toEqual({ x: 110, y: 20 })
          expect(await getCoreDocumentDigest(page)).toEqual(initial)
          expect(await getUndoHistoryDepth(page)).toBe(history)
        } else {
          expect(corruptions).toBe(0)
          assertPosition()
          const completed = await getCoreDocumentDigest(page)

          expect(await getUndoHistoryDepth(page)).toBe(history + 1)
          await undo(page)
          await expect.poll(() => getCoreDocumentDigest(page)).toEqual(initial)
          await redo(page)
          await expect
            .poll(() => getCoreDocumentDigest(page))
            .toEqual(completed)
        }

        const actual = fixture.successorOutput('repair')

        expect(actual).toContain('"status":"pass"')
      })
    }
  )
}
