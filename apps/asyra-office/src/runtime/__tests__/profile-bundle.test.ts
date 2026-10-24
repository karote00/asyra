// @vitest-environment node
import { createRequire } from 'node:module'
import { expect, it } from 'vitest'
import { build } from 'vite'

it('keeps the spatial SDK outside the eager public Preset chunk graph', async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: {
        entry: createRequire(import.meta.url).resolve('@asyra/preset'),
        formats: ['es'],
        fileName: 'preset'
      }
    }
  })
  const output = (Array.isArray(result) ? result : [result]).flatMap(
    (bundle) => ('output' in bundle ? bundle.output : [])
  )
  const chunks = output.filter((item) => item.type === 'chunk')
  const entries = chunks.filter((chunk) => chunk.isEntry)
  expect(entries).toHaveLength(1)
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const visited = new Set<string>()
  const visit = (name: string) => {
    if (visited.has(name)) return
    visited.add(name)
    byName.get(name)?.imports.forEach(visit)
  }
  entries.forEach((entry) => visit(entry.fileName))
  const containsSpatialSDK = (modules: Record<string, unknown>) =>
    Object.keys(modules).some((path) => path.includes('/node_modules/three/'))
  expect(chunks.some((chunk) => containsSpatialSDK(chunk.modules))).toBe(true)
  expect(
    chunks
      .filter((chunk) => visited.has(chunk.fileName))
      .some((chunk) => containsSpatialSDK(chunk.modules))
  ).toBe(false)
  expect(
    chunks
      .filter((chunk) => visited.has(chunk.fileName))
      .some((chunk) => chunk.dynamicImports.some((name) => !visited.has(name)))
  ).toBe(true)
}, 20000)
