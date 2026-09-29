import { useId, useRef, useState, useSyncExternalStore } from 'react'
import type { AiConversationController } from '../ai/conversation'

export const AiConversationNavigation = ({
  conversation,
  onNavigate
}: {
  readonly conversation: AiConversationController
  readonly onNavigate: (id: string | null) => void
}) => {
  const navigation = useSyncExternalStore(
    conversation.subscribeNavigation,
    conversation.getNavigationSnapshot
  )
  const [historyOpen, setHistoryOpen] = useState(false)
  const historyId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navigate = (id: string | null) => {
    setHistoryOpen(false)
    onNavigate(id)
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <button
        ref={toggleRef}
        type="button"
        aria-label="Toggle conversation history"
        title="Conversation history"
        aria-expanded={historyOpen}
        aria-controls={historyId}
        disabled={navigation.busy}
        onClick={() => setHistoryOpen(!historyOpen)}
        className="grid h-6 w-6 place-items-center rounded border-0 bg-transparent text-[#b8b9c0] enabled:hover:bg-[#303136] enabled:hover:text-white disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="1.5" />
          <path d="M9 5v14M12 9h4M12 12h4M12 15h3" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="New conversation"
        title="New conversation"
        disabled={navigation.busy}
        onClick={() => navigate(null)}
        className="grid h-6 w-6 place-items-center rounded border-0 bg-transparent text-[#b8b9c0] enabled:hover:bg-[#303136] enabled:hover:text-white disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M12 4.75v14.5M4.75 12h14.5" />
        </svg>
      </button>
      {historyOpen && (
        <section
          id={historyId}
          aria-label="Conversation history"
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            event.stopPropagation()
            setHistoryOpen(false)
            toggleRef.current?.focus()
          }}
          className="absolute inset-x-0 top-full z-10 max-h-64 overflow-y-auto border-b border-[#45464b] bg-[#202124] p-2 shadow-lg"
        >
          <ul className="m-0 list-none space-y-2 p-0">
            {navigation.conversations.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  title={item.title}
                  aria-current={item.id === navigation.conversationId}
                  disabled={navigation.busy}
                  onClick={() => navigate(item.id)}
                  className="block w-full truncate rounded border border-[#45464b] border-l-2 border-l-transparent bg-[#28292d] px-3 py-3 text-left text-[12px] text-[#d1cddc] enabled:hover:bg-[#34353b] aria-[current=true]:border-l-[#a594ff] aria-[current=true]:bg-[#343039] aria-[current=true]:text-white disabled:opacity-50"
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
