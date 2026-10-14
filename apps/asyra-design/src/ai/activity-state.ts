import type { AiRuntimeProgressUpdate } from '@asyra/ai-agent-runtime'
import type { AiConversationOutcome } from './conversation'
import { AiDesignToolIds } from '../constants/ai-design'
import {
  AiReferenceToolIds,
  AiResearchActivityIds
} from '../constants/ai-research'
import { AiActionNames } from '../constants'

export const activityToolLabels: Readonly<Record<string, string>> =
  Object.freeze({
    vtracer: 'Converting artwork to vectors',
    [AiDesignToolIds.PREPARE_DESIGN]: 'Preparing the design',
    [AiDesignToolIds.REVIEW_DRAWING]: 'Checking the requested details',
    [AiDesignToolIds.DEFINE_DESIGN_CRITERIA]: 'Defining the requested checks',
    [AiDesignToolIds.RECORD_DESIGN_FACTS]: 'Recording verified sources',
    [AiDesignToolIds.RECORD_DESIGN_CALCULATIONS]:
      'Recording derived measurements',
    [AiDesignToolIds.SELECT_DESIGN_REFERENCES]:
      'Selecting comparison references',
    [AiActionNames.APPLY_PREPARED_DESIGN]: 'Adding the design',
    [AiResearchActivityIds.RESEARCH_DESIGN_CONTEXT]:
      'Researching design context',
    [AiReferenceToolIds.SEARCH_REFERENCE_IMAGES]: 'Finding a reference',
    [AiReferenceToolIds.IMPORT_REFERENCE_IMAGE]: 'Preparing the reference',
    [AiActionNames.ORGANIZE_DESIGN]: 'Organizing layers',
    [AiActionNames.ARRANGE_DESIGN]: 'Arranging the design',
    [AiActionNames.REVIEW_DESIGN]: 'Checking the layout',
    [AiActionNames.UPDATE_DESIGN_ELEMENT]: 'Refining the design',
    [AiActionNames.READ_DESIGN_CONTEXT]: 'Reading the design',
    [AiActionNames.RESOLVE_DESIGN_TARGETS]: 'Finding the edit targets',
    [AiActionNames.RELEASE_DESIGN_CONTEXT]: 'Releasing query results',
    [AiActionNames.INSPECT_DRAWING]: 'Reviewing the drawing',
    [AiActionNames.READ_DESIGN_ATTACHMENT]: 'Reading the target container',
    [AiDesignToolIds.REVIEW_PREPARED_DESIGN]: 'Checking the prepared design',
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]:
      'Checking inspection freshness',
    [AiActionNames.INSERT_VECTOR_COMPOSITION]: 'Adding the drawing',
    [AiActionNames.REPLACE_VECTOR_COMPOSITION]: 'Replacing the drawing',
    [AiActionNames.REMOVE_AI_COMPOSITION]: 'Removing the drawing',
    [AiActionNames.SET_ELEMENT_VISIBILITY]: 'Adjusting element visibility',
    [AiActionNames.SELECT_ELEMENTS]: 'Selecting elements',
    [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: 'Refining the drawing'
  })

const boundedActivityMessage = (
  value: string | undefined
): string | undefined => {
  const message = value?.trim()
  if (message && message.length <= 1000) return message
}

const executionActivityMessage = (
  update: AiRuntimeProgressUpdate
): string | undefined => {
  if (update.phase !== 'execution' || update.activity?.kind !== 'work') return
  return boundedActivityMessage(update.summary)
}

const activityLabel = (update: AiRuntimeProgressUpdate): string => {
  if (update.tool && update.toolStatus) {
    const tool = Object.hasOwn(activityToolLabels, update.tool)
      ? activityToolLabels[update.tool]
      : 'Planning the drawing'
    return update.toolStatus === 'running' ? tool : 'Reviewing the results'
  }
  switch (update.phase) {
    case 'context':
      return 'Reviewing the drawing'
    case 'provider':
      return 'Planning the drawing'
    case 'resolution':
      return 'Reviewing the planned changes'
    case 'permission':
      return 'Checking whether changes can be applied'
    case 'confirmation':
      return 'Awaiting approval'
    case 'execution': {
      const summary = executionActivityMessage(update)
      if (summary) return summary
      return update.tool && Object.hasOwn(activityToolLabels, update.tool)
        ? activityToolLabels[update.tool]
        : 'Preparing the drawing'
    }
    case 'settlement':
      return update.summary
    case 'settled':
      if (update.outcome === 'failed') return 'Failed'
      if (update.outcome === 'cancelled') return 'Stopped'
      return 'Finished'
  }
}

export interface AiActivityProjectionState {
  readonly purpose?: string
  readonly stopping?: boolean
  readonly awaitingAnswer?: boolean
  readonly awaitingApproval?: boolean
  readonly outcome?: AiConversationOutcome
}

type ActivityLifecycle =
  | 'running'
  | 'awaiting-approval'
  | 'saving'
  | 'stopping'
  | 'settled'
  | 'awaiting-answer'

interface ActivityEntry {
  readonly label: string
  readonly message?: string
}

interface ActivityPurpose {
  readonly id: string
  readonly revision: number
  readonly scope: 'request' | 'call'
  readonly message: string
}

interface ActiveCall {
  readonly label: string
  readonly purpose?: ActivityPurpose
  readonly parentCallId?: string
}

const ownerPhaseLabels = {
  provider: 'Processing your request',
  queued: 'Queued App operation',
  admission: 'Checking inputs',
  preparing: 'Preparing geometry',
  executing: 'Running an operation',
  applying: 'Updating the canvas',
  inspecting: 'Checking the drawing'
} as const

interface ActivityState {
  readonly lifecycle: ActivityLifecycle
  readonly phaseLabel?: string
  readonly entry: ActivityEntry
  readonly attempt: number
  readonly sequence: number
  readonly objective?: string
  readonly requestPurpose?: ActivityPurpose
  readonly closedCalls?: Readonly<Record<string, true>>
  readonly calls: Readonly<Record<string, ActiveCall>>
  readonly failed: boolean
}

type ActivityEvent =
  | { readonly type: 'progress'; readonly update: AiRuntimeProgressUpdate }
  | {
      readonly type: 'conversation'
      readonly snapshot: AiActivityProjectionState
    }

type ActivityTransitionKind =
  'running' | 'awaiting-approval' | 'saving' | 'settled'

/** Only actual progress resumes approval; saving and terminal states cannot reopen work. */
const allowedTransitions: Readonly<
  Record<ActivityLifecycle, readonly ActivityTransitionKind[]>
> = {
  running: ['running', 'awaiting-approval', 'saving', 'settled'],
  'awaiting-approval': ['running', 'awaiting-approval', 'saving', 'settled'],
  saving: ['saving', 'settled'],
  stopping: ['settled'],
  settled: [],
  'awaiting-answer': []
}

const initialActivityState = (purpose?: string): ActivityState => ({
  objective: purpose,
  calls: {},
  lifecycle: 'running',
  entry: { label: 'Starting request' },
  attempt: 0,
  sequence: 0,
  failed: false
})

/** Phase-only updates retain the identity of genuinely authored work. */
const authorPurpose = (
  previous: ActivityPurpose | undefined,
  message: string | undefined,
  id: string,
  scope: ActivityPurpose['scope'],
  sequence: number
): ActivityPurpose | undefined => {
  if (!message) return previous
  if (
    previous?.message === message &&
    previous.id === id &&
    previous.scope === scope
  )
    return previous
  return { id, scope, revision: sequence, message }
}

/** Inheritance is a projection, never a new authored purpose on the receiving call. */
const callAncestry = (
  id: string,
  calls: Readonly<Record<string, ActiveCall>>
): string[] => {
  const result: string[] = []
  const visited = new Set<string>()
  let current: string | undefined = id
  while (current && calls[current] && !visited.has(current)) {
    result.push(current)
    visited.add(current)
    current = calls[current].parentCallId
  }
  return result
}

const livePurpose = (
  calls: Readonly<Record<string, ActiveCall>>
): ActivityPurpose | undefined => {
  const entries = Object.entries(calls)
  const parents = new Set(entries.map(([, call]) => call.parentCallId))
  const leaves = entries.filter(([id]) => !parents.has(id))
  if (!leaves.length) return
  const paths = leaves.map(([id]) => callAncestry(id, calls))
  const common = paths[0].find(
    (id) => calls[id].purpose && paths.every((path) => path.includes(id))
  )
  return common ? calls[common].purpose : undefined
}

/** Accepted active leaves own diagnostics independently of visible purpose text. */
const livePhaseLabel = (
  calls: Readonly<Record<string, ActiveCall>>,
  fallback: string
): string => {
  const entries = Object.entries(calls)
  const parents = new Set(entries.map(([, call]) => call.parentCallId))
  const leaves = entries.filter(([id]) => !parents.has(id))
  if (leaves.length === 1) return leaves[0][1].label
  return leaves.length ? `Running ${leaves.length} operations` : fallback
}

const projectCallEntry = (
  calls: Readonly<Record<string, ActiveCall>>,
  fallback: ActivityEntry,
  stagePurpose?: string
): ActivityEntry => {
  if (stagePurpose) return { label: '', message: stagePurpose }
  const entries = Object.entries(calls)
  if (!entries.length) return fallback
  const parents = new Set(entries.map(([, call]) => call.parentCallId))
  const leaves = entries.filter(([id]) => !parents.has(id))
  // Invalid ancestry cannot make one sibling's purpose represent all work.
  if (!leaves.length) return fallback
  const message = livePurpose(calls)?.message ?? fallback.message
  if (message) return { label: '', message }
  return { label: livePhaseLabel(calls, fallback.label) }
}

const transitionKind = (
  update: AiRuntimeProgressUpdate
): ActivityTransitionKind => {
  switch (update.phase) {
    case 'confirmation':
      return 'awaiting-approval'
    case 'settlement':
      return 'saving'
    case 'settled':
      return 'settled'
    default:
      return 'running'
  }
}

const sameActivity = (left: ActivityEntry | undefined, right: ActivityEntry) =>
  left?.label === right.label && left?.message === right.message

/** One pure owner decides lifecycle, work retention and diagnostic disposition. */
export const reduceAiActivity = (
  state: ActivityState,
  event: ActivityEvent
) => {
  const transition = (
    next: ActivityState,
    status: 'accepted' | 'retained' | 'rejected',
    reason: string
  ) => {
    const live = livePurpose(next.calls)
    const activeCallCount = Object.keys(next.calls).length
    let selected: ActivityPurpose | undefined
    let purposeSource = 'none'
    if (next.lifecycle === 'running') {
      if (next.requestPurpose) {
        selected = next.requestPurpose
        purposeSource = 'request'
      } else if (live) {
        selected = live
        purposeSource = 'live-call'
      }
    }
    const phaseLabel =
      next.lifecycle === 'running'
        ? livePhaseLabel(
            next.calls,
            next.phaseLabel ?? (next.entry.label || ownerPhaseLabels.provider)
          )
        : next.entry.label
    return {
      state: next,
      decision: {
        status,
        reason,
        phaseLabel,
        activeCallCount,
        purposeSource,
        ...(selected
          ? {
              purpose: {
                id: selected.id,
                scope: selected.scope,
                revision: selected.revision
              }
            }
          : {})
      }
    }
  }
  if (event.type === 'conversation') {
    const snapshot = event.snapshot
    // The conversation is authoritative. A question is not a completed drawing.
    if (snapshot.awaitingAnswer)
      return transition(
        { ...state, lifecycle: 'awaiting-answer' },
        'accepted',
        'awaiting-answer'
      )
    if (snapshot.outcome) {
      let label = 'Finished'
      if (snapshot.outcome === 'partial') {
        label = 'Partially completed'
        if (state.failed) label = 'Failed'
      }
      if (snapshot.outcome === 'failed') label = 'Failed'
      if (snapshot.outcome === 'cancelled') label = 'Stopped'
      return transition(
        { ...state, lifecycle: 'settled', entry: { label } },
        'accepted',
        'conversation-outcome'
      )
    }
    if (state.lifecycle === 'settled')
      return transition(state, 'retained', 'terminal-state')
    if (snapshot.stopping)
      return transition(
        { ...state, lifecycle: 'stopping', entry: { label: 'Stopping…' } },
        'accepted',
        'lifecycle-control'
      )
    if (
      snapshot.awaitingApproval &&
      allowedTransitions[state.lifecycle].includes('awaiting-approval')
    )
      return transition(
        {
          ...state,
          lifecycle: 'awaiting-approval',
          entry: { label: 'Awaiting approval' }
        },
        'accepted',
        'lifecycle-control'
      )
    return transition(state, 'retained', 'no-control-change')
  }

  const update = event.update
  if (update.attempt < state.attempt)
    return transition(state, 'rejected', 'older-attempt')
  let sequence = state.sequence
  if (update.attempt > state.attempt) sequence = 0
  if (update.activity) {
    if (update.activity.sequence <= sequence)
      return transition(state, 'rejected', 'old-sequence')
    sequence = update.activity.sequence
  }
  const ordered = {
    ...state,
    attempt: update.attempt,
    sequence,
    requestPurpose:
      update.attempt > state.attempt ? undefined : state.requestPurpose,
    calls: update.attempt > state.attempt ? {} : state.calls,
    closedCalls: update.attempt > state.attempt ? {} : state.closedCalls
  }

  const lifecycle = transitionKind(update)
  if (!allowedTransitions[state.lifecycle].includes(lifecycle))
    return transition(ordered, 'rejected', 'illegal-lifecycle-transition')
  if (
    state.lifecycle === 'awaiting-approval' &&
    lifecycle === 'running' &&
    !['provider', 'execution', 'context'].includes(update.phase) &&
    !(update.activity && update.toolStatus === 'completed')
  )
    return transition(ordered, 'retained', 'awaiting-approval')

  if (lifecycle !== 'running') {
    return transition(
      {
        ...ordered,
        lifecycle,
        ...(lifecycle === 'settled' || lifecycle === 'saving'
          ? { calls: {}, requestPurpose: undefined }
          : {}),
        failed: update.phase === 'settled' && update.outcome === 'failed',
        entry: { label: activityLabel(update) }
      },
      'accepted',
      'lifecycle-control'
    )
  }

  // Scoped starts and completions update ownership before visible-history deduplication.
  if (update.activity) {
    const activity = update.activity
    const calls: Record<string, ActiveCall> =
      update.attempt > state.attempt ? {} : { ...state.calls }
    const closedCalls: Record<string, true> = { ...ordered.closedCalls }
    let requestPurpose = ordered.requestPurpose
    const authored =
      activity.kind === 'work'
        ? (boundedActivityMessage(update.message) ??
          executionActivityMessage(update))
        : undefined
    if (
      closedCalls[activity.callId] ||
      (activity.parentCallId && closedCalls[activity.parentCallId])
    )
      return transition(ordered, 'rejected', 'completed-call')
    if (activity.scope === 'request') {
      if (update.toolStatus === 'completed') {
        closedCalls[activity.callId] = true
        if (requestPurpose?.id === activity.callId) requestPurpose = undefined
      } else {
        if (authored && requestPurpose && requestPurpose.id !== activity.callId)
          closedCalls[requestPurpose.id] = true
        requestPurpose = authorPurpose(
          requestPurpose,
          authored,
          activity.callId,
          'request',
          activity.sequence
        )
      }
    } else if (update.toolStatus === 'completed') {
      closedCalls[activity.callId] = true
      Reflect.deleteProperty(calls, activity.callId)
      let changed = true
      while (changed) {
        changed = false
        for (const [id, call] of Object.entries(calls)) {
          if (call.parentCallId && closedCalls[call.parentCallId]) {
            closedCalls[id] = true
            Reflect.deleteProperty(calls, id)
            changed = true
          }
        }
      }
    } else {
      const previous = calls[activity.callId]
      calls[activity.callId] = {
        label: activity.phase
          ? ownerPhaseLabels[activity.phase]
          : activityLabel(update),
        purpose: authorPurpose(
          previous?.purpose,
          authored,
          activity.callId,
          'call',
          activity.sequence
        ),
        parentCallId: activity.parentCallId ?? previous?.parentCallId
      }
    }
    const entry = projectCallEntry(
      calls,
      {
        label: ownerPhaseLabels.provider
      },
      requestPurpose?.message
    )
    const next = {
      ...ordered,
      lifecycle:
        state.lifecycle === 'awaiting-approval' &&
        update.toolStatus === 'completed'
          ? state.lifecycle
          : lifecycle,
      calls,
      phaseLabel: livePhaseLabel(calls, ownerPhaseLabels.provider),
      closedCalls,
      requestPurpose,
      entry:
        state.lifecycle === 'awaiting-approval' &&
        update.toolStatus === 'completed'
          ? state.entry
          : entry
    }
    return transition(
      next,
      sameActivity(state.entry, next.entry) ? 'retained' : 'accepted',
      'scoped-owner-phase'
    )
  }
  if (Object.keys(ordered.calls).length || ordered.requestPurpose) {
    const entry = projectCallEntry(
      ordered.calls,
      {
        label: ['provider', 'execution'].includes(update.phase)
          ? ownerPhaseLabels.provider
          : activityLabel(update),
        message: ordered.requestPurpose?.message
      },
      ordered.requestPurpose?.message
    )
    return transition(
      {
        ...ordered,
        lifecycle,
        entry,
        phaseLabel: livePhaseLabel(
          ordered.calls,
          update.toolStatus === 'completed'
            ? ownerPhaseLabels.provider
            : activityLabel(update)
        )
      },
      sameActivity(state.entry, entry) ? 'retained' : 'accepted',
      'active-purpose'
    )
  }
  const entry: ActivityEntry = {
    label:
      update.toolStatus === 'completed'
        ? ownerPhaseLabels.provider
        : activityLabel(update)
  }
  return transition(
    { ...ordered, lifecycle, entry, phaseLabel: entry.label },
    sameActivity(state.entry, entry) ? 'retained' : 'accepted',
    'observed-system-progress'
  )
}

/** Turn-owned state; appending one event does not replay previous progress. */
export const createAiActivityProjection = (
  snapshot: AiActivityProjectionState = {}
) => {
  let state = initialActivityState(snapshot.purpose)
  const history: { entry: ActivityEntry; lifecycle: ActivityLifecycle }[] = []
  const append = (update: AiRuntimeProgressUpdate) => {
    const result = reduceAiActivity(state, { type: 'progress', update })
    state = result.state
    if (
      result.decision.status === 'accepted' &&
      !sameActivity(history.at(-1)?.entry, state.entry)
    )
      history.push({ entry: state.entry, lifecycle: state.lifecycle })
    return result.decision
  }
  const result = (overrides: AiActivityProjectionState = {}) => {
    const projected = reduceAiActivity(state, {
      type: 'conversation',
      snapshot: { ...snapshot, ...overrides }
    }).state
    const length = history.length
    const lastEntry = history.at(-1)?.entry
    const current =
      lastEntry && sameActivity(lastEntry, projected.entry)
        ? lastEntry
        : projected.entry
    let entries: ActivityEntry[] | undefined
    return {
      current,
      get entries() {
        if (!entries) {
          entries = history
            .slice(0, length)
            .filter(
              (item) =>
                projected.lifecycle !== 'awaiting-answer' ||
                item.lifecycle !== 'settled'
            )
            .map((item) => item.entry)
          if (
            projected.lifecycle !== 'awaiting-answer' &&
            !sameActivity(entries.at(-1), current)
          )
            entries.push(current)
          if (!entries.length) entries.push({ label: 'Starting request' })
        }
        return entries
      }
    }
  }
  return { append, result }
}

/** UI history and incremental diagnostics use exactly the same transition owner. */
export const projectAiActivity = (
  updates: readonly AiRuntimeProgressUpdate[],
  snapshot: AiActivityProjectionState = {}
) => {
  const projection = createAiActivityProjection(snapshot)
  updates.forEach(projection.append)
  return projection.result()
}
