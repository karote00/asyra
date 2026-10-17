import React, { useState } from 'react'
import type { CollaborationDebugHandle } from '../collaboration/lifecycle'
import { AiDocumentInteractionTargetProps } from '../constants'

interface DocumentRecoveryControlsProps {
  readonly session: Pick<
    CollaborationDebugHandle,
    | 'prepareRecovery'
    | 'whenIdle'
    | 'hasUnpersistedChanges'
    | 'getRecoveryDocument'
  >
  readonly reopen: () => void
}

export const DocumentRecoveryControls = ({
  session,
  reopen
}: DocumentRecoveryControlsProps) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const retry = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await session.prepareRecovery()
      await session.whenIdle()
      if (session.hasUnpersistedChanges())
        throw new Error(
          'Keep this tab open. Some changes have not been stored yet.'
        )
      reopen()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }
  const download = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await session.whenIdle()
      const document = session.getRecoveryDocument()
      if (document === undefined)
        throw new Error(
          'A recovery document is not available yet. Keep this tab open.'
        )
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(document)], { type: 'application/json' })
      )
      const link = window.document.createElement('a')
      link.href = url
      link.download = 'document-recovery.json'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      {...AiDocumentInteractionTargetProps.AGENT_CONTROL}
      role="region"
      aria-label="Document recovery"
      className="absolute bottom-4 left-4 z-50 max-w-lg rounded bg-neutral-800 p-4 text-white shadow"
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <p>
        Saving is paused. Your local work is kept for recovery; shared changes
        will resume after recovery.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void retry()
          }}
        >
          {busy ? 'Preparing recovery…' : 'Retry saving'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void download()
          }}
        >
          Download recovery file
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 break-words">
          {error}
        </p>
      )}
    </div>
  )
}
