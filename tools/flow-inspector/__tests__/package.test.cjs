/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { execFileSync } = require('node:child_process')
const { createRequire } = require('node:module')
const { pathToFileURL } = require('node:url')
const { JSDOM, VirtualConsole } = require('jsdom')

const packageRoot = path.resolve(__dirname, '..')
const repositoryRoot = path.resolve(packageRoot, '../..')

test('public tool archive retains usable viewer assets without repository runtime state', async () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
  )
  assert.notEqual(manifest.private, true)
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.publishConfig.access, 'public')
  assert.equal(manifest.repository.directory, 'tools/flow-inspector')
  const scratchRoot = path.join(repositoryRoot, 'tmp/flow-inspector')
  fs.mkdirSync(scratchRoot, { recursive: true })
  const scratch = fs.mkdtempSync(path.join(scratchRoot, 'package-'))
  try {
    const archive = path.join(scratch, 'candidate.tgz')
    execFileSync('yarn', ['pack', '--out', archive], {
      cwd: packageRoot,
      stdio: 'pipe'
    })
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
      .trim()
      .split('\n')
    for (const entry of entries) {
      assert.doesNotMatch(entry, /(?:^|\/)(?:node_modules|tmp|\.env)(?:\/|$)/)
      assert.doesNotMatch(entry, /\.(?:log|tgz)$/)
      assert.doesNotMatch(
        entry,
        /\/(?:viewer\.js|embed-viewer\.cjs|target\.html|target\.js|legacy-viewer\.js)$/
      )
      assert.doesNotMatch(entry, /\/inspectors\/[^/]+\.html$/)
    }
    const installed = path.join(scratch, 'node_modules/@asyra/flow-inspector')
    fs.mkdirSync(installed, { recursive: true })
    execFileSync('tar', [
      '-xzf',
      archive,
      '--strip-components=1',
      '-C',
      installed
    ])
    const consumer = createRequire(path.join(scratch, 'consumer.cjs'))
    assert.equal(
      consumer.resolve(
        '@asyra/flow-inspector/workspace/generated/flow-inspector-workspace.js'
      ),
      path.join(installed, 'workspace/generated/flow-inspector-workspace.js')
    )
    assert.equal(
      typeof consumer(
        '@asyra/flow-inspector/control-plane/workflow-results.cjs'
      ).aggregate,
      'function'
    )
    for (const file of [
      'LICENSE',
      'README.md',
      'control-plane/cli.cjs',
      'workspace/workspace.html',
      'workspace/generated/flow-inspector-workspace.js',
      'workspace/generated/flow-inspector-workspace.css',
      'workspace/generated/flow-dashboard.js',
      'workspace/generated/flow-dashboard.css'
    ]) {
      assert.ok(fs.statSync(path.join(installed, file)).size > 0, file)
    }
    assert.equal(
      fs.readFileSync(path.join(installed, 'LICENSE'), 'utf8'),
      fs.readFileSync(path.join(repositoryRoot, 'LICENSE'), 'utf8')
    )
    const errors = []
    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', (error) => errors.push(error))
    virtualConsole.on('error', (error) => errors.push(error))
    const dom = await JSDOM.fromFile(
      path.join(installed, 'workspace/workspace.html'),
      {
        url:
          pathToFileURL(path.join(installed, 'workspace/workspace.html')).href +
          '#inspector=transaction-atomicity',
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole
      }
    )
    try {
      await new Promise((resolve) =>
        dom.window.addEventListener('load', resolve, { once: true })
      )
      for (
        let attempt = 0;
        attempt < 100 && !dom.window.document.querySelector('.step-card');
        attempt++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      assert.deepEqual(errors, [])
      assert.equal(dom.window.document.querySelectorAll('.step-card').length, 7)
      assert.match(
        dom.window.document.querySelector('.architecture-view h1').textContent,
        /Transaction Atomicity/
      )
      assert.equal(dom.window.document.querySelector('iframe'), null)
    } finally {
      dom.window.close()
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
  }
})
