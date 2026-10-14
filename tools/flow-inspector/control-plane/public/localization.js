/* global window, document, fetch, AbortController, MutationObserver, CustomEvent, TextEncoder, URLSearchParams */
;(() => {
  window.addEventListener(
    'load',
    async () => {
      const target = globalThis.FLOW_INSPECTOR_WORKSPACE_ENTRY
      const detail = document.getElementById('detail'),
        graph = document.getElementById('flow')
      if (!target || !detail || !graph) return
      const architectureDigest = [
        ...new Uint8Array(
          await window.crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(JSON.stringify(target.data))
          )
        )
      ]
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')
      const lifetime = new AbortController()
      const node = (tag, text) => {
        const element = document.createElement(tag)
        if (text !== undefined) element.textContent = text
        return element
      }
      const panel = node('section')
      panel.id = 'test-result-controls'
      panel.className = 'proof-controls'
      panel.append(
        node('h3', 'Test failure locations'),
        node(
          'p',
          'Observed test results - not accepted conformance. Unmapped failures remain visible.'
        )
      )
      const label = node('label', 'Result scope'),
        history = node('select')
      history.id = 'test-result-history'
      label.append(history)
      const notice = node('p')
      notice.id = 'test-result-notice'
      notice.setAttribute('role', 'status')
      const list = node('div')
      list.id = 'test-result-failures'
      const details = node('div')
      details.id = 'test-result-detail'
      panel.append(label, notice, list, details)
      detail.prepend(panel)
      let state,
        signature = '',
        selection = '',
        busy = false,
        disposed = false,
        chosen = null,
        linkHandled = false,
        selectionDirty = true,
        renderRevision = 0,
        displayedCases = []
      const records = new Map()
      const get = async (url) => {
        const response = await fetch(url, { signal: lifetime.signal })
        if (!response.ok)
          throw new Error('Result unavailable: ' + response.status)
        return response.json()
      }
      const recordFor = async (id) => {
        if (!records.has(id)) {
          const value = await get('/api/test-results/' + id)
          if (value.phase === 'completed') records.set(id, value)
          return value
        }
        return records.get(id)
      }
      const locate = (item) => {
        const location = item.locations.find(
          (location) => location.targetId === target.data.target.id
        )
        if (!location) return
        if (location.architectureVersion !== architectureDigest) {
          notice.textContent =
            'Recorded architecture differs from this canvas; inspect retained context without guessing a current node.'
          return
        }
        const card = [...graph.querySelectorAll('[data-step-id]')].find(
          (card) => card.dataset.stepId === location.stepId
        )
        card?.click()
        graph.dispatchEvent(
          new CustomEvent('flowfitrequest', {
            detail: { stepIds: [location.stepId], padding: 80 }
          })
        )
      }
      const highlight = () => {
        const failures = displayedCases
        for (const card of graph.querySelectorAll('[data-step-id]'))
          card.classList.toggle(
            'observation-failed',
            failures.some(
              (item) =>
                item.status === 'failed' &&
                item.locations.some(
                  (location) =>
                    location.targetId === target.data.target.id &&
                    location.architectureVersion === architectureDigest &&
                    location.stepId === card.dataset.stepId
                )
            )
          )
      }
      const show = async (item) => {
        chosen = item.id
        try {
          const record = await recordFor(item.runId)
          if (disposed || chosen !== item.id) return
          details.replaceChildren(
            node('h4', item.testName),
            node('p', item.reason)
          )
          const pre = node(
            'pre',
            [
              'Test: ' + item.file,
              'Project: ' + (item.projectName || '(default)'),
              'Original failure:',
              ...item.failures,
              ...item.locations.flatMap((location) => [
                'Flow: ' + location.flowId,
                'Step: ' + location.stepId,
                'Owner: ' + location.ownerPackage,
                'Implementation: ' +
                  (location.implementationPaths.join(', ') ||
                    'Exact location unavailable; see boundary'),
                'Boundary: ' + location.implementationBoundary.join(', '),
                'Contract: ' +
                  location.specPath +
                  ' ' +
                  location.specRefs.join(', ')
              ]),
              'Run: ' + record.id,
              'Observed source: ' + (record.head || 'unavailable'),
              'Mapped-input fingerprint: ' +
                (record.source?.digest || 'unavailable'),
              'Rerun original scope (not executed):',
              record.command
                ? 'cwd: ' +
                  record.command.cwd +
                  '\n' +
                  Object.entries(record.command.environment ?? {})
                    .map(([name, value]) => name + '=' + JSON.stringify(value))
                    .join('\n') +
                  '\n' +
                  record.command.argv
                    .map((arg) => "'" + arg.replaceAll("'", "'\\''") + "'")
                    .join(' ')
                : 'Original command unavailable'
            ].join('\n')
          )
          details.append(pre)
          const evidence = node('a', 'Open retained report and context')
          evidence.href = '/api/test-results/' + record.id
          evidence.target = '_blank'
          evidence.rel = 'noopener noreferrer'
          details.append(evidence)
          locate(item)
        } catch (error) {
          if (!disposed && chosen === item.id)
            notice.textContent = error.message
        }
      }
      const render = async () => {
        const revision = ++renderRevision
        const requestedSelection = selection
        let selected
        try {
          selected = requestedSelection
            ? await recordFor(requestedSelection)
            : null
        } catch (error) {
          if (
            disposed ||
            revision !== renderRevision ||
            requestedSelection !== selection
          )
            return false
          throw error
        }
        if (
          disposed ||
          revision !== renderRevision ||
          requestedSelection !== selection
        )
          return false
        const cases = selected?.cases ?? state.currentCases
        displayedCases = cases
        if (chosen && !cases.some((item) => item.id === chosen)) {
          chosen = null
          details.replaceChildren()
        }
        const failures = cases.filter((item) => item.status === 'failed')
        const issues = [
          ...state.issues,
          ...(selected?.issues ?? state.runs.flatMap((run) => run.issues))
        ]
        notice.textContent =
          failures.length +
          ' failed tests; ' +
          (selected
            ? Number(selected.phase === 'running')
            : state.runs.filter((run) => run.phase === 'running').length) +
          ' incomplete runs; ' +
          cases.filter((item) => item.resolution !== 'mapped').length +
          ' unresolved observations. ' +
          issues.join('\n')
        list.replaceChildren()
        if (selected) {
          const evidence = node('a', 'Open selected run report and context')
          evidence.href = '/api/test-results/' + selected.id
          evidence.target = '_blank'
          evidence.rel = 'noopener noreferrer'
          list.append(evidence)
        }
        for (const item of failures) {
          const row = node('div'),
            button = node('button', item.testName + ' - ' + item.resolution)
          button.type = 'button'
          button.dataset.observationId = item.id
          button.addEventListener('click', () => show(item), {
            signal: lifetime.signal
          })
          row.append(button)
          const other = item.locations.find(
            (location) => location.targetId !== target.data.target.id
          )
          const route =
            other && state.targets.find((entry) => entry.id === other.targetId)
          if (route) {
            const link = node('a', 'Open ' + other.title)
            link.href =
              route.url + '?observation=' + encodeURIComponent(item.id)
            link.target = '_top'
            row.append(link)
          }
          list.append(row)
        }
        highlight()
        selectionDirty = false
        return true
      }
      const refresh = async () => {
        if (busy || disposed) return
        busy = true
        try {
          const next = await get('/api/test-results')
          if (disposed) return
          const nextSignature = JSON.stringify(next)
          if (nextSignature !== signature) {
            state = next
            history.replaceChildren(
              node('option', 'Latest observed result per test')
            )
            history.firstChild.value = ''
            for (const run of state.runs) {
              const option = node(
                'option',
                run.startedAt +
                  ' - ' +
                  run.phase +
                  ' - ' +
                  run.failedCount +
                  ' failed'
              )
              option.value = run.id
              history.append(option)
            }
            history.value = selection
          }
          if (nextSignature !== signature || selectionDirty) {
            if (await render()) signature = nextSignature
          }
          const id = new URLSearchParams(window.parent.location.search).get(
            'observation'
          )
          if (!linkHandled && id) {
            const record = await recordFor(id.split(':')[0])
            const item = record.cases.find((item) => item.id === id)
            if (item && !linkHandled && !disposed) {
              selection = record.id
              history.value = selection
              selectionDirty = true
              if (await render()) {
                linkHandled = true
                await show(item)
              }
            }
          }
        } catch (error) {
          selectionDirty = true
          if (!disposed) notice.textContent = error.message
        } finally {
          busy = false
        }
      }
      history.addEventListener(
        'change',
        () => {
          selection = history.value
          linkHandled = true
          selectionDirty = true
          chosen = null
          details.replaceChildren()
          render().catch((error) => {
            notice.textContent = error.message
          })
        },
        { signal: lifetime.signal }
      )
      const observer = new MutationObserver(highlight)
      observer.observe(graph, { childList: true, subtree: true })
      const timer = window.setInterval(refresh, 1500)
      window.addEventListener(
        'pagehide',
        () => {
          disposed = true
          lifetime.abort()
          observer.disconnect()
          window.clearInterval(timer)
          records.clear()
        },
        { once: true }
      )
      refresh()
    },
    { once: true }
  )
})()
