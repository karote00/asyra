import { useCallback, useSyncExternalStore } from 'react'
import { useApp } from '../contexts/app.js'
import { UIProperties, type AppStatus } from '../config/ui-properties.js'
import type { ItemProjection } from '../domain/item-domain.js'
import { useProperty } from '../hooks/useProperty.js'

const emptyIds: readonly string[] = Object.freeze([])
export const useItemIds = (): readonly string[] =>
  useProperty<string[]>(UIProperties.itemIds) ?? emptyIds
export const useItem = (id: string | null): ItemProjection | undefined => {
  const { projection } = useApp()
  const subscribe = useCallback(
    (notify: () => void) =>
      id ? projection.subscribeItem(id, notify) : () => undefined,
    [projection, id]
  )
  const getSnapshot = useCallback(
    () => (id ? projection.getItem(id) : undefined),
    [projection, id]
  )
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
export const useSelectedId = (): string | null =>
  useProperty<string | null>(UIProperties.selectedId) ?? null
export const useIsSelected = (id: string): boolean => {
  const { core, ui } = useApp()
  const subscribe = useCallback(
    (notify: () => void) => ui.subscribeSelected(id, notify),
    [ui, id]
  )
  const getSnapshot = useCallback(
    () => core.getUIProperty(UIProperties.selectedId) === id,
    [core, id]
  )
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
export const useReady = (): boolean =>
  useProperty<boolean>(UIProperties.ready) ?? false
export const usePending = (): boolean =>
  useProperty<boolean>(UIProperties.pending) ?? false
export const useStatus = (): AppStatus | undefined =>
  useProperty<AppStatus>(UIProperties.status)
export const useCanvasWidth = (): number =>
  useProperty<number>(UIProperties.canvasWidth) ?? 800
