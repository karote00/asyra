import {
  localToolImages,
  selectLocalToolImages,
  type LocalToolImage
} from './local-tool-media'
import { containsExpression } from './local-design-sequence'
import type { AiJsonValue, AiToolOutcome } from '@asyra/ai-agent-runtime'
import {
  validResultName,
  resultAt,
  type ConversationResultOrigin,
  type ConversationResultDescription,
  type ConversationResultImage,
  type ExchangeConversationResults
} from '../src/ai/conversation-results'
import { LocalToolInputError } from './local-tool-invocation'

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

// A name from an earlier step in the same submission compiles to an ordinary
// dependency. Older snapshots are fetched in one private browser exchange.
export async function resolveConversationInputs(
  input: Record<string, unknown>,
  exchange?: ExchangeConversationResults,
  authoredInput?: (operation: Record<string, unknown>) => unknown
) {
  const ops = input.operations ?? input.stages

  if (!Array.isArray(ops)) {
    return input
  }

  const plan = input as DeliveryRequest
  const producers = new Map(Object.entries(plan.retain ?? {}))

  for (const [name, selector] of producers) {
    if (
      !validResultName(name) ||
      !record(selector) ||
      typeof selector.path !== 'string' ||
      (selector.path !== '' &&
        (!selector.path.startsWith('/') || /~(?![01])/.test(selector.path)))
    ) {
      throw new LocalToolInputError('Invalid name or selection path')
    }
  }

  const selections = new Map<string, { name: string; path: string }>()
  const resolving = new Set<string>()
  const pending: {
    key: string
    assign: (value: unknown) => void
  }[] = []

  // Copy only ancestors of a reference. Keep large, ready geometry by reference.
  const visit = (v: unknown, assign: (value: unknown) => void): void => {
    if (!v || typeof v !== 'object') {
      return
    }

    if (record(v) && v.kind === 'literal') {
      return
    }

    if (record(v) && v.kind === 'named') {
      if (
        typeof v.name !== 'string' ||
        !validResultName(v.name) ||
        Object.keys(v).some((k) => !['kind', 'name', 'path'].includes(k))
      ) {
        throw new LocalToolInputError('Invalid named result reference')
      }

      const path = v.path ?? ''

      if (typeof path !== 'string' || (path !== '' && !path.startsWith('/'))) {
        throw new LocalToolInputError('Invalid named result path')
      }

      const alias = producers.get(v.name)

      if (alias?.step && alias.source === 'input') {
        const operations = input.stages
          ? (
              input.stages as {
                id: string
                operations: Record<string, unknown>[]
                apply: Record<string, unknown>[]
              }[]
            ).flatMap((stage) => [
              ...stage.operations.map((s, i) => ({
                ...s,
                id: s.id ?? stage.id + '-prepare-' + (i + 1)
              })),
              ...stage.apply.map((s, i) => ({
                ...s,
                id: s.id ?? stage.id + '-apply-' + (i + 1)
              }))
            ])
          : (ops as Record<string, unknown>[])
        const source = operations.find(
          (operation, i) => (operation.id ?? 'step-' + (i + 1)) === alias.step
        )

        if (!source || !authoredInput || resolving.has(v.name)) {
          throw new LocalToolInputError(
            'Unavailable or cyclic authored input: ' + v.name
          )
        }

        resolving.add(v.name)
        const value = resultAt(authoredInput(source), alias.path + path)

        assign(value)
        visit(value, assign)
        resolving.delete(v.name)

        return
      }

      if (alias?.step) {
        assign({ kind: 'step', step: alias.step, path: alias.path + path })

        return
      }

      const key = JSON.stringify([v.name, path])

      selections.set(key, { name: v.name, path })
      pending.push({
        key,

        assign: (value) =>
          assign(containsExpression(value) ? { kind: 'literal', value } : value)
      })

      return
    }

    let copy: Record<string, unknown> | undefined

    for (const [k, i] of Object.entries(v)) {
      visit(i, (value) => {
        if (!copy) {
          copy = (Array.isArray(v) ? [...v] : { ...v }) as Record<
            string,
            unknown
          >
          assign(copy)
        }

        Object.defineProperty(copy, k, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        })
      })
    }
  }

  const rewritten = { ...input }

  visit(ops, (v) => {
    rewritten[input.stages ? 'stages' : 'operations'] = v
  })
  if (input.iteration) {
    visit(input.iteration, (v) => {
      rewritten.iteration = v
    })
  }

  if (selections.size) {
    if (!exchange) {
      throw new Error('App conversation context unavailable')
    }

    const values = await exchange({ read: Object.fromEntries(selections) })

    for (const { key, assign } of pending) {
      if (!Object.hasOwn(values, key)) {
        throw new Error('Missing requested App result')
      }

      assign(values[key])
    }
  }

  return rewritten
}

export function resultDelivery(
  request: DeliveryRequest,
  exchange?: ExchangeConversationResults,
  deliverImages?: (images: LocalToolImage[], name: string) => void
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
      operation = 'execute_design'
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
      let images: LocalToolImage[] | undefined

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
                images ??= localToolImages(view)
                savedImages[name] = selectLocalToolImages(
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
                images ??= localToolImages(view)
                deliverImages(
                  selectLocalToolImages(images, sel.path, name),
                  name
                )
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
  deliverImages?: (images: LocalToolImage[], name: string) => void
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
    const images = receipt.images.map((image): LocalToolImage => {
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
