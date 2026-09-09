// Stable, app-owned GA4 wire identities. No framework events or user data.
export const SITE_EVENTS = Object.freeze({
  cta: 'site_cta_click',
  navigation: 'site_navigation',
  search: 'site_search',
  searchSelect: 'site_search_select',
  ui: 'site_ui_interaction',
  atlas: 'site_atlas_interaction',
  codeCopy: 'site_code_copy'
})

export const SITE_ACTIONS = Object.freeze({
  navigationOpen: {
    id: 'navigation_open',
    control_id: 'navigation',
    action: 'open'
  },
  docsOpen: { id: 'docs_open', control_id: 'docs_navigation', action: 'open' },
  searchOpen: { id: 'search_open', control_id: 'search', action: 'open' },
  errorRetry: { id: 'error_retry', control_id: 'error', action: 'retry' },
  atlasSelect: { id: 'atlas_select', action: 'select_case' },
  atlasRun: { id: 'atlas_run', action: 'run' },
  atlasPause: { id: 'atlas_pause', action: 'pause' },
  atlasStep: { id: 'atlas_step', action: 'step' },
  atlasReplay: { id: 'atlas_replay', action: 'replay' },
  atlasReset: { id: 'atlas_reset', action: 'reset' }
})
const actionsById = new Map(
  Object.values(SITE_ACTIONS).map((action) => [
    action.id,
    Object.freeze(action)
  ])
)
const ctaDestinations = new Map([
  ['/docs/start/custom-composition', 'compose'],
  ['/docs/start/create-design-app', 'create_app'],
  ['/atlas', 'explore_atlas'],
  ['/asyra-design', 'product_case'],
  ['https://asyra-design.vercel.app/', 'open_demo'],
  ['https://github.com/karote00/asyra', 'view_source']
])
const dialogControls = new Map([
  ['navigation-title', 'navigation'],
  ['docs-navigation-title', 'docs_navigation'],
  ['search-title', 'search']
])
const linkAreas = [
  ['.search-results', 'search'],
  ['.docs-toc', 'docs_toc'],
  ['.docs-navigation, .docs-navigation-dialog', 'docs_sidebar'],
  ['.navigation-dialog', 'mobile_navigation'],
  ['.hero', 'hero'],
  ['.product-evidence', 'product'],
  ['.readiness', 'readiness'],
  ['.closing', 'closing'],
  ['header', 'header'],
  ['footer', 'footer']
]
const linkArea = (element) =>
  linkAreas.find(([selector]) => element.closest(selector))?.[1] ?? 'content'
const queryLength = (length) => {
  if (length <= 3) return '1_3'
  if (length <= 8) return '4_8'
  return '9_plus'
}

// One instance per configured root layout. No polling, storage, raw text,
// history hooks, page-view events, or runtime/snapshot reads.
export function installSiteAnalytics(browser, { pagePaths, caseIds }) {
  const { document } = browser
  const paths = new Set(pagePaths)
  const cases = new Set(caseIds)
  let disposed = false
  let timer
  let pendingInput
  let pendingPath
  let reportedQueries = new WeakMap()
  const pagePath = () =>
    paths.has(browser.location.pathname) ? browser.location.pathname : '(other)'
  const emit = (name, parameters = {}) => {
    if (disposed) return
    try {
      browser.gtag?.('event', name, { page_path: pagePath(), ...parameters })
    } catch {
      // Analytics availability must never change navigation or product behavior.
    }
  }
  const cancelSearch = () => {
    if (timer !== undefined) browser.clearTimeout(timer)
    timer = undefined
    pendingInput = undefined
    pendingPath = undefined
  }
  const flushSearch = () => {
    const input = pendingInput
    const path = pendingPath
    cancelSearch()
    const dialog = input?.closest('[data-site-search]')
    if (
      !input?.isConnected ||
      !dialog?.open ||
      path !== browser.location.pathname
    )
      return
    const query = input.value.trim()
    if (!query || reportedQueries.get(input) === query) return
    const resultCount = Number(dialog.dataset.siteResultCount)
    if (!Number.isInteger(resultCount) || resultCount < 0 || resultCount > 12)
      return
    reportedQueries.set(input, query)
    emit(SITE_EVENTS.search, {
      result_count: resultCount,
      query_length: queryLength(query.length)
    })
  }
  const onInput = (event) => {
    const input = event.target
    if (
      !(input instanceof browser.HTMLInputElement) ||
      !input.closest('[data-site-search]')
    )
      return
    cancelSearch()
    if (event.isComposing) return
    if (!input.value.trim()) {
      reportedQueries.delete(input)
      return
    }
    pendingInput = input
    pendingPath = browser.location.pathname
    timer = browser.setTimeout(flushSearch, 500)
  }
  const onKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      event.target === pendingInput &&
      !event.isComposing
    )
      flushSearch()
  }
  const onClick = (event) => {
    if (event.type === 'auxclick' && event.button !== 1) return
    if (event.type === 'click' && event.button !== 0) return
    const target = event.target
    if (!(target instanceof browser.Element)) return
    const control = target.closest('[data-site-action]')
    if (control) {
      if (control.matches(':disabled, [aria-disabled="true"]')) return
      const action = actionsById.get(control.dataset.siteAction)
      if (!action) return
      if (action.control_id) {
        emit(SITE_EVENTS.ui, {
          control_id: action.control_id,
          action: action.action
        })
      } else {
        if (
          action.action === 'select_case' &&
          control.getAttribute('aria-pressed') === 'true'
        )
          return
        const caseId = control.closest('[data-site-case]')?.dataset.siteCase
        if (cases.has(caseId))
          emit(SITE_EVENTS.atlas, { action: action.action, case_id: caseId })
      }
      return
    }
    const link = target.closest('a[href]')
    if (!link || link.hasAttribute('download')) return
    let destination
    try {
      destination = new browser.URL(link.href, browser.location.href)
    } catch {
      return
    }
    if (!['http:', 'https:'].includes(destination.protocol)) return
    const internal = destination.origin === browser.location.origin
    if (link.hasAttribute('data-site-cta')) {
      const key = internal
        ? destination.pathname
        : destination.origin + destination.pathname
      const cta = ctaDestinations.get(key)
      if (cta) {
        emit(SITE_EVENTS.cta, { cta_id: cta, link_area: linkArea(link) })
        return
      }
    }
    if (!internal || !paths.has(destination.pathname)) return
    const results = link.closest('.search-results')
    if (results) {
      flushSearch()
      const position =
        Array.from(results.querySelectorAll('a[href]')).indexOf(link) + 1
      if (position > 0 && position <= 12)
        emit(SITE_EVENTS.searchSelect, {
          target_path: destination.pathname,
          result_position: position
        })
      return
    }
    emit(SITE_EVENTS.navigation, {
      target_path: destination.pathname,
      link_area: linkArea(link),
      navigation_type:
        destination.pathname === browser.location.pathname && destination.hash
          ? 'section'
          : 'page'
    })
  }
  const onClose = (event) => {
    const dialog = event.target
    if (!(dialog instanceof browser.HTMLDialogElement)) return
    if (dialog.hasAttribute('data-site-search')) {
      cancelSearch()
      reportedQueries = new WeakMap()
    }
    const control = dialogControls.get(dialog.getAttribute('aria-labelledby'))
    if (control) emit(SITE_EVENTS.ui, { control_id: control, action: 'close' })
  }
  const onCopy = () => {
    const selection = browser.getSelection()
    if (!selection || selection.isCollapsed) return
    const anchor =
      selection.anchorNode instanceof browser.Element
        ? selection.anchorNode
        : selection.anchorNode?.parentElement
    const code = anchor?.closest('pre')
    if (code && code.contains(selection.focusNode)) emit(SITE_EVENTS.codeCopy)
  }
  const listeners = [
    ['click', onClick],
    ['auxclick', onClick],
    ['input', onInput],
    ['keydown', onKeyDown],
    ['close', onClose],
    ['copy', onCopy]
  ]
  for (const [type, listener] of listeners)
    document.addEventListener(type, listener, true)
  return {
    pageChanged() {
      cancelSearch()
      reportedQueries = new WeakMap()
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelSearch()
      for (const [type, listener] of listeners)
        document.removeEventListener(type, listener, true)
    }
  }
}
