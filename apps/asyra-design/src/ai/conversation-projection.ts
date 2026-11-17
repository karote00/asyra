import type {
  AiActiveTurn,
  AiSettledTurn,
  AiConversationSnapshot
} from './conversation'
import type { AiConfirmationSnapshot } from './confirmation'
import type { AiActivityProjectionState } from './activity-state'
import {
  projectAiQuestion,
  summarizeAiTurn,
  type createAiActivityProjection
} from './presentation'

type Turn = AiActiveTurn | AiSettledTurn
type Activity = ReturnType<
  ReturnType<typeof createAiActivityProjection>['result']
>
interface ProjectionSource {
  getSnapshot(): AiConversationSnapshot
  subscribe(observer: (snapshot: AiConversationSnapshot) => void): () => void
  getActivity(id: string, state?: AiActivityProjectionState): Activity
}
interface ConfirmationSource {
  getSnapshot?(): AiConfirmationSnapshot
  subscribe?(observer: (snapshot: AiConfirmationSnapshot) => void): () => void
}
interface TurnProjection {
  readonly turn: Turn
  readonly summary: ReturnType<typeof summarizeAiTurn> | null
  readonly question: ReturnType<typeof projectAiQuestion>
  readonly activity: Activity
  readonly answer: Pick<Turn, 'turnId' | 'intent'> | null
}

/** Read-only projections retained for their source turn lifetime, shared by all views. */
export const createAiConversationProjection = (
  source: ProjectionSource,
  confirmation?: ConfirmationSource
) => {
  const turns = new Map<string, TurnProjection>()
  const answers = new Map<string, string>()
  const turnObservers = new Map<string, Set<() => void>>()
  const listObservers = new Set<() => void>()
  const controlObservers = new Set<() => void>()
  let ids: readonly string[] = Object.freeze([])
  let selected: string | undefined
  const initialSnapshot = source.getSnapshot()
  let activeTurn = initialSnapshot.activeTurn
  let controls = Object.freeze({
    conversationId: initialSnapshot.conversationId,
    activeTurn
  })
  const emit = (observers?: Set<() => void>) =>
    observers?.forEach((notify) => {
      try {
        notify()
      } catch {
        /* Views do not own publication. */
      }
    })
  const publishTurn = (turn: Turn, force = false) => {
    const previous = turns.get(turn.turnId)
    if (!force && previous?.turn === turn) return
    const settled = 'outcome' in turn ? turn : null
    const question = settled ? projectAiQuestion(settled) : null
    turns.set(
      turn.turnId,
      Object.freeze({
        turn,
        summary: settled ? summarizeAiTurn(settled) : null,
        question,
        activity: source.getActivity(turn.turnId, {
          purpose: turn.originalIntent ?? turn.intent,
          outcome: settled?.outcome,
          awaitingAnswer: Boolean(question),
          stopping: !settled && Boolean((turn as AiActiveTurn).stopping),
          awaitingApproval:
            !settled &&
            confirmation?.getSnapshot?.().pending?.turnId === turn.turnId
        }),
        answer: turns.get(answers.get(turn.turnId) ?? '')?.turn ?? null
      })
    )
    emit(turnObservers.get(turn.turnId))
    if (turn.replyToTurnId) {
      answers.set(turn.replyToTurnId, turn.turnId)
      const parent = turns.get(turn.replyToTurnId)
      if (parent && parent.answer?.turnId !== turn.turnId) {
        turns.set(
          turn.replyToTurnId,
          Object.freeze({
            ...parent,
            answer: Object.freeze({ turnId: turn.turnId, intent: turn.intent })
          })
        )
        emit(turnObservers.get(turn.replyToTurnId))
      }
    }
  }
  const refresh = (next: AiConversationSnapshot) => {
    activeTurn = next.activeTurn
    const switched = selected !== next.conversationId
    if (switched) {
      selected = next.conversationId
      next.settledTurns.forEach((turn) => publishTurn(turn))
    } else {
      const settled = next.settledTurns.at(-1)
      if (settled) publishTurn(settled)
    }
    if (next.activeTurn) publishTurn(next.activeTurn)
    if (switched) {
      ids = Object.freeze([
        ...next.settledTurns.map((turn) => turn.turnId),
        ...(next.activeTurn ? [next.activeTurn.turnId] : [])
      ])
      emit(listObservers)
    } else {
      const latest = next.activeTurn?.turnId ?? next.settledTurns.at(-1)?.turnId
      if (latest && ids.at(-1) !== latest) {
        ids = Object.freeze([...ids, latest])
        emit(listObservers)
      }
    }
    if (
      controls.conversationId !== next.conversationId ||
      controls.activeTurn?.turnId !== next.activeTurn?.turnId ||
      controls.activeTurn?.stopping !== next.activeTurn?.stopping
    ) {
      controls = Object.freeze({
        conversationId: next.conversationId,
        activeTurn: next.activeTurn
      })
      emit(controlObservers)
    }
  }
  refresh(initialSnapshot)
  const detach = source.subscribe(refresh)
  const detachConfirmation = confirmation?.subscribe?.(() => {
    if (activeTurn) publishTurn(activeTurn, true)
  })
  const subscribe = (set: Set<() => void>, notify: () => void) => {
    set.add(notify)
    return () => {
      set.delete(notify)
    }
  }
  return Object.freeze({
    getIds: () => ids,
    subscribeIds: (notify: () => void) => subscribe(listObservers, notify),
    getControls: () => controls,
    subscribeControls: (notify: () => void) =>
      subscribe(controlObservers, notify),
    getTurn: (id: string) => turns.get(id),
    subscribeTurn: (id: string, notify: () => void) => {
      let set = turnObservers.get(id)
      if (!set) {
        set = new Set()
        turnObservers.set(id, set)
      }
      const detach = subscribe(set, notify)
      return () => {
        detach()
        if (!set.size) turnObservers.delete(id)
      }
    },
    dispose: () => {
      activeTurn = null
      controls = Object.freeze({ ...controls, activeTurn: null })
      detach()
      detachConfirmation?.()
      turns.clear()
      answers.clear()
      turnObservers.clear()
      listObservers.clear()
      controlObservers.clear()
      ids = Object.freeze([])
    }
  })
}
