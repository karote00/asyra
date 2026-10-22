import { elementApis } from '../common-apis/element'
import { hierarchyApis } from '../common-apis/hierarchy'
import { strokeApis } from '../common-apis/strokes'
import {
  getActiveCollaborationHandle,
  type CollaborationDebugHandle
} from '../collaboration/lifecycle'
import { createDocumentCollaborationPublicationSource } from '../collaboration/factory-adapter'
import { readDocumentPublicationSlices } from '../collaboration/document-publication'
import core from '../contexts'
import {
  getActiveAiDrawingPerformanceProfile,
  type AiDrawingPerformanceProfile
} from '../init/performance/ai-drawing-performance-profile'
import {
  subscribeToBrowserDragPhases,
  subscribeToDiagnosticCounters
} from '@asyra/utils'

const testState = new Map<string, unknown>()
const testCaptureDisposers = new Map<string, () => void>()

export const testRuntimeState = Object.freeze({
  delete: (key: string): boolean => testState.delete(key),
  get: <T>(key: string): T | undefined => testState.get(key) as T | undefined,
  set: <T>(key: string, value: T): T => {
    testState.set(key, value)
    return value
  }
})

const startCapture = (
  key: string,
  subscribe: (append: (value: unknown) => void) => (() => void) | undefined
): void => {
  testCaptureDisposers.get(key)?.()
  const values: unknown[] = []
  testState.set(key, values)
  const dispose = subscribe((value) => values.push(value))
  if (dispose) testCaptureDisposers.set(key, dispose)
}

export const startSharedPublicationCapture = (key: string): void =>
  startCapture(key, (append) => core.subscribeToSharedPublication(append))

export const startDocumentPublicationCapture = (key: string): void =>
  startCapture(key, (append) =>
    createDocumentCollaborationPublicationSource(core, (publication, error) =>
      append({
        status: 'preparation-failed',
        publicationId: publication.publicationId,
        publication,
        error: error.message
      })
    ).subscribe(append)
  )

export const startSharedChannelCapture = (key: string, channel: string): void =>
  startCapture(key, (append) => core.observeSharedDataChannel(channel, append))

export const clearTestCapture = (key: string): void => {
  const values = testRuntimeState.get<unknown[]>(key)
  if (Array.isArray(values)) {
    values.length = 0
    return
  }
  testState.set(key, [])
}

export const readTestCapture = (key: string): readonly unknown[] =>
  testRuntimeState.get<readonly unknown[]>(key) ?? []

export interface DocumentPublicationDecodeFailure {
  readonly publicationId: string
  readonly message: string
}

export const readDocumentPublicationDecodeFailures = (
  key: string
): readonly DocumentPublicationDecodeFailure[] =>
  readTestCapture(key).flatMap((publication) => {
    if (
      typeof publication === 'object' &&
      publication !== null &&
      'status' in publication &&
      publication.status === 'preparation-failed' &&
      'publicationId' in publication &&
      typeof publication.publicationId === 'string' &&
      'error' in publication &&
      typeof publication.error === 'string'
    ) {
      return [
        { publicationId: publication.publicationId, message: publication.error }
      ]
    }
    try {
      readDocumentPublicationSlices(
        publication as Parameters<typeof readDocumentPublicationSlices>[0]
      )
      return []
    } catch (error) {
      const publicationId =
        typeof publication === 'object' &&
        publication !== null &&
        'publicationId' in publication &&
        typeof publication.publicationId === 'string'
          ? publication.publicationId
          : 'unknown'
      return [
        {
          publicationId,
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    }
  })

export const stopTestCapture = (key: string): void => {
  testCaptureDisposers.get(key)?.()
  testCaptureDisposers.delete(key)
  testState.delete(key)
}

export const startSystemPropertyWriteCapture = (
  key: string,
  options: {
    readonly propertyName?: string
    readonly whileMouseDragging?: boolean
  } = {}
): void => {
  stopTestCapture(key)
  const writes: (readonly [string, unknown])[] = []
  testState.set(key, writes)
  const original = core.setSystemProperty
  const wrapper = ((...args: Parameters<typeof original>) => {
    const propertyName = String(args[0])
    if (
      (!options.propertyName || propertyName === options.propertyName) &&
      (!options.whileMouseDragging ||
        Boolean(core.getSystemProperty('mouseDragging')))
    ) {
      writes.push([propertyName, args[1]])
    }
    return original.apply(core, args)
  }) as typeof original
  core.setSystemProperty = wrapper
  testCaptureDisposers.set(key, () => {
    if (core.setSystemProperty === wrapper) {
      core.setSystemProperty = original
    }
  })
}

export {
  core,
  elementApis,
  hierarchyApis,
  strokeApis,
  subscribeToBrowserDragPhases,
  subscribeToDiagnosticCounters,
  getActiveAiDrawingPerformanceProfile,
  getActiveCollaborationHandle
}
export type { AiDrawingPerformanceProfile, CollaborationDebugHandle }

export { subscribeToUndo, subscribeToRedo } from '@asyra/core'
export { historyApis } from '../common-apis/history'

export { textCanvasApis } from '../common-apis/text-canvas'
