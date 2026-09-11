// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import * as importer from '../../../storage/trajectory-import'
import * as sourceDomain from '../../../domain/trajectory-source'
import { trajectoryToCsv } from '../../experiments/experiment-draft'
import { TrajectoryImportPanel } from '../trajectory-import-panel'

let host: HTMLDivElement

let root: Root

const accepted = vi.fn()

function present<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing test input')
  return value
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  accepted.mockReset()

  host = document.createElement('div')

  document.body.append(host)

  root = createRoot(host)

  const example = createSyntheticExample()

  await act(() =>
    root.render(
      createElement(TrajectoryImportPanel, {
        workcell: example.workcell,
        trajectory: example.trajectory,
        onAccept: accepted
      })
    )
  )
})

afterEach(async () => {
  await act(() => root.unmount())

  host.remove()

  vi.unstubAllGlobals()
})

const button = (name: string) =>
  [...host.querySelectorAll('button')].find((node) => node.textContent === name)

async function choose(file: File, kind = 'CSV') {
  const input = host.querySelector<HTMLInputElement>(
    `[aria-label="Load trajectory ${kind}"]`
  )

  if (!input) throw new Error('Missing trajectory input')

  Object.defineProperty(input, 'files', { configurable: true, value: [file] })

  await act(async () =>
    input.dispatchEvent(new Event('change', { bubbles: true }))
  )
}

async function preview() {
  await act(() => button('Preview trajectory')?.click())

  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).not.toBeNull()
}

it.each([
  ['CSV', 8 * 1024 * 1024],
  ['JSON', 1024 * 1024]
] as const)(
  'rejects oversized %s before reading and invalidates prior acceptance',
  async (kind, limit) => {
    await preview()

    const file = new File([], 'oversized')

    const read = vi.fn(async () => '')

    Object.defineProperty(file, 'size', { value: limit + 1 })

    file.text = read

    await choose(file, kind)

    expect(read).not.toHaveBeenCalled()

    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()

    expect(host.textContent).toContain(`${limit / 1024 / 1024} MiB`)

    expect(accepted).not.toHaveBeenCalled()
  }
)

it('admits CSV files up to 8 MiB without auto-accepting', async () => {
  const file = new File([], 'valid.csv')

  const read = vi.fn(async () => 'time\n0')

  Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 })

  file.text = read

  await choose(file)

  expect(read).toHaveBeenCalledOnce()

  expect(host.querySelector('textarea')?.value).toBe('time\n0')

  expect(accepted).not.toHaveBeenCalled()
})

it('cannot preview stale text while reading and preserves the next selection against late bytes', async () => {
  await preview()

  let resolve: (value: string) => void = () => undefined

  const pending = new File([], 'pending.csv')

  pending.text = vi.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done
      })
  )

  await choose(pending)

  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()

  expect(button('Preview trajectory')?.disabled).toBe(true)

  const newer = new File([], 'newer.csv')

  newer.text = vi.fn(async () => 'time\n1')

  await choose(newer)

  await act(async () => resolve('time\n99'))

  expect(host.querySelector('textarea')?.value).toBe('time\n1')

  expect(button('Preview trajectory')?.disabled).toBe(false)
})

it('invalidates prior acceptance on read failure and exposes the failure', async () => {
  await preview()

  const file = new File([], 'unreadable.csv')

  file.text = vi.fn(async () => {
    throw new Error('File read failed')
  })

  await choose(file)

  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()

  expect(host.textContent).toContain('File read failed')

  expect(button('Preview trajectory')?.disabled).toBe(false)

  expect(accepted).not.toHaveBeenCalled()
})

async function select(label: string, value: string) {
  const input = [...host.querySelectorAll('select')].find(
    (node) =>
      node.getAttribute('aria-label') === label ||
      node.closest('label')?.textContent?.trim().startsWith(label)
  )
  if (!input) throw new Error(`Missing select ${label}`)
  await act(() => {
    input.value = value
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

async function externalCsv() {
  const example = createSyntheticExample()
  const file = new File([], 'external.csv')
  file.text = vi.fn(async () =>
    trajectoryToCsv(example.workcell, example.trajectory)
  )
  await choose(file)
  return example
}

it('blocks external CSV with canonical headers until every source unit is declared', async () => {
  const example = await externalCsv()
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  expect(host.textContent).toContain('explicit supported time unit')
  await select('Time unit', 's')
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  for (const body of example.workcell.bodies) {
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'rad')
  }
  await preview()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
      ?.textContent
  ).toContain('rad')
  await act(() => button('Import trajectory')?.click())
  expect(accepted).toHaveBeenCalledOnce()
  expect(accepted.mock.calls[0][0].trajectory).toEqual(example.trajectory)
})

it('reuses source parsing and the exact validated preview on repeated review and acceptance', async () => {
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  const normalize = vi.spyOn(sourceDomain, 'normalizeTrajectorySource')
  const inspect = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    const example = await externalCsv()
    expect(parse).not.toHaveBeenCalled()
    expect(normalize).not.toHaveBeenCalled()
    await select('Time unit', 's')
    for (const body of example.workcell.bodies) {
      if (body.joint.kind !== 'fixed')
        await select(`${body.name} CSV unit`, 'rad')
    }
    await preview()
    const result = inspect.mock.results.at(-1)?.value
    const work = normalize.mock.calls.length
    expect(work).toBe(example.trajectory.keyframes.length)
    await preview()
    await act(() => button('Import trajectory')?.click())
    expect(normalize).toHaveBeenCalledTimes(work)
    expect(parse).not.toHaveBeenCalled()
    expect(accepted.mock.calls[0][0]).toBe(result.value)
    await select('Time unit', 'ms')
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
    await preview()
    expect(normalize).toHaveBeenCalledTimes(work * 2)
    expect(parse).not.toHaveBeenCalled()
    expect(
      inspect.mock.results.at(-1)?.value.value.trajectory.keyframes.at(-1).time
    ).toBe(present(example.trajectory.keyframes.at(-1)).time / 1000)
  } finally {
    parse.mockRestore()
    normalize.mockRestore()
    inspect.mockRestore()
  }
})

it('preserves strict JSON declarations and displays source-to-canonical conversion', async () => {
  const example = createSyntheticExample()
  const joints = Object.fromEntries(
    example.workcell.bodies
      .filter((body) => body.joint.kind !== 'fixed')
      .map((body) => [body.id, 0])
  )
  const file = new File([], 'declared.json')
  file.text = vi.fn(async () =>
    JSON.stringify({
      format: 'sim-trajectory',
      version: 1,
      source: {
        version: 1,
        timeUnit: 'ms',
        jointUnits: Object.fromEntries(
          Object.keys(joints).map((id) => [id, 'deg'])
        ),
        keyframes: [{ time: 2500, joints }]
      }
    })
  )
  await choose(file, 'JSON')
  await preview()
  const review = host.querySelector(
    '[aria-label="Trajectory conversion preview"]'
  )
  expect(review?.textContent).toContain('2500 ms')
  expect(review?.textContent).toContain('2.5 s')
  expect(review?.textContent).toContain('0 deg')
  await act(() => button('Import trajectory')?.click())
  expect(accepted.mock.calls[0][0].sourceUnits.time).toBe('ms')
})

it('retires an existing preview and late file read when its workcell changes', async () => {
  await preview()
  const example = createSyntheticExample()
  const pending = new File([], 'pending.csv')
  let resolve: (value: string) => void = () => undefined
  pending.text = vi.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done
      })
  )
  await choose(pending)
  const before = present(host.querySelector('textarea')).value
  const workcell = structuredClone(example.workcell)
  const joint = present(
    workcell.bodies.find((body) => body.joint.kind !== 'fixed')
  )
  joint.joint.max -= 0.1
  await act(() =>
    root.render(
      createElement(TrajectoryImportPanel, {
        workcell,
        trajectory: example.trajectory,
        onAccept: accepted
      })
    )
  )
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  await act(async () => resolve('time\n99'))
  expect(present(host.querySelector('textarea')).value).toBe(before)
  expect(accepted).not.toHaveBeenCalled()
})

it('discards an import without acceptance or stale read delivery', async () => {
  await preview()
  expect(button('Discard preview')).toBeDefined()
  await act(() => button('Discard preview')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  expect(accepted).not.toHaveBeenCalled()
})

it('retires the old preview but retains known units after source edits', async () => {
  await preview()
  const input = present(host.querySelector('textarea'))
  const next = input.value.replace('\n0,', '\n1,')
  await act(() => {
    present(
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
        ?.set
    ).call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(input.value).toBe(next)
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  expect(button('Confirm displayed units')).toBeUndefined()
  await preview()
})

it('invalidates column mapping and current workcell previews without reparsing source', async () => {
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  try {
    await preview()
    await select('Time column', '')
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
    await select('Time column', 'time')
    await preview()
    const example = createSyntheticExample()
    const workcell = structuredClone(example.workcell)
    const joint = present(
      workcell.bodies.find((body) => body.joint.kind !== 'fixed')
    )
    joint.joint.max = 0.1
    await act(() =>
      root.render(
        createElement(TrajectoryImportPanel, {
          workcell,
          trajectory: example.trajectory,
          onAccept: accepted
        })
      )
    )
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
    await act(() => button('Preview trajectory')?.click())
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
    expect(host.textContent).toContain('out-of-limit')
    expect(parse).not.toHaveBeenCalled()
  } finally {
    parse.mockRestore()
  }
})

it('discard and unmount retire in-flight reads without late updates', async () => {
  let resolve: (text: string) => void = () => undefined
  const file = new File([], 'pending.csv')
  file.text = vi.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done
      })
  )
  const original = present(host.querySelector('textarea')).value
  await choose(file)
  await act(() => button('Discard preview')?.click())
  await act(async () => resolve('time\n99'))
  expect(present(host.querySelector('textarea')).value).toBe(original)
  await choose(file)
  await act(() => root.render(null))
  await act(async () => resolve('time\n100'))
  expect(host.textContent).toBe('')
  expect(accepted).not.toHaveBeenCalled()
})

async function editSource(text: string) {
  const input = present(host.querySelector('textarea'))
  await act(() => {
    present(
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
        ?.set
    ).call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it('retains declared units across numeric edits but recomputes and accepts only the current preview', async () => {
  const example = await externalCsv()
  await select('Time unit', 'ms')
  for (const body of example.workcell.bodies)
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'deg')
  await preview()
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  const inspect = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    const text = present(host.querySelector('textarea')).value.replace(
      '\n4,',
      '\n5,'
    )
    await editSource(text)
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
    expect(parse).toHaveBeenCalledOnce()
    expect(inspect).toHaveBeenCalledOnce()
    await preview()
    await preview()
    expect(inspect).toHaveBeenCalledOnce()
    expect(parse).toHaveBeenCalledOnce()
    const result = inspect.mock.results[0].value
    expect(result.value.trajectory.keyframes[1].time).toBe(0.005)
    await act(() => button('Import trajectory')?.click())
    expect(accepted.mock.calls[0][0]).toBe(result.value)
    await externalCsv()
    await act(() => button('Preview trajectory')?.click())
    expect(button('Import trajectory')).toBeUndefined()
    expect(
      host.querySelector('[aria-label="Trajectory conversion preview"]')
    ).toBeNull()
  } finally {
    parse.mockRestore()
    inspect.mockRestore()
  }
})

it('preserves known joint units when only the time unit is selected', async () => {
  await select('Time unit', 's')
  const text = present(host.querySelector('textarea')).value.replace(
    '\n4,',
    '\n5,'
  )
  await editSource(text)
  await act(() => button('Preview trajectory')?.click())
  expect(host.textContent).not.toContain('explicit supported time unit')
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).not.toBeNull()
  const example = createSyntheticExample()
  for (const body of example.workcell.bodies)
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'rad')
  await editSource(text.replace('\n5,', '\n6,'))
  await preview()
})

it('preserves unaffected declarations when one source column is removed', async () => {
  const example = await externalCsv()
  await select('Time unit', 's')
  for (const body of example.workcell.bodies)
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'rad')
  const text = present(host.querySelector('textarea')).value
  await editSource(
    text
      .split('\n')
      .map((line) => line.split(',').slice(0, -1).join(','))
      .join('\n')
  )
  const units = [
    ...host.querySelectorAll<HTMLSelectElement>(
      'select[aria-label$=" CSV unit"]'
    )
  ]
  expect(units.map((unit) => unit.value)).toEqual([
    'rad',
    'rad',
    'rad',
    'rad',
    'rad',
    ''
  ])
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
})

it('retains unaffected units when the workcell changes joint type', async () => {
  const example = await externalCsv()
  await select('Time unit', 's')
  for (const body of example.workcell.bodies)
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'rad')
  const workcell = structuredClone(example.workcell)
  const joint = present(
    workcell.bodies.find((body) => body.joint.kind === 'revolute')
  )
  joint.joint = { ...joint.joint, kind: 'prismatic' }
  await act(() =>
    root.render(
      createElement(TrajectoryImportPanel, {
        workcell,
        trajectory: example.trajectory,
        onAccept: accepted
      })
    )
  )
  expect(
    [
      ...host.querySelectorAll<HTMLSelectElement>(
        'select[aria-label$=" CSV unit"]'
      )
    ].map((unit) => unit.value)
  ).toEqual(['', 'rad', 'rad', 'rad', 'rad', 'rad'])
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
})

it('keeps known units during first edits without prompting for confirmation', async () => {
  const input = present(host.querySelector('textarea'))
  const original = input.value
  const units = () =>
    [...host.querySelectorAll<HTMLSelectElement>('select')]
      .filter(
        (node) =>
          node.closest('label')?.textContent?.trim().startsWith('Time unit') ||
          node.getAttribute('aria-label')?.endsWith(' CSV unit')
      )
      .map((node) => node.value)
  const initialUnits = units()
  await preview()
  await editSource(original.replace('\n8,', '\nㄉㄢ,'))
  expect(units()).toEqual(initialUnits)
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  expect(button('Confirm displayed units')).toBeUndefined()
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  await editSource(original.replace('\n8,', '\n9,'))
  expect(units()).toEqual(initialUnits)
  expect(button('Confirm displayed units')).toBeUndefined()
  await preview()
  await act(() =>
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(accepted.mock.calls[0][0].trajectory.keyframes.at(-1).time).toBe(9)
})

it('previews edits in known units without an extra confirmation step', async () => {
  const original = present(host.querySelector('textarea')).value
  await editSource(original.replace('\n8,', '\n9,'))
  expect(button('Confirm displayed units')).toBeUndefined()
  expect(host.querySelector('.unit-confirmation')).toBeNull()
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  await preview()
  expect(accepted).not.toHaveBeenCalled()
})

it('retains unit choices through an unfinished CSV quoted value', async () => {
  const original = present(host.querySelector('textarea')).value
  await editSource(original.replace('\n8,', '\n9,'))
  await editSource(original.replace('\n8,', '\n"8,'))
  expect(
    [
      ...host.querySelectorAll<HTMLSelectElement>(
        'select[aria-label$=" CSV unit"]'
      )
    ].map((unit) => unit.value)
  ).toEqual(Array(6).fill('rad'))
  await act(() => button('Preview trajectory')?.click())
  expect(button('Import trajectory')).toBeUndefined()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
  ).toBeNull()
  await editSource(original.replace('\n8,', '\n9,'))
  expect(button('Confirm displayed units')).toBeUndefined()
  await preview()
})

it('commits completed inline trajectory edits once without Apply and reuses their conversion review', async () => {
  const inspect = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    const field = present(host.querySelector('textarea'))
    await editSource(field.value.replace('\n8,', '\n9,'))
    expect(accepted).not.toHaveBeenCalled()
    await act(() =>
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    )
    expect(accepted).toHaveBeenCalledOnce()
    expect(accepted.mock.calls[0][0].trajectory.keyframes.at(-1).time).toBe(9)
    expect(button('Import trajectory')).toBeUndefined()
    const result = inspect.mock.results[0].value
    expect(accepted.mock.calls[0][0]).toBe(result.value)
    await act(() => button('Preview trajectory')?.click())
    await act(() =>
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    )
    expect(inspect).toHaveBeenCalledOnce()
    expect(accepted).toHaveBeenCalledOnce()
    await editSource('time,broken\nnope,value')
    await act(() =>
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    )
    expect(accepted).toHaveBeenCalledOnce()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
  } finally {
    inspect.mockRestore()
  }
})

it('reports invalid authored input while typing and commits it on blur without requiring a valid conversion', async () => {
  const edit = vi.fn(
    async (
      _input: import('../../../domain/trajectory-input').TrajectoryInput,
      _result: importer.TrajectoryImportPreview
    ) => true
  )
  const example = createSyntheticExample()
  await act(() =>
    root.render(
      createElement(TrajectoryImportPanel, {
        workcell: example.workcell,
        trajectory: example.trajectory,
        onAccept: accepted,
        onEdit: edit
      })
    )
  )
  const field = present(host.querySelector('textarea'))
  await editSource('time,broken\nnope,value')
  expect(host.querySelector('[role="alert"]')).not.toBeNull()
  expect(edit).not.toHaveBeenCalled()
  await act(() =>
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  )
  expect(edit).toHaveBeenCalledOnce()
  expect(edit.mock.calls[0][0]).toMatchObject({
    version: 1,
    kind: 'csv',
    text: 'time,broken\nnope,value'
  })
  expect(edit.mock.calls[0][1].value).toBeNull()
  expect(button('Apply trajectory')).toBeUndefined()
})

it('reads new external CSV columns without converting under the previous source units', async () => {
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  const normalize = vi.spyOn(sourceDomain, 'normalizeTrajectorySource')
  try {
    const file = new File([], 'different.csv')
    file.text = vi.fn(async () =>
      present(host.querySelector('textarea')).value.replace('\n8,', '\n9,')
    )
    await choose(file)
    expect(parse).toHaveBeenCalledOnce()
    expect(normalize).not.toHaveBeenCalled()
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    await act(() => button('Preview trajectory')?.click())
    expect(normalize).not.toHaveBeenCalled()
    expect(parse).toHaveBeenCalledOnce()
  } finally {
    parse.mockRestore()
    normalize.mockRestore()
  }
})

it('reveals an explicitly requested preview but not normal completed edits', async () => {
  await act(() => button('Preview trajectory')?.click())
  expect(document.activeElement?.getAttribute('aria-label')).toBe(
    'Trajectory preview review'
  )
})

it('shows trajectory reading status beside the file controls', async () => {
  let finish: (value: string) => void = () => undefined
  const file = new File([], 'pending.csv')
  file.text = () =>
    new Promise<string>((resolve) => {
      finish = resolve
    })
  await choose(file)
  expect(host.querySelector('.file-row')?.textContent).toContain(
    'Reading trajectory file'
  )
  await act(() => finish('time\n0'))
  expect(host.querySelector('.file-row')?.textContent).not.toContain(
    'Reading trajectory file'
  )
})
