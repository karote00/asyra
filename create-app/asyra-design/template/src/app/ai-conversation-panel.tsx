import { AiConnectionStatus } from './ai-connection-status'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent
} from 'react'
import type {
  AiConfirmationBroker,
  AiConfirmationSnapshot
} from '../ai/confirmation'
import type {
  AiActiveTurn,
  AiConversationController,
  AiConversationSnapshot,
  AiImageAttachment,
  AiImageMediaType,
  AiSettledTurn
} from '../ai/conversation'
import {
  canRetryAiTurn,
  projectAiActivity,
  formatElapsedTime,
  projectAiQuestion,
  summarizeAiTurn,
  type AiDrawingDetailChoice,
  type AiDrawingDetailOptionId
} from '../ai/presentation'
import { AiDocumentInteractionTargetProps } from '../constants'

const ACCEPTED_IMAGE_TYPES = new Set<AiImageMediaType>([
  'image/jpeg',
  'image/png',
  'image/webp'
])

const ActiveDuration = ({ turn }: { readonly turn?: AiActiveTurn }) => {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(performance.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <span>
      {formatElapsedTime(
        (turn?.waitingSinceMs ?? now) -
          (turn?.startedAtMs ?? now) -
          (turn?.waitingDurationMs ?? 0)
      )}
    </span>
  )
}

const stopAgentInteractionPropagation = (event: SyntheticEvent): void => {
  event.stopPropagation()
}

const readImageAttachment = (file: File): Promise<AiImageAttachment> =>
  new Promise((resolve, reject) => {
    const mediaType = file.type as AiImageMediaType
    const reader = new FileReader()
    reader.onerror = () => {
      reject(new Error('image-read-failed'))
    }
    reader.onload = () => {
      if (
        typeof reader.result !== 'string' ||
        !reader.result.startsWith(`data:${mediaType};base64,`)
      ) {
        reject(new Error('image-read-failed'))
        return
      }
      resolve(
        Object.freeze({
          dataUrl: reader.result,
          mediaType,
          name: file.name,
          size: file.size
        })
      )
    }
    reader.readAsDataURL(file)
  })

const ImageAttachmentStrip = ({
  attachments,
  onRemove
}: {
  readonly attachments: readonly AiImageAttachment[]
  readonly onRemove?: (index: number) => void
}) => (
  <ul
    aria-label="Attached images"
    className="m-0 flex list-none gap-2 overflow-x-auto p-0"
  >
    {attachments.map((attachment, index) => (
      <li
        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#4a4b52] bg-[#111216]"
        key={`${attachment.name}:${attachment.size}:${index}`}
      >
        <img
          alt={attachment.name}
          className="h-full w-full object-cover"
          src={attachment.dataUrl}
        />
        {onRemove ? (
          <button
            aria-label={`Remove ${attachment.name}`}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/75 text-[12px] leading-none text-white hover:bg-black"
            onClick={() => onRemove(index)}
            type="button"
          >
            ×
          </button>
        ) : null}
      </li>
    ))}
  </ul>
)

const DrawingDetailChoiceCard = ({
  choice,
  onChoose
}: {
  readonly choice: AiDrawingDetailChoice
  readonly onChoose?: () => void
}) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-[11px] font-semibold text-[#f0edff]">
          {choice.label}
        </p>
        {onChoose ? (
          <span aria-hidden="true" className="text-[10px] text-[#c7bfff]">
            Choose →
          </span>
        ) : null}
      </div>
      <p className="mb-0 mt-1 text-[9px] leading-4 text-[#aaa6b3]">
        {choice.description}
      </p>
      {choice.resourceWarning ? (
        <p className="mb-0 mt-1.5 rounded bg-[#3a2f24] px-2 py-1.5 text-[9px] leading-4 text-[#f1c58f]">
          {choice.resourceWarning}
        </p>
      ) : null}
    </>
  )

  return (
    <li>
      {onChoose ? (
        <button
          aria-label={`Choose ${choice.label}`}
          className="w-full rounded-md border border-[#56506d] bg-[#222127] p-2.5 text-left transition-colors hover:border-[#8073b5] hover:bg-[#292633] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9b87ff]"
          onClick={onChoose}
          type="button"
        >
          {content}
        </button>
      ) : (
        <div className="rounded-md border border-[#4b4857] bg-[#222127] p-2.5">
          {content}
        </div>
      )}
    </li>
  )
}

export interface AiConversationPanelProps {
  readonly confirmation: AiConfirmationBroker
  readonly conversation: AiConversationController
  readonly onClose: () => void
}

const AiConversationPanelLayout = ({
  conversation,
  onClose,
  children,
  editRequestRef
}: AiConversationPanelProps & {
  readonly children: ReactNode
  readonly editRequestRef: RefObject<((turn: AiSettledTurn) => void) | null>
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')
  const [aiAvailable, setAiAvailable] = useState(true)
  const [draftAttachments, setDraftAttachments] = useState<
    readonly AiImageAttachment[]
  >([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [draggingImages, setDraggingImages] = useState(false)
  const [conversationSnapshot, setConversationSnapshot] =
    useState<AiConversationSnapshot>(() => conversation.getSnapshot())

  useEffect(
    () => conversation.subscribe(setConversationSnapshot),
    [conversation]
  )
  useEffect(() => {
    promptRef.current?.focus({ preventScroll: true })
  }, [])

  const active = conversationSnapshot.activeTurn !== null
  const canSend = draft.trim().length > 0 && !active && aiAvailable

  const addImageFiles = useCallback(
    async (files: FileList | readonly File[]) => {
      if (conversation.getSnapshot().activeTurn) {
        return
      }
      const selectedFiles = Array.from(files)
      const acceptedFiles = selectedFiles.filter((file) =>
        ACCEPTED_IMAGE_TYPES.has(file.type as AiImageMediaType)
      )
      setAttachmentError(
        acceptedFiles.length === selectedFiles.length
          ? null
          : 'Choose PNG, JPEG, or WebP images.'
      )
      if (acceptedFiles.length === 0) {
        return
      }
      const results = await Promise.allSettled(
        acceptedFiles.map(readImageAttachment)
      )
      if (conversation.getSnapshot().activeTurn) {
        return
      }
      const attachments = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      )
      if (attachments.length > 0) {
        setDraftAttachments((current) =>
          Object.freeze([...current, ...attachments])
        )
      }
      if (results.some((result) => result.status === 'rejected')) {
        setAttachmentError(
          'Could not read one or more images. Try adding them again.'
        )
      }
    },
    [conversation]
  )

  const chooseImages = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files
      if (files) {
        void addImageFiles(files)
      }
      event.currentTarget.value = ''
    },
    [addImageFiles]
  )

  const dropImages = useCallback(
    (event: DragEvent<HTMLFormElement>) => {
      event.preventDefault()
      setDraggingImages(false)
      if (!active) {
        void addImageFiles(event.dataTransfer.files)
      }
    },
    [active, addImageFiles]
  )

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      const intent = draft.trim()
      if (!intent || !aiAvailable || conversation.getSnapshot().activeTurn) {
        return
      }
      const settlement = conversation.submit({
        attachments: draftAttachments,
        intent
      })
      if (conversation.getSnapshot().activeTurn?.intent === intent) {
        setDraft('')
        setDraftAttachments([])
        setAttachmentError(null)
      }
      void settlement.catch(() => undefined)
    },
    [conversation, draft, draftAttachments, aiAvailable]
  )

  const close = useCallback(() => {
    onClose()
  }, [onClose])

  const editRequest = (turn: AiSettledTurn) => {
    setDraft(
      turn.originalIntent && turn.originalIntent !== turn.intent
        ? `${turn.originalIntent}\n${turn.intent}`
        : turn.intent
    )
    setDraftAttachments(turn.requestAttachments ?? turn.attachments)
    promptRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    editRequestRef.current = editRequest
    return () => {
      editRequestRef.current = null
    }
  })

  return (
    <aside
      {...AiDocumentInteractionTargetProps.AGENT_INTERFACE}
      onClick={stopAgentInteractionPropagation}
      onKeyDown={stopAgentInteractionPropagation}
      onKeyUp={stopAgentInteractionPropagation}
      onMouseDown={stopAgentInteractionPropagation}
      onMouseUp={stopAgentInteractionPropagation}
      onPointerDown={stopAgentInteractionPropagation}
      onPointerUp={stopAgentInteractionPropagation}
      onTouchEnd={stopAgentInteractionPropagation}
      onTouchStart={stopAgentInteractionPropagation}
      onWheel={stopAgentInteractionPropagation}
      aria-label="Agent conversation"
      aria-modal="false"
      className="fixed bottom-0 right-0 top-10 z-50 flex w-[384px] max-w-[calc(100vw-24px)] flex-col overflow-hidden border-l border-[#45464b] bg-[#202124] text-[#f5f5f5] shadow-[-18px_0_48px_rgba(0,0,0,0.32)]"
      data-testid="ai-agent-panel"
      role="complementary"
    >
      <header className="flex items-center justify-between border-b border-[#38393e] px-4 py-3">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-lg bg-[#7c5cff] text-[11px] font-bold text-white"
        >
          AI
        </span>
        <button
          aria-label="Close Agent panel"
          className="grid h-7 w-7 place-items-center rounded-md border-0 bg-transparent text-lg text-[#b8b9c0] hover:bg-[#303136] hover:text-white"
          onClick={close}
          type="button"
        >
          ×
        </button>
      </header>

      <div
        aria-label="Your AI subscription"
        className="shrink-0 border-b border-[#454052] bg-[#282530] px-4 py-3"
        role="note"
      >
        <p className="m-0 text-[11px] font-medium leading-5 text-[#e0d9ff]">
          Your AI subscription
        </p>
        <p className="m-0 mt-1 text-[11px] leading-[18px] text-[#c7c4d0]">
          Local AI uses your own subscription and counts toward its usage
          limits. Asyra Design does not provide an AI subscription.
        </p>
      </div>

      {children}
      <form
        aria-label="Agent message form"
        className={`shrink-0 border-t p-3 transition-colors ${
          draggingImages ? 'border-[#8d7bff] bg-[#282536]' : 'border-[#38393e]'
        }`}
        data-testid="agent-image-drop-target"
        onDragEnter={(event) => {
          event.preventDefault()
          if (!active) {
            setDraggingImages(true)
          }
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDraggingImages(false)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={dropImages}
        onSubmit={submit}
      >
        <AiConnectionStatus onAvailabilityChange={setAiAvailable} />
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-label="Choose images"
          className="sr-only"
          disabled={active}
          multiple
          onChange={chooseImages}
          ref={imageInputRef}
          type="file"
        />
        {draftAttachments.length > 0 ? (
          <div className="mb-2">
            <ImageAttachmentStrip
              attachments={draftAttachments}
              onRemove={(index) => {
                if (!active) {
                  setDraftAttachments((current) =>
                    Object.freeze(
                      current.filter(
                        (_attachment, attachmentIndex) =>
                          attachmentIndex !== index
                      )
                    )
                  )
                  setAttachmentError(null)
                }
              }}
            />
          </div>
        ) : null}
        {attachmentError ? (
          <p
            className="mb-2 mt-0 rounded-md border border-[#765052] bg-[#342426] px-2 py-1.5 text-[10px] text-[#ffc0c3]"
            role="alert"
          >
            {attachmentError}
          </p>
        ) : null}
        <div className="rounded-lg border border-[#46474e] bg-[#18191c] focus-within:border-[#806cff]">
          <label className="sr-only" htmlFor="ai-agent-input">
            Message Agent
          </label>
          <textarea
            aria-label="Message Agent"
            className="block min-h-[72px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 py-2 text-[11px] leading-5 text-white outline-none placeholder:text-[#777982]"
            data-ai-agent-prompt="true"
            id="ai-agent-input"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            onKeyUp={(event) => event.stopPropagation()}
            placeholder="Describe a drawing or refinement…"
            ref={promptRef}
            value={draft}
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex items-center gap-2">
              <button
                aria-label="Add image"
                className="h-7 rounded-md border border-transparent bg-transparent px-2 text-[10px] text-[#c7c8ce] enabled:hover:border-[#696b74] enabled:hover:bg-[#303136] disabled:cursor-not-allowed disabled:text-[#6f7077]"
                disabled={active}
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                + Image
              </button>
            </div>
            <div className="flex items-center gap-2">
              {active ? (
                <button
                  {...AiDocumentInteractionTargetProps.AGENT_CANCEL}
                  aria-label="Cancel request"
                  disabled={conversationSnapshot.activeTurn?.stopping}
                  className="rounded-md border border-[#6c4d4d] bg-[#382727] px-3 py-1.5 text-[10px] text-[#ffb8b8] hover:bg-[#472e2e]"
                  onClick={(event) => {
                    stopAgentInteractionPropagation(event)
                    conversation.cancel('user-cancelled')
                  }}
                  onKeyDown={stopAgentInteractionPropagation}
                  onKeyUp={stopAgentInteractionPropagation}
                  onMouseDown={stopAgentInteractionPropagation}
                  onMouseUp={stopAgentInteractionPropagation}
                  onPointerDown={stopAgentInteractionPropagation}
                  onPointerUp={stopAgentInteractionPropagation}
                  onTouchEnd={stopAgentInteractionPropagation}
                  onTouchStart={stopAgentInteractionPropagation}
                  type="button"
                >
                  Stop
                </button>
              ) : null}
              <button
                className="h-7 rounded-md border border-[#8d7bff] bg-[#745cff] px-3 text-[10px] font-medium text-white enabled:hover:bg-[#856fff] disabled:cursor-not-allowed disabled:border-[#44454b] disabled:bg-[#303136] disabled:text-[#777982]"
                disabled={!canSend}
                type="submit"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </form>
    </aside>
  )
}

const AiConversationFeed = ({
  conversation,
  confirmation,
  onEdit
}: Pick<AiConversationPanelProps, 'conversation' | 'confirmation'> & {
  readonly onEdit: (turn: AiSettledTurn) => void
}) => {
  const conversationBodyRef = useRef<HTMLElement>(null)
  const followLatestRef = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const [conversationSnapshot, setConversationSnapshot] = useState(() =>
    conversation.getSnapshot()
  )
  const [confirmationSnapshot, setConfirmationSnapshot] =
    useState<AiConfirmationSnapshot>(() => confirmation.getSnapshot())
  useEffect(
    () => conversation.subscribe(setConversationSnapshot),
    [conversation]
  )
  useEffect(
    () => confirmation.subscribe(setConfirmationSnapshot),
    [confirmation]
  )
  const active = conversationSnapshot.activeTurn !== null
  useEffect(() => {
    const body = conversationBodyRef.current
    if (body && followLatestRef.current) {
      body.scrollTop = body.scrollHeight
    }
  }, [confirmationSnapshot, conversationSnapshot])

  const submitDrawingDetailChoice = useCallback(
    (turnId: string, optionId: AiDrawingDetailOptionId) => {
      const snapshot = conversation.getSnapshot()
      const latestSettled =
        snapshot.settledTurns[snapshot.settledTurns.length - 1]
      if (
        snapshot.disposed ||
        snapshot.activeTurn ||
        latestSettled?.turnId !== turnId
      ) {
        return
      }
      try {
        const settlement = conversation.submit({
          intent: optionId === 'maximum' ? 'Maximum detail' : 'Balanced detail',
          detailOption: optionId,
          replyToTurnId: turnId
        })
        void settlement.catch(() => undefined)
      } catch {
        // The controller remains the authority for active/disposed rejection.
      }
    },
    [conversation]
  )

  const pendingConfirmation = confirmationSnapshot.pending
  const turns = [...conversationSnapshot.settledTurns]
  const timeline = conversationSnapshot.activeTurn
    ? [...turns, conversationSnapshot.activeTurn]
    : turns

  const editRequest = onEdit
  return (
    <>
      <section
        aria-label="Conversation messages"
        onScroll={(event) => {
          const body = event.currentTarget
          const atBottom =
            body.scrollHeight - body.scrollTop - body.clientHeight < 32
          followLatestRef.current = atBottom
          setShowJump(!atBottom)
        }}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        ref={conversationBodyRef}
      >
        {conversationSnapshot.settledTurns.length === 0 && !active ? (
          <div className="rounded-lg border border-[#393a40] bg-[#27282d] p-3 text-[11px] leading-5 text-[#c9cad0]">
            Describe what you would like to draw, or add a reference image. You
            can refine the result in later turns.
          </div>
        ) : null}

        {timeline.map((turn) => {
          const settled = 'outcome' in turn ? turn : null
          const summary = settled ? summarizeAiTurn(settled) : null
          const question = settled ? projectAiQuestion(settled) : null
          const answer = timeline.find(
            (entry) => entry.replyToTurnId === turn.turnId
          )
          const canAnswer =
            question &&
            !answer &&
            !active &&
            turns.at(-1)?.turnId === turn.turnId
          let questionStatus = 'Superseded'
          if (answer) questionStatus = 'Answered'
          if (canAnswer) questionStatus = 'Waiting for your answer'
          const latest = timeline.at(-1)?.turnId === turn.turnId
          const stopping = !settled && conversationSnapshot.activeTurn?.stopping
          const activity = projectAiActivity(turn.progress, {
            outcome: settled?.outcome,
            stopping: Boolean(stopping),
            awaitingApproval: !settled && Boolean(pendingConfirmation)
          })
          return (
            <article
              className="flex min-w-0 flex-col gap-3"
              data-testid="ai-agent-message"
              data-outcome={settled?.outcome ?? 'active'}
              data-turn-id={turn.turnId}
              key={turn.turnId}
            >
              <div
                aria-label="Your message"
                data-message-role="user"
                className="flex max-w-[88%] min-w-0 self-end flex-col gap-2 rounded-2xl rounded-tr-sm bg-[#34353b] px-3 py-2.5"
              >
                {turn.attachments.length > 0 ? (
                  <ImageAttachmentStrip attachments={turn.attachments} />
                ) : null}
                <p className="m-0 whitespace-pre-wrap break-words text-[12px] leading-5 text-[#f1f1f3]">
                  {turn.intent}
                </p>
              </div>
              <div
                aria-label="Agent response"
                data-message-role="assistant"
                className="min-w-0 self-stretch py-1 pr-3 text-[12px] leading-5 text-[#e1dff0]"
              >
                {!settled ? (
                  <div
                    role="status"
                    aria-label="Current activity"
                    className="flex items-start gap-2 text-[#b9b2d4]"
                  >
                    {!pendingConfirmation ? (
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#9f8cff]"
                      />
                    ) : null}
                    <span className="min-w-0 break-words">
                      {activity.current.label}
                    </span>
                  </div>
                ) : (
                  <div>
                    {!question ? (
                      <p className="mb-1 mt-0 text-[10px] text-[#96939f]">
                        Result
                      </p>
                    ) : null}
                    <p className="m-0 whitespace-pre-wrap break-words">
                      {summary?.message}
                    </p>
                  </div>
                )}
                {!settled && activity.current.message ? (
                  <p className="mb-0 mt-2 whitespace-pre-wrap break-words">
                    {activity.current.message}
                  </p>
                ) : null}
                {confirmationSnapshot.decisions
                  ?.filter((decision) => decision.turnId === turn.turnId)
                  .map((decision) => (
                    <p
                      className="my-2 text-[11px] text-[#aaa6b3]"
                      key={decision.confirmationId}
                    >
                      {decision.accepted ? 'Approved' : 'Declined'}:{' '}
                      {decision.summary.message}
                    </p>
                  ))}
                {question ? (
                  <>
                    <p className="mb-0 mt-1 text-[10px] text-[#aaa6b3]">
                      {questionStatus}
                    </p>
                    {answer ? (
                      <p className="my-1 text-[11px] text-[#c7bfff]">
                        Selected: {answer.intent}
                      </p>
                    ) : null}
                    {canAnswer ? (
                      <ul
                        aria-label="Drawing detail options"
                        className="mb-0 mt-2 flex list-none flex-col gap-2 p-0"
                      >
                        {question.choices.map((choice) => (
                          <DrawingDetailChoiceCard
                            choice={choice}
                            key={choice.id}
                            onChoose={() =>
                              submitDrawingDetailChoice(turn.turnId, choice.id)
                            }
                          />
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : null}
                {!question && (turn.progress.length > 0 || !settled) ? (
                  <details className="mt-2 text-[10px] text-[#96939f]">
                    <summary className="cursor-pointer">Activity</summary>
                    <ol
                      aria-label="Operational progress"
                      className="my-1 list-none space-y-1 pl-3"
                    >
                      {activity.entries.map((entry, index) => {
                        const current = !settled && entry === activity.current
                        return (
                          <li
                            key={`${turn.turnId}:${index}`}
                            aria-current={current ? 'step' : undefined}
                            className="py-1"
                          >
                            <span>{entry.label}</span>
                            {entry.message ? (
                              <p className="mb-0 mt-1 whitespace-pre-wrap break-words">
                                {entry.message}
                              </p>
                            ) : null}
                          </li>
                        )
                      })}
                    </ol>
                  </details>
                ) : null}
                {settled &&
                latest &&
                !active &&
                (settled.outcome === 'failed' ||
                  settled.outcome === 'cancelled' ||
                  settled.outcome === 'partial') ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canRetryAiTurn(settled) ? (
                      <button
                        className="rounded-md border border-[#625586] px-3 py-1.5 text-[11px] hover:bg-[#302b3e]"
                        type="button"
                        onClick={() =>
                          void conversation
                            .retry(turn.turnId)
                            .catch(() => undefined)
                        }
                      >
                        Try again
                      </button>
                    ) : null}
                    <button
                      className="rounded-md border border-[#484950] px-3 py-1.5 text-[11px] hover:bg-[#303136]"
                      type="button"
                      onClick={() => editRequest(settled)}
                    >
                      Edit request
                    </button>
                  </div>
                ) : null}
                <p
                  aria-label="Elapsed time"
                  className="mb-0 mt-2 text-[10px] text-[#85828f]"
                >
                  {settled ? (
                    summary?.durationLabel
                  ) : (
                    <ActiveDuration
                      turn={conversationSnapshot.activeTurn ?? undefined}
                    />
                  )}
                </p>
              </div>
            </article>
          )
        })}

        {pendingConfirmation ? (
          <div
            aria-label="AI action confirmation"
            className="rounded-lg border border-[#7b5b38] bg-[#30281f] p-3"
          >
            <p className="m-0 text-[11px] font-semibold text-[#ffd7a3]">
              Confirm action
            </p>
            <p className="mb-2 mt-1 text-[11px] leading-5 text-[#e8dfd3]">
              {pendingConfirmation.summary.message}
            </p>
            <div className="mb-3 flex gap-1.5 text-[9px] uppercase tracking-wide">
              {pendingConfirmation.summary.destructive ? (
                <span className="rounded bg-[#5a3028] px-1.5 py-0.5 text-[#ffb3a3]">
                  Destructive
                </span>
              ) : null}
              <span className="rounded bg-[#3c3a32] px-1.5 py-0.5 text-[#d8d1b6]">
                Undoable
              </span>
              <span className="rounded bg-[#31363a] px-1.5 py-0.5 text-[#b9c5cd]">
                No external effect
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="rounded-md border border-[#5a5b62] bg-transparent px-3 py-1.5 text-[10px] text-[#dadbe0] hover:bg-[#37383d]"
                onClick={() => confirmation.resolve(false)}
                type="button"
              >
                Decline
              </button>
              <button
                className="rounded-md border border-[#8d7bff] bg-[#745cff] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#856fff]"
                onClick={() => confirmation.resolve(true)}
                type="button"
              >
                Approve
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {showJump ? (
        <button
          className="mx-auto mb-2 rounded-full border border-[#514a68] bg-[#292630] px-3 py-1 text-[11px]"
          type="button"
          onClick={() => {
            followLatestRef.current = true
            setShowJump(false)
            const body = conversationBodyRef.current
            if (body) body.scrollTop = body.scrollHeight
          }}
        >
          Jump to latest
        </button>
      ) : null}
    </>
  )
}

export const AiConversationPanel = (props: AiConversationPanelProps) => {
  const editRequestRef = useRef<((turn: AiSettledTurn) => void) | null>(null)
  return (
    <AiConversationPanelLayout {...props} editRequestRef={editRequestRef}>
      <AiConversationFeed
        conversation={props.conversation}
        confirmation={props.confirmation}
        onEdit={(turn) => editRequestRef.current?.(turn)}
      />
    </AiConversationPanelLayout>
  )
}
