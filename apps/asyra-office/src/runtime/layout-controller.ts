import {
  runTransaction,
  getSessionManager,
  undoWithRenderPolicy,
  redoWithRenderPolicy,
  type Core
} from '@asyra/core'
import type { CoreRawData } from '@asyra/utils'
import {
  INITIAL_LAYOUT,
  readLayout,
  validLayout,
  type OfficeLayout,
  type LayoutProposal
} from '../domain/layout'
export interface OfficeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
const TYPE = 'office-room',
  PROPERTY = 'office-layout',
  FIELD = 'layout'
const SLOT = 'asyra-office.layout.v1'
export interface LayoutSnapshot {
  readonly layout: OfficeLayout
  readonly revision: number
  readonly savedRevision: number | null
}
export function installLayout(core: Core, storage: OfficeStorage) {
  core.registerPropertySchema({
    type: PROPERTY,
    fields: [
      {
        key: FIELD,
        kind: 'object',
        defaultValue: INITIAL_LAYOUT,
        validate: validLayout
      }
    ]
  })
  core.definePropertyComponent({
    type: PROPERTY,
    defaults: { layout: INITIAL_LAYOUT },
    persistKeys: [FIELD],
    valueKeys: [FIELD],
    allowDynamicKeys: false
  })
  core.defineComponent({
    type: TYPE,
    idPrefix: TYPE,
    namePrefix: 'Studio',
    isContainer: false,
    properties: [{ name: 'layoutData', type: PROPERTY, alias: [FIELD] }],
    renderStrategy: () => null
  })
  let baselineUndoDepth = 0
  let roomId = '',
    revision = 0,
    savedRevision: number | null = null,
    closed = false
  let snapshot: LayoutSnapshot = Object.freeze({
    layout: INITIAL_LAYOUT,
    revision,
    savedRevision
  })
  const listeners = new Set<() => void>()
  const assertLive = () => {
    if (closed) throw new Error('Layout is closed')
  }
  const refresh = () => {
    assertLive()
    const document = core.getCanonicalOwnerSnapshot()
    const rooms = Object.values(document.sceneTree.elements).filter(
      (element) => element.type === TYPE
    )
    if (rooms.length !== 1)
      throw new Error('Office document must contain one room')
    roomId = rooms[0].id
    const property = document.props[rooms[0].props?.layoutData ?? ''] as
      Record<string, unknown> | undefined
    const layout = readLayout(property?.layout)
    snapshot = Object.freeze({ layout, revision: ++revision, savedRevision })
    listeners.forEach((listener) => listener())
  }
  const execute = <T>(operation: () => T) =>
    getSessionManager().runAfterCancellingActiveSessions(
      () => core.getSystemContextSnapshot(),
      operation,
      'office.layout'
    )
  const apply = (proposal: LayoutProposal) => {
    assertLive()
    const layout = readLayout(proposal.layout)
    if (!proposal.author.trim() || proposal.author.length > 120)
      throw new Error('Proposal attribution is required')
    if (proposal.expectedRevision !== revision)
      throw new Error('Layout changed since preview; create a new proposal')
    runTransaction(() =>
      core.updateElementProperties([{ elementId: roomId, values: { layout } }])
    )
    refresh()
  }
  const feature = core.defineFeature('office.layout', undefined, {
    priority: 100,
    exclusive: true,
    api: {
      apply: (proposal: LayoutProposal) => {
        const input = { ...proposal, layout: readLayout(proposal.layout) }
        return execute(() => apply(input))
      },
      undo: () =>
        execute(async () => {
          if (core.getUndoHistoryDepth() <= baselineUndoDepth) return
          await undoWithRenderPolicy({ mode: 'atomic' })
          refresh()
        }),
      redo: () =>
        execute(async () => {
          await redoWithRenderPolicy({ mode: 'atomic' })
          refresh()
        })
    }
  })
  return {
    initialize() {
      assertLive()
      runTransaction(() => {
        roomId = core.createElement({ type: TYPE, name: 'Studio', x: 0, y: 0 })
      })
      baselineUndoDepth = core.getUndoHistoryDepth()
      refresh()
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    propose(layout: OfficeLayout, author: string): LayoutProposal {
      return Object.freeze({
        expectedRevision: revision,
        author,
        layout: readLayout(layout)
      })
    },
    apply: feature.api.apply,
    undo: feature.api.undo,
    redo: feature.api.redo,
    async save() {
      assertLive()
      const capturedRevision = revision
      const document = await core.save()
      assertLive()
      storage.setItem(SLOT, JSON.stringify({ version: 1, document }))
      savedRevision = capturedRevision
      snapshot = Object.freeze({ ...snapshot, savedRevision })
      listeners.forEach((listener) => listener())
    },
    async reload() {
      assertLive()
      const raw = storage.getItem(SLOT)
      if (!raw) throw new Error('No saved Office layout')
      const wrapper = JSON.parse(raw) as {
        version: number
        document: CoreRawData
      }
      if (
        wrapper.version !== 1 ||
        !wrapper.document?.sceneTree ||
        !wrapper.document.props
      )
        throw new Error('Invalid Office document')
      const rooms = Object.values(wrapper.document.sceneTree.elements).filter(
        (element) => element.type === TYPE
      )
      if (rooms.length !== 1)
        throw new Error('Office document must contain one room')
      const data = wrapper.document.props[rooms[0].props?.layoutData ?? ''] as
        Record<string, unknown> | undefined
      readLayout(data?.layout)
      const issues = core.preflightLoad(wrapper.document)
      if (issues.length)
        throw new Error('Saved document failed Core validation')
      await execute(() => {
        assertLive()
        core.load(wrapper.document)
        baselineUndoDepth = core.getUndoHistoryDepth()
        refresh()
        savedRevision = revision
        snapshot = Object.freeze({ ...snapshot, savedRevision })
        listeners.forEach((listener) => listener())
      })
    },
    dispose() {
      closed = true
      listeners.clear()
    }
  }
}
export type LayoutController = ReturnType<typeof installLayout>
