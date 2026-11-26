import { UIItems } from '../workspace/ui-parts'
import type { WorkspaceChild } from '../workspace/component-registry'
import type { ReactNode } from 'react'
import { featureEnabled, toolId } from '../workspace-features'
import { useCallback } from 'react'
import { Icon, type IconName } from '@asyra/design-system'
import { usePrimaryTool } from '../providers'
import { switchPrimaryTool } from '../controllers/app'
import { PrimaryToolType } from '../constants'
import { resetStoredDocument } from './reset-stored-document'

const tools = [
  { tool: PrimaryToolType.SELECT, label: 'Select', key: 'V', icon: 'Select' },
  {
    tool: PrimaryToolType.RECTANGLE,
    label: 'Rectangle',
    key: 'R',
    icon: 'Rect'
  },
  { tool: PrimaryToolType.OVAL, label: 'Oval', key: 'O', icon: 'Oval' },
  { tool: PrimaryToolType.PEN, label: 'Pen', key: 'P', icon: 'Pen' },
  { tool: PrimaryToolType.TEXT, label: 'Text', key: 'T', icon: 'Text' }
] satisfies {
  tool: PrimaryToolType
  label: string
  key: string
  icon: IconName
}[]

const ToolButton = ({
  onReset = resetStoredDocument
}: {
  onReset?: () => Promise<void>
}) => {
  const primaryTool = usePrimaryTool()

  const handleReset = useCallback(() => {
    void onReset().catch((error: unknown) => {
      console.error('[toolbar.reset] Stored document Reset failed:', error)
    })
  }, [onReset])

  const buttons = {
    resetButton: featureEnabled('reset') && (
      <>
        <button
          aria-label="Reset document"
          className="tool-btn"
          data-toolbar-action="reset"
          data-testid="reset-button"
          onClick={handleReset}
          title="Reset document"
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
          >
            <path
              d="M3.5 5.5A5 5 0 1 1 3 9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <path
              d="M3.5 2.5v3h3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <div
          aria-hidden="true"
          className="mx-1 h-5 w-px bg-[#4a4a4a]"
          data-testid="reset-separator"
        />
      </>
    ),
    ...Object.fromEntries(
      tools.map(({ tool, label, key, icon }) => [
        toolId(tool) + 'ToolIcon',
        featureEnabled(toolId(tool)) && (
          <button
            key={tool}
            type="button"
            aria-label={tool === PrimaryToolType.TEXT ? label : undefined}
            aria-pressed={primaryTool === tool}
            className={`tool-btn ${primaryTool === tool ? 'active' : ''}`}
            onClick={() => switchPrimaryTool(tool)}
            data-toolbar-action={toolId(tool)}
            data-testid={'tool-' + toolId(tool)}
            data-active={primaryTool === tool}
            title={`${label} (${key})`}
          >
            <Icon name={icon} />
          </button>
        )
      ])
    )
  }

  return (
    <div className="flex items-center gap-1">
      <UIItems
        id="drawingTools"
        parts={buttons as Record<WorkspaceChild<'drawingTools'>, ReactNode>}
      />
    </div>
  )
}

export default ToolButton
