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

test('complete story artwork stays within a 2 MiB delivery budget', async () => {
  let bytes = 0
  for (const name of sources) {
    bytes += (await stat(new URL(name, artwork))).size
  }
  assert.ok(bytes < 2 * 1024 * 1024)
})
