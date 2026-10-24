// @vitest-environment node
import { createHash } from 'node:crypto'
import { expect, it, vi } from 'vitest'
import {
  decodeRestrictedGlb,
  GLB_LIMITS,
  RestrictedGlbPreviewWorker
} from '../spatial-assets.js'
import { encodeGlb, triangleFixture } from './spatial-assets-fixture.js'

it('decodes detached original triangles, bounds and source identity through the optional public entry', async () => {
  const { json, binary } = triangleFixture()
  const bytes = encodeGlb(json, binary)
  const hash = createHash('sha256').update(bytes).digest('hex')
  const pending = decodeRestrictedGlb(bytes)
  bytes.fill(0)
  const asset = await pending
  expect(asset.source.sha256).toBe(hash)
  expect(asset.format).toBe('restricted-glb-v0')
  expect(asset.meshes[0].positions).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0])
  expect(asset.bounds).toEqual({ min: [0, 0, 0], max: [1, 1, 0] })
  expect(Object.isFrozen(asset.meshes[0].positions)).toBe(true)
})

it.each(['uri', 'textures', 'animations', 'skins', 'extensions'])(
  'retains rejection of unsupported %s',
  async (key) => {
    const { json, binary } = triangleFixture()
    await expect(
      decodeRestrictedGlb(encodeGlb({ ...json, [key]: [] }, binary))
    ).rejects.toThrow(/Unsupported/)
  }
)

it('rejects byte limits and cancellation before allocating a worker', async () => {
  const create = vi.fn()
  const owner = new RestrictedGlbPreviewWorker(create)
  await expect(
    owner.decode(new Uint8Array(GLB_LIMITS.bytes + 1))
  ).rejects.toThrow(/limit/)
  const abort = new AbortController()
  abort.abort()
  await expect(
    owner.decode(new Uint8Array([1]), abort.signal)
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(create).not.toHaveBeenCalled()
  owner.dispose()
  await expect(owner.decode(new Uint8Array([1]))).rejects.toThrow(/closed/)
})
