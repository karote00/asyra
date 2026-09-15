import core, {
  getPropertyComponentAccessor,
  getSessionManager,
  runTransaction,
  unregisterPropertyComponent
} from '@asyra/core'
import {
  DEFAULT_WALKING_RUNTIME_SELECTION,
  readWalkingRuntimeSelection,
  type WalkingRuntimeSelection
} from '../domain/walking-runtime-selection'
import { WalkingRobotSourceOwner } from '../domain/walking-robot-source'
import {
  WalkingRobotEnvelopeOwner,
  type WalkingStowedEnvelopeRequest
} from '../domain/walking-robot-envelopes'
import type { WalkingRobotPose } from '../domain/walking-robot-kinematics'
import type { SceneDemand } from '../simulation/scene-demand'
import {
  WalkingTransitScreen,
  type WalkingTransitAction,
  type WalkingTransitResult
} from '../simulation/walking-transit-screen'

const WalkingRuntimeIds = {
  COMPONENT: 'walking-runtime-selection',
  CHANGE: 'walking-runtime.selection.change'
} as const

export type WalkingOperatingReport =
  | Readonly<{
      format: 'walking-operating-report/1'
      identity: Readonly<object>
      status: 'legacy-view'
      selection: Extract<WalkingRuntimeSelection, { mode: 'legacy-view' }>
      demand: SceneDemand
      reasons: readonly string[]
    }>
  | Readonly<{
      format: 'walking-operating-report/1'
      identity: Readonly<object>
      status: 'ready-fast' | 'local-required' | 'unknown'
      selection: Extract<WalkingRuntimeSelection, { mode: 'walking-active' }>
      definition: Extract<
        WalkingRuntimeSelection,
        { mode: 'walking-active' }
      >['definition']
      source: NonNullable<ReturnType<WalkingRobotSourceOwner['read']>>
      profile: NonNullable<
        ReturnType<WalkingRobotSourceOwner['read']>
      >['definition']['sourceModel']
      stowedPose: WalkingRobotPose
      stowedPoseResult: ReturnType<WalkingRobotSourceOwner['evaluate']>
      envelope?: NonNullable<ReturnType<WalkingRobotEnvelopeOwner['read']>>
      load: WalkingStowedEnvelopeRequest['load']
      demand: SceneDemand
      transit?: WalkingTransitResult
      reasons: readonly string[]
    }>

const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

/** Owns the selected W2 lifetime and consumes W1 without rebuilding W1. */
export class WalkingOperatingOwner {
  readonly sourceOwner = new WalkingRobotSourceOwner()
  readonly envelopeOwner = new WalkingRobotEnvelopeOwner(this.sourceOwner)
  readonly transitScreen: WalkingTransitScreen
  private current?: WalkingOperatingReport
  private selection: WalkingRuntimeSelection = DEFAULT_WALKING_RUNTIME_SELECTION
  private request?: WalkingStowedEnvelopeRequest
  private poseResult?: ReturnType<WalkingRobotSourceOwner['evaluate']>

  constructor(
    private readonly getDemand: () => SceneDemand,
    private readonly isCurrentDemand: (demand: SceneDemand) => boolean
  ) {
    this.transitScreen = new WalkingTransitScreen(isCurrentDemand)
  }

  apply(selection: WalkingRuntimeSelection): WalkingOperatingReport {
    this.selection = selection
    return this.prepare(true)
  }

  refreshDemand(): WalkingOperatingReport {
    return this.prepare(false)
  }

  private prepare(selectionChanged: boolean): WalkingOperatingReport {
    const demand = this.getDemand()
    if (this.selection.mode === 'legacy-view') {
      if (selectionChanged) {
        this.sourceOwner.clear()
        this.envelopeOwner.clear()
        this.request = undefined
        this.poseResult = undefined
      }
      this.current = freeze({
        format: 'walking-operating-report/1',
        identity: {},
        status: 'legacy-view',
        selection: this.selection,
        demand,
        reasons: []
      })
      return this.current as WalkingOperatingReport
    }
    const source = this.sourceOwner.prepare(this.selection.definition)
    if (selectionChanged || !this.request) {
      const stowedPose = freeze({
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: source.rig.presets.stowed
      }) as WalkingRobotPose
      this.request = freeze({
        format: 'walking-stowed-envelope-request/1',
        pose: stowedPose,
        crate: { kind: 'none' },
        load: {
          kind: 'empty',
          id: `empty-load-${source.definition.definitionId}`
        }
      })
    }
    const prepared = this.envelopeOwner.prepare(source, this.request)
    const stowedPose = this.request.pose
    if (selectionChanged || !this.poseResult)
      this.poseResult = this.sourceOwner.evaluate(source, stowedPose)
    if (prepared.status === 'unavailable') {
      this.current = freeze({
        format: 'walking-operating-report/1',
        identity: {},
        status: 'unknown',
        selection: this.selection,
        definition: this.selection.definition,
        source,
        profile: source.definition.sourceModel,
        stowedPose,
        stowedPoseResult: this.poseResult,
        envelope: undefined,
        load: freeze({
          kind: 'empty',
          id: `empty-load-${source.definition.definitionId}`
        }),
        demand,
        transit: undefined,
        reasons: [prepared.reason]
      })
      return this.current as WalkingOperatingReport
    }
    this.request = prepared.request
    const base = stowedPose.base.position
    const action: WalkingTransitAction = freeze({
      identity: {},
      from: base,
      to: base
    })
    const transit = this.transitScreen.evaluate(demand, prepared, action, 0)
    this.current = freeze({
      format: 'walking-operating-report/1',
      identity: {},
      status: transit.status,
      selection: this.selection,
      definition: this.selection.definition,
      source,
      profile: source.definition.sourceModel,
      stowedPose,
      stowedPoseResult: this.poseResult,
      envelope: prepared,
      load: prepared.request.load,
      demand,
      transit,
      reasons: transit.reasons
    })
    return this.current as WalkingOperatingReport
  }

  read() {
    if (!this.current) return this.apply(this.selection)
    return this.current
  }

  isCurrent(report: WalkingOperatingReport) {
    if (
      this.current !== report ||
      this.getDemand() !== report.demand ||
      !this.isCurrentDemand(report.demand)
    )
      return false
    if (report.status === 'legacy-view') return true
    if (!this.sourceOwner.isCurrent(report.source)) return false
    return (
      !report.envelope ||
      this.envelopeOwner.read(report.source, report.envelope.request) ===
        report.envelope
    )
  }

  clear() {
    this.current = undefined
    this.request = undefined
    this.poseResult = undefined
    this.transitScreen.clear()
    this.envelopeOwner.clear()
    this.sourceOwner.clear()
  }
}

export function createWalkingOperatingWorkspace(
  getDemand: () => SceneDemand,
  isCurrentDemand: (demand: SceneDemand) => boolean,
  changed: () => void
) {
  let closed = false,
    elementId = '',
    selection = DEFAULT_WALKING_RUNTIME_SELECTION
  const owner = new WalkingOperatingOwner(getDemand, isCurrentDemand)
  let report = owner.apply(selection)
  const listeners = new Set<() => void>()
  const live = () => {
    if (closed) throw new Error('Walking operating workspace is closed')
  }
  core.definePropertyComponent({
    type: WalkingRuntimeIds.COMPONENT,
    defaults: { settings: DEFAULT_WALKING_RUNTIME_SELECTION }
  })
  core.defineComponent({
    type: WalkingRuntimeIds.COMPONENT,
    idPrefix: 'walking-runtime',
    namePrefix: 'Walking Runtime',
    properties: [
      {
        name: 'settings',
        type: WalkingRuntimeIds.COMPONENT,
        defaultValue: DEFAULT_WALKING_RUNTIME_SELECTION
      }
    ],
    renderStrategy: () => undefined
  })
  const readSelection = () => {
    const propertyId = core.getElementData(elementId)?.props?.settings
    const property = propertyId
      ? getPropertyComponentAccessor().getPropertyById(propertyId)
      : undefined
    if (!property)
      throw new Error('Missing canonical walking runtime selection')
    return readWalkingRuntimeSelection(
      (property.save() as unknown as { settings: unknown }).settings
    )
  }
  const publish = (next: WalkingRuntimeSelection) => {
    selection = next
    report = owner.apply(selection)
    changed()
    listeners.forEach((listener) => listener())
  }
  const feature = core.defineFeature(WalkingRuntimeIds.CHANGE, undefined, {
    priority: 100,
    exclusive: true,
    api: {
      apply: (raw: unknown) => {
        live()
        const next = readWalkingRuntimeSelection(raw)
        return getSessionManager().runAfterCancellingActiveSessions(
          () => core.getSystemContextSnapshot(),
          () => {
            live()
            if (JSON.stringify(next) === JSON.stringify(selection)) return
            runTransaction(() =>
              core.updateElementProperties([
                { elementId, values: { settings: next } }
              ])
            )
            publish(readSelection())
          },
          WalkingRuntimeIds.CHANGE
        )
      }
    }
  })
  return {
    owner,
    initialize: () => {
      live()
      runTransaction(() => {
        elementId = core.createElement(
          {
            type: WalkingRuntimeIds.COMPONENT,
            x: 0,
            y: 0,
            settings: selection,
            visible: false
          },
          undefined,
          undefined,
          { undoable: false }
        )
      })
    },
    getSelection: () => selection,
    get: () => report,
    isCurrent: (value: WalkingOperatingReport) =>
      !closed && owner.isCurrent(value),
    setSelection: feature.api.apply,
    refreshSelection: () => {
      live()
      const next = readSelection()
      if (JSON.stringify(next) === JSON.stringify(selection)) return false
      publish(next)
      return true
    },
    refreshDemand: () => {
      live()
      report = owner.refreshDemand()
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener: () => void) => {
      live()
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    close: () => {
      closed = true
      listeners.clear()
      owner.clear()
    },
    unregister: () => {
      core.unregisterComponent(WalkingRuntimeIds.COMPONENT)
      unregisterPropertyComponent(WalkingRuntimeIds.COMPONENT)
    }
  }
}
