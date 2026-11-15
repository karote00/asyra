import process from 'node:process'
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, createWriteStream, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { collectConversationCases } from '../conversation-collection.mjs'

const require = createRequire(import.meta.url)
const {
  runProcess
} = require('../../../../tools/flow-inspector/control-plane/runner.cjs')
const {
  completeReportIssues
} = require('../../../../tools/flow-inspector/control-plane/runner-report.cjs')
const root = resolve(import.meta.dirname, '../../../..')

for (const group of [
  {
    id: 'nested',
    producer: 'vitest',
    cwd: 'apps/asyra-design/test-data/conversation-verification/fixtures',
    config:
      'apps/asyra-design/test-data/conversation-verification/runtime.vitest.config.mjs',
    environment: 'node',
    files: [
      'apps/asyra-design/test-data/conversation-verification/fixtures/collection-identity.test.ts'
    ],
    title: 'outer > literal nested value > 1'
  },
  {
    id: 'node',
    producer: 'node',
    cwd: '.',
    files: [
      'tools/flow-inspector/control-plane/__tests__/runner-report.test.cjs'
    ],
    title:
      'whole-feature evidence rejects omitted case inside a nonempty file with self-consistent totals'
  },
  {
    id: 'runtime',
    producer: 'vitest',
    cwd: 'packages/ai-agent-runtime',
    config:
      'apps/asyra-design/test-data/conversation-verification/runtime.vitest.config.mjs',
    environment: 'node',
    files: [
      'packages/ai-agent-runtime/src/__tests__/request-binding-review.test.ts'
    ],
    title:
      'admits equivalent point bindings without changing durable guarantees (fields false)'
  },
  {
    id: 'browser',
    producer: 'playwright',
    cwd: 'apps/asyra-design',
    config: 'apps/asyra-design/playwright.conversation.config.ts',
    files: ['apps/asyra-design/e2e/ai-retained-anchor.spec.ts'],
    title:
      'retained anchor reaches real hierarchy, rejects ambiguity, and preserves peer order, history and reload'
  }
]) {
  test(
    'native ' +
      group.id +
      ' collection retains independent identities and exposes within-file omission',
    { timeout: 60000 },
    async (t) => {
      const output = mkdtempSync(join(root, 'tmp/conversation-collection-'))
      const processes = []

      t.after(() => rmSync(output, { recursive: true, force: true }))

      const run = async (id, executable, args, cwd, stdout, environment) => {
        const log = createWriteStream(stdout ?? join(output, id + '.log'))
        const stderr = createWriteStream(join(output, id + '.stderr'))
        const env = { ...process.env, ...environment }

        delete env.NODE_TEST_CONTEXT
        const result = await runProcess({
          executable,
          args,
          cwd: resolve(root, cwd),
          env,
          stdout: log,
          stderr,
          timeoutMs: 50000,
          maxOutputBytes: 2 * 1024 * 1024,

          onSpawn: (pid) => processes.push(pid)
        })

        await Promise.all([
          new Promise((done) => log.end(done)),
          new Promise((done) => stderr.end(done))
        ])
        assert.equal(result.reason, null, JSON.stringify(result))
        assert.equal(
          result.code,
          0,
          readFileSync(join(output, id + '.stderr'), 'utf8')
        )

        return result
      }

      const requiredCases = await collectConversationCases({
        root,
        group,
        output,
        run,
        environment: { E2E_LARGE_DOCUMENT: 'true' }
      })

      assert.ok(processes.length > 0)
      assert.ok(requiredCases.some((item) => item.title === group.title))
      assert.deepEqual(
        JSON.parse(
          readFileSync(join(output, group.id + '-cases.json'), 'utf8')
        ),
        requiredCases
      )

      if (group.producer === 'vitest') {
        const path = join(output, 'execution.json')

        await run(
          'execution',
          join(root, 'node_modules/.bin/vitest'),
          [
            'run',
            '--config',
            join(root, group.config),
            '--environment',
            group.environment,
            '--reporter=json',
            '--outputFile=' + path,
            ...group.files.map((file) => resolve(root, file))
          ],
          group.cwd
        )
        const report = JSON.parse(readFileSync(path, 'utf8'))

        assert.deepEqual(
          completeReportIssues(report, {
            root,
            requiredFiles: group.files,
            requiredCases
          }),
          []
        )
        report.testResults[0].assertionResults.pop()
        report.numTotalTests--
        report.numPassedTests--
        assert.match(
          completeReportIssues(report, {
            root,
            requiredFiles: group.files,
            requiredCases
          }).join('\n'),
          /Missing required test case/
        )
      } else {
        // Simulate corruption only after the real native collection has completed.
        const report = {
          success: true,
          testResults: group.files.map((file) => ({
            name: file,
            assertionResults: requiredCases
              .filter((item) => item.file === file)
              .map((item) => ({ fullName: item.title, status: 'passed' }))
          }))
        }

        assert.deepEqual(
          completeReportIssues(report, {
            root,
            requiredFiles: group.files,
            requiredCases
          }),
          []
        )
        report.testResults[0].assertionResults.pop()
        assert.match(
          completeReportIssues(report, {
            root,
            requiredFiles: group.files,
            requiredCases
          }).join('\n'),
          /Missing required test case/
        )
      }
    }
  )
}
