import { readCompleteInformation } from '../../../server/__tests__/tool-contract-assertions'

import recordedDecisions from '../../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/decision-evidence-replay.json'
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
      doc.target === 'illustration.architecture.materials'
  )
  const app = read.documents.find(
    (doc: { target: string }) =>
      doc.target ===
      'design.architectural-illustration.materials.method.parameters'
  )

  expect(domain.text).toContain('A window grid is not a reflection model')
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

  const actions = [...createBasicApiActions(), createPreparedDesignAction()]
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
    (match) => JSON.parse(match[1]).tool !== AiDesignToolIds.EXECUTE_DESIGN
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
      ['design.architectural-illustration', 20],
      ['design.architectural-illustration.contracts', 2],
      ['illustration.architecture', 5],
      ['illustration.architecture.materials', 1],
      ['illustration.architecture.materials.method', 2],
      ['design.architectural-illustration.materials.method', 5]
    ])
    for (const action of [
      ...createBasicApiActions(),
      createPreparedDesignAction()
    ]) {
      registry.register(action)
    }

    const session = createDesignPreparationSession()
    const designs = createLocalDesignTools(
      [...createBasicApiActions(), createPreparedDesignAction()],
      session
    )
    const dispatch = vi.fn()
    const operations = createLocalOperationTools(
      [...createBasicApiActions(), createPreparedDesignAction()],
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
    const designs = createLocalDesignTools(
      [...createBasicApiActions(), createPreparedDesignAction()],
      session
    )
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
            modelResult: {
              status: 'complete',
              changed: true,
              acceptedCount: action.arguments.elementIds.length,
              unavailableCount: 0,
              settlement: 'completed',
              mutationScope: {
                complete: true,
                elementCount: action.arguments.elementIds.length,
                removedElementCount: 0
              }
            },
            status: 'complete',
            settlement: 'completed',
            value: { acceptedIds: action.arguments.elementIds, changed: true },
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
      [...createBasicApiActions(), createPreparedDesignAction()],
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
        'execute_design',
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
      status: 'success',
      issues: []
    })
    expect(result.actionResults[0].result).toMatchObject({
      status: 'complete',
      settlement: 'completed'
    })
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
      status: 'success',
      issues: []
    })
    expect(freshResult.actionResults[0].result).toMatchObject({
      status: 'complete',
      settlement: 'completed'
    })
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
      {
        modelActions: (actions) => actions,

        resolveBatch: (value) => value
      },
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
        {
          signal: activeSignal,

          runMutation: async (write) => write()
        }
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
    const designs = createLocalDesignTools(
      [...createBasicApiActions(), createPreparedDesignAction()],
      session
    )
    const dispatch = vi.fn()
    const operations = createLocalOperationTools(
      [...createBasicApiActions(), createPreparedDesignAction()],
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
      .filter((sample) => sample.tool === AiDesignToolIds.EXECUTE_DESIGN)

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

it('delivers optional visual advice without retired approval operations', async () => {
  const owner = createLocalKnowledgeTools('current-observation-advice')

  try {
    const text = await owner.call(
      AiDesignToolIds.READ_KNOWLEDGE,
      {
        ids: [
          'design.architectural-illustration.materials.review',
          'design.architectural-illustration.contracts.operations'
        ],
        contexts: ['architectural-illustration']
      },
      signal()
    )

    expect(text).toContain('inspect_drawing')
    expect(text).not.toMatch(
      /bindChecks|review_drawing|define_design_criteria|recordBoundReview/
    )
    expect(text).toContain('execute_design')
  } finally {
    owner.dispose()
  }
})
