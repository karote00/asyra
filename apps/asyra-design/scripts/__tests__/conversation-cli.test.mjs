import test from 'node:test'
import process from 'node:process'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { resolve, join, relative } from 'node:path'

const root = resolve(import.meta.dirname, '../../../..')
const entry = resolve(root, 'apps/asyra-design/scripts/verify-conversation.mjs')

test('verification CLI rejects an invalid explicit project instead of using its default', () => {
  const result = spawnSync(
    process.execPath,
    [entry, '--project', 'tmp/missing-conversation-project.json', '--list'],
    { cwd: root, encoding: 'utf8' }
  )

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing-conversation-project/)
})

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(import.meta.url)
const {
  initialize
} = require('../../../../tools/flow-inspector/flow-files/project.cjs')

const until = async (condition, message) => {
  const deadline = Date.now() + 10000

  while (!condition()) {
    assert.ok(Date.now() < deadline, message)
    await delay(20)
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0)

    return true
  } catch (error) {
    if (error.code === 'ESRCH') {
      return false
    }

    throw error
  }
}

test('actual verification interruption cannot become success or dispatch a successor', async (t) => {
  const directory = mkdtempSync(join(root, 'tmp/conversation-cli-'))
  const project = initialize(directory, 'manual', 'interruption-proof')
  const fixtureFlow = JSON.parse(
    readFileSync(join(project.directory, 'checkout.flow.json'), 'utf8')
  )

  fixtureFlow.definition = JSON.parse(
    readFileSync(
      join(
        root,
        'apps/asyra-design/test-data/conversation-verification/flow/conversation.flow.json'
      ),
      'utf8'
    )
  ).definition
  writeFileSync(
    join(project.directory, 'checkout.flow.json'),
    JSON.stringify(fixtureFlow)
  )
  const configuration = join(root, `.conversation-cli-${randomUUID()}.json`)

  writeFileSync(
    configuration,
    JSON.stringify({
      schemaVersion: 1,
      projectId: project.projectId,
      flows: relative(root, project.directory)
    })
  )
  const bin = join(directory, 'bin')

  mkdirSync(bin)
  const calls = join(directory, 'calls.jsonl')
  const nativeClient = join(directory, 'native-client')

  // This case stops during build; the native client is never executed beyond
  // version admission. Native protocol evidence belongs to the native fixtures.
  writeFileSync(nativeClient, '#!/bin/sh\nprintf "codex-cli 0.160.0\\n"\n', {
    mode: 0o755
  })

  // Only the external build command is substituted. Run the real CLI, its
  // process owner, evidence publication and exit decision.
  writeFileSync(
    join(bin, 'yarn'),
    String.raw`#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { appendFileSync } from 'node:fs'
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' })
appendFileSync(process.env.CONVERSATION_CLI_CALLS, JSON.stringify({ pid: process.pid, descendant: child.pid }) + '\n')
process.on('SIGTERM', () => process.exit(0))
setInterval(() => {}, 1000)
`,
    { mode: 0o755 }
  )

  const records = () =>
    existsSync(calls)
      ? readFileSync(calls, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map(JSON.parse)
      : []

  const child = spawn(process.execPath, [entry, '--project', configuration], {
    cwd: root,
    detached: true,
    env: {
      ...process.env,
      PATH: bin + ':' + process.env.PATH,
      NATIVE_DELIVERY_CODEX: nativeClient,
      CONVERSATION_CLI_CALLS: calls
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let stdout = '',
    stderr = '',
    finished = false,
    code

  child.stdout.on('data', (value) => {
    stdout += value
  })
  child.stderr.on('data', (value) => {
    stderr += value
  })
  child.on('close', (value) => {
    code = value
    finished = true
  })
  t.after(() => {
    for (const pid of [
      child.pid,
      ...records().flatMap((row) => [row.pid, row.descendant])
    ]) {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') {
          throw error
        }
      }

      try {
        process.kill(pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') {
          throw error
        }
      }
    }

    rmSync(configuration)
    rmSync(directory, { recursive: true, force: true })
  })
  await until(
    () => records().length > 0 || finished,
    'Build child did not start'
  )
  assert.equal(finished, false, stdout + stderr)
  // Give the external command time to install its signal handler.
  await delay(100)
  child.kill('SIGTERM')
  await until(
    () => finished || records().length > 1,
    'Interrupted CLI did not settle'
  )
  assert.equal(records().length, 1, 'Interrupted CLI dispatched another build')
  assert.equal(code, 1, stdout + stderr)
  await until(
    () => !alive(records()[0].descendant),
    'Owned descendant survived cancellation'
  )
  const evidence = stdout.match(/Evidence: (.+)/)?.[1]

  assert.ok(evidence, 'Missing failed evidence')
  const summary = JSON.parse(
    readFileSync(join(evidence, 'summary.json'), 'utf8')
  )

  assert.equal(summary.executionStatus, 'failed-or-incomplete')
  assert.ok(summary.issues.some((issue) => /cancel|interrupt/i.test(issue)))
  const processes = JSON.parse(
    readFileSync(join(evidence, 'processes.json'), 'utf8')
  )

  assert.equal(processes.length, 2)
  assert.equal(processes[0].id, 'scope-admission')
  assert.equal(processes[0].code, 0)
  assert.equal(processes[0].reason, null)
  assert.ok(processes[0].finishedAt)
  assert.equal(processes[1].reason, 'cancelled')
  assert.ok(processes[1].finishedAt)
})

for (const [fault, diagnosis] of [
  ['none', null],
  ['failed-suite', /numFailedTestSuites/],
  ['missing-case', /Missing required test case|No executed assertions/],
  ['duplicate-case', /Duplicate assertion/],
  ['exit-failure', /Runner exit/],
  ['runtime-error', /runtime errors/],
  ['failed-summary', /successful runner completion/],
  ['missing-file', /Missing required test/],
  ['skipped-case', /Unsuccessful assertion|pending|skipped|not passed/],
  ['truncated-report', /JSON|Unexpected|parse/],
  [
    'changed-knowledge-source',
    /Source, compiled exports or required definitions changed/
  ],
  ['publication-failure', /Controlled publication failure/],
  ['dropped-observation', /Incomplete automated evidence/],
  ['missing-semantic-review', /Missing independent spec-coverage review/],
  ['missing-knowledge-handoff', /Missing required handoff area: knowledge/]
]) {
  test('actual verification CLI admits runner evidence - ' + fault, (t) => {
    const directory = mkdtempSync(join(root, 'tmp/conversation-cli-proof-'))
    const project = initialize(directory, 'manual', 'runner-proof')
    const document = JSON.parse(
      readFileSync(join(project.directory, 'checkout.flow.json'), 'utf8')
    )

    document.definition = JSON.parse(
      readFileSync(
        join(
          root,
          'apps/asyra-design/test-data/conversation-verification/flow/conversation.flow.json'
        ),
        'utf8'
      )
    ).definition
    if (fault === 'missing-knowledge-handoff') {
      document.definition.nodes = document.definition.nodes.filter(
        (node) => node.id !== 'knowledge'
      )
    }

    if (fault === 'missing-semantic-review') {
      document.definition.criteria = []
    }

    writeFileSync(
      join(project.directory, 'checkout.flow.json'),
      JSON.stringify(document)
    )
    const configuration = join(root, `.conversation-cli-${randomUUID()}.json`)
    const nativeClient = join(directory, 'native-client')
    const sourceFixture =
      fault === 'changed-knowledge-source'
        ? join(
            root,
            'docs/ai/knowledge',
            '.verification-source-' + randomUUID() + '.md'
          )
        : undefined

    if (sourceFixture) {
      writeFileSync(sourceFixture, '# Independent source fixture\n')
    }

    writeFileSync(
      configuration,
      JSON.stringify({
        schemaVersion: 1,
        projectId: project.projectId,
        flows: relative(root, project.directory)
      })
    )
    writeFileSync(nativeClient, '#!/bin/sh\nprintf "codex-cli 0.160.0\\n"\n', {
      mode: 0o755
    })
    t.after(() => {
      rmSync(configuration)
      if (sourceFixture) {
        rmSync(sourceFixture)
      }

      rmSync(directory, { recursive: true, force: true })
    })
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        resolve(import.meta.dirname, 'fixtures/conversation-process.mjs'),
        entry,
        '--project',
        configuration
      ],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          CONVERSATION_PROOF_PROJECT: configuration,
          CONVERSATION_PROOF_FAULT: fault,
          ...(sourceFixture
            ? { CONVERSATION_PROOF_SOURCE: sourceFixture }
            : {}),
          NATIVE_DELIVERY_CODEX: nativeClient
        }
      }
    )
    const evidence = result.stdout.match(/Evidence: (.+)/)?.[1]

    assert.ok(evidence, result.stderr + result.stdout)
    const summary = JSON.parse(
      readFileSync(join(evidence, 'summary.json'), 'utf8')
    )

    // The untouched manual criterion must remain unaccepted even for valid
    // synthetic execution. These stimuli cannot certify product semantics.
    assert.equal(
      result.status,
      diagnosis ? 1 : 2,
      JSON.stringify(summary.issues.slice(0, 4))
    )
    assert.equal(
      summary.executionStatus,
      diagnosis ? 'failed-or-incomplete' : 'passed'
    )
    assert.ok(summary.evaluation.flows.every((flow) => flow.status !== 'done'))
    if (diagnosis) {
      assert.match(summary.issues.join('\n'), diagnosis)
      if (fault === 'changed-knowledge-source') {
        assert.notDeepEqual(
          JSON.parse(
            readFileSync(join(evidence, 'source-before.json'), 'utf8')
          ),
          JSON.parse(readFileSync(join(evidence, 'source-after.json'), 'utf8'))
        )
      } else if (
        ![
          'truncated-report',
          'publication-failure',
          'dropped-observation',
          'missing-semantic-review',
          'missing-knowledge-handoff'
        ].includes(fault)
      ) {
        assert.match(
          readFileSync(join(evidence, 'server-issues.json'), 'utf8'),
          diagnosis
        )
      }
    } else {
      assert.deepEqual(summary.issues, [])
    }
  })
}
