/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { execFileSync } = require('node:child_process')
const { createRequire } = require('node:module')
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
      consumer.resolve('@asyra/flow-inspector/viewer.js'),
      path.join(installed, 'viewer.js')
    )
    for (const file of [
      'LICENSE',
      'README.md',
      'control-plane/cli.cjs',
      'workspace/workspace.html',
      'workspace/generated/flow-inspector-workspace.js',
      'workspace/generated/flow-inspector-workspace.css'
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
      path.join(installed, 'inspectors/transaction-flow-inspector.html'),
      {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
          window.SVGSVGElement.prototype.createSVGPoint = function () {
            return {
              x: 0,
              y: 0,
              matrixTransform() {
                return { x: this.x, y: this.y }
              }
            }
          }
          window.SVGElement.prototype.getScreenCTM = function () {
            return { inverse: () => ({}) }
          }
        }
      }
    )
    try {
      await new Promise((resolve) =>
        dom.window.addEventListener('load', resolve, { once: true })
      )
      assert.deepEqual(errors, [])
      assert.equal(dom.window.document.querySelectorAll('.step-card').length, 7)
      assert.match(dom.window.document.title, /Transaction Atomicity/)
    } finally {
      dom.window.close()
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
  }
})
