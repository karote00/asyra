import { useEffect, useRef, useState } from 'react'
import {
  TEXT_PROPERTY_SCHEMA,
  TEXT_PROPERTY_TYPE,
  type TextData
} from '@asyra/preset'
import { useProperty } from '../hooks'
import { updateSelectedElementProperties } from '../controllers/scene-tree'

const fields = [
  ['text', 'Content'],
  ['fontFamily', 'Font family'],
  ['fontSize', 'Font size'],
  ['fontWeight', 'Weight'],
  ['fontStyle', 'Style'],
  ['textAlign', 'Alignment'],
  ['lineHeight', 'Line height'],
  ['letterSpacing', 'Letter spacing'],
  ['textColor', 'Text color']
] as const
const choices: Partial<Record<keyof TextData, readonly string[]>> = {
  fontWeight: ['normal', 'bold'],
  fontStyle: ['normal', 'italic'],
  textAlign: ['left', 'center', 'right']
}

const TextField = ({
  field,
  label,
  value,
  onCommit
}: {
  field: keyof TextData
  label: string
  value: string | number
  onCommit(value: string | number): void
}) => {
  const [draft, setDraft] = useState(String(value))
  const [invalid, setInvalid] = useState(false)
  const cancelled = useRef(false)
  useEffect(() => {
    setDraft(String(value))
    setInvalid(false)
  }, [value])
  const numeric = typeof value === 'number'
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    let next: string | number = draft
    if (numeric) next = draft.trim() ? Number(draft) : NaN
    const schema = TEXT_PROPERTY_SCHEMA.fields.find(
      (entry) => entry.key === field
    )
    if (!schema?.validate?.(next)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    if (next !== value) onCommit(next)
  }
  const props = {
    'aria-label': label,
    'aria-invalid': invalid,
    className:
      'w-full min-w-0 rounded bg-white/5 px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-violet-400',
    value: draft,
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      cancelled.current = false
      setDraft(event.target.value)
      setInvalid(false)
    },
    onBlur: commit,
    onKeyDown: (
      event: React.KeyboardEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        cancelled.current = true
        setDraft(String(value))
        setInvalid(false)
        event.currentTarget.blur()
      }
      if (event.key === 'Enter' && field !== 'text') event.currentTarget.blur()
    }
  }
  let control = <input {...props} type={numeric ? 'number' : 'text'} />
  const options = choices[field]
  if (field === 'text') control = <textarea {...props} rows={3} />
  else if (options)
    control = (
      <select {...props}>
        {options.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    )
  return (
    <label className="flex flex-col gap-1 text-[12px] text-white/60">
      {label}
      {control}
      {invalid && (
        <span role="alert" className="text-amber-300">
          Enter a valid value.
        </span>
      )}
    </label>
  )
}

const TextProperties = () => {
  const selectedIds = useProperty<Set<string>>('elementSelection')
  const selectedId = selectedIds?.size === 1 ? [...selectedIds][0] : null
  const typography = useProperty<(TextData & Record<string, unknown>) | null>(
    TEXT_PROPERTY_TYPE
  )
  if (!selectedId || !typography || typeof typography !== 'object') return null
  return (
    <section
      aria-label="Typography"
      className="flex flex-col gap-2 p-3"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <h3 className="text-[12px] font-medium">Typography</h3>
      {fields.map(([field, label]) => (
        <TextField
          key={`${selectedId}:${field}`}
          field={field}
          label={label}
          value={typography[field]}
          onCommit={(value) => updateSelectedElementProperties(field, value)}
        />
      ))}
    </section>
  )
}
export default TextProperties
