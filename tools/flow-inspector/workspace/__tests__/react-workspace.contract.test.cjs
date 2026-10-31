/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { URL, pathToFileURL, fileURLToPath } = require('node:url')
const test = require('node:test')
const vm = require('node:vm')
const { JSDOM, VirtualConsole } = require('jsdom')

const root = path.resolve(__dirname, '..')
const bundleSource = fs.readFileSync(
  path.join(root, 'workspace-bundle.data.js'),
  'utf8'
)
const buildSource = fs.readFileSync(
  path.join(root, 'generated/flow-inspector-workspace.js'),
  'utf8'
)
const snapshot = {}
vm.runInNewContext(bundleSource, snapshot)
const bundle = snapshot.FLOW_INSPECTOR_WORKSPACE_BUNDLE

async function waitFor(check) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  assert.fail('React presentation did not settle')
}

async function mount(id) {
  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (error) => errors.push(error.message))
  virtualConsole.on('error', (error) => errors.push(String(error)))
  const url = pathToFileURL(path.join(root, 'workspace.html'))
  url.hash = 'inspector=' + id
  const dom = new JSDOM('<div id="flow-inspector-workspace-root"></div>', {
    url: url.href,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole
  })
  dom.window.eval(bundleSource)
  dom.window.eval(buildSource)
  await waitFor(() => dom.window.document.querySelector('.workspace-main'))

  return { dom, errors, document: dom.window.document }
}

test('workspace mounts only the checked-in React build and source catalog', () => {
  const html = fs.readFileSync(path.join(root, 'workspace.html'), 'utf8')
  assert.match(html, /flow-inspector-workspace-root/)
  assert.match(html, /generated\/flow-inspector-workspace\.js/)
  assert.match(html, /workspace-bundle\.data\.js/)
  assert.doesNotMatch(
    html,
    /iframe|target\.js|legacy-viewer|data-flow-inspector-renderer/
  )
})

for (const entry of bundle.entries) {
  test(`${entry.id} renders its declared contract directly in React`, async () => {
    const { dom, document, errors } = await mount(entry.id)
    try {
      assert.equal(document.querySelectorAll('iframe').length, 0)
      assert.match(
        document.querySelector('.workspace-main').textContent,
        new RegExp(entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      )
      if (entry.kind === 'flow-v2') {
        assert.equal(
          document.querySelectorAll('.step-card').length,
          entry.data.steps.length
        )
        for (const lane of entry.data.lanes) {
          const button = [...document.querySelectorAll('.filter-button')].find(
            (item) => item.textContent === lane.title
          )
          assert.ok(button, lane.id)
          button.click()
          const steps = entry.data.steps.filter(
            (step) => step.laneId === lane.id
          )
          await waitFor(
            () =>
              document.querySelectorAll('.step-card').length === steps.length
          )
          if (steps.length) {
            await waitFor(
              () =>
                document.querySelector('.detail-heading h2')?.textContent ===
                steps[0].title
            )
          }
        }
        for (const anchor of document.querySelectorAll('a[href]')) {
          assert.equal(anchor.target, '_blank')
          assert.ok(anchor.rel.split(/\s+/).includes('noopener'))
          assert.ok(anchor.rel.split(/\s+/).includes('noreferrer'))
          const url = new URL(anchor.href)
          assert.equal(url.protocol, 'file:')
          assert.ok(
            fs.existsSync(fileURLToPath(url)),
            `${entry.id}: ${anchor.href}`
          )
        }
      } else {
        assert.equal(entry.kind, 'contract-document')
        assert.ok(document.querySelector('.contract-document'))
        for (const key of Object.keys(entry.data)) {
          assert.ok(
            [...document.querySelectorAll('.contract-document h2')].some(
              (heading) => heading.textContent === key
            ),
            key
          )
        }
      }
      assert.deepEqual(errors, [])
    } finally {
      dom.window.close()
    }
  })
}

test('unknown routes do not mount another contract or a fallback renderer', async () => {
  const { dom, document, errors } = await mount('unknown-inspector')
  try {
    assert.match(
      document.querySelector('.route-error').textContent,
      /not available/
    )
    assert.equal(
      document.querySelectorAll('.step-card, iframe, .contract-document')
        .length,
      0
    )
    assert.deepEqual(errors, [])
  } finally {
    dom.window.close()
  }
})
