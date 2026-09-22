import { describe, expect, it, vi } from 'vitest'
import { createLocalDesignTools } from '../local-design-tools'
import {
  createDesignPreparationSession,
  prepareDesign
} from '../design-preparation'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { AiActionNames } from '../../src/constants/ai-actions'
import type { PreparedDesign } from '../../src/ai/prepared-design'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'

const actions = [
  {
    name: AiActionNames.APPLY_PREPARED_DESIGN,
    description: 'Apply design',
    inputSchema: { type: 'object', properties: { design: {} } }
  }
]
const draft = () => ({
  name: 'Mobile journal',
  width: 360,
  height: 640,
  padding: 24,
  layout: 'column',
  gap: 16,
  children: [
    {
      key: 'heading',
      name: 'Heading',
      type: 'text',
      width: 312,
      height: 80,
      text: 'Keep exploring',
      fontSize: 32,
      lineHeight: 40
    }
  ]
})
const signal = () => new AbortController().signal
const request = (artifactId: string) => ({
  batchId: 'apply',
  actions: [
    {
      id: 'a',
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      arguments: { artifactId },
      summary: 'Create journal'
    }
  ]
})

describe('local semantic design tools', () => {
  it('advertises semantic preparation only when editable application exists', () => {
    expect(createLocalDesignTools([]).definitions).toEqual([])
    const tools = createLocalDesignTools(actions)
    expect(tools.definitions.map((t) => t.name)).toEqual(['prepare_design'])
    const schema = tools.modelActions(actions)[0].inputSchema
    expect(schema).toMatchObject({
      required: ['artifactId'],
      additionalProperties: false
    })
    expect(JSON.stringify(schema)).not.toContain('"design"')
  })
  it('returns compact findings and resolves the same immutable artifact without recomputing', async () => {
    const compile = vi.fn(prepareDesign),
      session = createDesignPreparationSession(compile)
    const tools = createLocalDesignTools(actions, session)
    const reply = await tools.call(
      'prepare_design',
      { draft: draft() },
      signal()
    )
    const receipt = JSON.parse(reply)
    expect(receipt).toMatchObject({ available: true, elementCount: 2 })
    expect(reply).not.toMatch(/descriptor|props|points|fontFamily/)
    const first = tools.resolveBatch(request(receipt.artifactId))
    const second = tools.resolveBatch(request(receipt.artifactId))
    const firstDesign = (
      first.actions[0].arguments as { design: PreparedDesign }
    ).design
    const secondDesign = (
      second.actions[0].arguments as { design: PreparedDesign }
    ).design
    expect(firstDesign).toBe(secondDesign)
    expect(compile).toHaveBeenCalledTimes(1)
    expect(firstDesign.entries[1].descriptor.text).toBe('Keep exploring')
  })
  it('rejects raw descriptors, cross-request artifacts and absent capabilities', async () => {
    const a = createLocalDesignTools(actions),
      b = createLocalDesignTools(actions)
    const receipt = JSON.parse(
      await a.call('prepare_design', { draft: draft() }, signal())
    )
    expect(() => b.resolveBatch(request(receipt.artifactId))).toThrow()
    expect(() =>
      createLocalDesignTools([]).resolveBatch(request(receipt.artifactId))
    ).toThrow()
    const raw = request(receipt.artifactId)
    Object.assign(raw.actions[0].arguments, { design: prepareDesign(draft()) })
    expect(() => a.resolveBatch(raw)).toThrow()
  })
  it('allows a meaningful correction after invalid input and bounds invalid attempts', async () => {
    const tools = createLocalDesignTools(actions)
    const bad = JSON.parse(
      await tools.call(
        'prepare_design',
        { draft: { ...draft(), width: -1 } },
        signal()
      )
    )
    expect(bad).toMatchObject({ available: false })
    expect(bad.message).toContain('width')
    expect(
      JSON.parse(
        await tools.call('prepare_design', { draft: draft() }, signal())
      )
    ).toMatchObject({ available: true })
    for (let i = 0; i < 6; i++)
      await tools.call('prepare_design', { draft: {} }, signal())
    expect(
      JSON.parse(
        await tools.call('prepare_design', { draft: draft() }, signal())
      )
    ).toMatchObject({ available: false, exhausted: true })
  })
  it('does not prepare after cancellation', async () => {
    const compile = vi.fn(prepareDesign),
      controller = new AbortController()
    controller.abort()
    await expect(
      createLocalDesignTools(
        actions,
        createDesignPreparationSession(compile)
      ).call('prepare_design', { draft: draft() }, controller.signal)
    ).rejects.toThrow()
    expect(compile).not.toHaveBeenCalled()
  })
  it('resolves dynamic operation references before execution and reviews the returned root', async () => {
    const tools = createLocalDesignTools(actions),
      images = createLocalImageTools({})
    const receipt = JSON.parse(
      await tools.call('prepare_design', { draft: draft() }, signal())
    )
    const execute = vi.fn(
      async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
        actionResults: [
          {
            actionId: batch.actions[0].id,
            actionName: batch.actions[0].name,
            result:
              batch.actions[0].name === AiActionNames.INSPECT_DRAWING
                ? { available: true }
                : { compositionId: 'actual-root' }
          }
        ],
        context: {}
      })
    )
    const operations = createLocalOperationTools(
      [
        ...actions,
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Review',
          inputSchema: {}
        }
      ],
      {
        modelActions: (a) => tools.modelActions(images.modelActions(a)),
        resolveBatch: (b) => tools.resolveBatch(images.resolveBatch(b))
      },
      execute
    )
    await operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      {
        arguments: { artifactId: receipt.artifactId },
        message: 'Create journal'
      },
      signal()
    )
    expect(execute).toHaveBeenCalledTimes(2)
    expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
      design: { version: 1, entries: expect.any(Array) }
    })
    expect(execute.mock.calls[1][0].actions[0].arguments).toEqual({
      elementId: 'actual-root'
    })
  })
})
