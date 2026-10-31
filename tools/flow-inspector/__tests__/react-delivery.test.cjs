/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { JSDOM } = require('jsdom')

const root = path.resolve(__dirname, '..')

test('React is the only delivered browser implementation', () => {
  for (const file of [
    'viewer.js',
    'embed-viewer.cjs',
    'workspace/target.html',
    'workspace/target.js',
    'workspace/legacy-viewer.js',
    'control-plane/public/board.js',
    'control-plane/public/localization.js',
    'flow-files/public/flow.js'
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file)
  }

  assert.deepEqual(
    fs
      .readdirSync(path.join(root, 'inspectors'))
      .filter((file) => file.endsWith('.html')),
    []
  )
  for (const file of ['flow-inspector-workspace.js', 'flow-dashboard.js']) {
    assert.ok(
      fs.statSync(path.join(root, 'workspace/generated', file)).size > 0
    )
  }
})

test('browser entry documents contain only empty React roots and external scripts', () => {
  const entries = [
    ['workspace/dev.html', 'flow-inspector-workspace-root'],
    ['workspace/workspace.html', 'flow-inspector-workspace-root'],
    ['flow-files/public/index.html', 'flow-dashboard-root']
  ]

  for (const [file, rootId] of entries) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'))

    try {
      const document = dom.window.document
      const mount = document.getElementById(rootId)

      assert.ok(mount, file)
      assert.equal(mount.parentElement, document.body, file)
      assert.equal(mount.childNodes.length, 0, file)
      assert.equal(
        document.querySelector('iframe, frame, frameset'),
        null,
        file
      )

      for (const element of document.body.children) {
        if (element === mount) {
          continue
        }

        assert.equal(element.tagName, 'SCRIPT', file)
        assert.ok(element.getAttribute('src'), file)
        assert.equal(element.textContent.trim(), '', file)
      }

      for (const element of document.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
          assert.equal(/^on/i.test(attribute.name), false, file)
        }
      }
    } finally {
      dom.window.close()
    }
  }
})
