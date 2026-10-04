import { useCallback, useSyncExternalStore } from 'react'
import { useApp } from '../contexts/app.js'

// React owns each listener's lifetime. No module-global signal/subscription cache.
export const useProperty = <T>(key: string | null): T | undefined => {
  const { core } = useApp()
  const subscribe = useCallback(
    (notify: () => void) =>
      key ? core.onUIPropertyChange(key, notify) : () => undefined,
    [core, key]
  )
  const getSnapshot = useCallback(
    () => (key ? (core.getUIProperty(key) as T | undefined) : undefined),
    [core, key]
  )
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
