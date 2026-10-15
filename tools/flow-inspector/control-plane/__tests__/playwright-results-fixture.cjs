/* global AbortController, fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const { runProcess } = require('../runner.cjs')
const { loadContract } = require('../contracts.cjs')
const { begin, complete, manifestPath } = require('../playwright-results.cjs')
const root = path.resolve(__dirname, '../../../..')
async function freePort() {
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
async function playwrightFixture(t) {
  fs.mkdirSync(path.join(root, 'tmp/flow-inspector'), { recursive: true })
  const repository = fs.mkdtempSync(
    path.join(root, 'tmp/flow-inspector/playwright-runtime-')
  )
  const app = path.join(repository, 'apps/asyra-design')
  const contract = loadContract(root, undefined, manifestPath)
  fs.mkdirSync(app, { recursive: true })
  const copy = (file) => {
    const destination = path.join(repository, file)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.cpSync(path.join(root, file), destination, { recursive: true })
  }
  for (const file of [
    'package.json',
    'yarn.lock',
    manifestPath,
    contract.architecturePath,
    contract.specPath,
    contract.configFile,
    'apps/asyra-design/src',
    'apps/asyra-design/server',
    'apps/asyra-design/public',
    'apps/asyra-design/package.json',
    'apps/asyra-design/index.html',
    'apps/asyra-design/tsconfig.json',
    'apps/asyra-design/app-environment.mjs',
    'apps/asyra-design/playwright-runtime-policy.mjs',
    'apps/asyra-design/tailwind.config.js',
    'apps/asyra-design/vite.config.ts',
    'apps/asyra-design/vtracer-tool-server.mjs',
    'apps/asyra-design/e2e/document-database-middleware.mjs',
    contract.testFile,
    'apps/asyra-design/e2e/test-utils.ts'
  ])
    copy(file)
  const appPort = await freePort(),
    backendPort = await freePort(),
    collaborationPort = await freePort()
  const temporary = path.join(repository, 'browser')
  fs.mkdirSync(temporary)
  const env = {
    PATH: process.env.PATH,
    LANG: 'en_US.UTF-8',
    CI: 'true',
    TMPDIR: process.env.RUNNER_TEMP || temporary,
    APP_URL: 'http://127.0.0.1:' + appPort,
    E2E_OWN_SERVERS: '1',
    E2E_DOCUMENT_BACKEND_URL: 'http://127.0.0.1:' + backendPort,
    DOCUMENT_PERSISTENCE_BACKEND_URL: 'http://127.0.0.1:' + backendPort,
    DOCUMENT_BACKEND_PORT: String(backendPort),
    DOCUMENT_BACKEND_DATA_DIR: path.join(repository, 'document-backend'),
    COLLABORATION_WS_HOST: '127.0.0.1',
    COLLABORATION_WS_PORT: String(collaborationPort),
    VITE_COLLABORATION_WS_URL:
      'ws://127.0.0.1:' + collaborationPort + '/collaboration'
  }
  const running = []
  t.after(async () => {
    for (const entry of running) entry.controller.abort()
    await Promise.all(running.map((entry) => entry.promise))
  })
  async function start(args, url, label) {
    const controller = new AbortController()
    const entry = { controller, done: false, pid: null }
    entry.promise = runProcess({
      executable: process.execPath,
      args,
      cwd: app,
      env,
      signal: controller.signal,
      timeoutMs: 240000,
      maxOutputBytes: 512 * 1024,
      onSpawn: (pid) => {
        entry.pid = pid
      }
    }).then((result) => {
      entry.done = true
      entry.result = result
      fs.writeFileSync(path.join(repository, label + '.log'), result.output)
      return result
    })
    running.push(entry)
    const deadline = Date.now() + 45000
    while (Date.now() < deadline) {
      if (entry.done)
        throw new Error(label + ' stopped: ' + entry.result.output.slice(-6000))
      try {
        if ((await fetch(url)).ok) return
      } catch {
        /* Startup is bounded by the owning deadline. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw new Error(label + ' did not become ready; PID ' + entry.pid)
  }
  await start(
    [
      path.join(
        root,
        'apps/asyra-design/dist/document-backend/document-backend.js'
      )
    ],
    env.E2E_DOCUMENT_BACKEND_URL + '/health',
    'backend'
  )
  await start(
    [
      path.join(
        root,
        'apps/asyra-design/dist/collaboration-server/collaboration-server.js'
      )
    ],
    'http://127.0.0.1:' + collaborationPort + '/health',
    'collaboration'
  )
  await start(
    [
      path.join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      String(appPort),
      '--strictPort'
    ],
    env.APP_URL,
    'vite'
  )
  const sourceFile = path.join(app, 'src/features/delete-element/index.ts')
  const source = fs.readFileSync(sourceFile, 'utf8')
  let sequence = 0
  return {
    repository,
    sourceFile,
    fault(kind = 'deletion') {
      if (!['deletion', 'path-mode'].includes(kind))
        throw new Error('Unknown isolated deletion fault')
      fs.writeFileSync(
        sourceFile,
        kind === 'deletion'
          ? source.replace(
              'elementApis.deleteElement(elementId)',
              'false && elementApis.deleteElement(elementId)'
            )
          : source.replace(
              'if (systemContextApis.getPathEditingMode())',
              'if (false)'
            )
      )
    },
    restore() {
      fs.writeFileSync(sourceFile, source)
    },
    async run(caseIds = ['design.delete']) {
      if (!caseIds.length || new Set(caseIds).size !== caseIds.length)
        throw new Error('Select distinct admitted Playwright cases')
      const names = caseIds.map((id) => {
        const item = contract.cases.find((candidate) => candidate.id === id)
        if (!item) throw new Error('Unknown Playwright case: ' + id)
        return item.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      })
      const reportPath = 'tmp/report-' + ++sequence + '.json'
      const args = [
        path.join(root, 'node_modules/playwright/cli.js'),
        'test',
        '--config',
        'playwright.config.ts',
        'e2e/delete-element.spec.ts',
        '--grep',
        '(?:' + names.join('|') + ')$',
        '--workers=1',
        '--retries=0',
        '--reporter=line,json'
      ]
      const context = begin(
        repository,
        reportPath,
        { E2E_SUITE: 'functional', FLOW_CI_REPORT: reportPath },
        {
          cwd: 'apps/asyra-design',
          argv: [process.execPath, ...args],
          environment: { CI: 'true', APP_URL: env.APP_URL }
        }
      )
      const result = await runProcess({
        executable: process.execPath,
        args,
        cwd: app,
        env: {
          ...env,
          PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(repository, reportPath)
        },
        timeoutMs: 75000,
        maxOutputBytes: 512 * 1024
      })
      fs.writeFileSync(
        path.join(repository, 'run-' + sequence + '.log'),
        result.output
      )
      return { context, result, record: complete(repository, reportPath) }
    }
  }
}
module.exports = { playwrightFixture }
