import { UIItems } from '../workspace/ui-parts'
import React, { useState } from 'react'
import {
  retrySaving,
  downloadRecoveryFile,
  type DocumentRecoveryControlsProps
} from './document-recovery'
import { AiDocumentInteractionTargetProps } from '../constants'

export const DocumentRecoveryControls = ({
  session,
  reopen
}: DocumentRecoveryControlsProps) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const retry = async () => {
    if (busy) {
      return
    }

    setBusy(true)
    setError('')
    try {
      await retrySaving({ session, reopen })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (busy) {
      return
    }

    setBusy(true)
    setError('')
    try {
      await downloadRecoveryFile(session)
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
      data-canvas-overlay="recovery"
      aria-label="Document recovery"
      className="absolute bottom-4 left-4 z-50 max-w-lg rounded bg-neutral-800 p-4 text-white shadow"
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <UIItems
        id="recovery"
        parts={{
          recoveryMessage: (
            <p>
              Saving is paused. Your local work is kept for recovery; shared
              changes will resume after recovery.
            </p>
          ),
          recoveryActions: (
            <div className="mt-2 flex gap-3">
              <UIItems
                id="recoveryActions"
                parts={{
                  retrySaving: (
                    <button
                      type="button"
                      data-recovery-action="retrySaving"
                      disabled={busy}
                      onClick={() => {
                        void retry()
                      }}
                    >
                      {busy ? 'Preparing recovery…' : 'Retry saving'}
                    </button>
                  ),
                  downloadDocument: (
                    <button
                      type="button"
                      data-recovery-action="download"
                      disabled={busy}
                      onClick={() => {
                        void download()
                      }}
                    >
                      Download recovery file
                    </button>
                  )
                }}
              />
            </div>
          ),
          recoveryError: error && (
            <p role="alert" className="mt-2 break-words">
              {error}
            </p>
          )
        }}
      />
    </div>
  )
}
