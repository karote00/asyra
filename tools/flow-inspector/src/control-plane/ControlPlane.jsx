import { useEffect, useRef, useState } from 'react'
import { ArchitectureView } from '../architecture/ArchitectureView'
import { ContractOperations } from './ContractOperations'
import { TaskReview } from './TaskReview'
import { TargetPanel } from './TargetPanel'
import { Localization } from './Localization'
import {
  ExternalLink,
  Field,
  Json,
  RemoteProvider,
  request,
  useRemote
} from './shared'

function hasActiveWork(state) {
  return Boolean(state.activeRunId || state.tasks?.activeId)
}

function hasActiveAssessment(records) {
  return records.some((item) => item.phase === 'running')
}

function evidenceContext(record) {
  if (!record) {
    return 'No verified snapshot selected. Results cover only declared obligations, not task completion or deployment.'
  }

  if (record.mode === 'candidate') {
    return 'Candidate proof - acceptance requires an explicit version decision; current cards remain unverified.'
  }

  if (!record.matchesCurrentContract) {
    return 'Historical contract differs. Current cards remain unverified; original evidence stays in its artifacts.'
  }

  if (record.scenario !== 'baseline') {
    return 'NEGATIVE DEMONSTRATION - Only the captured demonstration is shown.'
  }

  return 'Captured source evidence - limited to the selected flow obligations.'
}

export function ControlPlane(props) {
  return (
    <RemoteProvider>
      <ControlPlaneView {...props} />
    </RemoteProvider>
  )
}

function ControlPlaneView({
  entry,
  data,
  detailsVisible,
  headerVisible,
  onCloseDetails,
  onShowDetails
}) {
  const [revision, setRevision] = useState(0)
  const [selectedStep, setSelectedStep] = useState(data.steps[0]?.id)
  const [flowId, setFlowId] = useState('')
  const [runId, setRunId] = useState('')
  const [scenario, setScenario] = useState('baseline')
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [preparedWork, setPreparedWork] = useState(null)
  const [targetReviewId, setTargetReviewId] = useState(null)
  const [observationSteps, setObservationSteps] = useState([])
  const [focusRequest, setFocusRequest] = useState(undefined)
  const [menu, setMenu] = useState(null)
  const failureSeen = useRef('')
  const [proofOpen, setProofOpen] = useState(false)
  const busy = useRef(false)
  const stateResult = useRemote('/api/state', revision, hasActiveWork)
  const state = stateResult.value
  const owned = state?.contract.targetId === entry.id
  const contractMatches =
    owned &&
    state.contract.flows.every((flow) =>
      flow.steps.every(
        (step) =>
          JSON.stringify(step) ===
          JSON.stringify(entry.data.steps.find((item) => item.id === step.id))
      )
    )
  const flow =
    state?.contract.flows.find((item) => item.id === flowId) ??
    state?.contract.flows[0]
  const selectedRun = runId || state?.runs[0]?.id
  const recordResult = useRemote(
    owned && selectedRun ? '/api/runs/' + selectedRun : null,
    revision,
    Boolean(state?.activeRunId),
    JSON.stringify({
      revision,
      summary: state?.runs.find((item) => item.id === selectedRun)
    })
  )
  const assessments = useRemote(
    owned ? '/api/target-assessments' : null,
    revision,
    hasActiveAssessment,
    revision,
    true
  )
  const record = recordResult.value
  const evidence =
    contractMatches && record?.matchesCurrentContract ? record.evidence : null
  const cases = (evidence?.cases ?? []).filter(
    (item) => item.flowId === flow?.id
  )
  const statuses = Object.fromEntries(
    (flow?.steps ?? []).map((step) => {
      const item = cases.find((item) => item.stepId === step.id)

      return [
        step.id,
        item && (!evidence.issues.length || item.status === 'failed')
          ? item.status
          : 'unknown'
      ]
    })
  )
  const disabled =
    !contractMatches ||
    acting ||
    Boolean(state?.activeRunId) ||
    Boolean(stateResult.error)
  const linked =
    state?.contract.flows.filter((item) =>
      item.steps.some((step) => step.id === selectedStep)
    ) ?? []
  const selectedCase = cases.find((item) => item.stepId === selectedStep)

  useEffect(() => {
    const failed =
      evidence?.cases.filter((item) => item.status === 'failed') ?? []
    const identity = record?.id + ':' + record?.phase

    if (failed.length && failureSeen.current !== identity) {
      failureSeen.current = identity
      setFlowId(failed[0].flowId)
      setSelectedStep(failed[0].stepId)
      setFocusRequest({
        id: identity,
        stepIds: failed.map((item) => item.stepId),
        padding: 24
      })
    }
  }, [record, evidence])

  useEffect(() => {
    if (!menu) {
      return
    }

    const close = () => setMenu(null)
    const escape = (event) => {
      if (event.key === 'Escape') {
        close()
        menu.trigger.focus()
      }
    }

    window.addEventListener('click', close)
    window.addEventListener('keydown', escape)

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', escape)
    }
  }, [menu])

  async function act(route, body, onError) {
    if (busy.current) {
      return null
    }

    busy.current = true
    setActing(true)
    setError('')

    try {
      const value = await request(route, body)
      setRevision((current) => current + 1)

      return value
    } catch (failure) {
      setError(failure.message)
      onError?.(failure.message)

      return null
    } finally {
      busy.current = false
      setActing(false)
    }
  }

  async function run(flowIds, mode = 'verify', requestedScenario) {
    let selectedScenario = scenario

    if (['ci', 'candidate'].includes(mode)) {
      selectedScenario = 'baseline'
    } else if (mode === 'ci-demo' && scenario === 'baseline') {
      selectedScenario = state.contract.defaultNegativeScenario
    }

    selectedScenario = requestedScenario ?? selectedScenario
    const value = await act('/api/runs', {
      mode,
      scenario: selectedScenario,
      ...(flowIds ? { flowIds } : {})
    })

    if (value) {
      setRunId(value.id)
    }
  }

  function prepare(value) {
    setSelectedStep(value.work.stepId)
    setPreparedWork(value)
  }

  return (
    <>
      <ArchitectureView
        data={data}
        onCloseDetails={onCloseDetails}
        onShowDetails={onShowDetails}
        selectedStepId={selectedStep}
        onSelect={setSelectedStep}
        detailsVisible={detailsVisible}
        headerVisible={headerVisible}
        stepStatuses={owned ? statuses : undefined}
        observationSteps={observationSteps}
        focusRequest={focusRequest}
        onStepMenu={(stepId, event) => {
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          setSelectedStep(stepId)
          setMenu({
            stepId,
            trigger: event.currentTarget,
            x: event.clientX ?? rect.left,
            y: event.clientY ?? rect.top
          })
        }}
        foldContract
        renderTask={() => (
          <>
            <div
              id="proof-run-failure"
              className="proof-run-failure"
              hidden={!evidence?.cases.some((item) => item.status === 'failed')}
            >
              <strong>
                {evidence?.cases.filter((item) => item.status === 'failed')
                  .length ?? 0}{' '}
                failed obligations
              </strong>
              {evidence?.cases
                .filter((item) => item.status === 'failed')
                .map((item) => (
                  <div key={item.id}>
                    <p>
                      {
                        state.contract.flows.find(
                          (flow) => flow.id === item.flowId
                        )?.title
                      }
                    </p>
                    <button
                      onClick={() => {
                        setFlowId(item.flowId)
                        setSelectedStep(item.stepId)
                        setFocusRequest({
                          id: crypto.randomUUID(),
                          stepIds: [item.stepId],
                          padding: 24
                        })
                        setProofOpen(true)
                      }}
                    >
                      Show{' '}
                      {
                        data.steps.find((step) => step.id === item.stepId)
                          ?.title
                      }
                    </button>
                  </div>
                ))}
            </div>
            <Localization
              entry={entry}
              onSelect={setSelectedStep}
              onHighlight={setObservationSteps}
            />
            {(error || stateResult.error || recordResult.error) && (
              <p id="proof-error" role="alert">
                {error || stateResult.error || recordResult.error}
              </p>
            )}
            {owned && !contractMatches && (
              <p
                id={
                  error || stateResult.error || recordResult.error
                    ? undefined
                    : 'proof-error'
                }
                role="alert"
              >
                The canvas step contracts differ from the verification contract.
                Regenerate the workspace and reload before running work.
              </p>
            )}
            {state && !owned && (
              <p id="proof-unavailable">
                No verification contract is configured for this target.
                Architecture remains read-only.
              </p>
            )}
            {owned && (
              <details
                open={proofOpen}
                onToggle={(event) => setProofOpen(event.currentTarget.open)}
                id="proof-controls"
                className="proof-controls"
              >
                <summary>Flow verification</summary>
                <div className="proof-body">
                  <Field
                    id="proof-flow"
                    label="Evidence on canvas"
                    fields={{ 'proof-flow': flow?.id ?? '' }}
                    setField={(_, value) => setFlowId(value)}
                    options={state.contract.flows.map((item) => [
                      item.id,
                      item.title
                    ])}
                  />
                  <p id="proof-goal">{flow?.goal}</p>
                  <p>
                    Selected flow:{' '}
                    <strong
                      id="flow-status"
                      data-status={
                        evidence?.flows.find((item) => item.id === flow?.id)
                          ?.status ?? 'unknown'
                      }
                    >
                      {evidence?.flows.find((item) => item.id === flow?.id)
                        ?.status ?? 'unknown'}
                    </strong>
                  </p>
                  <p id="proof-step">
                    {linked.length} linked flows for this step.
                  </p>
                  <Field
                    id="scenario"
                    label="Source scenario"
                    fields={{ scenario }}
                    setField={(_, value) => setScenario(value)}
                    options={state.contract.scenarios.map((item) => [
                      item.id,
                      item.title
                    ])}
                  />
                  <div className="proof-actions">
                    <button
                      id="run-linked"
                      disabled={
                        disabled || !linked.some((item) => item.id === flow?.id)
                      }
                      onClick={() => run([flow.id])}
                    >
                      Verify linked flow
                    </button>
                    <button
                      id="run-all"
                      disabled={disabled}
                      onClick={() => run()}
                    >
                      Run all flows
                    </button>
                    <button
                      id="cancel"
                      disabled={!state.activeRunId || acting}
                      onClick={() =>
                        act(`/api/runs/${state.activeRunId}/cancel`, {})
                      }
                    >
                      Cancel run
                    </button>
                    <button
                      id="refresh"
                      onClick={() => setRevision((current) => current + 1)}
                    >
                      Refresh results
                    </button>
                  </div>
                  <p id="run-state" role="status">
                    {state.activeRunId
                      ? 'Verification running'
                      : 'Ready to verify'}
                  </p>
                  <strong
                    id="overall"
                    data-status={evidence?.status ?? 'unknown'}
                  >
                    {evidence?.status ?? 'unknown'}
                  </strong>
                  <p>
                    Required checks:{' '}
                    <strong id="checks">
                      {evidence?.passedCount ?? 0} /{' '}
                      {evidence?.expectedCount ?? state.contract.cases.length}
                    </strong>
                  </p>
                  <p id="result-context">
                    {evidenceContext(record)} {evidence?.issues.join(' ')}{' '}
                    {record?.error}
                  </p>
                  <div id="proof-failures">
                    {selectedCase?.status === 'failed' && (
                      <>
                        <strong>{selectedCase.id} - failed</strong>
                        <Json value={selectedCase.failures.join('\n')} />
                      </>
                    )}
                  </div>
                  <TargetPanel
                    state={state}
                    assessments={assessments.value ?? []}
                    assessmentError={assessments.error}
                    selectedRun={selectedRun}
                    act={act}
                    disabled={disabled}
                    revision={revision}
                    onPrepare={prepare}
                    onTargetReview={setTargetReviewId}
                  />
                  <TaskReview
                    state={state}
                    selectedStep={selectedStep}
                    act={act}
                    disabled={disabled}
                    revision={revision}
                    preparedWork={preparedWork}
                    onPreparedConsumed={() => setPreparedWork(null)}
                    assessments={assessments.value ?? []}
                  />
                  <ContractOperations
                    state={state}
                    record={record}
                    run={run}
                    act={act}
                    disabled={disabled}
                    targetReviewId={targetReviewId}
                  />
                  <div id="history" aria-label="Run history">
                    {state.runs.map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={item.id === selectedRun}
                        onClick={() => setRunId(item.id)}
                      >
                        {item.scenario === 'baseline'
                          ? 'Current source'
                          : 'Regression demo'}{' '}
                        - {item.status}
                      </button>
                    ))}
                  </div>
                  <details>
                    <summary>Captured source and recent attempts</summary>
                    {Object.entries({
                      'source-digest': record?.snapshot?.digest,
                      'source-head': record?.snapshot?.head,
                      'attempt-id': record?.id,
                      artifacts: record?.artifactDirectory,
                      'mapping-version': record?.snapshot?.mappingVersion,
                      'architecture-version':
                        record?.snapshot?.architectureVersion,
                      'configuration-version':
                        record?.snapshot?.configurationDigest,
                      'runner-environment':
                        record?.runner?.environment &&
                        `${record.runner.environment.node} - ${record.runner.environment.platform} - ${record.runner.environment.architecture} - Vitest ${record.runner.environment.vitest}`
                    }).map(([id, value]) => (
                      <div key={id}>
                        <strong>{id}</strong>
                        <Json id={id} value={value} />
                      </div>
                    ))}
                    <ExternalLink
                      id="report-link"
                      href={
                        record?.runner?.reportDigest &&
                        `/api/runs/${record.id}/artifacts/report`
                      }
                    >
                      Open captured report
                    </ExternalLink>
                    <ExternalLink
                      id="manifest-link"
                      href={
                        record?.snapshot &&
                        `/api/runs/${record.id}/artifacts/source-manifest`
                      }
                    >
                      Open source manifest
                    </ExternalLink>
                  </details>
                </div>
              </details>
            )}
          </>
        )}
      />
      {menu && (
        <div
          id="proof-menu"
          role="menu"
          className="proof-menu"
          style={{ position: 'fixed', left: menu.x, top: menu.y }}
        >
          {state?.contract.flows
            .filter((item) =>
              item.steps.some((step) => step.id === menu.stepId)
            )
            .map((item) => (
              <button
                role="menuitem"
                key={item.id}
                disabled={disabled}
                onClick={() => {
                  setFlowId(item.id)
                  void run([item.id])
                  setMenu(null)
                }}
              >
                {item.title}
              </button>
            ))}
        </div>
      )}
    </>
  )
}
