/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs'),
  path = require('node:path'),
  { createRequire } = require('node:module')
const { loadContract } = require('../control-plane/contracts.cjs')
const {
  selectedCommand,
  selectedPlaywrightConfig
} = require('../control-plane/node-interactions.cjs')
const { runProcess } = require('../control-plane/runner.cjs')
const { participatingCases } = require('./producers.cjs')
const localization = require('../control-plane/localization.cjs')
const playwright = require('../control-plane/playwright-results.cjs')
async function runSelected(
  root,
  manifestPath,
  caseId,
  projectName = undefined
) {
  if (!process.env.FLOW_FILE_DIRECTORY)
    throw new Error('Select a current flow directory first')
  const contract = loadContract(root, undefined, manifestPath),
    candidate = contract.cases.find((c) => c.id === caseId)
  if (!candidate) throw new Error('Unknown mapped case')
  projectName = projectName ?? candidate.projectName ?? ''
  const testFile = candidate.testFile ?? contract.testFile
  const command = selectedCommand(root, {
    contract,
    item: { file: testFile, testName: candidate.testName, projectName }
  })
  const parent = path.join(root, 'tmp/flow-inspector/current-command')
  fs.mkdirSync(parent, { recursive: true })
  const temporary = fs.mkdtempSync(path.join(parent, 'selected-'))
  const report = path.join(temporary, 'report.json'),
    config = path.join(temporary, 'selected.config.ts'),
    runtimeRequire = createRequire(path.join(root, 'package.json'))
  const controller = new AbortController(),
    cancel = () => controller.abort()
  process.once('SIGINT', cancel)
  process.once('SIGTERM', cancel)
  try {
    const isPlaywright = contract.runner === 'playwright'
    let executionConfig
    if (isPlaywright) {
      fs.writeFileSync(
        config,
        selectedPlaywrightConfig(root, contract, command)
      )
      executionConfig = {
        path: path.relative(root, config),
        digest: require('node:crypto')
          .createHash('sha256')
          .update(fs.readFileSync(config))
          .digest('hex'),
        originalConfigFile: contract.configFile
      }
    } else {
      const exact = path
        .resolve(root, testFile)
        .replace(/[?*{}[\]]/g, (c) => '[' + c + ']')
      fs.writeFileSync(
        config,
        `import original from ${JSON.stringify(path.resolve(root, contract.configFile))}\nexport default async env=>{const config=await(typeof original==='function'?original(env):original);return {...config,test:{...config.test,include:${JSON.stringify([exact])}}}}\n`
      )
    }
    const args = [
      runtimeRequire.resolve(
        isPlaywright ? '@playwright/test/cli' : 'vitest/vitest.mjs'
      ),
      ...command.args
    ]
    args[args.indexOf('--config') + 1] = config
    if (!isPlaywright) args.push('--outputFile', report)
    const env = {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_FILE: report,
      FLOW_PROOF_SOURCE: root,
      FLOW_PROOF_SCENARIO: 'baseline',
      TMPDIR: temporary,
      ...(isPlaywright
        ? { E2E_SKIP_PERFORMANCE: 'true', E2E_OWN_SERVERS: '1' }
        : {})
    }
    const commandRecord = {
      cwd: command.cwd,
      argv: [process.execPath, ...args]
    }
    const request = { version: 1, manifestPath, caseIds: [caseId] }
    let context
    if (isPlaywright) {
      const source = ['functional', 'status', 'collaboration'].find((source) =>
        playwright.sourceManifestPaths(source).includes(manifestPath)
      )
      context = playwright.begin(
        root,
        path.relative(root, report),
        env,
        commandRecord,
        source,
        executionConfig,
        request
      )
    } else
      context = localization.beginObservation(root, {
        manifestPaths: [manifestPath],
        command: commandRecord,
        request
      })

    if (isPlaywright) env.FLOW_OBSERVATION_ID = context.id
    let completed
    const result = await runProcess({
      executable: process.execPath,
      args,
      cwd: path.resolve(root, command.cwd),
      env,
      signal: controller.signal,
      inheritProcessGroup: process.env.FLOW_PARENT_EXECUTION === '1',
      timeoutMs: 110000,
      maxOutputBytes: 262144
    })
    if (isPlaywright)
      completed = playwright.complete(root, path.relative(root, report))
    else {
      let parsed = null
      const errors = []
      try {
        if (fs.statSync(report).size > 16 * 1024 * 1024)
          throw new Error('Report exceeds 16 MiB')
        parsed = JSON.parse(fs.readFileSync(report, 'utf8'))
      } catch (error) {
        errors.push(error.message)
      }
      if (result.reason) errors.push(result.reason)
      let normalized = {
        report: parsed,
        options: {
          projects: (parsed?.testResults ?? []).map(() => projectName)
        }
      }
      completed = localization.completeObservation(
        root,
        context,
        normalized.report,
        {
          ...normalized.options,
          errors: [...(normalized.options.errors ?? []), ...errors]
        }
      )
    }
    return result.code === 0 &&
      !result.reason &&
      !completed.issues.length &&
      participatingCases(completed).length &&
      participatingCases(completed).every(
        (item) =>
          item.status === 'passed' &&
          item.resolution === 'mapped' &&
          item.locations.length === 1
      )
      ? 0
      : 1
  } finally {
    process.removeListener('SIGINT', cancel)
    process.removeListener('SIGTERM', cancel)
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}
if (require.main === module)
  runSelected(process.cwd(), ...process.argv.slice(2))
    .then((code) => {
      process.exitCode = code
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
module.exports = { runSelected }
