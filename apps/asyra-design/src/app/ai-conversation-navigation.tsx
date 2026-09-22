import { useSyncExternalStore } from 'react'
import type { AiConversationController } from '../ai/conversation'
import { useElementSelection } from '../providers/element-selection'

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
  return (
    <div className="mx-2 flex min-w-0 flex-1 items-center gap-2">
      <select
        aria-label="Conversation history"
        title="Conversations in this document session"
        disabled={navigation.busy}
        value={navigation.conversationId}
        onChange={(event) => onNavigate(event.target.value)}
        className="h-7 min-w-0 flex-1 truncate rounded border border-[#45464b] bg-[#202124] px-1 text-[12px] text-[#d1cddc] disabled:opacity-50"
      >
        {navigation.conversations.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label="New conversation"
        title="New conversation"
        disabled={navigation.busy}
        onClick={() => onNavigate(null)}
        className="h-7 shrink-0 rounded border border-[#45464b] bg-transparent px-2 text-[12px] text-[#d1cddc] enabled:hover:bg-[#303136] disabled:opacity-50"
      >
        New
      </button>
    </div>
  )
}

export const AiSelectionContext = () => {
  const selection = useElementSelection()
  const count = selection?.size ?? 0
  return (
    <p
      className="m-0 px-4 pb-1 text-[12px] leading-5 text-[#aaa6b3]"
      aria-label="Design context"
    >
      {count ? `${count} selected` : 'Canvas'}
    </p>
  )
}
