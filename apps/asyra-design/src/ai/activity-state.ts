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
    [AiActionNames.INSPECT_DRAWING]: 'Reviewing the drawing',
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

const activityLoopLabel = (tool: string | undefined): string | undefined => {
  if (
    [
      AiResearchActivityIds.RESEARCH_DESIGN_CONTEXT,
      AiReferenceToolIds.SEARCH_REFERENCE_IMAGES,
      AiReferenceToolIds.IMPORT_REFERENCE_IMAGE
    ].includes(tool as never)
  )
    return 'Researching design context'
  if (
    [
      AiDesignToolIds.PREPARE_DESIGN,
      AiDesignToolIds.REVIEW_DRAWING,
      AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
      AiDesignToolIds.RECORD_DESIGN_FACTS,
      AiDesignToolIds.RECORD_DESIGN_CALCULATIONS,
      AiDesignToolIds.SELECT_DESIGN_REFERENCES,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      AiActionNames.REPLACE_VECTOR_COMPOSITION
    ].includes(tool as never)
  )
    return 'Drawing and refining'
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

interface ActiveCall {
  readonly entry: ActivityEntry
  readonly parentCallId?: string
  readonly sequence: number
}

const ownerPhaseLabels = {
  provider: 'AI processing',
  queued: 'Queued App operation',
  admission: 'Checking inputs',
  preparing: 'Preparing geometry',
  executing: 'Running an operation',
  applying: 'Updating the canvas',
  inspecting: 'Checking the drawing'
} as const

interface ActivityState {
  readonly lifecycle: ActivityLifecycle
  readonly entry: ActivityEntry
  readonly work?: ActivityEntry
  readonly loop?: string
  readonly attempt: number
  readonly sequence: number
  readonly objective?: string
  readonly requestPurpose?: string
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

/** Inheritance is a projection, never a new authored purpose on the receiving call. */
const projectCallEntry = (
  current: ActiveCall | undefined,
  calls: Readonly<Record<string, ActiveCall>>,
  fallback: ActivityEntry
): ActivityEntry => {
  if (!current) return fallback
  const visited = new Set<ActiveCall>()
  let source: ActiveCall | undefined = current
  while (source && !visited.has(source)) {
    if (source.entry.message)
      return { label: current.entry.label, message: source.entry.message }
    visited.add(source)
    source = source.parentCallId ? calls[source.parentCallId] : undefined
  }
  return {
    label: current.entry.label,
    ...(fallback.message ? { message: fallback.message } : {})
  }
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
  ) => ({
    state: next,
    decision: { status, reason }
  })
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
    !['provider', 'execution', 'context'].includes(update.phase)
  )
    return transition(ordered, 'retained', 'awaiting-approval')

  if (lifecycle !== 'running') {
    return transition(
      {
        ...ordered,
        lifecycle,
        loop: undefined,
        failed: update.phase === 'settled' && update.outcome === 'failed',
        entry: { label: activityLabel(update) }
      },
      'accepted',
      'lifecycle-control'
    )
  }

  // Scoped owner activity overrides generic loop labels, never lifecycle controls.
  if (
    update.activity &&
    (update.activity.phase || state.requestPurpose || state.objective)
  ) {
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
    if (activity.scope === 'request') {
      if (authored) requestPurpose = authored
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
    } else if (
      closedCalls[activity.callId] ||
      (activity.parentCallId && closedCalls[activity.parentCallId])
    ) {
      return transition(ordered, 'rejected', 'completed-call')
    } else {
      const previous = calls[activity.callId]
      // A later concrete operation supersedes earlier stage commentary. The
      // stable request objective and genuine live call purposes remain valid.
      if (authored && authored !== previous?.entry.message)
        requestPurpose = undefined
      const message = authored ?? previous?.entry.message
      calls[activity.callId] = {
        entry: {
          label: ownerPhaseLabels[activity.phase ?? 'provider'],
          ...(message ? { message } : {})
        },
        parentCallId: activity.parentCallId,
        sequence: activity.sequence
      }
    }
    const current = Object.values(calls).sort(
      (a, b) => b.sequence - a.sequence
    )[0]
    const purpose = requestPurpose ?? ordered.objective
    const entry = projectCallEntry(current, calls, {
      label: ownerPhaseLabels.provider,
      ...(purpose ? { message: purpose } : {})
    })
    const next = {
      ...ordered,
      lifecycle,
      calls,
      closedCalls,
      requestPurpose,
      entry,
      work: undefined,
      loop: undefined
    }
    return transition(
      next,
      sameActivity(state.entry, entry) ? 'retained' : 'accepted',
      'scoped-owner-phase'
    )
  }
  if (
    Object.keys(ordered.calls).length ||
    ordered.requestPurpose ||
    ordered.objective
  ) {
    const current = Object.values(ordered.calls).sort(
      (a, b) => b.sequence - a.sequence
    )[0]
    const entry = projectCallEntry(current, ordered.calls, {
      label: ['provider', 'execution'].includes(update.phase)
        ? ownerPhaseLabels.provider
        : activityLabel(update),
      message: ordered.requestPurpose ?? ordered.objective
    })
    return transition(
      { ...ordered, lifecycle, entry },
      sameActivity(state.entry, entry) ? 'retained' : 'accepted',
      'active-purpose'
    )
  }
  if (update.toolStatus === 'completed')
    return transition(ordered, 'retained', 'uncorrelated-completion')
  let message: string | undefined
  if (update.phase === 'provider' || update.phase === 'execution') {
    if (update.activity?.kind === 'work')
      message = boundedActivityMessage(update.message)
    if (!message) message = executionActivityMessage(update)
  }
  if (state.work && !message) {
    const next = { ...ordered, lifecycle, entry: state.work }
    if (state.lifecycle === 'awaiting-approval')
      return transition(next, 'accepted', 'resumed-work')
    return transition(next, 'retained', 'system-progress-after-work')
  }
  if (
    state.loop &&
    !message &&
    ['resolution', 'permission', 'execution'].includes(update.phase)
  )
    return transition(ordered, 'retained', 'same-loop')
  let loop = state.loop
  if (update.phase === 'provider') loop = activityLoopLabel(update.tool)
  else if (update.phase !== 'execution') loop = undefined
  const label = loop ?? activityLabel(update)
  const entry: ActivityEntry = {
    label,
    ...(message && message !== label ? { message } : {})
  }
  const next = { ...ordered, lifecycle, loop, entry, work: state.work }
  if (message) next.work = entry
  if (sameActivity(state.entry, entry))
    return transition(next, 'retained', 'duplicate-visible-activity')
  let reason = 'initial-system-progress'
  if (message) reason = 'authored-work'
  return transition(next, 'accepted', reason)
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
  const result = () => {
    const projected = reduceAiActivity(state, {
      type: 'conversation',
      snapshot
    }).state
    const entries = history
      .filter(
        (item) =>
          projected.lifecycle !== 'awaiting-answer' ||
          item.lifecycle !== 'settled'
      )
      .map((item) => item.entry)
    if (
      projected.lifecycle !== 'awaiting-answer' &&
      !sameActivity(entries.at(-1), projected.entry)
    )
      entries.push(projected.entry)
    if (!entries.length) entries.push({ label: 'Starting request' })
    return { entries, current: entries[entries.length - 1] }
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
