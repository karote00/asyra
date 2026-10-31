import { useEffect, useState } from 'react'
import { ArchitectureView } from '../architecture/ArchitectureView'
import { TaskPanel } from './TaskPanel'
import { readJson } from './api'
import type { FlowSnapshot } from './types'

export function FlowDashboard() {
  const [snapshot, setSnapshot] = useState<FlowSnapshot | null>(null)
  const [error, setError] = useState('')
  const [selectedFlow, setSelectedFlow] = useState('')
  const [selectedNode, setSelectedNode] = useState('')
  const [detailsVisible, setDetailsVisible] = useState(true)
  const [refreshRevision, setRefreshRevision] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const flow =
    snapshot?.evaluation.flows.find((item) => item.id === selectedFlow) ??
    snapshot?.evaluation.flows[0]
  const nodeId =
    selectedNode === 'integration'
      ? selectedNode
      : (flow?.nodes.find((item) => item.id === selectedNode)?.id ??
        flow?.nodes[0]?.id)
  const node =
    nodeId === 'integration'
      ? flow?.integration
      : flow?.nodes.find((item) => item.id === nodeId)

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      try {
        const next = await readJson<FlowSnapshot>(
          '/api/flows',
          controller.signal
        )

        if (!controller.signal.aborted) {
          setSnapshot(next)
          setError('')
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : String(failure))
        }
      } finally {
        if (!controller.signal.aborted) {
          timer = setTimeout(() => void poll(), 1000)
        }
      }
    }

    void poll()

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [refreshRevision])

  function setDraft(key: string, value: string | undefined) {
    setDrafts((current) => {
      const next = { ...current }

      if (value === undefined) {
        return Object.fromEntries(
          Object.entries(current).filter(([name]) => name !== key)
        )
      } else {
        next[key] = value
      }

      return next
    })
  }

  return (
    <div className="flow-dashboard" data-invalid={Boolean(error)}>
      <nav aria-label="Project flows">
        <label>
          Flow{' '}
          <select
            id="flow-selector"
            aria-label="Flow"
            value={flow?.id ?? ''}
            onChange={(event) => {
              setSelectedFlow(event.target.value)
              setSelectedNode('')
            }}
          >
            {snapshot?.evaluation.flows.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <strong id="feature-status">
          Feature - {error ? 'unavailable' : (flow?.status ?? 'loading')}
        </strong>
        <button
          type="button"
          id="integration-action"
          disabled={!flow}
          onClick={() => setSelectedNode('integration')}
        >
          Feature acceptance
        </button>
        <p id="file-error" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setDetailsVisible((current) => !current)}
        >
          {detailsVisible ? 'Hide details' : 'Show details'}
        </button>
      </nav>
      {flow && snapshot?.views[flow.id] && (
        <ArchitectureView
          key={flow.id}
          data={snapshot.views[flow.id]}
          detailsVisible={detailsVisible}
          onCloseDetails={() => setDetailsVisible(false)}
          onShowDetails={() => setDetailsVisible(true)}
          selectedStepId={nodeId}
          onSelect={setSelectedNode}
          stepStatuses={Object.fromEntries(
            flow.nodes.map((item) => [item.id, item.status])
          )}
          foldContract
          renderTask={() =>
            node &&
            nodeId && (
              <TaskPanel
                key={`${flow.id}/${nodeId}`}
                flowId={flow.id}
                nodeId={nodeId}
                node={node}
                disabled={Boolean(error)}
                drafts={drafts}
                setDraft={setDraft}
                refresh={() => setRefreshRevision((current) => current + 1)}
              />
            )
          }
        />
      )}
      {snapshot && !flow && <p>No flows are declared.</p>}
    </div>
  )
}
