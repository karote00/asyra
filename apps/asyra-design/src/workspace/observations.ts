import { PresetSystemPropertyKeys } from '@asyra/preset'
import type { PositionData } from '@asyra/utils'
import { cloneDeep } from 'lodash'
import { getActiveCollaborationHandle } from '../collaboration/session-observation'
import core from '../contexts'

type Listener = (value: unknown) => void
type Subscribe = (listener: Listener) => () => void

// Core has sealed the registration graph when the workspace becomes ready.
export function createWorkspaceObservations() {
  const sources = new Map<string, Subscribe>()

  for (const { ref } of core.getRegistrations()) {
    if (ref.kind === 'ui-property') {
      sources.set(ref.key, (listener) =>
        core.onUIPropertyChange(ref.key, (value) => listener(cloneDeep(value)))
      )
    }
  }

  const viewportKey = PresetSystemPropertyKeys.VIEWPORT_POSITION
  const viewport = core.getSystemPropertyObservable<PositionData>(viewportKey)

  if (viewport) {
    sources.set(viewportKey, (listener) => {
      const subscription = viewport.subscribe((value) => listener({ ...value }))

      return () => subscription.unsubscribe()
    })
  }

  sources.set('collaboration', (listener) => {
    const session = getActiveCollaborationHandle()

    listener(structuredClone(session?.getSessionState() ?? null))

    return (
      session?.onSessionStateChange((state) =>
        listener(structuredClone(state))
      ) ?? (() => undefined)
    )
  })

  return {
    observeKeys: Object.freeze([...sources.keys()]),

    observe(key: string, listener: Listener) {
      const subscribe = sources.get(key)

      if (!subscribe) {
        throw new TypeError('Unknown workspace observation: ' + key)
      }

      return subscribe(listener)
    }
  }
}
