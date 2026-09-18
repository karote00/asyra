const core = vi.hoisted(() => ({
  getElementData: vi.fn(),
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

it('bounds metadata reads and captures once per invocation without reusing old images', () => {
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
    truncated: true,
    image: { dataUrl: 'first' }
  })
  expect(first.elements).toHaveLength(200)
  expect(core.getElementComputedData).toHaveBeenCalledTimes(200)
  expect(core.captureElementSnapshot).toHaveBeenCalledOnce()
  expect(inspectionApis.inspect('group')).toMatchObject({
    image: { dataUrl: 'second' }
  })
  expect(core.captureElementSnapshot).toHaveBeenCalledTimes(2)
  core.captureElementSnapshot.mockImplementation(() => {
    throw new Error('Unsupported renderer')
  })
  expect(inspectionApis.inspect('group')).toMatchObject({ available: false })
})
