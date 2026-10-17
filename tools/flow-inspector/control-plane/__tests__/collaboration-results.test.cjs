/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { admitContract, loadContract } = require('../contracts.cjs')
const root = path.resolve(__dirname, '../../../..')
const manifestPath =
  'apps/asyra-design/playwright-collaboration-flow-contracts.json'
const manifest = require('../../../../apps/asyra-design/playwright-collaboration-flow-contracts.json')
const architecture = require('../../inspectors/design-collaboration-flow-inspector.data.cjs')

test('collaboration admission requires bounded participant counts and exact observation inputs', () => {
  const admitted = admitContract(manifest, architecture)
  assert.equal(admitted.cases.length, 22)
  for (const count of [0, -1, 1.5, '2', null]) {
    const changed = structuredClone(manifest)
    changed.flows[0].cases[0].minimumParticipants = count
    assert.throws(() => admitContract(changed, architecture), /participant/)
  }
  for (const file of [
    '../secret',
    '/tmp/secret',
    'apps/**',
    'apps/./test.ts'
  ]) {
    const changed = structuredClone(manifest)
    changed.observationInputs = [file]
    assert.throws(
      () => admitContract(changed, architecture),
      /observation input/
    )
  }
  assert.deepEqual(admitted.observationInputs, manifest.observationInputs)
})

test('the collaboration configuration inventory has exactly one declared case per original test', () => {
  const { spawnSync } = require('node:child_process')
  const run = spawnSync(
    process.execPath,
    [
      'node_modules/playwright/cli.js',
      'test',
      '--config',
      manifest.configFile,
      '--list',
      '--reporter=json'
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: '',
        PLAYWRIGHT_JSON_OUTPUT_FILE: ''
      }
    }
  )
  assert.equal(run.status, 0, run.stderr)
  const report = JSON.parse(run.stdout)
  assert.deepEqual(report.errors, [])
  const actual = report.suites.flatMap((suite) =>
    suite.specs.flatMap((spec) =>
      spec.tests.map((item) => [
        'apps/asyra-design/e2e/' + spec.file,
        spec.title,
        item.projectName
      ])
    )
  )
  const contract = loadContract(root, undefined, manifestPath)
  assert.deepEqual(
    actual.sort(),
    contract.cases.map((c) => [c.testFile, c.testName, c.projectName]).sort()
  )
  assert.equal(actual.length, 22)
  for (const item of contract.cases)
    for (const entry of item.implementationPaths)
      assert.ok(fs.existsSync(path.join(root, entry)))
})

function collaborationReport() {
  const contract = loadContract(root, undefined, manifestPath)
  const item = contract.cases.find((c) => c.minimumParticipants === 2)
  const context = {
    id: 'original-run',
    startedAt: '2026-01-01T00:00:00Z',
    contracts: [contract]
  }
  const attachment = (actorId) => ({
    name: 'collaboration-participant',
    contentType: 'application/json',
    body: Buffer.from(
      JSON.stringify({
        observationId: context.id,
        testId: 'original-test',
        projectName: 'chromium',
        retry: 0,
        identity: { documentId: 'document', roomId: 'room', actorId }
      })
    ).toString('base64')
  })
  const attempt = {
    status: 'passed',
    retry: 0,
    errors: [],
    attachments: [attachment('actor-a'), attachment('actor-b')]
  }
  const entry = {
    projectName: 'chromium',
    expectedStatus: 'passed',
    status: 'expected',
    results: [attempt]
  }
  const report = {
    config: {
      rootDir: path.join(root, 'apps/asyra-design/e2e'),
      configFile: path.join(root, manifest.configFile)
    },
    stats: { startTime: '2026-01-01T00:00:01Z' },
    errors: [],
    suites: [
      {
        title: path.basename(item.testFile),
        specs: [
          {
            id: 'original-test',
            file: path.basename(item.testFile),
            title: item.testName,
            tests: [entry]
          }
        ]
      }
    ]
  }
  return { context, report, attempt, entry }
}

test('collaboration participant identity is bound to original invocation, test, project and retry', () => {
  const { normalizeReport } = require('../playwright-results.cjs')
  const status = (fixture) =>
    normalizeReport(root, fixture.context, fixture.report).report.testResults[0]
      .assertionResults[0].status
  assert.equal(status(collaborationReport()), 'passed')
  for (const key of ['observationId', 'testId', 'projectName', 'retry']) {
    const f = collaborationReport()
    const evidence = JSON.parse(
      Buffer.from(f.attempt.attachments[0].body, 'base64').toString()
    )
    evidence[key] = 'foreign'
    f.attempt.attachments[0].body = Buffer.from(
      JSON.stringify(evidence)
    ).toString('base64')
    assert.equal(status(f), 'unknown', key)
  }
  for (const change of [
    (f) => {
      f.attempt.attachments = []
    },
    (f) => {
      f.attempt.attachments[1] = f.attempt.attachments[0]
    },
    (f) => {
      f.attempt.attachments = {}
    }
  ]) {
    const f = collaborationReport()
    change(f)
    assert.equal(status(f), 'unknown')
  }
  const failed = collaborationReport()
  failed.attempt.status = 'failed'
  failed.attempt.errors = [
    { message: 'original peer assertion', stack: 'original stack' }
  ]
  failed.attempt.attachments = []
  assert.equal(status(failed), 'failed')
  const normalized = normalizeReport(root, failed.context, failed.report)
  assert.ok(
    normalized.options.errors.some((error) => error.includes('participant'))
  )
  assert.equal(
    normalized.options.failureDetails[0][0][0].message,
    'original peer assertion'
  )
})

test('collaboration source cannot borrow functional configuration or erase failed retries', () => {
  const {
    normalizeReport,
    sourceManifestPaths
  } = require('../playwright-results.cjs')
  assert.deepEqual(sourceManifestPaths('collaboration'), [manifestPath])
  const f = collaborationReport()
  f.report.config.configFile = path.join(
    root,
    'apps/asyra-design/playwright.config.ts'
  )
  assert.equal(normalizeReport(root, f.context, f.report).options.stale, true)
  const retry = collaborationReport()
  retry.entry.results.push({
    ...retry.attempt,
    status: 'failed',
    retry: 1,
    errors: [{ message: 'retry failure' }]
  })
  assert.equal(
    normalizeReport(root, retry.context, retry.report).report.testResults[0]
      .assertionResults[0].status,
    'failed'
  )
})

test(
  'original collaboration baseline, source fault and recovery retain actual participants',
  {
    skip: process.env.FLOW_COLLABORATION_PROOF !== 'true',
    timeout: 240000
  },
  async (t) => {
    const { playwrightFixture } = require('./playwright-results-fixture.cjs')
    const fixture = await playwrightFixture(t, { source: 'collaboration' })
    t.diagnostic('Original collaboration evidence: ' + fixture.repository)
    const selected = fixture.cases.find(
      (c) => c.stepId === 'observe-session-state'
    )
    const original = fs.readFileSync(
      path.join(fixture.repository, selected.testFile),
      'utf8'
    )
    const baseline = await fixture.run([selected.id])
    assert.equal(baseline.result.code, 0, baseline.result.output.slice(-3000))
    assert.equal(
      baseline.record.cases[0].status,
      'passed',
      JSON.stringify(baseline.record.issues)
    )
    fixture.faultOperation(
      selected.id,
      'apps/asyra-design/src/collaboration/lifecycle.ts',
      'resolveCollaborationConnectionTransition'
    )
    const fault = await fixture.run([selected.id])
    assert.equal(fault.result.code, 1, fault.result.output.slice(-3000))
    assert.equal(fault.record.cases[0].status, 'failed')
    assert.equal(fault.record.cases[0].locations[0].stepId, selected.stepId)
    fixture.restore()
    const recovery = await fixture.run([selected.id])
    assert.equal(recovery.result.code, 0, recovery.result.output.slice(-3000))
    assert.equal(
      recovery.record.cases[0].status,
      'passed',
      JSON.stringify(recovery.record.issues)
    )
    assert.equal(
      fs.readFileSync(path.join(fixture.repository, selected.testFile), 'utf8'),
      original
    )
  }
)

const sharedFrameworkManifests = [
  ['packages/factory/flow-contracts.json', 9],
  ['packages/factory/history-replay-flow-contracts.json', 14],
  ['packages/render/navigation-flow-contracts.json', 6],
  ['packages/render-engine-pixi/navigation-flow-contracts.json', 27],
  ['packages/preset/navigation-flow-contracts.json', 11],
  ['packages/preset/coverage-flow-contracts.json', 16],
  ['packages/ai-agent-runtime/flow-contracts.json', 4]
]

test(
  'complete selected Framework configurations retain all 87 original case outcomes',
  {
    skip: process.env.FLOW_SHARED_FRAMEWORK_PROOF !== 'true',
    timeout: 240000
  },
  (t) => {
    const { spawnSync } = require('node:child_process')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const reader = createObservationReader(observationDirectory(root))
    for (const [file, count] of sharedFrameworkManifests) {
      const contract = loadContract(root, undefined, file)
      assert.equal(contract.cases.length, count)
      const run = spawnSync(
        process.execPath,
        [
          'node_modules/vitest/vitest.mjs',
          'run',
          '--config',
          contract.configFile,
          '--reporter=default',
          '--reporter=./tools/flow-inspector/control-plane/vitest-reporter.mjs'
        ],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 120000,
          maxBuffer: 1024 * 1024,
          env: {
            ...process.env,
            FLOW_LOCALIZATION_ROOT: root,
            FLOW_LOCALIZATION_MANIFESTS: JSON.stringify([file]),
            FLOW_PROOF_SCENARIO: 'baseline',
            FLOW_PROOF_SOURCE: root
          }
        }
      )
      assert.equal(
        run.status,
        0,
        file + '\n' + run.stdout.slice(-4000) + run.stderr.slice(-2000)
      )
      const id = run.stdout.match(
        /Flow Inspector observation: ([a-f0-9-]+)/
      )?.[1]
      assert.ok(id, run.stdout)
      const record = reader.get(id)
      assert.equal(record.cases.length, count, file)
      assert.deepEqual(record.issues, [], file)
      assert.ok(
        record.cases.every(
          (c) => c.status === 'passed' && c.resolution === 'mapped'
        ),
        file
      )
      t.diagnostic(file + ': ' + count + ' original cases; observation ' + id)
    }
  }
)

for (const proof of [
  {
    name: 'complete original collaboration command records all 22 cases without another diagnostic execution',
    grep: null,
    total: 22,
    passed: 19,
    skipped: 3
  },
  {
    name: 'recreated recovery session retains actual participants through retry and reload',
    grep: 'recovers real edits and Undo Redo after preparation failure',
    total: 1,
    passed: 1,
    skipped: 0
  }
])
  test(
    proof.name,
    {
      skip: process.env.FLOW_COLLABORATION_FULL_PROOF !== 'true',
      timeout: 1900000
    },
    async (t) => {
      const net = require('node:net')
      const { runProcess } = require('../runner.cjs')
      const {
        createObservationReader,
        observationDirectory
      } = require('../localization.cjs')
      const port = async () => {
        const server = net.createServer()
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
        const value = server.address().port
        await new Promise((resolve) => server.close(resolve))
        return value
      }
      const [appPort, backendPort, collaborationPort] = await Promise.all([
        port(),
        port(),
        port()
      ])
      fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
      const directory = fs.mkdtempSync(
        path.join(root, 'tmp/flow-inspector/collaboration-full-')
      )
      const report = path.join(directory, 'original.json')
      t.diagnostic('Complete original collaboration evidence: ' + directory)
      const result = await runProcess({
        executable: '/bin/bash',
        args: [
          'scripts/run-collaboration-e2e.sh',
          '--workers=1',
          ...(proof.grep ? ['--grep', proof.grep] : [])
        ],
        cwd: root,
        env: {
          ...process.env,
          TMPDIR: directory,
          FLOW_CI_REPORT: report,
          E2E_OWN_SERVERS: '1',
          APP_URL: 'http://127.0.0.1:' + appPort,
          COLLABORATION_WS_HOST: '127.0.0.1',
          COLLABORATION_WS_PORT: String(collaborationPort),
          E2E_DOCUMENT_BACKEND_URL: 'http://127.0.0.1:' + backendPort,
          RUN_HIGH_DETAIL_AI_CRDT: '0',
          RUN_HIGH_DETAIL_UNDO_REPRO: '0',
          RUN_AI_CRDT_VIDEO: '0'
        },
        signal: t.signal,
        timeoutMs: 1800000,
        maxOutputBytes: 2 * 1024 * 1024,
        onSpawn: (pid) =>
          fs.writeFileSync(
            path.join(directory, 'process.json'),
            JSON.stringify({ pid, appPort, backendPort, collaborationPort })
          )
      })
      fs.writeFileSync(path.join(directory, 'run.log'), result.output)
      fs.writeFileSync(
        path.join(directory, 'result.json'),
        JSON.stringify(result)
      )
      assert.equal(result.reason, null, result.output.slice(-5000))
      assert.equal(result.code, 0, result.output.slice(-5000))
      const id = JSON.parse(fs.readFileSync(report + '.context.json')).id
      const record = createObservationReader(observationDirectory(root)).get(id)
      assert.equal(record.cases.length, proof.total)
      assert.ok(
        record.cases.every((item) => item.resolution === 'mapped'),
        JSON.stringify(record.issues)
      )
      assert.equal(
        record.cases.filter((item) => item.status === 'passed').length,
        proof.passed,
        JSON.stringify(record.issues)
      )
      assert.equal(
        record.cases.filter((item) => item.status === 'skipped').length,
        proof.skipped
      )
      assert.ok(
        !record.issues.some((issue) =>
          /participant|stale|configuration/.test(issue)
        ),
        JSON.stringify(record.issues)
      )
    }
  )

const collaborationOwnerRoutes = [
  [
    'recover-document-session',
    'does not replay a prior-generation removal after document Reset',
    'apps/asyra-design/src/collaboration/lifecycle.ts',
    'resetCollaborationDocument'
  ],
  [
    'publish-history-members',
    '16-item server response publishes each finite member with one Undo and Redo entry',
    'packages/factory/src/data-transact.ts',
    'withHistoryGroup'
  ],
  [
    'apply-remote-publication',
    'partial Fill updates preserve computed and UI fields on both peers through Undo and Redo',
    'apps/asyra-design/src/collaboration/operations.ts',
    'organizeRemotePublication'
  ],
  [
    'forward-live-publication',
    'mouse-down create and drag frames reach peer canonical state before pointer-up',
    'apps/asyra-design/src/collaboration/factory-adapter.ts',
    {
      from: 'if (deliveries.length === 0) return',
      to: 'if (deliveries.length >= 0) return'
    }
  ]
]
for (const [step, name, file, operation] of collaborationOwnerRoutes)
  test(
    'original collaboration owner route - ' + step,
    {
      skip: process.env.FLOW_COLLABORATION_PROOF !== 'true',
      timeout: 240000
    },
    async (t) => {
      const { playwrightFixture } = require('./playwright-results-fixture.cjs')
      const fixture = await playwrightFixture(t, {
        source: 'collaboration',
        isolateWorkspaces: file.startsWith('packages/')
      })
      const item = fixture.cases.find((c) => c.testName === name)
      assert.equal(item.stepId, step)
      const unchanged = fs.readFileSync(
        path.join(fixture.repository, item.testFile),
        'utf8'
      )
      t.diagnostic('Original owner evidence: ' + fixture.repository)
      const verify = (run, status, code) => {
        assert.equal(run.result.reason, null, run.result.output.slice(-3500))
        assert.equal(run.result.code, code, run.result.output.slice(-3500))
        assert.equal(
          run.record.cases[0].status,
          status,
          JSON.stringify(run.record.issues)
        )
        assert.equal(run.record.cases[0].locations[0].stepId, step)
        assert.equal(
          fs.readFileSync(path.join(fixture.repository, item.testFile), 'utf8'),
          unchanged
        )
      }
      verify(await fixture.run([item.id]), 'passed', 0)
      if (typeof operation === 'string')
        fixture.faultOperation(item.id, file, operation)
      else fixture.faultCase(item.id, { file, ...operation })
      const fault = await fixture.run([item.id])
      verify(fault, 'failed', 1)
      fixture.restore()
      verify(await fixture.run([item.id]), 'passed', 0)
      const {
        createObservationReader,
        observationDirectory
      } = require('../localization.cjs')
      assert.deepEqual(
        createObservationReader(observationDirectory(fixture.repository)).get(
          fault.record.id
        ),
        fault.record
      )
    }
  )

test('the complete collaboration report fits its bounded producer budget while oversized reports remain unavailable', () => {
  const { begin, complete } = require('../playwright-results.cjs')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/collaboration-capacity-')
  )
  const reportPath = path.join(directory, 'original.json')
  const context = begin(root, reportPath, {}, undefined, 'collaboration')
  const f = collaborationReport()
  f.report.stats.startTime = new Date().toISOString()
  for (const attachment of f.attempt.attachments) {
    const value = JSON.parse(Buffer.from(attachment.body, 'base64').toString())
    value.observationId = context.id
    attachment.body = Buffer.from(JSON.stringify(value)).toString('base64')
  }
  f.report.metadata = { originalDiagnostic: 'x'.repeat(5 * 1024 * 1024) }
  fs.writeFileSync(reportPath, JSON.stringify(f.report))
  const record = complete(root, reportPath)
  assert.equal(record.cases.length, 1, JSON.stringify(record.issues))
  assert.equal(record.cases[0].status, 'passed', JSON.stringify(record.issues))
  assert.equal(
    record.report.metadata.originalDiagnostic.length,
    5 * 1024 * 1024
  )
  const oversized = path.join(directory, 'oversized.json')
  begin(root, oversized, {}, undefined, 'collaboration')
  fs.writeFileSync(oversized, '')
  fs.truncateSync(oversized, 32 * 1024 * 1024 + 1)
  const unavailable = complete(root, oversized)
  assert.equal(unavailable.cases.length, 0)
  assert.ok(unavailable.issues.some((issue) => issue.includes('32 MiB')))
})

test(
  'historical complete collaboration report preserves captured mapping and participant outcomes without claiming current source',
  {
    skip: !process.env.FLOW_COLLABORATION_RETAINED_REPORT
  },
  () => {
    const { normalizeReport } = require('../playwright-results.cjs')
    const {
      localizeReport,
      saveObservation,
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const { safePath } = require('../snapshot.cjs')
    const reportPath = safePath(
      root,
      process.env.FLOW_COLLABORATION_RETAINED_REPORT
    )
    const id = JSON.parse(fs.readFileSync(reportPath + '.context.json')).id
    const retained = createObservationReader(observationDirectory(root)).get(id)
    assert.ok(retained.source)
    assert.equal(
      require('node:crypto')
        .createHash('sha256')
        .update(JSON.stringify(retained.source.files))
        .digest('hex'),
      retained.source.digest
    )
    const original = JSON.parse(fs.readFileSync(reportPath))
    const context = {
      format: 1,
      id: retained.id,
      startedAt: retained.startedAt,
      head: retained.head,
      source: retained.source,
      contracts: retained.contracts,
      command: retained.command,
      issues: []
    }
    const normalized = normalizeReport(root, context, original)
    assert.equal(normalized.options.stale, false)
    const corrected = localizeReport(
      root,
      context,
      normalized.report,
      normalized.options
    )
    assert.equal(corrected.cases.length, 17)
    assert.ok(corrected.cases.every((item) => item.resolution === 'mapped'))
    assert.equal(
      corrected.cases.filter((item) => item.status === 'passed').length,
      14,
      JSON.stringify(corrected.issues)
    )
    assert.equal(
      corrected.cases.filter((item) => item.status === 'skipped').length,
      3
    )
    assert.ok(
      !corrected.issues.some((issue) =>
        /participant|stale|configuration/.test(issue)
      ),
      JSON.stringify(corrected.issues)
    )
    const replay = fs.mkdtempSync(
      path.join(root, 'tmp/flow-inspector/historical-replay-')
    )
    saveObservation(replay, corrected)
    assert.deepEqual(createObservationReader(replay).get(id), corrected)
    assert.deepEqual(
      createObservationReader(observationDirectory(root)).get(id),
      retained
    )
  }
)

test('collaboration command finalizes once and preserves original failure and termination exits', () => {
  const { spawnSync } = require('node:child_process')
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/collaboration-shell-')
  )
  const bin = path.join(directory, 'bin')
  fs.mkdirSync(bin)
  fs.writeFileSync(
    path.join(bin, 'node'),
    `#!/bin/bash
if [ "$1" = tools/flow-inspector/control-plane/playwright-results.cjs ]; then
  echo "$2|$3" >> "$SHELL_OBSERVATION_LOG"
  if [ "$2" = begin ]; then echo '{"id":"original-run"}' > "$3.context.json"; fi
  exit 0
fi
exec '${process.execPath}' "$@"
`,
    { mode: 0o755 }
  )
  fs.writeFileSync(
    path.join(bin, 'yarn'),
    `#!/bin/bash
echo "runner|$PLAYWRIGHT_JSON_OUTPUT_NAME|$FLOW_OBSERVATION_ID" >> "$SHELL_OBSERVATION_LOG"
if [ "$SHELL_OBSERVATION_MODE" = terminate ]; then kill -TERM "$PPID"; exit 0; fi
exit 42
`,
    { mode: 0o755 }
  )
  for (const [mode, code] of [
    ['failure', 42],
    ['terminate', 143]
  ]) {
    const report = path.join(directory, mode + ' report.json')
    const log = report + '.log'
    const result = spawnSync(
      '/bin/bash',
      ['scripts/run-collaboration-e2e.sh'],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: 8192,
        env: {
          ...process.env,
          PATH: bin + path.delimiter + process.env.PATH,
          FLOW_CI_REPORT: path.relative(root, report),
          SHELL_OBSERVATION_LOG: log,
          SHELL_OBSERVATION_MODE: mode
        }
      }
    )
    assert.equal(result.status, code, result.stdout + result.stderr)
    assert.deepEqual(fs.readFileSync(log, 'utf8').trim().split('\n'), [
      'begin|' + report,
      'runner|' + report + '|original-run',
      'complete|' + report
    ])
  }
})

test(
  'one shared Factory fault localizes original collaboration and Framework consumers independently',
  {
    skip: process.env.FLOW_COLLABORATION_SHARED_PROOF !== 'true',
    timeout: 240000
  },
  async (t) => {
    assert.ok(
      process.env.FLOW_PROOF_URL,
      'Set FLOW_PROOF_URL before the shared Board proof'
    )
    const { playwrightFixture } = require('./playwright-results-fixture.cjs')
    const { runProcess } = require('../runner.cjs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const fixture = await playwrightFixture(t, {
      source: 'collaboration',
      isolateWorkspaces: true
    })
    const selected = fixture.cases.find(
      (c) => c.stepId === 'publish-history-members'
    )
    const frameworkPath = 'packages/factory/flow-contracts.json'
    const framework = loadContract(root, undefined, frameworkPath)
    for (const {
      path: file
    } of require('../localization.cjs').sourceFingerprint(root, [framework])
      .files) {
      const destination = path.join(fixture.repository, file)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.cpSync(path.join(root, file), destination, { recursive: true })
    }
    const reader = createObservationReader(
      observationDirectory(fixture.repository)
    )
    const runFramework = async () => {
      const result = await runProcess({
        executable: process.execPath,
        args: [
          path.join(root, 'node_modules/vitest/vitest.mjs'),
          'run',
          '--config',
          path.join(fixture.repository, framework.configFile),
          '--reporter=default',
          '--reporter=' +
            path.join(
              root,
              'tools/flow-inspector/control-plane/vitest-reporter.mjs'
            )
        ],
        cwd: root,
        env: {
          ...process.env,
          FLOW_LOCALIZATION_ROOT: fixture.repository,
          FLOW_LOCALIZATION_MANIFESTS: JSON.stringify([frameworkPath]),
          FLOW_PROOF_SOURCE: fixture.repository,
          FLOW_PROOF_SCENARIO: 'baseline'
        },
        signal: t.signal,
        timeoutMs: 30000,
        maxOutputBytes: 512 * 1024
      })
      assert.equal(result.reason, null, result.output.slice(-3000))
      const id = result.output.match(
        /Flow Inspector observation: ([a-f0-9-]+)/
      )?.[1]
      assert.ok(id, result.output.slice(-3000))
      return { result, record: reader.get(id) }
    }
    fixture.faultOperation(
      selected.id,
      'packages/factory/src/data-transact.ts',
      'withHistoryGroup'
    )
    const collaboration = await fixture.run([selected.id])
    const shared = await runFramework()
    assert.equal(
      collaboration.result.code,
      1,
      collaboration.result.output.slice(-3000)
    )
    assert.equal(shared.result.code, 1, shared.result.output.slice(-3000))
    assert.equal(collaboration.record.cases[0].status, 'failed')
    assert.equal(
      collaboration.record.cases[0].locations[0].stepId,
      selected.stepId
    )
    assert.equal(shared.record.cases.length, 9)
    const sharedFailures = shared.record.cases.filter(
      (c) => c.status === 'failed'
    )
    assert.ok(sharedFailures.length > 0 && sharedFailures.length < 9)
    assert.ok(shared.record.cases.every((c) => c.resolution === 'mapped'))
    const currentFailures = () =>
      reader.list().currentCases.filter((c) => c.status === 'failed')
    assert.equal(currentFailures().length, sharedFailures.length + 1)
    assert.deepEqual(
      new Set(
        currentFailures().flatMap((c) => c.locations.map((l) => l.targetId))
      ),
      new Set(['design-collaboration', framework.targetId])
    )
    // Consumers without an actual failing invocation must not inherit the shared fault.
    assert.ok(
      !reader
        .list()
        .currentCases.some((c) =>
          c.locations.some((l) => l.targetId === 'design-functional')
        )
    )
    const { startServer } = require('../server.cjs')
    const { chromium, expect } = require('@playwright/test')
    const prior = process.env.TMPDIR
    process.env.TMPDIR = path.join(fixture.repository, 'browser')
    let server, browser
    t.after(async () => {
      await browser?.close()
      await server?.close()
      if (prior === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = prior
    })
    server = await startServer(root, {
      serviceOptions: {
        directory: path.join(fixture.repository, 'proof-runs'),
        observationPath: observationDirectory(fixture.repository)
      }
    })
    browser = await chromium.launch({
      channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
      downloadsPath: process.env.TMPDIR
    })
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1200 }
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(server.origin + '/design-collaboration')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(sharedFailures.length + 1)
    await buttons.filter({ hasText: selected.testName }).click()
    await expect(
      frame.locator(
        '[data-step-id="publish-history-members"].is-selected.observation-failed'
      )
    ).toHaveCount(1)
    const detail = frame.locator('#test-result-detail')
    await expect(detail).toContainText('packages/factory/src/data-transact.ts')
    await expect(detail).toContainText(
      collaboration.record.cases[0].runnerDetails
    )
    const { main } = require('../cli.cjs')
    for (const record of [collaboration.record, shared.record]) {
      const api = await (
        await fetch(server.origin + '/api/test-results/' + record.id)
      ).json()
      assert.deepEqual(api, record)
      const output = []
      assert.equal(
        await main(['--url', server.origin, 'test-results', record.id], {
          write: (value) => output.push(value)
        }),
        0
      )
      assert.deepEqual(JSON.parse(output.join('')), record)
    }
    await page.screenshot({
      path: path.join(fixture.repository, 'shared-collaboration-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await detail.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.repository, 'shared-collaboration-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovery = await fixture.run([selected.id])
    assert.equal(recovery.result.code, 0, recovery.result.output.slice(-3000))
    assert.equal(currentFailures().length, sharedFailures.length)
    await expect(buttons).toHaveCount(sharedFailures.length)
    const frameworkRecovery = await runFramework()
    assert.equal(
      frameworkRecovery.result.code,
      0,
      frameworkRecovery.result.output.slice(-3000)
    )
    assert.equal(currentFailures().length, 0)
    await expect(buttons).toHaveCount(0)
    await frame
      .locator('#test-result-history')
      .selectOption(collaboration.record.id)
    await expect(buttons).toHaveCount(1)
    assert.deepEqual(reader.get(collaboration.record.id), collaboration.record)
    assert.deepEqual(reader.get(shared.record.id), shared.record)
    assert.deepEqual(errors, [])
    t.diagnostic('Shared owner Board/API/CLI evidence: ' + fixture.repository)
  }
)

test('an oversized localized collaboration envelope remains readable and cannot claim recovery', () => {
  const { begin, complete } = require('../playwright-results.cjs')
  const {
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/collaboration-envelope-')
  )
  const reportPath = path.join(directory, 'original.json')
  const context = begin(root, reportPath, {}, undefined, 'collaboration')
  const f = collaborationReport()
  f.report.stats.startTime = new Date().toISOString()
  for (const attachment of f.attempt.attachments) {
    const value = JSON.parse(Buffer.from(attachment.body, 'base64').toString())
    value.observationId = context.id
    attachment.body = Buffer.from(JSON.stringify(value)).toString('base64')
  }
  f.attempt.stdout = [{ text: 'x'.repeat(17 * 1024 * 1024) }]
  fs.writeFileSync(reportPath, JSON.stringify(f.report))
  const record = complete(root, reportPath)
  assert.deepEqual(
    createObservationReader(observationDirectory(root)).get(record.id),
    record
  )
  assert.equal(record.cases.length, 0)
  assert.ok(record.issues.some((issue) => issue.includes('32 MiB')))
  assert.equal(
    JSON.parse(fs.readFileSync(reportPath)).suites[0].specs[0].tests[0]
      .results[0].stdout[0].text.length,
    17 * 1024 * 1024
  )
})

test('observation helper edits invalidate in-flight localization independently of product ownership', () => {
  const {
    sourceFingerprint,
    completeObservation
  } = require('../localization.cjs')
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/observation-input-')
  )
  const contract = loadContract(root, undefined, manifestPath)
  const inputs = sourceFingerprint(root, [contract])
  for (const item of inputs.files) {
    const destination = path.join(directory, item.path)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(path.join(root, item.path), destination)
  }
  const f = collaborationReport()
  const context = {
    ...f.context,
    id: require('node:crypto').randomUUID(),
    source: sourceFingerprint(directory, [contract]),
    command: null,
    head: null,
    issues: []
  }
  const helper = path.join(directory, manifest.observationInputs[0])
  fs.appendFileSync(helper, '\n// Changed observation producer.\n')
  assert.notEqual(
    sourceFingerprint(directory, [contract]).digest,
    context.source.digest
  )
  const item = contract.cases.find((c) => c.minimumParticipants === 2)
  const record = completeObservation(
    directory,
    context,
    {
      success: true,
      testResults: [
        {
          name: item.testFile,
          assertionResults: [
            { fullName: item.testName, status: 'passed', failureMessages: [] }
          ]
        }
      ]
    },
    { projects: ['chromium'] }
  )
  assert.equal(record.cases[0].resolution, 'stale')
  assert.ok(record.issues.some((issue) => issue.includes('stale')))
})

test(
  'concurrent local session and remote peer failures recover only their rerun cases',
  {
    skip: process.env.FLOW_COLLABORATION_MIXED_PROOF !== 'true',
    timeout: 240000
  },
  async (t) => {
    const { playwrightFixture } = require('./playwright-results-fixture.cjs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const fixture = await playwrightFixture(t, { source: 'collaboration' })
    const local = fixture.cases.find(
      (c) => c.stepId === 'observe-session-state'
    )
    const remote = fixture.cases.find((c) =>
      c.testName.startsWith('partial Fill updates')
    )
    fixture.faultOperation(
      local.id,
      'apps/asyra-design/src/collaboration/lifecycle.ts',
      'resolveCollaborationConnectionTransition'
    )
    fixture.faultOperation(
      remote.id,
      'apps/asyra-design/src/collaboration/operations.ts',
      'organizeRemotePublication'
    )
    const reader = createObservationReader(
      observationDirectory(fixture.repository)
    )
    const failure = async (item) => {
      const result = await fixture.run([item.id])
      assert.equal(result.result.code, 1, result.result.output.slice(-2500))
      assert.equal(result.record.cases[0].status, 'failed')
      assert.equal(result.record.cases[0].locations[0].stepId, item.stepId)
      return result.record
    }
    const localFault = await failure(local)
    const remoteFault = await failure(remote)
    assert.equal(
      reader.list().currentCases.filter((c) => c.status === 'failed').length,
      2
    )
    fixture.restore()
    const localRecovery = await fixture.run([local.id])
    assert.equal(
      localRecovery.result.code,
      0,
      localRecovery.result.output.slice(-2500)
    )
    assert.deepEqual(
      reader
        .list()
        .currentCases.filter((c) => c.status === 'failed')
        .map((c) => c.testName),
      [remote.testName]
    )
    const remoteRecovery = await fixture.run([remote.id])
    assert.equal(
      remoteRecovery.result.code,
      0,
      remoteRecovery.result.output.slice(-2500)
    )
    assert.equal(
      reader.list().currentCases.filter((c) => c.status === 'failed').length,
      0
    )
    assert.deepEqual(reader.get(localFault.id), localFault)
    assert.deepEqual(reader.get(remoteFault.id), remoteFault)
    t.diagnostic('Concurrent local/remote evidence: ' + fixture.repository)
  }
)

test('stored observation capacity includes the actual formatted envelope', () => {
  const {
    completeObservation,
    createObservationReader,
    observationDirectory
  } = require('../localization.cjs')
  const directory = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/formatted-envelope-')
  )
  const context = {
    format: 1,
    id: require('node:crypto').randomUUID(),
    startedAt: new Date().toISOString(),
    contracts: [],
    source: null,
    head: null,
    command: null,
    issues: []
  }
  const record = completeObservation(
    directory,
    context,
    { success: false, testResults: [] },
    {
      originalReport: {
        metadata: { nested: { values: Array(3000000).fill(0) } }
      }
    }
  )
  assert.deepEqual(
    createObservationReader(observationDirectory(directory)).get(record.id),
    record
  )
  assert.equal(record.report.metadata, undefined)
  assert.ok(record.issues.some((issue) => issue.includes('32 MiB')))
})

test('ordinary guarded skips do not turn a completed collaboration invocation into a runner failure', () => {
  const { normalizeReport } = require('../playwright-results.cjs')
  const f = collaborationReport()
  const skipped = structuredClone(f.report.suites[0].specs[0])
  skipped.id = 'guarded-case'
  skipped.title = 'guarded case'
  skipped.tests[0].results = [
    { status: 'skipped', retry: 0, errors: [], attachments: [] }
  ]
  f.report.suites[0].specs.push(skipped)
  const normalized = normalizeReport(root, f.context, f.report)
  assert.equal(normalized.report.success, true)
  assert.deepEqual(
    normalized.report.testResults.map(
      (item) => item.assertionResults[0].status
    ),
    ['passed', 'skipped']
  )
  assert.deepEqual(normalized.options.errors, [])
  skipped.tests[0].results[0].errors = [
    { message: 'original skipped-attempt error' }
  ]
  assert.equal(normalizeReport(root, f.context, f.report).report.success, false)
})

for (const [termination, exitCode] of [
  ['signal', 143],
  ['success', 0],
  ['failure', 42]
])
  test(
    'collaboration wrapper settles owned descendants - ' + termination,
    { timeout: 15000 },
    (t) => {
      const { spawnSync } = require('node:child_process')
      const directory = fs.mkdtempSync(
        path.join(root, 'tmp/flow-inspector/collaboration-descendants-')
      )
      const bin = path.join(directory, 'bin')
      fs.mkdirSync(bin)
      const pidFile = path.join(directory, 'child.pid')
      fs.writeFileSync(
        path.join(bin, 'node'),
        `#!/bin/bash
if [ "$1" = tools/flow-inspector/control-plane/playwright-results.cjs ]; then
  if [ "$2" = begin ]; then echo '{"id":"owned-run"}' > "$3.context.json"; fi
  exit 0
fi
exec '${process.execPath}' "$@"
`,
        { mode: 0o755 }
      )
      fs.writeFileSync(
        path.join(bin, 'yarn'),
        `#!/bin/bash
'${process.execPath}' -e 'process.on("SIGTERM", () => {}); require("node:fs").writeFileSync(process.env.OWNED_PID_FILE, String(process.pid)); setInterval(() => {}, 1000)' >/dev/null 2>&1 &
while [ ! -f "$OWNED_PID_FILE" ]; do sleep 0.01; done
if [ "$OWNED_EXIT_MODE" = signal ]; then kill -TERM "$PPID"; wait; fi
if [ "$OWNED_EXIT_MODE" = failure ]; then exit 42; fi
exit 0
`,
        { mode: 0o755 }
      )
      t.after(() => {
        if (fs.existsSync(pidFile)) {
          try {
            process.kill(Number(fs.readFileSync(pidFile)), 'SIGKILL')
          } catch {
            // A settled child is already absent.
          }
        }
      })
      const result = spawnSync(
        '/bin/bash',
        ['scripts/run-collaboration-e2e.sh'],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 10000,
          maxBuffer: 8192,
          env: {
            ...process.env,
            PATH: bin + path.delimiter + process.env.PATH,
            OWNED_PID_FILE: pidFile,
            OWNED_EXIT_MODE: termination,
            FLOW_CI_REPORT: path.join(directory, 'report.json')
          }
        }
      )
      assert.equal(result.status, exitCode, result.stdout + result.stderr)
      const pid = Number(fs.readFileSync(pidFile))
      const state = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], {
        encoding: 'utf8'
      }).stdout.trim()
      assert.ok(
        !state || state.startsWith('Z'),
        'Owned runner descendant remains live: ' + pid + ' (' + state + ')'
      )
    }
  )
