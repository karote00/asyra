import {
  createContext,
  createElement,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import type { DesignElement } from './element.js'

function createEditorScope() {
  let host: DesignElement | null = null
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    getSnapshot: () => host?.editor ?? null,

    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },

    bind(board: DesignElement) {
      if (host) {
        throw new Error('Mount one board per DesignEditorProvider.')
      }

      host = board
      board.addEventListener('design-ready', notify)
      board.addEventListener('design-release', notify)
      notify()

      return () => {
        board.removeEventListener('design-ready', notify)
        board.removeEventListener('design-release', notify)
        host = null
        notify()
      }
    }
  }
}

export const EditorScope = createContext<ReturnType<
  typeof createEditorScope
> | null>(null)

/** Share one board with all consumers in this React subtree. */
export function DesignEditorProvider({ children }: { children?: ReactNode }) {
  const [scope] = useState(createEditorScope)

  return createElement(EditorScope.Provider, { value: scope }, children)
}

const emptySnapshot = () => null

/** Read the nearest provider's live editor, or null while its board is absent or loading. */
export function useDesignEditor() {
  const scope = useContext(EditorScope)

  if (!scope) {
    throw new Error(
      'Wrap this component in a DesignEditorProvider to use useDesignEditor().'
    )
  }

  return useSyncExternalStore(scope.subscribe, scope.getSnapshot, emptySnapshot)
}
