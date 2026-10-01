import fs from 'node:fs'
import path from 'node:path'

export const CI_E2E_GROUPS = [
  {
    name: 'scene-configuration',
    files: [
      'e2e/configuration-immediate-edits.spec.ts',
      'e2e/configuration-clearance-history.spec.ts',
      'e2e/configuration-planted-scene-responsiveness.spec.ts',
      'e2e/configuration-canvas-history.spec.ts',
      'e2e/soil-history-shortcut.spec.ts'
    ]
  },
  {
    name: 'camera-interaction',
    files: ['e2e/camera-flight.spec.ts', 'e2e/camera-touch.spec.ts']
  },
  {
    name: 'greenhouse-model',
    files: ['e2e/crops.spec.ts', 'e2e/drains.spec.ts', 'e2e/greenhouse.spec.ts']
  },
  {
    name: 'locale-layout',
    files: [
      'e2e/locale-state.spec.ts',
      'e2e/locale-layout-360-zh-tw.spec.ts',
      'e2e/locale-layout-360-en.spec.ts',
      'e2e/locale-layout-390-zh-tw.spec.ts',
      'e2e/locale-layout-390-en.spec.ts',
      'e2e/locale-layout-768-zh-tw.spec.ts',
      'e2e/locale-layout-768-en.spec.ts',
      'e2e/locale-layout-1440-zh-tw.spec.ts',
      'e2e/locale-layout-1440-en.spec.ts'
    ]
  },
  {
    name: 'workspace-panels',
    files: [
      'e2e/panels.spec.ts',
      'e2e/panels-responsive.spec.ts',
      'e2e/reference-dialog.spec.ts'
    ]
  },
  {
    name: 'robot-workspace',
    files: [
      'e2e/robot-layout-390-zh-tw.spec.ts',
      'e2e/robot-layout-390-en.spec.ts',
      'e2e/robot-layout-1440-zh-tw.spec.ts',
      'e2e/robot-layout-1440-en.spec.ts'
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
  return discovered
    .filter((file) => file.startsWith('e2e/') && file.endsWith('.spec.ts'))
    .sort()
}

export function mergePlaywrightReports(groupRuns) {
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
    const stats = report.stats ?? {}
    const passedCount = stats.expected ?? 0
    const skippedCount = stats.skipped ?? 0
    const failedCount = Math.max(
      stats.unexpected ?? 0,
      report.errors?.length ?? 0,
      run.exitCode === 0 ? 0 : 1
    )
    suites.push(...(report.suites ?? []))
    errors.push(...(report.errors ?? []))
    if (run.error)
      errors.push({ message: `${run.group} runner error: ${run.error}` })
    if (!report.stats || passedCount + skippedCount + failedCount === 0)
      errors.push({ message: `${run.group} produced no test outcomes` })
    totals.testCount += passedCount + failedCount
    totals.passedCount += passedCount
    totals.failedCount += failedCount
    totals.skippedCount += skippedCount
    totals.flakyCount += stats.flaky ?? 0
    totals.durationMs += stats.duration ?? 0
    groups.push({ group: run.group, exitCode: run.exitCode })
  }

  return {
    ...(groupRuns.find((run) => run.report)?.report?.config
      ? { config: groupRuns.find((run) => run.report).report.config }
      : {}),
    suites,
    errors,
    stats: {
      startTime:
        groupRuns.find((run) => run.report)?.report?.stats?.startTime ?? null,
      duration: totals.durationMs,
      expected: totals.passedCount,
      skipped: totals.skippedCount,
      unexpected: totals.failedCount,
      flaky: totals.flakyCount
    },
    ci: { totals, groups }
  }
}
