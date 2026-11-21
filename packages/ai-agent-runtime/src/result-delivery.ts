import type { AiJsonValue } from './types.js'
import type { AiToolOutcome } from './tool-contract.js'
import {
  resultAt,
  type ConversationResultOrigin,
  type ConversationResultDescription,
  type ConversationResultImage,
  type ExchangeConversationResults
} from './result-context.js'
import { selectAiToolImages, type AiToolImage } from './result-media.js'

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

interface PickResult {
  step?: string
  source?: 'input'
  path: string
}
export interface DeliveryRequest {
  retain?: Record<string, PickResult>
  delivery?: 'status' | { fields: Record<string, PickResult> }
}

export function resultDelivery(
  request: DeliveryRequest,
  exchange?: ExchangeConversationResults,
  deliverImages?: (images: AiToolImage[], name: string) => void,
  readImages: (value: unknown) => AiToolImage[] = () => [],
  defaultOperation = 'operation'
) {
  const descriptions: ConversationResultDescription[] = []
  const fields: Record<string, AiJsonValue> = Object.create(null)
  const issues: string[] = []

  const selects = (step: string | undefined) =>
    [
      ...Object.values(request.retain ?? {}),
      ...Object.values(
        typeof request.delivery === 'object' ? request.delivery.fields : {}
      )
    ].some((s) => s.step === step)

  return {
    selects,

    retains: (step: string | undefined) =>
      Object.values(request.retain ?? {}).some((s) => s.step === step),

    failed: (message: string) => issues.push(message),

    async capture(
      step: string | undefined,
      view: unknown,
      blocked: ReadonlySet<string>,
      outcome: AiToolOutcome,
      input?: { value: unknown; blocked: ReadonlySet<string> },
      operation = defaultOperation
    ) {
      if (outcome.status !== 'success') {
        issues.push(
          record(view) && typeof view.message === 'string'
            ? view.message
            : 'Selected result was not successfully delivered'
        )

        return
      }

      const saved: Record<string, AiJsonValue> = Object.create(null)
      const origins: Record<string, ConversationResultOrigin> =
        Object.create(null)
      const savedImages: Record<string, ConversationResultImage[]> =
        Object.create(null)
      let images: AiToolImage[] | undefined

      for (const [retain, targets] of [
        [true, request.retain],
        [
          false,
          typeof request.delivery === 'object'
            ? request.delivery.fields
            : undefined
        ]
      ] as const) {
        for (const [name, sel] of Object.entries(targets ?? {})) {
          if (sel.step !== step) {
            continue
          }

          try {
            const value = resultAt(
              sel.source === 'input' ? input?.value : view,
              sel.path
            )
            const forbidden =
              sel.source === 'input' ? (input?.blocked ?? new Set()) : blocked

            if (retain) {
              const invalidPaths = [...forbidden].filter(
                (path) =>
                  path === sel.path ||
                  path.startsWith(sel.path + '/') ||
                  sel.path.startsWith(path + '/')
              )

              if (invalidPaths.length) {
                throw Error(
                  'Request-scoped references cannot be saved across turns: ' +
                    invalidPaths.join(', ')
                )
              }

              saved[name] = value
              if (sel.source !== 'input') {
                images ??= readImages(view)
                savedImages[name] = selectAiToolImages(
                  images,
                  sel.path,
                  'value'
                ).map((image) => {
                  const path = image.path.slice('/fields/value'.length)
                  const metadata = Object.fromEntries(
                    Object.keys(image.image)
                      .filter((key) => key !== 'dataUrl')
                      .map((key) => [
                        key,
                        resultAt(
                          image.image,
                          '/' + key.replace(/~/g, '~0').replace(/\//g, '~1')
                        )
                      ])
                  )

                  return {
                    path,
                    dataPath:
                      path +
                      (typeof resultAt(value, path) === 'string'
                        ? ''
                        : '/dataUrl'),
                    actionName: image.actionName,
                    metadata
                  }
                })
              }

              origins[name] = {
                operation,
                ...(step ? { step } : {}),
                source: sel.source ?? 'result',
                path: sel.path
              }
            } else {
              fields[name] = value
              if (sel.source !== 'input' && deliverImages) {
                images ??= readImages(view)
                deliverImages(selectAiToolImages(images, sel.path, name), name)
              }
            }
          } catch (error) {
            issues.push(
              name +
                ': ' +
                (error instanceof Error
                  ? error.message
                  : 'Result field unavailable')
            )
          }
        }
      }

      const selected = Object.keys(saved)

      if (selected.length) {
        try {
          if (!exchange) {
            throw Error('App conversation context unavailable')
          }

          const receipts = await exchange({
            save: saved,
            origins,
            images: savedImages
          })

          for (const name of selected) {
            const receipt = receipts[name]

            if (
              !record(receipt) ||
              receipt.name !== name ||
              !Array.isArray(receipt.paths)
            ) {
              throw Error('Missing saved result description: ' + name)
            }

            descriptions.push(
              receipt as unknown as ConversationResultDescription
            )
          }
        } catch (error) {
          issues.push(
            selected.join(', ') +
              ': ' +
              (error instanceof Error
                ? error.message
                : 'App result storage failed')
          )
        }
      }
    },

    finish(
      outcome: AiToolOutcome,
      completed: string[],
      errors: string[],
      stopped: string[] = []
    ) {
      if (
        outcome.status === 'success' &&
        !issues.length &&
        (descriptions.length !== Object.keys(request.retain ?? {}).length ||
          Object.keys(fields).length !==
            Object.keys(
              typeof request.delivery === 'object'
                ? request.delivery.fields
                : {}
            ).length)
      ) {
        issues.push('A selected result was unavailable')
      }

      const status =
        issues.length && outcome.status === 'success'
          ? 'partial'
          : outcome.status

      return {
        saved: descriptions,
        ...(Object.keys(fields).length ? { fields } : {}),
        ...(status !== 'success'
          ? { completed, stopped, issues: [...errors, ...issues] }
          : {}),
        toolOutcome: {
          status,
          settlement: outcome.settlement,
          issues: issues.map((message) => ({
            code: 'RESULT_DELIVERY',
            message
          }))
        }
      }
    }
  }
}

export async function readNamedFields(
  request: unknown,
  exchange?: ExchangeConversationResults,
  deliverImages?: (images: AiToolImage[], name: string) => void
) {
  if (
    !exchange ||
    !record(request) ||
    !record(request.delivery) ||
    !record(request.delivery.fields)
  ) {
    throw new Error('App result context unavailable')
  }

  const selections = request.delivery.fields as Record<
    string,
    { name: string; path: string; view?: 'shape' }
  >
  const delivered = await exchange({
    read: Object.fromEntries(
      Object.entries(selections).map(([name, selection]) => [
        name,
        { ...selection, view: selection.view ?? 'delivery' }
      ])
    )
  })
  const fields: Record<string, AiJsonValue> = Object.create(null)

  for (const name of Object.keys(selections)) {
    const receipt = delivered[name]

    if (selections[name].view === 'shape') {
      fields[name] = resultAt(receipt, '')

      continue
    }

    if (
      !record(receipt) ||
      !Object.hasOwn(receipt, 'value') ||
      !Array.isArray(receipt.images)
    ) {
      throw Error('Invalid saved result delivery')
    }

    fields[name] = resultAt(receipt, '/value')
    const images = receipt.images.map((image): AiToolImage => {
      if (
        !record(image) ||
        typeof image.path !== 'string' ||
        typeof image.dataPath !== 'string' ||
        typeof image.actionName !== 'string' ||
        !record(image.metadata)
      ) {
        throw Error('Invalid saved image provenance')
      }

      return {
        path:
          '/fields/' +
          name.replace(/~/g, '~0').replace(/\//g, '~1') +
          image.path,
        actionName: image.actionName,
        image: {
          ...image.metadata,
          dataUrl: resultAt(receipt.value, image.dataPath)
        }
      }
    })

    deliverImages?.(images, name)
  }

  return {
    saved: [],
    fields,
    toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
  }
}
