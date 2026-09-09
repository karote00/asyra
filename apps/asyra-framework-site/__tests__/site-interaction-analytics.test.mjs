import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import {
  installSiteAnalytics,
  SITE_ACTIONS,
  SITE_EVENTS
} from '../lib/site-interaction-analytics.mjs'

const setup = (html = '', path = '/docs') => {
  const dom = new JSDOM(html, { url: 'https://site.example' + path })
  const { window } = dom
  const events = []
  const timers = new Map()
  let timerId = 0
  window.setTimeout = (fn) => {
    timers.set(++timerId, fn)
    return timerId
  }
  window.clearTimeout = (id) => timers.delete(id)
  window.gtag = (...args) => events.push(args)
  window.document.addEventListener('click', (event) => event.preventDefault())
  const config = {
    pagePaths: ['/', '/docs', '/docs/start/custom-composition', '/atlas'],
    caseIds: ['continuous-pointer-undo']
  }
  const tracker = installSiteAnalytics(window, config)
  const click = (selector, type = 'click', button = 0) =>
    window.document
      .querySelector(selector)
      .dispatchEvent(
        new window.MouseEvent(type, { bubbles: true, cancelable: true, button })
      )
  const flush = () => {
    const pending = [...timers.values()]
    timers.clear()
    pending.forEach((fn) => fn())
  }
  return { window, events, timers, tracker, config, click, flush }
}

test('one semantic event per navigation or CTA, with no custom page_view or automatic outbound duplicate', () => {
  const s = setup(
    '<header><a id="nav" href="/atlas?email=private@example.com#secret"><span>Private text</span></a></header><main><a id="cta" data-site-cta href="/docs/start/custom-composition?token=secret">Start</a><a id="outside" href="https://example.org/private">External</a><a id="unknown" href="/private@example.com">Unknown</a></main>'
  )
  s.click('#nav span')
  s.click('#cta')
  s.click('#outside')
  s.click('#unknown')
  assert.deepEqual(s.events, [
    [
      'event',
      SITE_EVENTS.navigation,
      {
        page_path: '/docs',
        target_path: '/atlas',
        link_area: 'header',
        navigation_type: 'page'
      }
    ],
    [
      'event',
      SITE_EVENTS.cta,
      { page_path: '/docs', cta_id: 'compose', link_area: 'content' }
    ]
  ])
  assert.doesNotMatch(
    JSON.stringify(s.events),
    /private|secret|email|token|page_view/
  )
  s.tracker.dispose()
})

test('middle and keyboard clicks count once; right clicks, disabled controls and selected cases do not', () => {
  const s = setup(
    '<a id="link" href="/atlas">Atlas</a><button id="disabled" disabled data-site-action="' +
      SITE_ACTIONS.atlasStep.id +
      '">Step</button><button id="selected" aria-pressed="true" data-site-case="continuous-pointer-undo" data-site-action="' +
      SITE_ACTIONS.atlasSelect.id +
      '">Case</button>'
  )
  s.click('#link', 'auxclick', 1)
  s.click('#link', 'click', 0)
  s.click('#link', 'auxclick', 2)
  s.click('#disabled')
  s.click('#selected')
  assert.equal(s.events.length, 2)
  s.tracker.dispose()
})

test('search consumes rendered results once after input settles, flushes on selection and excludes raw query text', () => {
  const s = setup(
    '<dialog open data-site-search data-site-result-count="2"><input type="search"><div class="search-results"><a href="/atlas">Atlas</a><a href="/docs">Docs</a></div></dialog>'
  )
  const input = s.window.document.querySelector('input')
  for (const value of ['p', 'private@example.com']) {
    input.value = value
    input.dispatchEvent(new s.window.Event('input', { bubbles: true }))
  }
  assert.equal(s.timers.size, 1)
  assert.equal(s.events.length, 0)
  s.click('.search-results a')
  s.flush()
  assert.equal(s.events.length, 2)
  assert.equal(s.events[0][1], SITE_EVENTS.search)
  assert.deepEqual(s.events[0][2], {
    page_path: '/docs',
    result_count: 2,
    query_length: '9_plus'
  })
  assert.deepEqual(s.events[1][2], {
    page_path: '/docs',
    target_path: '/atlas',
    result_position: 1
  })
  input.dispatchEvent(new s.window.Event('input', { bubbles: true }))
  s.flush()
  assert.equal(s.events.length, 2)
  assert.doesNotMatch(JSON.stringify(s.events), /private|example|search_term/)
  s.tracker.dispose()
})

test('empty searches, closed dialogs, route changes and disposal cancel pending work', () => {
  const s = setup(
    '<dialog open data-site-search data-site-result-count="0"><input type="search"></dialog>'
  )
  const input = s.window.document.querySelector('input')
  const change = (value) => {
    input.value = value
    input.dispatchEvent(new s.window.Event('input', { bubbles: true }))
  }
  change('missing')
  s.window.document.querySelector('dialog').removeAttribute('open')
  s.flush()
  assert.equal(s.events.length, 0)
  s.window.document.querySelector('dialog').setAttribute('open', '')
  change('missing')
  s.tracker.pageChanged()
  assert.equal(s.timers.size, 0)
  change('   ')
  s.flush()
  assert.equal(s.events.length, 0)
  change('none')
  s.flush()
  assert.equal(s.events[0][2].result_count, 0)
  change('another')
  s.tracker.dispose()
  assert.equal(s.timers.size, 0)
  s.flush()
  assert.equal(s.events.length, 1)
})

test('cleanup and remount keep exactly one active tracker; transport errors never break interactions', () => {
  const s = setup('<a href="/atlas">Atlas</a>')
  s.tracker.dispose()
  const second = installSiteAnalytics(s.window, s.config)
  s.click('a')
  assert.equal(s.events.length, 1)
  s.window.gtag = () => {
    throw new Error('blocked')
  }
  assert.doesNotThrow(() => s.click('a'))
  delete s.window.gtag
  assert.doesNotThrow(() => s.click('a'))
  second.dispose()
  s.window.gtag = (...args) => s.events.push(args)
  s.click('a')
  assert.equal(s.events.length, 1)
})

test('Atlas emits only allowlisted case IDs and action intent, never runtime payloads', () => {
  const s = setup(
    '<section data-site-case="continuous-pointer-undo"><button id="step" data-site-action="' +
      SITE_ACTIONS.atlasStep.id +
      '">Private state</button></section><button id="bad" data-site-case="secret" data-site-action="' +
      SITE_ACTIONS.atlasStep.id +
      '">Other</button>',
    '/atlas'
  )
  s.click('#step')
  s.click('#bad')
  assert.deepEqual(s.events, [
    [
      'event',
      SITE_EVENTS.atlas,
      {
        page_path: '/atlas',
        action: 'step',
        case_id: 'continuous-pointer-undo'
      }
    ]
  ])
  s.tracker.dispose()
})

test('copying code records the action without content; ordinary prose copies are ignored', () => {
  const s = setup(
    '<pre><code>secret code</code></pre><p>private prose</p>',
    '/unknown-private-path'
  )
  const selection = s.window.getSelection()
  const range = s.window.document.createRange()
  range.selectNodeContents(s.window.document.querySelector('code'))
  selection.addRange(range)
  s.window.document.dispatchEvent(new s.window.Event('copy'))
  assert.deepEqual(s.events, [
    ['event', SITE_EVENTS.codeCopy, { page_path: '(other)' }]
  ])
  selection.removeAllRanges()
  range.selectNodeContents(s.window.document.querySelector('p'))
  selection.addRange(range)
  s.window.document.dispatchEvent(new s.window.Event('copy'))
  assert.equal(s.events.length, 1)
  s.tracker.dispose()
})

test('allowlists are computed once per mount and every listener is removed once', () => {
  const s = setup('<a href="/atlas">Atlas</a>')
  s.tracker.dispose()
  let reads = 0
  const counted = (values) => ({
    *[Symbol.iterator]() {
      reads += 1
      yield* values
    }
  })
  const added = []
  const removed = []
  const document = s.window.document
  const add = document.addEventListener.bind(document)
  const remove = document.removeEventListener.bind(document)
  document.addEventListener = (...args) => {
    added.push(args)
    add(...args)
  }
  document.removeEventListener = (...args) => {
    removed.push(args)
    remove(...args)
  }
  const tracker = installSiteAnalytics(s.window, {
    pagePaths: counted(s.config.pagePaths),
    caseIds: counted(s.config.caseIds)
  })
  assert.equal(reads, 2)
  assert.equal(added.length, 6)
  for (let index = 0; index < 5; index += 1) {
    s.click('a')
    tracker.pageChanged()
  }
  assert.equal(s.events.length, 5)
  assert.equal(reads, 2)
  tracker.dispose()
  tracker.dispose()
  assert.deepEqual(removed, added)
})

test('IME composition is not a search and native dialog close cancels pending input', () => {
  const s = setup(
    '<dialog open aria-labelledby="search-title" data-site-search data-site-result-count="1"><input type="search"></dialog>'
  )
  const input = s.window.document.querySelector('input')
  input.value = '測試'
  input.dispatchEvent(
    new s.window.InputEvent('input', { bubbles: true, isComposing: true })
  )
  s.flush()
  assert.equal(s.events.length, 0)
  input.dispatchEvent(new s.window.InputEvent('input', { bubbles: true }))
  assert.equal(s.timers.size, 1)
  s.window.document
    .querySelector('dialog')
    .dispatchEvent(new s.window.Event('close'))
  assert.equal(s.timers.size, 0)
  s.flush()
  assert.deepEqual(s.events, [
    [
      'event',
      SITE_EVENTS.ui,
      { page_path: '/docs', control_id: 'search', action: 'close' }
    ]
  ])
  s.tracker.dispose()
})
