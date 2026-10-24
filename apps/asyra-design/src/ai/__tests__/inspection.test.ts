const core = vi.hoisted(() => ({
  getElementData: vi.fn(),
  getCurrentWorkspaceId: vi.fn(() => 'sheet-a'),
  getElementMetadata: vi.fn(() => ({ parentId: undefined })),
  getElementComputedData: vi.fn(),
  captureElementSnapshot: vi.fn()
}))
vi.mock('../../contexts', () => ({ default: core }))
import { inspectionApis } from '../../common-apis/inspection'
import { expect, it, vi } from 'vitest'
import { createAiInspectionAction } from '../inspection'

it('returns fresh rendered evidence for every inspection without caching or writing', async () => {
  const inspect = vi
    .fn()
    .mockReturnValueOnce({
      available: true,
      image: { dataUrl: 'first' },
      elements: [{ id: 'shape' }]
    })
    .mockReturnValueOnce({
      available: true,
      image: { dataUrl: 'second' },
      elements: [{ id: 'shape' }]
    })
  const action = createAiInspectionAction(inspect)
  const context = { signal: new AbortController().signal } as never
  expect(await action.execute({ elementId: 'drawing' }, context)).toMatchObject(
    { available: true, image: { dataUrl: 'first' } }
  )
  expect(await action.execute({ elementId: 'drawing' }, context)).toMatchObject(
    { available: true, image: { dataUrl: 'second' } }
  )
  expect(inspect).toHaveBeenCalledTimes(2)
  expect(inspect).toHaveBeenLastCalledWith('drawing')
})

it('does not capture after cancellation and preserves explicit unavailable results', async () => {
  const inspect = vi.fn(() => ({
    available: false,
    message: 'Drawing inspection is unavailable.'
  }))
  const action = createAiInspectionAction(inspect)
  const controller = new AbortController()
  controller.abort()
  await expect(
    action.execute({ elementId: 'drawing' }, {
      signal: controller.signal
    } as never)
  ).rejects.toThrow()
  expect(inspect).not.toHaveBeenCalled()
  expect(
    await action.execute({ elementId: 'drawing' }, {
      signal: new AbortController().signal
    } as never)
  ).toMatchObject({ available: false })
})

it('captures fresh images without querying unrelated subtree metadata', () => {
  core.getElementData.mockImplementation((id: string) =>
    id === 'group'
      ? {
          type: 'group',
          children: Array.from({ length: 300 }, (_, i) => `shape-${i}`)
        }
      : { type: 'oval', name: id }
  )
  core.getElementComputedData.mockReturnValue({
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    fills: []
  })
  core.captureElementSnapshot
    .mockReturnValueOnce({ dataUrl: 'first' })
    .mockReturnValueOnce({ dataUrl: 'second' })
  const first = inspectionApis.inspect('group')
  expect(first).toMatchObject({
    available: true,
    imageScope: 'overview',
    image: { dataUrl: 'first' }
  })
  expect(first).not.toHaveProperty('elements')
  expect(core.getElementComputedData).not.toHaveBeenCalled()
  expect(core.captureElementSnapshot).toHaveBeenCalledOnce()
  expect(core.captureElementSnapshot).toHaveBeenCalledWith('group', 1024, {
    nativeResolution: false
  })
  expect(inspectionApis.inspect('group')).toMatchObject({
    image: { dataUrl: 'second' }
  })
  expect(core.captureElementSnapshot).toHaveBeenCalledTimes(2)
  expect(core.getElementData).toHaveBeenCalledTimes(2)
  expect(core.getElementComputedData).not.toHaveBeenCalled()
  core.captureElementSnapshot.mockImplementation(() => {
    throw new Error('Unsupported renderer')
  })
  expect(inspectionApis.inspect('group')).toMatchObject({ available: false })
})

it('forwards an explicit native region without describing it as the whole drawing', async () => {
  const region = { x: 0, y: 0, width: 80, height: 60 }
  const inspect = vi.fn(() => ({ available: true, partial: true }))
  await createAiInspectionAction(inspect).execute(
    { elementId: 'group', region },
    { signal: new AbortController().signal } as never
  )
  expect(inspect).toHaveBeenCalledWith('group', region)
  core.captureElementSnapshot.mockReturnValue({ dataUrl: 'region' })
  expect(inspectionApis.inspect('group', region)).toMatchObject({
    available: true,
    partial: true
  })
  expect(core.captureElementSnapshot).toHaveBeenLastCalledWith('group', 1024, {
    nativeResolution: true,
    region
  })
})

it('keeps overview and native detail capture separate without mutating source geometry', async () => {
  core.getElementData.mockReturnValue({ type: 'group', children: [] })
  core.getElementComputedData.mockReturnValue({
    x: 0,
    y: 0,
    width: 20000,
    height: 10000
  })
  core.captureElementSnapshot.mockReturnValue({
    dataUrl: 'overview',
    width: 1024,
    height: 512,
    bounds: { x: 0, y: 0, width: 20000, height: 10000 }
  })
  expect(inspectionApis.inspect('drawing')).toMatchObject({
    imageScope: 'overview',
    partial: false
  })
  expect(core.captureElementSnapshot).toHaveBeenLastCalledWith(
    'drawing',
    1024,
    { nativeResolution: false }
  )
  const inspect = vi.fn(() => ({ available: true }))
  await createAiInspectionAction(inspect).execute(
    { elementId: 'window', view: 'detail' },
    { signal: new AbortController().signal } as never
  )
  expect(inspect).toHaveBeenCalledWith('window', undefined, 'detail')
  inspectionApis.inspect('window', undefined, 'detail')
  expect(core.captureElementSnapshot).toHaveBeenLastCalledWith('window', 1024, {
    nativeResolution: true
  })
})

it('binds action output to canonical evidence and validates it without another snapshot', async () => {
  const { createInspectionEvidence } =
    await import('../../common-apis/inspection-evidence')
  const { createInspectionValidationAction } = await import('../inspection')
  let changed: () => void = () => undefined
  const stop = vi.fn()
  const evidence = createInspectionEvidence((listener) => {
    changed = listener
    return stop
  })
  const inspect = vi.fn(() => ({ available: true, image: { dataUrl: 'png' } }))
  const action = createAiInspectionAction(inspect, evidence)
  const validate = createInspectionValidationAction(evidence)
  const context = { signal: new AbortController().signal } as never
  const result = (await action.execute({ elementId: 'drawing' }, context)) as {
    evidence: { sessionId: string; revision: number }
  }
  expect(
    await validate.execute({ evidence: result.evidence }, context)
  ).toEqual({
    current: true,
    validatedAt: { sessionId: result.evidence.sessionId, revision: 0 }
  })
  changed()
  expect(
    await validate.execute({ evidence: result.evidence }, context)
  ).toEqual({
    current: false,
    validatedAt: { sessionId: result.evidence.sessionId, revision: 1 }
  })
  expect(inspect).toHaveBeenCalledOnce()
  evidence.dispose()
  expect(stop).toHaveBeenCalledOnce()
})

it('settles workspace overview and explicit unavailable captures at the actual read owner', () => {
  core.getElementMetadata.mockImplementation((id: string) => ({
    parentId: undefined,
    childCount: id === 'empty' ? 0 : 1
  }))
  core.getElementData.mockImplementation((id: string) =>
    id === 'missing'
      ? undefined
      : { id, type: 'workspace', children: id === 'empty' ? [] : ['part'] }
  )
  core.captureElementSnapshot
    .mockReset()
    .mockReturnValue({ dataUrl: 'data:image/png;base64,AA==' })
  expect(inspectionApis.inspect('sheet-a')).toMatchObject({
    available: true,
    settlement: 'completed',
    imageScope: 'overview'
  })
  expect(inspectionApis.inspect('sheet-a', undefined, 'detail')).toMatchObject({
    available: false,
    code: 'WORKSPACE_OVERVIEW_ONLY',
    settlement: 'completed'
  })
  expect(
    inspectionApis.inspect('sheet-a', { x: 0, y: 0, width: 10, height: 10 })
  ).toMatchObject({
    available: false,
    code: 'WORKSPACE_OVERVIEW_ONLY',
    settlement: 'completed'
  })
  expect(inspectionApis.inspect('missing')).toMatchObject({
    available: false,
    code: 'INSPECTION_TARGET_UNAVAILABLE',
    settlement: 'completed'
  })
  expect(inspectionApis.inspect('foreign')).toMatchObject({
    available: false,
    code: 'INSPECTION_TARGET_UNAVAILABLE',
    settlement: 'completed'
  })
  core.getCurrentWorkspaceId.mockReturnValue('empty')
  expect(inspectionApis.inspect('empty')).toMatchObject({
    available: false,
    code: 'WORKSPACE_EMPTY',
    settlement: 'completed'
  })
  expect(core.captureElementSnapshot).toHaveBeenCalledOnce()
  core.getCurrentWorkspaceId.mockReturnValue('sheet-a')
  core.captureElementSnapshot.mockImplementation(() => {
    throw new Error('renderer failed')
  })
  expect(inspectionApis.inspect('sheet-a')).toMatchObject({
    available: false,
    code: 'CAPTURE_UNAVAILABLE',
    settlement: 'completed'
  })
})
