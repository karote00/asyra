import { expect, it, vi } from 'vitest'
import { createAssetReviewController } from '../vegetation-controller'
import { planter } from '../../assets/plants'

it('retains the actual asset and bounds through all inspection views and appearance changes', () => {
  const build = vi.fn(planter),
    submit = vi.fn(),
    submitCamera = vi.fn()
  const control = createAssetReviewController(
    { submit, submitCamera },
    'plant',
    { width: 1000, height: 700 },
    build
  )
  const source = submit.mock.calls[0][0].meshes
  for (const view of [
    'Front',
    'Right',
    'Back',
    'Top',
    'Three-quarter',
    'Cap detail'
  ] as const)
    control.setView(view)
  control.resize(600, 2, 800)
  expect(build).toHaveBeenCalledOnce()
  expect(submit).toHaveBeenCalledOnce()
  expect(submitCamera).toHaveBeenCalledTimes(7)
  control.setNeutral(true)
  const grey = submit.mock.calls[1][0].meshes
  expect(
    grey.map((m: { descriptor: { shape: unknown } }) => m.descriptor.shape)
  ).toEqual(
    source.map((m: { descriptor: { shape: unknown } }) => m.descriptor.shape)
  )
  expect(build).toHaveBeenCalledOnce()
  control.dispose()
  expect(() => control.setView('Front')).toThrow('disposed')
})

it('fits depth planes to the asset so submillimetre shells do not z-fight at the narrow review lens', () => {
  const submit = vi.fn(),
    submitCamera = vi.fn()
  const control = createAssetReviewController(
    { submit, submitCamera },
    'leaf',
    {
      width: 1000,
      height: 700
    }
  )
  for (const view of [
    'Front',
    'Right',
    'Back',
    'Top',
    'Three-quarter'
  ] as const)
    control.setView(view)
  for (const [camera] of submitCamera.mock.calls) {
    const distance = Math.hypot(
      ...camera.position.map((n: number, i: number) => n - camera.target[i])
    )
    const depthResolution =
      (distance * distance * (camera.far - camera.near)) /
      (camera.far * camera.near * 2 ** 24)
    expect(depthResolution).toBeLessThan(0.00001)
  }
  control.dispose()
})

it('reviews the actual catalog door rather than silently constructing a different asset', async () => {
  const { catalogAsset } = await import('../../assets/catalog')
  const controller = createAssetReviewController(
    { submit: vi.fn(), submitCamera: vi.fn() },
    'entry-door-set',
    { width: 1000, height: 700 }
  )
  expect(controller.getSnapshot().triangles).toBe(
    catalogAsset('entry-door-set').reduce(
      (sum, p) => sum + p.mesh.indices.length / 3,
      0
    )
  )
  controller.dispose()
})
