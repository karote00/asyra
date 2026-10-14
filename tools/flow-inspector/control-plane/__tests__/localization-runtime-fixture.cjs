/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { captureSource } = require('../snapshot.cjs')
const { loadContract } = require('../contracts.cjs')
const { runProcess, runnerEnvironment } = require('../runner.cjs')
const {
  createObservationReader,
  observationDirectory
} = require('../localization.cjs')
const root = path.resolve(__dirname, '../../../..')
function localizationFixture() {
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/localization-runtime-')
  )
  const initial = captureSource(
    root,
    path.join(directory, 'capture'),
    loadContract(root)
  )
  const repository = path.join(directory, 'repository')
  fs.cpSync(initial.sourceRoot, repository, { recursive: true })
  fs.cpSync(
    path.join(root, 'apps/asyra-design/src'),
    path.join(repository, 'apps/asyra-design/src'),
    { recursive: true }
  )
  for (const file of [
    'apps/asyra-design/undo-redo-flow-contracts.json',
    'apps/asyra-design/vite.config.ts',
    'tools/flow-inspector/inspectors/history-shortcut-flow-inspector.data.cjs',
    'docs/ai/apps/asyra-design/features/undo-redo.md'
  ]) {
    fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true })
    fs.copyFileSync(path.join(root, file), path.join(repository, file))
  }
  // The proof sandbox contains executable runtime inputs; ordinary observations
  // also fingerprint declared architecture boundaries outside that runtime.
  for (const contract of [
    loadContract(root),
    loadContract(
      root,
      undefined,
      'apps/asyra-design/undo-redo-flow-contracts.json'
    )
  ]) {
    for (const step of contract.runtimeScope.steps) {
      for (const boundary of step.implementationBoundary) {
        const file = boundary.replace(/\/\*\*$/, '')
        const destination = path.join(repository, file)
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(path.dirname(destination), { recursive: true })
          fs.cpSync(path.join(root, file), destination, { recursive: true })
        }
      }
    }
  }
  const appFile = 'apps/asyra-design/src/features/undo-redo/index.ts',
    factoryFile = 'packages/factory/src/value-clone.ts'
  const originals = new Map(
    [appFile, factoryFile].map((file) => [
      file,
      fs.readFileSync(path.join(repository, file), 'utf8')
    ])
  )
  const config = path.join(directory, 'app.config.mjs')
  fs.writeFileSync(
    config,
    'export default ' +
      JSON.stringify({
        root: repository,
        cacheDir: path.join(directory, 'cache'),
        test: {
          environment: 'jsdom',
          include: [
            path.join(
              repository,
              'apps/asyra-design/src/features/undo-redo/__tests__/feature.test.ts'
            )
          ],
          maxWorkers: 1,
          fileParallelism: false
        }
      })
  )
  const reader = createObservationReader(observationDirectory(repository))
  return {
    directory,
    repository,
    reader,
    mutate(kind) {
      const file = kind === 'app' ? appFile : factoryFile
      const from = kind === 'app' ? 'if (snapshot.keyShift)' : 'return value'
      const to =
        kind === 'app'
          ? 'if (!snapshot.keyShift)'
          : "return typeof value === 'number' ? value + 1 : value"
      const text = originals.get(file)
      assert.ok(text.includes(from))
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), text.replace(from, to))
    },
    restore() {
      for (const [file, text] of originals) {
        fs.chmodSync(path.join(repository, file), 0o600)
        fs.writeFileSync(path.join(repository, file), text)
      }
    },
    async run(kind, args = []) {
      const tmp = path.join(directory, 'tmp')
      fs.mkdirSync(tmp, { recursive: true })
      const result = await runProcess({
        executable: process.execPath,
        args: [
          require.resolve('vitest/vitest.mjs'),
          'run',
          '--config',
          kind === 'app'
            ? config
            : path.join(
                repository,
                'packages/factory/src/__tests__/flow-proof.config.ts'
              ),
          '--reporter=default',
          '--reporter=' +
            path.join(
              root,
              'tools/flow-inspector/control-plane/vitest-reporter.mjs'
            ),
          ...args
        ],
        cwd: repository,
        env: {
          ...runnerEnvironment(repository, 'baseline', tmp),
          FLOW_LOCALIZATION_ROOT: repository
        },
        timeoutMs: 30000
      })
      fs.writeFileSync(
        path.join(directory, kind + '-' + Date.now() + '.log'),
        result.output
      )
      assert.equal(result.reason, null, result.output)
      const latest = reader.list().runs[0]
      assert.ok(latest, result.output)
      const record = reader.get(latest.id)
      assert.equal(record.phase, 'completed', result.output)
      return { result, record }
    }
  }
}
module.exports = { localizationFixture }
