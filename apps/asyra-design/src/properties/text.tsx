import { useEffect, useSyncExternalStore } from 'react'
import { textCanvasApis } from '../common-apis/text-canvas'
import { getFeature } from '@asyra/core'
import { FeatureNames } from '../constants'
import { TEXT_PROPERTY_TYPE, type TextData } from '@asyra/preset'
import { useProperty } from '../hooks'
import {
  updateSelectedElementProperties,
  updateSelectedTextStyle
} from '../controllers/scene-tree'
import Header from './header'
import { TextField } from './text-field'
import { FontFamilySelect, TextSelect } from './text-select'

const alignmentPaths = {
  left: 'M3 4h12M3 8h8M3 12h12M3 16h8',
  center: 'M3 4h12M5 8h8M3 12h12M5 16h8',
  right: 'M3 4h12M7 8h8M3 12h12M7 16h8'
} as const

const fontStyles = [
  {
    id: 'regular',
    label: 'Regular',
    fontWeight: 'normal',
    fontStyle: 'normal'
  },
  { id: 'italic', label: 'Italic', fontWeight: 'normal', fontStyle: 'italic' },
  { id: 'bold', label: 'Bold', fontWeight: 'bold', fontStyle: 'normal' },
  {
    id: 'bold-italic',
    label: 'Bold Italic',
    fontWeight: 'bold',
    fontStyle: 'italic'
  }
] as const

const TextContent = ({
  elementId,
  value
}: {
  elementId: string
  value: string
}) => {
  const draft = useSyncExternalStore(textCanvasApis.subscribe, () =>
    textCanvasApis.getDraftText(elementId)
  )
  useEffect(
    () => () => {
      const session = textCanvasApis.getSnapshot()
      if (session?.elementId === elementId && session.inputSurface === 'panel')
        textCanvasApis.cancel()
    },
    [elementId]
  )
  return (
    <TextField
      field="text"
      label="Content"
      value={draft ?? value}
      onDraftChange={(text) => {
        if (textCanvasApis.getSnapshot()?.elementId !== elementId)
          textCanvasApis.beginEdit(elementId, 'panel')
        textCanvasApis.updateDraft(text)
      }}
      onCommit={(text) => {
        if (textCanvasApis.getSnapshot()?.elementId === elementId)
          textCanvasApis.finish(String(text))
      }}
      onCancel={() => {
        if (textCanvasApis.getSnapshot()?.elementId === elementId)
          textCanvasApis.cancel()
      }}
    />
  )
}

const TextProperties = () => {
  const selectedIds = useProperty<Set<string>>('elementSelection')
  const selectedId = selectedIds?.size === 1 ? [...selectedIds][0] : null
  const typography = useProperty<(TextData & Record<string, unknown>) | null>(
    TEXT_PROPERTY_TYPE
  )
  if (!selectedId || !typography || typeof typography !== 'object') return null

  const field = (key: keyof TextData, label: string, showLabel = false) => (
    <TextField
      key={`${selectedId}:${key}`}
      field={key}
      label={label}
      showLabel={showLabel}
      value={typography[key]}
      onCommit={(value) => updateSelectedElementProperties(key, value)}
    />
  )

  return (
    <div onPointerDown={(event) => event.stopPropagation()}>
      <section aria-label="Typography">
        <button
          className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
          onClick={() => {
            const edit = getFeature(FeatureNames.EDIT_TEXT)?.editSelected as
              (() => void) | undefined
            edit?.()
          }}
        >
          Edit text on Canvas
        </button>
        <Header label="Typography" />
        <div className="flex flex-col pb-4">
          <div className="grid grid-cols-1 items-center pl-4 pr-2 h-8 min-h-8">
            <FontFamilySelect
              value={typography.fontFamily}
              onChange={(value) => {
                if (value !== typography.fontFamily)
                  updateSelectedElementProperties('fontFamily', value)
              }}
            />
          </div>
          <div className="grid grid-cols-2 items-center gap-2 pl-4 pr-2 h-8 min-h-8">
            <TextSelect
              label="Font style"
              value={
                fontStyles.find(
                  (style) =>
                    style.fontWeight === typography.fontWeight &&
                    style.fontStyle === typography.fontStyle
                )?.id ?? ''
              }
              options={fontStyles.map((style) => ({
                value: style.id,
                label: style.label
              }))}
              onChange={(value) => {
                const style = fontStyles.find((entry) => entry.id === value)
                if (
                  style &&
                  (style.fontWeight !== typography.fontWeight ||
                    style.fontStyle !== typography.fontStyle)
                ) {
                  updateSelectedTextStyle({
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle
                  })
                }
              }}
            />
            {field('fontSize', 'Font size')}
          </div>
          <div className="grid grid-cols-2 items-start gap-2 pl-4 pr-2 pt-2 pb-1">
            {field('lineHeight', 'Line height', true)}
            {field('letterSpacing', 'Letter spacing', true)}
          </div>
          <div className="pl-4 pr-2 pt-2 text-[11px] text-text-secondary">
            Alignment
          </div>
          <div className="grid grid-cols-2 items-center gap-2 pl-4 pr-2 h-8 min-h-8">
            <div
              role="group"
              aria-label="Text alignment"
              className="grid h-6 w-full grid-cols-3 rounded-[3px] bg-panel-surface-hover"
            >
              {(Object.keys(alignmentPaths) as TextData['textAlign'][]).map(
                (alignment) => (
                  <button
                    key={alignment}
                    type="button"
                    aria-label={`Align ${alignment}`}
                    aria-pressed={typography.textAlign === alignment}
                    title={`Align ${alignment}`}
                    onKeyDown={(event) => event.stopPropagation()}
                    onKeyUp={(event) => event.stopPropagation()}
                    className="flex h-6 items-center justify-center rounded-sm text-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-border-focus aria-pressed:bg-white/15 aria-pressed:text-white"
                    onClick={() => {
                      if (typography.textAlign !== alignment)
                        updateSelectedElementProperties('textAlign', alignment)
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      width="18"
                      height="18"
                      viewBox="0 0 18 20"
                      fill="none"
                    >
                      <path
                        d={alignmentPaths[alignment]}
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>
      <section aria-label="Content" className="border-t border-white/5 pb-4">
        <Header label="Content" />
        <div className="pl-4 pr-2">
          <TextContent
            key={selectedId}
            elementId={selectedId}
            value={typography.text}
          />
        </div>
      </section>
    </div>
  )
}
export default TextProperties
