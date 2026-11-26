import { UIItems, useLayoutPart } from '../workspace/ui-parts'
import { flushSync } from 'react-dom'
import { ContextMenu } from '@asyra/design-system'
import type {
  AppContextMenuSession,
  AppContextMenuSessionDismissReason
} from './context-menu-session'

export interface CanvasContextMenuCommandDescriptor {
  readonly id: string
  readonly label: string
  readonly ariaLabel: string
  readonly shortcutLabel: string
  readonly enabled: boolean
  readonly restoreInvokerFocusOnActivation?: boolean
  readonly execute: () => unknown
}

interface GroupContextMenuProps {
  session: AppContextMenuSession | null
  descriptors: readonly CanvasContextMenuCommandDescriptor[]
  onDismiss: (reason: AppContextMenuSessionDismissReason) => void
}

export const GroupContextMenu = ({
  session,
  descriptors,
  onDismiss
}: GroupContextMenuProps) => {
  const layout = useLayoutPart('canvasMenu')

  if (!session) {
    return null
  }

  return (
    <ContextMenu
      data-context-menu="canvas"
      aria-label="Canvas commands"
      inline={Boolean(
        layout?.target('canvasMenu') || layout?.target('workspace')
      )}
      composeItems={
        layout &&
        ((buttons) => (
          <UIItems
            id="canvasMenu"
            parts={{
              groupCommand: buttons.get('group'),
              ungroupCommand: buttons.get('ungroup')
            }}
          />
        ))
      }
      items={descriptors.map((descriptor) => ({
        id: descriptor.id,
        label: descriptor.label,
        shortcut: descriptor.shortcutLabel,
        enabled: descriptor.enabled
      }))}
      position={{ x: session.clientX, y: session.clientY }}
      viewport={session.viewport}
      onActivate={(itemId) => {
        const descriptor = descriptors.find(({ id }) => id === itemId)

        if (!descriptor?.enabled) {
          return
        }

        flushSync(() =>
          onDismiss(
            descriptor.restoreInvokerFocusOnActivation === false
              ? 'activation-without-focus-restore'
              : 'activation'
          )
        )
        descriptor.execute()
      }}
      onDismiss={onDismiss}
    />
  )
}
