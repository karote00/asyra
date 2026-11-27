import type { CollaborationDebugHandle } from '../collaboration/lifecycle'

export interface DocumentRecoveryControlsProps {
  readonly session: Pick<
    CollaborationDebugHandle,
    | 'prepareRecovery'
    | 'whenIdle'
    | 'hasUnpersistedChanges'
    | 'getRecoveryDocument'
  >
  readonly reopen: () => void
}

export async function retrySaving({
  session,
  reopen
}: DocumentRecoveryControlsProps) {
  await session.prepareRecovery()
  await session.whenIdle()
  if (session.hasUnpersistedChanges()) {
    throw new Error(
      'Keep this tab open. Some changes have not been stored yet.'
    )
  }

  await reopen()
}

export async function downloadRecoveryFile(
  session: DocumentRecoveryControlsProps['session']
) {
  await session.whenIdle()
  const document = session.getRecoveryDocument()

  if (document === undefined) {
    throw new Error(
      'A recovery document is not available yet. Keep this tab open.'
    )
  }

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(document)], { type: 'application/json' })
  )
  const link = window.document.createElement('a')

  link.href = url
  link.download = 'document-recovery.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
