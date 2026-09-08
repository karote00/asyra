/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const { URL, fileURLToPath } = require('node:url')
const { JSDOM, VirtualConsole } = require('jsdom')

const workspaceRoot = path.resolve(__dirname, '..')
const bundleSource = fs.readFileSync(
  path.join(workspaceRoot, 'workspace-bundle.data.js'),
  'utf8'
)
const targetSource = fs.readFileSync(
  path.join(workspaceRoot, 'target.js'),
  'utf8'
)
const viewerSource = fs.readFileSync(
  path.resolve(workspaceRoot, '../viewer.js'),
  'utf8'
)
const legacyViewerPath = path.join(workspaceRoot, 'legacy-viewer.js')
const viewerStylesPath = path.resolve(workspaceRoot, '../viewer.css')
const workspaceStylesPath = path.resolve(workspaceRoot, '../src/workspace.css')

const loadBundle = () => {
  const sandbox = { globalThis: {} }
  vm.runInNewContext(bundleSource, sandbox)
  return JSON.parse(
    JSON.stringify(sandbox.globalThis.FLOW_INSPECTOR_WORKSPACE_BUNDLE)
  )
}

const routeFor = (id) => {
  const encoded = encodeURIComponent(id)
  return `?inspector=${encoded}#inspector=${encoded}`
}

const createTarget = (route = '') => {
  const html = fs.readFileSync(path.join(workspaceRoot, 'target.html'), 'utf8')
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: `file://${path.join(workspaceRoot, 'target.html')}${route}`
  })
  dom.window.FLOW_INSPECTOR_WORKSPACE_BUNDLE = loadBundle()
  dom.window.eval(targetSource)
  return dom
}

const createRenderedTarget = (entry) => {
  const html = fs.readFileSync(path.join(workspaceRoot, 'target.html'), 'utf8')
  const rendererErrors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('error', (...args) => rendererErrors.push(args))
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    url: `file://${path.join(workspaceRoot, 'target.html')}${routeFor(entry.id)}`,
    virtualConsole
  })
  dom.window.SVGSVGElement.prototype.createSVGPoint = function () {
    return {
      x: 0,
      y: 0,
      matrixTransform() {
        return { x: this.x, y: this.y }
      }
    }
  }
  dom.window.SVGElement.prototype.getScreenCTM = function () {
    return { inverse: () => ({}) }
  }
  const originalAppend = dom.window.document.head.append.bind(
    dom.window.document.head
  )
  dom.window.document.head.append = (...nodes) => {
    for (const node of nodes) {
      if (node.tagName === 'SCRIPT') {
        const source =
          node.dataset.rendererKind === 'flow-v2'
            ? viewerSource
            : fs.readFileSync(legacyViewerPath, 'utf8')
        dom.window.eval(source)
        node.dispatchEvent(new dom.window.Event('load'))
      } else originalAppend(node)
    }
  }
  dom.window.FLOW_INSPECTOR_WORKSPACE_BUNDLE = loadBundle()
  dom.window.eval(targetSource)
  dom.workspaceRendererErrors = rendererErrors
  return dom
}

test('workspace entry uses checked-in classic React assets', () => {
  const html = fs.readFileSync(
    path.join(workspaceRoot, 'workspace.html'),
    'utf8'
  )
  const generatedScript = fs.readFileSync(
    path.join(workspaceRoot, 'generated/flow-inspector-workspace.js'),
    'utf8'
  )
  assert.match(html, /id="flow-inspector-workspace-root"/)
  assert.match(html, /\.\/workspace-bundle\.data\.js/)
  assert.match(html, /\.\/generated\/flow-inspector-workspace\.js/)
  assert.match(html, /\.\/generated\/flow-inspector-workspace\.css/)
  assert.doesNotMatch(html, /type="module"/)
  assert.doesNotMatch(generatedScript, /process\.env|\brequire\s*\(/)
  assert.equal(
    fs.existsSync(
      path.join(workspaceRoot, 'generated/flow-inspector-workspace.js')
    ),
    true
  )
  assert.equal(
    fs.existsSync(
      path.join(workspaceRoot, 'generated/flow-inspector-workspace.css')
    ),
    true
  )
})

test('v2 viewer owns a scrollable canvas with visible routes and bounded cards', () => {
  assert.equal(fs.existsSync(viewerStylesPath), true)
  const styles = fs.readFileSync(viewerStylesPath, 'utf8')

  assert.match(
    styles,
    /\.flow-viewport\s*\{[^}]*overflow:\s*auto/s,
    'the flow viewport must scroll on both axes'
  )
  assert.match(
    styles,
    /\.edge-path\s*\{[^}]*fill:\s*none[^}]*stroke:/s,
    'routes must declare a visible stroke'
  )
  assert.match(
    styles,
    /\.step-card\s*\{[^}]*height:\s*var\(--card-h\)[^}]*overflow:\s*hidden/s,
    'cards must use the same bounded height as layout geometry'
  )
  assert.match(
    styles,
    /\.step-summary\s*\{[^}]*-webkit-line-clamp:/s,
    'summary text must not overflow its card'
  )
})

test('step cards label ownership without using success semantics', () => {
  const entry = loadBundle().entries.find(
    (candidate) => candidate.kind === 'flow-v2'
  )
  const dom = createRenderedTarget(entry)
  const ownerBadges = [
    ...dom.window.document.querySelectorAll('.step-card .badge.owner')
  ]

  assert.ok(ownerBadges.length > 0)
  for (const badge of ownerBadges) {
    assert.match(badge.textContent, /^Owner: /)
    assert.equal(badge.classList.contains('truth'), false)
  }
  const styles = fs.readFileSync(viewerStylesPath, 'utf8')
  assert.match(styles, /\.badge\.owner\s*\{[^}]*color:\s*#8fc7e8/s)
})

test('step details separate a concise summary from a collapsed full contract', () => {
  const entry = loadBundle().entries.find(
    (candidate) => candidate.kind === 'flow-v2'
  )
  const dom = createRenderedTarget(entry)
  const { document } = dom.window
  const fullContract = document.querySelector('[data-full-contract]')
  const categoryTitles = [
    ...document.querySelectorAll('.detail-category-title')
  ].map((title) => title.textContent)

  assert.ok(fullContract)
  assert.equal(fullContract.open, false)
  assert.deepEqual(categoryTitles, [
    'At a glance',
    'Execution rules',
    'Ownership boundaries',
    'Related contract data'
  ])
  assert.ok(
    document
      .querySelector('[data-detail-section="Inputs"]')
      .closest('.detail-at-a-glance')
  )
  assert.ok(
    document
      .querySelector('[data-detail-section="Conditions"]')
      .closest('[data-full-contract]')
  )
})

test('panel controls float inside the main viewport with exact safe spacing', () => {
  const workspaceStyles = fs.readFileSync(workspaceStylesPath, 'utf8')
  const viewerStyles = fs.readFileSync(viewerStylesPath, 'utf8')

  assert.doesNotMatch(workspaceStyles, /\.panel-rail/)
  assert.match(
    viewerStyles,
    /\.panel-rail button\s*\{[^}]*width:\s*24px[^}]*height:\s*24px/s
  )
  assert.match(
    viewerStyles,
    /\.panel-rail\s*\{[^}]*position:\s*absolute[^}]*top:\s*12px[^}]*left:\s*12px/s
  )
  assert.match(viewerStyles, /--flow-controls-safe-left:\s*60px/)
})

test('absolute close controls do not reserve panel content space', () => {
  const workspaceStyles = fs.readFileSync(workspaceStylesPath, 'utf8')
  const viewerStyles = fs.readFileSync(viewerStylesPath, 'utf8')

  assert.match(
    workspaceStyles,
    /\.sidebar\s+\.panel-close-button\s*\{[^}]*top:\s*20px/s
  )
  assert.doesNotMatch(workspaceStyles, /\.brand\s*\{[^}]*padding-right:/s)
  assert.match(
    viewerStyles,
    /\.panel-close-button\s*\{[^}]*position:\s*absolute[^}]*top:\s*24px/s
  )
  assert.match(viewerStyles, /\.header \.panel-close-button\s*\{[^}]*top:\s*0/s)
  assert.doesNotMatch(viewerStyles, /\.header\s*\{[^}]*padding-right:/s)
  assert.match(viewerStyles, /\.detail\s*\{[^}]*padding:\s*24px/s)
})

test('v2 viewer supports trackpad pinch zoom and an exact scale reset', () => {
  const entry = loadBundle().entries.find(
    (candidate) => candidate.kind === 'flow-v2'
  )
  const dom = createRenderedTarget(entry)
  const { document, WheelEvent } = dom.window
  const viewport = document.querySelector('.flow-viewport')
  const surface = document.querySelector('.flow-zoom-surface')
  const flow = document.querySelector('#flow')
  const reset = document.querySelector('[data-reset-zoom]')

  assert.ok(viewport)
  assert.ok(surface, 'the scaled flow must own the exact scroll surface')
  assert.ok(reset, 'the flow viewport must expose a zoom reset button')
  viewport.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600
  })
  viewport.scrollLeft = 180
  viewport.scrollTop = 120

  const pinch = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: 240,
    clientY: 180,
    ctrlKey: true,
    deltaY: -120
  })
  viewport.dispatchEvent(pinch)

  assert.equal(pinch.defaultPrevented, true)
  assert.equal(document.activeElement, viewport)
  assert.ok(Number(viewport.dataset.zoomScale) > 1)
  assert.match(flow.style.transform, /^scale\([\d.]+\)$/)
  assert.notEqual(reset.textContent, 'Reset zoom - 100%')

  const ordinaryScroll = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY: 80
  })
  const scaleAfterPinch = viewport.dataset.zoomScale
  viewport.dispatchEvent(ordinaryScroll)
  assert.equal(ordinaryScroll.defaultPrevented, false)
  assert.equal(viewport.dataset.zoomScale, scaleAfterPinch)

  const commandZero = new dom.window.KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: '0',
    metaKey: true
  })
  document.dispatchEvent(commandZero)
  assert.equal(commandZero.defaultPrevented, true)
  assert.equal(viewport.dataset.zoomScale, '1')
  assert.equal(flow.style.transform, 'scale(1)')

  viewport.dispatchEvent(
    new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -120
    })
  )
  reset.click()
  assert.equal(viewport.dataset.zoomScale, '1')
  assert.equal(flow.style.transform, 'scale(1)')
  assert.equal(reset.textContent, 'Reset zoom - 100%')

  viewport.dispatchEvent(
    new WheelEvent('wheel', {
      cancelable: true,
      ctrlKey: true,
      deltaY: -10000
    })
  )
  assert.equal(viewport.dataset.zoomScale, '2.5')
  viewport.dispatchEvent(
    new WheelEvent('wheel', {
      cancelable: true,
      ctrlKey: true,
      deltaY: 10000
    })
  )
  assert.equal(viewport.dataset.zoomScale, '0.2')
  assert.equal(surface.style.width, `${Number(flow.dataset.baseWidth) * 0.2}px`)
  assert.equal(
    surface.style.height,
    `${Number(flow.dataset.baseHeight) * 0.2}px`
  )
})

test('v2 viewer toggles header and step details without hiding the controls', () => {
  const entry = loadBundle().entries.find(
    (candidate) => candidate.kind === 'flow-v2'
  )
  const dom = createRenderedTarget(entry)
  const { document } = dom.window
  const app = document.querySelector('.app')
  const main = document.querySelector('.main')
  const targetMeta = document.querySelector('.target-meta')
  const header = document.querySelector('.header')
  const headerPanel = header
  const filters = document.querySelector('.filters')
  const guide = document.querySelector('.guide-panel')
  const detail = document.querySelector('.detail')
  const headerClose = headerPanel.querySelector('[data-close-header]')
  const detailClose = detail.querySelector('[data-close-details]')

  assert.ok(headerClose, 'header must own its close control')
  assert.ok(detailClose, 'detail must own its close control')
  assert.equal(headerClose.textContent, '×')
  assert.equal(detailClose.textContent, '×')
  assert.equal(targetMeta, null, 'workspace targets must not render a meta bar')
  assert.equal(document.querySelector('[data-open-header]'), null)
  assert.equal(document.querySelector('[data-open-details]'), null)

  headerClose.click()
  assert.equal(header.hidden, true)
  assert.equal(filters.hidden, true)
  assert.equal(guide.hidden, true)
  assert.equal(main.classList.contains('is-header-collapsed'), true)
  const panelRail = document.querySelector('[data-panel-rail]')
  assert.equal(panelRail.parentElement.classList.contains('flow-shell'), true)
  const catalogToggle = panelRail.querySelector('[data-panel-button="catalog"]')
  const headerOpen = panelRail.querySelector('[data-panel-button="header"]')
  const detailOpen = panelRail.querySelector('[data-panel-button="details"]')
  assert.deepEqual(
    [...panelRail.querySelectorAll('button')].map(
      (button) => button.dataset.panelButton
    ),
    ['catalog', 'header', 'details']
  )
  assert.equal(catalogToggle.disabled, true)
  assert.equal(headerOpen.disabled, false)
  assert.equal(headerOpen.getAttribute('aria-pressed'), 'false')

  detailClose.click()
  assert.equal(detail.hidden, true)
  assert.equal(app.classList.contains('is-detail-collapsed'), true)
  assert.equal(detailOpen.disabled, false)
  assert.equal(detailOpen.getAttribute('aria-pressed'), 'false')

  headerOpen.click()
  detailOpen.click()
  assert.equal(header.hidden, false)
  assert.equal(filters.hidden, false)
  assert.equal(guide.hidden, false)
  assert.equal(detail.hidden, false)
  assert.equal(headerOpen.disabled, false)
  assert.equal(detailOpen.disabled, false)
  headerOpen.click()
  detailOpen.click()
  assert.equal(header.hidden, true)
  assert.equal(detail.hidden, true)
})

test('target resolves one included entry only when query and hash match', () => {
  const entry = loadBundle().entries[0]
  const dom = createTarget(routeFor(entry.id))
  assert.equal(dom.window.FLOW_INSPECTOR_WORKSPACE_ENTRY.id, entry.id)
  assert.equal(dom.window.document.documentElement.dataset.targetState, 'ready')
  assert.equal(
    dom.window.document.querySelector('[data-target-error]').hidden,
    true
  )
})

test('target rejects missing, mismatched, unknown, and excluded ids', () => {
  for (const route of [
    '',
    '?inspector=one#inspector=two',
    routeFor('missing-target'),
    routeFor('asyra-executable-examples')
  ]) {
    const dom = createTarget(route)
    assert.equal(dom.window.FLOW_INSPECTOR_WORKSPACE_ENTRY, undefined)
    assert.equal(
      dom.window.document.documentElement.dataset.targetState,
      'error'
    )
    assert.equal(
      dom.window.document.querySelector('[data-target-error]').hidden,
      false
    )
    assert.match(
      dom.window.document.querySelector('[data-target-error]').textContent,
      /not available|requires|must match/i
    )
  }
})

test('separate target documents do not retain selected entry globals', () => {
  const [first, second] = loadBundle().entries
  const firstDom = createTarget(routeFor(first.id))
  firstDom.window.FLOW_INSPECTOR_WORKSPACE_ENTRY.transientMarker = true
  const secondDom = createTarget(routeFor(second.id))
  assert.equal(secondDom.window.FLOW_INSPECTOR_WORKSPACE_ENTRY.id, second.id)
  assert.equal(
    secondDom.window.FLOW_INSPECTOR_WORKSPACE_ENTRY.transientMarker,
    undefined
  )
})

test('every catalog entry renders through its declared renderer kind', () => {
  for (const entry of loadBundle().entries) {
    const dom = createRenderedTarget(entry)
    const { document } = dom.window
    assert.equal(
      document.documentElement.dataset.rendererKind,
      entry.kind,
      entry.id
    )
    assert.equal(
      document.documentElement.dataset.targetState,
      'rendered',
      entry.id
    )
    assert.deepEqual(dom.workspaceRendererErrors, [], entry.id)
    assert.match(
      document.body.textContent,
      new RegExp(entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    )
    if (entry.kind === 'flow-v2') {
      assert.deepEqual(
        JSON.parse(JSON.stringify(dom.window.FLOW_INSPECTOR_DATA)),
        entry.data,
        entry.id
      )
      assert.ok(document.querySelector('[data-flow-v2-shell]'), entry.id)
      assert.ok(
        document.querySelector('#flow')?.closest('.flow-viewport'),
        `${entry.id} must render the flow inside the shared scroll viewport`
      )
    } else {
      assert.equal(dom.window.FLOW_INSPECTOR_DATA, undefined, entry.id)
      assert.ok(document.querySelector('[data-compatibility-view]'), entry.id)
      assert.match(
        document.body.textContent,
        /read-only compatibility/i,
        entry.id
      )
    }
  }
})

test('rendered targets omit redundant metadata and standalone navigation', () => {
  const bundle = loadBundle()
  const withStandalone = bundle.entries.find((entry) => entry.standalonePath)
  const withoutStandalone = bundle.entries.find(
    (entry) => !entry.standalonePath
  )
  for (const entry of [withStandalone, withoutStandalone]) {
    const document = createRenderedTarget(entry).window.document
    assert.equal(document.querySelector('.target-meta'), null)
    assert.equal(document.querySelector('[data-standalone-link]'), null)
  }
})

// Read the actual shared-renderer DOM for every selectable card, including
// links inside collapsed contract details. This catches distinct header/detail
// producers even when they point to the same document.
const collectRenderedLinks = () => {
  const links = new Map()
  for (const entry of loadBundle().entries) {
    const dom = createRenderedTarget(entry)
    const document = dom.window.document
    const collect = () => {
      for (const anchor of document.querySelectorAll('a[href]')) {
        const link = {
          entry: entry.id,
          href: anchor.href,
          target: anchor.target,
          rel: anchor.rel
        }
        links.set(JSON.stringify(link), link)
      }
    }
    collect()
    for (const step of entry.kind === 'flow-v2' ? entry.data.steps : []) {
      document.querySelector(`[data-step-id="${step.id}"]`).click()
      collect()
    }
    dom.window.close()
  }
  return [...links.values()]
}
const renderedLinks = collectRenderedLinks()

test('every rendered link opens a separate document without replacing the canvas', () => {
  assert.ok(renderedLinks.length > 0)
  const invalid = renderedLinks.filter(
    (link) =>
      link.target !== '_blank' ||
      !link.rel.split(/\s+/).includes('noopener') ||
      !link.rel.split(/\s+/).includes('noreferrer')
  )
  assert.equal(invalid.length, 0, JSON.stringify(invalid.slice(0, 4), null, 2))
})

test('every rendered link resolves to an existing file and specification section', () => {
  const invalid = []
  for (const link of renderedLinks) {
    const url = new URL(link.href)
    if (url.protocol !== 'file:') continue
    const file = fileURLToPath(url)
    if (!fs.existsSync(file)) {
      invalid.push(link.href)
      continue
    }
    if (path.extname(file) !== '.md' || !url.hash) continue
    const headings = [
      ...fs.readFileSync(file, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)
    ].map((match) =>
      match[1]
        .toLowerCase()
        .replaceAll('`', '')
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    )
    if (!headings.includes(decodeURIComponent(url.hash.slice(1))))
      invalid.push(link.href)
  }
  assert.deepEqual([...new Set(invalid)], [])
})

test('v2 viewer fits requested cards through its existing zoom owner', () => {
  const entry = loadBundle().entries.find(
    (candidate) => candidate.kind === 'flow-v2'
  )
  const dom = createRenderedTarget(entry)
  const { document, CustomEvent } = dom.window
  const viewport = document.querySelector('.flow-viewport')
  const flow = document.querySelector('#flow')
  let revealCount = 0
  viewport.scrollIntoView = () => {
    revealCount++
  }
  Object.defineProperty(viewport, 'clientWidth', { value: 600 })
  Object.defineProperty(viewport, 'clientHeight', { value: 400 })
  const cards = [...flow.querySelectorAll('.step-card')].slice(0, 2)
  cards.forEach((card, index) => {
    Object.defineProperty(card, 'offsetLeft', { value: 800 })
    Object.defineProperty(card, 'offsetTop', { value: 600 + index * 300 })
    Object.defineProperty(card, 'offsetWidth', { value: 300 })
    Object.defineProperty(card, 'offsetHeight', { value: 180 })
  })
  flow.dispatchEvent(
    new CustomEvent('flowfitrequest', {
      detail: { stepIds: cards.map((card) => card.dataset.stepId) }
    })
  )
  assert.equal(revealCount, 1)
  const scale = Number(viewport.dataset.zoomScale)
  assert.ok(scale < 1 && scale >= 0.2)
  assert.ok(viewport.scrollLeft > 0 && viewport.scrollTop > 0)
  assert.ok(800 * scale >= viewport.scrollLeft)
  assert.ok(1080 * scale <= viewport.scrollTop + 400)
  const before = [scale, viewport.scrollLeft, viewport.scrollTop]
  flow.dispatchEvent(
    new CustomEvent('flowfitrequest', { detail: { stepIds: ['missing'] } })
  )
  assert.deepEqual(
    [
      Number(viewport.dataset.zoomScale),
      viewport.scrollLeft,
      viewport.scrollTop
    ],
    before
  )
  assert.equal(revealCount, 1, 'missing cards never reveal the viewport')
  document.querySelector('[data-reset-zoom]').click()
  assert.equal(viewport.dataset.zoomScale, '1')
  dom.window.close()
})

test('Command+1 fits all bounds below manual zoom limits and respects editable focus', () => {
  const dom = createRenderedTarget(
    loadBundle().entries.find((entry) => entry.kind === 'flow-v2')
  )
  const { document, KeyboardEvent } = dom.window
  const viewport = document.querySelector('.flow-viewport')
  Object.defineProperty(viewport, 'offsetWidth', { value: 600 })
  Object.defineProperty(viewport, 'offsetHeight', { value: 400 })
  Object.defineProperty(viewport, 'clientWidth', { value: 598 })
  Object.defineProperty(viewport, 'clientHeight', { value: 398 })
  for (const card of document.querySelectorAll('.step-card')) {
    Object.defineProperty(card, 'offsetLeft', { value: 0 })
    Object.defineProperty(card, 'offsetTop', { value: 0 })
    Object.defineProperty(card, 'offsetWidth', { value: 10000 })
    Object.defineProperty(card, 'offsetHeight', { value: 10000 })
  }
  const input = document.createElement('input')
  document.body.append(input)
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: '1', metaKey: true, bubbles: true })
  )
  assert.equal(Number(viewport.dataset.zoomScale), (400 - 48) / 10000)
  document.querySelector('[data-reset-zoom]').click()
  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: '!',
      code: 'Digit1',
      shiftKey: true,
      bubbles: true
    })
  )
  assert.equal(viewport.dataset.zoomScale, '1')
  viewport.dispatchEvent(
    new KeyboardEvent('keydown', { key: '1', metaKey: true, bubbles: true })
  )
  assert.equal(Number(viewport.dataset.zoomScale), (400 - 48) / 10000)
  document.querySelector('[data-reset-zoom]').click()
  assert.equal(viewport.dataset.zoomScale, '1')
  assert.equal(document.querySelector('#flow').style.transform, 'scale(1)')
  dom.window.close()
})
