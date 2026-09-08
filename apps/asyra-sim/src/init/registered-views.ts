import type { Core } from '@asyra/core'
import {
  SCENE_TREE_ACTIONS,
  SharedDataChannelNames,
  type PropsChange,
  type SceneTreeChange
} from '@asyra/utils'
import { ComponentTypes } from '../constants'
import { readWorkcell } from '../common-apis/workcell'
import {
  readExperiments,
  type CanonicalExperiment
} from '../common-apis/experiment'
import type { ModelLoadIssue } from '../common-apis/document'
import type { Workcell } from '../domain/workcell'
import type { RunRecord } from '../storage/run-record'

const WORKBENCH_PROPERTY = 'workbench.read-model'
export interface WorkbenchSnapshot extends Record<string, unknown> {
  candidateId: string | null
  candidates: { id: string; name: string }[]
  workcell: Workcell | null
  modelError: string
  experiments: readonly CanonicalExperiment[]
  retainedRuns: readonly RunRecord[]
  runError: string
  loadIssues: readonly ModelLoadIssue[]
  historyDepth: number
}

// This index retains only canonical identities/relationships, never editable data.
interface ElementIdentity {
  id: string
  type: string
  parentId?: string
  properties: string[]
}
export function installRegisteredViews(
  core: Core,
  readRuns: () => readonly RunRecord[],
  loadIssues: readonly ModelLoadIssue[]
) {
  let disposed = false
  const readIndex = () =>
    new Map(
      core.getAllElementData().map(({ data }) => [
        data.id,
        {
          id: data.id,
          type: data.type,
          parentId: data.parentId,
          properties: Object.values(data.props ?? {})
        } satisfies ElementIdentity
      ])
    )
  let index = readIndex()
  let propertyOwners = new Map<string, ElementIdentity>()
  const indexProperties = () => {
    propertyOwners = new Map(
      [...index.values()].flatMap((element) =>
        element.properties.map((id) => [id, element])
      )
    )
  }
  indexProperties()
  const candidates = () =>
    [...index.values()]
      .filter((element) => element.type === ComponentTypes.CANDIDATE)
      .map(({ id }) => ({ id, name: core.getElementData(id)?.name ?? '' }))
  const initialCandidates = candidates()
  // Selection intent survives temporary absence so canonical Redo can restore
  // that exact candidate without selecting another model.
  let requestedCandidate: string | null = initialCandidates[0]?.id ?? null
  core.registerUIProperty<WorkbenchSnapshot>(WORKBENCH_PROPERTY, {
    defaultValue: {
      candidateId: null,
      candidates: initialCandidates,
      workcell: null,
      modelError: '',
      experiments: [],
      retainedRuns: [],
      runError: '',
      loadIssues,
      historyDepth: core.getUndoHistoryDepth()
    }
  })
  const getSnapshot = (): WorkbenchSnapshot => {
    if (disposed) throw new Error('Runtime views are closed')
    const value = core.getUIProperty<WorkbenchSnapshot>(WORKBENCH_PROPERTY)
    if (!value)
      throw new Error('Registered workbench projection is unavailable')
    return value
  }
  const refresh = (
    workcell: boolean,
    experiments: boolean,
    runs: boolean,
    membership: boolean,
    selected = requestedCandidate
  ) => {
    const next = {
      ...getSnapshot(),
      candidateId: selected,
      historyDepth: core.getUndoHistoryDepth()
    }
    if (membership) next.candidates = candidates()
    if (!next.candidates.some(({ id }) => id === selected))
      next.candidateId = null
    if (workcell) {
      next.workcell = null
      next.modelError = ''
      try {
        if (next.candidateId)
          next.workcell = readWorkcell(core, next.candidateId)
      } catch (error) {
        next.modelError = `Cannot project this candidate: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    if (experiments) {
      next.experiments = []
      try {
        if (next.candidateId)
          next.experiments = readExperiments(core, next.candidateId)
      } catch (error) {
        next.modelError = `Cannot project experiments: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    if (runs) {
      next.retainedRuns = []
      next.runError = ''
      try {
        next.retainedRuns = readRuns()
      } catch (error) {
        next.runError = `Cannot read retained runs: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    core.setUIProperty(WORKBENCH_PROPERTY, next)
  }
  const candidateOf = (
    element: ElementIdentity,
    identities: Map<string, ElementIdentity>
  ): string | undefined => {
    let current: ElementIdentity | undefined = element
    const visited = new Set<string>()
    while (current) {
      if (current.type === ComponentTypes.CANDIDATE) return current.id
      if (visited.has(current.id)) throw new Error('Canonical hierarchy cycle')
      visited.add(current.id)
      current = identities.get(current.parentId ?? '')
    }
  }
  const stopPublication = core.subscribeToSharedPublication((publication) => {
    if (disposed) return
    const oldIndex = index
    const affected = new Set<string>()
    const propertyIds = new Set<string>()
    let topology = false
    for (const slice of publication.slices)
      for (const batch of slice.batches)
        for (const delivery of batch.deliveries) {
          if (batch.channel === SharedDataChannelNames.PROPS) {
            const change = delivery.payload as PropsChange
            if ('id' in change) propertyIds.add(change.id)
            else
              for (const property of change.data) propertyIds.add(property.id)
          }
          if (batch.channel !== SharedDataChannelNames.SCENE_TREE) continue
          const change = delivery.payload as SceneTreeChange
          if ('id' in change) affected.add(change.id)
          if (change.action === SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA) continue
          topology = true
          if ('data' in change && change.data && 'id' in change.data)
            affected.add(change.data.id)
          if ('entries' in change)
            for (const entry of change.entries) affected.add(entry.data.id)
          if ('removed' in change)
            for (const entry of change.removed) affected.add(entry.elementId)
          if ('moves' in change)
            for (const move of change.moves) affected.add(move.elementId)
        }
    for (const id of propertyIds) {
      const owner = propertyOwners.get(id)
      if (owner) affected.add(owner.id)
    }
    if (topology) {
      index = readIndex()
      indexProperties()
    }
    for (const id of propertyIds) {
      const owner = propertyOwners.get(id)
      if (owner) affected.add(owner.id)
    }
    let workcell = false,
      experiments = false,
      runs = false,
      membership = false
    const selected = requestedCandidate
    for (const id of affected)
      for (const identities of [oldIndex, index]) {
        const element = identities.get(id)
        if (!element) continue
        const candidate = candidateOf(element, identities)
        if (element.type === ComponentTypes.CANDIDATE) membership = true
        if (element.type === ComponentTypes.RUN_REFERENCE) runs = true
        if (candidate !== selected) continue
        if (
          element.type === ComponentTypes.BODY ||
          element.type === ComponentTypes.CANDIDATE
        )
          workcell = true
        if (
          element.type === ComponentTypes.EXPERIMENT ||
          element.type === ComponentTypes.CANDIDATE
        )
          experiments = true
      }
    refresh(workcell, experiments, runs, membership)
  })
  const stopHistory = core.subscribeToTransactionStatus(() => {
    if (!disposed)
      core.setUIProperty(WORKBENCH_PROPERTY, {
        ...getSnapshot(),
        historyDepth: core.getUndoHistoryDepth()
      })
  })
  refresh(true, true, true, false, initialCandidates[0]?.id ?? null)
  return {
    getSnapshot,
    selectCandidate: (id: string | null) => {
      if (id !== requestedCandidate) {
        requestedCandidate = id
        refresh(true, true, false, false)
      }
    },
    subscribe: <T>(
      selector: (snapshot: WorkbenchSnapshot) => T,
      listener: () => void
    ) => {
      let previous = selector(getSnapshot())
      return core.onUIPropertyChange<WorkbenchSnapshot>(
        WORKBENCH_PROPERTY,
        (snapshot) => {
          if (disposed) return
          const next = selector(snapshot)
          if (Object.is(previous, next)) return
          previous = next
          listener()
        }
      )
    },
    dispose: () => {
      disposed = true
      stopPublication()
      stopHistory()
      index.clear()
      propertyOwners.clear()
    }
  }
}
