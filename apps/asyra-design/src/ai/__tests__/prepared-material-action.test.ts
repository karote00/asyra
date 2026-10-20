import { expect, it, vi } from 'vitest'
import { createPreparedMaterialApplication } from '../prepared-material-action'

const gradient = {
  gradientType: 'linear' as const,
  gradientHandles: [
    { x: 0, y: 0 },
    { x: 1, y: 0 }
  ],
  gradientStops: [
    { position: 0, color: '#102030', opacity: 1 },
    { position: 1, color: '#eeeeee', opacity: 1 }
  ]
}
it('uses captured creation provenance, preflights all members and retains it across material edits only', async () => {
  const current = new Map([
    ['a', 'geometry-a-binding-a'],
    ['b', 'geometry-b-binding-b']
  ])
  const update = vi.fn()
  const owner = createPreparedMaterialApplication({
    read: (id) =>
      current.has(id)
        ? { geometry: current.get(id), binding: 'binding' }
        : null,
    update
  })
  const signal = new AbortController().signal
  const input = {
    rootId: 'root',
    updates: [
      { elementId: 'a', gradient, color: '#102030' },
      { elementId: 'b', gradient, color: '#102030' }
    ]
  }
  await expect(owner.action.execute(input, { signal })).rejects.toThrow(
    /provenance|unavailable/i
  )
  owner.capture('root', ['a', 'b'], signal)
  current.set('b', 'changed-geometry')
  await expect(owner.action.execute(input, { signal })).rejects.toThrow(
    /changed/i
  )
  expect(update).not.toHaveBeenCalled()
  current.set('b', 'geometry-b-binding-b')
  expect(await owner.action.execute(input, { signal })).toMatchObject({
    status: 'complete',
    appliedCount: 2
  })
  expect(update).toHaveBeenCalledTimes(1)
  expect(update.mock.calls[0][0]).toEqual(['a', 'b'])
  expect(await owner.action.execute(input, { signal })).toMatchObject({
    status: 'complete'
  })
  owner.releaseFor(signal)
  await expect(owner.action.execute(input, { signal })).rejects.toThrow(
    /provenance|unavailable/i
  )
})

it('rejects foreign request, duplicates, missing members and abort before the first write', async () => {
  const update = vi.fn()
  const owner = createPreparedMaterialApplication({
    read: (id) => (id === 'a' ? { geometry: 'a', binding: 'binding' } : null),
    update
  })
  const controller = new AbortController()
  const input = {
    rootId: 'root',
    updates: [{ elementId: 'a', gradient, color: '#102030' }]
  }
  owner.capture('root', ['a'], controller.signal)
  await expect(
    owner.action.execute(input, { signal: new AbortController().signal })
  ).rejects.toThrow(/request|unavailable/i)
  await expect(
    owner.action.execute(
      { ...input, updates: [...input.updates, ...input.updates] },
      { signal: controller.signal }
    )
  ).rejects.toThrow(/unique/i)
  await expect(
    owner.action.execute(
      { ...input, updates: [{ ...input.updates[0], elementId: 'missing' }] },
      { signal: controller.signal }
    )
  ).rejects.toThrow(/member|changed/i)
  controller.abort()
  await expect(
    owner.action.execute(input, { signal: controller.signal })
  ).rejects.toThrow()
  expect(update).not.toHaveBeenCalled()
  owner.dispose()
})

it('preserves the committed receipt when provenance refresh fails and refuses a blind replay', async () => {
  let written = false
  const update = vi.fn(() => {
    written = true
  })
  const owner = createPreparedMaterialApplication({
    read: () => {
      if (written) throw new Error('read unavailable')
      return { geometry: 'g', binding: 'b' }
    },
    update
  })
  const signal = new AbortController().signal
  owner.capture('root', ['a'], signal)
  const input = {
    rootId: 'root',
    updates: [{ elementId: 'a', gradient, color: '#102030' }]
  }
  await expect(owner.action.execute(input, { signal })).resolves.toMatchObject({
    status: 'complete',
    appliedCount: 1,
    materialProvenance: { status: 'unavailable', unavailableElementIds: ['a'] }
  })
  await expect(owner.action.execute(input, { signal })).rejects.toMatchObject({
    name: 'AiToolContractError'
  })
  expect(update).toHaveBeenCalledTimes(1)
  owner.dispose()
})

it('keeps document material provenance across viewport transforms and rejects real owner changes', async () => {
  const { default: core } = await import('@asyra/core')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { RenderContainer } = await import('@asyra/render')
  const { fillApis } = await import('../../common-apis/fills')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [PresetDefaults.BASIC_SHAPES, PresetDefaults.CONTAINERS]
  })
  core.load({
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
          visible: true,
          lock: false,
          children: []
        }
      }
    }
  })
  core.createElementsInParent(
    [{ id: 'frame', type: 'frame', x: 12, y: 34, width: 100, height: 100 }],
    'workspace'
  )
  core.createElementsInParent(
    [
      {
        id: 'face',
        type: 'rect',
        x: 9378.905950335902,
        y: 33657.47156164411,
        width: 20,
        height: 30
      }
    ],
    'frame'
  )
  const view = new RenderContainer()
  const frame = new RenderContainer({ x: 12, y: 34 })
  const face = new RenderContainer({
    x: 9378.905950335902,
    y: 33657.47156164411
  })
  view.addChild(frame)
  frame.addChild(face)
  const original = core.elementLocalToWorkspace
  const projected = vi.fn((_id: string, point: { x: number; y: number }) =>
    view.toLocal(face.toGlobal(point))
  )
  core.elementLocalToWorkspace = projected
  const owner = createPreparedMaterialApplication()
  const controller = new AbortController()
  const input = {
    rootId: 'frame',
    updates: [{ elementId: 'face', gradient, color: '#102030' }]
  }
  const context = { signal: controller.signal }
  try {
    owner.capture('frame', ['face'], controller.signal)
    expect(projected).not.toHaveBeenCalled()
    const document = core.save()
    view.scale.set(0.02, 0.02)
    view.position.set(600, 60)
    expect(core.save()).toEqual(document)
    await expect(owner.action.execute(input, context)).resolves.toMatchObject({
      status: 'complete',
      appliedElementIds: ['face']
    })
    const fills = core.getElementComputedData('face', ['fills'])?.fills
    expect(fills).toMatchObject([{ kind: 'gradient', gradient }])
    view.scale.set(2.75, 2.75)
    view.position.set(-331.25, 9.125)
    await expect(owner.action.execute(input, context)).resolves.toMatchObject({
      status: 'complete'
    })
    // Canonical movement must invalidate even if the renderer has not updated yet.
    core.updateElementProperties([
      { elementId: 'face', values: { x: 9378.905950335902 + 0.001 } }
    ])
    const moved = core.save()
    await expect(owner.action.execute(input, context)).rejects.toThrow(
      /geometry.computed.x: expected .*current .*delta/
    )
    expect(core.save()).toEqual(moved)
    core.updateElementProperties([
      { elementId: 'face', values: { x: 9378.905950335902 } }
    ])
    core.updateElementProperties([{ elementId: 'frame', values: { y: 35 } }])
    await expect(owner.action.execute(input, context)).rejects.toThrow(
      /geometry|ancestor/i
    )
    core.updateElementProperties([{ elementId: 'frame', values: { y: 34 } }])
    core.updateElementProperties([{ elementId: 'face', values: { width: 21 } }])
    await expect(owner.action.execute(input, context)).rejects.toThrow(
      /geometry/i
    )
    core.updateElementProperties([{ elementId: 'face', values: { width: 20 } }])
    fillApis.addFills(['face'])
    const originalFill = (fills as { id: string }[])[0].id
    fillApis.removeFills([{ elementId: 'face', fillId: originalFill }])
    const rebound = core.save()
    await expect(owner.action.execute(input, context)).rejects.toThrow(
      /binding/i
    )
    expect(core.save()).toEqual(rebound)
    controller.abort()
    await expect(owner.action.execute(input, context)).rejects.toThrow()
  } finally {
    owner.dispose()
    core.elementLocalToWorkspace = original
  }
})

it('reports a real small document delta without loosening admission or writing', async () => {
  let x = 1
  const update = vi.fn()
  const owner = createPreparedMaterialApplication({
    read: () => ({ geometry: { x }, binding: 'same' }),
    update
  })
  const signal = new AbortController().signal
  owner.capture('source', ['face'], signal)
  x += 1e-12
  await expect(
    owner.action.execute(
      {
        rootId: 'source',
        updates: [{ elementId: 'face', gradient, color: '#102030' }]
      },
      { signal }
    )
  ).rejects.toThrow(/geometry.x: expected 1, current .*delta/)
  expect(update).not.toHaveBeenCalled()
  owner.dispose()
})
