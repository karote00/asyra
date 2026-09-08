import { ExperimentInputReader } from '../../../storage/experiment-input'
// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createSyntheticExperimentDraft } from '../../../../samples/synthetic-experiment'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import * as importer from '../../../storage/trajectory-import'
import type { SimRuntime } from '../../../init/bootstrap'
import { TrajectoryImportPanel } from '../../imports/trajectory-import-panel'
import { ExperimentPanel } from '../experiment-panel'
import { ViewSource } from '../../shared/view-source'
import type { ExperimentInputs } from '../experiment-inputs'

const renders = vi.hoisted(() => ({ layout: 0, picker: 0, scopeRows: 0 }))

vi.mock('react/jsx-dev-runtime', async (original) => {
  const actual = await original<typeof import('react/jsx-dev-runtime')>()

  return {
    ...actual,
    jsxDEV: (...args: Parameters<typeof actual.jsxDEV>) => {
      const props = args[1] as { className?: string; 'aria-label'?: string }

      if (props?.className?.startsWith('experiment-panel ')) renders.layout++

      if (props?.className?.startsWith('experiment-picker ')) renders.picker++

      if (props?.['aria-label']?.endsWith(' analysis role')) renders.scopeRows++

      return actual.jsxDEV(...args)
    }
  }
})

let inputSource: ViewSource<ExperimentInputs> | undefined
let registered:
  | ViewSource<{ experiments: ReturnType<SimRuntime['getExperiments']> }>
  | undefined

function renderExperiment(input: ExperimentInputs) {
  const snapshot = {
    experiments: input.runtime.getExperiments(input.candidateId)
  }
  if (registered) registered.publish(snapshot)
  else registered = new ViewSource(snapshot)
  input.runtime.views = registered as unknown as SimRuntime['views']
  if (inputSource) inputSource.publish(input)
  else {
    inputSource = new ViewSource(input)

    root.render(createElement(ExperimentPanel, { inputs: inputSource }))
  }
}

let host: HTMLDivElement

let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  inputSource = undefined
  registered = undefined

  host = document.createElement('div')

  document.body.append(host)

  root = createRoot(host)
})

afterEach(async () => {
  await act(() => root.unmount())

  host.remove()

  vi.unstubAllGlobals()
})

const example = createSyntheticExample()

const draft = createSyntheticExperimentDraft(example)

const experiment = {
  id: 'study',
  candidateId: 'candidate',
  name: 'Study',
  definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } }
}

const runtime = {
  experimentInputs: new ExperimentInputReader(),
  features: {
    live: { subscribe: () => () => undefined, getRecords: () => emptyRecords }
  },
  getExperiments: vi.fn(() => [structuredClone(experiment)]),
  getMethodDescriptors: () => [
    { id: draft.method.id, version: draft.method.version }
  ]
} as unknown as SimRuntime

const emptyRecords: readonly never[] = Object.freeze([])

const button = (name: string) =>
  [...host.querySelectorAll('button')].find((node) => node.textContent === name)

it('preserves an unapplied experiment draft when the workcell changes', async () => {
  const onPlayback = vi.fn()

  const perform = vi.fn()

  const render = (revision: number) =>
    renderExperiment({
      runtime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision,
      perform,
      onPlayback,
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })

  await act(() => render(1))

  renders.layout = renders.picker = renders.scopeRows = 0

  const field = host.querySelector<HTMLInputElement>(
    '[aria-label="Minimum clearance (mm)"]'
  )

  if (!field) throw new Error('Missing clearance field')

  await act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set

    if (!setter) throw new Error('Missing value setter')

    setter.call(field, '75')

    field.dispatchEvent(new Event('input', { bubbles: true }))
  })

  expect(field.value).toBe('75')

  expect(renders).toEqual({ layout: 0, picker: 0, scopeRows: 0 })

  await act(() => render(2))

  expect(field.value).toBe('75')
})

it('exposes a new experiment draft even when a saved experiment exists', async () => {
  await act(() =>
    renderExperiment({
      runtime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: vi.fn(),
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )

  expect(button('New experiment')).toBeDefined()

  expect(
    host.querySelector<HTMLInputElement>(
      '[aria-label="Global interval budget"]'
    )?.max
  ).toBe('1000000')

  expect(
    host.querySelector<HTMLInputElement>('[aria-label="Wall-time budget (ms)"]')
      ?.min
  ).toBe('100')

  expect(
    host.querySelector<HTMLInputElement>('[aria-label="Wall-time budget (ms)"]')
      ?.max
  ).toBe('120000')

  await act(() => button('New experiment')?.click())

  expect(button('Create experiment')).toBeDefined()
})

it('draft-only changes do not recapture canonical experiments', async () => {
  const onPlayback = vi.fn()

  await act(() =>
    renderExperiment({
      runtime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: vi.fn(),
      onPlayback,
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )

  vi.mocked(runtime.getExperiments).mockClear()

  await act(() => button('New experiment')?.click())

  expect(button('Create experiment')).toBeDefined()

  expect(runtime.getExperiments).not.toHaveBeenCalled()
})

it('shows mapped canonical columns before preview and invalidates acceptance after a mapping change', async () => {
  await act(() =>
    root.render(
      createElement(TrajectoryImportPanel, {
        workcell: example.workcell,
        trajectory: example.trajectory,
        onAccept: vi.fn()
      })
    )
  )

  const timeColumn = host.querySelector('select')

  if (!timeColumn) throw new Error('Missing CSV column selector')

  expect(timeColumn.value).toBe('time')

  await act(() => button('Preview trajectory')?.click())

  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).not.toBeNull()

  const unit = host.querySelectorAll('select')[1]

  await act(() => {
    unit.value = 'ms'

    unit.dispatchEvent(new Event('change', { bubbles: true }))
  })

  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
})

it('initializes imported source text from the same canonical revision during save and replay', async () => {
  let current = structuredClone(experiment)
  const replayRuntime = { ...runtime, getExperiments: () => [current] }
  const inputs: ExperimentInputs = {
    runtime: replayRuntime,
    candidateId: 'candidate',
    workcell: example.workcell,
    revision: 1,
    perform: vi.fn(),
    onPlayback: vi.fn(),
    runs: [],
    retainedIds: new Set<string>(),
    onRun: vi.fn(),
    onOpenRuns: vi.fn(),
    onVisualPreview: vi.fn(),
    isCurrent: () => true,
    visualImportActive: true
  }
  const lastTime = () =>
    host
      .querySelector<HTMLTextAreaElement>(
        '[aria-label="Trajectory source data"]'
      )
      ?.value.split('\n')
      .at(-1)
      ?.split(',')[0]
  await act(() => renderExperiment(inputs))
  expect(lastTime()).toBe('8')
  current = structuredClone(experiment)
  current.definition.revision = 2
  current.definition.trajectory.keyframes =
    current.definition.trajectory.keyframes.map((frame, index) => ({
      ...frame,
      time: index
    }))
  await act(() => renderExperiment({ ...inputs, revision: 2 }))
  expect(lastTime()).toBe('2')
  current = structuredClone(experiment)
  await act(() => renderExperiment({ ...inputs, revision: 3 }))
  expect(lastTime()).toBe('8')
})

it('applies the validated trajectory after a completed field edit without duplicate submission', async () => {
  let finishSave: () => void = () => undefined
  let count = 0
  const updateExperiment = vi.fn(() => {
    if (++count === 1) return Promise.resolve()
    return new Promise<void>((resolve) => {
      finishSave = resolve
    })
  })
  const savingRuntime = {
    ...runtime,
    features: { ...runtime.features, edit: { updateExperiment } }
  } as unknown as SimRuntime
  const perform = vi.fn(
    async (action: (assertCurrent: () => void) => Promise<unknown>) => {
      await action(() => undefined)
    }
  )
  await act(() =>
    renderExperiment({
      runtime: savingRuntime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform,
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )
  const field = host.querySelector<HTMLInputElement>(
    '[aria-label="Minimum clearance (mm)"]'
  )
  if (!field) throw new Error('Missing clearance input')
  await act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set?.call(field, '30')
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  })
  const input = host.querySelector(
    'textarea[aria-label="Trajectory source data"]'
  ) as HTMLTextAreaElement
  await act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )?.set?.call(input, input.value.replace('\n8,', '\n9,'))
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() => button('Preview trajectory')?.click())
  expect(updateExperiment).toHaveBeenCalledOnce()
  await act(() =>
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(button('Apply')).toBeUndefined()
  expect(button('Save experiment')).toBeUndefined()
  await act(() =>
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledTimes(2)
  await act(async () => finishSave())
  expect(perform).toHaveBeenCalledTimes(2)
  expect(updateExperiment).toHaveBeenCalledTimes(2)
  const saved = updateExperiment.mock.calls[1] as unknown as [
    string,
    number,
    typeof draft
  ]
  expect(saved[0]).toBe('study')
  expect(saved[2].trajectory.keyframes.at(-1)?.time).toBe(9)
  expect(saved[2].interval).toEqual([0, 8])
  expect(saved[2].rule.minimumClearance).toBe(0.03)
})

it('commits a completed valid field edit without Save and leaves intermediate text transient', async () => {
  const updateExperiment = vi.fn(async () => undefined)
  const editingRuntime = {
    ...runtime,
    features: { ...runtime.features, edit: { updateExperiment } }
  } as unknown as SimRuntime
  await act(() =>
    renderExperiment({
      runtime: editingRuntime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: async (action) => {
        await action(() => undefined)
      },
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )
  const field = host.querySelector<HTMLInputElement>(
    '[aria-label="Minimum clearance (mm)"]'
  )
  if (!field) throw new Error('Missing clearance field')
  const input = async (text: string) =>
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set?.call(field, text)
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
  await input('3')
  await input('35')
  expect(updateExperiment).not.toHaveBeenCalled()
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledOnce()
  expect(updateExperiment.mock.calls[0]).toEqual([
    'study',
    1,
    expect.objectContaining({
      rule: expect.objectContaining({ minimumClearance: 0.035 })
    })
  ])
  expect(button('Save experiment')).toBeUndefined()
  await input('-1')
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledOnce()
  await input('')
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  const budget = host.querySelector<HTMLInputElement>(
    '[aria-label="Wall-time budget (ms)"]'
  )
  if (!budget) throw new Error('Missing budget')
  await act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set?.call(budget, '60000')
    budget.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() =>
    budget.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledTimes(2)
  expect(updateExperiment.mock.calls[1]).toEqual([
    'study',
    1,
    expect.objectContaining({
      rule: expect.objectContaining({ minimumClearance: 0.035 })
    })
  ])
})

it('serializes completed edits arriving during a Feature action against the next canonical revision', async () => {
  let current = structuredClone(experiment)
  let finish: () => void = () => undefined
  let finishSecond: () => void = () => undefined
  const updateExperiment = vi.fn(
    async (_id: string, revision: number, next: typeof draft) => {
      if (revision === 1)
        await new Promise<void>((resolve) => {
          finish = resolve
        })
      if (revision === 2)
        await new Promise<void>((resolve) => {
          finishSecond = resolve
        })
      current = {
        ...current,
        definition: {
          ...next,
          revision: revision + 1,
          rule: { ...next.rule, revision: revision + 1 }
        }
      }
      if (inputSource)
        inputSource.publish({
          ...inputSource.getSnapshot(),
          revision: revision + 1
        })
    }
  )
  const editingRuntime = {
    ...runtime,
    getExperiments: () => [current],
    features: { ...runtime.features, edit: { updateExperiment } }
  } as unknown as SimRuntime
  await act(() =>
    renderExperiment({
      runtime: editingRuntime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: async (action) => {
        await action(() => undefined)
      },
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )
  const field = host.querySelector<HTMLInputElement>(
    '[aria-label="Minimum clearance (mm)"]'
  )
  if (!field) throw new Error('Missing clearance')
  const edit = async (value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set?.call(field, value)
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
  }
  await edit('30')
  await edit('40')
  expect(updateExperiment).toHaveBeenCalledOnce()
  await act(async () => finish())
  expect(updateExperiment).toHaveBeenCalledTimes(2)
  expect(
    updateExperiment.mock.calls.map((call) => [
      call[1],
      call[2].rule.minimumClearance
    ])
  ).toEqual([
    [1, 0.03],
    [2, 0.04]
  ])
  expect(field.value).toBe('40')
  await act(async () => finishSecond())
  expect(field.value).toBe('40')
})

it('reuses an edited import source across a non-trajectory canonical revision without parsing again', async () => {
  let current = structuredClone(experiment)
  const inputs: ExperimentInputs = {
    runtime: { ...runtime, getExperiments: () => [current] },
    candidateId: 'candidate',
    workcell: example.workcell,
    revision: 1,
    perform: vi.fn(),
    onPlayback: vi.fn(),
    runs: [],
    retainedIds: new Set<string>(),
    onRun: vi.fn(),
    onOpenRuns: vi.fn(),
    onVisualPreview: vi.fn(),
    isCurrent: () => true,
    visualImportActive: true
  }
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  try {
    await act(() => renderExperiment(inputs))
    const source = host.querySelector<HTMLTextAreaElement>(
      '[aria-label="Trajectory source data"]'
    )
    if (!source) throw new Error('Missing source')
    const text = source.value.replace('\n8,', '\n9,')
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value'
      )?.set?.call(source, text)
      source.dispatchEvent(new Event('input', { bubbles: true }))
    })
    parse.mockClear()
    current = structuredClone(current)
    current.definition.revision++
    current.definition.rule.minimumClearance = 0.035
    await act(() => renderExperiment({ ...inputs, revision: 2 }))
    expect(host.querySelector('[aria-label="Trajectory source data"]')).toBe(
      source
    )
    expect(source.value).toBe(text)
    expect(parse).not.toHaveBeenCalled()
  } finally {
    parse.mockRestore()
  }
})

it('keeps preview playback across unrelated publications and invalidates it for a changed workcell', async () => {
  const onPlayback = vi.fn()
  const input: ExperimentInputs = {
    runtime,
    candidateId: 'candidate',
    workcell: example.workcell,
    revision: 1,
    perform: vi.fn(),
    onPlayback,
    runs: [],
    retainedIds: new Set<string>(),
    onRun: vi.fn(),
    onOpenRuns: vi.fn(),
    onVisualPreview: vi.fn(),
    isCurrent: () => true,
    visualImportActive: true
  }
  await act(() => renderExperiment(input))
  onPlayback.mockClear()
  const source = inputSource
  if (!source) throw new Error('Missing input source')
  await act(() => source.publish({ ...input, revision: 2 }))
  expect(onPlayback).not.toHaveBeenCalled()
  await act(() =>
    source.publish({
      ...input,
      revision: 3,
      workcell: structuredClone(example.workcell)
    })
  )
  expect(onPlayback).toHaveBeenCalledWith(null)
})

it('does not acknowledge a failed edit when the shell reports and consumes the Feature error', async () => {
  const updateExperiment = vi.fn(async () => {
    throw new Error('Write rejected')
  })
  await act(() =>
    renderExperiment({
      runtime: {
        ...runtime,
        features: { ...runtime.features, edit: { updateExperiment } }
      } as unknown as SimRuntime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: async (action) => {
        try {
          await action(() => undefined)
        } catch {
          /* Shell presents the error. */
        }
      },
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )
  const field = host.querySelector<HTMLInputElement>(
    '[aria-label="Minimum clearance (mm)"]'
  )
  if (!field) throw new Error('Missing clearance')
  await act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set?.call(field, '25')
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledOnce()
  expect(host.textContent).toContain('Experiment edit was not committed')
  expect(field.value).toBe('25')
  expect(button('Run preflight')?.disabled).toBe(true)
})

it('preserves the authored analysis interval when an inline trajectory edit completes', async () => {
  const updateExperiment = vi.fn(async () => undefined)
  const custom = {
    ...experiment,
    definition: {
      ...experiment.definition,
      interval: [2, 5] as [number, number]
    }
  }
  await act(() =>
    renderExperiment({
      runtime: {
        ...runtime,
        getExperiments: () => [custom],
        features: { ...runtime.features, edit: { updateExperiment } }
      } as unknown as SimRuntime,
      candidateId: 'candidate',
      workcell: example.workcell,
      revision: 1,
      perform: async (action) => {
        await action(() => undefined)
      },
      onPlayback: vi.fn(),
      runs: [],
      retainedIds: new Set<string>(),
      onRun: vi.fn(),
      onOpenRuns: vi.fn(),
      onVisualPreview: vi.fn(),
      isCurrent: () => true,
      visualImportActive: true
    })
  )
  const field = host.querySelector<HTMLTextAreaElement>(
    '[aria-label="Trajectory source data"]'
  )
  if (!field) throw new Error('Missing source')
  await act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value'
    )?.set?.call(field, field.value.replace('\n8,', '\n9,'))
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(updateExperiment).toHaveBeenCalledWith(
    'study',
    1,
    expect.objectContaining({ interval: [2, 5] })
  )
})
