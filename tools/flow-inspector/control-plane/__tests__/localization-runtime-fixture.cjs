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
  const executionContract = loadContract(
    root,
    undefined,
    'apps/asyra-design/flow-contracts.json'
  )
  const executionSource = captureSource(
    root,
    path.join(directory, 'execution-capture'),
    executionContract
  )
  fs.cpSync(executionSource.sourceRoot, repository, {
    recursive: true,
    force: false
  })
  fs.cpSync(
    path.join(root, 'apps/asyra-design/src'),
    path.join(repository, 'apps/asyra-design/src'),
    { recursive: true, force: false }
  )
  const coverageContract = loadContract(
    root,
    undefined,
    'packages/preset/coverage-flow-contracts.json'
  )
  const vectorContract = loadContract(
    root,
    undefined,
    'packages/preset/navigation-flow-contracts.json'
  )
  const pixiContract = loadContract(
    root,
    undefined,
    'packages/render-engine-pixi/navigation-flow-contracts.json'
  )
  const recipeContract = loadContract(
    root,
    undefined,
    'packages/ai-agent-runtime/flow-contracts.json'
  )
  for (const file of [
    ...[
      'manifestPath',
      'configFile',
      'testFile',
      'architecturePath',
      'specPath'
    ].map((key) => coverageContract[key]),
    ...[
      'manifestPath',
      'configFile',
      'testFile',
      'architecturePath',
      'specPath'
    ].map((key) => vectorContract[key]),
    ...[
      'manifestPath',
      'configFile',
      'testFile',
      'architecturePath',
      'specPath'
    ].map((key) => pixiContract[key]),
    ...[
      'manifestPath',
      'configFile',
      'testFile',
      'architecturePath',
      'specPath'
    ].map((key) => recipeContract[key]),
    'packages/render/navigation-flow-contracts.json',
    'packages/render/src/__tests__/navigation-flow.config.ts',
    'packages/render/src/__tests__/viewport-layer.test.ts',
    'tools/flow-inspector/inspectors/render-engine-boundary-flow-inspector.data.cjs',
    'docs/ai/framework/packages/render.md',
    'docs/ai/framework/plans/completed/render-engine-boundary-plan.md',
    'packages/factory/history-replay-flow-contracts.json',
    'packages/factory/src/__tests__/history-replay.config.ts',
    'packages/factory/src/__tests__/factory-journal-history.test.ts',
    'tools/flow-inspector/inspectors/history-replay-flow-inspector.data.cjs',
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
    coverageContract,
    vectorContract,
    pixiContract,
    recipeContract,
    loadContract(
      root,
      undefined,
      'packages/render/navigation-flow-contracts.json'
    ),
    executionContract,
    loadContract(root),
    loadContract(
      root,
      undefined,
      'packages/factory/history-replay-flow-contracts.json'
    ),
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
        if (
          !fs.existsSync(destination) ||
          fs.statSync(path.join(root, file)).isDirectory()
        ) {
          fs.mkdirSync(path.dirname(destination), { recursive: true })
          fs.cpSync(path.join(root, file), destination, {
            recursive: true,
            force: false
          })
        }
      }
    }
  }
  const appFile = 'apps/asyra-design/src/features/undo-redo/index.ts',
    factoryFile = 'packages/factory/src/value-clone.ts',
    replayFile = 'packages/factory/src/data-transact.ts'
  const originals = new Map(
    [appFile, factoryFile, replayFile].map((file) => [
      file,
      fs.readFileSync(path.join(repository, file), 'utf8')
    ])
  )
  const executionManifest = JSON.parse(
    fs.readFileSync(path.join(root, executionContract.manifestPath), 'utf8')
  )
  for (const scenario of executionManifest.scenarios) {
    const file = scenario.mutation?.file
    if (file) {
      originals.set(file, fs.readFileSync(path.join(repository, file), 'utf8'))
    }
  }
  const recipeManifest = JSON.parse(
    fs.readFileSync(path.join(root, recipeContract.manifestPath), 'utf8')
  )
  for (const scenario of recipeManifest.scenarios) {
    const file = scenario.mutation?.file
    if (file) {
      originals.set(file, fs.readFileSync(path.join(repository, file), 'utf8'))
    }
  }
  const pixiManifest = JSON.parse(
    fs.readFileSync(path.join(root, pixiContract.manifestPath), 'utf8')
  )
  const pixiMutation = pixiManifest.scenarios.find(
    (item) => item.id === 'omit-retention'
  ).mutation
  originals.set(
    pixiMutation.file,
    fs.readFileSync(path.join(repository, pixiMutation.file), 'utf8')
  )
  const vectorManifest = JSON.parse(
    fs.readFileSync(path.join(root, vectorContract.manifestPath), 'utf8')
  )
  const vectorMutation = vectorManifest.scenarios.find(
    (item) => item.id === 'omit-retention'
  ).mutation
  originals.set(
    vectorMutation.file,
    fs.readFileSync(path.join(repository, vectorMutation.file), 'utf8')
  )
  const coverageMutation = JSON.parse(
    fs.readFileSync(path.join(root, coverageContract.manifestPath), 'utf8')
  ).scenarios.find((item) => item.id === 'omit-evenodd').mutation
  originals.set(
    coverageMutation.file,
    fs.readFileSync(path.join(repository, coverageMutation.file), 'utf8')
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
    addHookAssertionFailure() {
      const file = path.join(
        repository,
        'apps/asyra-design/src/features/undo-redo/__tests__/feature.test.ts'
      )
      const original = fs.readFileSync(file, 'utf8')
      fs.writeFileSync(
        file,
        `import { beforeAll } from 'vitest'
        beforeAll(() => {
          const actual = Array.from({ length: 100 }, (_, index) => index)
          const expected = [...actual]
          expected[57] = 9999
          expect(actual, 'localization setup failure').toEqual(expected)
        })
      ` + original
      )
    },
    addAssertionFailures() {
      const file = path.join(
        repository,
        'apps/asyra-design/src/features/undo-redo/__tests__/feature.test.ts'
      )
      fs.appendFileSync(
        file,
        `
        describe('structured evidence', () => {
          it.each([9999, 8888])('retains long assertion differences', (replacement) => {
            const actual = Array.from({ length: 100 }, (_, index) => index)
            const expected = [...actual]
            expected[57] = replacement
            expect.soft(actual).toEqual(expected)
            expect.soft(false).toBe(true)
            expect.soft(undefined).toBe(null)
            expect.soft('').toBe('<img src=x onerror="globalThis.evidenceExecuted=true">')
          })
        })
      `
      )
    },
    mutateCoverage() {
      const { file, from, to } = coverageMutation
      const original = originals.get(file)
      assert.equal(original.split(from).length, 2)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), original.replace(from, to))
    },
    mutateVector() {
      const { file, from, to } = vectorMutation
      const original = originals.get(file)
      assert.equal(original.split(from).length, 2)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), original.replace(from, to))
    },
    failVectorSourceEntry() {
      const file = 'packages/core/src/index.ts'
      const original = fs.readFileSync(path.join(repository, file), 'utf8')
      originals.set(file, original)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(
        path.join(repository, file),
        original + "\nthrow new Error('Captured Core source failed')\n"
      )
    },
    mutatePixi() {
      const { file, from, to } = pixiMutation
      const original = originals.get(file)
      assert.equal(original.split(from).length, 2)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), original.replace(from, to))
    },
    restorePixi() {
      fs.writeFileSync(
        path.join(repository, pixiMutation.file),
        originals.get(pixiMutation.file)
      )
    },
    mutateRecipe(id) {
      const { file, from, to } = recipeManifest.scenarios.find(
        (item) => item.id === id
      ).mutation
      const original = originals.get(file)
      assert.equal(original.split(from).length, 2)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), original.replace(from, to))
    },
    failRecipeSourceEntry() {
      const file = 'packages/ai-agent-runtime/src/recipe-admission.ts'
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(
        path.join(repository, file),
        originals.get(file) +
          "\nthrow new Error('Captured recipe admission failed')\n"
      )
    },
    mutateViewport() {
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(root, 'packages/render/navigation-flow-contracts.json'),
          'utf8'
        )
      )
      const { file, from, to } = manifest.scenarios.find(
        (item) => item.id === 'omit-retention'
      ).mutation
      const original = fs.readFileSync(path.join(repository, file), 'utf8')
      originals.set(file, original)
      assert.equal(original.split(from).length, 2)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(path.join(repository, file), original.replace(from, to))
    },
    failViewportSourceEntry() {
      const file = 'packages/render-engine/src/index.ts'
      const original = fs.readFileSync(path.join(repository, file), 'utf8')
      originals.set(file, original)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(
        path.join(repository, file),
        original + "\nthrow new Error('Captured render engine entry failed')\n"
      )
    },
    mutateReplay(scenario) {
      const contract = JSON.parse(
        fs.readFileSync(
          path.join(
            root,
            'packages/factory/history-replay-flow-contracts.json'
          ),
          'utf8'
        )
      )
      const mutation = contract.scenarios.find(
        (item) => item.id === scenario
      )?.mutation
      assert.ok(mutation)
      const original = originals.get(replayFile)
      assert.equal(original.split(mutation.from).length, 2)
      fs.chmodSync(path.join(repository, replayFile), 0o600)
      fs.writeFileSync(
        path.join(repository, replayFile),
        original.replace(mutation.from, mutation.to)
      )
    },
    failExecutionSourceEntry() {
      const file = 'packages/ai-agent-runtime/src/index.ts'
      const original = fs.readFileSync(path.join(repository, file), 'utf8')
      originals.set(file, original)
      fs.chmodSync(path.join(repository, file), 0o600)
      fs.writeFileSync(
        path.join(repository, file),
        original + "\nthrow new Error('Captured runtime entry failed')\n"
      )
    },
    mutateExecution(scenarioId) {
      const mutation = executionManifest.scenarios.find(
        (item) => item.id === scenarioId
      )?.mutation
      assert.ok(mutation)
      const original = fs.readFileSync(
        path.join(repository, mutation.file),
        'utf8'
      )
      assert.equal(original.split(mutation.from).length, 2)
      fs.chmodSync(path.join(repository, mutation.file), 0o600)
      fs.writeFileSync(
        path.join(repository, mutation.file),
        original.replace(mutation.from, mutation.to)
      )
    },
    mutate(kind) {
      const file = kind === 'app' ? appFile : factoryFile
      const from = kind === 'app' ? "if (direction === 'redo')" : 'return value'
      const to =
        kind === 'app'
          ? "if (direction === 'undo')"
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
      let configFile = path.join(
        repository,
        'packages/factory/src/__tests__/flow-proof.config.ts'
      )
      if (kind === 'coverage') {
        configFile = path.join(repository, coverageContract.configFile)
      }
      if (kind === 'vector') {
        configFile = path.join(repository, vectorContract.configFile)
      }
      if (kind === 'pixi') {
        configFile = path.join(repository, pixiContract.configFile)
      }
      if (kind === 'recipe') {
        configFile = path.join(repository, recipeContract.configFile)
      }
      if (kind === 'history') {
        configFile = path.join(
          repository,
          'packages/factory/src/__tests__/history-replay.config.ts'
        )
      }
      if (kind === 'viewport') {
        configFile = path.join(
          repository,
          'packages/render/src/__tests__/navigation-flow.config.ts'
        )
      }
      if (kind === 'app') {
        configFile = config
      }
      if (kind === 'execution') {
        configFile = path.join(repository, executionContract.configFile)
      }
      const result = await runProcess({
        executable: process.execPath,
        args: [
          require.resolve('vitest/vitest.mjs'),
          'run',
          '--config',
          configFile,
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
