import { useRef, useState } from 'react'
import type { ActionPreview, Criterion, Note, TaskNode } from './types'
import { writeJson } from './api'

interface TaskPanelProps {
  flowId: string
  nodeId: string
  node: TaskNode
  disabled: boolean
  drafts: Record<string, string>
  setDraft: (key: string, value: string | undefined) => void
  refresh: () => void
}

export function TaskPanel({
  flowId,
  nodeId,
  node,
  disabled,
  drafts,
  setDraft,
  refresh
}: TaskPanelProps) {
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [running, setRunning] = useState(false)
  const [commandId, setCommandId] = useState('')
  const [preview, setPreview] = useState<{
    value: ActionPreview
    revision: number
  } | null>(null)
  const { context } = node
  const draftKey = `${flowId}/${nodeId}`
  const reason = drafts[draftKey] ?? ''
  const commands = context.actions.filter((action) => action.kind === 'command')
  const actionId = commands.some((action) => action.id === commandId)
    ? commandId
    : commands[0]?.id
  const blocker =
    context.errors.find((error) =>
      ['failed', 'rejected'].includes(error.status)
    )?.summary ??
    context.blockers[0] ??
    context.warnings[0]?.summary ??
    context.errors[0]?.summary

  async function act(operation: () => Promise<void>) {
    if (disabled || busyRef.current) {
      return
    }

    busyRef.current = true
    setBusy(true)
    setNotice('')

    try {
      await operation()
      refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function update(request: Record<string, unknown>) {
    await writeJson('/api/update', {
      flowId,
      request: { expectedRevision: context.revision, ...request }
    })
  }

  async function decide(criterion: Criterion, status: string) {
    if (!reason.trim()) {
      throw new Error('Explain the decision before submitting')
    }

    await update({
      kind: 'observation',
      value: {
        nodeId,
        criterionId: criterion.id,
        kind: 'manual',
        status,
        binding: criterion.binding,
        actor: 'local-user',
        summary: reason,
        at: new Date().toISOString()
      }
    })
  }

  async function saveNote() {
    if (!reason.trim()) {
      throw new Error('Enter a note')
    }

    await update({
      kind: 'note',
      value: {
        id: crypto.randomUUID(),
        nodeId,
        actor: 'local-user',
        text: reason
      }
    })
    setDraft(draftKey, undefined)
  }

  async function reviseNote(note: Note, kind: string) {
    const key = `${draftKey}/note/${note.id}`
    await update({
      kind,
      id: note.id,
      value: { ...note, text: drafts[key] ?? note.text }
    })
    setDraft(key, undefined)
  }

  return (
    <section className="task-summary">
      <h2>
        {nodeId === 'integration' ? 'Feature acceptance' : 'Task actions'}
      </h2>
      <p>
        {node.status} -{' '}
        {node.criteria.filter((criterion) => criterion.satisfied).length}/
        {node.criteria.length} criteria accepted
      </p>
      {blocker && <p>{blocker}</p>}
      <div className="task-actions">
        {commands.length > 0 && (
          <>
            <select
              aria-label="Rerun scope"
              value={actionId}
              disabled={disabled || busy}
              onChange={(event) => {
                setCommandId(event.target.value)
                setPreview(null)
              }}
            >
              {commands.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() =>
                void act(async () => {
                  const value = await writeJson<ActionPreview>('/api/preview', {
                    flowId,
                    nodeId,
                    actionId
                  })
                  setPreview({ value, revision: context.revision })
                })
              }
            >
              Rerun
            </button>
          </>
        )}
        {node.criteria
          .filter((criterion) => criterion.kind === 'manual')
          .map((criterion) => (
            <span key={criterion.id}>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => void act(() => decide(criterion, 'accepted'))}
              >
                Accept - {criterion.title}
              </button>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => void act(() => decide(criterion, 'reopened'))}
              >
                Reopen - {criterion.title}
              </button>
            </span>
          ))}
      </div>
      {preview && (
        <section data-preview>
          <pre>{preview.value.argv.join(' ')}</pre>
          <button
            type="button"
            disabled={disabled || busy || preview.revision !== context.revision}
            onClick={() =>
              void act(async () => {
                setRunning(true)

                try {
                  const result = await writeJson<{ coverageComplete: boolean }>(
                    '/api/rerun',
                    { ...preview.value, confirm: true }
                  )
                  setNotice(
                    result.coverageComplete
                      ? 'Results updated'
                      : 'Command finished without complete current results'
                  )
                  setPreview(null)
                } finally {
                  setRunning(false)
                }
              })
            }
          >
            Confirm rerun
          </button>
          {preview.revision !== context.revision && (
            <p>The source changed. Request a new preview.</p>
          )}
        </section>
      )}
      {running && (
        <button
          type="button"
          onClick={() => {
            void writeJson('/api/cancel', {}).catch((error: unknown) =>
              setNotice(String(error))
            )
          }}
        >
          Cancel rerun
        </button>
      )}
      <p role="alert">{notice}</p>
      {context.actions
        .filter((action) => action.kind === 'external')
        .map((action) => (
          <p key={action.id}>
            {action.label}: {action.instructions}
          </p>
        ))}
      <a
        href={
          '/api/context?' + new URLSearchParams({ flow: flowId, node: nodeId })
        }
        target="_blank"
        rel="noopener noreferrer"
      >
        Compact Agent context
      </a>
      {context.specRefs.length > 0 && (
        <p>Specification: {context.specRefs.join(', ')}</p>
      )}
      {context.implementationRefs.length > 0 && (
        <p>Implementation: {context.implementationRefs.join(', ')}</p>
      )}
      <h3>Notes and decisions</h3>
      <textarea
        aria-label="Acceptance reason or note"
        value={reason}
        onChange={(event) => setDraft(draftKey, event.target.value)}
      />
      <div className="task-actions">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void act(saveNote)}
        >
          Save note
        </button>
      </div>
      {context.notes.map((note) => (
        <div key={note.id}>
          <textarea
            aria-label="Edit note"
            value={drafts[`${draftKey}/note/${note.id}`] ?? note.text}
            onChange={(event) =>
              setDraft(`${draftKey}/note/${note.id}`, event.target.value)
            }
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void act(() => reviseNote(note, 'note'))}
          >
            Update
          </button>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void act(() => reviseNote(note, 'note-delete'))}
          >
            Delete
          </button>
        </div>
      ))}
      <details>
        <summary>Full context</summary>
        <pre>
          {JSON.stringify({ context, evidence: node.criteria }, null, 2)}
        </pre>
      </details>
    </section>
  )
}
