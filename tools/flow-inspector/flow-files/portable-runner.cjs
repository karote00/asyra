/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path'),
  { createRequire } = require('node:module')
const {
  capture,
  normalize,
  publish,
  reportDiagnostic
} = require('./adapters.cjs')
const { dataPath, readJson } = require('./project.cjs')
const { runProcess } = require('../control-plane/runner.cjs')
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function resolveRunner(project, selected) {
  const cwd =
    selected.cwd === '.' ? project.root : dataPath(project.root, selected.cwd)
  const name = selected.producer === 'vitest' ? 'vitest' : '@playwright/test'
  const request = createRequire(path.join(cwd, 'package.json'))
  let manifest
  try {
    manifest = fs.realpathSync(request.resolve(name + '/package.json'))
  } catch {
    throw new Error(
      'Install the supported project-local ' +
        name +
        ' runner before executing this action'
    )
  }
  if (!manifest.startsWith(project.root + path.sep))
    throw new Error('Runner resolves outside selected project')
  const metadata = readJson(manifest)
  const supported = selected.producer === 'vitest' ? '3.2.' : '1.62.'
  if (!metadata.version.startsWith(supported))
    throw new Error(
      'Unsupported ' + name + ' version: expected ' + supported + 'x'
    )
  return {
    cwd,
    cli: path.join(
      path.dirname(manifest),
      selected.producer === 'vitest' ? 'vitest.mjs' : 'cli.js'
    )
  }
}
async function runSelected(project, filter, options = {}) {
  const receipt = capture(project, filter)
  if (receipt.cases.length !== 1)
    throw new Error('Explicit rerun requires one exact criterion')
  const captured = receipt.cases[0]
  if (process.env.FLOW_PARENT_EXECUTION) {
    if (
      process.env.FLOW_ID !== captured.flowId ||
      process.env.FLOW_NODE_ID !== captured.nodeId ||
      Number(process.env.FLOW_EXPECTED_REVISION) !== captured.revision ||
      process.env.FLOW_BINDING !== captured.binding ||
      !process.env.FLOW_EXECUTION_ID
    )
      throw new Error('Parent action scope is stale or mismatched')
    receipt.executionId = process.env.FLOW_EXECUTION_ID
  }
  const selected = captured.selector
  if (selected.project.includes('*') || selected.project.startsWith('!'))
    throw new Error('Wildcard project names cannot be selected exactly')
  const runner = resolveRunner(project, selected)
  const parent = dataPath(project.root, '.flow-runtime')
  fs.mkdirSync(parent, { recursive: true })
  const temporary = fs.mkdtempSync(path.join(parent, 'run-'))
  const report = path.join(temporary, 'result.json')
  const file = dataPath(project.root, selected.file),
    config = dataPath(project.root, selected.config)
  const args =
    selected.producer === 'vitest'
      ? [
          runner.cli,
          'run',
          file,
          '--config',
          config,
          '--testNamePattern',
          '^' + escape(selected.title) + '$',
          '--reporter=json',
          '--outputFile',
          report,
          '--maxWorkers=1'
        ]
      : [
          runner.cli,
          'test',
          escape(file),
          '--config',
          config,
          '--grep',
          '^' +
            escape(
              selected.project +
                ' ' +
                path
                  .relative(path.dirname(config), file)
                  .split(path.sep)
                  .join('/') +
                ' ' +
                selected.title
            ) +
            '$',
          '--reporter=json',
          '--workers=1',
          '--retries=0',
          '--no-deps'
        ]
  args.push('--project', selected.project)
  try {
    if (selected.producer === 'vitest') {
      const discovery = await runProcess({
        executable: process.execPath,
        args: [
          runner.cli,
          'list',
          file,
          '--config',
          config,
          '--testNamePattern',
          '^' + escape(selected.title) + '$',
          '--json',
          report,
          '--project',
          selected.project
        ],
        cwd: runner.cwd,
        env: process.env,
        signal: options.signal,
        timeoutMs: 30000,
        inheritProcessGroup: Boolean(process.env.FLOW_PARENT_EXECUTION),
        onSpawn: options.onSpawn
      })
      const catalog =
        discovery.code === 0 && fs.existsSync(report)
          ? readJson(report, 32 * 1024 * 1024)
          : []
      if (
        !Array.isArray(catalog) ||
        catalog.length !== 1 ||
        catalog[0].file !== file ||
        (catalog[0].projectName ?? '') !== selected.project
      ) {
        const documents = publish(
          project,
          receipt,
          [],
          'No unique exact test discovered: ' + discovery.output.slice(-900)
        )
        return { code: 1, executionId: receipt.executionId, documents }
      }
      fs.unlinkSync(report)
    }
    if (selected.producer === 'playwright') {
      const discovery = await runProcess({
        executable: process.execPath,
        args: [
          runner.cli,
          'test',
          escape(file),
          '--config',
          config,
          '--list',
          '--reporter=json',
          '--no-deps',
          '--project',
          selected.project
        ],
        cwd: runner.cwd,
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: report },
        signal: options.signal,
        timeoutMs: 30000,
        inheritProcessGroup: Boolean(process.env.FLOW_PARENT_EXECUTION),
        onSpawn: options.onSpawn
      })
      if (discovery.code !== 0 || !fs.existsSync(report)) {
        publish(
          project,
          receipt,
          [],
          'Test discovery failed: ' + discovery.output.slice(-1000)
        )
        return { code: 1, executionId: receipt.executionId }
      }
      const catalog = readJson(report, 32 * 1024 * 1024)
      const matches = normalize(project, catalog, selected).filter(
        (r) =>
          JSON.stringify(r.selector) ===
          JSON.stringify({
            producer: selected.producer,
            config: selected.config,
            cwd: selected.cwd,
            file: selected.file,
            title: selected.title,
            project: selected.project
          })
      )
      if (matches.length !== 1) {
        publish(
          project,
          receipt,
          [],
          matches.length
            ? 'Ambiguous exact test selection'
            : 'No tests found for the exact selection'
        )
        return { code: 1, executionId: receipt.executionId }
      }
      args[args.indexOf('--grep') + 1] =
        '^' +
        escape(
          selected.project +
            ' ' +
            path
              .relative(catalog.config.rootDir, file)
              .split(path.sep)
              .join('/') +
            ' ' +
            selected.title
        ) +
        '$'
      fs.unlinkSync(report)
    }
    const result = await runProcess({
      executable: process.execPath,
      args,
      cwd: runner.cwd,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: report },
      signal: options.signal,
      timeoutMs: 110000,
      inheritProcessGroup: Boolean(process.env.FLOW_PARENT_EXECUTION),
      onSpawn: options.onSpawn
    })
    let records = [],
      diagnostic = result.reason ? 'Execution ' + result.reason : ''
    if (fs.existsSync(report)) {
      try {
        const raw = readJson(report, 32 * 1024 * 1024)
        records = normalize(project, raw, selected)
        diagnostic ||= reportDiagnostic(raw, records)
      } catch (error) {
        diagnostic = error.message
      }
    } else
      diagnostic ||= 'Runner produced no report: ' + result.output.slice(-1000)
    if (result.code !== 0 && !records.some((r) => r.status === 'failed'))
      diagnostic ||= 'Runner failed without a completed failing test'
    const documents = publish(project, receipt, records, diagnostic)
    return {
      code:
        result.code === 0 &&
        !diagnostic &&
        documents.some((d) =>
          d.current.observations.some(
            (o) =>
              o.nodeId === captured.nodeId &&
              o.criterionId === captured.criterionId &&
              o.executionId === receipt.executionId &&
              o.status === 'passed'
          )
        )
          ? 0
          : 1,
      executionId: receipt.executionId,
      documents
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}
module.exports = { runSelected, resolveRunner }
