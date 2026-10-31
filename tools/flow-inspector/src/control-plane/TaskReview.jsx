import { useEffect, useState } from 'react'
import { ExternalLink, Field, Json, splitList, useRemote } from './shared'

const defaults = {
  'agent-adapter': 'demonstration',
  'agent-objective': 'Review the selected owner under all retained obligations',
  'agent-files': 'packages/factory/src/data-transact.ts',
  'agent-scenario': 'repair',
  'agent-time': '60000',
  'agent-calls': '20'
}

function previewSummary(preview) {
  if (!preview) {
    return null
  }

  const work = preview.scopedWork
  const scope = work
    ? [
        'Scope: bounded work',
        `Assessment: ${work.assessmentId}`,
        `Work: ${work.workId} - ${work.work.status}`,
        `Original candidate verification: ${preview.candidateVerification}`,
        `Target integration: ${work.integration.status}`
      ]
    : ['Scope: full candidate']

  return [
    `Repository: ${preview.repository}`,
    `PR type: ${preview.draft === false ? 'ready for review' : 'draft - prepare a fresh preview'}`,
    `Base: ${preview.base} - ${preview.baseSha}`,
    `Branch: ${preview.branch}`,
    `Task: ${preview.taskId}`,
    `Attempt: ${preview.attemptId}`,
    ...scope,
    `Source baseline: ${preview.sourceHead}`,
    `All delivery files: ${(preview.deliveryFiles ?? preview.changes.map((change) => change.path)).join(', ')}`,
    `Title: ${preview.title}`,
    '',
    preview.body
  ].join('\n')
}

function metadataSummary(metadata) {
  if (!metadata) {
    return null
  }

  return [
    `Package: ${metadata.packageName}`,
    `Release type: ${metadata.releaseType}`,
    `Ownership: ${metadata.ownership.path}`,
    `Reason: ${metadata.reason}`,
    `Validation: ${metadata.validation.status} - ${metadata.validation.scope}`,
    `Path: ${metadata.path}`,
    `Digest: ${metadata.digest}`,
    '',
    metadata.content
  ].join('\n')
}

function taskSummary(task, unresolved) {
  if (!task) {
    return null
  }

  const last = task.attempts.at(-1)
  const failures =
    last?.verdict?.evidence?.cases
      .filter((item) => item.status === 'failed')
      .map((item) => item.id) ?? []
  const provider = task.task.provider
  const providerLines = provider
    ? [
        `Provider: ${provider.adapter} - ${provider.model}`,
        `Reserved adapter turns: ${task.providerRequests.length} - authorization maximum ${provider.maxRequests}`,
        `Provider-reported tokens: ${task.providerRequests.reduce((sum, request) => sum + (request.usage?.totalTokens ?? 0), 0)} (known observations only)`,
        `Remote turn outcomes: ${task.providerRequests.map((request) => request.state + (request.usage ? '' : ' - usage unknown')).join(', ')}`,
        ...(task.providerRequests.some(
          (request) => request.state === 'reserved'
        )
          ? [
              'Provider turn pending; reservation retained while awaiting a terminal response.'
            ]
          : []),
        unresolved
          ? 'Reconciliation required. No further provider requests; local stop does not prove remote billing stopped.'
          : 'Local evidence retained; provider usage is not an independent meter.'
      ]
    : ['Adapter: deterministic demonstration - not real agent evidence']

  return [
    `Task: ${task.id}`,
    `Objective: ${task.task.objective}`,
    `Execution: ${task.phase}`,
    `Work: ${task.workStatus}`,
    `Verification: ${task.verificationStatus}`,
    `Delivery: ${task.deliveryStatus}`,
    `Allowed files: ${task.task.allowedFiles.join(', ')}`,
    `Forbidden: ${task.task.forbiddenActions.join(', ')}`,
    `Attempts: ${task.usage.attempts} / ${task.task.budgets.attempts}`,
    `Tool calls: ${task.usage.toolCalls} / ${task.task.budgets.toolCalls}`,
    `Elapsed: ${task.usage.elapsedMs} / ${task.task.budgets.elapsedMs} ms`,
    'Token usage: unknown - no hard token or cost enforcement',
    ...providerLines,
    `Baseline: ${task.snapshot.digest}`,
    `Candidate: ${last?.verdict?.sourceDigest ?? 'not verified'}`,
    `Changed files: ${task.changes.map((change) => change.path).join(', ')}`,
    `Confirmed failures: ${failures.join(', ') || 'none observed'}`,
    `Error: ${task.error ?? 'none'}`,
    'All six retained obligations required. Human review required; no baseline acceptance.'
  ].join('\n')
}

export function TaskReview({
  state,
  selectedStep,
  act,
  disabled,
  revision,
  preparedWork,
  onPreparedConsumed,
  assessments
}) {
  const [fields, setFields] = useState(defaults)
  const [selectedTasks, setSelectedTasks] = useState({})
  const selectedTask = selectedTasks[selectedStep] ?? ''
  const setSelectedTask = (id) =>
    setSelectedTasks((current) => ({ ...current, [selectedStep]: id }))
  const [approved, setApproved] = useState(false)
  const [reviewOverride, setReviewOverride] = useState(null)
  const setField = (id, value) =>
    setFields((current) => ({ ...current, [id]: value }))
  const tasks = state.tasks.records.filter(
    (item) => item.stepId === selectedStep
  )
  const taskId = selectedTask || tasks[0]?.id

  useEffect(() => {
    if (taskId && taskId !== selectedTask) {
      setSelectedTasks((current) => ({ ...current, [selectedStep]: taskId }))
    }
  }, [taskId, selectedTask, selectedStep])

  const taskResult = useRemote(
    taskId ? '/api/tasks/' + taskId : null,
    revision,
    false,
    JSON.stringify(state.tasks.records.find((item) => item.id === taskId))
  )
  const reviewResult = useRemote(
    taskId ? `/api/tasks/${taskId}/review` : null,
    revision
  )
  const task = taskResult.value
  const review =
    reviewOverride?.taskId === taskId ? reviewOverride : reviewResult.value
  const preview = review?.preview
  const attemptId = task?.attempts.at(-1)?.id
  const provider = state.tasks.providerAuthorization
  const providerAvailable = Boolean(
    provider && Date.parse(provider.expiresAt) > Date.now()
  )
  const unresolved = task?.providerRequests?.some(
    (item) =>
      item.state === 'unresolved' || (item.state === 'settled' && !item.usage)
  )
  const supported = state.contract.flows.some((flow) =>
    flow.steps.some((step) => step.id === selectedStep)
  )
  const currentAttempt = !preview || preview.attemptId === attemptId
  const scoped = assessments.filter(
    (item) =>
      item.request.sourceTaskId === taskId &&
      item.request.sourceAttemptId === attemptId
  )
  const scopedId = scoped.some((item) => item.id === fields['pr-assessment'])
    ? fields['pr-assessment']
    : ''
  const field = { fields, setField }
  let emptyTask =
    'No task selected. Demonstration adapter - no language model or paid provider.'

  if (fields['agent-adapter'] === 'provider' && providerAvailable) {
    emptyTask =
      'No task selected. Authorized provider selected; no model turn dispatched.'
  }

  if (!state.tasks.available) {
    emptyTask = 'OS containment unavailable. Delegation is disabled.'
  }

  useEffect(() => {
    if (preparedWork) {
      setFields((current) => ({
        ...current,
        'agent-objective': preparedWork.work.scope,
        'agent-files': preparedWork.work.allowedFiles.join(', ')
      }))
    }
  }, [preparedWork])

  async function taskAction(action) {
    let result

    if (action === 'start') {
      result = await act('/api/tasks', {
        requestId: preparedWork?.taskId ?? crypto.randomUUID(),
        ...(preparedWork ? { workBinding: preparedWork.binding } : {}),
        stepId: selectedStep,
        objective: fields['agent-objective'],
        allowedFiles: splitList(fields['agent-files']),
        adapter: fields['agent-adapter'],
        scenario:
          fields['agent-adapter'] === 'provider'
            ? 'task'
            : fields['agent-scenario'],
        ...(fields['agent-adapter'] === 'provider'
          ? { providerAuthorizationId: provider.id }
          : {}),
        contractDigest: state.contract.digest,
        revision: state.mapping.revision,
        budgets: {
          elapsedMs: Number(fields['agent-time']),
          toolCalls: Number(fields['agent-calls']),
          attempts: 3
        }
      })

      if (result) {
        setSelectedTask(result.id)
        onPreparedConsumed()
      }
    } else if (taskId) {
      await act(`/api/tasks/${taskId}/control`, {
        action,
        ...(action === 'resume'
          ? {
              scenario: task?.task.provider ? 'task' : fields['agent-scenario']
            }
          : {})
      })
    }
  }

  async function reviewAction(action) {
    const result = await act(
      `/api/tasks/${taskId}/review${action === 'prepare-scoped' ? '/scoped' : ''}`,
      action === 'prepare-scoped'
        ? { attemptId, assessmentId: scopedId }
        : {
            action,
            ...(action === 'confirm'
              ? { confirm: approved, previewDigest: review?.previewDigest }
              : {})
          }
    )

    if (result) {
      setReviewOverride(result)
    }

    setApproved(false)
  }

  return (
    <>
      <details id="agent-controls" open={preparedWork ? true : undefined}>
        <summary>Delegate selected step - local agent</summary>
        <p id="agent-work-binding">
          {preparedWork &&
            `Prepared work ${preparedWork.binding.workId} - task ${preparedWork.taskId}`}
        </p>
        <p id="agent-step">
          {supported
            ? `Selected owner: ${selectedStep}`
            : 'Select a supported owner card to delegate.'}
        </p>
        <p>Candidate changes remain isolated for human review.</p>
        <Field
          {...field}
          id="agent-adapter"
          label="Adapter"
          options={[
            [
              'demonstration',
              'Deterministic demonstration - no language model'
            ],
            ['provider', 'Authorized real provider', !providerAvailable]
          ]}
        />
        <p id="agent-provider-info">
          {providerAvailable
            ? `Authorized provider: ${provider.adapter} - ${provider.model} - ${provider.billing} - maximum ${provider.maxRequests} adapter turns. Internal network requests, cost and remote cancellation may remain unknown; tokens are provider-reported.`
            : 'No real provider authorized. Demonstration uses no language model or paid provider.'}
        </p>
        <Field
          {...field}
          id="agent-objective"
          label="Task objective"
          maxLength={2000}
        />
        <Field
          {...field}
          id="agent-files"
          label="Allowed runtime files (comma-separated)"
        />
        <Field
          {...field}
          id="agent-scenario"
          label="Demonstration scenario"
          disabled={fields['agent-adapter'] === 'provider'}
          options={[
            'repair',
            'regression',
            'scope-violation',
            'tool-limit',
            'stall'
          ].map((value) => [value, value])}
        />
        <Field
          {...field}
          id="agent-time"
          label="Cumulative elapsed limit (ms)"
          type="number"
        />
        <Field
          {...field}
          id="agent-calls"
          label="Cumulative tool-call limit"
          type="number"
        />
        <div className="proof-actions">
          <button
            id="agent-start"
            disabled={
              disabled ||
              !supported ||
              !state.tasks.available ||
              Boolean(state.tasks.activeId) ||
              (fields['agent-adapter'] === 'provider' && !providerAvailable)
            }
            onClick={() => taskAction('start')}
          >
            Delegate selected step
          </button>
          <button
            id="agent-resume"
            disabled={
              disabled ||
              !task ||
              Boolean(state.tasks.activeId) ||
              task.revoked ||
              unresolved
            }
            onClick={() => taskAction('resume')}
          >
            Resume selected task
          </button>
          {['cancel', 'stop', 'handoff', 'revoke'].map((action) => (
            <button
              key={action}
              id={'agent-' + action}
              disabled={
                disabled ||
                !task ||
                (action === 'cancel' && task.phase !== 'running')
              }
              onClick={() => taskAction(action)}
            >
              {
                {
                  cancel: 'Cancel task',
                  stop: 'Stop task',
                  handoff: 'Hand off to human',
                  revoke: 'Revoke task'
                }[action]
              }
            </button>
          ))}
        </div>
        <label>
          Retained step tasks
          <select
            id="agent-history"
            value={taskId ?? ''}
            onChange={(event) => {
              setSelectedTask(event.target.value)
              setReviewOverride(null)
              setApproved(false)
            }}
          >
            {tasks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.phase}
              </option>
            ))}
          </select>
        </label>
        <pre id="agent-recovery" role="alert" hidden={!unresolved}>
          Local task stopped - provider follow-up required. Local stop does not
          prove remote execution or billing stopped. Save the task audit and
          candidate diff. Check provider account usage and service status;
          contact support if activity cannot be explained. Never include
          credentials. Hand off to human for review. Do not delete records or
          create a new store to bypass this block. Restarting or waiting does
          not reconcile the request.
        </pre>
        <Json
          id="agent-result"
          role="status"
          value={taskSummary(task, unresolved)}
          empty={emptyTask}
        />
        <ExternalLink
          id="agent-artifact"
          href={taskId && `/api/tasks/${taskId}/changes`}
        >
          Review exact source changes
        </ExternalLink>
        <ExternalLink id="agent-audit" href={taskId && `/api/tasks/${taskId}`}>
          Open task evidence and audit
        </ExternalLink>
        {taskResult.error && <p role="alert">{taskResult.error}</p>}
      </details>
      <details id="pr-controls">
        <summary>Candidate GitHub PR review</summary>
        <p>
          Prepare an exact preview from the selected task. Confirm only after
          reviewing source, evidence and destination.
        </p>
        <Field
          {...field}
          id="pr-assessment"
          label="Bounded work assessment"
          options={[
            ['', 'Choose exact bounded work assessment'],
            ...scoped.map((item) => [
              item.id,
              `${item.id.slice(0, 12)} - ${item.phase} - integration ${item.result?.integration?.status ?? 'unavailable'}`
            ])
          ]}
        />
        <button
          id="pr-prepare-scoped"
          disabled={
            disabled ||
            !task ||
            !scopedId ||
            !state.reviewPolicy ||
            task.phase === 'running'
          }
          onClick={() => reviewAction('prepare-scoped')}
        >
          Prepare bounded work preview
        </button>
        <button
          id="pr-prepare"
          disabled={
            disabled || !task || !state.reviewPolicy || task.phase === 'running'
          }
          onClick={() => reviewAction('prepare')}
        >
          Prepare full candidate preview
        </button>
        <button
          id="pr-refresh"
          disabled={disabled || !review}
          onClick={() => reviewAction('refresh')}
        >
          Refresh GitHub review
        </button>
        <Json
          id="pr-result"
          role="status"
          value={[
            `Review scope: ${preview?.scopedWork ? 'bounded work' : 'full candidate'}`,
            ...(preview?.scopedWork
              ? [
                  `Original candidate verification: ${preview.candidateVerification}`,
                  `Target integration: ${preview.scopedWork.integration.status}`
                ]
              : []),
            `Local verification: ${currentAttempt ? (task?.verificationStatus ?? 'no candidate selected') : 'historical attempt - open retained evidence'}`,
            `Delivery: ${review?.state ?? 'not prepared'}`,
            `PR: ${review?.observation?.state ?? 'not observed'}`,
            `GitHub HEAD: ${review?.observation?.headSha ?? 'unknown'}`,
            `GitHub checks: ${review?.observation?.checks?.status ?? 'unknown'}`,
            `Checks HEAD: ${review?.observation?.checks?.headSha ?? 'none'}`,
            review?.observation?.stale
              ? 'Observation stale - refresh required; no current checks.'
              : 'Refresh explicitly to read GitHub state.',
            review?.observation?.matchesCandidate === false
              ? 'GitHub source is outside prepared candidate identity. Local evidence does not verify this HEAD.'
              : '',
            `Issue: ${review?.error ?? 'none'}`,
            'Review submission and checks never accept the local baseline.'
          ].join('\n')}
        />
        <Json
          id="pr-preview"
          value={previewSummary(preview)}
          empty="Select an existing step task, then prepare an exact delivery preview. No branch or PR is created by preparation."
        />
        <details>
          <summary>Review source difference</summary>
          <Json
            id="pr-source-diff"
            value={preview?.sourceDiff}
            empty="Prepare a candidate preview to inspect its exact difference."
          />
        </details>
        <h4>Trusted owner Changeset</h4>
        <Json
          id="pr-metadata"
          value={metadataSummary(preview?.metadata)}
          empty="No trusted Changeset in this record. Prepare a fresh complete preview before creation."
        />
        <ExternalLink
          id="pr-source"
          href={preview && `/api/tasks/${taskId}/review`}
        >
          Open frozen source diff and delivery audit
        </ExternalLink>
        <ExternalLink id="pr-evidence" href={taskId && `/api/tasks/${taskId}`}>
          Open local candidate evidence
        </ExternalLink>
        <ExternalLink id="pr-github" href={review?.observation?.url}>
          Open GitHub review
        </ExternalLink>
        <label>
          <input
            id="pr-approve"
            type="checkbox"
            checked={approved}
            disabled={
              !preview ||
              disabled ||
              !['preview', 'blocked'].includes(review?.state)
            }
            onChange={(event) => setApproved(event.target.checked)}
          />
          I reviewed the complete source, trusted Changeset and PR content and
          confirm creating this exact branch and ready-for-review PR.
        </label>
        <button
          id="pr-confirm"
          disabled={
            disabled ||
            !approved ||
            !preview ||
            preview.draft !== false ||
            !preview.metadata ||
            !currentAttempt ||
            !['preview', 'blocked'].includes(review?.state)
          }
          onClick={() => reviewAction('confirm')}
        >
          Create confirmed PR
        </button>
      </details>
    </>
  )
}
