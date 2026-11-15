import { resolveNativeTestExecutable } from './native-client-admission.mjs'
import { publishConversationGroup } from './conversation-publication.mjs'
import { collectConversationCases } from './conversation-collection.mjs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import {
  conversationGroups,
  captureConversationGroup,
  validateConversationEvidence,
  validateRequiredHandoffs
} from './conversation-scope.mjs'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const {
  resolveProject
} = require('../../../tools/flow-inspector/flow-files/project.cjs')
const {
  capture,
  normalize,
  publish
} = require('../../../tools/flow-inspector/flow-files/adapters.cjs')
const {
  openProject
} = require('../../../tools/flow-inspector/flow-files/store.cjs')
const {
  completeReportIssues
} = require('../../../tools/flow-inspector/control-plane/runner-report.cjs')
const {
  normalizeNodeEvents
} = require('../../../tools/flow-inspector/control-plane/node-results.cjs')
const {
  normalizeReport
} = require('../../../tools/flow-inspector/control-plane/playwright-results.cjs')
const {
  loadContract
} = require('../../../tools/flow-inspector/control-plane/contracts.cjs')
const {
  runProcess
} = require('../../../tools/flow-inspector/control-plane/runner.cjs')
const projectFlag = process.argv.indexOf('--project')

if (projectFlag !== -1 && !process.argv[projectFlag + 1]) {
  throw Error('Missing explicit project configuration')
}

const project = resolveProject(
  projectFlag === -1
    ? join(root, 'conversation-flow-inspector.config.json')
    : process.argv[projectFlag + 1],
  root
)

if (project.root !== root) {
  throw Error(
    'Conversation verification must use this checkout as its project root'
  )
}

const groups = conversationGroups(root)
const expected = capture(project).cases.map((item) => item.selector)
const requiredFiles = [...new Set(expected.map((item) => item.file))]
const selected = new Set(groups.flatMap((group) => group.files))
const absent = requiredFiles.filter((file) => !selected.has(file))

if (absent.length) {
  throw Error('Unselected required handoffs: ' + absent.join(', '))
}

if (process.argv.includes('--list')) {
  process.stdout.write(
    JSON.stringify(
      {
        groups,
        requiredHandoffs: expected,
        semanticReview:
          'Independent spec coverage is required; this inventory is not acceptance.'
      },
      null,
      2
    ) + '\n'
  )
} else {
  await execute()
}

async function execute() {
  const nativeExecutable = resolveNativeTestExecutable()

  if (!nativeExecutable) {
    throw Error(
      'Complete conversation verification requires NATIVE_DELIVERY_CODEX; skipped native evidence cannot pass'
    )
  }

  mkdirSync(join(root, 'tmp'), { recursive: true })
  const output = mkdtempSync(join(root, 'tmp/conversation-proof-'))
  const runs = [],
    observations = [],
    issues = []
  const interruption = new globalThis.AbortController()

  const stop = () =>
    interruption.abort(new Error('Conversation verification cancelled'))

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  const save = (name, value) =>
    writeFileSync(join(output, name), JSON.stringify(value, null, 2) + '\n')

  save('selection.json', { groups, requiredHandoffs: expected })

  const run = async (id, command, args, cwd, stdout, environment = {}) => {
    interruption.signal.throwIfAborted()
    const startedAt = new Date().toISOString()
    const log = createWriteStream(stdout ?? join(output, id + '.log'))
    const errorLog = createWriteStream(join(output, id + '.stderr.log'))

    interruption.signal.throwIfAborted()
    const entry = { id, command, args, cwd, startedAt }
    const completed = await runProcess({
      executable: command,
      args,
      cwd: resolve(root, cwd),
      env: { ...process.env, ...environment },
      signal: interruption.signal,
      // These are verification-process guards, not model/report limits.
      timeoutMs: 30 * 60 * 1000,
      maxOutputBytes: 128 * 1024 * 1024,
      stdout: log,
      stderr: errorLog,

      onSpawn: (pid) => {
        entry.pid = pid
        runs.push(entry)
        save('processes.json', runs)
      }
    })
    const { output: diagnostic, ...result } = completed

    if (result.reason && !result.error) {
      result.error = diagnostic.slice(-4096)
    }

    await Promise.all([
      new Promise((accept) => log.end(accept)),
      new Promise((accept) => errorLog.end(accept))
    ])
    Object.assign(entry, result, { finishedAt: new Date().toISOString() })
    save('processes.json', runs)
    if (result.reason) {
      throw Error(`Verification process ${id}: ${result.reason}`)
    }

    interruption.signal.throwIfAborted()

    return result
  }

  try {
    const scopeAdmission = await run(
      'scope-admission',
      process.execPath,
      [
        '--test',
        'apps/asyra-design/scripts/__tests__/conversation-scope.test.mjs'
      ],
      '.'
    )

    if (scopeAdmission.code !== 0) {
      throw Error(
        'Conversation scope admission failed before product verification'
      )
    }

    const graph = JSON.parse(
      readFileSync(join(root, 'turbo.json'), 'utf8')
    ).tasks
    const buildOrder = [],
      seen = new Set()

    const visit = (key) => {
      if (seen.has(key)) {
        return
      }

      if (!graph[key]) {
        throw Error('Missing generated build task: ' + key)
      }

      seen.add(key)
      for (const dependency of graph[key].dependsOn ?? []) {
        visit(dependency)
      }

      if (key !== '@asyra/asyra-design#react:build') {
        buildOrder.push(key)
      }
    }

    visit('@asyra/asyra-design#react:build')
    save('build-order.json', buildOrder)
    for (const [index, key] of buildOrder.entries()) {
      const [workspace, task] = key.split('#')
      const directory = 'packages/' + workspace.slice('@asyra/'.length)
      const manifest = JSON.parse(
        readFileSync(join(root, directory, 'package.json'), 'utf8')
      )

      if (
        manifest.name !== workspace ||
        !manifest.scripts.clean ||
        !manifest.scripts[task]
      ) {
        throw Error('Missing owner clean/build contract: ' + workspace)
      }

      process.stdout.write('Building ' + workspace + '\n')
      for (const action of ['clean', task]) {
        const result = await run(
          'build-' + index + '-' + action,
          'yarn',
          ['workspace', workspace, action],
          '.'
        )

        if (result.code !== 0) {
          throw Error('Build prerequisite failed: ' + workspace + ': ' + action)
        }
      }
    }

    const largeDocumentFixture =
      'apps/asyra-design/e2e/fixtures/large-document/document.json.gz'

    if (!existsSync(join(root, largeDocumentFixture))) {
      // Use the maintained fixture preparation procedure. Its consumers verify
      // the decompressed bytes against the committed manifest before use.
      const prepared = await run(
        'prepare-large-document',
        '/bin/sh',
        [
          '-c',
          'unzip -p apps/asyra-design/e2e/fixtures/large-document/Taipei-101-full-document.zip document.json | gzip > apps/asyra-design/e2e/fixtures/large-document/document.json.gz'
        ],
        '.'
      )

      if (prepared.code !== 0) {
        throw Error('Large-document fixture preparation failed')
      }
    }

    const sourceRoots = [
      'apps/asyra-design',
      'packages',
      'domain-knowledge',
      'tools/flow-inspector',
      'docs/ai/apps/asyra-design/specs',
      'docs/ai/apps/asyra-design/plans/completed/ai-conversational-drawing-performance-plan.md',
      'docs/ai/apps/asyra-design/bdd-features/ai-conversational-drawing-performance.feature',
      'docs/ai/framework/packages/ai-agent-runtime.md',
      'scripts/__tests__/domain-knowledge.test.mjs',
      'yarn.lock',
      'tsconfig.json',
      'turbo.json',
      'conversation-flow-inspector.config.json'
    ]

    const sourceSnapshot = () => {
      const files = execFileSync(
        'git',
        [
          'ls-files',
          '--cached',
          '--others',
          '--exclude-standard',
          '-z',
          '--',
          ...sourceRoots
        ],
        { cwd: root }
      )
        .toString()
        .split('\0')
        .filter(Boolean)
        .concat(largeDocumentFixture)
        .filter(
          (file) => existsSync(join(root, file)) && !file.endsWith('.flow.json')
        )
        .sort()

      return files.map((file) => [
        file,
        createHash('sha256')
          .update(readFileSync(join(root, file)))
          .digest('hex')
      ])
    }

    const compiledSnapshot = () => {
      const walk = (directory) =>
        readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
          const file = join(directory, entry.name)

          return entry.isDirectory()
            ? walk(file)
            : [
                [
                  relative(root, file),
                  createHash('sha256').update(readFileSync(file)).digest('hex')
                ]
              ]
        })

      return buildOrder
        .flatMap((key) =>
          walk(
            join(
              root,
              'packages',
              key.split('#')[0].slice('@asyra/'.length),
              'dist'
            )
          )
        )
        .sort((a, b) => a[0].localeCompare(b[0]))
    }

    const before = {
      sources: sourceSnapshot(),
      compiled: compiledSnapshot(),
      definition: openProject(project.directory)
        .snapshot()
        .documents.map((doc) => doc.definition)
    }

    save('source-before.json', before)
    const fixtureTypes = await run(
      'fixture-types',
      'yarn',
      [
        'tsc',
        '--noEmit',
        '-p',
        'apps/asyra-design/tsconfig.conversation-verification.json'
      ],
      '.'
    )

    if (fixtureTypes.code !== 0) {
      issues.push('Verification fixture type check failed')
    }

    const sourceRevision = createHash('sha256')
      .update(JSON.stringify(before))
      .digest('hex')
    const flowStore = openProject(project.directory)

    for (const document of flowStore.snapshot().documents) {
      for (const node of document.definition.nodes) {
        const current = flowStore
          .snapshot()
          .documents.find((item) => item.flowId === document.flowId)

        flowStore.update(document.flowId, {
          expectedRevision: current.revision,
          kind: 'source',
          value: { nodeId: node.id, revision: sourceRevision }
        })
      }
    }

    for (const group of groups) {
      process.stdout.write(
        'Verifying ' + group.id + ': ' + group.files.length + ' files\n'
      )
      const receipt = captureConversationGroup(project, group)
      const path = join(output, group.id + '.json')
      const startedAt = new Date().toISOString()
      let result,
        report,
        diagnostics = []
      const files = group.files.map((file) =>
        relative(resolve(root, group.cwd), resolve(root, file))
      )

      const environment = {
        E2E_LARGE_DOCUMENT: 'true',
        LOCAL_AI_PROTOCOL_EXECUTABLE: nativeExecutable,
        NATIVE_DELIVERY_CODEX: nativeExecutable,
        RUN_AI_DRAWING_PERFORMANCE: '1',
        RUN_AI_INSPECTION_PERFORMANCE: '1',
        E2E_EXPORT_DOCUMENT: join(
          root,
          'apps/asyra-design/e2e/fixtures/recorded-101/document.fixture.gz'
        )
      }

      if (group.producer === 'playwright') {
        const portOwners = [createServer(), createServer(), createServer()]

        await Promise.all(
          portOwners.map(
            (owner) =>
              new Promise((accept) => owner.listen(0, '127.0.0.1', accept))
          )
        )
        const ports = portOwners.map((owner) => owner.address().port)

        await Promise.all(
          portOwners.map(
            (owner) => new Promise((accept) => owner.close(accept))
          )
        )
        Object.assign(environment, {
          APP_URL: `http://127.0.0.1:${ports[0]}`,
          COLLABORATION_WS_PORT: String(ports[1]),
          E2E_DOCUMENT_BACKEND_URL: `http://127.0.0.1:${ports[2]}`,
          VITE_COLLABORATION_WS_URL: `ws://127.0.0.1:${ports[1]}/collaboration`
        })
      }

      const requiredCases = await collectConversationCases({
        root,
        group,
        output,
        run,
        environment
      })

      if (group.producer === 'node') {
        const eventsPath = join(output, group.id + '.events.jsonl')

        result = await run(
          group.id,
          process.execPath,
          [
            '--test',
            '--test-concurrency=1',
            '--test-reporter=./tools/flow-inspector/control-plane/node-test-reporter.mjs',
            ...files
          ],
          group.cwd,
          eventsPath,
          environment
        )
        const events = readFileSync(eventsPath, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
        const normalized = normalizeNodeEvents(events, {
          files,
          cwd: resolve(root, group.cwd)
        })

        report = normalized.report
        diagnostics = normalized.errors
      } else if (group.producer === 'vitest') {
        result = await run(
          group.id,
          join(root, 'node_modules/.bin/vitest'),
          [
            'run',
            '--config',
            join(root, group.config),
            '--environment',
            group.environment,
            '--no-file-parallelism',
            '--reporter=json',
            '--outputFile=' + path,
            ...files
          ],
          group.cwd,
          undefined,
          environment
        )
        report = JSON.parse(readFileSync(path, 'utf8'))
      } else {
        const configFile = group.config
        const configDigest = createHash('sha256')
          .update(readFileSync(join(root, configFile)))
          .digest('hex')

        result = await run(
          group.id,
          join(root, 'node_modules/.bin/playwright'),
          [
            'test',
            '--config=' + join(root, group.config),
            '--output=' + join(output, 'browser-artifacts'),
            '--project=chromium',
            '--workers=1',
            '--reporter=json',
            ...files
          ],
          group.cwd,
          path,
          environment
        )
        const original = JSON.parse(readFileSync(path, 'utf8'))
        const normalized = normalizeReport(
          root,
          {
            startedAt,
            executionConfig: {
              originalConfigFile: 'apps/asyra-design/playwright.config.ts',
              path: configFile,
              digest: configDigest
            },
            contracts: [
              'apps/asyra-design/playwright-flow-contracts.json',
              'apps/asyra-design/playwright-functional-flow-contracts.json'
            ].map((file) => loadContract(root, undefined, file))
          },
          original
        )

        report = normalized.report
        diagnostics = normalized.options.errors
      }

      const scope = {
        producer: group.producer,
        cwd: group.cwd,
        config: group.config,
        project: group.producer === 'playwright' ? 'chromium' : ''
      }

      diagnostics.push(
        ...completeReportIssues(report, {
          root,
          requiredFiles: group.files,
          requiredCases
        })
      )
      if (result.code !== 0 || result.exitSignal) {
        diagnostics.push('Runner exit: ' + JSON.stringify(result))
      }

      const required = expected.filter((item) =>
        group.files.includes(item.file)
      )

      const records = normalize(project, report, {
        ...scope,
        producer: group.producer === 'playwright' ? 'vitest' : group.producer
      }).map((record) => ({
        ...record,
        selector: { ...record.selector, producer: group.producer }
      }))

      diagnostics.push(...validateRequiredHandoffs(required, records))
      const declared = records.filter((record) =>
        required.some(
          (item) =>
            item.file === record.selector.file &&
            item.title === record.selector.title
        )
      )

      observations.push(...records)
      save(group.id + '-normalized.json', report)
      issues.push(...diagnostics.map((issue) => group.id + ': ' + issue))
      publishConversationGroup({
        project,
        receipt,
        records: declared,
        issues: diagnostics,
        artifact: join(output, group.id + '-issues.json')
      })
      process.stdout.write(
        group.id +
          ': ' +
          (diagnostics.length
            ? diagnostics.length + ' findings'
            : 'execution passed') +
          '\n'
      )
    }

    const after = {
      sources: sourceSnapshot(),
      compiled: compiledSnapshot(),
      definition: openProject(project.directory)
        .snapshot()
        .documents.map((doc) => doc.definition)
    }

    save('source-after.json', after)
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      const reason =
        'Source, compiled exports or required definitions changed during verification'

      issues.push(reason)
      publish(project, capture(project), [], reason)
    }

    issues.push(...validateRequiredHandoffs(expected, observations))
  } catch (error) {
    issues.push(error.stack ?? String(error))
    publish(
      project,
      capture(project),
      [],
      'Verification interrupted: ' + error.message
    )
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
    const evaluation = openProject(project.directory).snapshot().evaluation

    issues.push(...validateConversationEvidence(evaluation))

    save('summary.json', {
      executionStatus: issues.length ? 'failed-or-incomplete' : 'passed',
      issues,
      evaluation,
      output,
      note: 'Execution success does not accept the independent spec-coverage review.'
    })
    process.stdout.write('Evidence: ' + output + '\n')
    const complete = evaluation.flows.every((flow) => flow.status === 'done')

    process.exitCode = complete ? 0 : 2
    if (issues.length) {
      process.exitCode = 1
    }
  }
}
