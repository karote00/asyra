// @vitest-environment node
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  createAiToolContract,
  type AiProvider
} from '@asyra/ai-agent-runtime'
import { isRecord } from '@asyra/utils'
import core from '../../src/contexts'
import { fillApis } from '../../src/common-apis'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { createLocalDesignTools } from '../local-design-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import { readCompleteInformation } from './tool-contract-assertions'

// Keep server file URLs in Node while supplying the actual App's DOM dependency.
const dom = await vi.hoisted(async () => {
  const { builtinEnvironments } = await import('vitest/environments')

  return builtinEnvironments.jsdom.setup(globalThis, {})
})

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION
    ]
  })
  await core.start(document.createElement('div'), { width: 128, height: 128 })
})
afterAll(async () => {
  core.destroy()
  await dom.teardown(globalThis)
})

// Resolve documented placeholders only; do not manufacture operation results.
const resolveExampleValues = (
  value: unknown,
  replacements: Map<string, string>
): unknown => {
  if (typeof value === 'string') {
    return replacements.get(value) ?? value
  }

  if (Array.isArray(value)) {
    return value.map((child) => resolveExampleValues(child, replacements))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      resolveExampleValues(child, replacements)
    ])
  )
}

it.each([undefined, 'unknown-operation', 'invalid-arguments'])(
  'delivers current discovery selectors and detects damaged executable Knowledge examples - %s',
  async (fault) => {
    core.load({
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'workspace',
        workspaceList: ['workspace'],
        elements: {
          workspace: {
            id: 'workspace',
            type: 'workspace',
            name: 'Workspace',
            parentId: '',
            children: [],
            visible: true,
            lock: false
          }
        }
      }
    })
    const signal = new AbortController().signal
    const knowledge = createLocalKnowledgeTools('knowledge-corpus')
    let dispatch: Parameters<
      AiProvider['requestActionBatch']
    >[1]['executeBatch']
    const dispatched: string[] = []
    let providerFailure: unknown
    const input = createAiRuntimeInput({
      permissionRules: {},
      provider: {
        requestActionBatch: async (_request, options) => {
          if (!options.executeBatch) {
            throw Error('Missing canonical executor')
          }

          dispatch = options.executeBatch
          try {
            await verifyExamples()
          } catch (error) {
            providerFailure = error
            throw error
          } finally {
            await host.dispose()
          }

          return {
            batchId: 'corpus-complete',
            actions: [
              {
                id: 'report',
                name: 'report_outcome',
                summary: 'Report corpus execution',
                arguments: {
                  outcome: 'completed',
                  message:
                    'Knowledge examples executed and invalid inputs corrected.'
                }
              }
            ]
          }
        }
      }
    })
    const runtime = createAiAgentRuntime({
      ...input,
      permissionPolicy: { evaluate: () => 'allow' }
    })
    const actions = input.actionDefinitions.map(createAiToolContract)
    let designs: ReturnType<typeof createLocalDesignTools> | undefined
    const host = createLocalToolHost({
      requestId: 'knowledge-corpus',
      signal,
      capacity: 128,
      receiptCapacity: 32,
      artifactCapacity: 128,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No recipe writes')
        }
      },

      createGroups: (ownership) => {
        const preparation = createLocalDesignTools(
          actions,
          createDesignPreparationSession(undefined, undefined, ownership)
        )

        designs = preparation
        const operations = createLocalOperationTools(
          actions,
          preparation,
          async (batch) => {
            if (!dispatch) {
              throw Error('No Runtime execution context')
            }

            dispatched.push(...batch.actions.map((action) => action.name))

            return dispatch(batch)
          },
          {
            ownership,

            getNativeTools: () => host.definitions(),

            getNativeToolsRevision: () => host.revision
          }
        )

        return [
          {
            name: 'design_knowledge',
            description: 'Knowledge',
            owner: knowledge
          },
          {
            name: 'design_preparation',
            description: 'Preparation',
            owner: preparation
          },
          {
            name: 'design_operations',
            description: 'Operations',
            owner: operations
          },
          {
            name: 'design_workflow',
            description: 'Workflow',
            owner: createLocalDesignWorkflow(preparation, operations)
          }
        ]
      }
    })

    const invoke = async (name: string, args: unknown) => {
      const reply = await host.invoke({ name, input: args })

      expect(reply.outcome.status, reply.text).toBe('success')

      return reply.text
    }

    const verifyExamples = async () => {
      const preparation = designs

      if (!preparation) {
        throw Error('Missing Host-owned preparation session')
      }

      const catalog = JSON.parse(
        await invoke('design_knowledge.' + 'discover_knowledge', {
          contexts: ['architectural-illustration', 'landing-page', 'docs-page']
        })
      )
      const documents = new Map<string, string>()

      for (const entry of catalog.entries) {
        const read = JSON.parse(
          await readCompleteInformation(
            (input, requestedTool) =>
              invoke('design_knowledge.' + requestedTool, input),
            {
              ids: [entry.id],
              contexts: [
                'architectural-illustration',
                'landing-page',
                'docs-page'
              ],
              rehydrate: true
            },
            'read_knowledge'
          )
        )

        for (const document of read.documents) {
          documents.set(document.target, document.text)
        }
      }

      expect(documents.size).toBeGreaterThan(10)
      const oldSelectors: string[] = []
      let rejected = 0
      let executedExamples = 0

      for (const [id, text] of documents) {
        expect(text, id).not.toMatch(
          /whole-result obligation|request-bound review credentials|set final on the actual final judgment/
        )

        for (const line of text.split('\n')) {
          if (
            /operations.*use `operations`|semantic `operations` selector|Exact `operations`|using `operations`|through `operations`/i.test(
              line
            )
          ) {
            oldSelectors.push(`${id}: ${line}`)
          }
        }

        for (const match of text.matchAll(/```json[^\n]*\n([\s\S]*?)\n```/g)) {
          const sample: unknown = JSON.parse(match[1])

          if (
            !isRecord(sample) ||
            (!('tool' in sample) && !('arguments' in sample))
          ) {
            continue
          }

          if (typeof sample.tool !== 'string' || !isRecord(sample.arguments)) {
            throw Error(id + ': malformed executable example')
          }

          const definitions = host
            .definitions()
            .filter((tool) => tool.name === sample.tool)

          expect(definitions, id + ': unique executable tool').toHaveLength(1)
          const definition = definitions[0]

          const replacements = new Map<string, string>()

          if (sample.tool === 'execute_design') {
            const source = JSON.parse(
              await invoke('design_workflow.prepare_and_apply_design', {
                parentId: 'workspace',
                inspection: 'defer',
                draft: {
                  type: 'group',
                  name: 'Knowledge example targets',
                  fillTemplates: {
                    glass: {
                      gradientType: 'linear',
                      gradientHandles: [
                        { x: 0, y: 0 },
                        { x: 0, y: 1 }
                      ],
                      gradientStops: [
                        { position: 0, color: '#123456', opacity: 1 },
                        { position: 1, color: '#abcdef', opacity: 1 }
                      ]
                    }
                  },
                  children: ['chosen', 'selected', 'lower', 'upper'].map(
                    (key) => ({
                      type: 'rect',
                      key,
                      name: key,
                      width: 20,
                      height: 40,
                      fill: { template: 'glass' }
                    })
                  )
                }
              })
            )

            replacements.set('current-prepared-part', source.artifactId)
            for (const [placeholder, key] of [
              ['current-selected-element', 'selected'],
              ['actual-lower', 'lower'],
              ['actual-upper', 'upper']
            ]) {
              const ids = preparation.resolveTargets({
                artifactId: source.artifactId,
                keys: [key]
              })

              expect(ids).toHaveLength(1)
              replacements.set(placeholder, ids[0])
            }
          }

          const args = resolveExampleValues(sample.arguments, replacements)

          if (!isRecord(args)) {
            throw Error('Missing example arguments')
          }

          const first = Array.isArray(args.operations)
            ? args.operations[0]
            : undefined

          if (
            fault &&
            isRecord(first) &&
            first.name === 'api_element_deleteElements'
          ) {
            const broken = structuredClone(args)

            if (
              !Array.isArray(broken.operations) ||
              !isRecord(broken.operations[0])
            ) {
              throw Error('Missing nested operation')
            }

            if (fault === 'unknown-operation') {
              broken.operations[0].name = 'nonexistent_example_operation'
            } else {
              broken.operations[0].arguments = { elementIds: 42 }
            }

            const before = dispatched.length
            const reply = await host.invoke({
              name: definition.registeredName,
              input: broken
            })

            expect(reply.outcome, reply.text).toMatchObject({
              status: 'failed',
              settlement: 'not-started'
            })
            expect(JSON.parse(reply.text)).toMatchObject({
              code: 'TOOL_INPUT_INVALID'
            })
            expect(dispatched).toHaveLength(before)
            rejected++
          }

          const before = dispatched.length
          let deletionIds: unknown

          if (isRecord(first) && first.name === 'api_element_deleteElements') {
            if (isRecord(first.target)) {
              deletionIds = preparation.resolveTargets({
                artifactId: first.target.artifactId,
                keys: first.target.keys
              })
            } else if (isRecord(first.arguments)) {
              deletionIds = first.arguments.elementIds
            }
          }

          await invoke(definition.registeredName, args)
          if (Array.isArray(deletionIds)) {
            expect(dispatched.slice(before)).toEqual([
              'api_element_deleteElements'
            ])
            for (const elementId of deletionIds) {
              expect(core.getElementData(elementId)).toBeUndefined()
            }
          }

          if (isRecord(first) && first.name === 'api_fill_updateFillsAtIndex') {
            expect(dispatched.slice(before)).toEqual([
              'api_fill_updateFillsAtIndex'
            ])
            if (
              !isRecord(first.arguments) ||
              !Array.isArray(first.arguments.patch)
            ) {
              throw Error('Missing palette example')
            }

            const patches = first.arguments.patch
            const ids = ['actual-lower', 'actual-upper'].map((key) => {
              const id = replacements.get(key)

              if (!id) {
                throw Error('Missing real target')
              }

              return id
            })

            fillApis.getFillTargetsAtIndex(ids, 0).forEach((target, index) => {
              expect(
                fillApis.getFillById(target.elementId, target.fillId)
              ).toMatchObject(patches[index])
            })
          }

          executedExamples++
        }
      }

      expect(executedExamples).toBe(6)
      expect(rejected).toBe(fault ? 2 : 0)
      expect(oldSelectors).toEqual([])
    }

    try {
      const result = await runtime.run({
        intent: 'Execute current Knowledge examples.',
        signal
      })

      if (providerFailure) {
        throw providerFailure
      }

      expect(result.status, JSON.stringify(result)).toBe('executed')
    } finally {
      await host.dispose()
      await runtime.dispose()
      knowledge.dispose()
    }
  }
)
