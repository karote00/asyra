/* global window, document, fetch, URLSearchParams, setTimeout, structuredClone */
;(async () => {
  const selector = document.getElementById('flow-selector'),
    error = document.getElementById('file-error'),
    drafts = new Map()
  let snapshot = null,
    selectedFlow = null,
    selection = null,
    signature = null,
    loaded = false,
    busy = false,
    stopped = false
  const el = (tag, text) => {
    const node = document.createElement(tag)
    if (text !== undefined) {
      node.textContent = text
    }
    return node
  }
  const get = async (url) => {
    const response = await fetch(url)
    const value = await response.json()
    if (!response.ok) {
      throw new Error(value.error)
    }
    return value
  }
  const post = async (url, body) => {
    const session = await get('/api/session')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flow-capability': session.capability
      },
      body: JSON.stringify(body)
    })
    const value = await response.json()
    if (!response.ok) {
      throw new Error(value.error)
    }
    return value
  }
  const currentFlow = () =>
    snapshot?.evaluation.flows.find((f) => f.id === selectedFlow)
  function renderPanel() {
    if (!loaded || !snapshot) {
      return
    }
    const flow = currentFlow()
    if (!flow) {
      return
    }
    const selectedCard = document.querySelector('.step-card.is-selected')
    if (selection !== 'integration') {
      selection = selectedCard?.dataset.stepId ?? flow.nodes[0]?.id
    }
    const selected =
      selection === 'integration'
        ? flow.integration
        : flow.nodes.find((n) => n.id === selection)
    if (!selected) {
      return
    }
    const context = selected.context,
      container = document.querySelector('.detail-content')
    if (!container) {
      return
    }
    container.querySelector('.task-summary')?.remove()
    const full = container.querySelector('[data-full-contract]'),
      glance = container.querySelector('.detail-at-a-glance')
    if (full && glance && !full.contains(glance)) {
      full.append(glance)
    }
    if (full) {
      for (const item of [...container.children]) {
        if (item.matches('.detail-group,.detail-heading,.detail-summary')) {
          full.append(item)
        }
      }
    }
    const panel = el('section')
    panel.className = 'task-summary'
    panel.append(
      el(
        'h2',
        selection === 'integration' ? 'Feature acceptance' : selected.title
      ),
      el(
        'p',
        selected.status +
          ' - ' +
          selected.criteria.filter((c) => c.satisfied).length +
          '/' +
          selected.criteria.length +
          ' criteria accepted'
      )
    )
    const blocker =
      context.errors.find((e) => ['failed', 'rejected'].includes(e.status))
        ?.summary ??
      context.blockers[0] ??
      context.warnings[0]?.summary ??
      context.errors[0]?.summary
    if (blocker) {
      panel.append(el('p', blocker))
    }
    const status = el('p')
    status.setAttribute('role', 'alert')
    const actions = el('div')
    actions.className = 'task-actions'
    const act = (label, handler) => {
      const button = el('button', label)
      button.type = 'button'
      button.disabled = busy || document.body.dataset.invalid === 'true'
      button.onclick = async () => {
        if (busy) {
          return
        }
        busy = true
        button.disabled = true
        try {
          await handler()
          await refresh()
        } catch (e) {
          status.textContent = e.message
        } finally {
          busy = false
          document
            .querySelectorAll('.task-actions button')
            .forEach((current) => {
              current.disabled = document.body.dataset.invalid === 'true'
            })
        }
      }
      actions.append(button)
      return button
    }
    const commands = context.actions.filter((a) => a.kind === 'command')
    if (commands.length) {
      const choose = el('select')
      choose.setAttribute('aria-label', 'Rerun scope')
      commands.forEach((a) => {
        const o = el('option', a.label)
        o.value = a.id
        choose.append(o)
      })
      actions.append(choose)
      act('Rerun', async () => {
        const preview = await post('/api/preview', {
          flowId: selectedFlow,
          nodeId: selection,
          actionId: choose.value
        })
        panel.querySelector('[data-preview]')?.remove()
        const box = el('section')
        box.dataset.preview = ''
        box.append(el('pre', preview.argv.join(' ')))
        const confirm = el('button', 'Confirm rerun')
        confirm.onclick = async () => {
          confirm.disabled = true
          try {
            const result = await post('/api/rerun', {
              ...preview,
              confirm: true
            })
            status.textContent = result.coverageComplete
              ? 'Results updated'
              : 'Command finished without complete current results'
            await refresh()
          } catch (e) {
            status.textContent = e.message
          } finally {
            confirm.disabled = false
          }
        }
        box.append(confirm)
        panel.append(box)
      })
    }
    for (const action of context.actions.filter((a) => a.kind === 'external')) {
      panel.append(el('p', action.label + ': ' + action.instructions))
    }
    const reason = el('textarea')
    reason.setAttribute('aria-label', 'Acceptance reason or note')
    const draftKey = selectedFlow + '/' + selection
    reason.value = drafts.get(draftKey) ?? ''
    reason.oninput = () => drafts.set(draftKey, reason.value)
    for (const criterion of selected.criteria.filter(
      (c) => c.kind === 'manual'
    )) {
      const decide = async (statusValue) => {
        if (!reason.value.trim()) {
          throw new Error('Explain the decision before submitting')
        }
        await post('/api/update', {
          flowId: selectedFlow,
          request: {
            expectedRevision: context.revision,
            kind: 'observation',
            value: {
              nodeId: selection,
              criterionId: criterion.id,
              kind: 'manual',
              status: statusValue,
              binding: criterion.binding,
              actor: 'local-user',
              summary: reason.value,
              at: new Date().toISOString()
            }
          }
        })
      }
      act('Accept - ' + criterion.title, () => decide('accepted'))
      act('Reopen - ' + criterion.title, () => decide('reopened'))
    }
    const summary = el('a', 'Compact Agent context')
    summary.href =
      '/api/context?' +
      new URLSearchParams({ flow: selectedFlow, node: selection })
    summary.target = '_blank'
    summary.rel = 'noopener noreferrer'
    panel.append(actions, status, summary)
    for (const [label, refs] of [
      ['Specification', context.specRefs],
      ['Implementation', context.implementationRefs]
    ]) {
      if (refs.length) {
        panel.append(el('p', label + ': ' + refs.join(', ')))
      }
    }
    panel.append(el('h3', 'Notes and decisions'), reason)
    const noteActions = el('div')
    noteActions.className = 'task-actions'
    const save = el('button', 'Save note')
    save.onclick = async () => {
      try {
        if (!reason.value.trim()) {
          throw new Error('Enter a note')
        }
        await post('/api/update', {
          flowId: selectedFlow,
          request: {
            expectedRevision: context.revision,
            kind: 'note',
            value: {
              id: window.crypto.randomUUID(),
              nodeId: selection,
              actor: 'local-user',
              text: reason.value
            }
          }
        })
        drafts.delete(draftKey)
        await refresh()
      } catch (e) {
        status.textContent = e.message
      }
    }
    noteActions.append(save)
    panel.append(noteActions)
    for (const note of context.notes) {
      const item = el('div'),
        input = el('textarea')
      const noteKey = draftKey + '/note/' + note.id
      input.value = drafts.get(noteKey) ?? note.text
      input.oninput = () => drafts.set(noteKey, input.value)
      input.setAttribute('aria-label', 'Edit note')
      item.append(input)
      for (const [label, kind] of [
        ['Update', 'note'],
        ['Delete', 'note-delete']
      ]) {
        const button = el('button', label)
        button.onclick = async () => {
          try {
            await post('/api/update', {
              flowId: selectedFlow,
              request: {
                expectedRevision: context.revision,
                kind,
                id: note.id,
                value: { ...note, text: input.value }
              }
            })
            await refresh()
          } catch (e) {
            status.textContent = e.message
          }
        }
        item.append(button)
      }
      panel.append(item)
    }
    const details = el('details')
    details.append(
      el('summary', 'Full context'),
      el(
        'pre',
        JSON.stringify({ context, evidence: selected.criteria }, null, 2)
      )
    )
    panel.append(details)
    container.prepend(panel)
    document.querySelectorAll('.step-card').forEach((card) => {
      const n = flow.nodes.find((n) => n.id === card.dataset.stepId)
      card.dataset.status = n?.status ?? 'unavailable'
      card.setAttribute(
        'aria-label',
        (n?.title ?? 'Task') + ' - ' + (n?.status ?? 'unavailable')
      )
    })
  }
  window.addEventListener('flow-inspector:render', renderPanel)
  document.getElementById('flow').addEventListener('click', (event) => {
    if (event.target.closest('.step-card')) {
      selection = null
      renderPanel()
    }
  })
  selector.onchange = () => {
    selectedFlow = selector.value
    selection = null
    signature = null
    refresh()
  }
  document.getElementById('integration-action').onclick = () => {
    selection = 'integration'
    renderPanel()
  }
  async function refresh() {
    try {
      const next = await get('/api/flows')
      const nextSignature = JSON.stringify(next)
      document.body.dataset.invalid = 'false'
      error.textContent = ''
      if (signature === nextSignature) {
        return
      }
      signature = nextSignature
      snapshot = next
      if (!next.evaluation.flows.some((f) => f.id === selectedFlow)) {
        selectedFlow = next.evaluation.flows[0]?.id
      }
      selector.replaceChildren(
        ...next.evaluation.flows.map((f) => {
          const option = el('option', f.title)
          option.value = f.id
          return option
        })
      )
      selector.value = selectedFlow
      const flow = currentFlow()
      document.getElementById('feature-status').textContent =
        'Feature - ' + flow.status
      if (!loaded) {
        globalThis.FLOW_INSPECTOR_DATA = structuredClone(
          next.views[selectedFlow]
        )
        await new Promise((resolve, reject) => {
          const script = el('script')
          script.src = '/viewer.js'
          script.onload = resolve
          script.onerror = reject
          document.body.append(script)
        })
        loaded = true
        renderPanel()
      } else {
        globalThis.FLOW_INSPECTOR_VIEW.update(
          structuredClone(next.views[selectedFlow])
        )
      }
    } catch (e) {
      signature = null
      document.body.dataset.invalid = 'true'
      error.textContent = e.message
      document.getElementById('feature-status').textContent =
        'Feature - unavailable'
      document.querySelectorAll('.task-summary button').forEach((button) => {
        button.disabled = true
      })
    }
  }
  window.addEventListener('pagehide', () => {
    stopped = true
  })
  async function poll() {
    await refresh()
    if (!stopped) {
      setTimeout(poll, 1000)
    }
  }
  await poll()
})()
