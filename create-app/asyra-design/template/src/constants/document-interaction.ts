export const AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE =
  'data-ai-interaction-target'

export const AiDocumentInteractionTargets = Object.freeze({
  AGENT_CANCEL: 'agent-cancel',
  AGENT_INTERFACE: 'agent-interface',
  AGENT_CONTROL: 'agent-control',
  VIEWPORT_NAVIGATION: 'viewport-navigation'
} as const)

export const AiDocumentInteractionTargetProps = Object.freeze({
  AGENT_CONTROL: Object.freeze({
    [AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE]:
      AiDocumentInteractionTargets.AGENT_CONTROL
  }),
  AGENT_INTERFACE: Object.freeze({
    [AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE]:
      AiDocumentInteractionTargets.AGENT_INTERFACE
  }),
  AGENT_CANCEL: Object.freeze({
    [AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE]:
      AiDocumentInteractionTargets.AGENT_CANCEL
  }),
  VIEWPORT_NAVIGATION: Object.freeze({
    [AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE]:
      AiDocumentInteractionTargets.VIEWPORT_NAVIGATION
  })
})
