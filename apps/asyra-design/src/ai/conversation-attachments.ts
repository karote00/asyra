import type { AiImageAttachment, AiImageMediaType } from './conversation'

export const readConversationImage = (
  file: File,
  signal: AbortSignal
): Promise<AiImageAttachment> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    const clean = () => {
      reader.onload = null
      reader.onerror = null
      reader.onabort = null
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      clean()
      if (reader.readyState === FileReader.LOADING) reader.abort()
      reject(new Error('image-read-aborted'))
    }
    reader.onerror = () => {
      clean()
      reject(new Error('image-read-failed'))
    }
    reader.onabort = abort
    reader.onload = () => {
      const dataUrl = reader.result
      clean()
      if (
        typeof dataUrl !== 'string' ||
        !dataUrl.startsWith(`data:${file.type};base64,`)
      ) {
        reject(new Error('image-read-failed'))
        return
      }
      resolve(
        Object.freeze({
          dataUrl,
          mediaType: file.type as AiImageMediaType,
          name: file.name,
          size: file.size
        })
      )
    }
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
    try {
      reader.readAsDataURL(file)
    } catch (error) {
      clean()
      reject(error)
    }
  })
