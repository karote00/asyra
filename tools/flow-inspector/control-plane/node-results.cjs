/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')

// Translate Node's structured stream into the observation owner's existing report
// shape. No TAP parsing, App-specific verdict, inferred pass, or fallback path.
function normalizeNodeEvents(events, { files, cwd }) {
  const expected = new Set(files.map((file) => path.resolve(cwd, file)))
  const errors = []
  const declarations = new Map()
  const completed = new Set()
  const suites = new Map()
  const summaries = new Map()
  const final = []

  const key = (file, id) => JSON.stringify([file, id])

  if (!Array.isArray(events)) {
    return {
      report: { success: false, testResults: [] },
      errors: ['Malformed Node events']
    }
  }

  for (const event of events) {
    if (
      !event ||
      typeof event.type !== 'string' ||
      !event.data ||
      typeof event.data !== 'object'
    ) {
      errors.push('Malformed Node event')
      continue
    }

    const data = event.data

    if (event.type === 'test:summary') {
      if (data.file) {
        const file = path.resolve(cwd, data.file)
        const list = summaries.get(file) ?? []

        list.push(data)
        summaries.set(file, list)
      } else {
        final.push(data)
      }

      continue
    }

    if (!['test:enqueue', 'test:pass', 'test:fail'].includes(event.type)) {
      continue
    }

    // The outer file wrapper is not a case. A failing wrapper is nevertheless
    // an execution error, including a process that exited before registration.
    if (!data.entryFile) {
      if (event.type === 'test:fail') {
        errors.push('Node file execution failed: ' + data.name)
      }

      continue
    }

    const file = path.resolve(cwd, data.entryFile)

    if (
      !expected.has(file) ||
      typeof data.name !== 'string' ||
      !Number.isSafeInteger(data.testId)
    ) {
      errors.push('Unknown or malformed Node case identity')
      continue
    }

    const identity = key(file, data.testId)

    if (event.type === 'test:enqueue') {
      if (declarations.has(identity)) {
        errors.push('Duplicate Node case declaration: ' + identity)
      }

      declarations.set(identity, data)
      continue
    }

    const declaration = declarations.get(identity)

    if (
      !declaration ||
      declaration.name !== data.name ||
      declaration.parentId !== data.parentId ||
      completed.has(identity)
    ) {
      errors.push(
        'Missing, conflicting or duplicate Node case result: ' + identity
      )
      continue
    }

    completed.add(identity)
    if (data.details?.type === 'suite') {
      if (
        event.type === 'test:fail' &&
        data.details.error?.failureType !== 'subtestsFailed'
      ) {
        errors.push('Node suite execution failed: ' + data.name)
      }

      continue
    }

    const names = [data.name]
    const ancestors = new Set([data.testId])
    let parentId = data.parentId

    while (parentId) {
      const parent = declarations.get(key(file, parentId))

      if (!parent || ancestors.has(parentId)) {
        errors.push('Missing or cyclic Node parent identity: ' + identity)
        break
      }

      ancestors.add(parentId)
      names.unshift(parent.name)
      parentId = parent.parentId
    }

    let status = event.type === 'test:pass' ? 'passed' : 'failed'

    if (data.details?.error?.failureType === 'cancelledByParent') {
      status = 'pending'
    }

    if (data.todo) {
      status = 'todo'
    }

    if (data.skip) {
      status = 'skipped'
    }

    const suite = suites.get(file) ?? {
      name: file,
      status: 'passed',
      assertionResults: []
    }
    const fullName = names.join(' ')

    if (suite.assertionResults.some((item) => item.fullName === fullName)) {
      errors.push('Ambiguous Node case title: ' + fullName)
    }

    suite.assertionResults.push({
      fullName,
      status,
      failureMessages: data.details?.error
        ? [
            data.details.error.stack ??
              data.details.error.message ??
              JSON.stringify(data.details.error)
          ]
        : [],
      location: { line: data.line, column: data.column }
    })
    if (status === 'failed') {
      suite.status = 'failed'
    }

    suites.set(file, suite)
  }

  for (const identity of declarations.keys()) {
    if (!completed.has(identity)) {
      errors.push('Unexecuted Node case: ' + identity)
    }
  }

  const verifySummary = (summary, assertions, label) => {
    if (!summary || typeof summary.success !== 'boolean' || !summary.counts) {
      errors.push('Malformed Node summary: ' + label)

      return
    }

    const counts = {
      tests: assertions.length,
      passed: assertions.filter((item) => item.status === 'passed').length,
      failed: assertions.filter((item) => item.status === 'failed').length,
      skipped: assertions.filter((item) => item.status === 'skipped').length,
      todo: assertions.filter((item) => item.status === 'todo').length,
      cancelled: assertions.filter((item) => item.status === 'pending').length
    }

    for (const [name, count] of Object.entries(counts)) {
      if (summary.counts[name] !== count) {
        errors.push('Node summary count mismatch: ' + label + '/' + name)
      }
    }

    if (summary.success && (counts.failed || counts.cancelled)) {
      errors.push('Node summary success masks failure: ' + label)
    }
  }

  for (const file of expected) {
    const list = summaries.get(file) ?? []

    if (list.length !== 1) {
      errors.push('Missing or duplicate Node file summary: ' + file)
    } else {
      verifySummary(list[0], suites.get(file)?.assertionResults ?? [], file)
    }

    if (!suites.get(file)?.assertionResults.length) {
      errors.push('Missing or unexecuted Node cases: ' + file)
    }
  }

  for (const file of summaries.keys()) {
    if (!expected.has(file)) {
      errors.push('Unexpected Node file summary: ' + file)
    }
  }

  const testResults = [...suites.values()]
  const assertions = testResults.flatMap((suite) => suite.assertionResults)

  if (final.length !== 1) {
    errors.push('Missing or duplicate final Node summary')
  } else {
    verifySummary(final[0], assertions, 'execution')
  }

  return {
    report: {
      success: errors.length === 0 && final[0]?.success === true,
      testResults
    },
    errors
  }
}

module.exports = { normalizeNodeEvents }
