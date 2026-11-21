import { expect, test, type Page } from '@playwright/test'
import type { AiActionBatch, AiProvider } from '@asyra/ai-agent-runtime'
import { writeFile } from 'node:fs/promises'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getTransactionSnapshot,
  getPersistedDocumentDigest,
  redo,
  undo,
  waitForAppReady
} from './test-utils'

test.use({ trace: 'retain-on-failure' })

const waitForCollaboration = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')

        return getActiveCollaborationHandle()?.getStatus()
      })
    )
    .toBe('connected')

// The external model is scripted; registry, finite iteration, browser actions,
// canonical checks, Factory, collaboration and document persistence remain real.
for (const mode of [
  'complete',
  'library-reuse',
  'peer-invalidation',
  'basis-changed',
  'no-progress',
  'cancel-after-write',
  'interrupted-after-write'
] as const) {
  let title = `aggregate mechanical repair preserves independent passes through history and durable reload - ${mode}`

  if (mode === 'library-reuse') {
    title =
      'mechanical repair saves and reopens its library without replaying canvas work'
  } else if (mode === 'peer-invalidation') {
    title =
      'mechanical repair rechecks only the pass invalidated by a peer and its Undo'
  }

  test(title, async ({ page, browser }, testInfo) => {
    const { createLocalOperationTools } =
      await import('../server/local-operation-tools')
    const { BrowserBatchExecutionError, requireBatchSuccess } =
      await import('@asyra/ai-agent-runtime/node')
    const { createLocalToolHost } = await import('../server/local-tool-host')
    const { createDesignCheckResults, designCheckInputSchema } =
      await import('../server/design-check-results')
    const { prescribedPositionsSchema } =
      await import('../src/ai/prescribed-position-contract')
    // Element-target expansion metadata belongs to the registered tool, not
    // the recipe's own input binding language. Keep every value constraint.
    const { 'x-design-element-binding': _binding, ...positionElementSchema } =
      prescribedPositionsSchema.items.properties.elementId
    const positionsSchema = {
      ...prescribedPositionsSchema,
      items: {
        ...prescribedPositionsSchema.items,
        properties: {
          ...prescribedPositionsSchema.items.properties,
          elementId: positionElementSchema
        }
      }
    }

    type ProviderInput = import('@asyra/ai-agent-runtime').AiProviderInput
    type Receipt = import('@asyra/ai-agent-runtime').AiBatchReceipt
    const { createSqliteToolStore } =
      await import('@asyra/ai-agent-runtime/node')

    const openStore = () =>
      createSqliteToolStore({
        directory: testInfo.outputPath('tool-library'),
        capacity: 32,
        recordBytes: 262144,
        totalBytes: 1048576
      })

    let database = await openStore()
    let failEligibility = false
    const store: import('@asyra/ai-agent-runtime').AiToolStore = {
      read: (key) => database.read(key),

      list: (limit) => database.list(limit),

      write: (value) => {
        if (
          failEligibility &&
          (value.record as { availability?: string }).availability ===
            'eligible'
        ) {
          throw new Error('Injected library acknowledgement failure')
        }

        return database.write(value)
      }
    }
    const document = createTestDocumentIdentity()
    const peer = await browser.newPage({
      baseURL: String(testInfo.project.use.baseURL)
    })
    let bridgeFailure: unknown
    let recoveryBefore:
      Awaited<ReturnType<typeof getCoreDocumentDigest>> | undefined
    let basisChanged = false
    const dispatched: string[] = []
    const measured: string[] = []
    let primaryCalls = 0

    try {
      await page.goto(document.url)
      await waitForAppReady(page)
      await waitForCollaboration(page)
      const ids = await page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')
        const { transactionApis } = await import('../src/common-apis')

        return transactionApis.runTransaction(() => {
          const roots = core.createElementsInParent(
            Array.from({ length: 8 }, (_, i) => ({
              type: 'frame',
              x: i * 140,
              y: 20,
              width: 100,
              height: 100
            })),
            core.getCurrentWorkspaceId()
          )
          const children = roots.map((parentId, i) =>
            core.createElementInParent(
              {
                type: 'rect',
                x: i === 2 ? 90 : 10,
                y: 10,
                width: 30,
                height: 20
              },
              parentId
            )
          )

          return { roots, children }
        })
      })
      const before = await getCoreDocumentDigest(page)

      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(before)
      await peer.goto(document.url)
      await waitForAppReady(peer)
      await waitForCollaboration(peer)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(before)
      await page.exposeFunction(
        'driveMechanicalRepair',
        async (input: ProviderInput) => {
          primaryCalls++
          const controller = new AbortController()
          let checks = createDesignCheckResults()
          const events: {
            phase: string
            callId: string
            parentCallId?: string
            name: string
          }[] = []

          const createHost = (requestId: string) =>
            createLocalToolHost({
              requestId,
              signal: controller.signal,

              observe: (event) => {
                events.push({
                  phase: event.phase,
                  callId: event.call.callId,
                  parentCallId: event.call.parentCallId,
                  name: event.call.name
                })
              },

              capacity: 32,
              receiptCapacity: 64,
              artifactCapacity: 32,
              limits: {
                bytes: 48000,
                steps: 20,
                bindings: 200,
                bindingDepth: 32,
                issues: 10
              },
              store,

              createGroups: (ownership) => [
                {
                  name: 'design_operations',
                  description: 'Actual mechanical operations',
                  owner: createLocalOperationTools(
                    input.actions,
                    {
                      modelActions: (value) => value,

                      resolveBatch: (value) => value,

                      checkResults: checks
                    },
                    async (batch) => {
                      dispatched.push(
                        ...batch.actions.map((action) => action.name)
                      )
                      for (const action of batch.actions) {
                        if (action.name === 'review_design') {
                          measured.push(String(action.arguments.elementId))
                        }
                      }

                      if (
                        mode === 'basis-changed' &&
                        !basisChanged &&
                        batch.actions.some(
                          (action) =>
                            action.name === 'apply_prescribed_positions'
                        )
                      ) {
                        basisChanged = true
                        await page.evaluate(async (parentId) => {
                          const { core } =
                            await import('../src/testing/runtime-access')
                          const { transactionApis } =
                            await import('../src/common-apis')

                          transactionApis.runTransaction(() =>
                            core.updateElementProperties([
                              { elementId: parentId, values: { x: 350 } }
                            ])
                          )
                        }, ids.roots[2])
                        recoveryBefore = await getCoreDocumentDigest(page)
                        expect(recoveryBefore).not.toEqual(before)
                      }

                      const receipt = await page.evaluate(
                        async (serialized) => {
                          const { testRuntimeState } =
                            await import('../src/testing/runtime-access')
                          const execute = testRuntimeState.get<
                            (batch: AiActionBatch) => Promise<Receipt>
                          >('mechanical-integration-execute')

                          if (!execute) {
                            throw new Error('Missing actual runtime executor')
                          }

                          return JSON.parse(
                            JSON.stringify(
                              await execute(JSON.parse(serialized))
                            )
                          )
                        },
                        JSON.stringify(batch)
                      )

                      if (
                        batch.actions.some(
                          (action) =>
                            action.name === 'apply_prescribed_positions'
                        )
                      ) {
                        if (mode === 'cancel-after-write') {
                          controller.abort()
                        }

                        if (mode === 'interrupted-after-write') {
                          throw new BrowserBatchExecutionError(
                            {
                              batchId: batch.batchId,
                              code: 'BROWSER_BATCH_EXECUTION_FAILED',
                              message:
                                'Injected delivery interruption after acknowledged write',
                              executionMs: 0,
                              handlerMs: 0
                            },
                            {
                              ...receipt,
                              failure: {
                                code: 'INJECTED_DELIVERY_FAILURE',
                                message:
                                  'Injected delivery interruption after acknowledged write',
                                stage: 'execution',
                                settlement: 'completed',
                                contextFresh: true
                              }
                            }
                          )
                        }
                      }

                      return requireBatchSuccess(batch, receipt, 0)
                    },
                    { ownership, requestSignal: controller.signal }
                  )
                }
              ]
            })

          let host = createHost('mechanical-integration')

          const invokeReply = (name: string, input: unknown) =>
            host.invoke({ name, input })

          const invoke = async (name: string, input: unknown) =>
            JSON.parse((await invokeReply(name, input)).text)

          try {
            const selection = []

            for (const root of ids.roots) {
              const reply = await invokeReply(
                'design_operations.review_design',
                {
                  arguments: { elementId: root }
                }
              )
              const receipt = JSON.parse(reply.text)

              expect(reply.outcome).toMatchObject({
                status: 'success',
                settlement: 'completed'
              })
              expect(receipt, JSON.stringify(receipt)).toMatchObject({
                mechanicalSelection: { requestId: 'mechanical-integration' }
              })
              selection.push(...receipt.mechanicalSelection.checks)
            }

            const independent = checks
              .read({ includePassed: true })
              .items.filter((item) => item.status === 'pass')

            expect(independent).toHaveLength(7)
            const attachment = await invoke(
              'design_operations.read_design_attachment',
              { arguments: { parentId: ids.roots[2] } }
            )
            const basis = attachment.actionResults[0].result
            const policy = {
              capability: 'set-prescribed-child-position',
              positions: [
                {
                  elementId: ids.children[2],
                  x: mode === 'no-progress' ? 90 : 50,
                  y: 10,
                  attachmentEvidence: {
                    parentId: basis.parentId,
                    workspaceId: basis.workspaceId,
                    evidence: basis.evidence
                  }
                }
              ]
            }
            const state = {
              requestId: 'mechanical-integration',
              checks: selection
            }
            const foreign = await invokeReply(
              'design_operations.verify_design_checks',
              { ...state, requestId: 'another-request' }
            )

            expect(foreign.outcome).toMatchObject({
              status: 'failed',
              settlement: 'not-started'
            })
            const invalid = await invokeReply(
              'design_operations.repair_design_checks',
              {
                ...state,
                policy: {
                  ...policy,
                  positions: [
                    ...policy.positions,
                    { ...policy.positions[0], elementId: ids.children[0] }
                  ]
                }
              }
            )

            expect(invalid.outcome).toMatchObject({
              status: 'failed',
              settlement: 'not-started'
            })
            expect(dispatched).not.toContain('apply_prescribed_positions')

            const definition = (name: string) => {
              const result = host
                .definitions()
                .find((item) => item.name === name)

              if (!result) {
                throw new Error(`Missing ${name}`)
              }

              return result
            }

            const verifier = definition('verify_design_checks'),
              repair = definition('repair_design_checks')

            const fields = (step: string) => ({
              kind: 'object',
              fields: {
                requestId: { kind: 'step', step, path: '/requestId' },
                checks: { kind: 'step', step, path: '/checks' }
              }
            })

            const policySchema = {
              type: 'object',
              additionalProperties: false,
              required: ['capability', 'positions'],
              properties: {
                capability: {
                  type: 'string',
                  enum: ['set-prescribed-child-position']
                },
                positions: positionsSchema
              }
            }
            const recipe = {
              format: 1,
              name: 'correct-selected-container',
              revision: 1,
              description:
                'Verify selected canonical checks and apply only prescribed local positions.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                required: ['selection', 'policy'],
                properties: {
                  selection: designCheckInputSchema,
                  policy: policySchema
                }
              },
              outputSchema: { type: 'string' },
              steps: [
                {
                  id: 'admitted',
                  tool: verifier.registeredName,
                  revision: verifier.revision,
                  input: { kind: 'input', path: '/selection' }
                }
              ],
              iteration: {
                id: 'closed',
                stateSchema: designCheckInputSchema,
                state: fields('admitted'),
                check: {
                  id: 'check',
                  tool: verifier.registeredName,
                  revision: verifier.revision,
                  input: { kind: 'state', path: '' }
                },
                repairs: [
                  {
                    id: 'repair',
                    tool: repair.registeredName,
                    revision: repair.revision,
                    input: {
                      kind: 'object',
                      fields: {
                        ...fields('check').fields,
                        policy: { kind: 'input', path: '/policy' }
                      }
                    }
                  }
                ],
                next: fields('repair'),
                maxIterations: 2
              },
              output: {
                kind: 'step',
                step: 'closed',
                path: '/result/verification/status'
              }
            }
            const submitted = await invoke('tool_library.submit_tool', {
              submissionId: 'correct-selected-container',
              proposal: recipe
            })

            expect(submitted, JSON.stringify(submitted)).toMatchObject({
              ok: true
            })
            if (mode === 'library-reuse') {
              failEligibility = true
            }

            if (mode === 'cancel-after-write') {
              await expect(
                invoke('tool_library.invoke_tool', {
                  name: recipe.name,
                  revision: 1,
                  input: { selection: state, policy }
                })
              ).rejects.toMatchObject({ name: 'AbortError' })
            } else {
              const result = await invoke('tool_library.invoke_tool', {
                name: recipe.name,
                revision: 1,
                input: { selection: state, policy }
              })

              if (mode === 'library-reuse') {
                expect(result, JSON.stringify(result)).toMatchObject({
                  execution: { status: 'success', value: 'pass' },
                  storage: { status: 'unsaved' },
                  receiptId: expect.any(String)
                })
                const beforeSave = await getCoreDocumentDigest(page)
                const historyBeforeSave = await getTransactionSnapshot(page)
                const beforeChecks = checks.read({ includePassed: true })
                const beforeCalls = [...dispatched]

                failEligibility = false
                expect(
                  await invoke('tool_library.save_tool', {
                    name: recipe.name,
                    revision: 1,
                    receiptId: result.receiptId
                  })
                ).toMatchObject({ status: 'saved', availability: 'eligible' })
                expect(await getCoreDocumentDigest(page)).toEqual(beforeSave)
                expect(await getTransactionSnapshot(page)).toEqual(
                  historyBeforeSave
                )
                expect(checks.read({ includePassed: true })).toEqual(
                  beforeChecks
                )
                expect(dispatched).toEqual(beforeCalls)
                await expect
                  .poll(() => getPersistedDocumentDigest(document.fileId))
                  .toEqual(beforeSave)
              } else if (mode === 'complete' || mode === 'peer-invalidation') {
                expect(result, JSON.stringify(result)).toMatchObject({
                  execution: { status: 'success', value: 'pass' },
                  storage: { status: 'saved' }
                })
              } else {
                expect(
                  result.execution.status,
                  JSON.stringify(result)
                ).not.toBe('success')
                expect(result.storage).toBeUndefined()
                if (mode === 'basis-changed') {
                  expect(
                    result.execution.recovery,
                    JSON.stringify(result.execution.recovery)
                  ).toEqual(
                    expect.arrayContaining([
                      expect.objectContaining({
                        name: 'design_operations.repair_design_checks',
                        settlement: 'not-started'
                      })
                    ])
                  )
                  const recoveredReply = await invokeReply(
                    'design_operations.verify_design_checks',
                    {
                      requestId: state.requestId,
                      checks: checks.selection(
                        selection.map((item) => item.checkId)
                      )
                    }
                  )

                  const recovered = JSON.parse(recoveredReply.text)

                  expect(recoveredReply.outcome).toMatchObject({
                    status: 'success',
                    settlement: 'completed'
                  })
                  expect(recovered, JSON.stringify(recovered)).toMatchObject({
                    verification: { status: 'repairable' }
                  })
                  const attachment = await invoke(
                    'design_operations.read_design_attachment',
                    { arguments: { parentId: ids.roots[2] } }
                  )
                  const fresh = attachment.actionResults[0].result
                  const retry = await invoke('tool_library.invoke_tool', {
                    name: recipe.name,
                    revision: 1,
                    input: {
                      selection: {
                        requestId: recovered.requestId,
                        checks: recovered.checks
                      },
                      policy: {
                        ...policy,
                        positions: [
                          {
                            ...policy.positions[0],
                            attachmentEvidence: {
                              parentId: fresh.parentId,
                              workspaceId: fresh.workspaceId,
                              evidence: fresh.evidence
                            }
                          }
                        ]
                      }
                    }
                  })

                  expect(retry, JSON.stringify(retry)).toMatchObject({
                    execution: { status: 'success', value: 'pass' }
                  })
                } else if (mode === 'no-progress') {
                  expect(result.execution.issues).toContain(
                    'Repeated verification progress'
                  )
                } else {
                  expect(JSON.stringify(result.execution.recovery)).toContain(
                    ids.children[2]
                  )
                  const recoveredReply = await invokeReply(
                    'design_operations.verify_design_checks',
                    {
                      requestId: state.requestId,
                      checks: checks.selection(
                        selection.map((item) => item.checkId)
                      )
                    }
                  )

                  const recovered = JSON.parse(recoveredReply.text)

                  expect(recoveredReply.outcome).toMatchObject({
                    status: 'success',
                    settlement: 'completed'
                  })
                  expect(recovered, JSON.stringify(recovered)).toMatchObject({
                    verification: { status: 'pass' }
                  })
                }
              }
            }

            if (mode === 'peer-invalidation') {
              // Keep the real host alive while another actor invalidates one pass.
              const repaired = await getCoreDocumentDigest(page)

              await expect
                .poll(() => getCoreDocumentDigest(peer))
                .toEqual(repaired)

              const currentSelection = () => ({
                requestId: state.requestId,
                checks: checks.selection(selection.map((item) => item.checkId))
              })

              const settled = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )

              expect(settled.verification.status).toBe('pass')
              const firstRead = measured.length

              await peer.evaluate(async (elementId) => {
                const { core } = await import('../src/testing/runtime-access')
                const { transactionApis } = await import('../src/common-apis')

                transactionApis.runTransaction(() =>
                  core.updateElementProperties([
                    { elementId, values: { x: 90 } }
                  ])
                )
              }, ids.children[2])
              const changed = await getCoreDocumentDigest(peer)

              expect(changed).not.toEqual(repaired)
              await expect
                .poll(() => getCoreDocumentDigest(page))
                .toEqual(changed)
              const reopened = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )

              expect(reopened.verification.status).toBe('repairable')
              expect(reopened.unresolved).toHaveLength(1)
              expect(reopened.unresolved[0].checkId).toBe(selection[2].checkId)
              expect(measured.slice(firstRead)).toEqual([ids.roots[2]])
              await undo(peer)
              await expect
                .poll(() => getCoreDocumentDigest(page))
                .toEqual(repaired)
              await expect
                .poll(() => getPersistedDocumentDigest(document.fileId))
                .toEqual(repaired)
              const restored = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )

              expect(restored.verification.status).toBe('pass')
              expect(restored.unresolved).toEqual([])
              expect(measured.slice(firstRead)).toEqual([
                ids.roots[2],
                ids.roots[2]
              ])
              expect(restored.checks[2].revision).toBeGreaterThan(
                settled.checks[2].revision
              )
            }

            expect(
              checks
                .read({ includePassed: true })
                .items.filter((item) =>
                  independent.some((prior) => prior.id === item.id)
                )
            ).toEqual(independent)
            if (mode === 'library-reuse') {
              const beforeReuse = await getCoreDocumentDigest(page)
              const historyBeforeReuse = await getTransactionSnapshot(page)

              await host.dispose()
              database.close()
              database = await openStore()
              checks = createDesignCheckResults()
              host = createHost('mechanical-fresh-request')
              expect(await host.load()).toMatchObject({
                loaded: [recipe.name],
                unavailable: []
              })
              expect(
                await invoke('tool_library.save_tool', {
                  name: recipe.name,
                  revision: 1,
                  receiptId: 'expired-receipt'
                })
              ).toMatchObject({
                available: false,
                code: 'TOOL_INPUT_INVALID',
                stage: 'admission',
                settlement: 'not-started',
                toolOutcome: { status: 'failed', settlement: 'not-started' }
              })
              expect(await getCoreDocumentDigest(page)).toEqual(beforeReuse)
              const old = await invokeReply(
                'design_operations.verify_design_checks',
                state
              )

              expect(old.outcome).toMatchObject({
                status: 'failed',
                settlement: 'not-started'
              })
              expect(JSON.parse(old.text)).toMatchObject({ available: false })
              const fresh = await invoke('design_operations.review_design', {
                arguments: { elementId: ids.roots[2] }
              })
              const attachment = await invoke(
                'design_operations.read_design_attachment',
                { arguments: { parentId: ids.roots[2] } }
              )
              const basis = attachment.actionResults[0].result
              const reused = await invoke('tool_library.invoke_tool', {
                name: recipe.name,
                revision: 1,
                input: {
                  selection: fresh.mechanicalSelection,
                  policy: {
                    ...policy,
                    positions: [
                      {
                        ...policy.positions[0],
                        x: 17,
                        attachmentEvidence: {
                          parentId: basis.parentId,
                          workspaceId: basis.workspaceId,
                          evidence: basis.evidence
                        }
                      }
                    ]
                  }
                }
              })

              expect(reused).toMatchObject({
                execution: { status: 'success', value: 'pass' },
                storage: { status: 'saved' }
              })
              expect(await getCoreDocumentDigest(page)).toEqual(beforeReuse)
              expect(await getTransactionSnapshot(page)).toEqual(
                historyBeforeReuse
              )
            }

            expect(
              dispatched.filter((name) => name === 'apply_prescribed_positions')
            ).toHaveLength(mode === 'basis-changed' ? 2 : 1)
            for (const started of events.filter(
              (event) => event.phase === 'started'
            )) {
              expect(
                events.filter(
                  (event) =>
                    event.callId === started.callId && event.phase !== 'started'
                )
              ).toHaveLength(1)
            }

            const nestedRepair = events.find(
              (event) =>
                event.name === 'design_operations.repair_design_checks' &&
                event.parentCallId &&
                event.phase === 'started'
            )

            expect(nestedRepair).toBeDefined()

            return {
              batchId: 'mechanical-finished',
              actions: [
                {
                  id: 'done',
                  name: 'report_outcome',
                  arguments: {
                    outcome: 'unsupported',
                    message:
                      'Mechanical checks passed. Primary visual judgment remains separate.'
                  },
                  summary: 'Report mechanical completion'
                }
              ]
            }
          } catch (error) {
            bridgeFailure = error
            throw error
          } finally {
            await host.dispose()
          }
        }
      )
      const result = await page.evaluate(async () => {
        const { createAiStartup } = await import('../src/ai/startup')
        const { createAiConfirmationBroker } =
          await import('../src/ai/confirmation')
        const { createAiHistoryProjection } =
          await import('../src/common-apis/history')
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        let providerError: string | undefined
        const provider: AiProvider = {
          requestActionBatch: async (input, { executeBatch }) => {
            if (!executeBatch) {
              throw new Error('Missing runtime executor')
            }

            testRuntimeState.set('mechanical-integration-execute', executeBatch)
            try {
              return await (
                window as unknown as {
                  driveMechanicalRepair(input: unknown): Promise<AiActionBatch>
                }
              ).driveMechanicalRepair(JSON.parse(JSON.stringify(input)))
            } catch (error) {
              providerError = String(error)
              throw error
            }
          }
        }
        const startup = createAiStartup({
          createProvider: () => provider,

          createConfirmation: createAiConfirmationBroker,
          createHistory: createAiHistoryProjection
        })

        try {
          const outcome = await startup.runtime.run({
            intent:
              'Correct the prescribed child position and verify only mechanical checks.',
            signal: new AbortController().signal
          })

          return { status: outcome.status, providerError }
        } finally {
          testRuntimeState.delete('mechanical-integration-execute')
          await startup.runtime.dispose()
          startup.history.dispose()
          startup.confirmation.dispose()
        }
      })

      if (bridgeFailure) {
        throw bridgeFailure
      }

      expect(result, JSON.stringify(result)).toMatchObject({
        status: 'executed'
      })
      expect(result.providerError).toBeUndefined()
      expect(primaryCalls).toBe(1)
      const after = await getCoreDocumentDigest(page)
      const afterDocument = await page.evaluate(async () =>
        (await import('../src/testing/runtime-access')).core.save()
      )

      await writeFile(
        testInfo.outputPath('mechanical-after-document.json'),
        JSON.stringify(afterDocument)
      )
      if (mode === 'no-progress') {
        expect(after).toEqual(before)
        await page.reload()
        await waitForAppReady(page)
        await waitForCollaboration(page)
        expect(await getCoreDocumentDigest(page)).toEqual(before)

        return
      }

      expect(after).not.toEqual(before)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(after)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(after)
      if (mode === 'library-reuse' || mode === 'peer-invalidation') {
        await page.reload()
        await waitForAppReady(page)
        await waitForCollaboration(page)
        expect(await getCoreDocumentDigest(page)).toEqual(after)

        return
      }

      await undo(page)
      await expect
        .poll(() => getCoreDocumentDigest(page))
        .toEqual(recoveryBefore ?? before)
      await expect
        .poll(() => getCoreDocumentDigest(peer))
        .toEqual(recoveryBefore ?? before)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(recoveryBefore ?? before)
      await redo(page)
      await writeFile(
        testInfo.outputPath('mechanical-redo-document.json'),
        JSON.stringify({
          document: await page.evaluate(async () =>
            (await import('../src/testing/runtime-access')).core.save()
          ),
          history: await getTransactionSnapshot(page)
        })
      )
      await expect.poll(() => getCoreDocumentDigest(page)).toEqual(after)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(after)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(after)
      await page.reload()
      await waitForAppReady(page)
      await waitForCollaboration(page)
      expect(await getCoreDocumentDigest(page)).toEqual(after)
    } finally {
      database.close()
      await peer.close()
    }
  })
}
