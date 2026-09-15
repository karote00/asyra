import { useEffect, useState } from 'react'
import {
  AI_CONNECTION_MESSAGES,
  checkAiConnection,
  type AiConnectionState
} from '../ai/connection-status'

/** Owns one readiness request per open/retry, independently of the message draft. */
export const AiConnectionStatus = () => {
  const [state, setState] = useState<AiConnectionState>('checking')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState('checking')
    const timeout = setTimeout(() => controller.abort(), 12_000)
    void checkAiConnection(controller.signal)
      .then((next) => {
        if (active) setState(next)
      })
      .finally(() => clearTimeout(timeout))
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [revision])
  return (
    <div className="flex items-start gap-2 px-3 py-2 text-[10px] text-[#b9b6c4]">
      <span role="status">{AI_CONNECTION_MESSAGES[state]}</span>
      <button
        aria-label="Check AI connection"
        className="shrink-0 rounded border border-[#46474e] px-2 py-1 disabled:opacity-50"
        disabled={state === 'checking'}
        onClick={() => setRevision((current) => current + 1)}
        type="button"
      >
        Retry
      </button>
    </div>
  )
}
