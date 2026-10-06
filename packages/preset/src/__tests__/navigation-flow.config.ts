import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourceRoot = process.env.FLOW_PROOF_SOURCE
if (!sourceRoot) throw new Error('Missing captured navigation source')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'packages/preset/navigation-flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) => entry.id === process.env.FLOW_PROOF_SCENARIO
)
if (!scenario) throw new Error('Unknown navigation proof scenario')
export default {
  plugins: [
    {
      name: 'navigation-owner-scenario',
      enforce: 'pre' as const,
      transform(code: string, id: string) {
        const mutation = scenario.mutation
        if (!mutation || id !== resolve(sourceRoot, mutation.file)) return
        if (code.split(mutation.from).length !== 2)
          throw new Error('Navigation mutation site changed')
        return { code: code.replace(mutation.from, mutation.to), map: null }
      }
    }
  ],
  test: {
    environment: 'jsdom',
    include: [resolve(sourceRoot, manifest.testFile)],
    fileParallelism: false
  }
}
