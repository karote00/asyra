import currentCore, { type Core } from '@asyra/core'
import { applyPreset, PresetProfiles } from '@asyra/preset'
import { ThreeEngine } from '@asyra/preset/spatial'
import {
  ActivityProjection,
  type ActivityEvent,
  type AgentActivity,
  readActivityEvent
} from '@asyra/preset/agent-activity'
import type { RenderEngineProvider } from '@asyra/render-engine'
import { SharedDataChannelNames, type CoreRawData } from '@asyra/utils'
import { installLayout, type OfficeStorage } from './layout-controller'
import { OfficeScene } from '../scene/office-scene'
let activeCore: Core = currentCore
const LOG_SLOT = 'asyra-office.activity.v1'
export async function createOfficeRuntime(
  host: HTMLElement,
  storage: OfficeStorage,
  provider?: RenderEngineProvider
) {
  const core = activeCore
  let disposed = false,
    renderRevision = 0
  const disposers: (() => void)[] = []
  applyPreset(core, { profile: PresetProfiles.CUSTOM, defaults: [] })
  core.setRenderEngineProvider(provider ?? (() => new ThreeEngine()))
  for (const name of [
    SharedDataChannelNames.SCENE_TREE,
    SharedDataChannelNames.PROPS
  ])
    if (!core.hasSharedDataChannel(name))
      core.registerSharedDataChannel(name, core.createLocalSharedDataChannel())
  core.setLoadSource({
    name: 'office-empty',
    load: async () =>
      ({
        version: '1.0.0',
        sceneTree: { workspace: '', workspaceList: [], elements: {} },
        props: {},
        systemContext: {}
      }) as unknown as CoreRawData
  })
  core.defineSystemProperty('office.frame', 0, { runtime: true, silent: true })
  const scene = new OfficeScene(() => {
    if (!disposed) core.setSystemProperty('office.frame', ++renderRevision)
  })
  core.registerRenderLayer(scene.registration)
  const layout = installLayout(core, storage)
  let retained: AgentActivity[] = []
  let restoring = false
  const activity = new ActivityProjection({
    append: async (events) => {
      if (restoring) return
      if (retained.length + events.length > 10000)
        throw new Error(
          'Local activity archive reached its 10000-event limit; automatic deletion is disabled'
        )
      const next = [...retained, ...events]
      storage.setItem(LOG_SLOT, JSON.stringify(next))
      retained = next
    }
  })
  activity.connect({
    id: 'sample',
    label: 'Synthetic example',
    fidelity: 'synthetic'
  })
  activity.connect({
    id: 'cooperative',
    label: 'Imported cooperative report',
    fidelity: 'cooperative'
  })
  const key = activity.key('sample', 'ari')
  disposers.push(
    activity.subscribeAgent(key, () => {
      const agent = activity.getAgent(key)
      if (agent) scene.setStatus(agent.status)
    })
  )
  let renderedLayout = layout.getSnapshot().layout
  // The canonical layout identity survives save acknowledgements. Those view-only
  // updates must not rebuild furniture, geometry or materials.
  disposers.push(
    layout.subscribe(() => {
      const next = layout.getSnapshot().layout
      if (next === renderedLayout) return
      renderedLayout = next
      scene.setLayout(next)
    })
  )
  let sequence = 0,
    attempt = 0
  const send = async (status: ActivityEvent['status']) => {
    if (disposed) throw new Error('Office runtime is closed')
    if (status === 'working') attempt++
    if (attempt === 0 && status !== 'idle')
      throw new Error('Start a synthetic task first')
    const summaries: Record<ActivityEvent['status'], string> = {
      idle: 'Ready for a new brief',
      working: 'Preparing the studio brief',
      waiting: 'Waiting for your review',
      completed: 'Studio brief completed',
      failed: 'Example task failed; review the brief',
      offline: 'Synthetic connection unavailable'
    }
    await activity.ingest([
      {
        version: 1,
        source: 'sample',
        sequence: ++sequence,
        timestamp: new Date().toISOString(),
        agentId: 'ari',
        agentName: 'Ari',
        taskId: attempt ? `sample-task-${attempt}` : null,
        attempt,
        status,
        summary: summaries[status]
      }
    ])
  }
  try {
    await core.start(host, {
      width: Math.max(host.clientWidth, 320),
      height: Math.max(host.clientHeight, 360),
      backgroundColor: 0xf2eee4
    })
    layout.initialize()
    const stored = storage.getItem(LOG_SLOT)
    if (stored) {
      const events: unknown = JSON.parse(stored)
      if (!Array.isArray(events) || events.length > 10000)
        throw new Error('Invalid saved activity archive')
      restoring = true
      for (let offset = 0; offset < events.length; offset += 1000)
        await activity.ingest(events.slice(offset, offset + 1000))
      restoring = false
      retained = events.map((value) => {
        const event = readActivityEvent(value)
        return {
          ...event,
          fidelity: event.source === 'sample' ? 'synthetic' : 'cooperative'
        }
      })
      const sample = retained.filter((event) => event.source === 'sample')
      sequence = Math.max(0, ...sample.map((event) => event.sequence))
      attempt = Math.max(0, ...sample.map((event) => event.attempt))
    }
    activity.flush()
  } catch (error) {
    disposed = true
    scene.dispose()
    activity.dispose()
    layout.dispose()
    disposers.forEach((dispose) => dispose())
    activeCore = await core.resetRuntime()
    throw error
  }
  const observer = new ResizeObserver(() => {
    if (!disposed)
      core.resizeRenderer(
        Math.max(1, host.clientWidth),
        Math.max(1, host.clientHeight)
      )
  })
  observer.observe(host)
  return {
    core,
    scene,
    layout,
    activity,
    key,
    send,
    async importReports(value: unknown) {
      if (!Array.isArray(value))
        throw new Error('Paste a JSON array of cooperative events')
      await activity.ingest(
        value.map((event) => ({ ...event, source: 'cooperative' }))
      )
    },
    async dispose() {
      if (disposed) return
      disposed = true
      observer.disconnect()
      disposers.forEach((dispose) => dispose())
      activity.dispose()
      layout.dispose()
      scene.dispose()
      activeCore = await core.resetRuntime()
    }
  }
}
export type OfficeRuntime = Awaited<ReturnType<typeof createOfficeRuntime>>
