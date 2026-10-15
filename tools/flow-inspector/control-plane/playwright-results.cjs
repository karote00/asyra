/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { safePath } = require('./snapshot.cjs')
const localization = require('./localization.cjs')
const manifestPath = 'apps/asyra-design/playwright-flow-contracts.json'
const sourceManifestPaths = (source = 'functional') => {
  if (source === 'functional')
    return [
      manifestPath,
      'apps/asyra-design/playwright-functional-flow-contracts.json'
    ]
  if (source === 'status')
    return ['apps/asyra-design/playwright-status-flow-contracts.json']
  throw new Error('Unsupported Design Playwright source')
}

const string = (value) => typeof value === 'string'
const errorDetails = (error) =>
  Object.fromEntries(
    localization.FAILURE_DETAIL_FIELDS.filter((key) =>
      string(error?.[key])
    ).map((key) => [key, error[key]])
  )

function invalidatePassingResults(report) {
  report.success = false
  for (const suite of report.testResults)
    for (const assertion of suite.assertionResults)
      if (assertion.status === 'passed') assertion.status = 'unknown'
}

// Convert once at ingestion. Readers and the canvas consume the retained mapping.
// Keep the complete original report separately from this runner-neutral projection.
function normalizeReport(root, context, original) {
  const errors = [],
    projects = [],
    failureDetails = [],
    runnerDetails = [],
    executionFailureDetails = []
  const testResults = []
  const expectedRoot = path.join(root, 'apps/asyra-design/e2e')
  let stale = original?.config?.rootDir !== expectedRoot
  if (stale)
    errors.push(
      'Playwright report root does not match the observed Design checkout'
    )
  const configurations = new Set(
    context.contracts.map((contract) => contract.configFile)
  )
  if (
    configurations.size !== 1 ||
    original?.config?.configFile !== path.join(root, [...configurations][0])
  ) {
    stale = true
    errors.push(
      'Playwright configuration differs from the observed Design invocation'
    )
  }
  const start = Date.parse(original?.stats?.startTime)
  if (!Number.isFinite(start) || start < Date.parse(context.startedAt)) {
    stale = true
    errors.push(
      'Playwright report start is missing or predates the observation'
    )
  }
  if (!Array.isArray(original?.suites) || !Array.isArray(original?.errors))
    errors.push('Missing or malformed Playwright report')
  for (const error of Array.isArray(original?.errors) ? original.errors : []) {
    errors.push(String(error?.stack ?? error?.message ?? error))
    executionFailureDetails.push(errorDetails(error))
  }
  let executionIncomplete = errors.length > 0
  const incompleteStructure = (message) => {
    executionIncomplete = true
    errors.push(message)
  }
  const walk = (suites, parents = [], depth = 0) => {
    if (depth > 64) {
      incompleteStructure(
        'Playwright suite nesting exceeds the observation limit'
      )
      return
    }
    if (!Array.isArray(suites)) {
      incompleteStructure('Malformed Playwright suites')
      return
    }
    for (const suite of suites) {
      if (!suite || typeof suite !== 'object') {
        incompleteStructure('Malformed Playwright suite')
        continue
      }
      if (!string(suite.title) || !Array.isArray(suite.specs))
        incompleteStructure('Malformed Playwright suite')
      let titles = depth === 0 ? parents : [...parents, suite.title]
      if (!string(suite.title)) titles = [...parents, '(unavailable suite)']
      for (const spec of Array.isArray(suite.specs) ? suite.specs : []) {
        if (!spec || !Array.isArray(spec.tests) || !spec.tests.length) {
          incompleteStructure('Malformed Playwright spec')
          continue
        }
        if (!string(spec.title) || !string(spec.file))
          incompleteStructure('Malformed Playwright spec identity')
        const title = string(spec.title)
          ? spec.title
          : '(unavailable test title)'
        let file
        try {
          file = safePath(
            root,
            path.relative(root, path.resolve(expectedRoot, spec.file))
          )
          if (
            !file.startsWith(expectedRoot + path.sep) ||
            path.isAbsolute(spec.file) ||
            spec.file.includes('\\')
          )
            throw new Error('outside test directory')
        } catch {
          errors.push('Invalid Playwright test path: ' + spec.file)
          // Preserve failures with an unmappable name, never discard their evidence.
          file = path.join(root, 'unresolved-playwright-test')
        }
        for (const [testIndex, item] of spec.tests.entries()) {
          if (!item || !Array.isArray(item.results)) {
            incompleteStructure('Malformed Playwright case: ' + spec.title)
            continue
          }
          const details = [],
            messages = []
          let malformed = !string(item.projectName),
            failed = false
          for (const result of item.results) {
            if (
              !result ||
              ![
                'passed',
                'failed',
                'timedOut',
                'skipped',
                'interrupted'
              ].includes(result.status) ||
              !Number.isInteger(result.retry) ||
              result.retry < 0 ||
              !Array.isArray(result.errors) ||
              !Array.isArray(result.attachments)
            )
              malformed = true
            if (['failed', 'timedOut'].includes(result?.status)) failed = true
            let received = Array.isArray(result?.errors) ? result.errors : []
            if (
              result?.error &&
              !received.some(
                (error) =>
                  JSON.stringify(error) === JSON.stringify(result.error)
              )
            )
              received = [...received, result.error]
            for (const error of received) {
              details.push(errorDetails(error))
              messages.push(
                [error?.message, error?.stack].filter(string).join('\n') ||
                  String(error)
              )
            }
          }
          if (malformed)
            errors.push('Malformed Playwright result: ' + spec.title)
          const clean =
            !malformed &&
            !executionIncomplete &&
            item.expectedStatus === 'passed' &&
            item.status === 'expected' &&
            item.results.length > 0 &&
            item.results.every(
              (r) => r.status === 'passed' && r.errors.length === 0 && !r.error
            )
          let status = 'unknown'
          if (
            item.results.length &&
            item.results.every((r) => r?.status === 'skipped')
          )
            status = 'skipped'
          if (clean) status = 'passed'
          if (failed) status = 'failed'
          if (status === 'unknown')
            errors.push(
              'Playwright case did not establish completion: ' + spec.title
            )
          testResults.push({
            name: file,
            assertionResults: [
              {
                fullName: [...titles, title].join(' '),
                status,
                failureMessages: messages,
                location: Object.fromEntries(
                  ['line', 'column']
                    .filter((key) => Number.isInteger(spec[key]))
                    .map((key) => [key, spec[key]])
                )
              }
            ]
          })
          projects.push(
            string(item.projectName) ? item.projectName : '(unavailable)'
          )
          failureDetails.push([details])
          runnerDetails.push([
            JSON.stringify({
              runner: 'playwright',
              producer: 'design',
              specId: spec.id,
              testIndex,
              ...item
            })
          ])
        }
      }
      if (suite.suites !== undefined) walk(suite.suites, titles, depth + 1)
    }
  }
  if (Array.isArray(original?.suites)) walk(original.suites)
  // Structural loss can hide a duplicate case, even after a clean case was read.
  // Only a completely traversable report can establish passing authority.
  if (executionIncomplete) invalidatePassingResults({ testResults })
  if (!testResults.length) errors.push('No Playwright cases recorded')
  return {
    report: {
      testResults,
      success:
        !errors.length &&
        testResults.every((s) =>
          s.assertionResults.every((a) => a.status === 'passed')
        )
    },
    options: {
      projects,
      failureDetails,
      runnerDetails,
      executionFailureDetails,
      errors,
      stale,
      originalReport: original
    }
  }
}
function begin(
  root,
  reportPath,
  environment = process.env,
  command,
  source = 'functional'
) {
  const report = safePath(root, reportPath)
  if (fs.existsSync(report) || fs.existsSync(report + '.context.json'))
    throw new Error('Use a fresh report path for each Playwright invocation')
  const context = localization.beginObservation(root, {
    manifestPaths: sourceManifestPaths(source),
    command: command ?? {
      cwd: source === 'status' ? 'apps/asyra-design' : '.',
      argv:
        source === 'status'
          ? ['yarn', 'test:e2e:status-toast']
          : ['bash', 'scripts/run-e2e.sh'],
      environment: Object.fromEntries(
        [
          'CI',
          'GITHUB_EVENT_NAME',
          'RUN_BALANCED_AI_CORRECTNESS',
          'E2E_SUITE',
          'FLOW_CI_REPORT',
          'FLOW_RESULT_REPOSITORY',
          'FLOW_RESULT_BASE',
          'FLOW_RESULT_HEAD',
          'FLOW_RESULT_INTEGRATION',
          'FLOW_RESULT_RUN',
          'FLOW_RESULT_ATTEMPT'
        ]
          .filter((k) => string(environment[k]))
          .map((k) => [k, environment[k]])
      )
    }
  })
  fs.mkdirSync(path.dirname(report), { recursive: true })
  fs.writeFileSync(report + '.context.json', JSON.stringify({ id: context.id }))
  return context
}
function complete(root, reportPath) {
  const report = safePath(root, reportPath)
  const reader = localization.createObservationReader(
    localization.observationDirectory(root)
  )
  let context,
    unavailable = false
  try {
    context = reader.get(
      JSON.parse(fs.readFileSync(report + '.context.json', 'utf8')).id
    )
  } catch {
    unavailable = true
    context = localization.beginObservation(root, {
      manifestPaths: [manifestPath]
    })
    context.issues.push('Pre-execution Playwright context unavailable')
  }
  if (context.phase === 'completed')
    throw new Error('Playwright invocation was already completed')
  let original = null
  try {
    if (
      !fs.statSync(report).isFile() ||
      fs.statSync(report).size > 4 * 1024 * 1024
    )
      throw new Error('Report exceeds the 4 MiB observation limit')
    original = JSON.parse(fs.readFileSync(report, 'utf8'))
  } catch (error) {
    context.issues.push('Playwright report unavailable: ' + error.message)
  }
  const normalized = normalizeReport(root, context, original)
  // Archive ownership remains with the existing producer output directory.
  // Report references are evidence, never arbitrary paths to read or execute.
  const retainedArtifacts = []
  let retainedBytes = 0
  let attachmentsIncomplete = false
  const inspectAttachments = (suites, depth = 0) => {
    if (depth > 64) return
    for (const suite of Array.isArray(suites) ? suites : []) {
      for (const spec of Array.isArray(suite?.specs) ? suite.specs : []) {
        for (const item of Array.isArray(spec?.tests) ? spec.tests : []) {
          for (const result of Array.isArray(item?.results)
            ? item.results
            : []) {
            for (const attachment of Array.isArray(result?.attachments)
              ? result.attachments
              : []) {
              if (typeof attachment?.body === 'string') continue
              try {
                if (typeof attachment?.path !== 'string')
                  throw new Error('missing attachment path/body')
                const file = safePath(root, attachment.path)
                const output = path.join(root, 'apps/asyra-design/test-results')
                if (
                  !file.startsWith(output + path.sep) ||
                  !fs.statSync(file).isFile()
                )
                  throw new Error('outside retained output or unavailable')
                const size = fs.statSync(file).size
                if (
                  size > 64 * 1024 * 1024 ||
                  retainedBytes + size > 256 * 1024 * 1024
                )
                  throw new Error('attachment retention limit exceeded')
                const retainedPath =
                  'tmp/flow-inspector/test-results/' +
                  context.id +
                  '/attachments/' +
                  retainedArtifacts.length
                const destination = safePath(root, retainedPath)
                fs.mkdirSync(path.dirname(destination), { recursive: true })
                fs.copyFileSync(file, destination, fs.constants.COPYFILE_EXCL)
                const bytes = fs.readFileSync(destination)
                retainedBytes += bytes.length
                retainedArtifacts.push({
                  name: String(attachment.name ?? ''),
                  originalPath: attachment.path,
                  retainedPath,
                  size: bytes.length,
                  digest: createHash('sha256').update(bytes).digest('hex')
                })
              } catch (error) {
                attachmentsIncomplete = true
                normalized.options.errors.push(
                  'Playwright attachment unavailable: ' +
                    String(attachment?.name ?? '') +
                    ': ' +
                    error.message
                )
              }
            }
          }
        }
      }
      inspectAttachments(suite?.suites, depth + 1)
    }
  }
  inspectAttachments(original?.suites)
  if (attachmentsIncomplete) invalidatePassingResults(normalized.report)
  const environment = context.command?.environment ?? {}
  const identityKeys = [
    'REPOSITORY',
    'BASE',
    'HEAD',
    'INTEGRATION',
    'RUN',
    'ATTEMPT'
  ]
  if (
    identityKeys.some((key) => Object.hasOwn(environment, 'FLOW_RESULT_' + key))
  ) {
    const valid =
      identityKeys.every(
        (key) =>
          typeof environment['FLOW_RESULT_' + key] === 'string' &&
          environment['FLOW_RESULT_' + key].length > 0
      ) &&
      ['BASE', 'HEAD', 'INTEGRATION'].every((key) =>
        /^[a-f0-9]{40}$/.test(environment['FLOW_RESULT_' + key])
      ) &&
      ['RUN', 'ATTEMPT'].every((key) =>
        /^[1-9][0-9]*$/.test(environment['FLOW_RESULT_' + key])
      )
    if (!valid) {
      unavailable = true
      normalized.options.errors.push(
        'Incomplete or invalid CI execution identity'
      )
    }
  }
  if (context.issues.length) unavailable = true
  const integration = context.command?.environment?.FLOW_RESULT_INTEGRATION
  if (integration && integration !== context.head) {
    unavailable = true
    normalized.options.errors.push(
      'CI integration revision differs from observed checkout'
    )
  }
  return localization.completeObservation(root, context, normalized.report, {
    ...normalized.options,
    retainedArtifacts,
    stale: unavailable || normalized.options.stale
  })
}
if (require.main === module) {
  try {
    const [action, reportPath, source = 'functional', ...extra] =
      process.argv.slice(2)
    if (
      !['begin', 'complete'].includes(action) ||
      !reportPath ||
      extra.length ||
      (action === 'complete' && process.argv.length > 4)
    )
      throw new Error(
        'Usage: playwright-results.cjs begin <fresh-report-path> [functional|status] or complete <report-path>'
      )
    const result =
      action === 'begin'
        ? begin(process.cwd(), reportPath, process.env, undefined, source)
        : complete(process.cwd(), reportPath)
    process.stdout.write('Flow Inspector observation: ' + result.id + '\n')
  } catch (error) {
    process.stderr.write(error.message + '\n')
    process.exitCode = 1
  }
}
module.exports = {
  normalizeReport,
  begin,
  complete,
  manifestPath,
  sourceManifestPaths
}
