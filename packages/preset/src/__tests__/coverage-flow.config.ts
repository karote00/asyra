import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourceRoot =
  process.env.FLOW_PROOF_SOURCE ?? resolve(import.meta.dirname, '../../../..')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'packages/preset/coverage-flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) =>
    entry.id === (process.env.FLOW_PROOF_SCENARIO ?? 'baseline')
)
if (!scenario) {
  throw new Error('Unknown coverage proof scenario')
}
// Public source entries consumed by the existing Core/Render/Utils closure.
const sourceAliases = [
  'core',
  'factory',
  'feature-system',
  'input-system',
  'persistence',
  'props-manager',
  'reactive-events',
  'render',
  'render-engine',
  'scene-tree',
  'selection',
  'system-context',
  'ui-context',
  'utils'
].map((name) => ({
  find: new RegExp('^@asyra/' + name + '$'),
  replacement: resolve(sourceRoot, 'packages/' + name + '/src/index.ts')
}))
export default {
  plugins: [
    {
      name: 'coverage-owner-scenario',
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
          throw new Error('Coverage mutation site changed')
        }
        return { code: code.replace(mutation.from, mutation.to), map: null }
      }
    }
  ],
  resolve: { alias: sourceAliases },
  test: {
    environment: 'jsdom',
    include: [resolve(sourceRoot, manifest.testFile)],
    maxWorkers: 1,
    fileParallelism: false
  }
}
