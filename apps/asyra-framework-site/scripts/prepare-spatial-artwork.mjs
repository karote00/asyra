import { mkdir, stat } from 'node:fs/promises'
import console from 'node:console'
import path from 'node:path'
import sharp from 'sharp'

const siteRoot = path.resolve(import.meta.dirname, '..')
const sourceRoot = path.resolve(
  siteRoot,
  '../../work/visualizations/spatial-story-artwork'
)
const outputRoot = path.join(siteRoot, 'public/illustrations/spatial-story')
await mkdir(outputRoot, { recursive: true })

// Delivery encoding only; subjects are authored and isolated with image tools.
// Do not flatten alpha, paint over cutout failures, or remove backgrounds here.
for (const [name, width] of [
  ['node-module', 1024],
  ['inner-module', 1024],
  ['replacement-module', 1024],
  ['connector', 1024],
  ['maker-tray', 1536],
  ['closing-atelier', 1774],
  ['prepared-workbench', 1536],
  ['thinker', 1536],
  ['thinker-shapes', 1536],
  ['fern', 1024]
]) {
  const input = path.join(sourceRoot, `${name}.png`)
  const output = path.join(outputRoot, `${name}.webp`)
  const original = await sharp(input).metadata()
  if (
    !['closing-atelier', 'prepared-workbench'].includes(name) &&
    !original.hasAlpha
  ) {
    throw new Error(`${name}: real alpha is required before delivery encoding`)
  }
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toFile(output)
  const metadata = await sharp(output).metadata()
  const file = await stat(output)
  console.log(
    `${name}: ${metadata.width}x${metadata.height}, ${Math.round(file.size / 1024)} KiB, alpha=${metadata.hasAlpha}`
  )
}
