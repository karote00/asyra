import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import console from 'node:console'
import { createServer } from 'vite'

// Blender consumes canonical app geometry; this is review evidence, not a second asset.
const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({
  root,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }
})
try {
  const { createRobotModel, createDockModel } = await server.ssrLoadModule(
    '/src/domain/robot-model.ts'
  )
  const { DEFAULT_ROBOT } = await server.ssrLoadModule(
    '/src/domain/robot-configuration.ts'
  )
  const directory = new URL('../.artifacts/', import.meta.url)
  await mkdir(directory, { recursive: true })
  const parts = [...createRobotModel(DEFAULT_ROBOT), ...createDockModel()]
  await writeFile(
    new URL('robot-model.json', directory),
    JSON.stringify({ definition: DEFAULT_ROBOT, parts })
  )
  console.log(
    JSON.stringify({
      parts: parts.length,
      path: fileURLToPath(new URL('robot-model.json', directory))
    })
  )
} finally {
  await server.close()
}
