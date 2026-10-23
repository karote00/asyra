import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import console from 'node:console'
import { createServer } from 'vite'

// Export the exact domain geometry for optional Blender inspection, never a runtime asset.
const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({
  root,
  cacheDir: fileURLToPath(
    new URL('../.artifacts/vite-review/', import.meta.url)
  ),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }
})
try {
  const { createCropModels } = await server.ssrLoadModule(
    '/src/domain/crop-models.ts'
  )
  const models = createCropModels({ netTop: 3, netBottom: 0.45 })
  const directory = new URL('../.artifacts/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(
    new URL('crop-models.json', directory),
    JSON.stringify(models)
  )
  const triangles = models.map((model) =>
    model.parts.reduce((sum, part) => sum + part.shape.indices.length / 3, 0)
  )
  console.log(
    JSON.stringify({
      models: models.length,
      triangles: {
        min: Math.min(...triangles),
        max: Math.max(...triangles),
        total: triangles.reduce((sum, n) => sum + n, 0)
      },
      path: fileURLToPath(new URL('crop-models.json', directory))
    })
  )
} finally {
  await server.close()
}
