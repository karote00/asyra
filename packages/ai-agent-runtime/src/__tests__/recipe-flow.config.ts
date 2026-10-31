import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourceRoot =
  process.env.FLOW_PROOF_SOURCE ?? resolve(import.meta.dirname, '../../../..')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'packages/ai-agent-runtime/flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) =>
    entry.id === (process.env.FLOW_PROOF_SCENARIO ?? 'baseline')
)
if (!scenario) {
  throw new Error('Unknown recipe proof scenario')
}

export default {
  plugins: [
    {
      name: 'registered-recipe-proof-mutation',
      enforce: 'pre' as const,
      resolveId(id: string) {
        if (id.startsWith('@asyra/')) {
          throw new Error('Uncaptured source dependency: ' + id)
        }
      },
      transform(code: string, id: string) {
        const mutation = scenario.mutation
        if (!mutation || id !== resolve(sourceRoot, mutation.file)) {
          return
        }
        if (code.split(mutation.from).length !== 2) {
          throw new Error('Recipe proof mutation site changed')
        }
        return { code: code.replace(mutation.from, mutation.to), map: null }
      }
    }
  ],
  test: {
    environment: 'node',
    include: [resolve(sourceRoot, manifest.testFile)],
    maxWorkers: 1,
    fileParallelism: false
  }
}
