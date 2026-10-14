import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourceRoot =
  process.env.FLOW_PROOF_SOURCE ?? resolve(import.meta.dirname, '../../../..')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'packages/render/navigation-flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) =>
    entry.id === (process.env.FLOW_PROOF_SCENARIO ?? 'baseline')
)
if (!scenario) throw new Error('Unknown navigation proof scenario')
// Resolve only the public source entries consumed by this test closure.
const sourceAliases = [
  {
    find: /^@asyra\/render-engine\/testing$/,
    replacement: resolve(
      sourceRoot,
      'packages/render-engine/src/testing/index.ts'
    )
  },
  ...['utils', 'render-engine'].map((name) => ({
    find: new RegExp('^@asyra/' + name + '$'),
    replacement: resolve(sourceRoot, 'packages/' + name + '/src/index.ts')
  }))
]
export default {
  plugins: [
    {
      name: 'navigation-owner-scenario',
      config(config: {
        resolve?: { alias?: { find: string | RegExp; replacement: string }[] }
      }) {
        // Captured execution also supplies root aliases; retain subpath priority.
        config.resolve?.alias?.unshift(...sourceAliases)
      },
      resolveId(id: string) {
        if (id.startsWith('@asyra/'))
          throw new Error('Uncaptured source dependency: ' + id)
      },
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
  resolve: { alias: sourceAliases },
  test: {
    environment: 'node',
    include: [resolve(sourceRoot, manifest.testFile)],
    maxWorkers: 1,
    fileParallelism: false
  }
}
