import strictArtifactRetention from './fixtures/recorded-101/strict-artifact-retention-20261106.json'
import strictWholeResult from './fixtures/recorded-101/strict-whole-result-20261106.json'
import strictOutput from './fixtures/recorded-101/strict-output-selection-20261106.json'
import strictRetention from './fixtures/recorded-101/strict-retention-20261106.json'
import { operationInputIssue } from '../../src/ai/tool-schema'
import strictCriteria from './fixtures/recorded-101/strict-criteria-20261106.json'
import { createRetainedFillAction } from '../../src/ai/retained-fill-action'
import mutationDelivery from './fixtures/recorded-101/mutation-delivery-20261106.json'
import continuation from './fixtures/recorded-101/continuation-contracts-20261106.json'
import templateForwarding from './fixtures/recorded-101/template-forwarding-20261105.json'
// @vitest-environment jsdom
import { beforeAll, expect, it } from 'vitest'
import {
  createAiToolContract,
  registeredRecipeOutputAt
} from '@asyra/ai-agent-runtime'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import {
  createDesignSequencePlanner,
  sequenceDefinition
} from '../local-design-sequence'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createPreparedDesignAction } from '../../src/ai/design-actions'
import { observeAiAction } from '../../src/ai/runtime-input'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import {
  createConversationResults,
  type ExchangeConversationResults
} from '../../src/ai/conversation-results'
import stageReuse from './fixtures/recorded-101/stage-reuse-20261105.json'
import baseOrder from './fixtures/recorded-101/base-order-20261105.json'
import reuse from './fixtures/recorded-101/conversation-results-20261105.json'
import recorded from './fixtures/recorded-101/created-targets-20261104.json'

import lastRun from './fixtures/recorded-101/host-operations-20261105.json'
import latest from './fixtures/recorded-101/decided-targets-20261104.json'

const created = { kind: 'step', step: 'create', path: '/compositionIds/0' }
const order = recorded.order.operations[0]
const anchor = order.arguments.request.anchorId

it('retains public motif definitions in App context and consumes variants in a new request', async () => {
  const scope = createConversationResults(() => 1).open('motif-reuse')

  const resultContext: ExchangeConversationResults = async (request) =>
    scope.exchange(request)

  const draft = {
    type: 'group',
    name: 'Window section',
    key: 'windows',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 0
    },
    motifTemplates: {
      window: [
        {
          key: 'frame',
          name: 'Frame',
          fill: { shared: 'metal' },
          vertices: [
            { u: 0, v: 0 },
            { u: 1, v: 0 },
            { u: 1, v: 1 },
            { u: 0, v: 1 }
          ]
        }
      ]
    },
    sharedFills: { metal: '#345678' },
    children: [
      {
        type: 'surface-grid',
        key: 'grid',
        name: 'Windows',
        order: 'cell-major',
        rows: 2,
        columns: 3,
        boundary: [
          { x: 0, y: 0, z: 0 },
          { x: 12, y: 0, z: 0 },
          { x: 12, y: 0, z: 20 },
          { x: 0, y: 0, z: 20 }
        ],
        motifs: { template: 'window' }
      }
    ]
  }
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    resultContext
  )

  try {
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        { id: 'source', name: 'prepare_design', arguments: { draft } },
        {
          id: 'definitions',
          name: 'read_design_templates',
          arguments: {
            artifactId: { kind: 'step', step: 'source', path: '/artifactId' }
          }
        }
      ],
      retain: { windows: { step: 'definitions', path: '' } }
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: ['windows'],
      toolOutcome: { status: 'success' }
    })
    expect(JSON.stringify(result)).not.toContain('vertices')
  } finally {
    await f.dispose()
  }

  const next = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    resultContext,
    false
  )

  try {
    const result = await next.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        {
          id: 'variant',
          name: 'prepare_and_apply_design',
          arguments: {
            parentId: recorded.create.parentId,
            draft: {
              ...draft,
              motifTemplates: {
                kind: 'named',
                name: 'windows',
                path: '/motifTemplates'
              },
              sharedFills: {
                kind: 'named',
                name: 'windows',
                path: '/sharedFills'
              },
              children: [
                {
                  ...draft.children[0],
                  motifs: {
                    template: 'window',
                    overrides: { frame: { name: 'Variant' } }
                  }
                }
              ]
            }
          }
        }
      ]
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      toolOutcome: { status: 'success' }
    })
    expect(next.count()).toBe(7)
    expect(next.calls).toEqual(['apply_prepared_design'])
    const { default: core } = await import('../../src/contexts')
    const { transactionApis } =
      await import('../../src/common-apis/transaction')
    const { default: factory } = await import('@asyra/factory')
    const ids = core.getElementChildren(next.root(), 0, 6).elementIds
    const targets = ids.map((elementId) => {
      const root = core.readElementPropertyTargets([
        { elementId, propertyName: 'fills', path: [] }
      ])[0]
      const slot = root.children[0]

      return {
        elementId,
        propertyName: 'fills',
        path: [{ key: slot.key, childId: slot.childId }]
      }
    })

    const colors = () =>
      core
        .readElementPropertyTargets(targets)
        .map((view) => view.effective.color)

    const sourceId = core.readElementPropertyTargets(targets)[0].propertyId

    expect(colors()).toEqual(Array(6).fill('#345678'))
    transactionApis.runTransaction(() =>
      core.updateElementPropertyTargets([
        { target: targets[0], values: { color: '#abcdef' } }
      ])
    )
    transactionApis.runTransaction(() =>
      core.updateSharedPropertySources([
        { propertyId: sourceId, values: { color: '#fedcba' } }
      ])
    )
    expect(colors()).toEqual(['#abcdef', ...Array(5).fill('#fedcba')])
    transactionApis.runTransaction(() =>
      core.resetElementPropertyOverrides([
        { target: targets[0], keys: ['color'] }
      ])
    )
    expect(colors()).toEqual(Array(6).fill('#fedcba'))
    await factory.undo()
    expect(colors()).toEqual(['#abcdef', ...Array(5).fill('#fedcba')])
    await factory.redo()
    const document = await core.save()

    core.load(document)
    expect(colors()).toEqual(Array(6).fill('#fedcba'))
  } finally {
    await next.dispose()
  }
})

beforeAll(async () => {
  const { default: core } = await import('../../src/contexts')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')

  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
    ]
  })
})

const fixture = async (
  failOrder = false,
  parent = recorded.create.parentId,
  anchorId = anchor,
  resultContext?: ExchangeConversationResults,
  initialize = true,
  reviewTools = false,
  regionMembers?: string[]
) => {
  const { default: core } = await import('../../src/contexts')
  const { createDesignReviewer } =
    await import('../../src/common-apis/design-review')
  const { createDesignReviewAction } =
    await import('../../src/ai/review-action')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const txn = createAiTransactionRunner()

  const node = (
    id: string,
    type: string,
    parentId: string,
    children: string[]
  ) => ({ id, type, parentId, children, name: id, visible: true, lock: false })

  if (initialize) {
    core.load({
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'workspace',
        workspaceList: ['workspace'],
        elements: { workspace: node('workspace', 'workspace', '', []) }
      }
    } as never)
    core.createElementInParent(
      { id: parent, type: 'group', name: 'Existing tower' },
      'workspace'
    )
    core.createElementInParent(
      { id: anchorId, type: 'rect', width: 10, height: 10, x: 0, y: 0 },
      parent
    )
  }

  const reviewer = createDesignReviewer(undefined, undefined, true)

  const { createInspectionEvidence } =
    await import('../../src/common-apis/inspection-evidence')
  const { createInspectionValidationAction, createAiInspectionAction } =
    await import('../../src/ai/inspection')
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  const {
    createDocumentContextAction,
    createDocumentContextReleaseAction,
    createRegionTargetsAction
  } = await import('../../src/ai/context-action')
  const evidence = createInspectionEvidence()
  // The jsdom Core has no render adapter. Read the real moved element's
  // current bounds at query time through the same retained-context owner.
  const source = Object.create(core)

  source.getElementIdsInBounds = (bounds: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    if (regionMembers) {
      return regionMembers.filter((id) => {
        const point = core.getElementComputedData(id, ['x', 'y'])

        return (
          point &&
          typeof point.x === 'number' &&
          typeof point.y === 'number' &&
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.width &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.height
        )
      })
    }

    const id = 'moving-region-member'

    if (!core.getElementMetadata(id)) {
      return []
    }

    const x = core.getElementComputedData(id, ['x'])?.x

    return typeof x === 'number' && x >= bounds.x && x < bounds.x + bounds.width
      ? [id]
      : []
  }

  const queries = createRetainedDesignContext(source, () => () => undefined)
  const owners = [
    ...(reviewTools
      ? [
          createAiInspectionAction(() => {
            throw Error('Unexpected image capture')
          })
        ]
      : []),
    createDocumentContextAction(queries.read),
    createRetainedFillAction(queries),
    createRegionTargetsAction(queries.read),
    createInspectionValidationAction(evidence, reviewer),
    createDocumentContextReleaseAction(queries.read),
    createPreparedDesignAction(undefined, async () => undefined),
    createDesignReviewAction(reviewer.capture, reviewer.isCurrent),
    ...createBasicApiActions(undefined, undefined, queries).filter((a) =>
      [
        order.name,
        recorded.remove.operations[0].name,
        'api_element_updateElementProperties',
        baseOrder.fill.name,
        'api_hierarchy_groupElements'
      ].includes(a.name)
    )
  ].map((a) => observeAiAction(a))
  const signal = new AbortController().signal
  const actions = owners.map(createAiToolContract)
  let prep!: ReturnType<typeof createLocalDesignTools>

  const siblings = () => core.getElementChildren(parent, 0, 100).elementIds

  const exchanges: string[][] = []
  const calls: string[] = []
  let root = ''
  let count = 0
  let ops!: ReturnType<typeof createLocalOperationTools>
  const host = createLocalToolHost({
    requestId: 'window-rails',
    resultContext,
    signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('Unexpected save')
      }
    },

    createGroups: (ownership) => {
      prep = createLocalDesignTools(
        actions,
        createDesignPreparationSession(undefined, undefined, ownership)
      )
      ops = createLocalOperationTools(
        actions,
        prep,
        async (batch) => {
          exchanges.push(batch.actions.map((a) => a.name))
          const actionResults = []

          for (const action of batch.actions) {
            const owner = owners.find((x) => x.name === action.name)

            if (!owner) {
              throw new Error('Missing registered action: ' + action.name)
            }

            if (
              [
                'apply_prepared_design',
                order.name,
                recorded.remove.operations[0].name
              ].includes(action.name)
            ) {
              calls.push(action.name)
            }

            if (action.name === order.name && failOrder) {
              throw Error('Unavailable anchor')
            }

            const result = (
              owner.effect === 'read'
                ? await owner.execute(action.arguments, { signal } as never)
                : await txn.run(
                    'Window section',
                    (runMutation) =>
                      owner.execute(action.arguments, {
                        signal,
                        runMutation
                      } as never),
                    { signal }
                  )
            ) as Record<string, unknown>

            if (action.name === 'apply_prepared_design') {
              root = String(result.compositionId)
              count = Number(result.appliedElementCount)
            }

            actionResults.push({
              actionId: action.id,
              actionName: action.name,
              result: result as never
            })
          }

          return { context: {}, actionResults }
        },
        {
          ownership,

          getNativeTools: () => host.definitions()
        }
      )

      return [
        { name: 'design_operations', description: 'Operations', owner: ops },
        {
          name: 'design_workflow',
          description: 'Workflow',
          owner: createLocalDesignWorkflow(prep, ops)
        },
        { name: 'design_preparation', description: 'Preparation', owner: prep }
      ]
    }
  })

  return {
    dispose: async () => {
      await host.dispose()
      queries.dispose()
      evidence.dispose()
      reviewer.dispose()
    },

    host,
    prep,
    calls,
    exchanges,
    siblings,

    root: () => root,

    count: () => count,

    call: async (name: string, input: unknown) =>
      JSON.parse((await host.invoke({ name, input })).text)
  }
}

it('executes the published staged example and saves its authored source without model transfer', async () => {
  const scope = createConversationResults(() => 1).open('stage-example')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request)
  )

  try {
    const example = sequenceDefinition().inputSchema.examples[0]
    const result = await f.call('design_operations.execute_design', example)

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: ['panelSource'],
      stages: [{ id: 'panel', status: 'applied' }],
      toolOutcome: { status: 'success' }
    })
    expect(f.calls).toEqual(['apply_prepared_design'])
    expect(
      scope.exchange({ read: { draft: { name: 'panelSource', path: '' } } })
    ).toEqual({ draft: example.stages[0].operations[0].arguments.draft })
  } finally {
    await f.dispose()
  }
})

it.each([false, true])(
  'applies stages once and preserves earlier writes when later preparation fails (failure=%s)',
  async (failure) => {
    const scope = createConversationResults(() => 1).open('staged')
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      async (request) => scope.exchange(request)
    )

    try {
      const result = await f.call('design_operations.execute_design', {
        inspection: 'defer',
        retain: {
          faceParameters: {
            step: 'a-source',
            source: 'input',
            path: '/draft/children/0'
          }
        },
        stages: ['a', 'b'].map((id) => ({
          id,
          operations: [
            {
              id: id + '-source',
              name: 'prepare_design',
              arguments: {
                draft: {
                  type: 'group',
                  name: 'Stage ' + id,
                  children: [
                    (() => {
                      if (id === 'b' && failure) {
                        return {
                          type: 'projected-face',
                          key: 'invalid',
                          name: 'Nonplanar face',
                          fill: '#aabbcc',
                          vertices: [
                            { x: 0, y: 0, z: 0 },
                            { x: 10, y: 0, z: 0 },
                            { x: 10, y: 10, z: 5 },
                            { x: 0, y: 10, z: 0 }
                          ]
                        }
                      }

                      if (id === 'b') {
                        return {
                          kind: 'named',
                          name: 'faceParameters',
                          path: ''
                        }
                      }

                      return {
                        type: 'rect',
                        name: 'Face',
                        key: 'face',
                        width: 20,
                        height: 30
                      }
                    })()
                  ]
                }
              }
            }
          ],
          apply: [
            {
              id: id + '-apply',
              name: 'apply_prepared_design',
              arguments: {
                artifactId: {
                  kind: 'step',
                  step: id + '-source',
                  path: '/artifactId'
                },
                parentId: recorded.create.parentId
              }
            }
          ]
        }))
      })

      expect(result, JSON.stringify(result)).toMatchObject({
        saved: ['faceParameters'],
        toolOutcome: { status: failure ? 'failed' : 'success' }
      })
      expect(f.calls).toEqual(
        failure
          ? ['apply_prepared_design']
          : ['apply_prepared_design', 'apply_prepared_design']
      )
      expect(f.count()).toBe(2)
      expect(f.siblings()).toHaveLength(failure ? 2 : 3)
      expect(JSON.stringify(result)).not.toContain('artifactId')
      expect(result.stages).toEqual([
        { id: 'a', status: 'applied' },
        { id: 'b', status: failure ? 'failed' : 'applied' }
      ])
      expect(
        scope.exchange({
          read: { face: { name: 'faceParameters', path: '/width' } }
        })
      ).toEqual({ face: 20 })
    } finally {
      await f.dispose()
    }
  }
)

it.each([
  [recorded, false, 7681],
  [recorded, true, 7681],
  [latest, false, 7809]
] as const)(
  'binds the recorded window trim root to ordering in one inline call (case %#)',
  async (sample, failed, expectedCount) => {
    const order = sample.order.operations[0]
    const anchor = order.arguments.request.anchorId
    const hasParent = 'parentId' in sample.create
    const parent = hasParent ? recorded.create.parentId : 'existing-parent'
    const f = await fixture(failed, parent, anchor)
    const request = {
      operations: [
        {
          id: 'create',
          name: 'design_workflow.prepare_and_apply_design',
          arguments: sample.create
        },
        {
          name: order.name,
          arguments: {
            request: { ...order.arguments.request, elementIds: [created] }
          }
        }
      ],
      inspection: 'defer',
      output: created
    }

    try {
      const result = await f.call('design_operations.execute_design', request)

      expect(f.calls, JSON.stringify(result).slice(0, 1800)).toEqual([
        'apply_prepared_design',
        order.name
      ])
      expect(f.count()).toBe(expectedCount)
      expect(f.root()).not.toBe(order.arguments.request.elementIds[0])
      if (failed) {
        expect(result.execution.status).not.toBe('success')
        expect(result.execution.calls[0].settlement).toBe('completed')
        expect(f.siblings()).toEqual([anchor, f.root()])
      } else {
        expect(
          result.execution,
          JSON.stringify({
            issues: result.execution.issues,
            tail: result.execution.recovery?.at(-1)?.value?.toolOutcome,
            followup:
              result.execution.recovery?.at(-1)?.value?.measurementIssues
          })
        ).toMatchObject({ status: 'success', value: f.root() })
        expect(f.siblings()).toEqual(
          order.arguments.request.placement === 'after'
            ? [anchor, f.root()]
            : [f.root(), anchor]
        )
      }
    } finally {
      await f.dispose()
    }
  },
  60000
)

it.each([recorded, latest])(
  'finds and executes recorded artifact-key deletion (case %#)',
  async (sample) => {
    const f = await fixture()

    try {
      const { target } = sample.remove.operations[0]
      const source = await f.call(
        'design_workflow.prepare_and_apply_design',
        'keys' in target
          ? {
              parentId: recorded.create.parentId,
              inspection: 'defer',
              draft: {
                type: 'group',
                name: 'Crown faces',
                children: [...target.keys, 'untouched'].map((key) => ({
                  key,
                  type: 'rect',
                  width: 12,
                  height: 12,
                  name: key
                }))
              }
            }
          : latest.crown
      )
      const selector =
        'keys' in target
          ? { keys: target.keys }
          : { keyPrefix: target.keyPrefix }
      const ids = f.prep.resolveTargets({
        artifactId: source.artifactId,
        ...selector
      })

      expect(ids).toHaveLength('keys' in target ? 10 : 12)
      const [keep] = f.prep.resolveTargets({
        artifactId: source.artifactId,
        keys: ['keys' in target ? 'untouched' : 'needle']
      })
      const lookup = await f.call(
        'design_operations.describe_design_apis',
        sample.lookup
      )
      const entry = lookup.apis?.find(
        (item: { name: string }) =>
          item.name === recorded.remove.operations[0].name
      )

      expect(entry, JSON.stringify(lookup).slice(0, 600)).toBeDefined()
      const recovered = await f.call('design_operations.describe_design_apis', {
        names: ['absent-operation'],
        purpose: sample.lookup.query
      })

      expect(recovered.missingNames).toEqual(['absent-operation'])
      expect(
        recovered.candidates.find(
          (candidate: { name: string }) => candidate.name === entry.name
        )?.artifactKeyExamples
      ).toEqual(entry.artifactKeyExamples)
      const other = await f.call('design_operations.describe_design_apis', {
        query: 'move elements relative by artifact keys'
      })

      expect(
        other.apis.find(
          (candidate: { name: string }) => candidate.name === order.name
        )?.artifactKeyExamples
      ).toEqual(expect.any(Array))
      const example = structuredClone(entry.artifactKeyExamples[0])
      const operation = example.arguments.operations[0]

      expect(operation.name).toBe(recorded.remove.operations[0].name)
      expect(operation.arguments).toEqual({})
      operation.target.artifactId = source.artifactId
      if ('keys' in target) {
        operation.target.keys = target.keys
      } else {
        delete operation.target.keys
        operation.target.keyPrefix = target.keyPrefix
      }

      const deleted = await f.call('design_operations.' + example.tool, {
        ...example.arguments,
        inspection: 'defer'
      })

      expect(deleted.toolOutcome.status, JSON.stringify(deleted)).toBe(
        'success'
      )
      const { default: core } = await import('../../src/contexts')

      expect(ids.every((id) => !core.getElementMetadata(id))).toBe(true)
      expect(core.getElementMetadata(keep)).toBeDefined()
    } finally {
      await f.dispose()
    }
  }
)

it('dispatches the recorded three crown deletions together after resolving current artifact membership', async () => {
  const f = await fixture()

  try {
    const crown = await f.call(
      'design_workflow.prepare_and_apply_design',
      lastRun.crown
    )
    const operations = lastRun.remove.operations.map((op) => ({
      ...op,
      target: { ...op.target, artifactId: crown.artifactId }
    }))
    const before = f.exchanges.length
    const result = await f.call('design_operations.execute_design', {
      ...lastRun.remove,
      operations
    })

    expect(
      result.toolOutcome,
      JSON.stringify(result).slice(0, 900)
    ).toMatchObject({ status: 'success' })
    expect(
      f.exchanges.slice(before).filter((a) => a.includes(operations[0].name))
    ).toEqual([operations.map((op) => op.name)])
  } finally {
    await f.dispose()
  }
})

it('resolves the region at its step after moving a real element into it', async () => {
  const scope = createConversationResults(() => 1).open('recorded-facts')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request)
  )
  const { default: core } = await import('../../src/contexts')
  const id = 'moving-region-member'

  core.createElementInParent(
    { id, type: 'rect', name: id, x: 0, y: 0, width: 10, height: 10 },
    'workspace'
  )
  try {
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        {
          name: 'api_element_updateElementProperties',
          arguments: { elementIds: [id], values: { x: 200 } }
        },
        {
          name: recorded.remove.operations[0].name,
          arguments: {},
          selectAt: 'step',
          target: {
            field: 'elementIds',
            query: {
              scope: 'region',
              bounds: { x: 190, y: -20, width: 40, height: 40 },
              filter: { name: { prefix: id } },
              expectedCount: 1
            }
          }
        }
      ]
    })

    expect(
      result.toolOutcome,
      JSON.stringify(result).slice(0, 1800)
    ).toMatchObject({ status: 'success' })
    expect(core.getElementMetadata(id)).toBeUndefined()
    const calls = f.exchanges.flat()

    expect(calls.indexOf('resolve_design_targets')).toBeGreaterThan(
      calls.indexOf('api_element_updateElementProperties')
    )
  } finally {
    await f.dispose()
  }
})

it('keeps the six recorded ready material operations in one canvas exchange', async () => {
  const names = [...new Set(lastRun.materials.operations.map((s) => s.name))]
  const ops = createLocalOperationTools(
    names.map((name) => ({
      name,
      description: name,
      inputSchema: { type: 'object' }
    })),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    async () => {
      throw new Error('Planning cannot dispatch')
    }
  )
  const batch = ops.definitions.find((d) => d.name === 'execute_design')

  expect(batch).toBeDefined()
  const plan = createDesignSequencePlanner(
    batch,
    () => undefined,
    () => undefined
  )(lastRun.materials)

  expect(plan.batch).toEqual(lastRun.materials)
  expect(plan.batch?.operations).toHaveLength(6)
})

it('binds the recorded replacement roots and reuses an App name in a new request without returning IDs', async () => {
  const app = createConversationResults(() => 1),
    scope = app.open('tower')

  const exchange: ExchangeConversationResults = async (c) => scope.exchange(c)

  const anchor = reuse.call1420.operations[0].arguments.request.anchorId
  const first = await fixture(false, 'original-tower', anchor, exchange)
  let root = ''

  try {
    const ack = await first.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        {
          id: 'new',
          name: 'prepare_and_apply_design',
          arguments: reuse.call1382
        },
        {
          ...reuse.call1420.operations[0],
          arguments: {
            request: {
              ...reuse.call1420.operations[0].arguments.request,
              elementIds: [{ kind: 'named', name: 'ornament' }]
            }
          }
        }
      ],
      retain: { ornament: { step: 'new', path: '/compositionIds/0' } }
    })

    expect(ack, JSON.stringify(ack).slice(0, 900)).toMatchObject({
      saved: ['ornament'],
      toolOutcome: { status: 'success' }
    })
    root = first.root()
    expect(JSON.stringify(ack)).not.toContain(root)
    expect(first.siblings()).toEqual([anchor, root])
  } finally {
    await first.dispose()
  }

  const second = await fixture(false, 'original-tower', anchor, exchange, false)

  try {
    const ack = await second.call('design_operations.execute_design', {
      inspection: 'defer',
      delivery: 'status',
      operations: [
        {
          id: 'new',
          name: 'prepare_and_apply_design',
          arguments: reuse.call1840
        },
        {
          ...reuse.call1879.operations[0],
          arguments: {
            request: {
              placement: 'before',
              elementIds: [
                { kind: 'step', step: 'new', path: '/compositionIds/0' }
              ],
              anchorId: { kind: 'named', name: 'ornament' }
            }
          }
        }
      ]
    })

    expect(ack, JSON.stringify(ack).slice(0, 850)).toMatchObject({
      toolOutcome: { status: 'success' }
    })
    expect(second.siblings()).toEqual([anchor, second.root(), root])
    expect(second.calls).toEqual(['apply_prepared_design', order.name])
    const read = await second.call('design_operations.execute_design', {
      delivery: { fields: { id: { name: 'ornament', path: '' } } }
    })

    expect(read.fields).toEqual({ id: root })
    expect(second.calls).toEqual(['apply_prepared_design', order.name])
  } finally {
    await second.dispose()
  }
})

it('delivers selected dimension data and retains the other recorded columns in the App', async () => {
  const scope = createConversationResults(() => 1).open('dimensions')
  const f = await fixture(false, undefined, undefined, async (c) =>
    scope.exchange(c)
  )

  try {
    const { default: core } = await import('../../src/contexts')

    for (const item of reuse.columns) {
      core.createElementInParent(
        { ...item, type: 'rect', name: item.id },
        'workspace'
      )
    }

    const args = { ...reuse.call843, operations: [reuse.call843.operations[0]] }
    const ordinary = await f.call('design_operations.execute_design', args)
    const id = 'dimensions'
    const ack = await f.call('design_operations.execute_design', {
      ...args,
      retain: { [id]: { path: '/actionResults/0/result/columns' } },
      delivery: {
        fields: { height: { path: '/actionResults/0/result/columns/0/height' } }
      }
    })

    expect(ack, JSON.stringify(ack).slice(0, 700)).toMatchObject({
      saved: [id],
      fields: { height: reuse.columns[0].height },
      toolOutcome: { status: 'success' }
    })
    expect(
      scope.exchange({ read: { [id]: { name: id, path: '' } } }).dimensions
    ).toEqual(ordinary.actionResults[0].result.columns)
    expect(JSON.stringify(ack).length).toBeLessThan(
      JSON.stringify(ordinary).length
    )
  } finally {
    await f.dispose()
  }
})

it('preserves named successful work on a stopped successor without exporting a request handle', async () => {
  const scope = createConversationResults(() => 1).open('partial')
  const f = await fixture(
    true,
    'tower',
    reuse.call1420.operations[0].arguments.request.anchorId,
    async (c) => scope.exchange(c)
  )

  try {
    const ack = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      retain: {
        part: { step: 'create', path: '/compositionIds/0' },
        expired: { step: 'create', path: '/artifactId' }
      },
      operations: [
        {
          id: 'create',
          name: 'prepare_and_apply_design',
          arguments: reuse.call1382
        },
        {
          id: 'order',
          name: order.name,
          arguments: {
            request: {
              ...reuse.call1420.operations[0].arguments.request,
              elementIds: [created]
            }
          }
        }
      ]
    })

    expect(ack, JSON.stringify(ack)).toMatchObject({
      saved: ['part'],
      completed: ['create'],
      stopped: ['order'],
      toolOutcome: { status: 'unknown', settlement: 'unknown' }
    })
    expect(ack.issues.join(' ')).toContain('Request-scoped')
    expect(scope.names()).toEqual(['part'])
    expect(f.calls.filter((n) => n === 'apply_prepared_design')).toHaveLength(1)
  } finally {
    await f.dispose()
  }
})

it('resolves an artifact anchor alongside the recorded whole-array step binding', async () => {
  const f = await fixture()

  try {
    const anchor = await f.call(
      'design_workflow.prepare_and_apply_design',
      baseOrder.anchor
    )
    const parentId = anchor.compositionIds[0]

    const operations = (selector: object) => [
      {
        ...baseOrder.create,
        arguments: { ...baseOrder.create.arguments, parentId }
      },
      {
        ...baseOrder.order,
        target: {
          field: 'anchorId',
          path: ['request', 'anchorId'],
          artifactId: anchor.artifactId,
          ...selector
        }
      }
    ]

    const execute = (selector: object) =>
      f.call('design_operations.execute_design', {
        operations: operations(selector),
        inspection: 'defer',
        delivery: 'status'
      })

    const before = f.calls.length
    const unavailable = await execute({
      artifactId: 'unknown-reference',
      keys: ['baseCentral-0-recess']
    })

    expect(unavailable.toolOutcome.status).toBe('failed')
    expect(JSON.stringify(unavailable)).toContain('anchorId')
    const missing = await execute({ keys: ['baseCentral'] })

    expect(JSON.stringify(missing)).toMatch(
      /anchorId.*baseCentral.*baseCentral-0-recess/
    )
    const ambiguous = await execute({ keyPrefix: 'baseCentral-' })

    expect(JSON.stringify(ambiguous)).toMatch(/anchorId.*exactly one.*468/)
    const [producer, move] = operations({ keys: ['baseCentral-0-recess'] })
    const wrongType = await f.call('design_operations.execute_design', {
      operations: [
        producer,
        {
          ...move,
          arguments: {
            request: {
              placement: 'before',
              elementIds: {
                kind: 'step',
                step: 'baseFine',
                path: '/compositionIds/0'
              }
            }
          }
        }
      ]
    })

    expect(wrongType.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(f.calls.length).toBe(before)
    const result = await execute({ keys: ['baseCentral-0-recess'] })

    expect(result, JSON.stringify(result)).toMatchObject({
      toolOutcome: { status: 'success' }
    })
    expect(JSON.stringify(result)).not.toContain('design-')
    const { default: core } = await import('../../src/contexts')

    expect(core.getElementChildren(parentId, 0, 1).elementIds).toEqual([
      f.root()
    ])
  } finally {
    await f.dispose()
  }
}, 60000)

it('retains the recorded base root across a failed region edit and consumes it without returning its ID', async () => {
  const scope = createConversationResults(() => 1).open('base')

  const exchange: ExchangeConversationResults = async (request) =>
    scope.exchange(request)

  const parent = baseOrder.create.arguments.parentId
  const f = await fixture(false, parent, anchor, exchange)
  let root: string

  try {
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      retain: { baseRoot: { step: 'baseFine', path: '/compositionIds/0' } },
      operations: [baseOrder.create, baseOrder.fill]
    })

    expect(result.saved).toEqual(['baseRoot'])
    expect(JSON.stringify(result.issues)).toContain('expectedCount 8')
    root = f.root()
    expect(root).toBeTruthy()
    expect(JSON.stringify(result)).not.toContain(root)
  } finally {
    await f.dispose()
  }

  const next = await fixture(false, parent, anchor, exchange, false)

  try {
    const result = await next.call('design_operations.execute_design', {
      inspection: 'defer',
      delivery: 'status',
      operations: [
        {
          name: baseOrder.order.name,
          arguments: {
            request: {
              elementIds: [{ kind: 'named', name: 'baseRoot' }],
              placement: 'before',
              anchorId: anchor
            }
          }
        }
      ]
    })

    expect(result.toolOutcome.status).toBe('success')
    expect(next.siblings()).toEqual([root, anchor])
    expect(next.calls).toEqual([baseOrder.order.name])
    expect(JSON.stringify(result)).not.toContain(root)
  } finally {
    await next.dispose()
  }
})

it('executes the three recorded facade drafts together and keeps optional results in App context', async () => {
  const scope = createConversationResults(() => 1).open('facades')
  const parent = stageReuse.drafts[0].parentId
  const crown = stageReuse.drafts[2].parentId
  const f = await fixture(false, parent, anchor, async (request) =>
    scope.exchange(request)
  )
  const { default: core } = await import('../../src/contexts')

  core.createElementInParent(
    { id: crown, type: 'group', name: 'Crown' },
    'workspace'
  )
  try {
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: stageReuse.drafts.map((arguments_, index) => ({
        id: 'facade-' + index,
        name: 'prepare_and_apply_design',
        arguments: arguments_
      })),
      retain: {
        tiers: { step: 'facade-0', path: '/compositionIds/0' },
        base: { step: 'facade-1', path: '/compositionIds/0' },
        crown: { step: 'facade-2', path: '/compositionIds/0' }
      }
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: ['tiers', 'base', 'crown'],
      toolOutcome: { status: 'success' }
    })
    const roots = scope.exchange({
      read: {
        tiers: { name: 'tiers', path: '' },
        base: { name: 'base', path: '' },
        crown: { name: 'crown', path: '' }
      }
    })

    expect(core.getElementChildren(parent, 0, 5).elementIds).toEqual([
      anchor,
      roots.tiers,
      roots.base
    ])
    expect(core.getElementChildren(crown, 0, 5).elementIds).toEqual([
      roots.crown
    ])
    expect(f.calls).toEqual([
      'apply_prepared_design',
      'apply_prepared_design',
      'apply_prepared_design'
    ])
    for (const [name, count] of [
      ['tiers', 9024],
      ['base', 3900],
      ['crown', 1056]
    ] as const) {
      expect(core.getElementChildren(String(roots[name]), 0, 1).total).toBe(
        count
      )
      expect(JSON.stringify(result)).not.toContain(roots[name])
    }
  } finally {
    await f.dispose()
  }
}, 60000)

it.each([false, true])(
  'forwards recorded template maps and preserves artifact lifetime rejection (original=%s)',
  async (original) => {
    const scope = createConversationResults(() => 1).open(
      'recorded-template-forwarding'
    )
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      async (request) => scope.exchange(request)
    )

    try {
      const source = await f.call('design_preparation.prepare_design', {
        draft: templateForwarding.source
      })

      expect(source.available).toBe(true)
      const request = structuredClone(templateForwarding.request)

      request.operations[0].arguments.artifactId = source.artifactId
      if (!original) {
        Reflect.deleteProperty(request.retain, 'crownArtifact')
        Reflect.deleteProperty(request.retain, 'detailArtifact')
      }

      const result = await f.call('design_operations.execute_design', request)

      if (original) {
        expect(result).toMatchObject({
          toolOutcome: { status: 'failed', settlement: 'not-started' }
        })
        expect(JSON.stringify(result)).toContain(
          'Nonportable result selection: crownArtifact (step crown, path /artifactId)'
        )
        expect(f.calls).toEqual([])
        expect(result.saved).toBeUndefined()

        return
      }

      expect(result, JSON.stringify(result)).toMatchObject({
        saved: ['taipeiTemplates', 'crownRoots', 'detailRoots'],
        toolOutcome: { status: 'success' }
      })
      expect(f.calls).toEqual([
        'apply_prepared_design',
        'apply_prepared_design'
      ])

      const saved = scope.exchange({
        read: { templates: { name: 'taipeiTemplates', path: '' } }
      })

      expect(saved.templates).toMatchObject({
        motifTemplates: templateForwarding.source.motifTemplates
      })
    } finally {
      await f.dispose()
    }
  },
  60000
)

it('composes recorded source and calculation inputs before a canonical grouping write', async () => {
  const scope = createConversationResults(() => 1).open('recorded-facts')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request),
    true,
    true
  )
  const { default: core } = await import('../../src/contexts')

  core.createElementInParent(
    { id: 'second-source-target', type: 'rect', width: 10, height: 10 },
    recorded.create.parentId
  )
  try {
    const input = structuredClone(continuation.factsSequence.input)

    input.operations[2].arguments = {
      elementIds: [anchor, 'second-source-target']
    } as never
    input.retain.taipeiGroupReceipt.path =
      '/actionResults/0/result/value/groupId'
    const result = await f.call('design_operations.execute_design', input)

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.saved).toEqual([
      'taipeiFactReceipt',
      'taipeiScaleNotes',
      'taipeiGroupReceipt'
    ])
    expect(
      f.exchanges
        .flat()
        .filter((name) => name === 'api_hierarchy_groupElements')
    ).toHaveLength(1)
    const calculations = await f.call(
      'design_operations.record_design_calculations',
      {}
    )

    expect(calculations.calculations[0].value).toBe(50800)
  } finally {
    await f.dispose()
  }
})

it('stops an invalid recorded source before calculations or canonical writes', async () => {
  const scope = createConversationResults(() => 1).open('invalid-facts')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request),
    true,
    true
  )

  try {
    const input = structuredClone(continuation.factsSequence.input)

    input.operations[0].arguments.facts = [
      {
        ...continuation.factsSequence.input.operations[0].arguments.facts?.[0],
        statement: ''
      }
    ] as never
    const result = await f.call('design_operations.execute_design', input)

    expect(result.toolOutcome.status).toBe('failed')
    expect(f.calls).toEqual([])
    const calculations = await f.call(
      'design_operations.record_design_calculations',
      {}
    )

    expect(calculations.calculations, JSON.stringify(calculations)).toEqual([])
  } finally {
    await f.dispose()
  }
})

it.each([false, true])(
  'keeps a delivered artifact usable after selected result delivery (laterStep=%s)',
  async (laterStep) => {
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      undefined,
      true,
      true
    )
    const draft = {
      type: 'group',
      name: 'Selected stage',
      key: 'stage',
      children: [
        {
          type: 'rect',
          key: 'panel',
          name: 'Panel',
          width: 20,
          height: 30,
          x: 0,
          y: 0,
          fill: '#345678'
        }
      ]
    }

    try {
      const operations = [
        {
          id: 'draw',
          name: 'prepare_and_apply_design',
          arguments: { draft, inspection: 'defer' }
        }
      ]

      if (laterStep) {
        operations.push({
          id: 'next',
          name: 'prepare_and_apply_design',
          arguments: { draft, inspection: 'defer' }
        })
      }

      const reply = await f.call('design_operations.execute_design', {
        operations,
        delivery: { fields: { result: { step: 'draw', path: '' } } }
      })

      expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
      expect(() =>
        f.prep.resolveTargets({
          artifactId: reply.fields.result.artifactId,
          keys: ['panel']
        })
      ).not.toThrow()
      await f.call('design_operations.define_design_criteria', {
        method: 'Canonical data',
        references: [],
        detailRequired: false,
        criteria: {
          scale: {
            requirement: 'Width 20',
            description: 'Width equals 20',
            verification: 'data'
          }
        }
      })
      const before = f.exchanges
        .flat()
        .filter((n) => n === 'read_design_context').length
      const data = await f.call('design_operations.review_drawing', {
        phase: 'visual',
        dataQueries: [
          {
            criterionId: 'scale',
            artifacts: [
              { artifactId: reply.fields.result.artifactId, keys: ['panel'] }
            ],
            fields: ['width']
          }
        ]
      })

      expect(data.toolOutcome.status, JSON.stringify(data)).toBe('success')
      expect(data.dataEvidence[0].values.elements[0].properties.width).toBe(20)
      expect(
        f.exchanges.flat().filter((n) => n === 'read_design_context').length -
          before
      ).toBe(1)
    } finally {
      await f.dispose()
    }
  }
)

it('retains a direct drawing draft and root without an extra delegation', async () => {
  const scope = createConversationResults(() => 1).open('direct-stage')
  const f = await fixture(false, recorded.create.parentId, anchor, async (r) =>
    scope.exchange(r)
  )
  const draft = {
    type: 'group',
    name: 'Saved stage',
    key: 'stage',
    children: [
      {
        type: 'rect',
        key: 'panel',
        name: 'Panel',
        width: 20,
        height: 30,
        x: 0,
        y: 0,
        fill: '#345678'
      }
    ]
  }

  try {
    const reply = await f.call('design_workflow.prepare_and_apply_design', {
      draft,
      inspection: 'defer',
      retain: {
        stageDraft: { source: 'input', path: '/draft' },
        stageRoot: { path: '/compositionIds/0' }
      },
      delivery: 'status'
    })

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(reply.saved).toEqual(['stageDraft', 'stageRoot'])
    expect(reply).not.toHaveProperty('fields')
    expect(
      scope.exchange({
        read: {
          draft: { name: 'stageDraft', path: '' },
          root: { name: 'stageRoot', path: '' }
        }
      })
    ).toEqual({ draft, root: f.root() })
    expect(f.calls).toEqual(['apply_prepared_design'])
  } finally {
    await f.dispose()
  }

  const next = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request),
    false
  )

  try {
    const reply = await next.call('design_operations.execute_design', {
      operations: [
        {
          id: 'continue',
          name: 'prepare_and_apply_design',
          arguments: {
            draft: { kind: 'named', name: 'stageDraft', path: '' },
            inspection: 'defer'
          }
        }
      ],
      delivery: 'status'
    })

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(next.calls).toEqual(['apply_prepared_design'])
    expect(reply).not.toHaveProperty('fields')
  } finally {
    await next.dispose()
  }
})

it.each(['missing-context', 'save-failure', 'nested-options'])(
  'preserves direct delivery admission and settled writes (%s)',
  async (mode) => {
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      mode === 'save-failure'
        ? async () => {
            throw Error('Store unavailable')
          }
        : undefined
    )
    const input = {
      draft: {
        type: 'group',
        name: 'Saved stage',
        children: [
          { type: 'rect', key: 'panel', name: 'Panel', width: 20, height: 30 }
        ]
      },
      inspection: 'defer',
      retain: { stageRoot: { path: '/compositionIds/0' } }
    }

    try {
      const reply =
        mode === 'nested-options'
          ? await f.call('design_operations.execute_design', {
              operations: [
                {
                  id: 'draw',
                  name: 'prepare_and_apply_design',
                  arguments: input
                }
              ]
            })
          : await f.call('design_workflow.prepare_and_apply_design', input)

      expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe(
        mode === 'save-failure' ? 'partial' : 'failed'
      )
      expect(f.calls).toEqual(
        mode === 'save-failure' ? ['apply_prepared_design'] : []
      )
      expect(reply.toolOutcome.settlement).toBe(
        mode === 'save-failure' ? 'completed' : 'not-started'
      )
    } finally {
      await f.dispose()
    }
  }
)

it('replays the recorded smooth ornament delivery and subsequent artifact data query', async () => {
  const context = createConversationResults(() => 1).open('recorded-correction')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (r) => context.exchange(r),
    true,
    true
  )
  const input = structuredClone(continuation.correction)
  const operation = input.operations[1]
  const { parentId: _parent, ...arguments_ } = operation.arguments

  try {
    const reply = await f.call('design_operations.execute_design', {
      ...input,
      operations: [{ ...operation, arguments: arguments_ }]
    })

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(reply.saved).toEqual(['taipeiSmoothDraft', 'taipeiSmoothRoot'])
    await f.call('design_operations.define_design_criteria', {
      method: 'Native geometry',
      references: [],
      detailRequired: false,
      criteria: {
        editable: {
          requirement: 'Editable geometry',
          description: 'Native shapes',
          verification: 'data'
        }
      }
    })
    const query = continuation.dataReview.input.dataQueries[1]
    const data = await f.call('design_operations.review_drawing', {
      phase: 'visual',
      dataQueries: [
        {
          ...query,
          artifacts: [
            {
              ...query.artifacts[2],
              artifactId: reply.fields.result.artifactId
            }
          ]
        }
      ]
    })

    expect(data.toolOutcome.status, JSON.stringify(data)).toBe('success')
    expect(data.dataEvidence[0].values.elements).toHaveLength(1)
    expect(f.calls).toEqual(['apply_prepared_design'])
  } finally {
    await f.dispose()
  }
})

it('publishes direct host retention fields in the recorded scoped discovery request', async () => {
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    undefined,
    true,
    true
  )

  try {
    for (const optionalInputs of [['plan', 'retain'], []]) {
      const reply = await f.call('design_operations.describe_design_apis', {
        names: ['prepare_and_apply_design'],
        view: 'usage',
        inputScope: {
          operation: 'draft',
          nodeTypes: ['projected-face', 'surface-grid', 'pattern'],
          optionalInputs
        }
      })

      expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
      expect(JSON.stringify(reply)).not.toContain(
        'Only optional canonical root inputs'
      )
    }

    expect(f.calls).toEqual([])
  } finally {
    await f.dispose()
  }
})

it('replays the six recorded fill and order operations with bounded delivery and canonical painter order', async () => {
  const { default: core } = await import('../../src/contexts')
  const input = mutationDelivery.input
  const tierTarget = input.operations[0].target
  const baseTarget = input.operations[1].target

  if (
    Array.isArray(tierTarget) ||
    Array.isArray(baseTarget) ||
    !tierTarget?.query?.filter?.ancestorId ||
    !baseTarget?.query?.filter?.ancestorId
  ) {
    throw new Error('Recorded facade targets are missing')
  }

  const tierParent = tierTarget.query.filter.ancestorId
  const baseParent = baseTarget.query.filter.ancestorId
  const regionMembers: string[] = []
  const f = await fixture(
    false,
    tierParent,
    'unused-anchor',
    undefined,
    true,
    false,
    regionMembers
  )

  try {
    core.createElementInParent(
      { id: baseParent, type: 'group', name: 'Base' },
      'workspace'
    )
    core.createElementInParent(
      {
        id: 'reflection-anchor',
        type: 'rect',
        name: '竹節主要窗框與反射層次',
        x: 7000,
        y: 13000,
        width: 10,
        height: 10
      },
      tierParent
    )
    regionMembers.push('reflection-anchor')
    const members = [
      {
        id: 'tier-window',
        name: '獨立玻璃窗與窗框反光',
        parent: tierParent,
        type: 'rect',
        x: 7000,
        y: 13000
      },
      {
        id: 'base-window',
        name: '玻璃與細框反光',
        parent: baseParent,
        type: 'rect',
        x: 7000,
        y: 38000
      },
      {
        id: 'reflection',
        name: '分片玻璃反射層',
        parent: tierParent,
        type: 'rect',
        x: 7000,
        y: 13000
      },
      {
        id: 'coin',
        name: 'Coin',
        parent: tierParent,
        type: 'oval',
        x: 7000,
        y: 13000
      },
      {
        id: 'ornament-stem',
        name: '如意垂飾金屬柄',
        parent: tierParent,
        type: 'rect',
        x: 7000,
        y: 13000
      },
      {
        id: 'ornament-band',
        name: '正面如意飾帶',
        parent: tierParent,
        type: 'rect',
        x: 7000,
        y: 13000
      }
    ]

    for (const { parent, ...member } of members) {
      core.createElementInParent({ ...member, width: 10, height: 10 }, parent)
      regionMembers.push(member.id)
    }

    // Start decorations behind the anchor so all recorded order operations mutate.
    core.moveElements({
      elementIds: ['coin', 'ornament-stem', 'ornament-band'],
      targetParentId: tierParent,
      targetIndex: 0
    })
    const reply = await f.call('design_operations.execute_design', input)

    expect(reply, JSON.stringify(reply)).toMatchObject({
      actionResults: expect.any(Array)
    })
    expect(reply.actionResults).toHaveLength(6)
    expect(
      reply.actionResults.map(
        (entry: { result: { status: string } }) => entry.result.status
      )
    ).toEqual([
      'no-change',
      'no-change',
      'complete',
      'complete',
      'complete',
      'complete'
    ])
    for (const result of reply.actionResults) {
      expect(result.result).toMatchObject({
        retained: { snapshotId: expect.any(String) }
      })
      expect(result.result).not.toHaveProperty('acceptedIds')
      expect(result.result).not.toHaveProperty('unavailableIds')
    }

    expect(
      reply.actionResults
        .slice(0, 3)
        .map(
          (x: { result: { acceptedCount: number } }) => x.result.acceptedCount
        )
    ).toEqual([1, 1, 1])
    expect(JSON.stringify(reply).length).toBeLessThan(16000)
    const siblings = f.siblings()

    for (const id of ['coin', 'ornament-stem', 'ornament-band']) {
      expect(siblings.indexOf(id)).toBeGreaterThan(
        siblings.indexOf('reflection-anchor')
      )
    }

    expect(
      f.exchanges
        .flat()
        .filter((name) => name === 'api_fill_updateFillsAtIndex')
    ).toHaveLength(3)
    expect(
      f.calls.filter((name) => name === 'api_hierarchy_moveElementsRelative')
    ).toHaveLength(3)
  } finally {
    await f.dispose()
  }
})

it('maps shared gradient owners to solid locally without changing their shared source', async () => {
  const { default: core } = await import('../../src/contexts')
  const { fillApis } = await import('../../src/common-apis')
  const { createDefaultGradientData } = await import('@asyra/utils')
  const original = fillApis.updateFillFieldsBatch
  let writes = 0

  fillApis.updateFillFieldsBatch = (...args) => {
    writes++

    return original(...args)
  }

  const f = await fixture()

  try {
    for (const id of ['paint-source', 'paint-selected', 'paint-untouched']) {
      core.createElementInParent(
        { id, name: id, type: 'rect', x: 50, y: 0, width: 10, height: 10 },
        'workspace'
      )
    }

    fillApis.updateFillsAtIndex(['paint-source'], 0, {
      kind: 'gradient',
      gradient: createDefaultGradientData()
    })
    fillApis.shareFillAtIndex(
      'paint-source',
      ['paint-selected', 'paint-untouched'],
      0
    )

    const fills = (id: string) =>
      core.getElementComputedData(id, ['fills'])?.fills

    const sourceBefore = structuredClone(fills('paint-source'))
    const untouchedBefore = structuredClone(fills('paint-untouched'))

    writes = 0

    const mapping = {
      query: { scope: 'ids', elementIds: ['paint-selected'] },
      coordinateSpace: 'parent-local',
      axis: 'x',
      domain: [0, 100],
      index: 0,
      outside: 'clamp',
      stops: [
        { at: 0, color: '#000000' },
        { at: 1, color: '#ffffff' }
      ]
    }

    const execute = (parameters: unknown) =>
      f.call('design_operations.execute_design', {
        inspection: 'defer',
        operations: [
          { name: 'map_retained_fills', arguments: { mappings: [parameters] } }
        ]
      })

    const first = await execute(mapping)

    expect(first.actionResults[0].result).toMatchObject({
      status: 'complete',
      appliedCount: 1
    })
    expect(fills('paint-selected')[0]).toMatchObject({
      kind: 'gradient',
      color: '#808080',
      gradient: sourceBefore[0].gradient
    })
    const solid = await execute({ ...mapping, kind: 'solid' })

    expect(solid.actionResults[0].result).toMatchObject({
      status: 'complete',
      appliedCount: 1
    })
    expect(fills('paint-selected')[0]).toMatchObject({
      kind: 'solid',
      color: '#808080',
      gradient: null
    })
    expect(fills('paint-source')).toEqual(sourceBefore)
    expect(fills('paint-untouched')).toEqual(untouchedBefore)
    expect(writes).toBe(2)
    const [root] = core.readElementPropertyTargets([
      { elementId: 'paint-selected', propertyName: 'fills', path: [] }
    ])
    const child = root.children[0]
    const [binding] = core.readElementPropertyTargets([
      {
        elementId: 'paint-selected',
        propertyName: 'fills',
        path: [{ key: child.key, childId: child.childId }]
      }
    ])

    expect(binding.mode).toBe('source-backed')
  } finally {
    fillApis.updateFillFieldsBatch = original
    await f.dispose()
  }
})

it('composes recorded authored criteria before facts and canonical drawing admission', async () => {
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    undefined,
    true,
    true
  )

  try {
    const definitions = f.host.definitions()

    const resolve = (name: string) => {
      const definition = definitions.find(
        (item) => item.name === name || item.registeredName === name
      )

      return definition
        ? createAiToolContract({
            ...definition,
            name: definition.registeredName
          })
        : undefined
    }

    for (const operation of strictCriteria.input.operations) {
      const definition = resolve(operation.name)

      expect(definition, operation.name).toBeDefined()
      expect(
        operationInputIssue(
          operation.arguments,
          definition?.inputSchema ?? false
        ),
        operation.name
      ).toBeUndefined()
    }

    const planner = createDesignSequencePlanner(
      undefined,
      resolve,
      () => undefined
    )

    const criteriaInput = structuredClone(strictCriteria.input)

    for (const key of ['taipeiBase', 'taipeiTiers', 'taipeiCrown'] as const) {
      criteriaInput.retain[key].path = '/compositionIds'
    }

    expect(() => planner(criteriaInput)).not.toThrow()
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        ...strictCriteria.input.operations.slice(0, 2),
        {
          id: 'draw',
          name: 'prepare_and_apply_design',
          arguments: {
            inspection: 'defer',
            draft: {
              type: 'group',
              name: 'Criteria composition',
              children: [
                {
                  type: 'rect',
                  key: 'panel',
                  width: 10,
                  height: 10,
                  name: 'Panel'
                }
              ]
            }
          }
        }
      ],
      delivery: {
        fields: {
          criteria: { step: 'criteria', path: '' },
          facts: { step: 'facts', path: '/facts' },
          roots: { step: 'draw', path: '/compositionIds' }
        }
      }
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      toolOutcome: { status: 'success' },
      fields: {
        criteria: {
          recorded: true,
          criterionIds: ['whole', 'view', 'detail', 'scale', 'editable']
        },
        facts: expect.any(Array),
        roots: [expect.any(String)]
      }
    })
    expect(result.fields.facts).toHaveLength(2)
    expect(f.calls).toEqual(['apply_prepared_design'])
  } finally {
    await f.dispose()
  }
})

it('rejects recorded invalid stage input selections before canonical writes', async () => {
  const scope = createConversationResults(() => 1).open('strict-retention')
  const f = await fixture(false, recorded.create.parentId, anchor, async (r) =>
    scope.exchange(r)
  )

  try {
    const input = structuredClone(strictRetention.input)

    input.operations = input.operations.map((operation) => ({
      ...operation,
      arguments: {
        inspection: 'defer',
        draft: {
          type: 'group',
          name: operation.id,
          key: operation.id,
          children: [
            { type: 'rect', key: 'panel', name: 'Panel', width: 10, height: 10 }
          ]
        }
      }
    })) as typeof input.operations
    // Preserve all four recorded selectors with small canonical geometry.
    const result = await f.call('design_operations.execute_design', input)

    expect(result.toolOutcome.settlement, JSON.stringify(result)).toBe(
      'not-started'
    )
    expect(result.toolOutcome.status).toBe('failed')
    expect(result.message).toContain('Invalid authored input selection')
    expect(f.calls).toEqual([])
  } finally {
    await f.dispose()
  }
})

it('uses ordinary operation arguments as the shared authored input selection root', async () => {
  const scope = createConversationResults(() => 1).open('uniform-input')
  const f = await fixture(false, recorded.create.parentId, anchor, async (r) =>
    scope.exchange(r)
  )

  try {
    const result = await f.call('design_operations.execute_design', {
      operations: [
        {
          id: 'group',
          name: 'api_hierarchy_groupElements',
          arguments: { elementIds: [anchor] }
        }
      ],
      retain: {
        targets: { step: 'group', source: 'input', path: '/elementIds' }
      },
      delivery: {
        fields: { ids: { step: 'group', source: 'input', path: '/elementIds' } }
      },
      inspection: 'defer'
    })

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.fields).toEqual({ ids: [anchor] })
    expect(
      scope.exchange({ read: { ids: { name: 'targets', path: '' } } })
    ).toEqual({ ids: [anchor] })
  } finally {
    await f.dispose()
  }
})

it.each([false, true])(
  'validates recorded whole-result retention before writes and saves selected stage context (portable=%s)',
  async (portable) => {
    const scope = createConversationResults(() => 1).open(
      'retention-portability'
    )
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      async (r) => scope.exchange(r)
    )

    try {
      const input = structuredClone(strictRetention.input)

      input.operations = input.operations.map((operation) => ({
        ...operation,
        arguments: {
          inspection: 'defer',
          draft: {
            type: 'group',
            name: operation.id,
            children: [
              {
                type: 'rect',
                key: 'panel',
                name: 'Panel',
                width: 10,
                height: 10
              }
            ]
          }
        }
      })) as typeof input.operations
      input.retain.baseSource.path = '/draft'
      input.retain.tiersSource.path = '/draft'
      if (portable) {
        input.retain.base.path = '/compositionIds'
        input.retain.tiers.path = '/compositionIds'
      }

      const result = await f.call('design_operations.execute_design', input)

      if (!portable) {
        expect(result.toolOutcome.settlement, JSON.stringify(result)).toBe(
          'not-started'
        )
        expect(f.calls).toEqual([])
      } else {
        expect(result.toolOutcome.status, JSON.stringify(result)).toBe(
          'success'
        )
        expect(result.saved.sort()).toEqual([
          'base',
          'baseSource',
          'tiers',
          'tiersSource'
        ])
        const saved = scope.exchange({
          read: {
            source: { name: 'baseSource', path: '' },
            ids: { name: 'base', path: '' }
          }
        })

        expect(saved.source).toEqual(input.operations[0].arguments.draft)
        expect(saved.ids).toHaveLength(1)
        expect(f.calls).toEqual([
          'apply_prepared_design',
          'apply_prepared_design'
        ])
      }
    } finally {
      await f.dispose()
    }
  }
)

it.each([false, true])(
  'publishes portable result selections from the same owner lifetime contract (machine=%s)',
  async (machine) => {
    const f = await fixture()

    try {
      let reply = await f.call('design_operations.describe_design_apis', {
        names: ['prepare_and_apply_design'],
        view: 'usage',
        includeResultSchema: machine,
        inputScope: {
          operation: 'draft',
          nodeTypes: ['rect'],
          optionalInputs: ['retain']
        }
      })

      if (reply.contentDelivery) {
        let text = reply.contentDelivery.text

        while (!reply.contentDelivery.lastPage) {
          reply = await f.call(
            'design_operations.describe_design_apis',
            reply.contentDelivery.next.arguments
          )
          text += reply.contentDelivery.text
        }

        reply = JSON.parse(text)
      }

      expect(reply.tools, JSON.stringify(reply)).toBeDefined()
      expect(reply.tools[0].usageGuide.retention).toMatchObject({
        inputRoot: 'operation.arguments',
        scope: 'conversation',
        wholeResultAllowed: false
      })
      expect(
        reply.tools[0].usageGuide.retention.guaranteedResultFields
      ).toContain('/compositionIds')
      expect(
        reply.tools[0].usageGuide.retention.guaranteedResultFields
      ).not.toContain('/artifactId')
      expect(
        reply.tools[0].usageGuide.retention.forbiddenResultFields
      ).toContain('/artifactId')
      if (!machine) {
        expect(reply.tools[0].usageGuide.results.guaranteedFields).toContain(
          '/toolOutcome'
        )
        expect(
          reply.tools[0].usageGuide.results.guaranteedFields
        ).not.toContain('/artifactId')
        expect(reply.tools[0].usageGuide.results.conditionalFields).toContain(
          '/artifactId'
        )
        expect(reply.tools[0].usageGuide.results).not.toHaveProperty('fields')
      }

      expect(reply.tools[0].usageGuide.retention).not.toHaveProperty(
        'wholeResult'
      )
    } finally {
      await f.dispose()
    }
  }
)

it('keeps target-bound action input retention free of the internal host envelope', async () => {
  const scope = createConversationResults(() => 1).open('target-bound-input')
  const f = await fixture(false, recorded.create.parentId, anchor, async (r) =>
    scope.exchange(r)
  )

  try {
    const draw = await f.call('design_workflow.prepare_and_apply_design', {
      inspection: 'defer',
      draft: {
        type: 'group',
        name: 'Group source',
        children: [
          { type: 'rect', key: 'panel', name: 'Panel', width: 10, height: 10 }
        ]
      }
    })

    expect(draw.toolOutcome.status).toBe('success')
    const result = await f.call('design_operations.execute_design', {
      operations: [
        {
          id: 'group',
          name: 'api_hierarchy_groupElements',
          arguments: {},
          target: {
            field: 'elementIds',
            artifactId: draw.artifactId,
            keys: ['panel']
          }
        }
      ],
      retain: { input: { step: 'group', source: 'input', path: '' } },
      inspection: 'defer'
    })

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(
      scope.exchange({ read: { input: { name: 'input', path: '' } } })
    ).toEqual({ input: {} })
  } finally {
    await f.dispose()
  }
})

it('matches each recorded delivery path against actual host guarantees', async () => {
  const f = await fixture()

  try {
    const owner = f.host
      .definitions()
      .find(
        (d) => d.registeredName === 'design_workflow.prepare_and_apply_design'
      )

    if (!owner) {
      throw new Error('Missing workflow contract')
    }

    expect(owner.outputSchema).toHaveProperty(
      'required',
      expect.arrayContaining(['toolOutcome'])
    )
    for (const selector of Object.values(strictOutput.input.delivery.fields)) {
      const read = () =>
        registeredRecipeOutputAt(owner.outputSchema, selector.path)

      if (selector.path === '/artifactId') {
        expect(read).toThrow(/not guaranteed|absent/)
      } else {
        expect(read, selector.path).not.toThrow()
      }
    }
  } finally {
    await f.dispose()
  }
})

it.each([false, true])(
  'admits guaranteed recorded delivery and locates conditional rejection (portable=%s)',
  async (portable) => {
    const f = await fixture()

    try {
      const result = await f.call('design_operations.execute_design', {
        operations: strictOutput.input.operations.map((operation) => ({
          ...operation,
          arguments: {
            inspection: 'defer',
            draft: {
              type: 'group',
              name: operation.id,
              children: [
                {
                  type: 'rect',
                  key: 'panel',
                  name: 'Panel',
                  width: 10,
                  height: 10
                }
              ]
            }
          }
        })),
        delivery: {
          fields: Object.fromEntries(
            Object.entries(strictOutput.input.delivery.fields).filter(
              ([, selector]) => !portable || selector.path !== '/artifactId'
            )
          )
        }
      })

      if (portable) {
        expect(result.toolOutcome.status, JSON.stringify(result)).toBe(
          'success'
        )
        expect(result.fields).toMatchObject({
          base: expect.any(Array),
          tiers: expect.any(Array),
          tierOutcome: { status: 'success', settlement: 'completed' }
        })
        expect(f.calls).toEqual([
          'apply_prepared_design',
          'apply_prepared_design'
        ])
      } else {
        expect(result.toolOutcome.settlement).toBe('not-started')
        expect(result.message).toContain('delivery.fields.baseArtifact')
        expect(result.message).toContain('base')
        expect(result.message).toContain('/artifactId')
        expect(f.calls).toEqual([])
      }
    } finally {
      await f.dispose()
    }
  }
)

it.each([false, true])(
  'replays the fourth strict whole-result selection without hidden pruning (portable=%s)',
  async (portable) => {
    const scope = createConversationResults(() => 1).open('strict-whole-result')
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      async (r) => scope.exchange(r)
    )

    try {
      const input = structuredClone(strictWholeResult.input)

      if (portable) {
        input.retain.baseReceipt.path = '/compositionIds'
        Reflect.deleteProperty(input.delivery.fields, 'artifact')
        // Selector recovery uses a small canonical draw; the original source is preserved in the fixture.
        input.operations[0].arguments = {
          inspection: 'defer',
          draft: {
            type: 'group',
            name: 'Base',
            children: [
              {
                type: 'rect',
                name: 'Panel',
                key: 'panel',
                width: 10,
                height: 10
              }
            ]
          }
        } as (typeof input.operations)[0]['arguments']
      }

      const result = await f.call('design_operations.execute_design', input)

      if (!portable) {
        expect(result.toolOutcome, JSON.stringify(result)).toMatchObject({
          status: 'failed',
          settlement: 'not-started'
        })
        expect(result.message).toContain(
          'Nonportable result selection: baseReceipt'
        )
        expect(f.calls).toEqual([])

        return
      }

      expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
      expect(result.saved).toEqual(['baseReceipt', 'baseAuthored'])
      expect(
        scope.exchange({
          read: {
            roots: { name: 'baseReceipt', path: '' },
            source: { name: 'baseAuthored', path: '' }
          }
        })
      ).toMatchObject({
        roots: result.fields.base,
        source: input.operations[0].arguments.draft
      })
      expect(result.fields.status.status).toBe('success')
      expect(f.calls).toEqual(['apply_prepared_design'])
    } finally {
      await f.dispose()
    }
  }
)

it.each([false, true])(
  'replays the fifth strict stage-context selection with explicit portable recovery (portable=%s)',
  async (portable) => {
    const scope = createConversationResults(() => 1).open(
      'strict-stage-context'
    )
    const f = await fixture(
      false,
      recorded.create.parentId,
      anchor,
      async (r) => scope.exchange(r),
      true,
      true
    )

    try {
      const input = structuredClone(strictArtifactRetention.input)

      if (portable) {
        Reflect.deleteProperty(input.retain, 'baseArtifact')
        Reflect.deleteProperty(input.delivery.fields, 'artifact')
        Reflect.deleteProperty(input.delivery.fields, 'parts')
        const draft = input.operations[2].arguments.draft

        if (!draft) {
          throw Error('Missing recorded source')
        }

        draft.children = [
          { type: 'rect', key: 'panel', name: 'Panel', width: 10, height: 10 }
        ] as typeof draft.children
      }

      const result = await f.call('design_operations.execute_design', input)

      if (!portable) {
        expect(result.toolOutcome, JSON.stringify(result)).toMatchObject({
          status: 'failed',
          settlement: 'not-started'
        })
        expect(result.message).toContain(
          'Nonportable result selection: baseArtifact'
        )
        expect(f.calls).toEqual([])

        return
      }

      expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
      expect(result.saved).toEqual([
        'baseRoot',
        'projection',
        'materials',
        'windows'
      ])
      expect(
        scope.exchange({
          read: {
            root: { name: 'baseRoot', path: '' },
            projection: { name: 'projection', path: '' },
            materials: { name: 'materials', path: '' },
            windows: { name: 'windows', path: '' }
          }
        })
      ).toEqual({
        root: result.fields.base[0],
        projection: input.operations[2].arguments.draft?.projection,
        materials: input.operations[2].arguments.draft?.fillTemplates,
        windows: input.operations[2].arguments.draft?.motifTemplates
      })
      expect(f.calls).toEqual(['apply_prepared_design'])
    } finally {
      await f.dispose()
    }
  }
)
