import React from 'react'
import { DesignWorkspace, type WorkspaceProps } from './design-workspace'
import { AiConversationPanel } from './ai-conversation-panel'

type AppProps = Pick<WorkspaceProps, 'groupCommandPlatform'> & {
  ai: NonNullable<WorkspaceProps['ai']>
}

export default function App({ ai, groupCommandPlatform }: AppProps) {
  return (
    <DesignWorkspace
      ai={ai}
      groupCommandPlatform={groupCommandPlatform}
      conversationPanel={(close) => (
        <AiConversationPanel
          drafts={ai.drafts}
          confirmation={ai.confirmation}
          conversation={ai.conversation}
          onClose={close}
        />
      )}
    />
  )
}
