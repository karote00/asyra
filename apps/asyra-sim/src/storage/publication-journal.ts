import type {
  CanonicalChange,
  SharedPublication,
  SharedPublicationSlice,
  SharedPublicationBatch,
  SharedPublicationDelivery
} from '@asyra/core/contracts'
import {
  PROPS_ACTIONS,
  SCENE_TREE_ACTIONS,
  SharedDataChannelNames,
  type PropsChange,
  type SceneTreeChange,
  type PropertyComponentRawData,
  type ElementRawData,
  type UpdateElementDataChange
} from '@asyra/utils'
import { PropertyFields } from '../constants'
import type { ProjectSnapshot } from './project-format'

export interface JournalResources {
  runs?: ProjectSnapshot['runs']
  visualSources?: ProjectSnapshot['visualSources']
  observationSources?: ProjectSnapshot['observationSources']
}
export interface PreparedPublication {
  origin: SharedPublication['origin']
  slices: readonly (readonly CanonicalChange[])[]
}
export interface JournalEntry {
  version: 1
  publication: SharedPublication
  resources: JournalResources
}

/** Sim uses registered object values, not generic record-collection patches. */
export function canonicalPublicationSlices(
  publication: SharedPublication
): readonly (readonly CanonicalChange[])[] {
  if (
    !publication ||
    typeof publication.publicationId !== 'string' ||
    !publication.publicationId ||
    !Array.isArray(publication.slices) ||
    !publication.slices.length
  )
    throw new Error('Invalid local document publication')
  if (
    !['atomic', 'progressive'].includes(publication.mode) ||
    ![
      'action',
      'automation',
      'undo',
      'redo',
      'load-migration',
      'rollback-compensation'
    ].includes(publication.origin)
  )
    throw new Error('Unsupported publication policy')
  const slices =
    publication.mode === 'atomic'
      ? [
          {
            ...publication.slices[0],
            batches: publication.slices.flatMap((slice) => slice.batches)
          }
        ]
      : publication.slices
  return slices.map((slice: SharedPublicationSlice) => {
    if (!Array.isArray(slice.batches) || !slice.batches.length)
      throw new Error('Missing publication batches')
    const properties = new Map<string, PropertyComponentRawData>()
    const deliveries = slice.batches.flatMap(
      (batch: SharedPublicationBatch) => {
        if (
          ![
            SharedDataChannelNames.PROPS,
            SharedDataChannelNames.SCENE_TREE
          ].includes(batch.channel as typeof SharedDataChannelNames.PROPS)
        )
          throw new Error('Non-document publication channel')
        if (!Array.isArray(batch.deliveries))
          throw new Error('Invalid publication deliveries')
        return batch.deliveries.map((delivery: SharedPublicationDelivery) => ({
          channel: batch.channel,
          change: delivery.payload as PropsChange | SceneTreeChange
        }))
      }
    )
    for (const { channel, change } of deliveries) {
      if (!change || typeof change !== 'object')
        throw new Error('Invalid publication change')
      if (
        channel === SharedDataChannelNames.PROPS &&
        change.action === PROPS_ACTIONS.ADD_PROPERTY
      )
        for (const property of (
          change as PropsChange & { data: PropertyComponentRawData[] }
        ).data)
          properties.set(property.id, property)
    }
    const takeProperties = (elements: readonly ElementRawData[]) =>
      elements.flatMap((element) =>
        Object.values(element.props ?? {}).map((id) => {
          const property = properties.get(id)
          if (!property) throw new Error(`Missing creation property ${id}`)
          properties.delete(id)
          return property
        })
      )
    const changes: CanonicalChange[] = []
    for (const { channel, change } of deliveries) {
      if (channel === SharedDataChannelNames.PROPS) {
        const value = change as PropsChange
        if (
          value.action === PROPS_ACTIONS.ADD_PROPERTY ||
          value.action === PROPS_ACTIONS.REMOVE_PROPERTY
        )
          continue
        if (
          value.action !== PROPS_ACTIONS.UPDATE_PROPERTY ||
          !('id' in value) ||
          typeof value.key !== 'string'
        )
          throw new Error('Unsupported property publication')
        changes.push({
          kind: 'property-components',
          updates: [
            { propertyId: value.id, values: { [value.key]: value.after } }
          ]
        })
        continue
      }
      const value = change as SceneTreeChange
      switch (value.action) {
        case SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA:
          {
            const data = value as UpdateElementDataChange
            changes.push({
              kind: 'element-data',
              changes: [
                {
                  action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
                  eventName: data.eventName,
                  id: data.id,
                  changes: data.changes.map(({ key, before, after }) => ({
                    key,
                    before,
                    after
                  }))
                }
              ]
            })
          }
          break
        case SCENE_TREE_ACTIONS.MOVE_ELEMENTS:
          if (!('moves' in value))
            throw new Error('Invalid hierarchy publication')
          changes.push({ kind: 'hierarchy-moves', moves: value.moves })
          break
        case SCENE_TREE_ACTIONS.ADD_ELEMENT:
        case SCENE_TREE_ACTIONS.ADD_ELEMENTS: {
          let entries: readonly {
            data: ElementRawData
            parentId?: string
            index?: number
          }[] = []
          if ('entries' in value) entries = value.entries
          else if ('data' in value)
            entries = [
              { data: value.data, parentId: value.parentId, index: value.index }
            ]
          if (!entries.length) throw new Error('Missing created elements')
          for (const entry of entries) {
            if (
              typeof entry.parentId !== 'string' ||
              !Number.isInteger(entry.index)
            )
              throw new Error('Missing canonical insertion location')
            changes.push({
              kind: 'element-creation',
              elements: [entry.data],
              properties: takeProperties([entry.data]),
              parentId: entry.parentId,
              index: entry.index as number
            })
          }
          break
        }
        case SCENE_TREE_ACTIONS.REMOVE_ELEMENT:
        case SCENE_TREE_ACTIONS.REMOVE_ELEMENTS: {
          let entries: readonly {
            data: ElementRawData
            parentId?: string
            index?: number
          }[] = []
          if ('entries' in value) entries = value.entries
          else if ('data' in value)
            entries = [
              { data: value.data, parentId: value.parentId, index: value.index }
            ]
          if (!entries.length) throw new Error('Missing removed elements')
          for (const entry of entries) {
            if (
              typeof entry.parentId !== 'string' ||
              !Number.isInteger(entry.index)
            )
              throw new Error('Missing canonical removal location')
            changes.push({
              kind: 'element-removal',
              removals: [
                {
                  data: entry.data,
                  parentId: entry.parentId,
                  index: entry.index as number
                }
              ]
            })
          }
          break
        }
        case SCENE_TREE_ACTIONS.REMOVE_SUBTREE:
        case SCENE_TREE_ACTIONS.RESTORE_SUBTREE: {
          if (!('removed' in value))
            throw new Error('Invalid subtree publication')
          if (value.action === SCENE_TREE_ACTIONS.REMOVE_SUBTREE)
            changes.push({
              kind: 'subtree-removal',
              change: {
                action: value.action,
                undoAction: value.undoAction,
                eventName: value.eventName,
                elementId: value.elementId,
                removed: value.removed,
                rootParentChildrenAfter: value.rootParentChildrenAfter
              }
            })
          else
            changes.push({
              kind: 'subtree-restore',
              sceneSnapshot: {
                elementId: value.elementId,
                removed: value.removed,
                rootParentChildrenAfter: value.rootParentChildrenAfter
              },
              propsSnapshot: {
                components: takeProperties(
                  value.removed.map((item) => item.data)
                )
              }
            })
          break
        }
        default:
          throw new Error('Unsupported canonical scene publication')
      }
    }
    if (properties.size)
      throw new Error(
        `Unowned creation properties in publication: ${[...properties.values()].map((item) => item.type).join(', ')}; actions: ${deliveries.map(({ change }) => change.action).join(', ')}`
      )
    return changes
  })
}

export function validateJournalEntry(
  entry: JournalEntry
): readonly (readonly CanonicalChange[])[] {
  if (
    entry.version !== 1 ||
    !entry.resources ||
    typeof entry.resources !== 'object'
  )
    throw new Error('Unsupported local journal entry')
  return canonicalPublicationSlices(entry.publication)
}

/** Only admitted after-values can introduce new resource references. */
export function publicationReferences(publication: SharedPublication) {
  const visuals = new Set<string>(),
    runs = new Set<string>(),
    observations = new Set<string>()
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    const record = value as Record<string, unknown>
    if (Array.isArray(record.visuals))
      for (const binding of record.visuals) visuals.add(binding.assetId)
    if (typeof record.runId === 'string') runs.add(record.runId)
    if (Array.isArray(record.observations))
      for (const note of record.observations)
        for (const attachment of note.attachments ?? [])
          observations.add(attachment.sourceId)
  }
  for (const slice of publication.slices)
    for (const batch of slice.batches) {
      if (batch.channel !== SharedDataChannelNames.PROPS) continue
      for (const { payload } of batch.deliveries) {
        const change = payload as PropsChange
        if ('after' in change) visit(change.after)
        else if (change.action === PROPS_ACTIONS.ADD_PROPERTY)
          for (const property of change.data) {
            const record = property as unknown as Record<string, unknown>
            visit(record[PropertyFields.BODY])
            visit(record[PropertyFields.RUN_REFERENCE])
          }
      }
    }
  return { visuals, runs, observations }
}

export function resourceKeys(resources: JournalResources): Set<string> {
  return new Set([
    ...(resources.runs ?? []).map((run) => `run:${run.result.runId}`),
    ...(resources.visualSources ?? []).map(
      (source) => `visual:${source.assetId}`
    ),
    ...(resources.observationSources ?? []).map(
      (source) => `observation:${source.sourceId}`
    )
  ])
}

export function restoreJournal(
  checkpoint: ProjectSnapshot,
  entries: readonly JournalEntry[]
): ProjectSnapshot {
  if (!entries.length) return checkpoint
  const runs = new Map(
    (checkpoint.runs ?? []).map((run) => [run.result.runId, run])
  )
  const visuals = new Map(
    (checkpoint.visualSources ?? []).map((source) => [source.assetId, source])
  )
  const observations = new Map(
    (checkpoint.observationSources ?? []).map((source) => [
      source.sourceId,
      source
    ])
  )
  const seen = new Set<string>()
  const replay: PreparedPublication[] = []
  for (const entry of entries) {
    replay.push({
      origin: entry.publication.origin,
      slices: validateJournalEntry(entry)
    })
    if (seen.has(entry.publication.publicationId))
      throw new Error('Duplicate journal publication')
    seen.add(entry.publication.publicationId)
    const merge = <T>(map: Map<string, T>, id: string, value: T) => {
      if (map.has(id) && JSON.stringify(map.get(id)) !== JSON.stringify(value))
        throw new Error('Conflicting immutable journal resource')
      map.set(id, value)
    }
    for (const run of entry.resources.runs ?? [])
      merge(runs, run.result.runId, run)
    for (const source of entry.resources.visualSources ?? [])
      merge(visuals, source.assetId, source)
    for (const source of entry.resources.observationSources ?? [])
      merge(observations, source.sourceId, source)
  }
  return {
    ...checkpoint,
    runs: [...runs.values()],
    visualSources: [...visuals.values()],
    observationSources: [...observations.values()],
    replay
  }
}
