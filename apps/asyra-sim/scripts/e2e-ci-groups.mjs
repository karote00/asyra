import fs from 'node:fs'
import path from 'node:path'

export const CI_E2E_GROUPS = [
  {
    name: 'project-state',
    files: [
      'e2e/__tests__/projects.spec.ts',
      'e2e/__tests__/automatic-persistence.spec.ts',
      'e2e/__tests__/pilot-recovery.spec.ts'
    ]
  },
  {
    name: 'project-evidence',
    files: [
      'e2e/__tests__/visual-references.spec.ts',
      'e2e/__tests__/candidate-comparison.spec.ts',
      'e2e/__tests__/retained-runs.spec.ts',
      'e2e/__tests__/field-observations.spec.ts'
    ]
  },
  {
    name: 'history-and-fields',
    files: [
      'e2e/__tests__/history-editing.spec.ts',
      'e2e/__tests__/history-shortcuts.spec.ts',
      'e2e/__tests__/object-fields.spec.ts'
    ]
  },
  {
    name: 'analysis-inputs',
    files: [
      'e2e/__tests__/acceptance-rules.spec.ts',
      'e2e/__tests__/resources.spec.ts',
      'e2e/__tests__/workcell.spec.ts',
      'e2e/__tests__/original-part-admission.spec.ts'
    ]
  },
  {
    name: 'analysis-runs',
    files: [
      'e2e/__tests__/methods.spec.ts',
      'e2e/__tests__/experiments.spec.ts',
      'e2e/__tests__/formal-outcomes.spec.ts'
    ]
  },
  {
    name: 'playback-feedback',
    files: [
      'e2e/__tests__/live-playback.spec.ts',
      'e2e/__tests__/manual-seek.spec.ts',
      'e2e/__tests__/mixed-pair-feedback.spec.ts',
      'e2e/__tests__/timeline-target-pose.spec.ts'
    ]
  },
  {
    name: 'browser-runtime',
    files: [
      'src/domain/__tests__/runtime.browser.spec.ts',
      'src/engine/glb/__tests__/runtime.browser.spec.ts',
      'src/storage/__tests__/runtime.browser.spec.ts',
      'src/analysis/__tests__/runner.browser.spec.ts',
      'src/analysis/__tests__/budget-baseline.browser.spec.ts',
      'src/analysis/methods/__tests__/runtime.browser.spec.ts',
      'e2e/__tests__/navigation-performance.spec.ts',
      'e2e/__tests__/trackpad-navigation.spec.ts',
      'e2e/__tests__/viewport-navigation.spec.ts',
      'e2e/__tests__/playback-continuity.spec.ts',
      'e2e/__tests__/playback-latency.spec.ts',
      'e2e/__tests__/playback-notice.spec.ts'
    ]
  },
  {
    name: 'workbench-import',
    files: [
      'e2e/__tests__/trajectory-import.spec.ts',
      'e2e/__tests__/workbench-flow.spec.ts'
    ]
  },
  {
    name: 'workbench-controls',
    files: [
      'e2e/__tests__/toolbar.spec.ts',
      'e2e/__tests__/starter-experiments.spec.ts'
    ]
  },
  {
    name: 'visual-workbench',
    files: [
      'e2e/__tests__/theme.spec.ts',
      'e2e/__tests__/workbench-review.spec.ts',
      'e2e/__tests__/mechanical-review.spec.ts'
    ]
  }
]

function walkFiles(directory, root, output) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walkFiles(absolute, root, output)
    else if (entry.isFile())
      output.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
}

export function collectBrowserSpecFiles(workspaceRoot) {
  const discovered = []
  walkFiles(path.join(workspaceRoot, 'e2e'), workspaceRoot, discovered)
  walkFiles(path.join(workspaceRoot, 'src'), workspaceRoot, discovered)
  return discovered
    .filter(
      (file) =>
        (file.startsWith('e2e/') && file.endsWith('.spec.ts')) ||
        (file.startsWith('src/') &&
          path.basename(path.dirname(file)) === '__tests__' &&
          file.endsWith('.browser.spec.ts'))
    )
    .sort()
}

function reportCounts(report) {
  let passedCount = 0
  let failedTestCount = 0
  const visit = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? [])
          for (const result of test.results ?? []) {
            if (result.status === 'passed') passedCount++
            else if (['failed', 'timedOut'].includes(result.status))
              failedTestCount++
          }
      visit(suite.suites)
    }
  }
  visit(report?.suites)
  const errorCount = report?.errors?.length ?? 0
  return {
    testCount: passedCount + failedTestCount,
    passedCount,
    failedTestCount,
    errorCount,
    failedCount: failedTestCount + errorCount
  }
}

export function mergePlaywrightReports(groupRuns, identity) {
  const suites = []
  const errors = []
  const groups = []
  const totals = {
    testCount: 0,
    passedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    flakyCount: 0,
    durationMs: 0
  }

  for (const run of groupRuns) {
    const report = run.report ?? { suites: [], errors: [] }
    const counts = reportCounts(report)
    suites.push(...(report.suites ?? []))
    errors.push(...(report.errors ?? []))
    if (run.error)
      errors.push({ message: `${run.group} runner error: ${run.error}` })
    if (
      run.exitCode !== 0 &&
      !report.errors?.length &&
      counts.failedCount === 0
    )
      errors.push({
        message: `${run.group} exited with status ${run.exitCode}`
      })
    const failedCount = Math.max(counts.failedCount, run.exitCode === 0 ? 0 : 1)
    const stats = report.stats ?? {}
    totals.testCount += counts.testCount
    totals.passedCount += counts.passedCount
    totals.failedCount += failedCount
    totals.skippedCount += stats.skipped ?? 0
    totals.flakyCount += stats.flaky ?? 0
    totals.durationMs += stats.duration ?? 0
    groups.push({
      group: run.group,
      command: run.command,
      exitCode: run.exitCode,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      outputDirectory: run.outputDirectory,
      reportPath: run.reportPath,
      outcomeCounts: {
        testCount: counts.testCount,
        ...counts,
        skippedCount: stats.skipped ?? 0,
        flakyCount: stats.flaky ?? 0
      },
      error: run.error ?? null
    })
  }

  return {
    suites,
    errors,
    stats: {
      startTime: groupRuns[0]?.startedAt ?? null,
      duration: totals.durationMs,
      expected: totals.passedCount,
      skipped: totals.skippedCount,
      unexpected: totals.failedCount,
      flaky: totals.flakyCount
    },
    ci: { identity, totals, groups }
  }
}
