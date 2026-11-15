/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')

// Runner summaries are redundant evidence. They may never contradict the
// individual observations, even when a producer reports overall success.
function reportCountIssues(report) {
  if (!report || !Array.isArray(report.testResults)) {
    return []
  }

  const assertions = report.testResults.flatMap((suite) =>
    Array.isArray(suite?.assertionResults) ? suite.assertionResults : []
  )
  const counts = {
    numTotalTests: assertions.length,
    numPassedTests: assertions.filter((item) => item?.status === 'passed')
      .length,
    numFailedTests: assertions.filter((item) => item?.status === 'failed')
      .length,
    numPendingTests: assertions.filter((item) =>
      ['pending', 'skipped'].includes(item?.status)
    ).length,
    numTodoTests: assertions.filter((item) => item?.status === 'todo').length
  }
  const issues = []

  for (const [name, expected] of Object.entries(counts)) {
    if (!Object.hasOwn(report, name)) {
      continue
    }

    if (!Number.isSafeInteger(report[name]) || report[name] < 0) {
      issues.push('Invalid runner count: ' + name)
    } else if (report[name] !== expected) {
      issues.push('Runner summary disagrees with observations: ' + name)
    }
  }

  if (Object.hasOwn(report, 'numRuntimeErrorTestSuites')) {
    if (
      !Number.isSafeInteger(report.numRuntimeErrorTestSuites) ||
      report.numRuntimeErrorTestSuites < 0
    ) {
      issues.push('Invalid runner count: numRuntimeErrorTestSuites')
    } else if (report.numRuntimeErrorTestSuites > 0) {
      issues.push('Runner reported runtime errors')
    }
  }

  return issues
}

// Whole-run completeness is separate from exact selected reruns, where other
// cases may intentionally be unexecuted. Required scope is supplied by the
// reviewed feature contract, never inferred from this report's observed files.
function completeReportIssues(report, { root, requiredFiles, requiredCases }) {
  if (
    !Array.isArray(requiredFiles) ||
    !requiredFiles.length ||
    new Set(requiredFiles).size !== requiredFiles.length ||
    requiredFiles.some(
      (file) =>
        typeof file !== 'string' ||
        !file ||
        path.isAbsolute(file) ||
        file.includes('\\') ||
        file.includes('\0') ||
        file.split('/').some((part) => !part || part === '.' || part === '..')
    )
  ) {
    throw new Error('Invalid independently required file scope')
  }

  const expectedCases = new Map(
    requiredFiles.map((file) => [path.resolve(root, file), new Set()])
  )

  if (!Array.isArray(requiredCases) || !requiredCases.length) {
    throw new Error('Missing independently required cases')
  }

  for (const item of requiredCases) {
    const names =
      typeof item?.file === 'string' &&
      expectedCases.get(path.resolve(root, item.file))

    if (
      !names ||
      !requiredFiles.includes(item.file) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      names.has(item.title)
    ) {
      throw new Error('Invalid independently required case identity')
    }

    names.add(item.title)
  }

  if ([...expectedCases.values()].some((names) => !names.size)) {
    throw new Error('Missing independently required cases for a required file')
  }

  const issues = reportCountIssues(report)

  if (!report || report.success !== true) {
    issues.push('Missing successful runner completion')
  }

  if (!report || !Array.isArray(report.testResults)) {
    return [...issues, 'Missing runner file observations']
  }

  if (report.errors?.length) {
    issues.push('Runner reported execution errors')
  }

  const required = new Set(
    requiredFiles.map((file) => path.resolve(root, file))
  )
  const observed = new Set()
  const namesByFile = new Map()

  for (const suite of report.testResults) {
    if (
      !suite ||
      typeof suite.name !== 'string' ||
      !Array.isArray(suite.assertionResults)
    ) {
      issues.push('Malformed test file observation')
      continue
    }

    const file = path.resolve(root, suite.name)

    if (!required.has(file)) {
      issues.push('Unexpected test file: ' + suite.name)
    }

    observed.add(file)
    if (!suite.assertionResults.length) {
      issues.push('No executed assertions: ' + suite.name)
    }

    if (suite.status !== undefined && suite.status !== 'passed') {
      issues.push('Unsuccessful test file: ' + suite.name)
    }

    // Formal producers may emit one row per case. Identity is file plus case,
    // so repeated rows must remain disjoint rather than hiding duplicates.
    const names = namesByFile.get(file) ?? new Set()

    namesByFile.set(file, names)

    for (const item of suite.assertionResults) {
      if (
        !item ||
        typeof item.fullName !== 'string' ||
        !item.fullName.trim() ||
        typeof item.status !== 'string'
      ) {
        issues.push('Malformed assertion: ' + suite.name)
        continue
      }

      if (names.has(item.fullName)) {
        issues.push('Duplicate assertion: ' + suite.name + ': ' + item.fullName)
      }

      names.add(item.fullName)
      if (!expectedCases.get(file)?.has(item.fullName)) {
        issues.push(
          'Unexpected test case: ' + suite.name + ': ' + item.fullName
        )
      }

      if (item.status !== 'passed') {
        issues.push(
          'Unsuccessful assertion: ' + suite.name + ': ' + item.fullName
        )
      }

      if (item.failureMessages?.length) {
        issues.push('Assertion carries failure diagnostics: ' + item.fullName)
      }
    }
  }

  for (const file of required) {
    if (!observed.has(file)) {
      issues.push('Missing required test file: ' + path.relative(root, file))
    }
  }

  for (const [file, names] of expectedCases) {
    for (const title of names) {
      if (!namesByFile.get(file)?.has(title)) {
        issues.push(
          'Missing required test case: ' +
            path.relative(root, file) +
            ': ' +
            title
        )
      }
    }
  }

  return issues
}

module.exports = { reportCountIssues, completeReportIssues }
