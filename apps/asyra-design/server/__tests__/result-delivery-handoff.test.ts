// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import captureSequence from '../../test-data/ai-drawing/fixtures/inspection-recovery-20261109.json'
import type { AiActionBatch } from '../../src/ai/action-batch-protocol'
import sharp from 'sharp'
import { createLocalReferenceTools } from '../local-reference-tools'
import { localToolContent } from '../local-operation-tools'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createAiInspectionAction } from '../../src/ai/inspection'
import fixture from '../../test-data/ai-drawing/fixtures/result-delivery-20261108.json'
const recorded = structuredClone(fixture)
const originalSelection = fixture.select.operations[1].arguments

recorded.select.operations = [
  {
    ...fixture.select.operations[1],
    arguments: {
      referenceImageIndexes: originalSelection.referenceImageIndexes,
      references: originalSelection.referenceDecisions.map(
        ({ referenceId }) => ({ referenceId, purpose: 'Massing' })
      )
    }
  }
] as never
import { createConversationResults } from '../../src/ai/conversation-results'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalOperationTools } from '../local-operation-tools'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

for (const op of recorded.import.operations) {
  for (const note of op.arguments.facts ?? []) {
    Reflect.deleteProperty(note, 'dependencies')
  }

  for (const note of op.arguments.calculations ?? []) {
    Reflect.deleteProperty(note, 'sourceFactIds')
  }
}

const setup = (
  references?: ReturnType<typeof createLocalReferenceTools>,
  capture?: Parameters<typeof createLocalOperationTools>[2]
) => {
  const context = createConversationResults(() => 1).open('recorded-delivery')
  let calls = 0
  const decisions = originalSelection.referenceDecisions
  const owner = createLocalOperationTools(
    [createAiToolContract(createAiInspectionAction())],
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    capture ??
      (async () => {
        throw Error('Unexpected canvas dispatch')
      }),
    {
      getNativeTools: () => host.definitions(),

      validateReferences: () =>
        decisions.map((decision, index) => ({
          referenceId: decision.referenceId,
          attachmentIndex: index,
          validation: { width: 100, height: 200 }
        }))
    }
  )
  const host = createLocalToolHost({
    requestId: 'recorded-result-delivery',
    signal: new AbortController().signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: LocalToolLibraryLimits.recipe,

    resultContext: async (command) => context.exchange(command),

    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('Unexpected library write')
      }
    },

    createGroups: () => [
      ...(references
        ? [
            {
              name: 'design_references',
              description: 'Reference images',
              owner: references
            }
          ]
        : []),
      {
        name: 'design_operations',
        description: 'Review',
        owner: {
          ...owner,

          call: async (...args: Parameters<typeof owner.call>) => {
            calls++

            return owner.call(...args)
          }
        }
      }
    ]
  })

  return {
    host,
    context,
    owner,

    calls: () => calls
  }
}

const referenceFixture = async () => {
  const pixels = await Promise.all(
    ['#123456', '#abcdef'].map((background) =>
      sharp({ create: { width: 8, height: 8, channels: 4, background } })
        .png()
        .toBuffer()
    )
  )
  let next = 0
  const add = vi.fn(() => next++)
  const download = vi.fn(
    async (url: unknown) =>
      new Response(pixels[String(url).includes('headout') ? 1 : 0], {
        headers: { 'content-type': 'image/png' }
      })
  )
  const references = createLocalReferenceTools(add, download)

  return { ...setup(references), references, add, download }
}

it('displays cached images after the recorded import was status-only, without reacquisition', async () => {
  const { host, add, download } = await referenceFixture()

  try {
    const { response: _response, ...input } = recorded.import
    const initial = await host.invoke({
      name: 'design_operations.execute_design',
      input
    })

    expect(JSON.parse(initial.text).toolOutcome.status, initial.text).toBe(
      'success'
    )
    expect(
      (await localToolContent(initial.text, initial.media)).filter(
        (item) => item.type === 'inputImage'
      )
    ).toHaveLength(0)
    for (let repeat = 0; repeat < 2; repeat++) {
      const shown = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [input.operations[0]],
          delivery: { fields: { images: { step: 'images', path: '' } } }
        }
      })

      expect(JSON.parse(shown.text).toolOutcome.status, shown.text).toBe(
        'success'
      )
      const content = await localToolContent(shown.text, shown.media)

      expect(content.filter((item) => item.type === 'inputImage')).toHaveLength(
        2
      )
      expect(JSON.stringify(content[0])).not.toContain('base64,')
    }

    expect(download).toHaveBeenCalledTimes(2)
    expect(add).toHaveBeenCalledTimes(2)
  } finally {
    await host.dispose()
  }
})

it('selects the recorded batch reference metadata through static admission without implicit pixels', async () => {
  const { host } = await referenceFixture()

  try {
    const reply = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [recorded.import.operations[0]],
        delivery: {
          fields: { references: { step: 'images', path: '/references' } }
        }
      }
    })
    const value = JSON.parse(reply.text)

    expect(value.toolOutcome.status, reply.text).toBe('success')
    expect(value.fields.references).toHaveLength(2)
    expect(
      (await localToolContent(reply.text, reply.media)).filter(
        (item) => item.type === 'inputImage'
      )
    ).toHaveLength(0)
  } finally {
    await host.dispose()
  }
})

it('uses the same reference envelope for singular input and rejects request-media retention before acquisition', async () => {
  const { host, references, download } = await referenceFixture()

  try {
    const candidates = recorded.import.operations[0].arguments.references

    if (!candidates) {
      throw Error('Missing recorded images')
    }

    const args = candidates[0]
    const reply = JSON.parse(
      await references.call(
        'import_reference_image',
        args,
        new AbortController().signal
      )
    )

    expect(reply.references).toHaveLength(1)
    expect(reply.actionResults).toHaveLength(1)
    const rejected = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          {
            id: 'image',
            name: 'design_references.import_reference_image',
            arguments: args
          }
        ],
        retain: { oldHandle: { step: 'image', path: '/references' } }
      }
    })

    expect(JSON.parse(rejected.text).toolOutcome.status).not.toBe('success')
    expect(download).toHaveBeenCalledOnce()
  } finally {
    await host.dispose()
  }
})

it.each(['output', 'response'] as const)(
  'rejects superseded %s before the recorded reference work executes',
  async (control) => {
    const { host, calls } = setup()

    try {
      const { output, ...input } = recorded.select
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...input,
          [control]: control === 'output' ? output : 'full'
        }
      })

      expect(JSON.parse(reply.text).toolOutcome.status).not.toBe('success')
      expect(JSON.parse(reply.text).message).toContain(control)
      expect(calls()).toBe(0)
    } finally {
      await host.dispose()
    }
  }
)

it.each(['selected', 'status'] as const)(
  'saves the recorded reference choices with independent %s delivery',
  async (mode) => {
    const { host, context } = setup()

    try {
      const { output: _output, ...input } = recorded.select
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...input,
          retain: {
            referenceNotes: {
              step: 'selectrefs',
              source: 'input',
              path: '/references'
            }
          },
          delivery:
            mode === 'status'
              ? 'status'
              : {
                  fields: {
                    choices: { step: 'selectrefs', path: '/references' }
                  }
                }
        }
      })
      const value = JSON.parse(reply.text)

      expect(value.toolOutcome.status, reply.text).toBe('success')
      const saved = context.exchange({
        read: { choices: { name: 'referenceNotes', path: '' } }
      }).choices

      expect(Array.isArray(saved) && saved.length).toBe(2)
      expect(value.saved.map(({ name }: { name: string }) => name)).toEqual([
        'referenceNotes'
      ])
      if (mode === 'selected') {
        expect(value.fields.choices).toHaveLength(2)
        expect(value.fields.choices[0]).toHaveProperty('purpose', 'Massing')
        expect(JSON.stringify(saved)).not.toContain('requestId')
      } else {
        expect(value.fields).toBeUndefined()
      }
    } finally {
      await host.dispose()
    }
  }
)

it('redisplays cached references after cancelled selection or failed media encoding', async () => {
  const { host, references, download, add } = await referenceFixture()

  try {
    const args = recorded.import.operations[0].arguments
    const first = await references.call(
      'import_reference_image',
      args,
      new AbortController().signal
    )
    const broken = JSON.parse(first)

    broken.actionResults[0].result.image.dataUrl = 'invalid'
    await expect(localToolContent(JSON.stringify(broken))).rejects.toThrow(
      'Invalid drawing snapshot'
    )
    const controller = new AbortController()

    controller.abort()
    await expect(
      references.call('import_reference_image', args, controller.signal)
    ).rejects.toThrow()
    const repeated = await references.call(
      'import_reference_image',
      args,
      new AbortController().signal
    )

    expect(
      (await localToolContent(repeated)).filter(
        (item) => item.type === 'inputImage'
      )
    ).toHaveLength(2)
    expect(download).toHaveBeenCalledTimes(2)
    expect(add).toHaveBeenCalledTimes(2)
  } finally {
    await host.dispose()
  }
})

it.each(['', '/referenceImageIndexes/0', '/referenceImageIndexes'])(
  'rejects request-bearing reference retention at %s before dispatch',
  async (path) => {
    const { host, calls, context } = setup()

    try {
      const { output: _output, ...input } = recorded.select
      const result = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...input,
          retain: { leaked: { step: 'selectrefs', path } },
          delivery: 'status'
        }
      })

      expect(JSON.parse(result.text).toolOutcome.status, result.text).not.toBe(
        'success'
      )
      expect(calls()).toBe(0)
      expect(context.names()).toEqual([])
    } finally {
      await host.dispose()
    }
  }
)

it('publishes portable authored reference notes separately from request indexes', async () => {
  const { host, owner } = setup()

  try {
    const output = JSON.parse(
      await owner.call(
        'describe_design_apis',
        {
          names: ['design_operations.select_design_references'],
          view: 'usage'
        },
        new AbortController().signal
      )
    )
    const guide = output.tools[0].usageGuide

    expect(guide.retention.wholeResultAllowed).toBe(false)
    expect(guide.retention.forbiddenResultFields).toContain(
      '/referenceImageIndexes'
    )
    expect(guide.retention.guaranteedResultFields).toContain('/references')
    expect(guide.results.guaranteedFields).toContain('/references')
  } finally {
    await host.dispose()
  }
})

it('recovers the omitted recorded overview through the host without recapturing either image', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#123456' }
  })
    .png()
    .toBuffer()
  const capture = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: {
        available: true,
        elementId: (action.arguments as { elementId: string }).elementId,
        image: {
          dataUrl: 'data:image/png;base64,' + bytes.toString('base64'),
          width: 8,
          height: 8
        }
      }
    }))
  }))
  const { host, owner } = setup(undefined, capture)

  try {
    const discovery = JSON.parse(
      await owner.call(
        'describe_design_apis',
        { query: 'display existing inspection image', view: 'usage' },
        new AbortController().signal
      )
    )

    expect(discovery.tools[0].name).toBe('read_design_inspections')
    const first = await host.invoke({
      name: 'design_operations.execute_design',
      input: captureSequence
    })

    expect(JSON.parse(first.text).toolOutcome.status, first.text).toBe(
      'success'
    )
    expect(first.media).toHaveLength(1)
    const recovered = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          {
            name: 'design_operations.read_design_inspections',
            arguments: { elementId: 'workspace', view: 'overview' }
          }
        ]
      }
    })
    const value = JSON.parse(recovered.text).execution.value

    expect(value.captureState, recovered.text).toBe('saved-snapshot')
    expect(value.captures[0]).toMatchObject({
      elementId: 'workspace',
      view: 'overview'
    })
    expect(
      (await localToolContent(recovered.text, recovered.media)).filter(
        (item) => item.type === 'inputImage'
      )
    ).toHaveLength(1)
    expect(capture).toHaveBeenCalledTimes(2)
    const id = value.actionResults[0].result.inspectionId
    const repeated = await host.invoke({
      name: 'design_operations.read_design_inspections',
      input: { inspectionIds: [id] }
    })

    expect(JSON.parse(repeated.text).actionResults[0].result.inspectionId).toBe(
      id
    )
    expect(capture).toHaveBeenCalledTimes(2)
    const portable = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          {
            id: 'savedView',
            name: 'design_operations.read_design_inspections',
            arguments: { inspectionIds: [id] }
          }
        ],
        retain: {
          captureTarget: { step: 'savedView', path: '/captures/0/elementId' }
        }
      }
    })

    expect(JSON.parse(portable.text).saved[0]).toMatchObject({
      name: 'captureTarget',
      type: 'string'
    })
    expect(capture).toHaveBeenCalledTimes(2)
  } finally {
    await host.dispose()
  }
})

it.each(['inspect_drawing', 'read_design_inspections'])(
  'rejects saving request-owned capture identities before %s executes',
  async (name) => {
    const capture = vi.fn(async () => {
      throw Error('No operation should run')
    })
    const { host } = setup(undefined, capture)

    try {
      const result = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            {
              id: 'capture',
              name: 'design_operations.' + name,
              arguments:
                name === 'inspect_drawing'
                  ? { arguments: { elementId: 'workspace' } }
                  : { elementId: 'workspace', view: 'overview' }
            }
          ],
          retain: {
            oldImage: {
              step: 'capture',
              path: '/actionResults/0/result/inspectionId'
            }
          }
        }
      })

      expect(result.success).toBe(false)
      expect(result.text).toContain('Nonportable result selection')
      expect(JSON.parse(result.text).toolOutcome.settlement).toBe('not-started')
      expect(capture).not.toHaveBeenCalled()
    } finally {
      await host.dispose()
    }
  }
)
