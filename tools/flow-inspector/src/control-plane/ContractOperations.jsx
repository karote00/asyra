import { useState } from 'react'
import { ExternalLink, Field, Json, splitList } from './shared'

function sharedSummary(shared) {
  return [
    shared.scope,
    `Work: ${shared.workStatus}`,
    `Execution: ${shared.executionStatus}`,
    `Verification: ${shared.verificationStatus}`,
    `Delivery: ${shared.deliveryStatus}`,
    `Observed: ${shared.observedAt}`,
    `Baseline: ${JSON.stringify(shared.baseline)}`,
    ...shared.goals.map((flow) => 'Goal: ' + flow.goal),
    `Remaining work: ${shared.remainingWork.map((item) => `${item.stepId} (${item.status})`).join(', ') || 'All steps reported complete'}`,
    `Remaining verification obligations: ${shared.remaining.map((item) => item.id).join(', ') || 'None in this verified snapshot'}`,
    `Confirmed failures: ${shared.confirmedFailures.map((item) => item.id).join(', ') || 'None observed'}`,
    `Potential downstream impact: ${shared.potentialImpact.join(', ')}`,
    ...shared.blockers.map((item) => 'Blocker: ' + item)
  ].join('\n')
}

export function ContractOperations({
  state,
  record,
  run,
  act,
  disabled,
  targetReviewId
}) {
  const [fields, setFields] = useState({
    'work-status': 'not-started',
    'contract-relation-kind': 'none'
  })
  const setField = (id, value) =>
    setFields((current) => ({ ...current, [id]: value }))
  const field = { fields, setField }
  const mapping = state.mapping
  const selectedMapping = mapping.reviews.find(
    (item) => item.id === fields['mapping-review']
  )
  const reviewId =
    fields['contract-review'] ?? state.evolution.reviews.at(-1)?.id ?? ''
  const review = state.evolution.reviews.find((item) => item.id === reviewId)
  const pendingMapping =
    !disabled &&
    selectedMapping?.status === 'pending' &&
    Boolean(fields['mapping-reason']?.trim())
  const pendingContract =
    !disabled &&
    review?.status === 'pending' &&
    Boolean(fields['contract-reason']?.trim())

  async function mappingAction(decision) {
    const value = await act(
      '/api/mapping/' + (decision ? 'decide' : 'prepare'),
      decision
        ? { id: selectedMapping.id, decision, reason: fields['mapping-reason'] }
        : {}
    )

    if (value) {
      setField('mapping-review', value.id ?? '')
      setField('mapping-reason', '')
      setField(
        'mapping-notice',
        value.status === 'unchanged'
          ? 'No mapping changes. The working mapping matches the accepted baseline.'
          : ''
      )
    }
  }

  function contractAction(decision) {
    const relations =
      fields['contract-relation-kind'] === 'none'
        ? []
        : [
            {
              kind: fields['contract-relation-kind'],
              before: splitList(fields['contract-predecessors']),
              after: splitList(fields['contract-successors'])
            }
          ]

    return act(
      '/api/contracts/' + (decision ? 'decide' : 'prepare'),
      decision
        ? {
            id: reviewId,
            decision,
            reason: fields['contract-reason'],
            retirement: splitList(fields['contract-retirement'])
          }
        : { attemptId: record?.id, relations }
    )
  }

  return (
    <>
      <details id="phase4-controls">
        <summary>Contract versions and CI</summary>
        <p id="contract-baseline">
          Accepted contract revision {state.evolution.revision} -{' '}
          {state.evolution.versions.length} retained versions
        </p>
        <div className="proof-actions">
          <button
            id="run-candidate"
            disabled={disabled}
            onClick={() => run(undefined, 'candidate')}
          >
            Verify candidate
          </button>
          <button
            id="run-ci"
            disabled={disabled}
            onClick={() => run(undefined, 'ci')}
          >
            Run CI aggregate
          </button>
          <button
            id="run-ci-demo"
            disabled={disabled}
            onClick={() => run(undefined, 'ci-demo')}
          >
            Demonstrate CI rejection
          </button>
          <button
            id="retry-run"
            disabled={disabled || !record}
            onClick={() => run(record.flowIds, record.mode, record.scenario)}
          >
            Retry selected run
          </button>
        </div>
        <Json
          id="ci-result"
          value={
            record?.ci &&
            `Verification: ${record.ci.verificationStatus} - Delivery: ${record.ci.deliveryStatus}\n${record.ci.blockers.join('\n')}`
          }
          empty="No CI aggregate selected"
        />
        <ExternalLink
          id="ci-envelope-link"
          href={
            record?.ciEnvelopeDigest &&
            `/api/runs/${record.id}/artifacts/ci-envelope`
          }
        >
          Open CI envelope
        </ExternalLink>
        <Field
          {...field}
          id="contract-relation-kind"
          label="Successor relation"
          options={['none', 'split', 'merge'].map((value) => [value, value])}
        />
        <Field
          {...field}
          id="contract-predecessors"
          label="Previous obligation ids"
        />
        <Field
          {...field}
          id="contract-successors"
          label="Successor obligation ids"
        />
        <button
          id="contract-prepare"
          disabled={disabled || !record}
          onClick={() => contractAction()}
        >
          Review candidate
        </button>
        <Field
          {...field}
          fields={{ ...fields, 'contract-review': reviewId }}
          id="contract-review"
          label="Contract review"
          options={state.evolution.reviews.map((item) => [
            item.id,
            `${item.id.slice(0, 10)} - ${item.status}`
          ])}
        />
        <Json
          id="contract-diff"
          value={
            review && {
              status: review.status,
              changes: review.changes,
              blockers: review.blockers
            }
          }
          empty="Verify a candidate, then prepare its exact version diff."
        />
        <Field
          {...field}
          id="contract-reason"
          label="Decision reason"
          maxLength={1000}
        />
        <Field
          {...field}
          id="contract-retirement"
          label="Explicit retirement (removed obligation ids, comma-separated)"
        />
        <button
          id="contract-accept"
          disabled={!pendingContract || targetReviewId === reviewId}
          onClick={() => contractAction('accept')}
        >
          Accept version
        </button>
        <button
          id="contract-reject"
          disabled={!pendingContract}
          onClick={() => contractAction('reject')}
        >
          Reject version
        </button>
      </details>
      <details>
        <summary>Shared baseline view</summary>
        <Field
          {...field}
          id="work-step"
          label="Implementation step"
          options={state.work.map((item) => [
            item.stepId,
            `${item.stepId} - ${item.status}`
          ])}
        />
        <Field
          {...field}
          id="work-status"
          label="Reported work status"
          options={['not-started', 'in-progress', 'complete', 'blocked'].map(
            (value) => [value, value]
          )}
        />
        <Field
          {...field}
          id="work-reason"
          label="Work update reason"
          maxLength={1000}
        />
        <button
          id="work-save"
          disabled={disabled || !fields['work-reason']?.trim()}
          onClick={() =>
            act('/api/work', {
              stepId: fields['work-step'] || state.work[0]?.stepId,
              status: fields['work-status'],
              reason: fields['work-reason']
            })
          }
        >
          Record work status
        </button>
        <p>Work reports do not grant verification or delivery.</p>
        <Json id="manager-view" value={sharedSummary(state.shared)} />
        <ExternalLink id="shared-link" href="/api/shared">
          Open read-only snapshot
        </ExternalLink>
      </details>
      <details>
        <summary>Mapping review</summary>
        <p id="mapping-baseline">
          Accepted mapping revision {mapping.revision} -{' '}
          {mapping.acceptedVersion}
        </p>
        <button
          id="mapping-prepare"
          disabled={disabled}
          onClick={() => mappingAction()}
        >
          Prepare mapping diff
        </button>
        <Field
          {...field}
          id="mapping-review"
          label="Retained review"
          options={[
            ['', 'Select a retained review'],
            ...mapping.reviews.map((item) => [
              item.id,
              `${item.status} - ${item.id}`
            ])
          ]}
        />
        <div id="mapping-diff">
          {selectedMapping ? (
            <>
              <p>
                Review {selectedMapping.status} - base revision{' '}
                {selectedMapping.baseRevision}
              </p>
              {selectedMapping.changes.map((change) => (
                <div key={change.caseId} className="proof-mapping-change">
                  <strong>
                    {change.caseId} - {change.stepId}
                  </strong>
                  <p>Before: {change.before}</p>
                  <p>After: {change.after}</p>
                </div>
              ))}
            </>
          ) : (
            <p>
              {fields['mapping-notice'] ||
                'Prepare a diff to inspect the working mapping.'}
            </p>
          )}
        </div>
        <Field
          {...field}
          id="mapping-reason"
          label="Decision reason"
          maxLength={1000}
        />
        <button
          id="mapping-accept"
          disabled={!pendingMapping}
          onClick={() => mappingAction('accept')}
        >
          Accept mapping
        </button>
        <button
          id="mapping-reject"
          disabled={!pendingMapping}
          onClick={() => mappingAction('reject')}
        >
          Reject mapping
        </button>
      </details>
    </>
  )
}
