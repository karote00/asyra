/* global document, window, fetch, AbortController, MutationObserver */
;(function () {
  'use strict'

  // Compose with the existing target document. The static renderer owns every
  // card, route, selection, filter, and viewport; this adapter owns only proof UI.
  window.addEventListener(
    'load',
    async () => {
      const graph = document.getElementById('flow')
      const detail = document.getElementById('detail')
      const target = globalThis.FLOW_INSPECTOR_WORKSPACE_ENTRY
      if (!graph || !detail || !target) return
      const lifetime = new AbortController()
      let disposed = false
      let observer
      let timer
      let capability
      let contract
      let record
      let selectedId = null
      let activeId = null
      let revision = 0
      let refreshing = false
      let acting = false
      let compatible = false
      let recordSignature = ''
      let historySignature = ''
      let selectedFlow
      let operationState
      let operationSignature = ''
      let selectedContractReview = ''
      let mappingState
      let selectedReviewId = null
      let mappingSignature = ''
      let mappingNotice = 'Prepare a diff to inspect the working mapping.'
      const linkedFlows = new Map()
      const cards = new Map()
      const architectureSteps = new Map(
        target.data.steps.map((step) => [step.id, step])
      )
      let cases = new Map()
      let panel
      let menu
      const byId = (id) => document.getElementById(id)
      const node = (tag, text, className) => {
        const value = document.createElement(tag)
        if (text !== undefined) value.textContent = text
        if (className) value.className = className
        return value
      }
      const listen = (element, type, callback) =>
        element.addEventListener(type, callback, { signal: lifetime.signal })
      window.addEventListener(
        'pagehide',
        () => {
          disposed = true
          observer?.disconnect()
          window.clearTimeout(timer)
          lifetime.abort()
        },
        { once: true }
      )

      async function api(route, body) {
        const options = { signal: lifetime.signal }
        if (body !== undefined) {
          options.method = 'POST'
          options.headers = {
            'Content-Type': 'application/json',
            'X-Proof-Capability': capability
          }
          options.body = JSON.stringify(body)
        }
        const response = await fetch(route, options)
        const value = await response.json()
        if (!response.ok) throw new Error(value.error ?? 'Request failed')
        return value
      }
      function showError(error) {
        if (disposed) return
        let message = byId('proof-error')
        if (!message) {
          message = node('p', '', 'proof-error')
          message.id = 'proof-error'
          message.setAttribute('role', 'alert')
          detail.prepend(message)
        }
        message.textContent = error.message
        message.hidden = false
      }
      function badge(element, status) {
        element.dataset.status = status
        element.textContent = status[0].toUpperCase() + status.slice(1)
      }
      function paintCards() {
        for (const [id, value] of cards) {
          const item = cases.get(id)
          badge(value.badge, item?.status ?? 'unknown')
          value.card.classList.toggle('proof-failed', item?.status === 'failed')
          value.badge.title =
            selectedFlow.title +
            ' - ' +
            (item?.status ?? 'unknown') +
            ' - captured attempt only'
        }
      }
      function renderSelected() {
        const id = graph.querySelector('.is-selected')?.dataset.stepId
        const linked = linkedFlows.get(id) ?? []
        const item = cases.get(id)
        byId('proof-step').textContent = linked.length
          ? linked.length +
            ' linked flows for this step. Right-click its card for actions.'
          : 'This step has no verification obligations in the current proof.'
        byId('run-linked').disabled =
          !capability ||
          !compatible ||
          Boolean(activeId) ||
          acting ||
          !linked.some((flow) => flow.id === selectedFlow.id)
        const failures = byId('proof-failures')
        failures.replaceChildren()
        if (item?.status === 'failed') {
          failures.append(node('strong', item.id + ' - failed'))
          for (const failure of item.failures)
            failures.append(
              node(
                'pre',
                failure.replace(
                  new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'),
                  ''
                )
              )
            )
        }
      }
      function projectEvidence() {
        const evidence =
          compatible && record?.matchesCurrentContract ? record.evidence : null
        cases = new Map()
        for (const item of evidence?.cases ?? []) {
          if (item.flowId !== selectedFlow.id) continue
          // An invalid report cannot grant successful evidence to a card.
          const status =
            evidence.issues.length && item.status !== 'failed'
              ? 'unknown'
              : item.status
          cases.set(item.stepId, { ...item, status })
        }
        byId('proof-goal').textContent = selectedFlow.goal
        badge(
          byId('flow-status'),
          evidence?.flows.find((flow) => flow.id === selectedFlow.id)?.status ??
            'unknown'
        )
        paintCards()
        renderSelected()
      }
      function bindCards() {
        // Observe direct graph replacement, never evidence changes inside cards.
        // Selection/filter renders retire the old DOM; polling does not call here.
        cards.clear()
        menu.hidden = true
        for (const card of graph.querySelectorAll('.step-card')) {
          if (!linkedFlows.has(card.dataset.stepId)) continue
          const status = node('span', 'Unknown', 'proof-badge')
          card.querySelector('.badge-row').prepend(status)
          cards.set(card.dataset.stepId, { card, badge: status })
        }
        paintCards()
        renderSelected()
      }
      function setContract(value) {
        if (contract?.digest === value.digest) return
        if (
          value.targetId !== target.id ||
          value.flows.some((flow) =>
            flow.steps.some(
              (step) =>
                JSON.stringify(step) !==
                JSON.stringify(architectureSteps.get(step.id))
            )
          )
        ) {
          compatible = false
          recordSignature = ''
          if (selectedFlow) renderRecord(null)
          for (const button of panel.querySelectorAll('button'))
            button.disabled = true
          menu.hidden = true
          throw new Error(
            'The canvas step contracts differ from the verification contract. Regenerate the workspace and reload before running work.'
          )
        }
        compatible = true
        contract = value
        const previousScenario = byId('scenario').value
        byId('scenario').replaceChildren()
        for (const scenario of contract.scenarios) {
          const option = node('option', scenario.title)
          option.value = scenario.id
          byId('scenario').append(option)
        }
        if (contract.scenarios.some((item) => item.id === previousScenario))
          byId('scenario').value = previousScenario
        linkedFlows.clear()
        const previous = selectedFlow?.id
        const select = byId('proof-flow')
        select.replaceChildren()
        for (const flow of contract.flows) {
          const option = node('option', flow.title)
          option.value = flow.id
          select.append(option)
          for (const step of flow.steps) {
            const linked = linkedFlows.get(step.id) ?? []
            linked.push(flow)
            linkedFlows.set(step.id, linked)
          }
        }
        selectedFlow =
          contract.flows.find((flow) => flow.id === previous) ??
          contract.flows[0]
        select.value = selectedFlow.id
        cases.clear()
        // Invalidation is explicit on contract replacement, separate from polling.
        for (const { badge: status } of cards.values()) status.remove()
        recordSignature = ''
        bindCards()
      }
      function renderRecord(value) {
        const signature = value
          ? value.id +
            value.phase +
            value.snapshot?.digest +
            value.matchesCurrentContract
          : 'empty'
        if (signature === recordSignature) return
        recordSignature = signature
        record = value
        const evidence =
          compatible && record?.matchesCurrentContract ? record.evidence : null
        const failures =
          evidence?.cases.filter((item) => item.status === 'failed') ?? []
        const notice = byId('proof-run-failure')
        notice.replaceChildren()
        notice.hidden = failures.length === 0
        if (failures.length) {
          if (!failures.some((item) => item.flowId === selectedFlow.id)) {
            selectedFlow = contract.flows.find(
              (flow) => flow.id === failures[0].flowId
            )
            byId('proof-flow').value = selectedFlow.id
          }
          notice.append(node('strong', `${failures.length} failed obligations`))
          for (const failure of failures) {
            const flow = contract.flows.find(
              (item) => item.id === failure.flowId
            )
            const step = architectureSteps.get(failure.stepId)
            const button = node(
              'button',
              `Show ${step?.title ?? failure.stepId}`
            )
            button.type = 'button'
            button.addEventListener('click', () => {
              selectedFlow = flow
              byId('proof-flow').value = flow.id
              projectEvidence()
              const card = cards.get(failure.stepId)?.card
              card?.click()
              card?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
              panel.open = true
              renderSelected()
            })
            notice.append(node('p', flow.title), button)
          }
        }
        badge(byId('overall'), evidence?.status ?? 'unknown')
        byId('checks').textContent =
          (evidence?.passedCount ?? 0) +
          ' / ' +
          (evidence?.expectedCount ?? contract.cases.length)
        let context =
          'No verified snapshot selected. Results cover only declared obligations, not task completion or deployment.'
        if (record)
          context =
            record.scenario !== 'baseline'
              ? 'NEGATIVE DEMONSTRATION - ' +
                (contract.scenarios.find((item) => item.id === record.scenario)
                  ?.title ?? record.scenario) +
                '. Only the captured demonstration is shown.'
              : 'Captured source evidence - limited to the selected flow obligations.'
        if (record?.snapshot && !record.matchesCurrentContract)
          context =
            'Historical contract differs. Current cards remain unverified; original evidence stays in its artifacts.'
        if (record?.mode === 'candidate')
          context =
            'Candidate proof - acceptance requires an explicit version decision; current cards remain unverified.'
        if (evidence?.issues.length) context += ' ' + evidence.issues.join(' ')
        if (record?.error) context += ' ' + record.error
        byId('result-context').textContent = context
        byId('ci-result').textContent = record?.ci
          ? 'Verification: ' +
            record.ci.verificationStatus +
            ' - Delivery: ' +
            record.ci.deliveryStatus +
            '\n' +
            record.ci.blockers.join('\n')
          : 'No CI aggregate selected'
        const ciLink = byId('ci-envelope-link')
        ciLink.hidden = !record?.ciEnvelopeDigest
        if (record?.ciEnvelopeDigest)
          ciLink.href = '/api/runs/' + record.id + '/artifacts/ci-envelope'
        byId('source-digest').textContent =
          record?.snapshot?.digest ?? 'No snapshot yet'
        byId('source-head').textContent = record?.snapshot?.head ?? '-'
        byId('attempt-id').textContent = record?.id ?? '-'
        byId('artifacts').textContent = record?.artifactDirectory ?? '-'
        byId('mapping-version').textContent =
          record?.snapshot?.mappingVersion ?? '-'
        byId('architecture-version').textContent =
          record?.snapshot?.architectureVersion ?? '-'
        byId('configuration-version').textContent =
          record?.snapshot?.configurationDigest ?? '-'
        const environment = record?.runner?.environment
        byId('runner-environment').textContent = environment
          ? environment.node +
            ' - ' +
            environment.platform +
            ' - ' +
            environment.architecture +
            ' - Vitest ' +
            environment.vitest
          : 'No runner environment recorded'
        for (const [id, name, available] of [
          ['report-link', 'report', record?.runner?.reportDigest],
          ['manifest-link', 'source-manifest', record?.snapshot?.manifestPath]
        ]) {
          const link = byId(id)
          link.hidden = !available
          if (available)
            link.href = '/api/runs/' + record.id + '/artifacts/' + name
          else link.removeAttribute('href')
        }
        projectEvidence()
      }
      function renderHistory(state) {
        const signature = JSON.stringify(state.runs) + selectedId
        if (historySignature === signature) return
        historySignature = signature
        byId('history').replaceChildren()
        for (const run of state.runs) {
          const button = node(
            'button',
            (run.scenario === 'baseline'
              ? 'Current source'
              : 'Regression demo') +
              ' - ' +
              run.status
          )
          button.type = 'button'
          button.setAttribute('aria-pressed', String(run.id === selectedId))
          button.addEventListener('click', () => {
            selectedId = run.id
            revision++
            refresh()
          })
          byId('history').append(button)
        }
      }
      function renderMapping(value) {
        mappingState = value
        if (selectedReviewId === null)
          selectedReviewId = value.reviews[0]?.id ?? ''
        const signature =
          value.revision +
          ':' +
          value.reviews.map((review) => review.id + review.status).join(':') +
          ':' +
          selectedReviewId +
          ':' +
          mappingNotice
        if (signature === mappingSignature) return
        mappingSignature = signature
        byId('mapping-baseline').textContent =
          'Accepted mapping revision ' +
          value.revision +
          ' - ' +
          value.acceptedVersion
        const select = byId('mapping-review')
        select.replaceChildren()
        const empty = node('option', 'Select a retained review')
        empty.value = ''
        select.append(empty)
        for (const review of value.reviews) {
          const option = node('option', review.status + ' - ' + review.id)
          option.value = review.id
          select.append(option)
        }
        select.value = selectedReviewId
        const review = value.reviews.find(
          (item) => item.id === selectedReviewId
        )
        const diff = byId('mapping-diff')
        diff.replaceChildren()
        if (!review) diff.append(node('p', mappingNotice))
        else {
          diff.append(
            node(
              'p',
              'Review ' +
                review.status +
                ' - base revision ' +
                review.baseRevision
            )
          )
          for (const change of review.changes) {
            const item = node('div', undefined, 'proof-mapping-change')
            item.append(
              node('strong', change.caseId + ' - ' + change.stepId),
              node('p', 'Before: ' + change.before),
              node('p', 'After: ' + change.after)
            )
            diff.append(item)
          }
          if (review.reason)
            diff.append(node('p', review.decidedBy + ' - ' + review.reason))
        }
      }
      async function mappingAction(decision) {
        if (acting || activeId || !capability || !compatible) return
        acting = true
        controls()
        try {
          if (byId('proof-error')) byId('proof-error').hidden = true
          const body = decision
            ? {
                id: selectedReviewId,
                decision,
                reason: byId('mapping-reason').value
              }
            : {}
          const result = await api(
            '/api/mapping/' + (decision ? 'decide' : 'prepare'),
            body
          )
          selectedReviewId = result.id ?? ''
          mappingNotice =
            result.status === 'unchanged'
              ? 'No mapping changes. The working mapping matches the accepted baseline.'
              : ''
          if (decision) byId('mapping-reason').value = ''
          revision++
          await refresh()
        } catch (error) {
          showError(error)
        } finally {
          acting = false
          if (!disposed) controls()
        }
      }
      function renderOperations(state) {
        operationState = state
        const signature =
          state.shared.fingerprint +
          JSON.stringify(state.evolution.reviews) +
          selectedContractReview
        if (operationSignature === signature) return
        operationSignature = signature
        byId('contract-baseline').textContent =
          'Accepted contract revision ' +
          state.evolution.revision +
          ' - ' +
          state.evolution.versions.length +
          ' retained versions'
        const select = byId('contract-review')
        select.replaceChildren()
        for (const review of state.evolution.reviews) {
          const option = node(
            'option',
            review.id.slice(0, 10) + ' - ' + review.status
          )
          option.value = review.id
          select.append(option)
        }
        if (
          !state.evolution.reviews.some((r) => r.id === selectedContractReview)
        )
          selectedContractReview = state.evolution.reviews.at(-1)?.id ?? ''
        select.value = selectedContractReview
        const review = state.evolution.reviews.find(
          (r) => r.id === selectedContractReview
        )
        byId('contract-diff').textContent = review
          ? JSON.stringify(
              {
                status: review.status,
                changes: review.changes,
                blockers: review.blockers
              },
              null,
              2
            )
          : 'Verify a candidate, then prepare its exact version diff.'
        const workSelect = byId('work-step'),
          previousStep = workSelect.value
        workSelect.replaceChildren()
        for (const item of state.work) {
          const step = contract.flows
            .flatMap((flow) => flow.steps)
            .find((step) => step.id === item.stepId)
          const option = node(
            'option',
            (step?.title ?? item.stepId) + ' - ' + item.status
          )
          option.value = item.stepId
          workSelect.append(option)
        }
        if (state.work.some((item) => item.stepId === previousStep))
          workSelect.value = previousStep
        const shared = state.shared
        const manager = byId('manager-view')
        manager.replaceChildren()
        for (const text of [
          shared.scope,
          'Work: ' + shared.workStatus,
          'Execution: ' + shared.executionStatus,
          'Verification: ' + shared.verificationStatus,
          'Delivery: ' + shared.deliveryStatus,
          'Observed: ' + shared.observedAt,
          'Baseline: ' + JSON.stringify(shared.baseline),
          ...shared.goals.map((flow) => 'Goal: ' + flow.goal),
          'Remaining work: ' +
            (shared.remainingWork
              .map((item) => item.stepId + ' (' + item.status + ')')
              .join(', ') || 'All steps reported complete'),
          'Remaining verification obligations: ' +
            (shared.remaining.map((c) => c.id).join(', ') ||
              'None in this verified snapshot'),
          'Confirmed failures: ' +
            (shared.confirmedFailures.map((c) => c.id).join(', ') ||
              'None observed'),
          'Potential downstream impact: ' + shared.potentialImpact.join(', '),
          ...shared.blockers.map((b) => 'Blocker: ' + b)
        ])
          manager.append(node('p', text))
      }
      async function contractAction(decision) {
        if (acting || activeId || !capability) return
        acting = true
        controls()
        try {
          const body = decision
            ? {
                id: selectedContractReview,
                decision,
                reason: byId('contract-reason').value,
                retirement: byId('contract-retirement')
                  .value.split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              }
            : {
                attemptId: selectedId,
                relations:
                  byId('contract-relation-kind').value === 'none'
                    ? []
                    : [
                        {
                          kind: byId('contract-relation-kind').value,
                          before: byId('contract-predecessors')
                            .value.split(',')
                            .map((id) => id.trim())
                            .filter(Boolean),
                          after: byId('contract-successors')
                            .value.split(',')
                            .map((id) => id.trim())
                            .filter(Boolean)
                        }
                      ]
              }
          await api('/api/contracts/' + (decision ? 'decide' : 'prepare'), body)
          revision++
          await refresh()
        } catch (error) {
          showError(error)
        } finally {
          acting = false
          if (!disposed) controls()
        }
      }
      function controls() {
        byId('run-state').textContent = activeId
          ? 'Verification running - isolated source'
          : 'Ready to verify'
        byId('run-all').disabled =
          !capability || !compatible || Boolean(activeId) || acting
        for (const id of [
          'run-ci',
          'run-ci-demo',
          'run-candidate',
          'retry-run',
          'contract-prepare'
        ])
          byId(id).disabled =
            !capability ||
            Boolean(activeId) ||
            acting ||
            (id === 'retry-run' && !record)
        const contractReview = operationState?.evolution.reviews.find(
          (r) => r.id === selectedContractReview
        )
        for (const id of ['contract-accept', 'contract-reject'])
          byId(id).disabled =
            !capability ||
            Boolean(activeId) ||
            acting ||
            contractReview?.status !== 'pending' ||
            !byId('contract-reason').value.trim()
        byId('work-save').disabled =
          !capability ||
          Boolean(activeId) ||
          acting ||
          !byId('work-reason').value.trim()
        byId('scenario').disabled = Boolean(activeId) || acting
        byId('cancel').disabled = !activeId || acting
        const review = mappingState?.reviews.find(
          (item) => item.id === selectedReviewId
        )
        byId('mapping-prepare').disabled =
          !capability || !compatible || Boolean(activeId) || acting
        for (const id of ['mapping-accept', 'mapping-reject'])
          byId(id).disabled =
            !capability ||
            !compatible ||
            Boolean(activeId) ||
            acting ||
            review?.status !== 'pending' ||
            !byId('mapping-reason').value.trim()
        for (const button of menu.querySelectorAll('button'))
          button.disabled =
            !capability || !compatible || Boolean(activeId) || acting
        renderSelected()
      }
      async function refresh() {
        if (refreshing || disposed) return
        refreshing = true
        window.clearTimeout(timer)
        const requestRevision = revision
        try {
          const state = await api('/api/state')
          setContract(state.contract)
          renderMapping(state.mapping)
          renderOperations(state)
          activeId = state.activeRunId
          if (!selectedId && state.runs.length) selectedId = state.runs[0].id
          const id = selectedId
          const value = id ? await api('/api/runs/' + id) : null
          if (disposed || requestRevision !== revision || id !== selectedId)
            return
          renderRecord(value)
          renderHistory(state)
          controls()
        } catch (error) {
          showError(error)
        } finally {
          refreshing = false
          if (!disposed && (activeId || requestRevision !== revision))
            timer = window.setTimeout(refresh, 500)
        }
      }
      async function start(flowIds, mode = 'verify', retryScenario) {
        if (
          !capability ||
          (mode !== 'candidate' && !compatible) ||
          acting ||
          activeId ||
          disposed
        )
          return
        acting = true
        controls()
        menu.hidden = true
        panel.open = true
        try {
          if (byId('proof-error')) byId('proof-error').hidden = true
          const request = {
            mode,
            scenario:
              mode === 'ci' || mode === 'candidate'
                ? 'baseline'
                : (retryScenario ?? byId('scenario').value)
          }
          if (flowIds) request.flowIds = flowIds
          const result = await api('/api/runs', request)
          selectedId = result.id
          revision++
          await refresh()
        } catch (error) {
          showError(error)
        } finally {
          acting = false
          if (!disposed) controls()
        }
      }
      function openMenu(event) {
        const card = event.target.closest('.step-card')
        const linked = linkedFlows.get(card?.dataset.stepId)
        if (!linked || !compatible) return
        event.preventDefault()
        menu.replaceChildren(node('strong', 'Verify linked flow'))
        for (const flow of linked) {
          const button = node('button', flow.title)
          button.type = 'button'
          button.disabled = !capability || Boolean(activeId) || acting
          button.addEventListener('click', () => {
            selectedFlow = flow
            byId('proof-flow').value = flow.id
            projectEvidence()
            start([flow.id])
          })
          menu.append(button)
        }
        menu.hidden = false
        const rect = card.getBoundingClientRect()
        const x = event.type === 'contextmenu' ? event.clientX : rect.left
        const y = event.type === 'contextmenu' ? event.clientY : rect.bottom
        menu.style.left =
          Math.max(8, Math.min(x, window.innerWidth - menu.offsetWidth - 8)) +
          'px'
        menu.style.top =
          Math.max(8, Math.min(y, window.innerHeight - menu.offsetHeight - 8)) +
          'px'
        menu.querySelector('button').focus()
      }

      try {
        const state = await api('/api/state')
        if (state.contract.targetId !== target.id) {
          const message = node(
            'p',
            'No verification contract for this Inspector. Architecture remains read-only.',
            'proof-unavailable'
          )
          message.id = 'proof-unavailable'
          detail.prepend(message)
          return
        }
        panel = node('details', undefined, 'proof-controls')
        panel.id = 'proof-controls'
        panel.innerHTML = `<summary>Flow verification <span id="overall" data-status="unknown">Unknown</span></summary>
        <div class="proof-body">
          <label>Evidence on canvas<select id="proof-flow"></select></label>
          <p id="proof-goal"></p><p>Selected flow: <strong id="flow-status">Unknown</strong></p>
          <p id="proof-step"></p>
          <label>Source scenario<select id="scenario"></select></label>
          <div class="proof-actions"><button id="run-linked" type="button">Verify linked flow</button><button id="run-all" type="button">Run all flows</button><button id="cancel" type="button" disabled>Cancel run</button><button id="refresh" type="button">Refresh results</button></div>
          <p id="run-state" role="status">Ready to verify</p>
          <p>Required checks: <strong id="checks">0 / 6</strong></p><p id="result-context"></p>
          <div id="proof-failures"></div>
          <details id="phase4-controls"><summary>Contract versions and CI</summary>
            <p id="contract-baseline"></p>
            <div class="proof-actions"><button id="run-candidate" type="button">Verify candidate</button><button id="run-ci" type="button">Run CI aggregate</button><button id="run-ci-demo" type="button">Demonstrate CI rejection</button><button id="retry-run" type="button">Retry selected run</button></div>
            <p>Local CI trial uses the accepted Git base. External required-check protection is reported separately.</p>
            <pre id="ci-result">No CI aggregate selected</pre><a id="ci-envelope-link" target="_blank" rel="noopener noreferrer" hidden>Open CI envelope</a>
            <label>Successor relation<select id="contract-relation-kind"><option value="none">No split or merge</option><option value="split">Split one obligation</option><option value="merge">Merge obligations</option></select></label><label>Previous obligation ids<input id="contract-predecessors" /></label><label>Successor obligation ids<input id="contract-successors" /></label>
            <button id="contract-prepare" type="button">Review candidate</button>
            <label>Contract review<select id="contract-review"></select></label><pre id="contract-diff"></pre>
            <label>Decision reason<input id="contract-reason" maxlength="1000" /></label>
            <label>Explicit retirement (removed obligation ids, comma-separated)<input id="contract-retirement" /></label>
            <div class="proof-actions"><button id="contract-accept" type="button">Accept version</button><button id="contract-reject" type="button">Reject version</button></div>
          </details>
          <details><summary>Shared baseline view</summary><label>Implementation step<select id="work-step"></select></label><label>Reported work status<select id="work-status"><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="complete">Complete</option><option value="blocked">Blocked</option></select></label><label>Work update reason<input id="work-reason" maxlength="1000" /></label><button id="work-save" type="button">Record work status</button><p>Work reports do not grant verification or delivery.</p><div id="manager-view"></div><a id="shared-link" href="/api/shared" target="_blank" rel="noopener noreferrer">Open read-only snapshot</a></details>
          <details><summary>Mapping review</summary>
            <p id="mapping-baseline"></p><p>Review test-name changes for existing obligations. Flow goals and required steps stay fixed.</p>
            <button id="mapping-prepare" type="button">Prepare mapping diff</button>
            <label>Retained review<select id="mapping-review"></select></label><div id="mapping-diff"></div>
            <label>Decision reason<input id="mapping-reason" maxlength="1000" autocomplete="off" /></label>
            <div class="proof-actions"><button id="mapping-accept" type="button" disabled>Accept mapping</button><button id="mapping-reject" type="button" disabled>Reject mapping</button></div>
          </details>
          <details><summary>Captured source and recent attempts</summary>
            <dl><dt>Source digest</dt><dd id="source-digest">No snapshot yet</dd><dt>Git HEAD</dt><dd id="source-head">-</dd><dt>Attempt</dt><dd id="attempt-id">-</dd><dt>Local artifacts</dt><dd id="artifacts">-</dd><dt>Mapping version</dt><dd id="mapping-version">-</dd><dt>Architecture version</dt><dd id="architecture-version">-</dd><dt>Runner configuration</dt><dd id="configuration-version">-</dd><dt>Runner environment</dt><dd id="runner-environment">-</dd></dl>
            <p><a id="report-link" target="_blank" rel="noopener noreferrer" hidden>Open test report</a> <a id="manifest-link" target="_blank" rel="noopener noreferrer" hidden>Open source manifest</a></p>
            <div id="history" aria-label="Recent attempts"></div>
          </details>
        </div>`
        const failureNotice = node('div', undefined, 'proof-run-failure')
        failureNotice.id = 'proof-run-failure'
        failureNotice.setAttribute('role', 'alert')
        failureNotice.hidden = true
        detail.prepend(failureNotice, panel)
        menu = node('div', undefined, 'proof-menu')
        menu.id = 'proof-menu'
        menu.hidden = true
        menu.setAttribute('role', 'group')
        menu.setAttribute('aria-label', 'Step verification actions')
        document.body.append(menu)
        setContract(state.contract)
        controls()
        observer = new MutationObserver(bindCards)
        observer.observe(graph, { childList: true })
        listen(graph, 'contextmenu', openMenu)
        listen(graph, 'keydown', (event) => {
          if (
            event.key === 'ContextMenu' ||
            (event.shiftKey && event.key === 'F10')
          )
            openMenu(event)
        })
        listen(document, 'keydown', (event) => {
          if (event.key === 'Escape') {
            menu.hidden = true
            graph.querySelector('.is-selected')?.focus()
          }
        })
        listen(document, 'click', (event) => {
          if (!menu.contains(event.target)) menu.hidden = true
        })
        listen(byId('proof-flow'), 'change', (event) => {
          selectedFlow = contract.flows.find(
            (flow) => flow.id === event.target.value
          )
          projectEvidence()
        })
        listen(byId('mapping-prepare'), 'click', () => mappingAction())
        listen(byId('mapping-accept'), 'click', () => mappingAction('accept'))
        listen(byId('mapping-reject'), 'click', () => mappingAction('reject'))
        listen(byId('mapping-reason'), 'input', controls)
        listen(byId('mapping-review'), 'change', (event) => {
          selectedReviewId = event.target.value
          renderMapping(mappingState)
          controls()
        })
        listen(byId('work-reason'), 'input', controls)
        listen(byId('work-save'), 'click', async () => {
          if (acting || activeId || !capability) return
          acting = true
          controls()
          try {
            await api('/api/work', {
              stepId: byId('work-step').value,
              status: byId('work-status').value,
              reason: byId('work-reason').value
            })
            revision++
            await refresh()
          } catch (error) {
            showError(error)
          } finally {
            acting = false
            if (!disposed) controls()
          }
        })
        listen(byId('run-candidate'), 'click', () =>
          start(undefined, 'candidate')
        )
        listen(byId('run-ci'), 'click', () => start(undefined, 'ci'))
        listen(byId('run-ci-demo'), 'click', () =>
          start(
            undefined,
            'ci-demo',
            byId('scenario').value === 'baseline'
              ? contract.defaultNegativeScenario
              : byId('scenario').value
          )
        )
        listen(byId('retry-run'), 'click', () =>
          start(record?.flowIds, record?.mode ?? 'verify', record?.scenario)
        )
        listen(byId('contract-prepare'), 'click', () => contractAction())
        listen(byId('contract-accept'), 'click', () => contractAction('accept'))
        listen(byId('contract-reject'), 'click', () => contractAction('reject'))
        listen(byId('contract-reason'), 'input', controls)
        listen(byId('contract-review'), 'change', (event) => {
          selectedContractReview = event.target.value
          renderOperations(operationState)
          controls()
        })
        listen(byId('run-all'), 'click', () => start())
        listen(byId('run-linked'), 'click', () => start([selectedFlow.id]))
        listen(byId('refresh'), 'click', refresh)
        listen(byId('cancel'), 'click', async () => {
          if (acting || !activeId) return
          acting = true
          controls()
          try {
            await api('/api/runs/' + activeId + '/cancel', {})
            await refresh()
          } catch (error) {
            showError(error)
          } finally {
            acting = false
            if (!disposed) controls()
          }
        })
        capability = (await api('/api/session')).capability
        await refresh()
      } catch (error) {
        showError(error)
      }
    },
    { once: true }
  )
})()
