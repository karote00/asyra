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

  expect(button('Accept into draft')).toBeDefined()
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

    expect(button('Accept into draft')).toBeUndefined()

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

  expect(button('Accept into draft')).toBeUndefined()

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

  expect(button('Accept into draft')).toBeUndefined()

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
  expect(button('Accept into draft')).toBeUndefined()
  expect(host.textContent).toContain('explicit supported time unit')
  await select('Time unit', 's')
  await act(() => button('Preview trajectory')?.click())
  expect(button('Accept into draft')).toBeUndefined()
  for (const body of example.workcell.bodies) {
    if (body.joint.kind !== 'fixed')
      await select(`${body.name} CSV unit`, 'rad')
  }
  await preview()
  expect(
    host.querySelector('[aria-label="Trajectory conversion preview"]')
      ?.textContent
  ).toContain('rad')
  await act(() => button('Accept into draft')?.click())
  expect(accepted).toHaveBeenCalledOnce()
  expect(accepted.mock.calls[0][0].trajectory).toEqual(example.trajectory)
})

it('reuses source parsing and the exact validated preview on repeated review and acceptance', async () => {
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  const normalize = vi.spyOn(sourceDomain, 'normalizeTrajectorySource')
  const inspect = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    const example = await externalCsv()
    expect(parse).toHaveBeenCalledOnce()
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
    await act(() => button('Accept into draft')?.click())
    expect(normalize).toHaveBeenCalledTimes(work)
    expect(parse).toHaveBeenCalledOnce()
    expect(accepted.mock.calls[0][0]).toBe(result.value)
    await select('Time unit', 'ms')
    expect(button('Accept into draft')).toBeUndefined()
    await preview()
    expect(normalize).toHaveBeenCalledTimes(work * 2)
    expect(parse).toHaveBeenCalledOnce()
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
  await act(() => button('Accept into draft')?.click())
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
  expect(button('Accept into draft')).toBeUndefined()
  await act(async () => resolve('time\n99'))
  expect(present(host.querySelector('textarea')).value).toBe(before)
  expect(accepted).not.toHaveBeenCalled()
})

it('discards an import without acceptance or stale read delivery', async () => {
  await preview()
  expect(button('Discard preview')).toBeDefined()
  await act(() => button('Discard preview')?.click())
  expect(button('Accept into draft')).toBeUndefined()
  expect(accepted).not.toHaveBeenCalled()
})

it('revokes canonical unit assumptions and the old preview after pasted source changes', async () => {
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
  expect(button('Accept into draft')).toBeUndefined()
  await act(() => button('Preview trajectory')?.click())
  expect(button('Accept into draft')).toBeUndefined()
  expect(host.textContent).toContain('explicit supported time unit')
})

it('invalidates column mapping and current workcell previews without reparsing source', async () => {
  const parse = vi.spyOn(importer, 'prepareTrajectoryCsv')
  try {
    await preview()
    await select('Time column', '')
    expect(button('Accept into draft')).toBeUndefined()
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
    expect(button('Accept into draft')).toBeUndefined()
    await act(() => button('Preview trajectory')?.click())
    expect(button('Accept into draft')).toBeUndefined()
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
    expect(button('Accept into draft')).toBeUndefined()
    expect(parse).toHaveBeenCalledOnce()
    expect(inspect).not.toHaveBeenCalled()
    await preview()
    await preview()
    expect(inspect).toHaveBeenCalledOnce()
    expect(parse).toHaveBeenCalledOnce()
    const result = inspect.mock.results[0].value
    expect(result.value.trajectory.keyframes[1].time).toBe(0.005)
    await act(() => button('Accept into draft')?.click())
    expect(accepted.mock.calls[0][0]).toBe(result.value)
    await externalCsv()
    await act(() => button('Preview trajectory')?.click())
    expect(button('Accept into draft')).toBeUndefined()
  } finally {
    parse.mockRestore()
    inspect.mockRestore()
  }
})

it('preserves explicit confirmation of canonical units while dropping unconfirmed defaults', async () => {
  await select('Time unit', 's')
  const text = present(host.querySelector('textarea')).value.replace(
    '\n4,',
    '\n5,'
  )
  await editSource(text)
  await act(() => button('Preview trajectory')?.click())
  expect(host.textContent).not.toContain('explicit supported time unit')
  expect(button('Accept into draft')).toBeUndefined()
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
  expect(button('Accept into draft')).toBeUndefined()
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
  expect(button('Accept into draft')).toBeUndefined()
})
