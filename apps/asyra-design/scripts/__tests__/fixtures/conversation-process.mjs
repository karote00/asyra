// Substitute external runner processes only. The production CLI, independent
// collection, report admission, publication and final evaluator remain real.
// Synthetic case results are verifier stimuli, never product acceptance evidence.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, relative, basename } from 'node:path'
import process from 'node:process'
import { conversationGroups } from '../../conversation-scope.mjs'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '../../../../..')
const runner = require('../../../../../tools/flow-inspector/control-plane/runner.cjs')
const configuration = JSON.parse(
  readFileSync(process.env.CONVERSATION_PROOF_PROJECT, 'utf8')
)
const flow = JSON.parse(
  readFileSync(resolve(root, configuration.flows, 'checkout.flow.json'), 'utf8')
)
const selected = [
  ...flow.definition.nodes.flatMap((node) => node.criteria),
  ...flow.definition.criteria
]
  .filter((criterion) => criterion.selector)
  .map((criterion) => JSON.parse(criterion.selector.identity))
const groups = conversationGroups(root)
const mode = process.env.CONVERSATION_PROOF_FAULT
const adapters = require('../../../../../tools/flow-inspector/flow-files/adapters.cjs')

if (mode === 'publication-failure') {
  const publish = adapters.publish
  let first = true

  adapters.publish = (...args) => {
    if (first) {
      first = false
      throw Error('Controlled publication failure')
    }

    return publish(...args)
  }
}

if (mode === 'dropped-observation') {
  adapters.publish = () => undefined
}

const casesFor = (group) =>
  group.files.flatMap((file) => {
    const required = selected.filter((item) => item.file === file)

    return [...required, { file, title: 'independent runner control' }]
  })

const counts = (count) => ({
  tests: count,
  passed: count,
  failed: 0,
  skipped: 0,
  todo: 0,
  cancelled: 0
})

const nodeEvents = (group) => {
  const events = []
  const cases = casesFor(group)

  for (const file of group.files) {
    const own = cases.filter((item) => item.file === file)

    for (const [index, item] of own.entries()) {
      const data = {
        entryFile: resolve(root, file),
        name: item.title,
        testId: index + 1,
        parentId: 0,
        type: 'test'
      }

      events.push({ type: 'test:enqueue', data })
      events.push({
        type: 'test:pass',
        data: { ...data, details: { type: 'test' } }
      })
    }

    events.push({
      type: 'test:summary',
      data: {
        file: resolve(root, file),
        success: true,
        counts: counts(own.length)
      }
    })
  }

  events.push({
    type: 'test:summary',
    data: { success: true, counts: counts(cases.length) }
  })

  return events.map((event) => JSON.stringify(event)).join('\n') + '\n'
}

runner.runProcess = async ({ executable, args, stdout }) => {
  const outputName = basename(stdout.path)
  const group = groups.find((item) => outputName.startsWith(item.id + '.'))
  const collection = args.some((arg) =>
    arg.endsWith('conversation-vitest-collection.mjs')
  )
  let code = 0

  if (collection) {
    const selectedGroup = groups.find(
      (item) =>
        item.config === relative(root, args[1]) && item.environment === args[2]
    )

    writeFileSync(
      args[3],
      JSON.stringify(
        casesFor(selectedGroup).map((item) => ({
          file: resolve(root, item.file),
          titlePath: [item.title],
          projectName: ''
        }))
      )
    )
  } else if (executable.endsWith('/vitest')) {
    const file = args.find((arg) => arg.startsWith('--outputFile=')).slice(13)
    const own = groups.find((item) => basename(file) === item.id + '.json')
    const rows = own.files.map((name) => ({
      name: resolve(root, name),
      status: 'passed',
      assertionResults: casesFor(own)
        .filter((item) => item.file === name)
        .map((item) => ({
          fullName: item.title,
          status: 'passed',
          failureMessages: []
        }))
    }))
    const report = { success: true, testResults: rows }

    if (own.id === 'server') {
      if (mode === 'changed-knowledge-source') {
        writeFileSync(
          process.env.CONVERSATION_PROOF_SOURCE,
          '# Changed authority fixture\n'
        )
      }

      if (mode === 'missing-file') {
        rows.pop()
      }

      if (mode === 'skipped-case') {
        rows[0].assertionResults[0].status = 'pending'
      }

      if (mode === 'truncated-report') {
        writeFileSync(file, '{broken')

        return {
          code: 0,
          exitSignal: null,
          reason: null,
          output: '',
          durationMs: 1
        }
      }

      if (mode === 'failed-suite') {
        report.numFailedTestSuites = 1
      }

      if (mode === 'missing-case') {
        rows[0].assertionResults.pop()
      }

      if (mode === 'duplicate-case') {
        rows[0].assertionResults.push(rows[0].assertionResults[0])
      }

      if (mode === 'exit-failure') {
        code = 1
      }

      if (mode === 'runtime-error') {
        report.numRuntimeErrorTestSuites = 1
      }

      if (mode === 'failed-summary') {
        report.success = false
      }
    }

    writeFileSync(file, JSON.stringify(report))
  } else if (executable.endsWith('/playwright')) {
    const own = groups.find((item) => item.producer === 'playwright')
    const report = {
      config: {
        rootDir: resolve(root, 'apps/asyra-design/e2e'),
        configFile: resolve(root, own.config)
      },
      stats: { startTime: new Date().toISOString() },
      errors: [],
      suites: own.files.map((file) => ({
        title: file,
        specs: casesFor(own)
          .filter((item) => item.file === file)
          .map((item, index) => ({
            id: file + ':' + index,
            title: item.title,
            file: relative(
              resolve(root, 'apps/asyra-design/e2e'),
              resolve(root, file)
            ),
            line: index + 1,
            column: 1,
            tests: [
              {
                projectName: 'chromium',
                expectedStatus: 'passed',
                status: 'expected',
                results: [
                  { status: 'passed', retry: 0, errors: [], attachments: [] }
                ]
              }
            ]
          }))
      }))
    }

    stdout.write(JSON.stringify(report))
  } else if (
    group?.producer === 'node' ||
    outputName === 'node-collection.json'
  ) {
    stdout.write(nodeEvents(groups.find((item) => item.id === 'node')))
  }

  return { code, exitSignal: null, reason: null, output: '', durationMs: 1 }
}
