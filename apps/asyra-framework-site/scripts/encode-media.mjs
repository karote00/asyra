import console from 'node:console'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const images = [
  [
    'brand/asyra-foundation-green-v1.png',
    'brand/asyra-foundation-green-v1.jpg'
  ],
  [
    'illustrations/spatial-story/thinker-shapes.webp',
    'illustrations/spatial-story/thinker-shapes.webp'
  ],
  [
    'illustrations/spatial-story/closing-atelier.webp',
    'illustrations/spatial-story/closing-atelier.webp'
  ]
]

// Always encode from retained sources, never from an already optimized delivery.
for (const [source, destination] of images) {
  const input = path.join(siteRoot, 'assets', source)
  const output = path.join(siteRoot, 'public', destination)
  await mkdir(path.dirname(output), { recursive: true })
  const encoder = sharp(input)
  if (destination.endsWith('.jpg')) {
    encoder.jpeg({ quality: 85, mozjpeg: true })
  } else {
    encoder.webp({ quality: 78, alphaQuality: 100, effort: 6 })
  }
  await encoder.toFile(output)
  console.log(
    `${destination}: ${(await stat(input)).size} -> ${(await stat(output)).size} bytes`
  )
}
