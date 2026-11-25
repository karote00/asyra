import { useState, type KeyboardEvent, type SyntheticEvent } from 'react'
import { AiDocumentInteractionTargetProps } from '../constants'
import ThemeToggle from './theme-toggle'
import Zoom from './zoom'
import ToolButton from './tool-button'

export interface ToolBarProps {
  readonly slotRef?: (node: HTMLDivElement | null) => void
  readonly aiOpen: boolean
  readonly aiShortcutLabel?: string
  readonly controls?: {
    includeTools: boolean
    actions: readonly { id: string; label: string; run(): Promise<void> }[]
  }
  readonly onReset?: () => Promise<void>
  readonly onAiToggle?: (invoker: HTMLButtonElement) => void
}

const stopAgentInteractionPropagation = (event: SyntheticEvent): void => {
  if (
    (event.type === 'keydown' || event.type === 'keyup') &&
    !['Enter', ' '].includes((event as KeyboardEvent).key)
  ) {
    return
  }

  event.stopPropagation()
}

const ToolBar = ({
  aiOpen,
  aiShortcutLabel,
  onAiToggle,
  slotRef,
  controls,
  onReset
}: ToolBarProps) => {
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="z-10 flex items-center justify-between px-3"
      style={{
        gridArea: 'header',
        height: '40px',
        minHeight: '40px',
        background: '#2c2c2c',
        borderBottom: '1px solid #1a1a1a'
      }}
      data-testid="toolbar"
      data-tool-dock={slotRef ? 'Toolbar' : undefined}
    >
      <div className="flex items-center gap-1">
        {(controls?.includeTools ?? true) && <ToolButton onReset={onReset} />}
        {slotRef && (
          <div
            ref={slotRef}
            data-tool-slot="toolbar.top"
            className="flex items-center min-h-6 min-w-8"
          />
        )}
        {controls?.actions.map(({ id, label, run: execute }) => (
          <button
            key={id}
            type="button"
            className="h-7 rounded px-2 text-[11px] text-white hover:bg-[#47484e] disabled:opacity-50"
            disabled={busy}
            onClick={() => void run(execute)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {onAiToggle && (
          <button
            {...AiDocumentInteractionTargetProps.AGENT_CONTROL}
            onKeyDown={stopAgentInteractionPropagation}
            onKeyUp={stopAgentInteractionPropagation}
            onMouseDown={stopAgentInteractionPropagation}
            onMouseUp={stopAgentInteractionPropagation}
            onPointerDown={stopAgentInteractionPropagation}
            onPointerUp={stopAgentInteractionPropagation}
            onTouchEnd={stopAgentInteractionPropagation}
            onTouchStart={stopAgentInteractionPropagation}
            aria-expanded={aiOpen}
            aria-label={aiOpen ? 'Close Agent' : 'Open Agent'}
            className={`flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-medium transition-colors ${
              aiOpen
                ? 'border-[#8d7bff] bg-[#745cff] text-white'
                : 'border-[#47484e] bg-[#33343a] text-[#dedee3] hover:border-[#686971] hover:bg-[#3d3e44]'
            }`}
            data-testid="ai-agent-toolbar-button"
            onClick={(event) => {
              event.stopPropagation()
              onAiToggle(event.currentTarget)
            }}
            title={
              aiShortcutLabel
                ? `Toggle Agent Panel (${aiShortcutLabel})`
                : 'Toggle Agent Panel'
            }
            type="button"
          >
            <span aria-hidden="true" className="text-[11px]">
              ✦
            </span>
            AI
          </button>
        )}
        <ThemeToggle />
        <Zoom />
      </div>
    </div>
  )
}

export default ToolBar
