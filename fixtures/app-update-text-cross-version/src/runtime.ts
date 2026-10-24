import initialCore, {
  type Core,
  runTransaction,
  undoWithRenderPolicy,
  redoWithRenderPolicy
} from '@asyra/core'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { SCENE_TREE_ACTIONS } from '@asyra/utils'
import {
  APP_FEATURE,
  STORAGE_SLOT,
  CHART_TYPE,
  CHART_UI,
  METADATA_UI,
  TEXT_TYPE,
  TYPOGRAPHY_UI,
  installText,
  installChart,
  textSchema
} from './definitions.js'
import { prepareDocument, serializeDocument } from './documents.js'

let activeCore = initialCore
const metadataKeys = [
  'approvalStatus',
  'sourceRecordId',
  'labelCategory',
  'reviewNote'
]
const controlKeys = ['text', 'fontSize', 'lineHeight', 'letterSpacing']

function installProjections(core: Core) {
  for (const [key, keys] of [
    [METADATA_UI, metadataKeys],
    [TYPOGRAPHY_UI, controlKeys]
  ] as const) {
    core.defineUIProperty<Record<string, unknown> | null>(key, {
      defaultValue: null,
      emptyValue: null,
      aggregate: true,
      triggers: {
        action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_COMPUTED_DATA,
        onSelectionChange: true
      },
      compute: ({ selectedIds, elements }) => {
        if (selectedIds.size !== 1 || elements.length !== 1) return null
        const selected = [...selectedIds][0]
        if (core.getElementMetadata(selected)?.type !== TEXT_TYPE) return null
        const values = elements[0] as unknown as Record<string, unknown>
        return Object.fromEntries(keys.map((name) => [name, values[name]]))
      }
    })
  }
  core.defineUIProperty<Record<string, unknown> | null>(CHART_UI, {
    defaultValue: null,
    emptyValue: null,
    aggregate: true,
    triggers: {
      action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_COMPUTED_DATA,
      onSelectionChange: true
    },
    compute: ({ selectedIds }) => {
      if (selectedIds.size !== 1) return null
      const selected = [...selectedIds][0]
      if (core.getElementMetadata(selected)?.type !== CHART_TYPE) return null
      const chart = core.getElementComputedData(selected) as Record<
        string,
        unknown
      >
      const source = core.getElementComputedData(
        String(chart.sourceTextId)
      ) as Record<string, unknown>
      return {
        text: chart.text,
        sourceTextId: chart.sourceTextId,
        approvalStatus: source.approvalStatus,
        sourceRecordId: source.sourceRecordId,
        labelCategory: source.labelCategory,
        reviewNote: source.reviewNote
      }
    }
  })
}

export function createDocumentRuntime(initial: unknown) {
  const core = activeCore
  applyPreset(core, {
    profile: PresetProfiles['2D'],
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
    ]
  })
  installText(core)
  installChart(core)
  installProjections(core)
  core.registerLoadHook(prepareDocument)
  core.setLoadSource({ name: 'consumer-document', load: async () => initial })
  const definition = core.getPropertyTypeDefinition('typography')
  const update = (id: string, values: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(values)) {
      const field = textSchema.fields.find((field) => field.key === key)
      if (!field?.validate?.(value)) throw new Error(`Invalid ${key}`)
    }
    return runTransaction(
      () => core.updateElementProperties([{ elementId: id, values }]),
      { failureKind: 'handler-error' }
    )
  }
  const assertText = (id: string) => {
    if (core.getElementMetadata(id)?.type !== TEXT_TYPE)
      throw new Error('Text action requires Text')
  }
  const feature = core.defineFeature(APP_FEATURE, undefined, {
    priority: 10,
    exclusive: true,
    api: {
      select(id: string) {
        core.selectElements([id])
      },
      editMetadata(id: string, values: Record<string, unknown>) {
        assertText(id)
        if (Object.keys(values).some((key) => !metadataKeys.includes(key)))
          throw new Error('Metadata fields only')
        return update(id, values)
      },
      annotate(id: string, reviewNote: string) {
        assertText(id)
        return update(id, { reviewNote })
      },
      reject(id: string) {
        assertText(id)
        return update(id, { approvalStatus: 'rejected' })
      },
      approve(id: string) {
        assertText(id)
        return update(id, { approvalStatus: 'approved' })
      },
      editTypography(id: string, values: Record<string, unknown>) {
        assertText(id)
        if (Object.keys(values).some((key) => !controlKeys.includes(key)))
          throw new Error('Typography fields only')
        return update(id, values)
      },
      renameChart(id: string, text: string) {
        if (core.getElementMetadata(id)?.type !== CHART_TYPE)
          throw new Error('Chart action requires Chart')
        return update(id, { text })
      }
    }
  })
  return {
    core,
    feature: feature.api,
    definition,
    async start(container = document.createElement('div')) {
      await core.start(container, { width: 320, height: 240 })
    },
    async save() {
      const saved = serializeDocument(await core.save())
      window.localStorage.setItem(STORAGE_SLOT, JSON.stringify(saved))
      return saved
    },
    load(input: unknown) {
      core.load(input)
    },
    async undo() {
      await undoWithRenderPolicy({ mode: 'atomic' })
    },
    async redo() {
      await redoWithRenderPolicy({ mode: 'atomic' })
    },
    async dispose() {
      activeCore = await core.resetRuntime()
    }
  }
}

export type DocumentRuntime = ReturnType<typeof createDocumentRuntime>
