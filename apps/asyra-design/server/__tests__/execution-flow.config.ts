import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The source proof runs only its explicitly mapped product cases. It never
// launches a live model or changes the normal App test configuration.
const sourceRoot =
  process.env.FLOW_PROOF_SOURCE ?? resolve(import.meta.dirname, '../../../..')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'apps/asyra-design/flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) =>
    entry.id === (process.env.FLOW_PROOF_SCENARIO ?? 'baseline')
)
if (!scenario) throw new Error('Unknown execution proof scenario')

// These are the public entries consumed by the unchanged case file. Keep
// isolated execution on source even when workspace dist output is available.
const sourceAliases = [
  ...[
    'utils',
    'core',
    'factory',
    'feature-system',
    'input-system',
    'persistence',
    'props-manager',
    'reactive-events',
    'render',
    'render-engine',
    'render-engine-pixi',
    'scene-tree',
    'selection',
    'system-context',
    'ui-context',
    'collaboration',
    'preset'
  ].map((name) => ({
    find: new RegExp('^@asyra/' + name + '$'),
    replacement: resolve(sourceRoot, 'packages/' + name + '/src/index.ts')
  })),
  {
    find: /^@asyra\/ai-agent-runtime\/node$/,
    replacement: resolve(
      sourceRoot,
      'packages/ai-agent-runtime/src/node/index.ts'
    )
  },
  {
    find: /^@asyra\/ai-agent-runtime$/,
    replacement: resolve(sourceRoot, 'packages/ai-agent-runtime/src/index.ts')
  },
  {
    find: /^@asyra\/preset\/group-bounds$/,
    replacement: resolve(sourceRoot, 'packages/preset/src/group-bounds.ts')
  }
]

export default {
  plugins: [
    {
      name: 'registered-execution-proof-mutation',
      config(config: {
        resolve?: { alias?: { find: string | RegExp; replacement: string }[] }
      }) {
        // Derived execution supplies generic root aliases; public subpaths
        // must precede them and remain in the same captured source.
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
          throw new Error('Execution proof mutation site changed')
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
