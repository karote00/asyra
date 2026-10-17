/* global document, AbortSignal */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { execFileSync, spawnSync, spawn } = require('node:child_process'),
  { createRequire } = require('node:module'),
  { createHash } = require('node:crypto')
const repository = path.resolve(__dirname, '../../../..'),
  packageRoot = path.join(repository, 'tools/flow-inspector')
const output = path.join(repository, 'tmp/flow-stage-two/installed')
const cache = path.join(repository, 'tmp/flow-stage-two/npm-cache')
const env = {
  ...process.env,
  npm_config_cache: cache,
  npm_config_update_notifier: 'false'
}
function cli(root, args, expected = 0) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(
        root,
        'node_modules/@asyra/flow-inspector/bin/flow-inspector.cjs'
      ),
      ...args
    ],
    { cwd: root, env, encoding: 'utf8', timeout: 120000 }
  )
  assert.equal(result.status, expected, result.stderr + result.stdout)
  return JSON.parse(result.stdout || result.stderr)
}
test(
  'installed tarball runs independent manual, custom, Vitest and Playwright projects',
  { timeout: 360000 },
  async (t) => {
    fs.mkdirSync(output, { recursive: true })
    const archive = path.join(output, 'candidate.tgz')
    execFileSync('yarn', ['pack', '--out', archive], {
      cwd: packageRoot,
      env,
      stdio: 'pipe'
    })
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
      .trim()
      .split('\n')
    for (const entry of entries)
      assert.doesNotMatch(
        entry,
        /(?:^|\/)(?:node_modules|tmp|\.env|\.attachments)(?:\/|$)/
      )
    const root = fs.mkdtempSync(path.join(output, 'consumer space-'))
    // Retain this isolated installation and evidence for inspection; it is ignored output.
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'flow-consumer',
        private: true,
        version: '1.0.0',
        workspaces: ['packages/*']
      })
    )
    execFileSync(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive],
      { cwd: root, env, stdio: 'pipe', timeout: 120000 }
    )
    cli(root, ['init', '--id', 'consumer'])
    assert.equal(cli(root, ['ci'], 3).status, 'awaiting-manual')
    assert.equal(
      cli(root, ['ci', '--manual', 'nonblocking']).status,
      'awaiting-manual'
    )
    assert.equal(cli(root, ['validate']).status, 'valid')
    const manualFile = path.join(root, 'flows/checkout.flow.json'),
      validManual = fs.readFileSync(manualFile)
    fs.writeFileSync(manualFile, '{')
    assert.equal(cli(root, ['ci'], 2).status, 'invalid')
    fs.writeFileSync(manualFile, validManual)

    const requireConsumer = createRequire(path.join(root, 'package.json')),
      api = requireConsumer('@asyra/flow-inspector')
    const project = api.resolveProject(root),
      store = api.openProject(project.directory)
    const doc = store.snapshot().documents[0]
    store.update('checkout', {
      expectedRevision: 0,
      kind: 'observation',
      value: {
        nodeId: 'review',
        criterionId: 'accepted',
        kind: 'manual',
        status: 'accepted',
        binding: api.nodeBinding(api.admitProject([doc]), 'checkout', 'review'),
        actor: 'human',
        summary: 'Reviewed',
        at: 'now'
      }
    })
    assert.equal(cli(root, ['ci']).status, 'satisfied')
    assert.equal(
      cli(root, ['export']).documents[0].current.observations[0].status,
      'accepted'
    )
    for (const command of ['validate', 'ci', 'export']) {
      const read = spawnSync(
        process.execPath,
        [
          '--require',
          path.join(__dirname, 'execution-guard.cjs'),
          path.join(
            root,
            'node_modules/@asyra/flow-inspector/bin/flow-inspector.cjs'
          ),
          command
        ],
        { cwd: root, env, encoding: 'utf8', timeout: 10000 }
      )
      assert.equal(read.status, 0, read.stderr)
    }
    const nested = path.join(root, 'packages/app')
    fs.mkdirSync(nested, { recursive: true })
    fs.writeFileSync(
      path.join(nested, 'package.json'),
      JSON.stringify({ name: 'nested-consumer', private: true })
    )
    const nestedRead = spawnSync(
      process.execPath,
      [
        path.join(
          root,
          'node_modules/@asyra/flow-inspector/bin/flow-inspector.cjs'
        ),
        'validate'
      ],
      { cwd: nested, env, encoding: 'utf8' }
    )
    assert.equal(nestedRead.status, 0, nestedRead.stderr)

    // Built-in runner absence must not fall back to this repository's node_modules.
    const missing = path.join(root, 'missing-runner')
    fs.mkdirSync(missing)
    const missingProject = api.initialize(missing, 'vitest')
    const runner = requireConsumer(
      '@asyra/flow-inspector/flow-files/portable-runner.cjs'
    )
    await assert.rejects(
      runner.runSelected(missingProject, {
        flowId: 'checkout',
        nodeId: 'review',
        criterionId: 'check'
      }),
      /outside selected project|project-local/
    )
    // Exact versions already declared in the repository lockfile, installed as real consumer dependencies.
    execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        'vitest@3.2.7',
        '@playwright/test@1.62.1'
      ],
      { cwd: root, env, stdio: 'pipe', timeout: 120000 }
    )
    for (const producer of ['vitest', 'playwright']) {
      const flow = JSON.parse(
        fs.readFileSync(path.join(project.directory, 'checkout.flow.json'))
      )
      const example = path.join(root, 'generated-' + producer)
      fs.mkdirSync(example)
      const generated = api.initialize(example, producer, 'consumer')
      fs.cpSync(
        path.join(example, 'flow-example'),
        path.join(root, 'flow-example'),
        { recursive: true }
      )
      const next = JSON.parse(
        fs.readFileSync(path.join(generated.directory, 'checkout.flow.json'))
      )
      next.revision = flow.revision + 1
      fs.writeFileSync(
        path.join(project.directory, 'checkout.flow.json'),
        JSON.stringify(next)
      )
      fs.writeFileSync(
        path.join(root, 'flow-example/feature.cjs'),
        'exports.add = (a,b) => a - b\n'
      )
      // A suffix-colliding title and a second project must never execute during selection.
      const testFile = path.join(
        root,
        producer === 'vitest'
          ? 'flow-example/feature.test.mjs'
          : 'flow-example/feature.spec.cjs'
      )
      fs.appendFileSync(
        testFile,
        "\ntest('prefix adds [two] + values', () => { throw new Error('Wrong case executed') })\n"
      )
      const fail = cli(root, ['run', 'checkout', 'review', 'check'], 1)
      assert.equal(
        fail.documents[0].current.observations[0]?.status,
        'failed',
        JSON.stringify(fail)
      )
      if (producer === 'vitest') {
        const canceled = await runner.runSelected(
          project,
          { flowId: 'checkout', nodeId: 'review', criterionId: 'check' },
          { signal: AbortSignal.abort() }
        )
        assert.equal(canceled.code, 1)
        assert.equal(
          api.openProject(project.directory).snapshot().documents[0].current
            .observations[0].status,
          'failed'
        )
      }
      const context = cli(root, ['context', 'checkout', 'review'])
      assert.match(JSON.stringify(context), /feature.cjs/)
      let server, browser, page
      if (producer === 'playwright') {
        server = await requireConsumer(
          '@asyra/flow-inspector/flow-files/server.cjs'
        ).startFlowServer(root, {
          directory: project.directory,
          url: 'http://127.0.0.1:0',
          projectId: 'consumer'
        })
        t.after(() => server?.close())
        const browserTemp = path.join(repository, 'tmp/flow-browser')
        fs.mkdirSync(browserTemp, { recursive: true })
        browser = await requireConsumer('@playwright/test').chromium.launch({
          channel: 'chrome',
          headless: true,
          env: { ...env, TMPDIR: browserTemp }
        })
        t.after(() => browser.close())
        page = await browser.newPage({
          viewport: { width: 1440, height: 1000 }
        })
        await page.goto(server.origin)
        await page.waitForFunction(
          () =>
            document.querySelector('#feature-status')?.textContent ===
            'Feature - failed'
        )
        await page.screenshot({
          path: path.join(output, 'installed-failed.png'),
          fullPage: true
        })
      }
      fs.writeFileSync(
        path.join(root, 'flow-example/feature.cjs'),
        'exports.add = (a,b) => a + b\n'
      )
      assert.equal(cli(root, ['ci'], 1).status, 'unsatisfied')
      if (page) {
        await page.getByRole('button', { name: 'Rerun', exact: true }).click()
        const rerunResponse = page.waitForResponse((r) =>
          r.url().endsWith('/api/rerun')
        )
        await page
          .getByRole('button', { name: 'Confirm rerun', exact: true })
          .click()
        assert.equal((await rerunResponse).ok(), true)
        await page.waitForFunction(
          () =>
            document.querySelector('#feature-status')?.textContent ===
            'Feature - done',
          { timeout: 10000 }
        )
      } else {
        const pass = cli(root, ['run', 'checkout', 'review', 'check'])
        assert.equal(
          pass.documents[0].current.observations[0]?.status,
          'passed'
        )
      }
      assert.equal(cli(root, ['ci']).status, 'satisfied')
      if (page) {
        await page.waitForFunction(
          () =>
            document.querySelector('#feature-status')?.textContent ===
            'Feature - done'
        )
        await page
          .getByLabel('Acceptance reason or note')
          .fill('Retained review note')
        const noteResponse = page.waitForResponse((r) =>
          r.url().endsWith('/api/update')
        )
        await page
          .getByRole('button', { name: 'Save note', exact: true })
          .click()
        const saved = await noteResponse
        assert.equal(saved.ok(), true, await saved.text())
        await page.getByLabel('Edit note').waitFor()
        assert.equal(
          await page.getByLabel('Edit note').inputValue(),
          'Retained review note'
        )
        const start = requireConsumer(
          '@asyra/flow-inspector/flow-files/server.cjs'
        ).startFlowServer
        await assert.rejects(
          start(root, { directory: project.directory, url: server.origin }),
          /EADDRINUSE/
        )
        await server.close()
        server = await start(root, {
          directory: project.directory,
          url: 'http://127.0.0.1:0',
          projectId: 'consumer'
        })
        await page.goto(server.origin)
        await page.waitForFunction(
          () =>
            document.querySelector('#feature-status')?.textContent ===
              'Feature - done' &&
            [...document.querySelectorAll('textarea')].some(
              (e) => e.value === 'Retained review note'
            )
        )

        await page.screenshot({
          path: path.join(output, 'installed-passed.png'),
          fullPage: true
        })
        await browser.close()
        await server.close()
        server = null
      }
      // Native reporters publish the actual existing execution, without an Inspector process.
      const reporter = path.join(
        root,
        'node_modules/@asyra/flow-inspector/flow-files/reporters',
        producer + '.cjs'
      )
      const native =
        producer === 'vitest'
          ? [
              path.join(root, 'node_modules/vitest/vitest.mjs'),
              'run',
              testFile,
              '--config',
              'flow-example/vitest.config.mjs',
              '--testNamePattern',
              '^adds \\[two\\] \\+ values$',
              '--reporter',
              reporter,
              '--maxWorkers=1'
            ]
          : [
              path.join(root, 'node_modules/@playwright/test/cli.js'),
              'test',
              testFile,
              '--config',
              'flow-example/playwright.config.mjs',
              '--grep',
              '^example feature\\.spec\\.cjs adds \\[two\\] \\+ values$',
              '--reporter',
              reporter,
              '--workers=1'
            ]
      const before = api.openProject(project.directory).snapshot()
        .documents[0].revision
      const nativeResult = spawnSync(process.execPath, native, {
        cwd: root,
        env,
        encoding: 'utf8',
        timeout: 60000
      })
      assert.equal(
        nativeResult.status,
        0,
        nativeResult.stdout + nativeResult.stderr
      )
      assert.ok(
        api.openProject(project.directory).snapshot().documents[0].revision >
          before
      )
      assert.equal(cli(root, ['ci']).status, 'satisfied')
      if (producer === 'vitest') {
        const watchArgs = [...native]
        watchArgs[1] = '--watch'
        const watcher = spawn(process.execPath, watchArgs, {
          cwd: root,
          env,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        })
        let log = '',
          exited = false
        watcher.on('exit', () => {
          exited = true
        })
        for (const stream of [watcher.stdout, watcher.stderr])
          stream.on('data', (data) => {
            log = (log + data).slice(-4000)
          })
        const stop = () => {
          if (!exited) {
            try {
              process.kill(-watcher.pid, 'SIGTERM')
            } catch (e) {
              if (e.code !== 'ESRCH') throw e
            }
          }
        }
        t.after(stop)
        const awaitState = async (revision, state) => {
          const deadline = Date.now() + 15000
          while (Date.now() < deadline) {
            const current = api.openProject(project.directory).snapshot()
            if (
              current.documents[0].revision > revision &&
              current.evaluation.flows[0].nodes[0].status === state
            )
              return current.documents[0].revision
            if (exited) throw new Error('Watch exited: ' + log)
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
          throw new Error('Watch publication timed out: ' + log)
        }
        try {
          let revision = await awaitState(
            api.openProject(project.directory).snapshot().documents[0].revision,
            'done'
          )
          fs.writeFileSync(
            path.join(root, 'flow-example/feature.cjs'),
            'exports.add = (a,b) => a - b\n'
          )
          revision = await awaitState(revision, 'failed')
          fs.writeFileSync(
            path.join(root, 'flow-example/feature.cjs'),
            'exports.add = (a,b) => a + b\n'
          )
          await awaitState(revision, 'done')
        } finally {
          stop()
          await new Promise((resolve) => {
            if (exited) resolve()
            else watcher.once('exit', resolve)
          })
        }
      }
      // Empty discovery must become a current warning and recover through results.
      const configFile = path.join(
        root,
        'flow-example/' + producer + '.config.mjs'
      )
      const originalConfig = fs.readFileSync(configFile, 'utf8')
      const noTestsConfig =
        producer === 'vitest'
          ? "export default { test: { name: 'example', include: ['never.test.mjs'] } }\n"
          : "export default { testDir: '.', testMatch: 'never.spec.cjs', projects: [{ name: 'example' }] }\n"
      fs.writeFileSync(configFile, noTestsConfig)
      cli(root, ['run', 'checkout', 'review', 'check'], 1)
      assert.ok(
        api.openProject(project.directory).snapshot().documents[0].current
          .warnings.length
      )
      fs.writeFileSync(configFile, originalConfig)
      cli(root, ['run', 'checkout', 'review', 'check'])
      assert.equal(
        api.openProject(project.directory).snapshot().documents[0].current
          .warnings.length,
        0
      )
      if (producer === 'vitest') {
        fs.cpSync(
          path.join(root, 'flow-example'),
          path.join(nested, 'flow-example'),
          { recursive: true }
        )
        const currentFile = path.join(project.directory, 'checkout.flow.json')
        const current = JSON.parse(fs.readFileSync(currentFile))
        const selected = JSON.parse(
          current.definition.nodes[0].criteria[0].selector.identity
        )
        selected.file = 'packages/app/' + selected.file
        selected.config = 'packages/app/' + selected.config
        selected.cwd = 'packages/app'
        current.definition.nodes[0].criteria[0].selector.identity =
          JSON.stringify(selected)
        current.definition.nodes[0].actions[0].inputs = [
          'packages/app/flow-example'
        ]
        current.revision++
        fs.writeFileSync(currentFile, JSON.stringify(current))
        cli(root, ['run', 'checkout', 'review', 'check'])
        assert.equal(cli(root, ['ci']).status, 'satisfied')
      }
      if (producer === 'playwright') {
        const shellTitle = 'literal $(touch sentinel) [case] + value'
        const currentFile = path.join(project.directory, 'checkout.flow.json')
        const current = JSON.parse(fs.readFileSync(currentFile))
        const selected = JSON.parse(
          current.definition.nodes[0].criteria[0].selector.identity
        )
        selected.title = shellTitle
        current.definition.nodes[0].criteria[0].selector.identity =
          JSON.stringify(selected)
        current.revision++
        fs.writeFileSync(currentFile, JSON.stringify(current))
        fs.writeFileSync(
          testFile,
          fs
            .readFileSync(testFile, 'utf8')
            .replace('adds [two] + values', shellTitle)
        )
        fs.writeFileSync(
          configFile,
          "export default { testDir: '.', testMatch: '*.spec.cjs', projects: [{ name: 'example' }, { name: 'other' }] }\n"
        )
        cli(root, ['run', 'checkout', 'review', 'check'])
        assert.equal(fs.existsSync(path.join(root, 'sentinel')), false)
        assert.equal(cli(root, ['ci']).status, 'satisfied')
      }
    }
    for (const template of ['custom', 'mixed']) {
      const example = path.join(root, 'generated-' + template)
      fs.mkdirSync(example)
      const generated = api.initialize(example, template, 'consumer')
      fs.cpSync(
        path.join(example, 'flow-example'),
        path.join(root, 'flow-example'),
        { recursive: true }
      )
      fs.copyFileSync(
        path.join(generated.directory, 'checkout.flow.json'),
        path.join(project.directory, 'checkout.flow.json')
      )
      const service = requireConsumer(
        '@asyra/flow-inspector/flow-files/service.cjs'
      ).createFlowService(root, project.directory)
      const preview = service.preview('checkout', 'review', 'check')
      await service.rerun({ ...preview, confirm: true })
      assert.equal(
        cli(root, ['ci'], template === 'mixed' ? 3 : 0).status,
        template === 'mixed' ? 'awaiting-manual' : 'satisfied'
      )
      await service.close()
    }
    fs.writeFileSync(
      path.join(output, 'evidence.json'),
      JSON.stringify(
        {
          root,
          archive,
          sha256: createHash('sha256')
            .update(fs.readFileSync(archive))
            .digest('hex'),
          verified: [
            'manual',
            'mixed',
            'custom',
            'vitest',
            'playwright',
            'native-watch',
            'ui-rerun',
            'restart',
            'nested-workspace',
            'headless-no-execution'
          ]
        },
        null,
        2
      )
    )
  }
)
