import { afterEach } from 'vitest'
import { createDocumentRuntime, type DocumentRuntime } from '../runtime.js'

let active: DocumentRuntime | undefined
export const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
export async function open(input: unknown) {
  active = createDocumentRuntime(structuredClone(input))
  await active.start()
  active.feature.select('text-1')
  await settle()
  return active
}
export async function reload(app: DocumentRuntime) {
  const saved = await app.save()
  await app.dispose()
  active = undefined
  return open(saved)
}
afterEach(async () => {
  await active?.dispose()
  active = undefined
})
