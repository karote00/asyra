import assert from 'node:assert/strict'
import { stat } from 'node:fs/promises'
import test from 'node:test'
import { URL } from 'node:url'
import sharp from 'sharp'
import { storyArtwork } from '../lib/spatial-story.mjs'

const artwork = new URL(
  '../public/illustrations/spatial-story/',
  import.meta.url
)

const sources = [
  ...new Set(Object.values(storyArtwork).map((layer) => layer.src))
]
for (const name of sources) {
  test(`${name} preserves source dimensions, alpha and illustrated colors`, async () => {
    const source = await sharp(
      new URL(`../assets/illustrations/spatial-story/${name}`, import.meta.url)
        .pathname
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const delivered = await sharp(new URL(name, artwork).pathname)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    assert.equal(delivered.info.width, source.info.width)
    assert.equal(delivered.info.height, source.info.height)
    let colorError = 0
    let opaqueChannels = 0
    for (let pixel = 0; pixel < source.data.length; pixel += 4) {
      assert.equal(delivered.data[pixel + 3], source.data[pixel + 3])
      if (source.data[pixel + 3] < 250) continue
      for (let channel = 0; channel < 3; channel++) {
        colorError += Math.abs(
          delivered.data[pixel + channel] - source.data[pixel + channel]
        )
        opaqueChannels++
      }
    }
    assert.ok(
      colorError / opaqueChannels < 8,
      'compression preserves opaque subject colors'
    )
  })
}
for (const name of sources.filter(
  (name) => !['closing-atelier.webp', 'prepared-workbench.webp'].includes(name)
)) {
  test(`${name} has real transparent surroundings for independent depth layers`, async () => {
    const input = new URL(name, artwork)
    const { data, info } = await sharp(input.pathname)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    let transparent = 0
    let opaque = 0
    for (let index = 3; index < data.length; index += info.channels) {
      if (data[index] === 0) transparent++
      if (data[index] >= 250) opaque++
    }
    const pixels = info.width * info.height
    assert.ok(
      transparent / pixels > 0.1,
      'cutout must not contain a painted checkerboard'
    )
    assert.ok(
      opaque / pixels > 0.1,
      'cutout must preserve the illustrated subject'
    )
  })
}

test('complete story artwork stays within a 500 KB delivery budget', async () => {
  let bytes = 0
  for (const name of sources) {
    bytes += (await stat(new URL(name, artwork))).size
  }
  assert.ok(bytes < 500_000)
})
