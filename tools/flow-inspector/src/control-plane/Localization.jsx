import { useEffect, useState } from 'react'
import { ExternalLink, request, useRemote } from './shared'

function plain(value) {
  return value.replace(
    new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'),
    ''
  )
}

function FailureDetails({ errors = [], strip = false }) {
  return (
    <>
      {!errors.length && <p>Structured assertion details were not recorded.</p>}
      {errors.map((error, index) => (
        <section key={index} className="test-result-assertion">
          <h5>Error - {index + 1}</h5>
          {Object.entries({
            file: 'File',
            projectName: 'Project',
            suiteName: 'Suite',
            name: 'Error type',
            message: 'Original message',
            diff: 'Runner diff',
            expected: 'Expected',
            actual: 'Actual',
            stack: 'Original stack'
          })
            .filter(([key]) => Object.hasOwn(error, key))
            .map(([key, label]) => (
              <div key={key}>
                <h6>
                  {label}
                  {error[key] === '' ? ' - empty string' : ''}
                </h6>
                <pre data-failure-field={key}>
                  {key === 'diff' ||
                  (strip && ['message', 'stack'].includes(key))
                    ? plain(error[key])
                    : error[key]}
                </pre>
              </div>
            ))}
          {!['expected', 'actual', 'diff'].some((key) =>
            Object.hasOwn(error, key)
          ) && (
            <p>The runner did not supply expected, actual or diff values.</p>
          )}
        </section>
      ))}
    </>
  )
}

function Problems({ groups }) {
  return groups.map((group) => (
    <section key={group.runId}>
      <ExternalLink href={'/api/test-results/' + group.runId}>
        Observation - {group.runId}
      </ExternalLink>
      <p>{group.startedAt}</p>
      {group.issues.map((issue, index) => (
        <p key={index}>{issue}</p>
      ))}
      <FailureDetails errors={group.executionFailureDetails} />
      {group.supersededBy && (
        <>
          <ExternalLink href={'/api/test-results/' + group.supersededBy}>
            Superseded by - {group.supersededBy}
          </ExternalLink>
          <p>{group.replacementReason}</p>
        </>
      )}
    </section>
  ))
}

function NodeInteractions({ item, drafts, setDraft }) {
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const result = useRemote(
    `/api/node-context/${item.runId}/${item.id.split(':')[1]}`,
    revision,
    true
  )
  const selection = { runId: item.runId, caseId: item.id }
  const text = drafts[item.id] ?? ''

  async function act(route, body, done) {
    if (pending) {
      return
    }

    setPending(true)
    setError('')

    try {
      const value = await request(route, body)
      done?.(value)
      setRevision((current) => current + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <section id="node-interactions">
      <h4>Node interactions</h4>
      <p role="status">
        {error ||
          result.error ||
          `Reference: ${result.value?.reference ?? 'Loading'}`}
      </p>
      <button
        disabled={pending || Boolean(result.error)}
        onClick={() => {
          setPreview(null)
          void act('/api/node-reruns/preview', selection, (value) =>
            setPreview({ ...value, requestId: crypto.randomUUID() })
          )
        }}
      >
        Preview selected test rerun
      </button>
      {preview && (
        <>
          <pre>
            {[
              `Test: ${preview.test.name}`,
              `File: ${preview.test.file}`,
              `Project: ${preview.test.project || '(default)'}`,
              `Runner: ${preview.command.runner}`,
              `Original run scope fingerprint: ${preview.originalSourceDigest}`,
              `Selected rerun scope fingerprint: ${preview.sourceDigest}`,
              `cwd: ${preview.command.cwd}`,
              `Arguments: ${JSON.stringify(preview.command.args)}`
            ].join('\n')}
          </pre>
          <p>Review the selected test and current source before confirming.</p>
          <button
            disabled={pending || Boolean(result.error)}
            onClick={() =>
              act(
                '/api/node-reruns',
                {
                  ...selection,
                  requestId: preview.requestId,
                  previewDigest: preview.previewDigest
                },
                () => setPreview(null)
              )
            }
          >
            Confirm selected test rerun
          </button>
        </>
      )}
      {result.value?.actions.map((action) => (
        <article key={action.id}>
          <p>
            Rerun - {action.status} - {action.observedStatus || 'pending'} -{' '}
            {action.resolution || 'not assessed'}
          </p>
          <pre>
            {[
              action.id,
              action.error,
              ...(action.issues ?? []),
              action.process?.reason,
              action.process?.output
            ]
              .filter(Boolean)
              .join('\n')}
          </pre>
          <ExternalLink
            href={
              action.resultRunId && '/api/test-results/' + action.resultRunId
            }
          >
            Open rerun report
          </ExternalLink>
          {action.status === 'running' && (
            <button
              disabled={pending}
              onClick={() => act(`/api/node-reruns/${action.id}/cancel`, {})}
            >
              Cancel rerun
            </button>
          )}
        </article>
      ))}
      <h4>Investigation notes</h4>
      <p>
        Append-only local notes, separate from original test evidence. Add a new
        note to correct an earlier one.
      </p>
      {result.value?.comments.map((comment) => (
        <article key={comment.id ?? comment.requestId}>
          <p>
            {comment.actor} - {comment.createdAt}
          </p>
          <pre>{comment.text}</pre>
        </article>
      ))}
      <label>
        Add investigation note
        <textarea
          maxLength={2000}
          value={text}
          onChange={(event) => {
            setDraft(item.id, event.target.value)
            setRequestId(crypto.randomUUID())
          }}
        />
      </label>
      <button
        disabled={pending || !text.trim() || Boolean(result.error)}
        onClick={() =>
          act('/api/node-comments', { ...selection, requestId, text }, () => {
            setDraft(item.id, '', text)
            setRequestId(crypto.randomUUID())
          })
        }
      >
        Save note
      </button>
    </section>
  )
}

function Observation({ item, drafts, setDraft }) {
  const result = useRemote('/api/test-results/' + item.runId)
  const record = result.value

  if (!record) {
    return <p role="status">{result.error || 'Loading retained evidence'}</p>
  }

  return (
    <>
      <h4>{item.testName}</h4>
      <p>{item.reason}</p>
      <pre>
        {[
          'Test: ' + item.file,
          'Project: ' + (item.projectName || '(default)'),
          'Original failure:',
          ...item.failures.map((text) =>
            item.runnerDetails ? plain(text) : text
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
            ? JSON.stringify(record.command, null, 2)
            : 'Original command unavailable'
        ].join('\n')}
      </pre>
      <FailureDetails
        errors={item.failureDetails}
        strip={Boolean(item.runnerDetails)}
      />
      {item.runnerDetails && (
        <>
          <p>
            Runner: Playwright -{' '}
            {record.report?.config?.version || 'version unavailable'}
          </p>
          <details>
            <summary>Playwright attempts and original runner context</summary>
            <pre>{item.runnerDetails}</pre>
          </details>
        </>
      )}
      {!!record.retainedArtifacts?.length && (
        <>
          <h5>Retained run artifacts</h5>
          {record.retainedArtifacts.map((artifact) => (
            <pre key={artifact.retainedPath}>
              {[
                artifact.name,
                'File: ' + artifact.retainedPath,
                'SHA-256: ' + artifact.digest,
                'Bytes: ' + artifact.size
              ].join('\n')}
            </pre>
          ))}
          <p>
            Artifact bytes are retained with this observation. CI downloads must
            preserve the artifact directory alongside the JSON record.
          </p>
        </>
      )}
      <ExternalLink href={'/api/test-results/' + record.id}>
        Open retained report and context
      </ExternalLink>
      {item.resolution === 'mapped' && (
        <NodeInteractions
          key={item.id}
          item={item}
          drafts={drafts}
          setDraft={setDraft}
        />
      )}
    </>
  )
}

export function Localization({ entry, onSelect, onHighlight }) {
  const [selection, setSelection] = useState(
    () =>
      new URLSearchParams(window.location.search)
        .get('observation')
        ?.split(':')[0] ?? ''
  )
  const [chosen, setChosen] = useState(() =>
    new URLSearchParams(window.location.search).get('observation')
  )
  const [digest, setDigest] = useState('')
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState({})
  const result = useRemote('/api/test-results', 0, true)
  const history = useRemote(
    selection ? '/api/test-results/' + selection : null,
    0,
    true
  )
  const state = result.value
  const selected = history.value
  const cases = selection
    ? (selected?.cases ?? [])
    : (state?.currentCases ?? [])
  const item = cases.find((item) => item.id === chosen)
  const failures = cases.filter((item) => item.status === 'failed')
  const failedSteps = failures.flatMap((item) =>
    item.locations
      .filter(
        (location) =>
          location.targetId === entry.data.target.id &&
          location.architectureVersion === digest
      )
      .map((location) => location.stepId)
  )
  const highlighted = JSON.stringify(failedSteps)

  useEffect(() => {
    let active = true
    void crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(JSON.stringify(entry.data)))
      .then((value) => {
        if (active) {
          setDigest(
            Array.from(new Uint8Array(value), (byte) =>
              byte.toString(16).padStart(2, '0')
            ).join('')
          )
        }
      })

    return () => {
      active = false
    }
  }, [entry.data])

  useEffect(() => {
    onHighlight(JSON.parse(highlighted))
  }, [highlighted, onHighlight])

  useEffect(() => {
    const location = item?.locations.find(
      (location) => location.targetId === entry.data.target.id
    )

    if (location && digest) {
      if (location.architectureVersion === digest) {
        onSelect(location.stepId)
        setNotice('')
      } else {
        setNotice(
          'Recorded architecture differs from this canvas; inspect retained context without guessing a current node.'
        )
      }
    }
  }, [item?.id, digest, entry.data.target.id, onSelect])

  function setDraft(id, value, expected) {
    setDrafts((current) =>
      expected === undefined || current[id] === expected
        ? { ...current, [id]: value }
        : current
    )
  }

  let groups = state?.warningGroups.current ?? []

  if (selection) {
    groups = []

    if (
      selected &&
      (selected.issues.length || selected.executionFailureDetails?.length)
    ) {
      groups = [
        {
          runId: selected.id,
          startedAt: selected.startedAt,
          issues: selected.issues,
          executionFailureDetails: selected.executionFailureDetails ?? []
        }
      ]
    }
  }

  return (
    <section id="test-result-controls" className="proof-controls">
      <h3>Test failure locations</h3>
      <p>
        Observed test results - not accepted conformance. Unmapped failures
        remain visible.
      </p>
      <label>
        Result scope
        <select
          id="test-result-history"
          value={selection}
          onChange={(event) => {
            setSelection(event.target.value)
            setChosen(null)
            setNotice('')
          }}
        >
          <option value="">Latest observed result per test</option>
          {state?.runs.map((run) => (
            <option key={run.id} value={run.id}>
              {run.startedAt} - {run.phase} - {run.failedCount} failed
            </option>
          ))}
        </select>
      </label>
      <p id="test-result-notice" role="status">
        {result.error ||
          history.error ||
          notice ||
          `${selection ? 'Historical observation - ' + (selected?.startedAt ?? 'loading') + '. ' : 'Latest observed results - not current working-tree verification. '}${failures.length} failed tests; ${selection ? Number(selected?.phase === 'running') : (state?.runs.filter((run) => run.phase === 'running').length ?? 0)} incomplete runs; ${cases.filter((item) => item.resolution !== 'mapped').length} unresolved observations.`}
      </p>
      <div id="test-result-execution-details">
        <section
          aria-label="Current observation storage problems"
          hidden={!state?.issues.length}
        >
          <h4>Current observation storage problems</h4>
          {state?.issues.map((issue, index) => (
            <p key={index}>{issue}</p>
          ))}
        </section>
        <section id="test-result-current-problems">
          <h4>
            {selection
              ? 'Evidence problems in this historical observation'
              : 'Current evidence problems'}
          </h4>
          <Problems groups={groups} />
          {!groups.length && (
            <p>
              {selection
                ? 'No evidence problems in this observation.'
                : 'No current evidence problems.'}
            </p>
          )}
        </section>
        <details
          id="test-result-historical-warnings"
          hidden={Boolean(selection) || !state?.warningGroups.history.length}
        >
          <summary>
            Historical warnings - {state?.warningGroups.history.length ?? 0}
          </summary>
          <Problems groups={state?.warningGroups.history ?? []} />
        </details>
      </div>
      <div id="test-result-failures">
        <ExternalLink href={selection && '/api/test-results/' + selection}>
          Open selected run report and context
        </ExternalLink>
        {failures.map((failure) => {
          const other = failure.locations.find(
            (location) => location.targetId !== entry.data.target.id
          )
          const route =
            other &&
            state?.targets.find((target) => target.id === other.targetId)

          return (
            <div key={failure.id}>
              <button
                data-observation-id={failure.id}
                onClick={() => setChosen(failure.id)}
              >
                {failure.testName} - {failure.resolution}
              </button>
              <ExternalLink
                href={
                  failure.contextUrl ??
                  `/api/node-context/${failure.runId}/${failure.id.slice(failure.runId.length + 1)}/summary`
                }
              >
                Open investigation summary
              </ExternalLink>
              {route && (
                <a
                  href={
                    route.url + '?observation=' + encodeURIComponent(failure.id)
                  }
                >
                  Open {other.title}
                </a>
              )}
            </div>
          )
        })}
      </div>
      <div id="test-result-detail">
        {item && (
          <Observation
            key={item.id}
            item={item}
            drafts={drafts}
            setDraft={setDraft}
          />
        )}
      </div>
    </section>
  )
}
