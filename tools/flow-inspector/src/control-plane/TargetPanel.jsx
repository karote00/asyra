import { useEffect, useState } from 'react'
import {
  ExternalLink,
  Field,
  Json,
  request,
  splitList,
  useRemote
} from './shared'

function proofSummary(proof) {
  if (!proof) {
    return 'No assessment evidence'
  }

  return [
    proof.status,
    ...(proof.cases ?? []).map((item) =>
      [`${item.id} - ${item.status}`, ...item.blockers].join('\n')
    ),
    ...(proof.blockers ?? []),
    ...(proof.pending?.length
      ? [`Pending allocation: ${proof.pending.join(', ')}`]
      : [])
  ].join('\n')
}

function workProofSummary(assessment, target) {
  if (!assessment) {
    return 'No assessment evidence'
  }

  const commitments =
    target?.history.find(
      (entry) => entry.revision === assessment.request.allocationRevision
    )?.state.works ?? []

  return (
    assessment.projection.works
      .map((work) =>
        [
          `${commitments.find((item) => item.id === work.id)?.title ?? work.id} - ${work.status}`,
          `Work: ${work.id}`,
          `Own promise: ${proofSummary(work.own)}`,
          `Prerequisites: ${proofSummary(work.prerequisites)}`,
          ...work.prerequisites.routes.map(
            (route) => `${route.routeId} - ${proofSummary(route.proof)}`
          )
        ].join('\n')
      )
      .join('\n\n') || 'No assigned work - obligations remain pending.'
  )
}

function sourceIdentity(taskMode, task, attempt, run, attemptId, assessments) {
  const runtime = assessments.find(
    (item) =>
      item.request.sourceAttemptId === attemptId &&
      item.request.sourceTaskId === (taskMode ? task?.id : undefined)
  )?.runtime
  const snapshot = taskMode ? attempt?.verdict : run?.snapshot
  const lines = [
    `Source attempt: ${attemptId}`,
    `Repository: ${runtime?.repository ?? 'unavailable before assessment'}`,
    `HEAD: ${(taskMode ? task?.snapshot?.head : snapshot?.head) ?? 'unavailable'}`,
    `Runtime: ${snapshot?.runtimeSource?.digest ?? 'unavailable'}`,
    `Runtime authority: ${runtime?.runtimeAuthorityDigest ?? snapshot?.runtimeAuthority?.digest ?? 'unavailable'}`,
    `Contract scope: ${runtime?.contractScopeDigest ?? snapshot?.runtimeAuthority?.contractScopeDigest ?? 'unavailable'}`,
    `Full source: ${(taskMode ? snapshot?.sourceDigest : snapshot?.digest) ?? 'unavailable'}`
  ]

  if (taskMode) {
    lines.unshift(`Task: ${task.id}`)
    lines.push(`Attempt phase: ${attempt.phase}`)
    lines.push(
      `Verification: ${attempt.verdict?.evidence?.status ?? 'unavailable'}`
    )
    lines.push(
      `Verification identity: ${attempt.verdict?.verificationSource?.digest ?? 'unavailable'}`
    )
    lines.push(
      `Execution: ${attempt.verdict?.executionSource?.digest ?? 'unavailable'}`
    )
    lines.push('Source availability is checked by the service on start.')
  }

  return lines.join('\n')
}

function editableWork(work) {
  const commitment = Object.fromEntries(
    Object.entries(work).filter(
      ([key]) => !['taskIds', 'status', 'assessment'].includes(key)
    )
  )

  return {
    ...commitment,
    prerequisites: work.prerequisites.map(({ workId, handoff }) => ({
      workId,
      handoff
    }))
  }
}

export function TargetPanel({
  state,
  assessments,
  assessmentError,
  selectedRun,
  act,
  disabled,
  revision,
  onPrepare,
  onTargetReview
}) {
  const [fields, setFields] = useState({
    'target-reason': 'Define bounded work against this target',
    'target-work-files': 'packages/factory/src/data-transact.ts',
    'assessment-source-kind': 'run'
  })
  const [targetId, setTargetId] = useState('')
  const [draft, setDraft] = useState([])
  const [draftRevision, setDraftRevision] = useState(0)
  const [decisionId, setDecisionId] = useState(() => crypto.randomUUID())
  const [notice, setNotice] = useState('')
  const [assessmentNotice, setAssessmentNotice] = useState('')
  const [selectedObligations, setSelectedObligations] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [editorId, setEditorId] = useState('')
  const catalog = useRemote('/api/targets', revision).value?.catalog ?? []
  const targetResult = useRemote(
    targetId ? '/api/targets/' + targetId : null,
    revision,
    Boolean(state.tasks.activeId)
  )
  const target = targetResult.value
  function setField(id, value) {
    setFields((current) => ({ ...current, [id]: value }))

    if (['target-work-step', 'target-flow', 'target-revision'].includes(id)) {
      setSelectedObligations([])
    }

    if (id === 'assessment-task' || id === 'assessment-source-kind') {
      setFields((current) => ({
        ...current,
        'assessment-attempt': ''
      }))
    }
  }
  const targetRevision =
    target?.targetRevision ??
    fields['target-revision'] ??
    catalog[0]?.revision ??
    ''
  const definition = catalog.find((item) => item.revision === targetRevision)
  const flowId =
    target?.flowId ?? fields['target-flow'] ?? definition?.flows[0]?.id ?? ''
  const flow = definition?.flows.find((item) => item.id === flowId)
  const stepId = fields['target-work-step'] ?? flow?.steps[0]?.id ?? ''
  const obligations =
    definition?.obligations.filter((item) => item.flowId === flowId) ?? []
  const assessment = assessments.find(
    (item) =>
      item.id === selectedAssessment && item.request.targetId === targetId
  )
  const accepted = state.evolution.decisions.find(
    (item) =>
      assessment && item.targetAcceptance?.assessmentId === assessment.id
  )
  const taskMode = fields['assessment-source-kind'] === 'task'
  const sourceTaskId = fields['assessment-task']
  const sourceTaskSummary = state.tasks.records.find(
    (item) => item.id === sourceTaskId
  )
  const missingSourceTask = taskMode && sourceTaskId && !sourceTaskSummary
  const sourceTaskResult = useRemote(
    taskMode && sourceTaskSummary ? '/api/tasks/' + sourceTaskId : null,
    revision,
    false,
    JSON.stringify(sourceTaskSummary)
  )
  const sourceTask = sourceTaskResult.value
  const sourceAttemptId = taskMode
    ? fields['assessment-attempt']
    : fields['assessment-source']
  const sourceRun = useRemote(
    !taskMode && sourceAttemptId ? '/api/runs/' + sourceAttemptId : null,
    revision
  ).value
  const sourceAttempt = sourceTask?.attempts.find(
    (item) => item.id === sourceAttemptId
  )
  const sourceReady = taskMode
    ? Boolean(
        !sourceTaskResult.error &&
        sourceAttempt &&
        state.tasks.records.some((item) => item.id === sourceTaskId)
      )
    : Boolean(sourceRun)
  const field = {
    fields: {
      ...fields,
      'target-revision': targetRevision,
      'target-flow': flowId,
      'target-work-step': stepId
    },
    setField
  }
  const pinnedReviews = state.evolution.reviews.filter(
    (item) => item.status === 'pending'
  )
  const currentAssessment =
    !assessmentError &&
    assessment?.phase === 'completed' &&
    assessment.request.allocationRevision === target?.revision &&
    assessment.projection.current

  function loadEditor(value) {
    setFields((current) => ({
      ...current,
      'target-objective': value?.objective ?? '',
      'target-review': ''
    }))
    setDraft((value?.works ?? []).map(editableWork))
    setDraftRevision(value?.revision ?? 0)
    setDecisionId(crypto.randomUUID())
    setEditorId(value?.id ?? '')
  }

  useEffect(() => {
    if (target && target.id !== editorId) {
      loadEditor(target)
    }
  }, [target, editorId])

  useEffect(() => {
    onTargetReview(target?.targetVerification?.reviewId)
  }, [target?.targetVerification?.reviewId, onTargetReview])

  async function targetAction(action) {
    const assigned = new Set(draft.flatMap((work) => work.obligationIds))
    const body = {
      action,
      requestId: decisionId,
      expectedRevision: draftRevision,
      reason: fields['target-reason']
    }

    if (action === 'create') {
      Object.assign(body, {
        ...(fields['target-review']
          ? { targetReviewId: fields['target-review'] }
          : {}),
        flowId,
        targetRevision,
        acceptedBaseline: {
          revision: state.mapping.revision,
          contractDigest: state.contract.digest
        }
      })
    } else {
      body.targetId = targetId
    }

    if (action === 'link') {
      Object.assign(body, {
        workId: fields['target-link-work'] || target?.works[0]?.id,
        taskId: fields['target-link-task'] || state.tasks.records[0]?.id
      })
    } else {
      Object.assign(body, {
        objective: fields['target-objective'],
        works: draft,
        pending: obligations
          .filter((item) => !assigned.has(item.id))
          .map((item) => item.id)
      })
    }

    const result = await act('/api/targets/decide', body, setNotice)

    if (result) {
      setTargetId(result.id)
      loadEditor(await request('/api/targets/' + result.id))
      setNotice(
        `Saved revision ${result.revision}. Earlier commitments and results remain in audit.`
      )
    }
  }

  function addWork() {
    if (
      !fields['target-work-title']?.trim() ||
      !fields['target-work-scope']?.trim() ||
      !selectedObligations.length
    ) {
      setNotice(
        'Provide a work title, exact scope and at least one obligation.'
      )

      return
    }

    setDraft((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: fields['target-work-title'],
        stepId,
        obligationIds: selectedObligations,
        scope: fields['target-work-scope'],
        allowedFiles: splitList(fields['target-work-files']),
        prerequisites: (fields['target-prerequisites'] ?? []).map((workId) => ({
          workId,
          handoff: fields['target-handoff'] ?? ''
        }))
      }
    ])
    setSelectedObligations([])
    setNotice(
      'Draft updated. Review pending obligations and save an explicit revision.'
    )
  }

  async function prepare(work) {
    if (!work.prerequisites.length && !selectedRun) {
      setNotice(
        'Select a completed all-flow baseline proof before preparing work.'
      )

      return
    }

    const taskId = crypto.randomUUID()
    const admissionId = crypto.randomUUID()
    const dependent = work.prerequisites.length > 0
    const result = await act('/api/targets/decide', {
      action: 'admit',
      targetId,
      expectedRevision: target.revision,
      requestId: admissionId,
      reason: dependent
        ? 'Prepare this saved work promise from assessed prerequisites'
        : 'Prepare this saved work promise against the selected baseline proof',
      workId: work.id,
      taskId,
      ...(dependent
        ? { assessmentId: selectedAssessment }
        : { sourceAttemptId: selectedRun })
    })

    if (result) {
      onPrepare({
        taskId,
        binding: { targetId, workId: work.id, admissionId },
        work
      })
    }
  }

  async function assess() {
    setAssessmentNotice('')
    const result = await act(
      '/api/target-assessments',
      {
        requestId: crypto.randomUUID(),
        targetId,
        allocationRevision: target.revision,
        sourceAttemptId,
        ...(taskMode ? { sourceTaskId } : {})
      },
      setAssessmentNotice
    )

    if (result) {
      setSelectedAssessment(result.id)
    }
  }

  return (
    <details id="target-controls">
      <summary>Flow targets and work decomposition</summary>
      <p>
        Plan bounded commitments for one flow. Candidate verification and PR
        state do not complete this target.
      </p>
      <label>
        Saved target
        <select
          id="target-select"
          value={targetId}
          onChange={(event) => {
            setTargetId(event.target.value)
            setSelectedAssessment('')
            if (!event.target.value) {
              loadEditor(null)
            }
          }}
        >
          <option value="">New target</option>
          {state.targets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.objective} - revision {item.revision}
            </option>
          ))}
        </select>
      </label>
      <Field
        {...field}
        id="target-revision"
        label="Target contract revision"
        disabled={Boolean(target)}
        options={catalog.map((item) => [item.revision, item.revision])}
      />
      <Field
        {...field}
        id="target-review"
        disabled={Boolean(target)}
        label="Reviewed verification source"
        options={[
          ['', 'No reviewed source - standalone target only'],
          ...pinnedReviews.map((item) => [item.id, item.id])
        ]}
      />
      <Json
        id="target-review-identity"
        value={pinnedReviews.find(
          (item) => item.id === fields['target-review']
        )}
      />
      <Field
        {...field}
        id="target-flow"
        label="Concrete flow"
        disabled={Boolean(target)}
        options={(definition?.flows ?? []).map((item) => [item.id, item.title])}
      />
      <Field
        {...field}
        id="target-objective"
        label="Development objective"
        maxLength={2000}
      />
      <button
        id="target-create"
        disabled={disabled || Boolean(target)}
        onClick={() => targetAction('create')}
      >
        Create flow target
      </button>
      <Json
        id="target-result"
        role="status"
        value={
          target &&
          `${target.objective}\nRevision ${target.revision} - Target pending\nAccepted baseline revision ${target.acceptedBaseline.revision}\n${target.acceptedBaseline.contractDigest}\n${target.limitation}${target.baselineCurrent ? '' : '\nAccepted baseline changed; task linking is blocked.'}`
        }
        empty="Choose a saved target or create one for this flow."
      />
      <p id="target-pending">
        Unassigned obligations - pending: {target?.pending.join(', ') || 'none'}
      </p>
      <Json
        id="target-pins"
        value={
          target &&
          [
            `Accepted mapping revision: ${target.acceptedBaseline.revision}`,
            `Accepted history version: ${target.acceptedVersion?.revision ?? 'unavailable'}`,
            `Target review: ${target.targetVerification?.reviewId ?? 'unavailable'}`,
            `Reviewed candidate: ${target.targetVerification?.candidateDigest ?? 'unavailable'}`,
            ...(!target.targetVerification || !target.acceptedVersion
              ? [
                  'Assessment unavailable - this saved target lacks immutable pins.'
                ]
              : [])
          ].join('\n')
        }
      />
      <section id="target-assessment" aria-label="Target source assessment">
        <h3>Assess one captured source</h3>
        <Field
          {...field}
          id="assessment-source-kind"
          label="Integration source kind"
          options={[
            ['run', 'Captured run'],
            ['task', 'Task candidate']
          ]}
        />
        <div id="assessment-run-field" hidden={taskMode}>
          <Field
            {...field}
            id="assessment-source"
            label="Integration source attempt"
            options={[
              ['', 'Choose captured source attempt'],
              ...state.runs.map((item) => [
                item.id,
                `${item.id.slice(0, 12)} - ${item.phase}`
              ])
            ]}
          />
        </div>
        <div id="assessment-task-field" hidden={!taskMode}>
          <Field
            {...field}
            id="assessment-task"
            label="Task source"
            options={[
              ['', 'Choose task source'],
              ...state.tasks.records.map((item) => [
                item.id,
                `${item.id.slice(0, 12)} - ${item.phase}`
              ])
            ]}
          />
        </div>
        <div id="assessment-attempt-field" hidden={!taskMode}>
          <Field
            {...field}
            id="assessment-attempt"
            label="Exact task attempt"
            options={[
              ['', 'Choose exact task attempt'],
              ...(sourceTask?.attempts ?? []).map((item) => [
                item.id,
                `${item.id.slice(0, 12)} - ${item.phase} - ${item.verdict?.evidence?.status ?? 'unavailable'}`
              ])
            ]}
          />
        </div>
        <Json
          id="assessment-source-identity"
          value={
            sourceReady &&
            sourceIdentity(
              taskMode,
              sourceTask,
              sourceAttempt,
              sourceRun,
              sourceAttemptId,
              assessments
            )
          }
          empty="Select a captured source attempt explicitly."
        />
        <button
          id="assessment-start"
          disabled={
            disabled ||
            Boolean(assessmentError) ||
            assessments.some((item) => item.phase === 'running') ||
            !target?.targetVerification ||
            !target.acceptedVersion ||
            !sourceReady
          }
          onClick={assess}
        >
          Assess saved allocation
        </button>
        <button
          id="assessment-cancel"
          disabled={
            Boolean(assessmentError) ||
            !assessment ||
            assessment.phase !== 'running'
          }
          onClick={async () => {
            setAssessmentNotice('')
            await act(
              `/api/target-assessments/${assessment.id}/cancel`,
              {},
              setAssessmentNotice
            )
          }}
        >
          Cancel assessment
        </button>
        <p id="assessment-notice" role="status">
          {assessmentNotice ||
            assessmentError ||
            sourceTaskResult.error ||
            (missingSourceTask &&
              'Selected task is unavailable in the current summary window.') ||
            'Results are separate from acceptance.'}
        </p>
        <label>
          Assessment history
          <select
            id="assessment-history"
            value={selectedAssessment}
            onChange={(event) => setSelectedAssessment(event.target.value)}
          >
            <option value="">Choose retained assessment</option>
            {assessments
              .filter((item) => item.request.targetId === targetId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id.slice(0, 12)} - allocation{' '}
                  {item.request.allocationRevision} - {item.phase}
                </option>
              ))}
          </select>
        </label>
        <Json
          id="assessment-summary"
          role="status"
          value={
            assessment &&
            `Assessment ${assessment.id}\nAllocation ${assessment.request.allocationRevision} - ${assessment.phase}\n${assessment.projection.current ? 'current' : 'stale'} - ${assessment.projection.eligible ? 'Eligible for explicit acceptance' : 'Not eligible'}\n${assessment.projection.staleReasons.join('\n')}\nEligibility does not accept history.`
          }
        />
        <div
          id="assessment-history-proof"
          hidden={assessment?.projection.format === 3}
        >
          <h4>Historical baseline verification</h4>
          <Json
            id="assessment-accepted"
            value={proofSummary(assessment?.projection.accepted)}
          />
        </div>
        <h4>Complete candidate contract</h4>
        <Json
          id="assessment-target-contract"
          value={proofSummary(assessment?.projection.targetContract)}
        />
        <h4>Bounded work and prerequisites</h4>
        <Json
          id="assessment-works"
          value={workProofSummary(assessment, target)}
        />
        <h4>Whole-target integration</h4>
        <Json
          id="assessment-integration"
          value={proofSummary(assessment?.projection.integration)}
        />
        <details>
          <summary>
            Exact source, verification identities and producer progress
          </summary>
          <Json
            id="assessment-progress"
            value={
              assessment && {
                runtime: assessment.runtime,
                roles: assessment.roles,
                slots: assessment.slots
              }
            }
          />
        </details>
        <Field
          {...field}
          id="assessment-accept-reason"
          label="Explicit baseline acceptance reason"
          maxLength={1000}
        />
        <Field
          {...field}
          id="assessment-retirement"
          label="Exact retired obligation ids (comma-separated)"
        />
        <button
          id="assessment-accept"
          disabled={
            disabled ||
            Boolean(assessmentError) ||
            !currentAssessment ||
            assessment?.projection.format !== 3 ||
            !assessment.projection.eligible ||
            assessment.projection.targetContract?.status !== 'passed' ||
            !fields['assessment-accept-reason']?.trim() ||
            Boolean(accepted)
          }
          onClick={() =>
            act('/api/targets/accept', {
              requestId: crypto.randomUUID(),
              targetId,
              assessmentId: selectedAssessment,
              reason: fields['assessment-accept-reason'],
              retirement: splitList(fields['assessment-retirement'])
            })
          }
        >
          Accept integrated target baseline
        </button>
        <Json
          id="assessment-acceptance"
          role="status"
          value={
            accepted &&
            [
              `Accepted by ${accepted.actor} at ${accepted.at}`,
              `Request: ${accepted.targetAcceptance.requestId}`,
              `Assessment: ${accepted.targetAcceptance.assessmentId}`,
              `Contract: ${accepted.targetAcceptance.contractDigest}`,
              `Source: ${JSON.stringify(accepted.targetAcceptance.source)}`,
              `Retirement: ${accepted.retirement.join(', ') || 'none'}`,
              `Resulting mapping revision: ${accepted.targetAcceptance.resultingMappingRevision}`,
              `Resulting version revision: ${accepted.targetAcceptance.resultingVersionRevision}`
            ].join('\n')
          }
          empty="No baseline acceptance. Eligibility is read-only."
        />
      </section>
      <div id="target-items" aria-label="Saved work commitments">
        {target?.works.map((work) => (
          <article
            key={work.id}
            className="proof-target-item"
            data-work-id={work.id}
          >
            <p className="proof-work-assessment">
              Assessment: {work.assessment?.status ?? 'pending'} - bounded work
              only
            </p>
            <h4>
              {work.title} - {work.status}
            </h4>
            <p>{work.stepId}</p>
            <p>{work.scope}</p>
            <p>Obligations: {work.obligationIds.join(', ')}</p>
            <p>Runtime files: {work.allowedFiles.join(', ')}</p>
            {work.prerequisites.map((dependency) => (
              <p key={dependency.workId}>
                Prerequisite {dependency.workId} - {dependency.status}:{' '}
                {dependency.handoff}
              </p>
            ))}
            <button
              disabled={
                disabled ||
                !target.baselineCurrent ||
                (work.prerequisites.length
                  ? !currentAssessment
                  : work.status === 'blocked')
              }
              onClick={() => prepare(work)}
            >
              {work.prerequisites.length
                ? 'Prepare task from assessed prerequisites'
                : 'Prepare task from this promise'}
            </button>
          </article>
        ))}
      </div>
      <details>
        <summary>Work editor and revision preview</summary>
        <Field
          {...field}
          id="target-work-title"
          label="Work title"
          maxLength={200}
        />
        <Field
          {...field}
          id="target-work-step"
          label="Owner step"
          options={(flow?.steps ?? []).map((item) => [item.id, item.title])}
        />
        <fieldset>
          <legend>Promised obligations</legend>
          <div id="target-obligations">
            {obligations
              .filter((item) => item.stepId === stepId)
              .map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    value={item.id}
                    checked={selectedObligations.includes(item.id)}
                    onChange={(event) =>
                      setSelectedObligations((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id)
                      )
                    }
                  />
                  {item.id}
                </label>
              ))}
          </div>
        </fieldset>
        <Field
          {...field}
          id="target-work-scope"
          label="Exact promised scope"
          rows={3}
          maxLength={2000}
        />
        <Field
          {...field}
          id="target-work-files"
          label="Allowed runtime files (comma-separated)"
        />
        <Field
          {...field}
          id="target-prerequisites"
          label="Prerequisite work (select required items)"
          multiple
          options={draft.map((item) => [item.id, item.title])}
        />
        <Field
          {...field}
          id="target-handoff"
          label="Required handoff from each prerequisite"
          rows={2}
          maxLength={2000}
        />
        <button id="target-add-work" onClick={addWork}>
          Add work to revision draft
        </button>
        <div id="target-draft">
          {draft.map((work) => (
            <article key={work.id} data-work-id={work.id}>
              <h4>{work.title}</h4>
              <Json value={work} />
              <button
                disabled={Boolean(
                  target?.works.find((item) => item.id === work.id)?.taskIds
                    .length
                )}
                onClick={() =>
                  setDraft((current) =>
                    current.filter((item) => item.id !== work.id)
                  )
                }
              >
                Remove from revision
              </button>
            </article>
          ))}
        </div>
        <p id="target-draft-pending">
          Pending:{' '}
          {obligations
            .filter(
              (item) =>
                !draft.some((work) => work.obligationIds.includes(item.id))
            )
            .map((item) => item.id)
            .join(', ')}
        </p>
      </details>
      <Field
        {...field}
        id="target-reason"
        label="Explicit decision reason"
        maxLength={1000}
      />
      <button
        id="target-save"
        disabled={disabled || !target}
        onClick={() => targetAction('revise')}
      >
        Save scope revision
      </button>
      <button
        id="target-reload"
        disabled={!target}
        onClick={() => loadEditor(target)}
      >
        Reload saved revision into editor
      </button>
      <details>
        <summary>Connect an admitted task</summary>
        <Field
          {...field}
          id="target-link-work"
          label="Work commitment"
          options={(target?.works ?? []).map((item) => [item.id, item.title])}
        />
        <Field
          {...field}
          id="target-link-task"
          label="Existing task"
          options={state.tasks.records.map((item) => [
            item.id,
            `${item.objective} - ${item.id}`
          ])}
        />
        <button
          id="target-link"
          disabled={disabled || !target?.works.length}
          onClick={() => targetAction('link')}
        >
          Link exact task
        </button>
      </details>
      <p id="target-notice" role="status">
        {targetResult.error || notice}
      </p>
      <details>
        <summary>Task, attempt and PR observations</summary>
        <div id="target-observations">
          {target?.tasks.map((item) => (
            <article className="proof-target-item" key={item.taskId}>
              <h4>
                {item.task ? 'Task observation - ' : 'Reserved task - '}
                {item.taskId}
              </h4>
              <p>Commitment: {item.workId}</p>
              <p>
                Candidate verification:{' '}
                {item.task?.verificationStatus ?? 'unknown'}
              </p>
              {item.task?.attempts.map((attempt) => (
                <p key={attempt.id}>
                  Attempt {attempt.id} -{' '}
                  {attempt.verdict?.evidence?.status ?? 'unknown'}
                </p>
              ))}
              {item.review ? (
                <>
                  <p>Delivery: {item.review.state}</p>
                  <p>Pinned attempt: {item.review.preview.attemptId}</p>
                  <p>
                    PR observation:{' '}
                    {item.review.observation?.state ?? 'unknown'} - HEAD{' '}
                    {item.review.observation?.headSha ?? 'unknown'}
                  </p>
                </>
              ) : (
                <p>PR: no retained review</p>
              )}
              <ExternalLink href={item.task && `/api/tasks/${item.taskId}`}>
                Open task and attempt audit
              </ExternalLink>
              <ExternalLink
                href={item.review && `/api/tasks/${item.taskId}/review`}
              >
                Open retained PR preview and audit
              </ExternalLink>
              <ExternalLink href={item.review?.observation?.url}>
                {item.review?.observation?.url}
              </ExternalLink>
            </article>
          ))}
        </div>
      </details>
      <details>
        <summary>Revision decisions and historical commitments</summary>
        <Json id="target-audit" value={target?.history} />
      </details>
      <ExternalLink
        id="target-record-link"
        href={targetId && `/api/targets/${targetId}`}
      >
        Open complete target and audit
      </ExternalLink>
    </details>
  )
}
