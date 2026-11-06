import { AiActionNames } from '../src/constants'
import { AiReferenceToolIds } from './ai-domain-prompt'

export interface LocalToolImage {
  path: string
  actionName: string
  image: Record<string, unknown>
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Read only canonical receipt envelopes, never arbitrary authored payloads. */
export function localToolImages(value: unknown, path = ''): LocalToolImage[] {
  if (Array.isArray(value)) {
    return localToolImages({ actionResults: value }, path).map((image) => ({
      ...image,
      path: path + image.path.slice(path.length + '/actionResults'.length)
    }))
  }

  if (!record(value)) {
    return []
  }

  const images: LocalToolImage[] = []

  if (Array.isArray(value.actionResults)) {
    value.actionResults.forEach((entry, index) => {
      if (
        record(entry) &&
        (entry.actionName === AiActionNames.INSPECT_DRAWING ||
          entry.actionName === AiReferenceToolIds.IMPORT_REFERENCE_IMAGE) &&
        record(entry.result) &&
        entry.result.available === true
      ) {
        images.push({
          path: path + '/actionResults/' + index + '/result/image',
          actionName: entry.actionName,
          image: record(entry.result.image) ? entry.result.image : {}
        })
      }
    })
  }

  if (record(value.execution)) {
    images.push(
      ...localToolImages(value.execution.value, path + '/execution/value')
    )
    if (Array.isArray(value.execution.recovery)) {
      value.execution.recovery.forEach((entry, index) => {
        if (record(entry)) {
          images.push(
            ...localToolImages(
              entry.value,
              path + '/execution/recovery/' + index + '/value'
            )
          )
        }
      })
    }
  }

  if (record(value.executionResult)) {
    images.push(
      ...localToolImages(value.executionResult, path + '/executionResult')
    )
  }

  return images
}

/** Preserve output provenance through aliases, including selected image leaves. */
export function selectLocalToolImages(
  images: readonly LocalToolImage[],
  path: string,
  name: string
): LocalToolImage[] {
  const target = '/fields/' + name.replace(/~/g, '~0').replace(/\//g, '~1')

  return images.flatMap((image) => {
    if (image.path === path || image.path.startsWith(path + '/')) {
      return [{ ...image, path: target + image.path.slice(path.length) }]
    }

    if (path === image.path + '/dataUrl') {
      return [{ ...image, path: target }]
    }

    return []
  })
}
