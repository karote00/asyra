import { useEffect, useRef, useState } from 'react'
import { PropertyControl } from '@asyra/design-system'
import { TEXT_PROPERTY_SCHEMA, type TextData } from '@asyra/preset'

const choices: Partial<Record<keyof TextData, readonly [string, string][]>> = {
  fontWeight: [
    ['normal', 'Regular'],
    ['bold', 'Bold']
  ],
  fontStyle: [
    ['normal', 'Normal'],
    ['italic', 'Italic']
  ]
}

export const TextField = ({
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
  const commit = (input: string) => {
    let next: string | number = input
    if (numeric) next = input.trim() ? Number(input) : NaN
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
      'w-full min-w-0 bg-transparent px-2 text-[11px] text-white outline-none',
    value: draft,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      cancelled.current = false
      setDraft(event.target.value)
      setInvalid(false)
    },
    onBlur: () => {
      if (cancelled.current) {
        cancelled.current = false
        return
      }
      commit(draft)
    },
    onKeyDown: (
      event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      event.stopPropagation()
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') {
        cancelled.current = true
        setDraft(String(value))
        setInvalid(false)
        event.currentTarget.blur()
      }
      if (event.key === 'Enter' && field !== 'text') event.currentTarget.blur()
    },
    onKeyUp: (event: React.KeyboardEvent) => event.stopPropagation()
  }

  const options = choices[field]
  let control = (
    <input
      {...props}
      type={numeric ? 'number' : 'text'}
      step={numeric ? 'any' : undefined}
    />
  )
  if (field === 'text') {
    control = (
      <textarea
        {...props}
        rows={3}
        className={`${props.className} resize-y py-1.5`}
      />
    )
  } else if (options) {
    control = (
      <select
        aria-label={label}
        className={`${props.className} h-full [color-scheme:dark]`}
        value={String(value)}
        onChange={(event) => commit(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
      >
        {options.map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </select>
    )
  }

  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] text-white/50">
      {label}
      <PropertyControl className={field === 'text' ? '!h-auto min-h-16' : ''}>
        {field === 'textColor' && (
          <span
            aria-hidden="true"
            className="ml-1.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
            style={{ backgroundColor: String(value) }}
          />
        )}
        {control}
      </PropertyControl>
      {invalid && (
        <span role="alert" className="text-amber-300">
          Enter a valid value.
        </span>
      )}
    </label>
  )
}
