import providerHandoffs from './fixtures/recorded-101/provider-handoffs-20261109.json'
import targetGroupCapture from './fixtures/recorded-101/target-group-capture-20261109.json'
import independentDelivery from './fixtures/recorded-101/independent-delivery-20261109.json'
import { readCompleteInformation } from './tool-contract-assertions'
import executableHandoffs from '../../test-data/ai-drawing/fixtures/executable-handoffs-20261109.json'
import { operationInputIssue } from '../operation-input-schema'
import referenceChain from '../../test-data/ai-drawing/fixtures/reference-chain-20261108.json'
import phaseContinuity from '../../test-data/ai-drawing/fixtures/phase-continuity-20261108.json'
import resultRoute from '../../test-data/ai-drawing/fixtures/result-route-stop-20261107.json'
import { evaluationToolStop } from '../evaluation-control'
import { modelToolResultSchemas } from '../../src/ai/tool-contract'
import strictArtifactRetention from './fixtures/recorded-101/strict-artifact-retention-20261106.json'
import strictWholeResult from './fixtures/recorded-101/strict-whole-result-20261106.json'
import strictOutput from './fixtures/recorded-101/strict-output-selection-20261106.json'
import strictRetention from './fixtures/recorded-101/strict-retention-20261106.json'
import strictCriteria from './fixtures/recorded-101/strict-criteria-20261106.json'
import { createRetainedFillAction } from '../../src/ai/retained-fill-action'
import mutationDelivery from './fixtures/recorded-101/mutation-delivery-20261106.json'
import continuation from './fixtures/recorded-101/continuation-contracts-20261106.json'
import templateForwarding from './fixtures/recorded-101/template-forwarding-20261105.json'
// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import {
  createAiToolContract,
  registeredRecipeOutputAt
} from '@asyra/ai-agent-runtime'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalDesignTools } from '../local-design-tools'
import {
  createLocalOperationTools,
  localToolContent
} from '../local-operation-tools'
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

it.each(
  [false, true]
    .flatMap((retain) =>
      ['default', 'status', 'fields'].map((delivery) => ({
        retain,
        delivery,
        saveFailure: false
      }))
    )
    .concat([{ retain: true, delivery: 'default', saveFailure: true }])
)(
  'delivers the recorded repaired crown capture with retain=$retain delivery=$delivery saveFailure=$saveFailure',
  async ({ retain, delivery, saveFailure }) => {
    const context = createConversationResults(() => 1).open(
      'independent-delivery'
    )
    let captures = 0
    const f = await fixture(
      false,
      undefined,
      undefined,
      (command) => {
        if (saveFailure && 'save' in command) {
          throw Error('Store unavailable')
        }

        return context.exchange(command)
      },
      true,
      true,
      undefined,
      () => {
        captures++

        return {
          available: true,
          image: {
            dataUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            width: 1,
            height: 1
          }
        }
      }
    )

    try {
      const rejected = await f.call(
        'design_operations.execute_design',
        independentDelivery.rejected
      )

      expect(rejected.toolOutcome.status).toBe('failed')
      const draftId = rejected.failure.execution.recovery[0].value.draftId
      const input = structuredClone(independentDelivery.input)
      const repair = input.operations[0].arguments.repair

      if (!repair || !draftId) {
        throw Error('Missing recorded repair source')
      }

      repair.draftId = draftId
      if (!retain) {
        Reflect.deleteProperty(input, 'retain')
      }

      if (delivery !== 'default') {
        Object.assign(input, {
          delivery:
            delivery === 'status'
              ? 'status'
              : {
                  fields: {
                    overview: { step: 'whole', path: '/actionResults' }
                  }
                }
        })
      }

      const reply = await f.host.invoke({
        name: 'design_operations.execute_design',
        input
      })
      const result = JSON.parse(reply.text)

      expect(reply.success, reply.text).toBe(!saveFailure)
      expect(result.toolOutcome.status).toBe(
        saveFailure ? 'partial' : 'success'
      )
      expect(
        (await localToolContent(reply.text, reply.media)).filter(
          (item) => item.type === 'inputImage'
        )
      ).toHaveLength(delivery === 'status' ? 0 : 1)
      if (delivery === 'default') {
        expect(result.execution.value.actionResults[0].result.available).toBe(
          true
        )
      }

      if (delivery === 'fields') {
        expect(result.fields.overview[0].result.available).toBe(true)
      }

      if (delivery === 'status') {
        expect(result).not.toHaveProperty('execution')
        expect(result).not.toHaveProperty('fields')
      }

      expect(
        f.calls.filter((name) => name === 'apply_prepared_design')
      ).toHaveLength(1)
      expect(captures).toBe(1)
      expect(context.names()).toEqual(
        retain && !saveFailure ? ['taipeiCrownIds'] : []
      )
      if (retain && !saveFailure) {
        expect(result.saved[0].name).toBe('taipeiCrownIds')
      }
    } finally {
      await f.dispose()
    }
  },
  60000
)

it.each(
  [false, true].flatMap((retain) =>
    ['default', 'status', 'fields'].map((delivery) => ({ retain, delivery }))
  )
)(
  'preserves staged image delivery with retain=$retain delivery=$delivery',
  async ({ retain, delivery }) => {
    const context = createConversationResults(() => 1).open('stage-delivery')
    let captures = 0
    let saves = 0
    const f = await fixture(
      false,
      undefined,
      undefined,
      (command) => {
        if ('save' in command) {
          saves++
        }

        return context.exchange(command)
      },
      true,
      true,
      undefined,
      () => {
        captures++

        return {
          available: true,
          image: {
            dataUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            width: 1,
            height: 1
          }
        }
      }
    )

    try {
      const input = {
        inspection: 'defer',
        stages: [
          {
            id: 'panel',
            operations: [
              {
                id: 'source',
                name: 'prepare_design',
                arguments: {
                  draft: {
                    type: 'group',
                    name: 'Panel',
                    children: [
                      {
                        type: 'rect',
                        key: 'face',
                        name: 'Face',
                        width: 20,
                        height: 30
                      }
                    ]
                  }
                }
              }
            ],
            apply: [
              {
                id: 'apply',
                name: 'apply_prepared_design',
                arguments: {
                  artifactId: {
                    kind: 'step',
                    step: 'source',
                    path: '/artifactId'
                  }
                }
              },
              {
                id: 'capture',
                name: 'inspect_drawing',
                arguments: {
                  arguments: { elementId: 'workspace', view: 'overview' }
                }
              }
            ]
          }
        ],
        ...(retain
          ? {
              retain: {
                panelSource: { step: 'source', source: 'input', path: '/draft' }
              }
            }
          : {}),
        ...(delivery === 'default'
          ? {}
          : {
              delivery:
                delivery === 'status'
                  ? 'status'
                  : {
                      fields: {
                        image: { step: 'capture', path: '/actionResults' }
                      }
                    }
            })
      }
      const reply = await f.host.invoke({
        name: 'design_operations.execute_design',
        input
      })
      const result = JSON.parse(reply.text)

      expect(reply.success, reply.text).toBe(true)
      expect(
        (await localToolContent(reply.text, reply.media)).filter(
          (item) => item.type === 'inputImage'
        )
      ).toHaveLength(delivery === 'status' ? 0 : 1)
      expect(result.stages).toEqual([{ id: 'panel', status: 'applied' }])
      expect(
        f.calls.filter((name) => name === 'apply_prepared_design')
      ).toHaveLength(1)
      expect(captures).toBe(1)
      expect(saves).toBe(retain ? 1 : 0)
      expect(context.names()).toEqual(retain ? ['panelSource'] : [])
    } finally {
      await f.dispose()
    }
  }
)

it.each([false, true])(
  'preserves the direct drawing result with retain=%s',
  async (retain) => {
    const context = createConversationResults(() => 1).open('direct-default')
    const f = await fixture(false, undefined, undefined, (command) =>
      context.exchange(command)
    )

    try {
      const result = await f.call('design_workflow.prepare_and_apply_design', {
        draft: {
          type: 'group',
          name: 'Panel',
          children: [
            { type: 'rect', key: 'face', name: 'Face', width: 20, height: 30 }
          ]
        },
        inspection: 'defer',
        ...(retain ? { retain: { root: { path: '/compositionIds/0' } } } : {})
      })

      expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
      const drawing = retain ? result.execution.value : result

      expect(drawing.compositionIds).toEqual([f.root()])
      expect(drawing.actionResults[0].result.appliedElementCount).toBe(2)
      expect(f.calls).toEqual(['apply_prepared_design'])
      expect(context.names()).toEqual(retain ? ['root'] : [])
    } finally {
      await f.dispose()
    }
  }
)

it('delivers all three explicitly selected step results independently of saving', async () => {
  const context = createConversationResults(() => 1).open('three-selected')
  const f = await fixture(false, undefined, undefined, (command) =>
    context.exchange(command)
  )

  try {
    const result = await f.call('design_operations.execute_design', {
      operations: ['a', 'b', 'c'].map((id) => ({
        id,
        name: 'prepare_design',
        arguments: {
          draft: {
            type: 'group',
            name: id,
            children: [
              { type: 'rect', key: 'face', name: 'Face', width: 20, height: 30 }
            ]
          }
        }
      })),
      retain: { source: { step: 'a', source: 'input', path: '/draft' } },
      delivery: {
        fields: Object.fromEntries(
          ['a', 'b', 'c'].map((step) => [step, { step, path: '/elementCount' }])
        )
      }
    })

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.fields).toEqual({ a: 2, b: 2, c: 2 })
    expect(context.names()).toEqual(['source'])
    expect(f.calls).toEqual([])
  } finally {
    await f.dispose()
  }
})

it.each([false, true])(
  'preserves compact ready-batch results with retain=%s',
  async (retain) => {
    const context = createConversationResults(() => 1).open(
      'ready-batch-delivery'
    )
    const f = await fixture(false, undefined, anchor, (command) =>
      context.exchange(command)
    )

    try {
      const result = await f.call('design_operations.execute_design', {
        operations: [
          {
            name: 'api_hierarchy_groupElements',
            arguments: { elementIds: [anchor] }
          }
        ],
        inspection: 'defer',
        ...(retain
          ? {
              retain: {
                group: { path: '/actionResults/0/result/value/groupId' }
              }
            }
          : {})
      })

      expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
      expect(result.actionResults[0].result.value).toEqual({
        count: 1,
        groupId: expect.any(String)
      })
      expect(result.actionResults[0].result.mutationScope).not.toHaveProperty(
        'elementIds'
      )
      expect(result.actionResults[0].result).toHaveProperty(
        'retained.snapshotId'
      )
      expect(context.names()).toEqual(retain ? ['group'] : [])
      expect(
        f.exchanges
          .flat()
          .filter((name) => name === 'api_hierarchy_groupElements')
      ).toHaveLength(1)
    } finally {
      await f.dispose()
    }
  }
)

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
      retain: { windows: { step: 'definitions', path: '' } },
      delivery: 'status'
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: [expect.objectContaining({ name: 'windows' })],
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
  regionMembers?: string[] | (() => string[]),
  inspect?: (id: string) => unknown,
  validateReferences?: () => {
    referenceId: string
    attachmentIndex: number
    validation: { width: number; height: number }
  }[]
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
      const members =
        typeof regionMembers === 'function' ? regionMembers() : regionMembers

      return members.filter((id) => {
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
          createAiInspectionAction(
            inspect ??
              (() => {
                throw Error('Unexpected image capture')
              }),
            evidence
          )
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
          validateReferences,

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
    owners,
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
    const example = sequenceDefinition().inputSchema.examples.find(
      (value) => 'stages' in value
    )

    if (!example?.stages) {
      throw Error('Missing staged owner example')
    }

    const result = await f.call('design_operations.execute_design', example)

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: [expect.objectContaining({ name: 'panelSource' })],
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
        saved: [expect.objectContaining({ name: 'faceParameters' })],
        toolOutcome: { status: failure ? 'failed' : 'success' }
      })
      expect(f.calls).toEqual(
        failure
          ? ['apply_prepared_design']
          : ['apply_prepared_design', 'apply_prepared_design']
      )
      expect(f.count()).toBe(2)
      expect(f.siblings()).toHaveLength(failure ? 2 : 3)
      expect(result).not.toHaveProperty('artifactId')
      if (failure) {
        // Failed successors retain the canonical successful prefix for recovery.
        expect(result.execution.recovery[0].value.artifactId).toEqual(
          expect.any(String)
        )
        expect(evaluationToolStop(result)).toBeUndefined()
      }

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
      delivery: {
        fields: { created: { step: 'create', path: '/compositionIds/0' } }
      }
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
        expect(result.toolOutcome.status).not.toBe('success')
        expect(result.completed).toContain('create')
        expect(f.siblings()).toEqual([anchor, f.root()])
      } else {
        expect(result, JSON.stringify(result)).toMatchObject({
          toolOutcome: { status: 'success' },
          fields: { created: f.root() }
        })
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
      inspection: lastRun.remove.inspection,
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
      saved: [expect.objectContaining({ name: 'ornament' })],
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

    const args = {
      operations: [reuse.call843.operations[0]],
      inspection: 'defer'
    }
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
      saved: [expect.objectContaining({ name: id })],
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
    const request = {
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
    }
    const rejected = await f.call('design_operations.execute_design', request)

    expect(rejected.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(JSON.stringify(rejected)).toContain(
      'Nonportable result selection: expired'
    )
    expect(scope.names()).toEqual([])
    expect(f.calls).toEqual([])
    Reflect.deleteProperty(request.retain, 'expired')
    const ack = await f.call('design_operations.execute_design', request)

    expect(ack, JSON.stringify(ack)).toMatchObject({
      saved: [expect.objectContaining({ name: 'part' })],
      completed: ['create'],
      stopped: ['order'],
      toolOutcome: { status: 'unknown', settlement: 'unknown' }
    })
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
      delivery: 'status',
      operations: [baseOrder.create, baseOrder.fill]
    })

    expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
      'baseRoot'
    ])
    expect(JSON.stringify(result.issues)).toContain(
      'match count differs from expectedCount; no mutation was submitted'
    )
    root = f.root()
    expect(root).toBeTruthy()
    // Failed sequences preserve canonical recovery evidence; the status envelope
    // itself does not duplicate saved values.
    const { failure, ...status } = result

    expect(JSON.stringify(status)).not.toContain(root)
    expect(failure.execution.recovery[0].value.compositionIds).toContain(root)
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
      },
      delivery: 'status'
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      saved: [
        expect.objectContaining({ name: 'tiers' }),
        expect.objectContaining({ name: 'base' }),
        expect.objectContaining({ name: 'crown' })
      ],
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
        saved: [
          expect.objectContaining({ name: 'taipeiTemplates' }),
          expect.objectContaining({ name: 'crownRoots' }),
          expect.objectContaining({ name: 'detailRoots' })
        ],
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

    for (const op of input.operations) {
      for (const note of op.arguments.facts ?? []) {
        Reflect.deleteProperty(note, 'dependencies')
      }

      for (const note of op.arguments.calculations ?? []) {
        Reflect.deleteProperty(note, 'sourceFactIds')
      }
    }

    input.operations[2].arguments = {
      elementIds: [anchor, 'second-source-target']
    } as never
    input.retain.taipeiGroupReceipt.path =
      '/actionResults/0/result/value/groupId'
    const result = await f.call('design_operations.execute_design', input)

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
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

    for (const op of input.operations) {
      for (const note of op.arguments.facts ?? []) {
        Reflect.deleteProperty(note, 'dependencies')
      }

      for (const note of op.arguments.calculations ?? []) {
        Reflect.deleteProperty(note, 'sourceFactIds')
      }
    }

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
      const before = f.exchanges
        .flat()
        .filter((n) => n === 'read_design_context').length
      const data = await f.call('design_operations.execute_design', {
        operations: [
          {
            id: 'read',
            name: 'read_design_context',
            arguments: { scope: 'ids', fields: ['width'], delivery: 'page' },
            target: {
              field: 'elementIds',
              artifactId: reply.fields.result.artifactId,
              keys: ['panel']
            }
          }
        ],
        delivery: {
          fields: { data: { step: 'read', path: '/actionResults/0/result' } }
        }
      })

      expect(data.toolOutcome.status, JSON.stringify(data)).toBe('success')
      expect(data.fields.data.elements[0].properties.width).toBe(20)
      const reused = await f.call('design_operations.read_design_context', {
        arguments: {
          scope: 'snapshot',
          snapshotId: data.fields.data.snapshotId,
          delivery: 'page'
        }
      })

      expect(reused.toolOutcome.status, JSON.stringify(reused)).toBe('success')
      expect(reused.actionResults[0].result.elements[0].properties.width).toBe(
        20
      )
      expect(
        f.exchanges.flat().filter((n) => n === 'read_design_context').length -
          before
      ).toBe(2)
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
    expect(reply.saved.map(({ name }: { name: string }) => name)).toEqual([
      'stageDraft',
      'stageRoot'
    ])
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
    expect(reply.saved.map(({ name }: { name: string }) => name)).toEqual([
      'taipeiSmoothDraft',
      'taipeiSmoothRoot'
    ])
    const query = continuation.dataReview.input.dataQueries[1]
    const data = await f.call('design_operations.execute_design', {
      operations: [
        {
          id: 'read',
          name: 'read_design_context',
          arguments: { scope: 'ids', fields: query.fields, delivery: 'page' },
          target: {
            field: 'elementIds',
            ...query.artifacts[2],
            artifactId: reply.fields.result.artifactId
          }
        }
      ],
      delivery: {
        fields: { data: { step: 'read', path: '/actionResults/0/result' } }
      }
    })

    expect(data.toolOutcome.status, JSON.stringify(data)).toBe('success')
    expect(data.fields.data.elements).toHaveLength(1)
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
    for (const optionalInputs of [['retain'], []]) {
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

it('composes authored facts before canonical drawing without approval registration', async () => {
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    undefined,
    true,
    true
  )

  try {
    const facts = strictCriteria.input.operations[1].arguments.facts.map(
      ({ dependencies, ...note }) => note
    )
    const result = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        {
          id: 'facts',
          name: 'design_operations.record_design_facts',
          arguments: { facts }
        },
        {
          id: 'draw',
          name: 'prepare_and_apply_design',
          arguments: {
            inspection: 'defer',
            draft: {
              type: 'group',
              name: 'Context composition',
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
        }
      ],
      delivery: {
        fields: {
          facts: { step: 'facts', path: '/facts' },
          roots: { step: 'draw', path: '/compositionIds' }
        }
      }
    })

    expect(result, JSON.stringify(result)).toMatchObject({
      toolOutcome: { status: 'success' },
      fields: { facts, roots: [expect.any(String)] }
    })
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
        expect(
          result.saved.map(({ name }: { name: string }) => name).sort()
        ).toEqual(['base', 'baseSource', 'tiers', 'tiersSource'])
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
        expect(evaluationToolStop(result)).toBeUndefined()
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
      expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
        'baseReceipt',
        'baseAuthored'
      ])
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

      for (const op of input.operations) {
        Reflect.deleteProperty(op.arguments, 'plan')
        for (const note of op.arguments.facts ?? []) {
          Reflect.deleteProperty(note, 'dependencies')
        }

        for (const note of op.arguments.calculations ?? []) {
          Reflect.deleteProperty(note, 'sourceFactIds')
        }
      }

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
      expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
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

it.each(['map_retained_fills', 'design_operations.map_retained_fills'])(
  'publishes named-step retention from its canonical owner rather than the invocation wrapper: %s',
  async (name) => {
    const f = await fixture()

    try {
      let reply = await f.call('design_operations.describe_design_apis', {
        names: [name],
        view: 'usage'
      })
      let text = reply.contentDelivery?.text

      while (reply.contentDelivery && !reply.contentDelivery.lastPage) {
        reply = await f.call(
          'design_operations.describe_design_apis',
          reply.contentDelivery.next.arguments
        )
        text += reply.contentDelivery.text
      }

      const guide = text ? JSON.parse(text) : reply
      const entry = [...(guide.apis ?? []), ...(guide.tools ?? [])][0]
      const owner = f.host
        .definitions()
        .find(
          (tool) =>
            tool.registeredName === 'design_operations.map_retained_fills'
        )

      if (!owner) {
        throw new Error('Missing canonical mapping owner')
      }

      const schema = modelToolResultSchemas(owner).outputSchema

      expect(
        resultRoute.usageOutput.apis[0].usageGuide.retention
          .guaranteedResultFields
      ).toContain('/batchSummary')
      expect(entry.usageGuide.retention.guaranteedResultFields).not.toContain(
        '/batchSummary'
      )
      expect(entry.usageGuide.resultScope).toBe('invocation')
      expect(entry.usageGuide.stepResults.guaranteedFields).toContain(
        '/actionResults'
      )
      for (const path of entry.usageGuide.retention.guaranteedResultFields) {
        expect(() => registeredRecipeOutputAt(schema, path), path).not.toThrow()
      }
    } finally {
      await f.dispose()
    }
  }
)

it('returns recorded result-route rejection to evaluation before any dispatch', async () => {
  const scope = createConversationResults(() => 1).open('result-route')
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => scope.exchange(request)
  )

  try {
    const result = await f.call(
      'design_operations.execute_design',
      resultRoute.input
    )

    expect(result.toolOutcome.settlement, JSON.stringify(result)).toBe(
      'not-started'
    )
    expect(result.message).toContain('delivery.fields.reflect')
    expect(result.message).toContain('/batchSummary')
    expect(f.exchanges).toEqual([])
    expect(evaluationToolStop(result)).toBeUndefined()
  } finally {
    await f.dispose()
  }
})

it('retains recorded crown source targets across requests without forwarding IDs through the model', async () => {
  const recorded = (
    await import('../../test-data/ai-drawing/fixtures/task-continuity-20261107.json')
  ).default
  const context = createConversationResults(() => 1).open('crown-continuation')

  const exchange: ExchangeConversationResults = async (command) =>
    context.exchange(command)

  const f = await fixture(false, undefined, anchor, exchange)

  try {
    const operation = structuredClone(recorded.crown.operations[0])

    delete (operation.arguments as Record<string, unknown>).parentId
    const created = await f.call('design_operations.execute_design', {
      operations: [
        {
          ...operation,
          arguments: { ...operation.arguments, includeTargets: true }
        }
      ],
      retain: { crownTargets: { step: operation.id, path: '/createdTargets' } },
      delivery: 'status'
    })

    expect(created.toolOutcome.status, JSON.stringify(created)).toBe('success')
    expect(created.saved.map(({ name }: { name: string }) => name)).toEqual([
      'crownTargets'
    ])
    expect(JSON.stringify(created)).not.toContain('design-')
  } finally {
    await f.dispose()
  }

  const next = await fixture(false, undefined, anchor, exchange, false)

  try {
    const result = await next.call('design_operations.execute_design', {
      operations: [
        {
          name: 'read_design_context',
          arguments: {
            scope: 'ids',
            elementIds: [
              { kind: 'named', name: 'crownTargets', path: '/0/keyToId/neck-e' }
            ],
            fields: ['width'],
            delivery: 'columns'
          }
        }
      ]
    })

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.actionResults[0].result.columns[0].width).toBeGreaterThan(0)
  } finally {
    await next.dispose()
  }
}, 60000)

it.each([false, true])(
  'binds the recorded named-root first-child query and stops before sorting an empty result (%s)',
  async (empty) => {
    const context = createConversationResults(() => 1).open('anchor-query')
    const f = await fixture(false, 'tower', anchor, async (command) =>
      context.exchange(command)
    )
    const { default: core } = await import('../../src/contexts')

    core.createElementInParent(
      { id: 'moving', type: 'rect', width: 10, height: 10 },
      'tower'
    )
    core.createElementInParent(
      { id: 'empty-query-root', type: 'group' },
      'workspace'
    )
    context.exchange({
      save: { towerRoot: empty ? 'empty-query-root' : 'tower' }
    })
    try {
      const result = await f.call('design_operations.execute_design', {
        operations: [
          {
            id: 'first',
            name: 'read_design_context',
            arguments: {
              scope: 'children',
              parentId: { kind: 'named', name: 'towerRoot', path: '' },
              limit: 1,
              result: 'ids',
              delivery: 'page'
            }
          },
          {
            id: 'order',
            name: order.name,
            arguments: {
              request: {
                ...reuse.call1420.operations[0].arguments.request,
                placement: 'before',
                elementIds: ['moving'],
                anchorId: {
                  kind: 'step',
                  step: 'first',
                  path: '/actionResults/0/result/elementIds/0'
                }
              }
            }
          }
        ],
        delivery: 'status',
        inspection: 'defer'
      })

      if (empty) {
        expect(result.toolOutcome.status).not.toBe('success')
        expect(f.exchanges.flat()).toEqual(['read_design_context'])
        expect(f.calls).toEqual([])
        expect(core.getElementChildren('tower', 0, 5).elementIds).toEqual([
          anchor,
          'moving'
        ])

        return
      }

      expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
      expect(core.getElementChildren('tower', 0, 5).elementIds).toEqual([
        'moving',
        anchor
      ])
      expect(JSON.stringify(result)).not.toContain(anchor)
    } finally {
      await f.dispose()
    }
  }
)

it('chains recorded crown construction and capture in one host submission', async () => {
  const context = createConversationResults(() => 1).open('phase-chain')
  const captured: string[] = []
  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    async (request) => context.exchange(request),
    true,
    true,
    undefined,
    (id) => {
      captured.push(id)

      return {
        available: true,
        image: {
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          width: 1,
          height: 1
        }
      }
    }
  )

  try {
    context.exchange({ save: { taipeiRoot: recorded.create.parentId } })
    const result = await f.call('design_operations.execute_design', {
      operations: [
        ...phaseContinuity.construction.operations,
        ...[
          recorded.create.parentId,
          anchor,
          { kind: 'step', step: 'crown', path: '/compositionIds/0' }
        ].map((elementId, i) => ({
          id: 'capture' + i,
          name: 'design_operations.inspect_drawing',
          arguments: { arguments: { elementId, view: 'overview' } }
        }))
      ],
      retain: phaseContinuity.construction.retain,
      delivery: { fields: { capture: { step: 'capture2', path: '' } } }
    })

    expect(
      result.toolOutcome,
      JSON.stringify(result.toolOutcome)
    ).toMatchObject({ status: 'success' })
    const crown = context.exchange({
      read: { crown: { name: 'crownIds', path: '/0' } }
    }).crown

    expect(captured).toEqual([recorded.create.parentId, anchor, crown])
    expect(
      f.calls.filter((name) => name === 'apply_prepared_design')
    ).toHaveLength(2)
    expect(result.fields.capture.actionResults).toHaveLength(1)
  } finally {
    await f.dispose()
  }
}, 60000)

it('consumes recorded body geometry by named fields in a successor host without model readback', async () => {
  const scope = createConversationResults(() => 1).open('body-continuation')
  const reads: { name: string; path: string }[][] = []

  const exchange: ExchangeConversationResults = async (command) => {
    if ('read' in command) {
      reads.push(Object.values(command.read))
    }

    return scope.exchange(command)
  }

  const first = await fixture(false, recorded.create.parentId, anchor, exchange)

  try {
    const operation = structuredClone(phaseContinuity.body.operations[1])

    operation.arguments.parentId = recorded.create.parentId as never
    const result = await first.call('design_operations.execute_design', {
      operations: [operation],
      retain: { bodySource: { step: 'body', source: 'input', path: '/draft' } },
      delivery: 'status'
    })

    expect(result.toolOutcome.status).toBe('success')
    expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
      'bodySource'
    ])
    expect(result.fields).toBeUndefined()
  } finally {
    await first.dispose()
  }

  const next = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    exchange,
    false
  )

  try {
    const original = phaseContinuity.details.operations[2].arguments.draft
    const source = phaseContinuity.body.operations[1].arguments.draft

    if (!original || !source) {
      throw Error('Missing recorded source')
    }

    const draft = structuredClone(original)
    const pairs = [
      ['/projection', '/projection'],
      ['/children/0/origin', '/children/0/origin'],
      ['/children/0/axes', '/children/0/axes'],
      ['/children/0/members/0/boundary', '/children/0/members/1/vertices'],
      ['/children/0/members/1/boundary', '/children/0/members/3/vertices']
    ]

    for (const [destination, path] of pairs) {
      const keys = destination.slice(1).split('/')
      let parent = draft as unknown as Record<string, unknown>

      for (const key of keys.slice(0, -1)) {
        parent = parent[key] as Record<string, unknown>
      }

      const originalValue = path
        .slice(1)
        .split('/')
        .reduce<unknown>(
          (v, key) => (v as Record<string, unknown>)[key],
          source
        )
      const field = keys[keys.length - 1]

      expect(parent[field]).toEqual(originalValue)
      parent[field] = { kind: 'named', name: 'bodySource', path }
    }

    const result = await next.call('design_operations.execute_design', {
      operations: [
        {
          id: 'details',
          name: 'design_workflow.prepare_and_apply_design',
          arguments: {
            ...phaseContinuity.details.operations[2].arguments,
            parentId: recorded.create.parentId,
            draft
          }
        }
      ],
      retain: {
        detailSource: { step: 'details', source: 'input', path: '/draft' }
      },
      delivery: 'status'
    })

    expect(
      result.toolOutcome,
      JSON.stringify(result.toolOutcome)
    ).toMatchObject({ status: 'success' })
    expect(reads).toHaveLength(1)
    expect(reads[0].map((item) => item.path).sort()).toEqual(
      pairs.map((pair) => pair[1]).sort()
    )
    expect(
      scope.exchange({ read: { draft: { name: 'detailSource', path: '' } } })
        .draft
    ).toEqual(original)
    expect(result.fields).toBeUndefined()
    expect(
      next.calls.filter((name) => name === 'apply_prepared_design')
    ).toHaveLength(1)
  } finally {
    await next.dispose()
  }
}, 60000)

it('repairs recorded tier source paths using the existing retained input in one handoff', async () => {
  const { default: recordedInput } =
    await import('../../test-data/ai-drawing/fixtures/sequence-reference-recovery-20261108.json')
  const scope = createConversationResults(() => 1).open('reference-recovery')
  const f = await fixture(false, undefined, anchor, async (request) =>
    scope.exchange(request)
  )
  const { default: core } = await import('../../src/contexts')

  try {
    const base = structuredClone(recordedInput.base)

    // Reference selection is established independently in this Core fixture.
    base.operations.splice(0, 1)
    const first = await f.call('design_operations.execute_design', base)

    expect(first.toolOutcome, JSON.stringify(first)).toMatchObject({
      status: 'success'
    })
    const before = await core.save()
    const count = f.calls.length
    const rejected = await f.call(
      'design_operations.execute_design',
      recordedInput.tiers
    )

    expect(rejected, JSON.stringify(rejected)).toMatchObject({
      recovery: 'correct_input',
      settlement: 'not-started'
    })
    expect(JSON.stringify(rejected)).toContain(
      '/preparationInput/draft/linearFields'
    )
    expect(evaluationToolStop(rejected)).toBeUndefined()
    expect(f.calls).toHaveLength(count)
    expect(await core.save()).toEqual(before)
    const repaired = structuredClone(recordedInput.tiers)
    const draft = repaired.operations[1].arguments.draft

    draft.linearFields = {
      kind: 'named',
      name: 'tierDraft',
      path: '/linearFields'
    } as never
    draft.children[0].members = {
      kind: 'named',
      name: 'tierDraft',
      path: '/children/0/members'
    } as never
    const result = await f.call('design_operations.execute_design', repaired)

    expect(result.toolOutcome, JSON.stringify(result)).toMatchObject({
      status: 'success'
    })
    expect(f.calls.slice(count)).toEqual([
      'apply_prepared_design',
      'apply_prepared_design'
    ])
    expect(
      result.saved.map(({ name }: { name: string }) => name).sort()
    ).toEqual(Object.keys(repaired.retain).sort())
  } finally {
    await f.dispose()
  }
}, 60000)

it.each(['direct', 'sequence', 'status', 'selected'])(
  'continues after the recorded projection input error without replaying existing work: %s',
  async (mode) => {
    const { default: recordedInput } =
      await import('../../test-data/ai-drawing/fixtures/sequence-input-recovery-20261108.json')
    const scope = createConversationResults(() => 1).open('input-recovery')
    const parent = recordedInput.crown.operations[0].arguments.parentId
    const f = await fixture(false, parent, anchor, async (request) =>
      scope.exchange(request)
    )
    const { default: core } = await import('../../src/contexts')

    try {
      const before = await core.save()
      const input: Record<string, unknown> = structuredClone(
        recordedInput.crown
      )

      if (mode === 'sequence') {
        delete input.delivery
        delete input.retain
      }

      if (mode === 'status') {
        input.delivery = 'status'
      }

      const rejected = await f.host.invoke({
        name:
          mode === 'direct'
            ? 'design_workflow.prepare_and_apply_design'
            : 'design_operations.execute_design',
        input:
          mode === 'direct'
            ? recordedInput.crown.operations[0].arguments
            : input
      })

      expect(JSON.parse(rejected.text)).toMatchObject({
        available: false,
        recovery: 'correct_input',
        settlement: 'not-started'
      })
      expect(rejected.text).toContain('projection.kind')
      expect(evaluationToolStop(rejected)).toBeUndefined()
      expect(f.calls).toEqual([])
      expect(await core.save()).toEqual(before)
      const corrected = structuredClone(recordedInput.crown)

      Reflect.deleteProperty(
        corrected.operations[0].arguments.draft.projection,
        'kind'
      )
      const geometry = await f.call(
        'design_operations.execute_design',
        corrected
      )

      expect(evaluationToolStop(geometry)).toBeUndefined()
      expect(JSON.stringify(geometry)).toContain('nonplanar')
      expect(f.calls).toEqual([])
      // The caller corrects the two recorded nonplanar quadrilaterals into
      // their authored triangles. Production does not alter these vertices.
      const draft = corrected.operations[0].arguments.draft

      draft.children = draft.children.flatMap((child) => {
        if (
          !['spirelight', 'spiredark'].includes(child.key) ||
          !child.vertices
        ) {
          return [child]
        }

        return [
          [0, 1, 2],
          [0, 2, 3]
        ].map((indices, index) => ({
          ...child,
          key: child.key + '-triangle-' + index,
          vertices: indices.map((i) => child.vertices[i])
        }))
      })
      const reply = await f.call('design_operations.execute_design', corrected)

      expect(reply.toolOutcome, JSON.stringify(reply)).toMatchObject({
        status: 'success',
        settlement: 'completed'
      })
      expect(f.calls).toEqual(['apply_prepared_design'])
      expect(reply.saved.map(({ name }: { name: string }) => name)).toEqual([
        'crownSource',
        'crownRoot',
        'crownTargets'
      ])
      expect(core.getElementData(parent)?.id).toBe(parent)
    } finally {
      await f.dispose()
    }
  }
)

it('selects reference notes and chains construction to capture without model readback', async () => {
  const captures: string[] = []
  const selection = referenceChain.setup.operations[1].arguments
  const decisions = selection.referenceDecisions

  if (!decisions) {
    throw Error('Missing recorded decisions')
  }

  const f = await fixture(
    false,
    recorded.create.parentId,
    anchor,
    undefined,
    true,
    true,
    undefined,
    (id) => {
      captures.push(id)

      return {
        available: true,
        image: {
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          width: 1,
          height: 1
        }
      }
    },
    () =>
      decisions.map((decision, attachmentIndex) => ({
        referenceId: decision.referenceId,
        attachmentIndex,
        validation: { width: 1000, height: 1000 }
      }))
  )

  try {
    const result = await f.call('design_operations.execute_design', {
      operations: [
        {
          id: 'references',
          name: 'design_operations.select_design_references',
          arguments: {
            referenceImageIndexes: selection.referenceImageIndexes,
            references: decisions.map(({ referenceId }) => ({
              referenceId,
              purpose: 'Massing'
            }))
          }
        },
        ...referenceChain.construction.operations,
        {
          id: 'capture',
          name: 'design_operations.inspect_drawing',
          arguments: {
            arguments: {
              elementId: {
                kind: 'step',
                step: 'base',
                path: '/compositionIds/0'
              },
              view: 'overview'
            }
          }
        }
      ],
      delivery: {
        fields: {
          capture: { step: 'capture', path: '' },
          references: { step: 'references', path: '/references' }
        }
      }
    })

    expect(result.toolOutcome, JSON.stringify(result)).toMatchObject({
      status: 'success'
    })
    expect(captures).toHaveLength(1)
    expect(
      f.calls.filter((name) => name === 'apply_prepared_design')
    ).toHaveLength(1)
    expect(result.fields.capture.actionResults).toHaveLength(1)
    expect(result.fields.references).toHaveLength(decisions.length)
  } finally {
    await f.dispose()
  }
}, 60000)

it('delivers the actual capture host envelope and executes its acquired example', async () => {
  let captures = 0
  const f = await fixture(
    false,
    undefined,
    undefined,
    undefined,
    true,
    true,
    undefined,
    () => {
      captures++

      return {
        available: true,
        image: { dataUrl: 'data:image/png;base64,capture', width: 1, height: 1 }
      }
    }
  )

  const read = async (query: Record<string, unknown>) =>
    JSON.parse(
      await readCompleteInformation(
        async (input) =>
          (
            await f.host.invoke({
              name: 'design_operations.describe_design_apis',
              input
            })
          ).text,
        query
      )
    )

  try {
    const received = await read({
      names: ['inspect_drawing'],
      view: 'usage'
    })
    const usage = received.apis[0]
    const owner = f.host
      .definitions()
      .find((t) => t.registeredName === usage.execution.operation)
    const bad = executableHandoffs.calls.E3.operations.at(-1)

    if (!owner || !bad) {
      throw new Error('Required capture evidence is missing')
    }

    expect(
      operationInputIssue(bad.arguments, usage.usageGuide.parameters)
    ).toBeTruthy()
    expect(usage.usageGuide.parameters.required).toContain('arguments')
    expect(usage.execution).not.toHaveProperty('argumentField')
    const example = usage.invocationExample.invocation.arguments

    expect(
      operationInputIssue(example.operations[0].arguments, owner.inputSchema)
    ).toBeUndefined()
    expect(example.operations[0].arguments.arguments.elementId).toBe(
      'example-target'
    )
    example.operations[0].arguments.arguments.elementId = 'workspace'
    const result = await f.call('design_operations.execute_design', {
      ...example,
      delivery: { fields: { capture: { path: '' } } }
    })

    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(result.fields.capture.actionResults[0].actionName).toBe(
      'inspect_drawing'
    )
    expect(captures).toBe(1)
    const full = await read({
      names: ['inspect_drawing']
    })

    expect(full.apis[0].inputSchema).toEqual(owner.inputSchema)
    const selected = await read({
      names: ['inspect_drawing'],
      schemaPaths: ['/properties/arguments/properties/elementId']
    })

    expect(selected.apis[0].definition.state).toBe('included')
    const qualified = await read({
      names: ['design_operations.inspect_drawing'],
      view: 'usage'
    })

    expect(qualified.tools[0].usageGuide.parameters).toEqual(
      usage.usageGuide.parameters
    )
  } finally {
    await f.dispose()
  }
})

it('executes the owner example of same-submission input reuse without a saved-value read', async () => {
  const context = createConversationResults(() => 1).open('same-submission')
  let reads = 0
  const f = await fixture(false, undefined, undefined, async (command) => {
    if ('read' in command) {
      reads++
    }

    return context.exchange(command)
  })

  try {
    const examples = sequenceDefinition().inputSchema.examples
    const example = examples.find((value) => 'operations' in value)

    expect(example).toBeDefined()
    const reply = await f.call(
      'design_operations.execute_design',
      structuredClone(example)
    )

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(
      f.calls.filter((name) => name === 'apply_prepared_design')
    ).toHaveLength(2)
    expect(reads).toBe(0)
  } finally {
    await f.dispose()
  }
})

it('executes all recorded E1 geometry using one authored-input alias submission', async () => {
  const context = createConversationResults(() => 1).open(
    'recorded-same-submission'
  )
  let reads = 0
  const f = await fixture(false, undefined, undefined, async (command) => {
    if ('read' in command) {
      reads++
    }

    return context.exchange(command)
  })

  try {
    const input = structuredClone(executableHandoffs.calls.E1)
    const alias = 'tierDraft'

    Object.assign(input.retain, {
      [alias]: { step: 'tiers1', source: 'input', path: '/draft' }
    })

    const replace = (value: unknown): void => {
      if (!value || typeof value !== 'object') {
        return
      }

      const node = value as Record<string, unknown>

      if (
        node.kind === 'step' &&
        node.step === 'tiers1' &&
        typeof node.path === 'string' &&
        node.path.startsWith('/preparationInput/draft/')
      ) {
        node.kind = 'named'
        node.name = alias
        node.path = node.path.slice('/preparationInput/draft'.length)
        delete node.step
      }

      Object.values(node).forEach(replace)
    }

    replace(input.operations)
    const reply = await f.call('design_operations.execute_design', input)

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(
      f.calls.filter((name) => name === 'apply_prepared_design')
    ).toHaveLength(3)
    expect(reads).toBe(0)
    expect(reply.saved.map((v: { name: string }) => v.name)).toContain(alias)
    expect(JSON.stringify(reply)).not.toContain('50800')
  } finally {
    await f.dispose()
  }
}, 60000)

it.each([
  'success',
  'wrong-count',
  'empty-region',
  'group-failure',
  'missing-group-id'
])(
  'executes recorded creation, step-time region grouping and dependent captures: %s',
  async (scenario) => {
    const { default: core } = await import('../../src/contexts')
    // jsdom has no render adapter. Preserve the recorded detail region and the
    // real capture/evidence owners; supply only their renderer boundary here.
    const transform = vi
      .spyOn(core, 'elementLocalToWorkspace')
      .mockImplementation((_id, point) => point)
    const pixels = vi.spyOn(core, 'getElementIdsInBounds').mockReturnValue([])
    const context = createConversationResults(() => 1).open(
      'target-group-capture'
    )

    await context.exchange({ save: targetGroupCapture.saved })
    const captured: string[] = []
    let regionReads = 0
    const f = await fixture(
      false,
      undefined,
      undefined,
      (command) => context.exchange(command),
      true,
      true,
      () => {
        regionReads++

        return core.getElementChildren('workspace', 0, 100).elementIds
      },
      (id) => {
        captured.push(id)

        return {
          available: true,
          image: {
            dataUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            width: 1,
            height: 1
          }
        }
      }
    )

    try {
      const submitted = structuredClone(targetGroupCapture.input)
      const group = submitted.operations.find((op) => op.id === 'group')

      if (!group?.target) {
        throw Error('Recorded group target is missing')
      }

      const query = group.target.query

      // The prior five roots stand in for already completed phases. E6 creates
      // the sixth root with its original geometry and saved projection/materials.
      for (let i = 0; i < (scenario === 'wrong-count' ? 4 : 5); i++) {
        const id = 'prior-phase-' + i

        core.createElementInParent(
          {
            id,
            type: 'group',
            name: query.filter.name.prefix + i,
            x: 9000,
            y: 4000 + i * 1000
          },
          'workspace'
        )
        core.createElementInParent(
          { type: 'rect', width: 100, height: 100 },
          id
        )
      }

      const groupOwner = f.owners.find(
        (owner) => owner.name === 'api_hierarchy_groupElements'
      )

      if (!groupOwner) {
        throw Error('Registered group owner is missing')
      }

      if (scenario === 'empty-region') {
        query.bounds.x = 1000000
      }

      if (scenario === 'group-failure') {
        groupOwner.execute = async () => {
          throw Error('Injected grouping failure')
        }
      }

      if (scenario === 'missing-group-id') {
        groupOwner.execute = async () => ({
          status: 'no-change',
          value: { elementIds: [] },
          mutationScope: {
            complete: true,
            elementIds: [],
            removedElementIds: []
          }
        })
      }

      const reply = await f.host.invoke({
        name: 'design_operations.execute_design',
        input: submitted
      })
      const result = JSON.parse(reply.text)

      if (scenario !== 'success') {
        expect(result.toolOutcome.status, reply.text).not.toBe('success')
        if (scenario === 'wrong-count' || scenario === 'empty-region') {
          expect(result.completed).toContain('details')
        }

        expect(core.getElementMetadata(f.root())).toBeDefined()
        expect(captured).toEqual([])
        expect(
          f.calls.filter((name) => name === 'apply_prepared_design')
        ).toHaveLength(1)
        expect(
          f.exchanges
            .flat()
            .filter((name) => name === 'api_hierarchy_groupElements')
        ).toHaveLength(
          scenario === 'wrong-count' || scenario === 'empty-region' ? 0 : 1
        )

        return
      }

      expect(result.toolOutcome.status, reply.text).toBe('success')
      const groupId = result.fields.group[0].result.value.groupId

      expect(core.getElementChildren(groupId, 0, 100).elementIds).toHaveLength(
        6
      )
      expect(captured).toEqual([groupId, groupId])
      expect(reply.media).toHaveLength(2)
      expect(regionReads).toBe(1)
      expect(
        f.calls.filter((name) => name === 'apply_prepared_design')
      ).toHaveLength(1)
      expect(
        f.exchanges
          .flat()
          .filter((name) => name === 'api_hierarchy_groupElements')
      ).toHaveLength(1)
      expect(
        f.exchanges.flat().filter((name) => name === 'inspect_drawing')
      ).toHaveLength(2)
      expect(f.exchanges.flat().indexOf('apply_prepared_design')).toBeLessThan(
        f.exchanges.flat().indexOf('resolve_design_targets')
      )
    } finally {
      await f.dispose()
      transform.mockRestore()
      pixels.mockRestore()
    }
  },
  60000
)

it('exposes a conditional group identity selector and binds it to the recorded bounds read', async () => {
  const f = await fixture(false, undefined, undefined, undefined, true, true)

  try {
    const text = await readCompleteInformation(
      async (input) =>
        (
          await f.host.invoke({
            name: 'design_operations.describe_design_apis',
            input
          })
        ).text,
      { names: ['api_hierarchy_groupElements'], view: 'usage' }
    )
    const usage = JSON.parse(text).apis[0].usageGuide
    const path = '/actionResults/0/result/value/groupId'

    expect(usage.stepResults.structures[path]).toMatchObject({ type: 'string' })
    expect(usage.stepResults.conditionalFields).toContain(path)
    expect(usage.stepResults.guaranteedFields).not.toContain(path)
    const read = structuredClone(executableHandoffs.calls.E7.operations[0])
    const reply = await f.call('design_operations.execute_design', {
      inspection: 'defer',
      operations: [
        {
          id: 'group',
          name: 'api_hierarchy_groupElements',
          arguments: { elementIds: [anchor] }
        },
        {
          ...read,
          id: 'bounds',
          arguments: {
            ...read.arguments,
            elementIds: [{ kind: 'step', step: 'group', path }]
          }
        }
      ],
      delivery: {
        fields: {
          groupId: { step: 'group', path },
          bounds: { step: 'bounds', path: '' }
        }
      }
    })

    expect(reply.toolOutcome.status, JSON.stringify(reply)).toBe('success')
    expect(typeof reply.fields.groupId).toBe('string')
    expect(JSON.stringify(reply.fields.bounds)).toContain(reply.fields.groupId)
    expect(
      f.exchanges
        .flat()
        .filter((name) => name === 'api_hierarchy_groupElements')
    ).toHaveLength(1)
    expect(
      f.exchanges.flat().filter((name) => name === 'read_design_context')
    ).toHaveLength(1)
  } finally {
    await f.dispose()
  }
})

it('defers automatic inspection while delivering both explicitly selected captures', async () => {
  const captured: string[] = []
  const f = await fixture(
    false,
    undefined,
    undefined,
    undefined,
    true,
    true,
    undefined,
    (id) => {
      captured.push(id)

      return {
        available: true,
        image: {
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          width: 1,
          height: 1
        }
      }
    }
  )

  try {
    const [recordedDetail, recordedFinal] =
      executableHandoffs.calls.E9.operations.slice(1)
    const path = '/actionResults/0/result/value/groupId'
    const reply = await f.host.invoke({
      name: 'design_operations.execute_design',
      input: {
        inspection: 'defer',
        operations: [
          {
            id: 'group',
            name: 'api_hierarchy_groupElements',
            arguments: { elementIds: [anchor] }
          },
          ...[recordedDetail, recordedFinal].map((op) => ({
            ...op,
            arguments: {
              ...op.arguments,
              arguments: {
                view: op.arguments.arguments?.view,
                elementId: { kind: 'step', step: 'group', path }
              }
            }
          }))
        ],
        delivery: {
          fields: {
            groupId: { step: 'group', path },
            detail: { step: 'detail', path: '' },
            final: { step: 'final', path: '' }
          }
        }
      }
    })
    const result = JSON.parse(reply.text)

    expect(result.toolOutcome.status, reply.text).toBe('success')
    expect(captured).toEqual([result.fields.groupId, result.fields.groupId])
    expect(reply.media).toHaveLength(2)
    expect(reply.media?.map((image) => image.path)).toEqual([
      '/fields/detail/actionResults/0/result/image',
      '/fields/final/actionResults/0/result/image'
    ])
    expect(Object.keys(result.fields)).toEqual(['groupId', 'detail', 'final'])
    expect(result.fields).not.toHaveProperty('group')
    expect(
      f.exchanges
        .flat()
        .filter((name) => name === 'api_hierarchy_groupElements')
    ).toHaveLength(1)
    expect(
      f.exchanges.flat().filter((name) => name === 'inspect_drawing')
    ).toHaveLength(2)
  } finally {
    await f.dispose()
  }
})

it.each(['defer', 'immediate'] as const)(
  'executes recorded region deletion, construction and selected capture with %s inspection',
  async (inspection) => {
    const { default: core } = await import('../../src/contexts')
    const context = createConversationResults(() => 1).open('provider-handoffs')
    const members: string[] = []
    const captured: string[] = []
    const f = await fixture(
      false,
      undefined,
      undefined,
      (command) => context.exchange(command),
      true,
      true,
      members,
      (id) => {
        captured.push(id)

        return {
          available: true,
          image: {
            dataUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            width: 1,
            height: 1
          }
        }
      }
    )

    try {
      const operation = providerHandoffs.input.operations[0]

      if (!operation.target) {
        throw Error('Missing recorded region target')
      }

      const query = operation.target.query

      for (let i = 0; i < 11; i++) {
        const id = 'band-' + i

        core.createElementInParent(
          {
            id,
            type: 'rect',
            name: i < 10 ? i + query.filter.name.suffix : 'Unrelated trim',
            x: query.bounds.x + 10,
            y: query.bounds.y + i * 10,
            width: 10,
            height: 10
          },
          recorded.create.parentId
        )
        members.push(id)
      }

      const text = await readCompleteInformation(
        async (input) =>
          (
            await f.host.invoke({
              name: 'design_operations.describe_design_apis',
              input
            })
          ).text,
        { names: [operation.name], view: 'usage' }
      )
      const usage = JSON.parse(text).apis[0].usageGuide
      const paths = Object.keys(usage.stepResults.structures ?? {})
      const countPath = paths.find((path) => path.endsWith('/value/count'))
      const statusPath = paths.find((path) => path.endsWith('/status'))

      expect(countPath).toBeDefined()
      expect(statusPath).toBeDefined()
      if (inspection === 'defer') {
        const rejected = await f.call('design_operations.execute_design', {
          ...structuredClone(providerHandoffs.input),
          inspection,
          delivery: {
            fields: {
              deleted: { step: operation.id, path: countPath + '/unknown' }
            }
          }
        })

        expect(rejected.toolOutcome.status).toBe('failed')
        expect(rejected.settlement).toBe('not-started')
        expect(f.calls).toEqual([])
      }

      const reply = await f.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...structuredClone(providerHandoffs.input),
          inspection,
          delivery: {
            fields: {
              deleted: { step: operation.id, path: countPath },
              status: { step: operation.id, path: statusPath },
              final: { step: 'finalview', path: '/actionResults' }
            }
          }
        }
      })
      const result = JSON.parse(reply.text)

      expect(result.toolOutcome.status, reply.text).toBe('success')
      expect(result.fields.deleted).toBe(10)
      expect(result.fields.status).toBe('complete')
      expect(reply.media).toHaveLength(1)
      expect(captured).toHaveLength(inspection === 'defer' ? 1 : 2)
      expect(core.getElementMetadata('band-10')).toBeDefined()
      for (const id of members.slice(0, 10)) {
        expect(core.getElementMetadata(id)).toBeUndefined()
      }

      expect(
        f.exchanges.flat().filter((name) => name === 'read_design_context')
      ).toHaveLength(0)
      expect(f.calls.filter((name) => name === operation.name)).toHaveLength(1)
      expect(
        f.calls.filter((name) => name === 'apply_prepared_design')
      ).toHaveLength(1)
    } finally {
      await f.dispose()
    }
  },
  60000
)
