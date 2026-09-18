import { useEffect, useState } from 'react'
import {
  AI_CONNECTION_MESSAGES,
  checkAiConnection,
  type AiConnectionState
} from '../ai/connection-status'

/** Owns one readiness request per open/retry, independently of the message draft. */
export const AiConnectionStatus = ({
  onAvailabilityChange
}: {
  readonly onAvailabilityChange?: (available: boolean) => void
}) => {
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
  useEffect(() => {
    onAvailabilityChange?.(
      state === 'checking' || state === 'ready' || state === 'configured'
    )
  }, [state, onAvailabilityChange])
  const connected = state === 'ready' || state === 'configured'
  const canRetry = !connected && state !== 'checking'
  let indicatorColor = 'bg-[#81838b]'
  if (connected) indicatorColor = 'bg-[#74c69d]'
  else if (canRetry) indicatorColor = 'bg-[#dda56b]'
  return (
    <div className="mb-2 flex items-start gap-2 text-[12px] leading-4 text-[#9b9da7]">
      <span
        aria-hidden="true"
        className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${indicatorColor}`}
      />
      <span className="min-w-0 flex-1" role="status">
        {AI_CONNECTION_MESSAGES[state]}
      </span>
      {canRetry ? (
        <button
          aria-label="Check AI connection"
          className="shrink-0 rounded px-1 text-[12px] leading-4 text-[#c7bfff] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#9b87ff]"
          onClick={() => setRevision((current) => current + 1)}
          type="button"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}
