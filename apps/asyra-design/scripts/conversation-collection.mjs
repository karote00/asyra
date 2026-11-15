import process from 'node:process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  collectRunnerCases
} = require('../../../tools/flow-inspector/control-plane/runner-inventory.cjs')
const {
  normalizeNodeEvents
} = require('../../../tools/flow-inspector/control-plane/node-results.cjs')
const {
  completeReportIssues
} = require('../../../tools/flow-inspector/control-plane/runner-report.cjs')

// Node has no collection-only API. Its separate discovery execution records
// registrations, including dynamic subtests, and must itself complete cleanly.
export async function collectConversationCases({
  root,
  group,
  output,
  run,
  environment
}) {
  const path = join(output, group.id + '-collection.json')
  const cwd = resolve(root, group.cwd)
  const files = group.files.map((file) => relative(cwd, join(root, file)))
  const id = group.id + '-collection'
  let result, input

  if (group.producer === 'node') {
    result = await run(
      id,
      process.execPath,
      [
        '--test',
        '--test-concurrency=1',
        '--test-reporter=' +
          join(
            root,
            'tools/flow-inspector/control-plane/node-test-reporter.mjs'
          ),
        ...files
      ],
      group.cwd,
      path,
      environment
    )
    input = readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  } else if (group.producer === 'vitest') {
    result = await run(
      id,
      process.execPath,
      [
        join(
          root,
          'apps/asyra-design/scripts/conversation-vitest-collection.mjs'
        ),
        join(root, group.config),
        group.environment,
        path,
        ...files
      ],
      group.cwd,
      undefined,
      environment
    )
    input = JSON.parse(readFileSync(path, 'utf8'))
  } else if (group.producer === 'playwright') {
    result = await run(
      id,
      join(root, 'node_modules/.bin/playwright'),
      [
        'test',
        '--list',
        '--config=' + join(root, group.config),
        '--project=chromium',
        '--reporter=json',
        ...files
      ],
      group.cwd,
      path,
      environment
    )
    input = JSON.parse(readFileSync(path, 'utf8'))
  } else {
    throw Error('Unsupported conversation collection producer')
  }

  if (result.code !== 0 || result.exitSignal) {
    throw Error('Case collection did not complete: ' + group.id)
  }

  const cases = collectRunnerCases(group.producer, input, {
    root,
    cwd,
    files: group.files,
    project: group.producer === 'playwright' ? 'chromium' : ''
  })

  if (group.producer === 'node') {
    const { report, errors } = normalizeNodeEvents(input, { cwd, files })
    const issues = [
      ...errors,
      ...completeReportIssues(report, {
        root,
        requiredFiles: group.files,
        requiredCases: cases
      })
    ]

    if (issues.length) {
      throw Error('Node declaration execution failed: ' + issues.join('\n'))
    }
  }

  writeFileSync(
    join(output, group.id + '-cases.json'),
    JSON.stringify(cases, null, 2) + '\n'
  )

  return cases
}
