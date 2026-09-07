import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const sourceRoot =
  process.env.FLOW_PROOF_SOURCE ?? resolve(import.meta.dirname, '../../../..')
const scenario = process.env.FLOW_PROOF_SCENARIO ?? 'baseline'
const manifest = JSON.parse(
  readFileSync(
    resolve(sourceRoot, 'packages/factory/flow-contracts.json'),
    'utf8'
  )
) as {
  scenarios: {
    id: string
    mutation?: { file: string; from: string; to: string }
  }[]
}
const selected = manifest.scenarios.find((item) => item.id === scenario)
if (!selected) throw new Error('Unknown proof scenario')
const mutation = selected.mutation
if (mutation && mutation.file !== 'packages/factory/src/data-transact.ts')
  throw new Error(
    'Negative proof may transform only its declared runtime owner'
  )

export default defineConfig({
  plugins: [
    {
      name: 'proof-runtime-scenario',
      enforce: 'pre',
      resolveId(id) {
        // Declared aliases run before this hook. Never fall through to a
        // workspace package's mutable dist output for an unknown dependency.
        if (id.startsWith('@asyra/'))
          throw new Error('Uncaptured source dependency: ' + id)
      },
      transform(code, id) {
        if (!mutation || id !== resolve(sourceRoot, mutation.file)) return
        const original = mutation.from
        if (code.split(original).length !== 2)
          throw new Error('Negative proof mutation site changed')
        return {
          code: code.replace(original, mutation.to),
          map: null
        }
      }
    }
  ],
  resolve: {
    alias: [
      {
        find: /^@asyra\/persistence$/,
        replacement: resolve(sourceRoot, 'packages/persistence/src/index.ts')
      },
      {
        find: /^@asyra\/utils$/,
        replacement: resolve(sourceRoot, 'packages/utils/src/index.ts')
      },
      {
        find: /^@asyra\/reactive-events$/,
        replacement: resolve(
          sourceRoot,
          'packages/reactive-events/src/index.ts'
        )
      },
      {
        find: /^@asyra\/factory$/,
        replacement: resolve(sourceRoot, 'packages/factory/src/index.ts')
      }
    ]
  },
  test: {
    environment: 'node',
    include: [
      resolve(sourceRoot, 'packages/factory/src/__tests__/flow-proof.test.ts')
    ],
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
