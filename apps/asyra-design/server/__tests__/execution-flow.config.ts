import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The source proof runs only its explicitly mapped product cases. It never
// launches a live model or changes the normal App test configuration.
const sourceRoot = process.env.FLOW_PROOF_SOURCE
if (!sourceRoot) throw new Error('Missing captured proof source')
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'apps/asyra-design/flow-contracts.json'),
    'utf8'
  )
)
const scenario = manifest.scenarios.find(
  (entry: { id: string }) => entry.id === process.env.FLOW_PROOF_SCENARIO
)
if (!scenario) throw new Error('Unknown execution proof scenario')

export default {
  plugins: [
    {
      name: 'registered-execution-proof-mutation',
      // The generic captured-workspace alias maps the root entry only. This
      // public Node subpath must resolve to the same captured package source.
      config(config: {
        resolve?: { alias?: { find: string; replacement: string }[] }
      }) {
        config.resolve?.alias?.unshift({
          find: '@asyra/ai-agent-runtime/node',
          replacement: resolve(
            sourceRoot,
            'packages/ai-agent-runtime/src/node/index.ts'
          )
        })
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
  test: {
    environment: 'node',
    include: [resolve(sourceRoot, manifest.testFile)],
    fileParallelism: false
  }
}
