import { readCompleteInformation } from '../../../server/__tests__/tool-contract-assertions'
import type {
  AiActionBatch,
  AiBatchReceipt,
  AiJsonValue
} from '../action-batch-protocol'
import recordedDecisions from '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/decision-evidence-replay.json'
import { createLocalDesignReview } from '../../../server/local-design-review'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '@asyra/ai-agent-runtime'
vi.mock('../../contexts', () => ({ default: {} }))
import { createRetainedFillAction } from '../retained-fill-action'
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import { prepareOperationBatch } from '../../../server/local-operation-batch'
import { createBasicApiActions } from '../basic-api-actions'
import { createPreparedDesignAction } from '../design-actions'
import { admitPreparedDesign } from '../prepared-design-admission'
import { createLocalKnowledgeTools as createKnowledgeOwner } from '../../../server/local-knowledge'
import { createLocalOperationTools as createOperationOwner } from '../../../server/local-operation-tools'
import { createLocalDesignTools } from '../../../server/local-design-tools'
import { createLocalDesignWorkflow } from '../../../server/local-design-workflow'
import {
  createDesignPreparationSession,
  prepareDesign
} from '../../../server/design-preparation'
import { localToolOutcome } from '../../../server/local-tool-invocation'
import { operationInputIssue } from '../../../server/operation-input-schema'
import { AiDesignToolIds } from '../../constants/ai-design'
const signal = () => new AbortController().signal

it('hands App-only method examples from real Knowledge reads to current discovery and preparation owners', async () => {
  const knowledge = createLocalKnowledgeTools('method-handoff')
  const read = JSON.parse(
    await knowledge.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      {
        ids: [
          'design.architectural-illustration.materials.method.parameters',
          'design.architectural-illustration.contracts.operations'
        ],
        contexts: ['architectural-illustration']
      },
      signal()
    )
  )
  const domain = read.documents.find(
    (doc: { target: string }) =>
      doc.target === 'illustration.architecture.materials.method'
  )
  const app = read.documents.find(
    (doc: { target: string }) =>
      doc.target ===
      'design.architectural-illustration.materials.method.parameters'
  )
  expect(domain.text).toContain('Choose a material method')
  expect(domain.text).not.toContain('map_retained_fills')
  expect(app.text).toContain('map_retained_fills')
  expect(app.text).toContain('not per-cell gradient endpoints')
  const materialRows = app.text
    .split('\n')
    .filter((line: string) => line.startsWith('|'))
  expect(
    materialRows.some(
      (line: string) =>
        line.includes('`linearFields`') && line.includes('`materialField`')
    )
  ).toBe(true)
  const appMarkdown = readFileSync(
    new URL(
      '../../../knowledge/design.architectural-illustration.materials.method.parameters.md',
      import.meta.url
    ),
    'utf8'
  )
  expect(app.text).toBe(
    appMarkdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]+)$/)?.[1]
  )

  const registry = createAiActionRegistry()
  for (const action of [
    ...createBasicApiActions(),
    createPreparedDesignAction()
  ]) {
    registry.register(action)
  }
  const actions = registry.list()
  const session = createDesignPreparationSession()
  const designs = createLocalDesignTools(actions, session)
  const dispatch = vi.fn()
  const operations = createLocalOperationTools(actions, designs, dispatch, {
    getNativeTools: () =>
      workflow.definitions.map((definition) => ({
        ...definition,
        namespace: 'design_workflow'
      }))
  })
  const workflow = createLocalDesignWorkflow(designs, operations)
  const exampleText = [
    app.text,
    read.documents.find(
      (doc: { target: string }) =>
        doc.target === 'design.architectural-illustration.contracts.operations'
    ).text
  ].join('\n')
  const samples = [...exampleText.matchAll(/```json\n([\s\S]*?)\n```/g)].filter(
    (match) =>
      JSON.parse(match[1]).tool !== AiDesignToolIds.EXECUTE_DESIGN_BATCH
  )
  expect(samples).toHaveLength(3)
  for (const match of samples) {
    const sample = JSON.parse(match[1])
    const owner = sample.tool === 'prepare_design' ? designs : operations
    const definition = owner.definitions.find(
      (item) => item.name === sample.tool
    )
    if (!definition) {
      throw new Error(`Unknown documented tool ${sample.tool}`)
    }
    expect(
      operationInputIssue(sample.arguments, definition.inputSchema)
    ).toBeUndefined()
    const result = JSON.parse(
      await owner.call(sample.tool, sample.arguments, signal())
    )
    if (sample.tool === 'prepare_design') {
      expect(result.available).toBe(true)
      const prepared = session.resolve(result.artifactId)
      expect(session.recipe(result.artifactId).recipe).toMatchObject({
        brief: { assumptions: sample.arguments.draft.brief.assumptions }
      })
      expect(prepared.findings).toEqual([])
      expect(prepared.entries).toHaveLength(4)
      expect(admitPreparedDesign(structuredClone(prepared))).toEqual(prepared)
      const panes = ['pane-a', 'pane-b'].map((key) => {
        const entry = prepared.entries.find((item) => item.key === key)
        if (!entry) {
          throw new Error(`Missing documented material part ${key}`)
        }
        return entry.descriptor
      })
      expect(
        panes.map((pane) => pane.fills?.[0].gradient?.gradientType)
      ).toEqual(['linear', 'linear'])
      const worldDomains = panes.map((pane) =>
        pane.fills?.[0].gradient?.gradientHandles.map((handle) => ({
          x: Number(pane.x) + handle.x * Number(pane.width),
          y: Number(pane.y) + handle.y * Number(pane.height)
        }))
      )
      expect(worldDomains).toEqual([
        [
          { x: 0, y: 0 },
          { x: 0, y: 80 }
        ],
        [
          { x: 0, y: 0 },
          { x: 0, y: 80 }
        ]
      ])
      expect(panes[0].fills?.[0].id).not.toEqual(panes[1].fills?.[0].id)
      expect(panes[0].fills?.[0].gradient?.gradientStops).toEqual(
        panes[1].fills?.[0].gradient?.gradientStops
      )
      expect(
        prepared.entries.find((item) => item.key === 'mullion')?.descriptor
          .fills?.[0].gradient
      ).toBeNull()

      const failed = structuredClone(sample.arguments)
      failed.draft.children[0].fill = { template: 'missing-material' }
      const rejected = JSON.parse(
        await owner.call(sample.tool, failed, signal())
      )
      expect(rejected).toMatchObject({
        available: false,
        recovery: 'correct_input',
        draftId: expect.any(String),
        message: expect.stringContaining('unknown Fill template')
      })
      expect(session.resolve(result.artifactId)).toEqual(prepared)
      const repaired = JSON.parse(
        await owner.call(
          sample.tool,
          {
            repair: {
              draftId: rejected.draftId,
              replacements: [
                {
                  path: '/children/0/fill',
                  value: sample.arguments.draft.children[0].fill
                }
              ]
            }
          },
          signal()
        )
      )
      expect(repaired.available).toBe(true)
      expect(repaired.preparationInput.kind).toBe('retained-repair')
      expect(session.recipe(repaired.artifactId).recipe).toEqual(
        sample.arguments.draft
      )
      expect(session.resolve(result.artifactId)).toEqual(prepared)
    } else if (sample.arguments.schemaPaths) {
      expect(result.tools[0].schemaFragments[0].path).toBe('/properties/draft')
      expect(result.tools[0].schemaResolution).toBeUndefined()
    } else {
      expect(result.apis[0].operation).toBe('fill.updateFillsAtIndex')
      expect(result.apis[0].execution.kind).toBe('batch-action')
    }
  }
  expect(dispatch).not.toHaveBeenCalled()
  knowledge.dispose()
  registry.dispose()
})

it('carries the recorded material decision into initial preparation without changing unrelated crown geometry', async () => {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/material-role-replay.jsonl',
        import.meta.url
      ),
      'utf8'
    )
  )
  const original = saved.calls[0].inputValue.draft
  const repairOperation = saved.calls[1].inputValue.operations[1]
  const targetKeys = new Set<string>(repairOperation.target.keys)
  const chosenGradient = repairOperation.arguments.patch.gradient
  expect(saved.calls[0].status).toBe('usable')
  expect(saved.calls[0].outputValue.available).toBe(true)
  expect(
    original.children.filter((child: { key: string }) =>
      targetKeys.has(child.key)
    )
  ).toHaveLength(6)

  // This is the recorded later decision applied offline, not an inferred role
  // or a claim that the agent would independently choose it earlier.
  const candidate = structuredClone(original)
  candidate.fillTemplates.selectedMetal = structuredClone(chosenGradient)
  candidate.brief = {
    intent:
      'Preserve the recorded crown with explicitly assigned material roles',
    viewpoint: 'Retain the recorded camera and world-coordinate basis',
    sources: [],
    assumptions: [
      'The six explicitly selected surfaces use the recorded metal treatment; other roles stay unchanged.',
      'This gradient is local to each selected face, not proof of continuity across adjoining faces.',
      'Equal material values remain independently editable; final visual quality is unverified.'
    ],
    checks: []
  }
  for (const child of candidate.children) {
    if (targetKeys.has(child.key)) {
      child.fill = { template: 'selectedMetal' }
    }
  }
  const before = prepareDesign(original, 'material-role')
  const after = prepareDesign(candidate, 'material-role')
  expect(after.entries.map((entry) => entry.key)).toEqual(
    before.entries.map((entry) => entry.key)
  )
  const selectedFillIds: string[] = []
  for (const [index, entry] of after.entries.entries()) {
    const previous = before.entries[index]
    if (!targetKeys.has(entry.key)) {
      expect(entry).toEqual(previous)
      continue
    }
    const { fills, ...geometry } = entry.descriptor
    const { fills: previousFills, ...previousGeometry } = previous.descriptor
    expect(geometry).toEqual(previousGeometry)
    expect(fills).not.toEqual(previousFills)
    const values = fills as { id: string; gradient: unknown }[]
    expect(values).toHaveLength(1)
    expect(values[0].gradient).toEqual(chosenGradient)
    selectedFillIds.push(values[0].id)
  }
  expect(new Set(selectedFillIds).size).toBe(targetKeys.size)

  const knowledge = createLocalKnowledgeTools('material-method')
  const registry = createAiActionRegistry()
  try {
    const read = JSON.parse(
      await knowledge.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        {
          ids: ['design.architectural-illustration.materials.method'],
          contexts: ['architectural-illustration']
        },
        signal()
      )
    )
    expect(
      read.sources.map((source: { id: string; revision: number }) => [
        source.id,
        source.revision
      ])
    ).toEqual([
      ['design.architectural-illustration', 18],
      ['design.architectural-illustration.contracts', 2],
      ['illustration.architecture', 5],
      ['illustration.architecture.materials', 1],
      ['illustration.architecture.materials.method', 1],
      ['design.architectural-illustration.materials.method', 3]
    ])
    for (const action of [
      ...createBasicApiActions(),
      createPreparedDesignAction()
    ]) {
      registry.register(action)
    }
    const session = createDesignPreparationSession()
    const designs = createLocalDesignTools(registry.list(), session)
    const dispatch = vi.fn()
    const operations = createLocalOperationTools(
      registry.list(),
      designs,
      dispatch,
      {
        getNativeTools: () =>
          designs.definitions.map((definition) => ({
            ...definition,
            namespace: 'design_preparation'
          }))
      }
    )
    const described = JSON.parse(
      await operations.call(
        'describe_design_apis',
        {
          names: ['prepare_design'],
          schemaPaths: ['/properties/draft']
        },
        signal()
      )
    )
    expect(described.tools[0].schemaFragments[0].path).toBe('/properties/draft')
    const prepare = (draft: unknown) =>
      designs.call('prepare_design', { draft }, signal()).then(JSON.parse)
    const baseline = await prepare(original)
    expect(baseline.available).toBe(true)
    const priorArtifact = structuredClone(session.resolve(baseline.artifactId))
    const invalid = structuredClone(candidate)
    Reflect.deleteProperty(invalid.fillTemplates, 'selectedMetal')
    const rejected = await prepare(invalid)
    expect(rejected).toMatchObject({
      available: false,
      recovery: 'correct_input',
      draftId: expect.any(String)
    })
    expect(rejected.artifactId).toBeUndefined()
    expect(session.resolve(baseline.artifactId)).toEqual(priorArtifact)
    const insertedTemplate = JSON.parse(
      await designs.call(
        'prepare_design',
        {
          repair: {
            draftId: rejected.draftId,
            replacements: [
              { path: '/fillTemplates/selectedMetal', value: chosenGradient }
            ]
          }
        },
        signal()
      )
    )
    expect(insertedTemplate).toMatchObject({
      available: true,
      preparationInput: { kind: 'retained-repair', replacementCount: 1 }
    })
    expect(session.recipe(insertedTemplate.artifactId).recipe).toEqual(
      candidate
    )
    expect(session.resolve(baseline.artifactId)).toEqual(priorArtifact)
    const repaired = JSON.parse(
      await designs.call(
        'prepare_design',
        {
          repair: {
            draftId: rejected.draftId,
            replacements: [
              { path: '/fillTemplates', value: candidate.fillTemplates }
            ]
          }
        },
        signal()
      )
    )
    expect(repaired.available).toBe(true)
    expect(repaired.artifactId).not.toBe(baseline.artifactId)
    expect(repaired.preparationInput.kind).toBe('retained-repair')
    expect(session.recipe(repaired.artifactId).recipe).toEqual(candidate)
    expect(session.resolve(baseline.artifactId)).toEqual(priorArtifact)
    const { review, ...expectedArtifact } = prepareDesign(
      candidate,
      repaired.artifactId
    )
    expect(review).toEqual(candidate.brief)
    expect(session.resolve(repaired.artifactId)).toEqual(expectedArtifact)
    expect(
      admitPreparedDesign(JSON.parse(JSON.stringify(expectedArtifact)))
    ).toEqual(expectedArtifact)
    expect(dispatch).not.toHaveBeenCalled()
  } finally {
    knowledge.dispose()
    registry.dispose()
  }
})

it('recovers missing template containers through fully admitted insertion or existing assignment', async () => {
  const session = createDesignPreparationSession()
  const designs = createLocalDesignTools(
    [createPreparedDesignAction()],
    session
  )
  const draft = {
    type: 'group',
    name: 'Material boundary',
    children: [
      {
        type: 'rect',
        key: 'pane',
        name: 'Pane',
        x: 0,
        y: 0,
        width: 20,
        height: 30,
        fill: { template: 'glass' }
      }
    ]
  }
  const prepare = (input: unknown) =>
    designs.call('prepare_design', input, signal()).then(JSON.parse)
  const rejected = await prepare({ draft })
  expect(rejected).toMatchObject({
    available: false,
    recovery: 'correct_input',
    draftId: expect.any(String)
  })
  const missingContainer = await prepare({
    repair: {
      draftId: rejected.draftId,
      replacements: [{ path: '/fillTemplates', value: { glass: '#527b86' } }]
    }
  })
  expect(missingContainer).toMatchObject({
    available: true,
    preparationInput: { kind: 'retained-repair', replacementCount: 1 }
  })
  expect(session.recipe(missingContainer.artifactId).recipe).toEqual({
    ...draft,
    fillTemplates: { glass: '#527b86' }
  })
  expect(draft).not.toHaveProperty('fillTemplates')
  expect(
    await prepare({
      repair: {
        draftId: rejected.draftId,
        replacements: [
          { path: '/unregisteredTemplates', value: { glass: '#527b86' } }
        ]
      }
    })
  ).toMatchObject({ available: false, settlement: 'not-started' })
  const repaired = await prepare({
    repair: {
      draftId: rejected.draftId,
      replacements: [{ path: '/children/0/fill', value: '#527b86' }]
    }
  })
  expect(repaired.available).toBe(true)
  expect(session.recipe(repaired.artifactId).recipe).toEqual({
    ...draft,
    children: [{ ...draft.children[0], fill: '#527b86' }]
  })
  // A rejected source receipt is request-local. Recover its input in a new
  // request; this does not authorize replay of any completed canvas action.
  const next = createLocalDesignTools(
    [createPreparedDesignAction()],
    createDesignPreparationSession()
  )
  const expired = JSON.parse(
    await next.call(
      'prepare_design',
      {
        repair: {
          draftId: rejected.draftId,
          replacements: [{ path: '/children/0/fill', value: '#527b86' }]
        }
      },
      signal()
    )
  )
  expect(expired).toMatchObject({
    available: false,
    message: expect.stringContaining('resend the source draft')
  })
  const sourceRecovery = JSON.parse(
    await next.call(
      'prepare_design',
      {
        draft: {
          ...draft,
          fillTemplates: { glass: '#527b86' }
        }
      },
      signal()
    )
  )
  expect(sourceRecovery.available).toBe(true)
  expect(session.resolve(repaired.artifactId).entries).toHaveLength(2)
})

it('routes recorded local material edits through actual discovery and artifact targets and rejects stale or mixed targets before dispatch', async () => {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/material-role-replay.jsonl',
        import.meta.url
      ),
      'utf8'
    )
  )
  const registry = createAiActionRegistry()
  try {
    for (const action of [
      ...createBasicApiActions(),
      createPreparedDesignAction()
    ]) {
      registry.register(action)
    }
    const session = createDesignPreparationSession()
    const designs = createLocalDesignTools(registry.list(), session)
    const prepared = JSON.parse(
      await designs.call(
        'prepare_design',
        { draft: saved.calls[0].inputValue.draft },
        signal()
      )
    )
    const artifact = structuredClone(session.resolve(prepared.artifactId))
    // The browser exchange is recorded here. This proves resolution and
    // dispatch, not actual canvas mutation or document persistence.
    const dispatch = vi.fn(
      async (batch: import('../action-batch-protocol').AiActionBatch) => ({
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'complete',
            value: null,
            acceptedIds: action.arguments.elementIds,
            unavailableIds: [],
            changed: true,
            toolOutcome: { status: 'success', settlement: 'completed' },
            mutationScope: {
              complete: true,
              elementIds: action.arguments.elementIds,
              removedElementIds: []
            }
          }
        })),
        context: {}
      })
    )
    const operations = createLocalOperationTools(
      registry.list(),
      designs,
      dispatch
    )
    const usage = JSON.parse(
      await operations.call(
        'describe_design_apis',
        {
          operations: ['fill.updateFillsAtIndex', 'fill.detachFillsAtIndex'],
          view: 'usage'
        },
        signal()
      )
    )
    expect(
      usage.apis.map((api: { operation: string }) => api.operation)
    ).toEqual(['fill.updateFillsAtIndex', 'fill.detachFillsAtIndex'])
    const operation = structuredClone(saved.calls[1].inputValue.operations[1])
    operation.target.artifactId = prepared.artifactId
    const call = (value: unknown) =>
      operations.call(
        'execute_design_batch',
        {
          inspection: 'defer',
          operations: [value]
        },
        signal()
      )
    const mixed = structuredClone(operation)
    mixed.target.keys.push('missing-surface')
    await expect(call(mixed)).rejects.toThrow()
    expect(dispatch).not.toHaveBeenCalled()
    const result = JSON.parse(await call(operation))
    expect(localToolOutcome(result)).toMatchObject({
      status: 'partial',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })
      ])
    })
    expect(result.actionResults[0].result.toolOutcome.status).toBe('success')
    expect(dispatch).toHaveBeenCalledTimes(1)
    const actions = dispatch.mock.calls[0][0].actions
    expect(actions).toHaveLength(1)
    const selectedIds = operation.target.keys.map(
      (key: string) => artifact.keyToId[key]
    )
    expect(actions[0].arguments).toEqual({
      ...operation.arguments,
      elementIds: selectedIds
    })
    expect(new Set(selectedIds).size).toBe(6)
    expect(session.resolve(prepared.artifactId)).toEqual(artifact)
    session.release([prepared.artifactId])
    await expect(call(operation)).rejects.toThrow()
    expect(dispatch).toHaveBeenCalledTimes(1)
    // After a completed edit and lost artifact, current-document IDs
    // supplied by the caller are a valid route for a new explicit edit. This
    // test does not simulate the document query or replay the completed edit.
    const { target, ...fresh } = operation
    expect(target.artifactId).toBe(prepared.artifactId)
    fresh.arguments = {
      ...fresh.arguments,
      elementIds: selectedIds,
      patch: { color: '#aabbcc' }
    }
    const freshResult = JSON.parse(await call(fresh))
    expect(localToolOutcome(freshResult)).toMatchObject({
      status: 'partial',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })
      ])
    })
    expect(freshResult.actionResults[0].result.toolOutcome.status).toBe(
      'success'
    )
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch.mock.calls[1][0].actions[0].arguments).toEqual(
      fresh.arguments
    )
  } finally {
    registry.dispose()
  }
})

it('preserves every recorded reflection through template preparation and admission without replacing nonperiodic paints with a palette', async () => {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/representation-replay.jsonl',
        import.meta.url
      ),
      'utf8'
    )
  )
  const source = saved.calls.find(
    (call: { input: { bytes: number } }) => call.input?.bytes === 670447
  )
  expect(source).toBeDefined()
  const originalText = JSON.stringify(source.inputValue)
  const compact = structuredClone(source.inputValue)
  const materials = new Map<string, string>()
  let palettes = 0
  for (const child of compact.draft.children) {
    for (const motif of child.motifs ?? []) {
      if (!motif.fills) {
        continue
      }
      palettes++
      const paints = motif.fills.map((fill: unknown) => JSON.stringify(fill))
      // Exhaust every shorter prefix; row-major cycling cannot reproduce this
      // saved palette. This is input evidence, not a visual quality judgment.
      expect(paints).toHaveLength(224)
      for (let period = 1; period < paints.length; period++) {
        expect(
          paints.every(
            (paint: string, index: number) => paint === paints[index % period]
          )
        ).toBe(false)
      }
      motif.fills = motif.fills.map((fill: unknown) => {
        const serialized = JSON.stringify(fill)
        let key = materials.get(serialized)
        if (!key) {
          key = `material-${materials.size}`
          materials.set(serialized, key)
          compact.draft.fillTemplates[key] = fill
        }
        return { template: key }
      })
    }
  }
  expect(palettes).toBe(16)
  expect(materials.size).toBe(1545)
  expect(Buffer.byteLength(originalText)).toBe(670447)
  expect(Buffer.byteLength(JSON.stringify(compact))).toBe(423930)
  const session = createDesignPreparationSession()
  const designs = createLocalDesignTools(
    [createPreparedDesignAction()],
    session
  )
  const result = JSON.parse(
    await designs.call('prepare_design', { draft: compact.draft }, signal())
  )
  expect(result.available).toBe(true)
  const { review: _review, ...expected } = prepareDesign(
    source.inputValue.draft,
    result.artifactId
  )
  expect(session.resolve(result.artifactId)).toEqual(expected)
  expect(admitPreparedDesign(JSON.parse(JSON.stringify(expected)))).toEqual(
    expected
  )
  const fills = expected.entries.flatMap(
    (entry) => entry.descriptor.fills ?? []
  ) as { id: string }[]
  expect(new Set(fills.map((fill) => fill.id)).size).toBe(fills.length)
  const broken = structuredClone(compact.draft)
  const first = materials.values().next().value
  if (!first) {
    throw new Error('Missing recorded material template')
  }
  Reflect.deleteProperty(broken.fillTemplates, first)
  const rejected = JSON.parse(
    await designs.call('prepare_design', { draft: broken }, signal())
  )
  expect(rejected).toMatchObject({
    available: false,
    recovery: 'correct_input',
    draftId: expect.any(String)
  })
  const repaired = JSON.parse(
    await designs.call(
      'prepare_design',
      {
        repair: {
          draftId: rejected.draftId,
          replacements: [
            { path: '/fillTemplates', value: compact.draft.fillTemplates }
          ]
        }
      },
      signal()
    )
  )
  expect(repaired.available).toBe(true)
  expect(session.resolve(result.artifactId)).toEqual(expected)
  expect(session.recipe(repaired.artifactId).recipe).toEqual(compact.draft)
  expect(JSON.stringify(source.inputValue)).toBe(originalText)
})

it('hands a declared color-only method through exact discovery to retained mapping without pretending to rewrite saved gradients', async () => {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/representation-replay.jsonl',
        import.meta.url
      ),
      'utf8'
    )
  )
  const source = saved.calls.find(
    (call: { input: { bytes: number } }) => call.input?.bytes === 670447
  )
  const prepared = prepareDesign(source.inputValue.draft, 'mapping-capability')
  const entries = new Map(
    prepared.entries.map((entry) => [entry.descriptor.id, entry])
  )
  const selected = prepared.entries
    .filter(
      (entry) =>
        Array.isArray(entry.descriptor.fills) && entry.descriptor.fills.length
    )
    .slice(0, 3)
  const ids = selected.map((entry) => entry.descriptor.id)
  const original = JSON.stringify(selected)
  let invalidate = () => {
    throw new Error('Observer not installed')
  }
  const queries = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => prepared.rootId,
      getSelectedElementIds: () => [],
      getElementChildren: () => {
        throw new Error('No hierarchy enumeration needed')
      },
      getElementIdsInBounds: () => {
        throw new Error('Explicit IDs required by this proof')
      },
      getElementMetadata: (id) => {
        const entry = entries.get(id)
        return entry ? { type: entry.descriptor.type } : undefined
      },
      getElementComputedData: (id) => entries.get(id)?.descriptor
    },
    (listener) => {
      invalidate = listener
      return () => {
        invalidate = () => undefined
      }
    }
  )
  const update = vi.fn((updates: readonly { elementId: string }[]) => ({
    value: null,
    changed: updates.length > 0,
    acceptedIds: updates.map((item) => item.elementId),
    unavailableIds: []
  }))
  const action = createRetainedFillAction(queries, {
    metadata: (id) => (entries.has(id) ? {} : undefined),
    targets: (selectedIds) =>
      selectedIds.map((elementId) => {
        const fills = entries.get(elementId)?.descriptor.fills as
          { id: string }[] | undefined
        if (!fills?.[0]?.id) {
          throw new Error('Missing recorded Fill')
        }
        return { elementId, fillId: fills[0].id }
      }),
    update
  })
  const registry = createAiActionRegistry()
  registry.register(action)
  const knowledge = createLocalKnowledgeTools('mapping-capability')
  const activeSignal = signal()
  try {
    const read = JSON.parse(
      await knowledge.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        {
          ids: ['design.architectural-illustration.materials.method'],
          contexts: ['architectural-illustration']
        },
        activeSignal
      )
    )
    expect(
      read.documents.find(
        (doc: { target: string }) =>
          doc.target === 'design.architectural-illustration.materials.method'
      ).text
    ).toContain('map_retained_fills')
    const operations = createLocalOperationTools(
      registry.list(),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      vi.fn()
    )
    const lookup = JSON.parse(
      await operations.call(
        'describe_design_apis',
        { operations: [action.name], view: 'full' },
        activeSignal
      )
    )
    expect(lookup.apis[0].inputSchema).toEqual(action.inputSchema)
    const positions = selected.map((entry) => Number(entry.descriptor.x))
    const input = {
      mappings: [
        {
          query: { scope: 'ids' as const, elementIds: ids },
          coordinateSpace: 'parent-local' as const,
          axis: 'x' as const,
          domain: [Math.min(...positions), Math.max(...positions) + 1],
          index: 0,
          outside: 'reject' as const,
          stops: [
            { at: 0, color: '#000000' },
            { at: 1, color: '#ffffff' }
          ]
        }
      ]
    }
    const unsupported = {
      mappings: [
        {
          ...input.mappings[0],
          gradientHandles: [
            { x: 0, y: 1 },
            { x: 0, y: 0 }
          ]
        }
      ]
    }
    expect(
      operationInputIssue(unsupported, lookup.apis[0].inputSchema)
    ).toBeDefined()
    expect(() =>
      prepareOperationBatch(
        [{ name: action.name, arguments: unsupported }],
        registry.list()
      )
    ).toThrow()
    expect(update).not.toHaveBeenCalled()
    const admitted = prepareOperationBatch(
      [{ name: action.name, arguments: input }],
      registry.list()
    )
    const result = await action.execute(admitted[0].arguments as typeof input, {
      signal: activeSignal,
      runMutation: async (write) => write()
    })
    expect(result).toMatchObject({ status: 'complete', appliedCount: 3 })
    expect(update).toHaveBeenCalledTimes(1)
    expect(
      update.mock.calls[0][0].map(
        (entry: { elementId: string }) => entry.elementId
      )
    ).toEqual(ids)
    for (const entry of update.mock.calls[0][0]) {
      expect(Object.keys(entry.patch)).toEqual(['color'])
    }
    expect(JSON.stringify(selected)).toBe(original)
    const retained = queries.read(
      { scope: 'ids', elementIds: ids, fields: ['x'], delivery: 'reference' },
      activeSignal
    )
    invalidate()
    const { query: _query, ...mapping } = input.mappings[0]
    await expect(
      action.execute(
        {
          mappings: [
            {
              ...mapping,
              snapshotId: retained.snapshotId,
              leaseId: retained.leaseId
            }
          ]
        },
        { signal: activeSignal, runMutation: async (write) => write() }
      )
    ).rejects.toThrow(/stale/)
    expect(update).toHaveBeenCalledTimes(1)
    // Refresh the failed read for a subsequent explicit edit, not the settled
    // write above. A lost output receipt must not ask the caller to redraw.
    vi.spyOn(queries, 'retainReceipt').mockImplementationOnce(() => {
      throw new Error('Receipt unavailable')
    })
    const nextInput = structuredClone(input)
    nextInput.mappings[0].stops[0].color = '#112233'
    const settled = await action.execute(nextInput, {
      signal: activeSignal,
      runMutation: async (write) => write()
    })
    expect(settled).toMatchObject({
      status: 'complete',
      delivery: {
        status: 'unavailable',
        message: expect.stringContaining('do not replay')
      }
    })
    expect(update).toHaveBeenCalledTimes(2)
  } finally {
    knowledge.dispose()
    registry.dispose()
    queries.dispose()
  }
})

it.each([false, true])(
  'keeps reference-backed spatial judgment independent of local detail with Knowledge read=%s',
  async (readAdvice) => {
    const knowledge = createLocalKnowledgeTools('spatial-decision')
    try {
      if (readAdvice) {
        const response = JSON.parse(
          await knowledge.call(
            AiDesignToolIds.READ_KNOWLEDGE,
            {
              ids: ['design.architectural-illustration.spatial'],
              contexts: ['architectural-illustration']
            },
            signal()
          )
        )
        expect(
          response.documents.map((doc: { target: string }) => doc.target)
        ).toContain('illustration.architecture.spatial')
      }
      // The recorded agent selected massing advice but its criteria did not isolate
      // relationships. We control that decision here; no automated visual judgment.
      const recorded = recordedDecisions.calls
      expect(Object.keys(recorded.criteria.inputValue.criteria)).toEqual([
        'overall',
        'detail',
        'scale'
      ])
      expect(
        recorded.earlyCapture.inputValue.inspections.every((item) =>
          item.checks.every((check) => !('referenceUses' in check))
        )
      ).toBe(true)
      const source = recorded.references.inputValue.referenceDecisions[0]
      const review = createLocalDesignReview({
        validateReferences: () => [
          {
            attachmentIndex: 0,
            referenceId: source.referenceId,
            validation: { width: 507, height: 665 }
          }
        ]
      })
      review.record({
        phase: 'plan',
        method:
          'Compare the chosen attached-mass relationship separately from detail',
        references: [],
        detailRequired: false,
        criteria: {
          relationship: {
            requirement:
              'Preserve the visible offset and contact of the attached lower mass',
            description:
              'Compare both masses and their join; dimensions remain estimated',
            verification: 'visual',
            requiredUnits: []
          },
          detail: {
            requirement: 'Keep the requested entrance detail',
            description: 'Entrance only',
            verification: 'visual',
            requiredUnits: ['base']
          }
        }
      })
      const select = (
        region:
          'whole' | { x: number; y: number; width: number; height: number }
      ) =>
        review.selectReferences([0], {
          requirementRevision: 1,
          referenceDecisions: [
            {
              ...source,
              uses: [
                {
                  ...source.uses[0],
                  criterionId: 'relationship',
                  region
                }
              ]
            }
          ]
        })
      select('whole')
      const receipt = () =>
        review.correctionContext().referenceDecisions[0].uses[0].receipt
      const whole = review.inspect('composition', true, true)?.inspectionId
      const detail = review.inspect('entrance', true, false)?.inspectionId
      if (!whole || !detail) {
        throw new Error('Expected controlled capture receipts')
      }
      const submit = (bound: ReturnType<typeof review.bindReview>) =>
        review.recordBoundReview({
          ...bound,
          final: true,
          checks: bound.checks.map((check) => ({
            ...check,
            status: 'pass',
            evidence:
              'Controlled primary-agent verdict for this explicit requirement'
          }))
        })
      // No reference or Knowledge prerequisite for an ordinary detail judgment.
      submit(
        review.bindReview('visual', [
          { criterionId: 'detail', unitId: 'base', inspectionIds: [detail] }
        ])
      )
      expect(review.isAccepted()).toBe(false)
      const independent = review
        .readChecks({ includePassed: true })
        .items.find((item) => item.unitId === 'base')
      expect(() =>
        review.bindReview('visual', [
          {
            criterionId: 'detail',
            unitId: 'base',
            inspectionIds: [detail],
            referenceUses: [receipt()]
          }
        ])
      ).toThrow()
      const binding = () =>
        review.bindReview('visual', [
          {
            criterionId: 'relationship',
            inspectionIds: [whole],
            referenceUses: [receipt()]
          }
        ])
      const original = binding()
      submit(original)
      expect(review.isAccepted()).toBe(true)
      const checks = review.readChecks({ includePassed: true })
      expect(review.inspect('composition', false, true)).toBeUndefined()
      expect(review.readChecks({ includePassed: true })).toEqual(checks)
      expect(() => select({ x: 500, y: 0, width: 20, height: 20 })).toThrow()
      expect(review.readChecks({ includePassed: true })).toEqual(checks)
      select({ x: 0, y: 0, width: 507, height: 664 })
      expect(review.isAccepted()).toBe(false)
      expect(() => submit(original)).toThrow(/stale/)
      expect(
        review
          .readChecks({ includePassed: true })
          .items.find((item) => item.unitId === 'base')
      ).toEqual(independent)
      submit(binding())
      expect(review.isAccepted()).toBe(true)
    } finally {
      knowledge.dispose()
    }
  }
)

it('joins advisory reads, real preparation and scoped material verdict recovery without approving unfinished detail', async () => {
  const knowledge = createLocalKnowledgeTools('combined-material')
  try {
    const read = JSON.parse(
      await knowledge.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        {
          ids: [
            'design.architectural-illustration.materials.method.parameters'
          ],
          contexts: ['architectural-illustration']
        },
        signal()
      )
    )
    const advice = read.documents.find(
      (document: { target: string }) =>
        document.target ===
        'design.architectural-illustration.materials.method.parameters'
    )
    const sample = [...advice.text.matchAll(/```json\n([\s\S]*?)\n```/g)]
      .map((match) => JSON.parse(match[1]))
      .find((entry) => entry.tool === 'prepare_design')
    const session = createDesignPreparationSession()
    const actions = [...createBasicApiActions(), createPreparedDesignAction()]
    const designs = createLocalDesignTools(actions, session)
    const prepared = JSON.parse(
      await designs.call(sample.tool, sample.arguments, signal())
    )
    expect(prepared.available).toBe(true)
    const artifact = session.resolve(prepared.artifactId)
    expect(admitPreparedDesign(structuredClone(artifact))).toEqual(artifact)
    const pane = artifact.keyToId['pane-a'],
      mullion = artifact.keyToId.mullion
    expect(pane).toBeTypeOf('string')
    expect(mullion).toBeTypeOf('string')
    // The original input demonstrates frame-only evidence followed later by a
    // containing-composition crop. It is not a current-session capture receipt.
    const saved = recordedDecisions.calls
    const oldFrame = saved.earlyCapture.inputValue.inspections[1].elementId
    const combined = saved.combinedCapture.inputValue.inspections[2]
    expect(combined.elementId).not.toBe(oldFrame)
    expect(combined.checks[0].supersedes.revision).toBeGreaterThan(0)
    const source = saved.references.inputValue.referenceDecisions[0]
    const review = createLocalDesignReview({
      validateReferences: () => [
        {
          attachmentIndex: 0,
          referenceId: source.referenceId,
          validation: { width: 507, height: 665 }
        }
      ]
    })
    review.record({
      phase: 'plan',
      method: 'Separate chosen material contrast from detail completion',
      references: [],
      detailRequired: false,
      criteria: {
        overall: {
          requirement: 'Preserve spatial relationships',
          description: 'Whole composition',
          verification: 'visual',
          requiredUnits: []
        },
        material: {
          requirement: 'Distinguish chosen glass and metal',
          description: 'Actual paint and bordering structure together',
          verification: 'visual',
          requiredUnits: ['surface']
        },
        detail: {
          requirement: 'Complete the requested detail',
          description: 'Independent completion judgment',
          verification: 'visual',
          requiredUnits: ['repeat']
        }
      }
    })
    review.selectReferences([0], {
      requirementRevision: saved.references.inputValue.requirementRevision,
      referenceDecisions: [source]
    })
    const referenceUse =
      review.correctionContext().referenceDecisions[0].uses[0].receipt
    const capture = (
      elementId: string,
      overview: boolean,
      region?: unknown
    ) => {
      const receipt = review.inspect(elementId, true, overview, region)
      if (!receipt) {
        throw new Error('Expected controlled image capture')
      }
      return receipt.inspectionId
    }
    const overview = capture(artifact.rootId, true)
    const isolatedFrame = capture(mullion, false)
    // The primary agent intentionally requests the containing ready surface;
    // the tool does not infer whether a crop looks like glass.
    const region = { x: 0, y: 0, width: 24, height: 40 }
    let surface = capture(artifact.rootId, false, region)
    const detail = capture(artifact.keyToId['pane-b'], false)
    const bind = () =>
      review.bindReview('visual', [
        {
          criterionId: 'overall',
          inspectionIds: [overview],
          referenceUses: [referenceUse]
        },
        {
          criterionId: 'material',
          unitId: 'surface',
          inspectionIds: [surface]
        },
        { criterionId: 'detail', unitId: 'repeat', inspectionIds: [detail] }
      ])
    const original = bind()
    expect(
      original.checks[1].binding.dependencies.map((item) => item.inspectionId)
    ).toEqual([surface])
    expect(
      original.checks[1].binding.dependencies.map((item) => item.inspectionId)
    ).not.toContain(isolatedFrame)
    review.recordBoundReview({
      ...original,
      final: false,
      checks: original.checks.map((check) => ({
        ...check,
        status: check.criterionId === 'detail' ? 'fail' : 'pass',
        evidence:
          check.criterionId === 'detail'
            ? 'Controlled choice: requested detail remains'
            : 'Controlled choice: existing visible relationship is acceptable'
      }))
    })
    const before = review.readChecks({ includePassed: true }).items
    expect(before.find((item) => item.criterionId === 'material')?.status).toBe(
      'pass'
    )
    expect(before.find((item) => item.criterionId === 'detail')?.status).toBe(
      'fail'
    )
    expect(review.isAccepted()).toBe(false)
    const late = bind()
    // Actual preparation/operation owners resolve the target; the browser exchange
    // is controlled here. This proves routing, not a rendered paint or save.
    const dispatch = vi.fn(
      async (batch: import('../action-batch-protocol').AiActionBatch) => ({
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'complete',
            value: null,
            acceptedIds: action.arguments.elementIds,
            unavailableIds: [],
            changed: true,
            toolOutcome: { status: 'success', settlement: 'completed' },
            mutationScope: {
              complete: true,
              elementIds: action.arguments.elementIds,
              removedElementIds: []
            }
          }
        }))
      })
    )
    const operations = createLocalOperationTools(actions, designs, dispatch)
    const selected = JSON.parse(
      await operations.call(
        'describe_design_apis',
        {
          operations: ['fill.updateFillsAtIndex'],
          view: 'usage'
        },
        signal()
      )
    ).apis[0]
    expect(selected.operation).toBe('fill.updateFillsAtIndex')
    expect(selected.execution.tool).toBe('execute_design_batch')
    const correction = {
      inspection: 'defer',
      operations: [
        {
          name: selected.name,
          target: {
            artifactId: prepared.artifactId,
            keys: ['pane-a'],
            field: 'elementIds'
          },
          arguments: { index: 0, patch: { color: '#426a78' } }
        }
      ]
    }
    const invalid = structuredClone(correction)
    invalid.operations[0].target.keys.push('missing-pane')
    await expect(
      operations.call('execute_design_batch', invalid, signal())
    ).rejects.toThrow()
    expect(dispatch).not.toHaveBeenCalled()
    const settled = JSON.parse(
      await operations.call('execute_design_batch', correction, signal())
    )
    expect(localToolOutcome(settled)).toMatchObject({
      status: 'partial',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })
      ])
    })
    expect(settled.actionResults[0].result.toolOutcome.status).toBe('success')
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].actions[0].arguments).toEqual({
      elementIds: [pane],
      index: 0,
      patch: { color: '#426a78' }
    })
    // Controlled browser change notification: a paint edit affects its crop and
    // overview, not the independent detail evidence. This does not simulate pixels.
    review.invalidateInspections([surface, overview], 'Selected paint changed')
    expect(() =>
      review.recordBoundReview({
        ...late,
        checks: late.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Late judgment'
        }))
      })
    ).toThrow()
    expect(
      review.inspect(artifact.rootId, false, false, region)
    ).toBeUndefined()
    expect(
      review
        .readChecks({ includePassed: true })
        .items.find((item) => item.criterionId === 'detail')
    ).toEqual(before.find((item) => item.criterionId === 'detail'))
    surface = capture(artifact.rootId, false, region)
    const currentOverview = capture(artifact.rootId, true)
    const repaired = review.bindReview('visual', [
      {
        criterionId: 'overall',
        inspectionIds: [currentOverview],
        referenceUses: [referenceUse]
      },
      { criterionId: 'material', unitId: 'surface', inspectionIds: [surface] }
    ])
    review.recordBoundReview({
      ...repaired,
      final: true,
      checks: repaired.checks.map((check) => ({
        ...check,
        status: 'pass',
        evidence: 'Controlled post-edit verdict'
      }))
    })
    expect(review.isAccepted()).toBe(false)
    const completed = review.bindReview('visual', [
      { criterionId: 'detail', unitId: 'repeat', inspectionIds: [detail] }
    ])
    review.recordBoundReview({
      ...completed,
      final: true,
      checks: completed.checks.map((check) => ({
        ...check,
        status: 'pass',
        evidence: 'Controlled final detail verdict'
      }))
    })
    expect(review.isAccepted()).toBe(true)
    expect(session.resolve(prepared.artifactId)).toEqual(artifact)
    // Inspection recovery did not replay the settled edit.
    expect(dispatch).toHaveBeenCalledTimes(1)
  } finally {
    knowledge.dispose()
  }
})

it('uses the current qualified route across partial, full and recovery retrieval without treating receipt history as delivery proof', async () => {
  const recorded = recordedDecisions.discoveryProjection
  expect(recorded).toHaveLength(10)
  const first = recorded[0].definitions.find(
    (item) => item.name === 'prepare_and_apply_design'
  )
  const retry = recorded[1]
  expect(retry.input).toMatchObject({
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(retry.definitions[0].definition?.revision).toBe(
    first?.definition?.revision
  )
  expect(retry.outputBytes).toBe(65110)
  // Saved receipts do not establish that the model actually received/retained
  // their content. The real owner must keep explicit recovery available.
  const registry = createAiActionRegistry()
  try {
    for (const action of [
      ...createBasicApiActions(),
      createPreparedDesignAction()
    ]) {
      registry.register(action)
    }
    const session = createDesignPreparationSession()
    const designs = createLocalDesignTools(registry.list(), session)
    const dispatch = vi.fn()
    const operations = createLocalOperationTools(
      registry.list(),
      designs,
      dispatch,
      {
        getNativeTools: () =>
          workflow.definitions.map((definition) => ({
            ...definition,
            namespace: 'design_workflow'
          }))
      }
    )
    const workflow = createLocalDesignWorkflow(designs, operations)
    const read = (input: unknown) =>
      operations.call('describe_design_apis', input, signal()).then(JSON.parse)
    const name = 'design_workflow.prepare_and_apply_design'
    const usage = (await read({ names: [name], view: 'usage' })).tools[0]
    expect(usage.definition.coverage).toBe('usage')
    expect(usage.inputSchema).toBeUndefined()
    expect(usage.inputFields).toContain('/properties/draft')
    const wrong = (
      await read({ names: [name], schemaPaths: ['/properties/missing'] })
    ).tools[0]
    expect(wrong.definition.state).toBe('unavailable')
    expect(wrong.schemaResolution.recover.arguments).toEqual({
      names: [name],
      view: 'usage'
    })
    const recoveredUsage = (
      await read(wrong.schemaResolution.recover.arguments)
    ).tools[0]
    expect(recoveredUsage.definition.state).toBe('included')
    const partial = (
      await read({ names: [name], schemaPaths: ['/properties/draft'] })
    ).tools[0]
    expect(partial.schemaFragments[0].path).toBe('/properties/draft')
    expect(partial.inputSchema).toBeUndefined()
    expect(partial.outputSchema).toBeUndefined()
    const full = (await read({ names: [name] })).tools[0]
    const canonical = workflow.definitions.find(
      (definition) => definition.name === 'prepare_and_apply_design'
    )
    if (!canonical) {
      throw new Error('Expected canonical workflow contract')
    }
    expect(full.inputSchema).toEqual(canonical.inputSchema)
    expect(full.outputSchema).toEqual(canonical.outputSchema)
    expect(full.partialOutputSchema).toEqual(canonical.partialOutputSchema)
    expect(full.lifecycle).toEqual(canonical.lifecycle)
    expect(full.definition).toMatchObject({
      coverage: 'full',
      state: 'included'
    })
    const repeated = (await read({ names: [name] })).tools[0]
    expect(repeated.definition).toMatchObject({
      coverage: 'full',
      state: 'included',
      availableInResponse: true
    })
    expect(repeated.inputSchema).toEqual(full.inputSchema)
    const restored = (
      await read({
        ...repeated.definition.refresh.arguments,
        refreshReason: 'delivery-failure'
      })
    ).tools[0]
    expect(restored.inputSchema).toEqual(full.inputSchema)
    expect(restored.outputSchema).toEqual(full.outputSchema)
    expect(restored.definition).toMatchObject({
      revision: full.definition.revision,
      state: 'included',
      deliveryReason: 'recovery'
    })
    const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value))
    expect(bytes(usage)).toBeLessThan(bytes(full))
    expect(bytes(partial)).toBeLessThan(bytes(full))
    expect(repeated).toEqual(full)
    expect(dispatch).not.toHaveBeenCalled()
  } finally {
    registry.dispose()
  }
})

it('hands one continuous parent-space material domain to independent local fills without requiring Knowledge', () => {
  const session = createDesignPreparationSession()
  const stops = [
    { position: 0, color: '#123456', opacity: 1 },
    { position: 1, color: '#abcdef', opacity: 1 }
  ]
  const source = {
    type: 'group',
    name: 'Continuous facade',
    brief: {
      intent: 'A continuous vertical material field across adjacent parts',
      viewpoint: 'Same 2D parent basis',
      sources: [],
      assumptions: [
        'Local handles implement the common parent-space domain; material and unfinished detail are separate judgments.'
      ],
      checks: []
    },
    children: [0, 100].map((y, index) => ({
      type: 'rect',
      key: `part-${index}`,
      name: `Part ${index}`,
      x: 0,
      y,
      width: 100,
      height: 100,
      fill: {
        gradientType: 'linear',
        gradientHandles: [
          { x: 0, y: (0 - y) / 100 },
          { x: 0, y: (200 - y) / 100 }
        ],
        gradientStops: stops
      }
    }))
  }
  const prepared = session.prepare(source)
  const artifact = session.resolve(prepared.artifactId)
  expect(admitPreparedDesign(structuredClone(artifact))).toEqual(artifact)
  const gradients = artifact.entries
    .filter((e) => e.descriptor.type === 'rect')
    .map((e) => e.descriptor.fills?.[0].gradient)
  expect(gradients).toEqual(source.children.map((c) => c.fill))
  // Parameter continuity at the shared edge; this is not a visual-quality judgment.
  const parameters = source.children.map((c, index) => {
    const [a, b] = c.fill.gradientHandles
    return ((index === 0 ? 1 : 0) - a.y) / (b.y - a.y)
  })
  expect(parameters).toEqual([0.5, 0.5])
  const invalid = structuredClone(source)
  invalid.children[1].fill.gradientHandles[1].y = NaN
  expect(() => session.prepare(invalid)).toThrow()
  expect(session.resolve(prepared.artifactId)).toEqual(artifact)
})

it('executes documented exclusive direct and retained target inputs through canonical batch admission', async () => {
  const knowledge = createLocalKnowledgeTools('target-examples')
  try {
    const result = JSON.parse(
      await knowledge.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        {
          ids: ['design.architectural-illustration.contracts.operations'],
          contexts: ['architectural-illustration']
        },
        signal()
      )
    )
    const app = result.documents.find(
      (item: { target: string }) =>
        item.target === 'design.architectural-illustration.contracts.operations'
    )
    const examples = [...app.text.matchAll(/```json\n([\s\S]*?)\n```/g)]
      .map((match) => JSON.parse(String(match[1])))
      .filter((sample) => sample.tool === AiDesignToolIds.EXECUTE_DESIGN_BATCH)
    expect(examples).toHaveLength(2)
    const session = createDesignPreparationSession()
    const designs = createLocalDesignTools(createBasicApiActions(), session)
    const part = session.prepare({
      type: 'group',
      name: 'Example part',
      children: [
        {
          type: 'rect',
          key: 'chosen',
          name: 'Chosen shape',
          width: 10,
          height: 10
        }
      ]
    })
    const partId = part.artifactId
    const expected = session
      .resolve(partId)
      .entries.find((entry) => entry.key === 'chosen')?.descriptor.id
    expect(expected).toBeDefined()
    for (const sample of examples) {
      const operation = structuredClone(sample.arguments.operations[0])
      if (operation.target) {
        operation.target.artifactId = partId
      } else {
        operation.arguments.elementIds = [expected]
      }
      const resolve = vi.fn(designs.resolveTargets)
      const actions = prepareOperationBatch(
        [operation],
        createBasicApiActions(),
        resolve
      )
      expect(actions).toHaveLength(1)
      expect(actions[0].arguments).toEqual({ elementIds: [expected] })
      expect(resolve).toHaveBeenCalledTimes(operation.target ? 1 : 0)
      if (operation.target) {
        resolve.mockClear()
        expect(() =>
          prepareOperationBatch(
            [{ ...operation, arguments: { elementIds: [] } }],
            createBasicApiActions(),
            resolve
          )
        ).toThrow(/conflicting target binding/)
        expect(resolve).not.toHaveBeenCalled()
      }
    }
  } finally {
    knowledge.dispose()
  }
})

it('executes the documented representative review through recorded wrong-crop recovery and independent result reuse', async () => {
  const present = <T>(value: T | null | undefined): T => {
    if (value == null) {
      throw new Error('Missing required review receipt')
    }
    return value
  }
  const saved = JSON.parse(
    readFileSync(
      new URL(
        '../../../server/__tests__/fixtures/recorded-101/representative-review-20261019.json',
        import.meta.url
      ),
      'utf8'
    )
  )
  const declaration = saved.calls.find(
    (call: { index: number }) => call.index === 5
  ).input
  expect(
    Object.values(declaration.criteria).every(
      (criterion: { requiredUnits: string[] }) =>
        criterion.requiredUnits.length === 0
    )
  ).toBe(true)
  const recorded = saved.calls.find(
    (call: { index: number }) => call.index === 14
  )
  expect(recorded.output.accepted).toBe(false)
  const observed = recorded.input.checks.find(
    (check: { criterionId: string }) => check.criterionId === 'facade'
  )
  expect(observed.status).toBe('unverified')

  const knowledge = createLocalKnowledgeTools('representative-review')
  try {
    const delivery = JSON.parse(
      await knowledge.call(
        AiDesignToolIds.READ_KNOWLEDGE,
        {
          ids: ['design.architectural-illustration.materials.review'],
          contexts: ['architectural-illustration']
        },
        signal()
      )
    )
    const app = delivery.documents.find(
      (document: { target: string }) =>
        document.target === 'design.architectural-illustration.materials.review'
    )
    const match = app.text.match(
      /```json representative-review\n([\s\S]*?)\n```/
    )
    if (!match) {
      throw new Error('Missing executable representative review example')
    }
    const example = JSON.parse(match[1])
    const { designEvidenceDefinitions } =
      await import('../../../server/local-design-review')
    const definition = designEvidenceDefinitions.find(
      (item) => item.name === example.tool
    )
    if (!definition) {
      throw new Error('Unknown documented declaration')
    }
    expect(
      operationInputIssue(example.arguments, definition.inputSchema)
    ).toBeUndefined()
    const owner = createLocalDesignReview()
    owner.record({ ...example.arguments, phase: 'plan' })
    const crop = (x: number, revision: number) => {
      const result = owner.inspect(
        'sample',
        true,
        false,
        { x, y: 0, width: 40, height: 40 },
        true,
        {
          sessionId: 'sample-document',
          revision,
          receiptId: `sample-${revision}`
        }
      )
      if (!result) {
        throw new Error('Missing image receipt')
      }
      return result.inspectionId
    }
    const roof = crop(0, 1)
    const bound = owner.bindReview('visual', [
      { criterionId: 'material', unitId: 'sample-join', inspectionIds: [roof] }
    ])
    const missing = owner.recordBoundReview({
      ...bound,
      final: false,
      checks: bound.checks.map((check) => ({
        ...check,
        status: observed.status,
        evidence: observed.evidence
      }))
    })
    expect(missing).toMatchObject({
      reviewOperation: 'record',
      accepted: false,
      recordedChecks: [
        { criterionId: 'material', unitId: 'sample-join', status: 'unverified' }
      ]
    })
    const before = owner.readChecks({ includePassed: true })
    const facade = crop(50, 1)
    expect(() =>
      owner.bindReview('visual', [
        {
          criterionId: 'material',
          unitId: 'sample-join',
          inspectionIds: [facade]
        }
      ])
    ).toThrow(/supersed/i)
    expect(owner.readChecks({ includePassed: true })).toEqual(before)
    const rebound = owner.bindReview('visual', [
      {
        criterionId: 'material',
        unitId: 'sample-join',
        inspectionIds: [facade],
        supersedes: {
          revision: present(missing.recordedChecks)[0].revision,
          reason: 'The previous crop showed the roof, not the material join.'
        }
      }
    ])
    const pass = owner.recordBoundReview({
      ...rebound,
      final: false,
      checks: rebound.checks.map((check) => ({
        ...check,
        status: 'pass',
        evidence:
          'Supplied deterministic observation of the actual material and join.'
      }))
    })
    expect(pass).toMatchObject({
      accepted: false,
      recordedChecks: [{ status: 'pass' }],
      coverage: {
        passed: 1,
        pending: [expect.objectContaining({ criterionId: 'overall' })]
      }
    })
    const currentPass = owner.readChecks({
      ids: [present(pass.recordedChecks)[0].id],
      includePassed: true
    })
    owner.mutate()
    expect(
      owner.readChecks({
        ids: [present(pass.recordedChecks)[0].id],
        includePassed: true
      })
    ).toEqual(currentPass)
    const whole = present(
      owner.inspect('drawing', true, true, undefined, false, {
        sessionId: 'sample-document',
        revision: 2,
        receiptId: 'whole-2'
      })
    )
    const finalBinding = owner.bindReview('visual', [
      { criterionId: 'overall', inspectionIds: [whole.inspectionId] }
    ])
    expect(
      owner.recordBoundReview({
        ...finalBinding,
        final: true,
        checks: finalBinding.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Supplied whole-drawing observation.'
        }))
      })
    ).toMatchObject({ accepted: true, coverage: { required: 2, passed: 2 } })
    const late = owner.bindReview('visual', [
      {
        criterionId: 'material',
        unitId: 'sample-join',
        inspectionIds: [facade]
      }
    ])
    owner.invalidateInspections(
      [facade, whole.inspectionId],
      'The material region and its whole-view image changed.'
    )
    expect(() =>
      owner.recordBoundReview({
        ...late,
        checks: late.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Late stale result'
        }))
      })
    ).toThrow()
    expect(
      owner.readChecks({ ids: [present(pass.recordedChecks)[0].id] }).items[0]
        .status
    ).toBe('stale')
    expect(
      owner.readChecks({ ids: ['visual:overall'], includePassed: true })
        .items[0].status
    ).toBe('stale')
    const fresh = crop(50, 3)
    const recovery = owner.bindReview('visual', [
      { criterionId: 'material', unitId: 'sample-join', inspectionIds: [fresh] }
    ])
    expect(
      owner.recordBoundReview({
        ...recovery,
        final: true,
        checks: recovery.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Supplied recovered material observation.'
        }))
      })
    ).toMatchObject({ accepted: false })
    const recoveredWhole = present(
      owner.inspect('drawing', true, true, undefined, false, {
        sessionId: 'sample-document',
        revision: 3,
        receiptId: 'whole-3'
      })
    )
    const complete = owner.bindReview('visual', [
      { criterionId: 'overall', inspectionIds: [recoveredWhole.inspectionId] }
    ])
    expect(
      owner.recordBoundReview({
        ...complete,
        final: true,
        checks: complete.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Supplied recovered whole-drawing observation.'
        }))
      })
    ).toMatchObject({ accepted: true })
  } finally {
    knowledge.dispose()
  }
})

it.each(['unverified', 'fail'] as const)(
  'dispatches the published native route through %s recovery without discarding an independent pass',
  async (status) => {
    const { AiActionNames } = await import('../../constants/ai-actions')
    const { localOperationNamespace } =
      await import('../../../server/local-operation-tools')
    const saved = JSON.parse(
      readFileSync(
        new URL(
          '../../../server/__tests__/fixtures/recorded-101/representative-review-20261019.json',
          import.meta.url
        ),
        'utf8'
      )
    )
    const observation = saved.calls
      .find((call: { index: number }) => call.index === 14)
      .input.checks.find(
        (check: { criterionId: string }) => check.criterionId === 'facade'
      )
    expect(observation.status).toBe('unverified')
    const knowledge = createLocalKnowledgeTools('native-representative-handoff')
    try {
      const response = JSON.parse(
        await knowledge.call(
          AiDesignToolIds.READ_KNOWLEDGE,
          {
            ids: ['design.architectural-illustration.materials.review'],
            contexts: ['architectural-illustration']
          },
          signal()
        )
      )
      const text = response.documents.find(
        (document: { target: string }) =>
          document.target ===
          'design.architectural-illustration.materials.review'
      ).text
      const example = (label: string) => {
        const match = text.match(
          new RegExp('```json ' + label + '\\n([\\s\\S]*?)\\n```')
        )
        if (!match) {
          throw new Error(`Missing ${label} example`)
        }
        return JSON.parse(match[1])
      }
      const declaration = example('representative-review')
      const capture = example('representative-capture')
      declaration.arguments.criteria.independent = {
        requirement: 'Keep the independent accepted part',
        description: 'Separate image and dependencies',
        verification: 'visual',
        requiredUnits: []
      }
      let available = true
      const dispatch = vi.fn(
        async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
          context: {},
          actionResults: batch.actions.map((action) => {
            let result: AiJsonValue = {
              current: true,
              validatedAt: { sessionId: 'saved-route', revision: 1 },
              coverage: { complete: true }
            }
            if (action.name === AiActionNames.INSPECT_DRAWING) {
              result = available
                ? {
                    available: true,
                    imageScope: (action.arguments as Record<string, unknown>)
                      .region
                      ? 'region'
                      : 'overview',
                    evidence: { sessionId: 'saved-route', revision: 1 },
                    image: { dataUrl: 'data:image/png;base64,AA==' }
                  }
                : {
                    available: false,
                    message:
                      'Capture is unavailable; select the actual visible join.'
                  }
            }
            return { actionId: action.id, actionName: action.name, result }
          })
        })
      )
      const operations = createLocalOperationTools(
        [
          AiActionNames.INSPECT_DRAWING,
          AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        ].map((name) => ({ name, description: name, inputSchema: {} })),
        { modelActions: (a) => a, resolveBatch: (b) => b },
        dispatch,
        {
          getNativeTools: () =>
            operations.definitions.map((definition) => ({
              ...definition,
              namespace: localOperationNamespace
            }))
        }
      )
      const call = async (name: string, args: unknown) =>
        JSON.parse(await operations.call(name, args, signal()))
      for (const sample of [declaration, capture]) {
        const name = `${localOperationNamespace}.${sample.tool}`
        const usage = (
          await call('describe_design_apis', { names: [name], view: 'usage' })
        ).tools[0]
        expect(usage.definition.coverage).toBe('usage')
        const full = (await call('describe_design_apis', { names: [name] }))
          .tools[0]
        expect(
          operationInputIssue(sample.arguments, full.inputSchema)
        ).toBeUndefined()
        const repeated = (await call('describe_design_apis', { names: [name] }))
          .tools[0]
        expect(repeated.definition.availableInResponse).toBe(true)
        const restored = (
          await call('describe_design_apis', {
            ...repeated.definition.refresh.arguments,
            refreshReason: 'delivery-failure'
          })
        ).tools[0]
        expect(restored.inputSchema).toEqual(full.inputSchema)
      }
      expect(dispatch).not.toHaveBeenCalled()
      await call(declaration.tool, declaration.arguments)
      const judge = async (
        bound: { next: { arguments: { checks: object[] } } },
        verdict: string,
        evidence: string,
        final?: boolean
      ) =>
        call(capture.tool, {
          ...bound.next.arguments,
          ...(final === undefined ? {} : { final }),
          checks: bound.next.arguments.checks.map((check) => ({
            ...check,
            status: verdict,
            evidence
          }))
        })
      const independent = await call(capture.tool, {
        phase: 'visual',
        final: false,
        inspections: [
          { elementId: 'independent', checks: [{ criterionId: 'independent' }] }
        ]
      })
      const prior = (
        await judge(
          independent,
          'pass',
          'Deterministic independent observation.'
        )
      ).recordedChecks[0]
      const retained = () =>
        call(AiDesignToolIds.READ_DESIGN_CHECKS, {
          view: 'details',
          ids: [prior.id],
          includePassed: true
        })
      const before = await retained()
      available = false
      const unavailable = await call(capture.tool, capture.arguments)
      expect(unavailable.recordedChecks ?? []).toEqual([])
      expect(unavailable.accepted).not.toBe(true)
      expect((await retained()).items).toEqual(before.items)
      available = true
      const bound = await call(capture.tool, capture.arguments)
      const missing = await judge(
        bound,
        status,
        status === 'unverified'
          ? observation.evidence
          : 'Deterministic material contrast failure at the selected join.'
      )
      expect(missing).toMatchObject({
        accepted: false,
        recordedChecks: [
          { criterionId: 'material', unitId: 'sample-join', status }
        ]
      })
      const failed = missing.recordedChecks[0]
      const replacement = structuredClone(capture.arguments)
      replacement.inspections[0].region.x = 40
      replacement.inspections[0].checks[0].supersedes = {
        revision: failed.revision,
        reason:
          status === 'unverified'
            ? 'Use the actual facade join rather than the roof.'
            : 'Judge the corrected material using a fresh image.'
      }
      const recovered = await call(capture.tool, replacement)
      const pass = await judge(
        recovered,
        'pass',
        'Deterministic corrected join observation; this test does not judge real pixels.'
      )
      expect(pass).toMatchObject({
        accepted: false,
        recordedChecks: [
          {
            criterionId: 'material',
            unitId: 'sample-join',
            status: 'pass',
            revision: expect.any(Number)
          }
        ],
        coverage: {
          pending: [expect.objectContaining({ criterionId: 'overall' })]
        }
      })
      expect(pass.recordedChecks[0].revision).toBeGreaterThan(failed.revision)
      expect((await retained()).items).toEqual(before.items)
      // A delayed submission cannot overwrite the replacement with the old binding.
      await expect(
        judge(bound, 'pass', 'Late obsolete observation')
      ).rejects.toThrow()
      expect((await retained()).items).toEqual(before.items)
      const local = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details',
        ids: [failed.id],
        includePassed: true
      })
      expect(local.items[0]).toMatchObject({
        status: 'pass',
        revision: pass.recordedChecks[0].revision
      })
      const whole = await call(capture.tool, {
        phase: 'visual',
        final: true,
        inspections: [
          { elementId: 'whole', checks: [{ criterionId: 'overall' }] }
        ]
      })
      expect(whole.next.arguments.final).toBe(false)
      expect(
        await judge(whole, 'pass', 'Deterministic whole observation.')
      ).toMatchObject({
        accepted: false,
        coverage: { required: 3, passed: 3 }
      })
      const captures = () =>
        dispatch.mock.calls
          .flatMap(([batch]) => batch.actions)
          .filter((action) => action.name === AiActionNames.INSPECT_DRAWING)
          .length
      const beforeCompletion = captures()
      const completion = await call(capture.tool, {
        phase: 'visual',
        bindChecks: [
          { criterionId: 'overall', inspectionIds: whole.inspectionIds }
        ]
      })
      expect(
        await judge(
          completion,
          'pass',
          'Retained whole observation with explicit completion.',
          true
        )
      ).toMatchObject({ accepted: true, coverage: { required: 3, passed: 3 } })
      expect(captures()).toBe(beforeCompletion)
      expect((await retained()).items).toEqual(before.items)
      expect(
        dispatch.mock.calls
          .flatMap(([batch]) => batch.actions)
          .every(
            (action) =>
              action.name === AiActionNames.INSPECT_DRAWING ||
              action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
          )
      ).toBe(true)
    } finally {
      knowledge.dispose()
    }
  }
)

// These scenario consumers assemble read pages before interpreting domain advice.
const createLocalKnowledgeTools = (
  ...args: Parameters<typeof createKnowledgeOwner>
) => {
  const owner = createKnowledgeOwner(...args)
  const call = owner.call.bind(owner)
  owner.call = (name, input, signal) =>
    readCompleteInformation((next) => call(name, next, signal), input)
  return owner
}
const createLocalOperationTools = (
  ...args: Parameters<typeof createOperationOwner>
) => {
  const owner = createOperationOwner(...args)
  const call = owner.call.bind(owner)
  owner.call = (name, input, signal) =>
    readCompleteInformation((next) => call(name, next, signal), input)
  return owner
}
