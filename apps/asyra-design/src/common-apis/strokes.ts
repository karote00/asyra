import { CommonApiInputError } from './common-api-input-error'
import {
  PropertyTypes,
  createDefaultStroke,
  id,
  isRecord,
  type EVENT_OPTIONS,
  type StrokeAttrs
} from '@asyra/utils'
import type { ElementPropertyPatchUpdate } from '@asyra/core'
import { STROKE_PATCH_KEYS, type StrokeWritableKey } from '../constants'
import core from '../contexts'
import { transactionApis } from './transaction'
import { mutationReceipt, type MutationReceipt } from './mutation-receipt'

export type StrokePatch = Partial<Pick<StrokeAttrs, StrokeWritableKey>>

export interface StrokeFieldsUpdate {
  readonly elementId: string
  readonly strokeId: string
  readonly patch: StrokePatch
}

export interface PrimaryStrokeColorUpdate {
  readonly color: string
  readonly elementId: string
}

const createStrokeRecordPatch = (
  elementId: string,
  strokeId: string,
  fields: Readonly<Record<string, unknown>>
): ElementPropertyPatchUpdate => {
  const recordFields: Record<string, unknown> = {}

  for (const key of STROKE_PATCH_KEYS) {
    const value = fields[key]

    if (value !== undefined) {
      recordFields[key] = value
    }
  }

  return {
    elementId,
    records: [
      {
        key: PropertyTypes.STROKES,
        set: {
          [strokeId]: recordFields
        }
      }
    ]
  }
}

const getPrimaryStroke = (elementId: string): StrokeAttrs | null => {
  const computed = core.getElementComputedData(elementId) as
    { strokes?: unknown } | undefined

  if (!Array.isArray(computed?.strokes)) {
    return null
  }

  const stroke = computed.strokes[0]

  return stroke && typeof stroke === 'object' ? (stroke as StrokeAttrs) : null
}

export const strokeApis = {
  addStroke: (
    elementId: string,
    options?: EVENT_OPTIONS
  ): MutationReceipt<string | null> => {
    if (!core.getElementData(elementId)) {
      return mutationReceipt(null, { acceptedIds: [], changed: false }, [
        elementId
      ])
    }

    const stroke = createDefaultStroke({ id: id('stroke') })
    const evidence = transactionApis.runTransaction(() => {
      return core.patchElementProperties(
        [createStrokeRecordPatch(elementId, stroke.id, { ...stroke })],
        options
      )
    })

    return mutationReceipt(stroke.id, evidence)
  },

  removeStroke: (
    elementId: string,
    strokeId: string,
    options?: EVENT_OPTIONS
  ): MutationReceipt<boolean> => {
    const computed = core.getElementComputedData(elementId) as
      { strokes?: unknown } | undefined
    const strokes = computed?.strokes

    if (
      !strokeId ||
      !Array.isArray(strokes) ||
      !strokes.some(
        (candidate) =>
          candidate &&
          typeof candidate === 'object' &&
          (candidate as { id?: unknown }).id === strokeId
      )
    ) {
      return mutationReceipt(false, { acceptedIds: [], changed: false }, [
        elementId
      ])
    }

    const evidence = transactionApis.runTransaction(() => {
      return core.patchElementProperties(
        [
          {
            elementId,
            records: [
              {
                key: PropertyTypes.STROKES,
                remove: [strokeId]
              }
            ]
          }
        ],
        options
      )
    })

    return mutationReceipt(true, evidence)
  },

  getPrimaryStrokeColor: (elementId: string): string | null => {
    const stroke = getPrimaryStroke(elementId)

    return typeof stroke?.fill?.color === 'string' ? stroke.fill.color : null
  },

  updatePrimaryStrokeColors: (
    updates: readonly PrimaryStrokeColorUpdate[],
    options?: EVENT_OPTIONS
  ): readonly ('changed' | 'unchanged' | 'unavailable')[] => {
    const results: ('changed' | 'unchanged' | 'unavailable')[] = []
    const prepared = updates.map(({ color, elementId }) => {
      const stroke = getPrimaryStroke(elementId)

      if (!stroke || typeof color !== 'string' || color.length === 0) {
        results.push('unavailable')

        return null
      }

      if (stroke.fill.color === color) {
        results.push('unchanged')

        return null
      }

      results.push('changed')

      return {
        elementId,
        nextStroke: {
          ...stroke,
          fill: {
            ...stroke.fill,
            color
          }
        },
        strokeId: stroke.id
      }
    })

    if (!prepared.some((update) => update !== null)) {
      return Object.freeze(results)
    }

    transactionApis.runTransaction(() => {
      core.patchElementProperties(
        prepared.flatMap((update) =>
          update
            ? [
                createStrokeRecordPatch(update.elementId, update.strokeId, {
                  ...update.nextStroke
                })
              ]
            : []
        ),
        options
      )
    })

    return Object.freeze(results)
  },

  updatePrimaryStrokeColor: (
    elementId: string,
    color: string,
    options?: EVENT_OPTIONS
  ): boolean =>
    strokeApis.updatePrimaryStrokeColors(
      [
        {
          color,
          elementId
        }
      ],
      options
    )[0] === 'changed',

  updateStrokeFieldsBatch: (
    updates: readonly StrokeFieldsUpdate[],
    options?: EVENT_OPTIONS
  ): MutationReceipt<null> => {
    const targets = new Map<string, Set<string>>()
    const patches: ElementPropertyPatchUpdate[] = []

    for (const { elementId, strokeId, patch } of updates) {
      if (
        !isRecord(patch) ||
        Object.keys(patch).some(
          (key) => !(STROKE_PATCH_KEYS as readonly string[]).includes(key)
        )
      ) {
        throw new CommonApiInputError('Invalid Stroke patch field', {
          field: 'patch',
          elementId,
          strokeId
        })
      }

      if (!targets.has(elementId)) {
        const strokes = core.getElementComputedData(elementId, [
          'strokes'
        ])?.strokes

        targets.set(
          elementId,
          new Set(
            Array.isArray(strokes) ? strokes.map((stroke) => stroke.id) : []
          )
        )
      }

      if (!strokeId || !targets.get(elementId)?.has(strokeId)) {
        throw new CommonApiInputError(
          `Missing Stroke ${strokeId} on ${elementId}`,
          { field: 'strokeId', elementId, strokeId }
        )
      }

      if (!Object.values(patch).some((value) => value !== undefined)) {
        continue
      }

      patches.push(createStrokeRecordPatch(elementId, strokeId, patch))
    }

    if (!patches.length) {
      return mutationReceipt(null, {
        acceptedIds: [...new Set(updates.map(({ elementId }) => elementId))],
        changed: false
      })
    }

    const evidence = transactionApis.runTransaction(() =>
      core.patchElementProperties(patches, options)
    )

    return mutationReceipt(null, {
      acceptedIds: [...new Set(updates.map(({ elementId }) => elementId))],
      changed: evidence.changed
    })
  },

  updateStrokeFields: (
    elementId: string,
    strokeId: string,
    patch: StrokePatch,
    options?: EVENT_OPTIONS
  ) =>
    strokeApis.updateStrokeFieldsBatch(
      [{ elementId, strokeId, patch }],
      options
    ),

  updateStrokeField: <K extends StrokeWritableKey>(
    elementId: string,
    strokeId: string,
    key: K,
    value: StrokeAttrs[K],
    options?: EVENT_OPTIONS
  ) =>
    strokeApis.updateStrokeFields(
      elementId,
      strokeId,
      { [key]: value } as StrokePatch,
      options
    )
}
