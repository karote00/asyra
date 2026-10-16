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
      // eslint-disable-next-line no-control-regex
      const terminalStyles = /\u001b\[[0-9;]*m/g
      const appendFailureDetails = (
        container,
        errors,
        stripTerminal = false
      ) => {
        if (!errors?.length)
          container.append(
            node('p', 'Structured assertion details were not recorded.')
          )
        for (const [index, error] of (errors ?? []).entries()) {
          const assertion = node('section')
          assertion.className = 'test-result-assertion'
          assertion.append(node('h5', 'Error - ' + (index + 1)))
          for (const [key, label] of Object.entries({
            file: 'File',
            projectName: 'Project',
            suiteName: 'Suite',
            name: 'Error type',
            message: 'Original message',
            diff: 'Runner diff',
            expected: 'Expected',
            actual: 'Actual',
            stack: 'Original stack'
          })) {
            if (!Object.hasOwn(error, key)) continue
            assertion.append(
              node('h6', label + (error[key] === '' ? ' - empty string' : ''))
            )
            // Remove terminal styling only in presentation; retain original evidence.
            const text =
              key === 'diff' ||
              (stripTerminal && ['message', 'stack'].includes(key))
                ? error[key].replace(terminalStyles, '')
                : error[key]
            const value = node('pre', text)
            value.dataset.failureField = key
            assertion.append(value)
          }
          if (
            !['expected', 'actual', 'diff'].some((key) =>
              Object.hasOwn(error, key)
            )
          )
            assertion.append(
              node(
                'p',
                'The runner did not supply expected, actual or diff values.'
              )
            )
          container.append(assertion)
        }
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
      const executionDetails = node('div')
      executionDetails.id = 'test-result-execution-details'
      const storageProblems = node('section')
      storageProblems.setAttribute(
        'aria-label',
        'Current observation storage problems'
      )
      const currentProblems = node('section')
      currentProblems.id = 'test-result-current-problems'
      const historicalWarnings = node('details')
      historicalWarnings.id = 'test-result-historical-warnings'
      const historySummary = node('summary', 'Historical warnings')
      const historicalProblems = node('div')
      historicalWarnings.append(historySummary, historicalProblems)
      executionDetails.append(
        storageProblems,
        currentProblems,
        historicalWarnings
      )
      const appendProblems = (container, groups) => {
        for (const group of groups) {
          const section = node('section')
          const evidence = node('a', 'Observation - ' + group.runId)
          evidence.href = '/api/test-results/' + group.runId
          evidence.target = '_blank'
          evidence.rel = 'noopener noreferrer'
          section.append(evidence, node('p', group.startedAt))
          for (const message of group.issues) section.append(node('p', message))
          if (group.executionFailureDetails.length)
            appendFailureDetails(section, group.executionFailureDetails)
          if (group.supersededBy) {
            const successor = node('a', 'Superseded by - ' + group.supersededBy)
            successor.href = '/api/test-results/' + group.supersededBy
            successor.target = '_blank'
            successor.rel = 'noopener noreferrer'
            section.append(successor)
          }
          container.append(section)
        }
      }

      const list = node('div')
      list.id = 'test-result-failures'
      const details = node('div')
      details.id = 'test-result-detail'
      panel.append(label, notice, executionDetails, list, details)
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
      let refreshInteractions = null
      const drafts = new Map()
      const mountInteractions = (item) => {
        const section = node('section')
        section.id = 'node-interactions'
        const status = node('p')
        status.setAttribute('role', 'status')
        const previewButton = node('button', 'Preview selected test rerun')
        const confirmButton = node('button', 'Confirm selected test rerun')
        confirmButton.hidden = true
        const previewText = node('pre')
        const actions = node('div')
        const comments = node('div')
        const label = node('label', 'Add investigation note')
        const input = node('textarea')
        input.maxLength = 2000
        input.value = drafts.get(item.id) || ''
        label.append(input)
        const add = node('button', 'Save note')
        section.append(
          node('h4', 'Node interactions'),
          status,
          previewButton,
          previewText,
          confirmButton,
          actions,
          node('h4', 'Investigation notes'),
          node(
            'p',
            'Append-only local notes, separate from original test evidence. Add a new note to correct an earlier one.'
          ),
          comments,
          label,
          add
        )
        details.append(section)
        let pending = false,
          preview = null,
          rerunId = null,
          contextRevision = 0,
          commentId = window.crypto.randomUUID(),
          signature = ''
        const current = () =>
          !disposed && chosen === item.id && section.isConnected
        const selection = { runId: item.runId, caseId: item.id }
        const post = async (url, body) => {
          const session = await get('/api/session')
          const response = await fetch(url, {
            method: 'POST',
            signal: lifetime.signal,
            headers: {
              'content-type': 'application/json',
              'x-proof-capability': session.capability
            },
            body: JSON.stringify(body)
          })
          const value = await response.json()
          if (!response.ok) throw new Error(value.error || 'Node action failed')
          return value
        }
        const update = async () => {
          const revision = ++contextRevision
          let value
          try {
            value = await get(
              '/api/node-context/' + item.runId + '/' + item.id.split(':')[1]
            )
          } catch (error) {
            if (current() && revision === contextRevision) throw error
            return
          }
          if (!current() || revision !== contextRevision) return
          const next = JSON.stringify(value)
          if (next === signature) return
          signature = next
          status.textContent = 'Reference: ' + value.reference
          comments.replaceChildren(
            ...value.comments.map((comment) => {
              const entry = node('article')
              entry.append(
                node('p', comment.actor + ' - ' + comment.createdAt),
                node('pre', comment.text)
              )
              return entry
            })
          )
          actions.replaceChildren(
            ...value.actions.map((action) => {
              const entry = node('article')
              entry.append(
                node(
                  'p',
                  'Rerun - ' +
                    action.status +
                    ' - ' +
                    (action.observedStatus || 'pending') +
                    ' - ' +
                    (action.resolution || 'not assessed')
                ),
                node(
                  'pre',
                  [
                    action.id,
                    action.error,
                    ...(action.issues || []),
                    action.process?.reason,
                    action.process?.output
                  ]
                    .filter(Boolean)
                    .join('\n')
                )
              )
              if (action.resultRunId) {
                const link = node('a', 'Open rerun report')
                link.href = '/api/test-results/' + action.resultRunId
                link.target = '_blank'
                link.rel = 'noopener noreferrer'
                entry.append(link)
              }
              if (action.status === 'running') {
                const cancel = node('button', 'Cancel rerun')
                cancel.addEventListener(
                  'click',
                  () =>
                    act(async () => {
                      await post(
                        '/api/node-reruns/' + action.id + '/cancel',
                        {}
                      )
                      await update()
                    }),
                  { signal: lifetime.signal }
                )
                entry.append(cancel)
              }
              return entry
            })
          )
        }
        const act = async (callback) => {
          if (pending || !current()) return
          pending = true
          previewButton.disabled = confirmButton.disabled = add.disabled = true
          try {
            await callback()
          } catch (error) {
            if (current()) status.textContent = error.message
          } finally {
            pending = false
            if (current())
              previewButton.disabled =
                confirmButton.disabled =
                add.disabled =
                  false
          }
        }
        input.addEventListener(
          'input',
          () => {
            drafts.set(item.id, input.value)
            commentId = window.crypto.randomUUID()
          },
          { signal: lifetime.signal }
        )
        previewButton.addEventListener(
          'click',
          () =>
            act(async () => {
              preview = null
              confirmButton.hidden = true
              const value = await post('/api/node-reruns/preview', selection)
              if (!current()) return
              preview = value
              rerunId = window.crypto.randomUUID()
              previewText.textContent = [
                'Test: ' + value.test.name,
                'File: ' + value.test.file,
                'Project: ' + (value.test.project || '(default)'),
                'Runner: ' + value.command.runner,
                'Original run scope fingerprint: ' + value.originalSourceDigest,
                'Selected rerun scope fingerprint: ' + value.sourceDigest,
                'cwd: ' + value.command.cwd,
                'Arguments: ' + JSON.stringify(value.command.args)
              ].join('\n')
              confirmButton.hidden = false
              status.textContent =
                'Review the selected test and current source before confirming.'
            }),
          { signal: lifetime.signal }
        )
        confirmButton.addEventListener(
          'click',
          () =>
            act(async () => {
              if (!preview) return
              await post('/api/node-reruns', {
                ...selection,
                requestId: rerunId,
                previewDigest: preview.previewDigest
              })
              if (!current()) return
              confirmButton.hidden = true
              preview = null
              await update()
            }),
          { signal: lifetime.signal }
        )
        add.addEventListener(
          'click',
          () =>
            act(async () => {
              const text = input.value
              const requestId = commentId
              await post('/api/node-comments', {
                ...selection,
                requestId,
                text
              })
              if (!current()) return
              if (input.value === text) {
                input.value = ''
                drafts.delete(item.id)
                commentId = window.crypto.randomUUID()
              }
              await update()
            }),
          { signal: lifetime.signal }
        )
        refreshInteractions = async () => {
          if (!current() || pending) return
          try {
            await update()
          } catch (error) {
            if (current()) status.textContent = error.message
          }
        }
        refreshInteractions()
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
              ...item.failures.map((text) =>
                item.runnerDetails ? text.replace(terminalStyles, '') : text
              ),
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
          appendFailureDetails(
            details,
            item.failureDetails,
            Boolean(item.runnerDetails)
          )
          if (item.runnerDetails) {
            const attempts = node('details')
            attempts.append(
              node(
                'summary',
                'Playwright attempts and original runner context'
              ),
              node('pre', item.runnerDetails)
            )
            details.append(
              node(
                'p',
                'Runner: Playwright - ' +
                  (record.report?.config?.version || 'version unavailable')
              ),
              attempts
            )
          }
          if (record.retainedArtifacts?.length) {
            details.append(node('h5', 'Retained run artifacts'))
            for (const artifact of record.retainedArtifacts)
              details.append(
                node(
                  'pre',
                  [
                    artifact.name,
                    'File: ' + artifact.retainedPath,
                    'SHA-256: ' + artifact.digest,
                    'Bytes: ' + artifact.size
                  ].join('\n')
                )
              )
            details.append(
              node(
                'p',
                'Artifact bytes are retained with this observation. CI downloads must preserve the artifact directory alongside the JSON record.'
              )
            )
          }
          const evidence = node('a', 'Open retained report and context')
          evidence.href = '/api/test-results/' + record.id
          evidence.target = '_blank'
          evidence.rel = 'noopener noreferrer'
          details.append(evidence)
          if (item.resolution === 'mapped') mountInteractions(item)
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
        notice.textContent =
          (selected
            ? 'Historical observation - ' + selected.startedAt + '. '
            : 'Latest observed results - not current working-tree verification. ') +
          failures.length +
          ' failed tests; ' +
          (selected
            ? Number(selected.phase === 'running')
            : state.runs.filter((run) => run.phase === 'running').length) +
          ' incomplete runs; ' +
          cases.filter((item) => item.resolution !== 'mapped').length +
          ' unresolved observations.'
        currentProblems.replaceChildren(
          node(
            'h4',
            selected
              ? 'Evidence problems in this historical observation'
              : 'Current evidence problems'
          )
        )
        historicalProblems.replaceChildren()
        const groups = selected
          ? [
              {
                runId: selected.id,
                startedAt: selected.startedAt,
                issues: selected.issues,
                executionFailureDetails: selected.executionFailureDetails ?? [],
                supersededBy: null
              }
            ].filter(
              (group) =>
                group.issues.length || group.executionFailureDetails.length
            )
          : state.warningGroups.current
        storageProblems.replaceChildren(
          node('h4', 'Current observation storage problems')
        )
        storageProblems.hidden = !state.issues.length
        for (const issue of state.issues)
          storageProblems.append(node('p', issue))
        appendProblems(currentProblems, groups)
        if (!groups.length)
          currentProblems.append(
            node(
              'p',
              selected
                ? 'No evidence problems in this observation.'
                : 'No current evidence problems.'
            )
          )
        historicalWarnings.hidden =
          Boolean(selected) || !state.warningGroups.history.length
        historySummary.textContent =
          'Historical warnings - ' + state.warningGroups.history.length
        if (!selected)
          appendProblems(historicalProblems, state.warningGroups.history)
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
          const summary = node('a', 'Open investigation summary')
          summary.href =
            item.contextUrl ??
            '/api/node-context/' +
              item.runId +
              '/' +
              item.id.slice(item.runId.length + 1) +
              '/summary'
          summary.target = '_blank'
          summary.rel = 'noopener noreferrer'
          row.append(summary)

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
          await refreshInteractions?.()
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
