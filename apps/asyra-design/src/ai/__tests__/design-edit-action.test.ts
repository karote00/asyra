import { expect, it, vi } from 'vitest'
import type { AiMutationExecutor } from '@asyra/ai-agent-runtime'
vi.mock('../../common-apis/design-edit', () => ({ editDesignElement: vi.fn() }))
import { createDesignEditAction } from '../design-edit-action'
import { observeAiAction } from '../runtime-input'
import { DEFAULT_TEXT_DATA, TEXT_PROPERTY_SCHEMA } from '@asyra/preset'
import { operationInputIssue } from '../tool-schema'

it('rejects an empty property edit before dispatch through the common boundary', async () => {
  const edit = vi.fn()
  const action = observeAiAction(createDesignEditAction(edit))
  await expect(
    action.execute({ elementId: 'target', properties: {} }, {
      signal: new AbortController().signal
    } as never)
  ).rejects.toMatchObject({
    stage: 'input',
    message: expect.stringContaining('too few properties')
  })
  expect(edit).not.toHaveBeenCalled()
})
it('forwards targeted edits and rejects an already cancelled operation', async () => {
  const mutationCalls = vi.fn()
  const runMutation: AiMutationExecutor = async (mutate) => {
    mutationCalls()
    return mutate()
  }
  const edit = vi.fn(() => ({
    status: 'complete',
    compositionId: 'a',
    appliedElementIds: ['a']
  }))
  const action = createDesignEditAction(edit)
  const controller = new AbortController()
  await action.execute({ elementId: 'a', properties: { text: 'Updated' } }, {
    signal: controller.signal,
    runMutation
  } as never)
  expect(mutationCalls).toHaveBeenCalledOnce()
  expect(edit).toHaveBeenCalledExactlyOnceWith({
    elementId: 'a',
    properties: { text: 'Updated' }
  })
  controller.abort()
  await expect(
    action.execute({ elementId: 'a', name: 'Title' }, {
      signal: controller.signal
    } as never)
  ).rejects.toThrow('cancelled')
  expect(edit).toHaveBeenCalledTimes(1)
})

it('delivers every typography value constraint from the property owner, including valid boundaries', () => {
  const samples: Record<string, unknown[]> = {
    textSizing: ['auto-width', 'auto-height', 'fixed', 'other', null],
    text: ['', 'Literal text', 'x'.repeat(100000), 'x'.repeat(100001), 1],
    fontFamily: [
      'sans-serif',
      '  Serif  ',
      ' ',
      '\t',
      'x'.repeat(128),
      'x'.repeat(129),
      false
    ],
    fontSize: [Number.MIN_VALUE, 16, 4096, 0, -1, 4096.01, Infinity, NaN, '16'],
    fontWeight: ['normal', 'bold', 'heavy', 700],
    fontStyle: ['normal', 'italic', 'oblique', null],
    textAlign: ['left', 'center', 'right', 'justify', null],
    lineHeight: [Number.MIN_VALUE, 20, 8192, 0, 8193, Infinity, '20'],
    letterSpacing: [-100, -1, 0, 100, -100.01, 100.01, Infinity, '0']
  }
  expect(Object.keys(samples).sort()).toEqual(
    Object.keys(DEFAULT_TEXT_DATA).sort()
  )
  const schema = createDesignEditAction().inputSchema
  for (const field of TEXT_PROPERTY_SCHEMA.fields) {
    expect(samples[field.key], field.key).toBeDefined()
    if (!field.validate) {
      throw new Error(`Missing ${field.key} validator`)
    }
    for (const value of [field.defaultValue, ...samples[field.key]]) {
      const accepted = !operationInputIssue(
        { elementId: 'text', properties: { [field.key]: value } },
        schema
      )
      expect(accepted, `${field.key}: ${String(value).slice(0, 40)}`).toBe(
        field.validate(value)
      )
    }
  }
})

it('edits canonical native text with truthful no-op, validation, history and reload receipts', async () => {
  const { default: core } = await import('../../contexts')
  const { default: factory } = await import('@asyra/factory')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { createAiTransactionRunner } = await import('../transaction')
  const { editDesignElement } = await vi.importActual<
    typeof import('../../common-apis/design-edit')
  >('../../common-apis/design-edit')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
    ]
  })
  const { initText } = await import('../../init/capabilities/init-text')
  initText(core)
  const empty = {
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
  }
  await core.load(empty)
  const id = core.createElementInParent(
    {
      type: 'text',
      name: 'Label',
      text: 'Before',
      x: 0,
      y: 0,
      width: 100,
      height: 30
    },
    'workspace'
  )
  const before = await core.save()
  factory.transact.reset()
  const action = observeAiAction(createDesignEditAction(editDesignElement))
  const signal = new AbortController().signal
  const runner = createAiTransactionRunner()
  const call = (input: Parameters<typeof editDesignElement>[0]) =>
    runner.run('Edit text', (runMutation) =>
      action.execute(input, { signal, runMutation })
    )
  try {
    const input = {
      elementId: id,
      properties: {
        text: 'After',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: -1
      }
    }
    expect(await call(input)).toMatchObject({
      status: 'complete',
      compositionId: id,
      appliedElementIds: [id]
    })
    expect(
      core.getElementComputedData(id, [
        'text',
        'fontSize',
        'fontWeight',
        'letterSpacing'
      ])
    ).toMatchObject(input.properties)
    const saved = await core.save()
    expect(await call(input)).toMatchObject({
      status: 'no-change',
      appliedElementIds: []
    })
    expect(factory.getUndoHistoryDepth()).toBe(1)
    await expect(
      call({ elementId: id, properties: { fontWeight: 'heavy' } })
    ).rejects.toMatchObject({
      status: 'rolled-back',
      cause: { stage: 'input' }
    })
    await expect(call({ elementId: id, name: '   ' })).rejects.toMatchObject({
      status: 'rolled-back',
      cause: { stage: 'input' }
    })
    await expect(
      call({ elementId: 'absent', properties: { text: 'No target' } })
    ).rejects.toThrow()
    expect(await core.save()).toEqual(saved)
    await factory.undo()
    expect(await core.save()).toEqual(before)
    await factory.redo()
    expect(await core.save()).toEqual(saved)
    await core.load(saved)
    expect(
      core.getElementComputedData(id, [
        'text',
        'fontSize',
        'fontWeight',
        'letterSpacing'
      ])
    ).toMatchObject(input.properties)
    expect(await core.save()).toEqual(saved)
  } finally {
    await core.load(empty)
    factory.transact.reset()
  }
})
