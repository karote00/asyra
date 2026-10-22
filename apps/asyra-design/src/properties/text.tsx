import { TEXT_PROPERTY_TYPE, type TextData } from '@asyra/preset'
import { useProperty } from '../hooks'
import { updateSelectedElementProperties } from '../controllers/scene-tree'
import Header from './header'
import { TextField } from './text-field'

const alignmentPaths = {
  left: 'M3 4h12M3 8h8M3 12h12M3 16h8',
  center: 'M3 4h12M5 8h8M3 12h12M5 16h8',
  right: 'M3 4h12M7 8h8M3 12h12M7 16h8'
} as const

const TextProperties = () => {
  const selectedIds = useProperty<Set<string>>('elementSelection')
  const selectedId = selectedIds?.size === 1 ? [...selectedIds][0] : null
  const typography = useProperty<(TextData & Record<string, unknown>) | null>(
    TEXT_PROPERTY_TYPE
  )
  if (!selectedId || !typography || typeof typography !== 'object') return null

  const field = (key: keyof TextData, label: string) => (
    <TextField
      key={`${selectedId}:${key}`}
      field={key}
      label={label}
      value={typography[key]}
      onCommit={(value) => updateSelectedElementProperties(key, value)}
    />
  )

  return (
    <section
      aria-label="Typography"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Header label="Typography" />
      <div className="flex flex-col gap-3 pb-4 pl-4 pr-2">
        {field('fontFamily', 'Font family')}
        <div className="grid grid-cols-2 gap-2">
          {field('fontWeight', 'Weight')}
          {field('fontSize', 'Font size')}
          {field('fontStyle', 'Style')}
          {field('lineHeight', 'Line height')}
          {field('letterSpacing', 'Letter spacing')}
          {field('textColor', 'Text color')}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-white/50">Alignment</span>
          <div
            role="group"
            aria-label="Text alignment"
            className="grid grid-cols-3 gap-1 rounded-[3px] bg-panel-surface-hover p-0.5"
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

        {field('text', 'Content')}
      </div>
    </section>
  )
}
export default TextProperties
