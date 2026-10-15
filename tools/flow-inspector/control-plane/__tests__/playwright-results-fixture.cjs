/* global AbortController, fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const { runProcess } = require('../runner.cjs')
const { loadContract } = require('../contracts.cjs')
const {
  begin,
  complete,
  manifestPath,
  sourceManifestPaths
} = require('../playwright-results.cjs')
const root = path.resolve(__dirname, '../../../..')
async function freePort() {
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
async function playwrightFixture(t, options = {}) {
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
    'apps/asyra-design/test-data',
    'apps/asyra-design/samples/crdt-7076/action-batch.json',
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
  const observationSource = options.source ?? 'functional'
  const admitted = sourceManifestPaths(observationSource).map((manifest) =>
    loadContract(root, undefined, manifest)
  )
  for (const file of new Set(
    admitted.flatMap((selected) => [
      selected.manifestPath,
      selected.architecturePath,
      selected.specPath,
      selected.configFile,
      selected.testFile,
      ...selected.cases.map((item) => item.testFile ?? selected.testFile),
      ...selected.runtimeScope.steps.flatMap(
        (step) => step.implementationBoundary
      )
    ])
  ))
    copy(file)
  copy('apps/asyra-design/e2e')
  if (observationSource === 'status') {
    copy('.yarnrc.yml')
    copy('.yarn/install-state.gz')
    fs.symlinkSync(
      path.join(root, 'node_modules'),
      path.join(repository, 'node_modules'),
      'dir'
    )
    fs.symlinkSync(
      path.join(root, 'apps/asyra-design/node_modules'),
      path.join(app, 'node_modules'),
      'dir'
    )
  }
  if (options.isolateWorkspaces) {
    const copied = new Set()
    const copyWorkspace = (name) => {
      if (copied.has(name)) return
      copied.add(name)
      const workspace = fs.realpathSync(path.join(root, 'node_modules', name))
      if (!workspace.startsWith(root + path.sep))
        throw new Error('Workspace escapes repository')
      const relativeWorkspace = path.relative(root, workspace)
      const metadata = JSON.parse(
        fs.readFileSync(path.join(workspace, 'package.json'), 'utf8')
      )
      for (const entry of ['package.json', 'src', 'dist'])
        copy(relativeWorkspace + '/' + entry)
      const link = path.join(repository, 'node_modules', name)
      fs.mkdirSync(path.dirname(link), { recursive: true })
      fs.symlinkSync(
        path.relative(
          path.dirname(link),
          path.join(repository, relativeWorkspace)
        ),
        link,
        'dir'
      )
      for (const [dependency, version] of Object.entries(
        metadata.dependencies ?? {}
      ))
        if (version.startsWith('workspace:')) copyWorkspace(dependency)
    }
    const metadata = JSON.parse(
      fs.readFileSync(path.join(app, 'package.json'), 'utf8')
    )
    for (const [name, version] of Object.entries(metadata.dependencies))
      if (version.startsWith('workspace:')) copyWorkspace(name)
  }
  const allCases = admitted.flatMap((selected) =>
    selected.cases.map((item) => ({
      ...item,
      testFile: item.testFile ?? selected.testFile,
      contract: selected
    }))
  )
  const changedFiles = new Map()
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
  if (observationSource !== 'status')
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
    cases: allCases,
    faultOperation(caseId, file, operation) {
      const ts = require('typescript')
      const original = fs.readFileSync(path.join(repository, file), 'utf8')
      const source = ts.createSourceFile(
        file,
        original,
        ts.ScriptTarget.Latest,
        true
      )
      const matches = []
      const walk = (node) => {
        if (
          ts.isFunctionLike(node) &&
          node.body &&
          (ts.isVariableDeclaration(node.parent) ||
            ts.isPropertyAssignment(node.parent) ||
            ts.isMethodDeclaration(node) ||
            ts.isFunctionDeclaration(node))
        ) {
          const names = []
          for (
            let current = node;
            current && current !== source;
            current = current.parent
          ) {
            if (
              (ts.isVariableDeclaration(current) ||
                ts.isPropertyAssignment(current) ||
                ts.isMethodDeclaration(current) ||
                ts.isFunctionDeclaration(current)) &&
              current.name
            )
              names.unshift(
                current.name.getText(source).replace(/^['"]|['"]$/g, '')
              )
          }
          if (names.join('.').endsWith(operation)) matches.push(node)
        }
        ts.forEachChild(node, walk)
      }
      walk(source)
      if (matches.length !== 1)
        throw new Error(
          'Select one canonical operation: ' +
            file +
            ' - ' +
            operation +
            ' - ' +
            matches.length
        )
      const body = matches[0].body
      const from = original.slice(body.getStart(source), body.end)
      const statement = "throw new Error('Isolated responsibility fault');"
      const to = ts.isBlock(body)
        ? '{' + statement + from.slice(1)
        : '(() => { ' + statement + ' })()'
      this.faultCase(caseId, { file, from, to, transpile: true })
    },
    faultCase(caseId, mutation) {
      const item = allCases.find((candidate) => candidate.id === caseId)
      const step = item?.contract.architectureDefinition.steps.find(
        (step) => step.id === item.stepId
      )
      if (!step?.implementationBoundary.includes(mutation.file))
        throw new Error('Fault is outside the declared case owner')
      const apply = (relative, from, to) => {
        const file = path.join(repository, relative)
        const value = fs.readFileSync(file, 'utf8')
        if (!from || value.split(from).length !== 2 || from === to)
          throw new Error(
            'Fault must select one exact canonical operation: ' + relative
          )
        if (!changedFiles.has(file)) changedFiles.set(file, value)
        fs.writeFileSync(file, value.replace(from, to))
      }
      if (mutation.file.startsWith('packages/') && !options.isolateWorkspaces)
        throw new Error(
          'Framework fault requires an isolated workspace closure'
        )
      apply(mutation.file, mutation.from, mutation.to)
      if (mutation.file.startsWith('packages/')) {
        if (!options.isolateWorkspaces)
          throw new Error(
            'Framework fault requires an isolated workspace closure'
          )
        const output = mutation.file
          .replace('/src/', '/dist/')
          .replace(/\.tsx?$/, '.js')
        if (mutation.transpile) {
          const ts = require('typescript')
          const configFile = ts.findConfigFile(
            path.dirname(path.join(root, mutation.file)),
            ts.sys.fileExists
          )
          if (!configFile)
            throw new Error('Missing workspace compiler configuration')
          const config = ts.readConfigFile(configFile, ts.sys.readFile)
          const parsed = ts.parseJsonConfigFileContent(
            config.config,
            ts.sys,
            path.dirname(configFile)
          )
          const outputFile = path.join(repository, output)
          if (!changedFiles.has(outputFile))
            changedFiles.set(outputFile, fs.readFileSync(outputFile, 'utf8'))
          const compiled = ts.transpileModule(
            fs.readFileSync(path.join(repository, mutation.file), 'utf8'),
            {
              compilerOptions: parsed.options,
              fileName: mutation.file,
              reportDiagnostics: true
            }
          )
          if (
            compiled.diagnostics?.some(
              (item) => item.category === ts.DiagnosticCategory.Error
            )
          )
            throw new Error('Invalid isolated workspace mutation')
          fs.writeFileSync(outputFile, compiled.outputText)
        } else
          apply(
            output,
            mutation.compiledFrom ?? mutation.from,
            mutation.compiledTo ?? mutation.to
          )
      }
    },
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
      for (const [file, value] of changedFiles) fs.writeFileSync(file, value)
      changedFiles.clear()
    },
    async run(caseIds = ['design.delete']) {
      if (!caseIds.length || new Set(caseIds).size !== caseIds.length)
        throw new Error('Select distinct admitted Playwright cases')
      const selected = caseIds.map((id) => {
        const item = allCases.find((candidate) => candidate.id === id)
        if (!item) throw new Error('Unknown Playwright case: ' + id)
        return item
      })
      const names = selected.map((item) =>
        item.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      )
      const reportPath = 'tmp/report-' + ++sequence + '.json'
      const args = [
        path.join(root, 'node_modules/playwright/cli.js'),
        'test',
        '--config',
        path.relative(
          app,
          path.join(repository, selected[0].contract.configFile)
        ),
        ...new Set(
          selected.map((item) =>
            path.relative(app, path.join(repository, item.testFile))
          )
        ),
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
        },
        observationSource
      )
      const result = await runProcess({
        executable: process.execPath,
        args,
        cwd: app,
        env: {
          ...env,
          ...(observationSource === 'collaboration'
            ? { E2E_OWN_SERVERS: '0', FLOW_OBSERVATION_ID: context.id }
            : {}),
          PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(repository, reportPath)
        },
        signal: t.signal,
        timeoutMs: 75000,
        maxOutputBytes: 512 * 1024
      })
      fs.writeFileSync(
        path.join(repository, 'run-' + sequence + '.result.json'),
        JSON.stringify({
          code: result.code,
          reason: result.reason,
          error: result.error,
          pid: result.pid
        })
      )
      fs.writeFileSync(
        path.join(repository, 'run-' + sequence + '.log'),
        result.output
      )
      return { context, result, record: complete(repository, reportPath) }
    }
  }
}
module.exports = { playwrightFixture }
