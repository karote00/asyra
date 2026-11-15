interface ResetStoredDocumentOptions {
  readonly reload?: () => void
  readonly resetDocument?: (fileId: string) => Promise<void>
}

const getRequiredStoredFileId = (): string => {
  const fileId = new URLSearchParams(window.location.search)
    .get('fileId')
    ?.trim()

  if (!fileId) {
    throw new Error('[reset] fileId is required')
  }

  return fileId
}

export const resetStoredDocument = async (
  options: ResetStoredDocumentOptions = {}
): Promise<void> => {
  const fileId = getRequiredStoredFileId()
  const reload = options.reload ?? (() => window.location.reload())

  try {
    const resetDocument =
      options.resetDocument ??
      (await import('../collaboration/lifecycle')).resetCollaborationDocument

    await resetDocument(fileId)
  } finally {
    reload()
  }
}
