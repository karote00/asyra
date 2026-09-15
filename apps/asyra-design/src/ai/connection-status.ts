export const AI_STATUS_ENDPOINT = '/api/ai/status'
export const AI_CONNECTION_MESSAGES = Object.freeze({
  checking: 'Checking AI connection…',
  ready: 'Local AI connected',
  configured: 'AI configured - connection checked when sending',
  unconfigured:
    'AI is not configured. Set the provider and model, then restart the App server.',
  'local-unavailable':
    'Local AI unavailable. Check that a compatible Codex is installed and signed in, then retry.',
  unavailable:
    'AI server unavailable. Start the App with yarn start, then retry.'
})
export type AiConnectionState = keyof typeof AI_CONNECTION_MESSAGES

export const checkAiConnection = async (
  signal: AbortSignal
): Promise<AiConnectionState> => {
  try {
    const response = await fetch(AI_STATUS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      signal
    })
    if (!response.ok) return 'unavailable'
    const result: unknown = await response.json()
    if (typeof result !== 'object' || result === null || !('state' in result))
      return 'unavailable'
    const state = result.state
    if (
      state === 'ready' ||
      state === 'configured' ||
      state === 'unconfigured' ||
      state === 'local-unavailable'
    )
      return state
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}
