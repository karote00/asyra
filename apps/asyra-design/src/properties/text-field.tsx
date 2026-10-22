import { useEffect, useRef, useState } from 'react'
import { ColorPicker, Input, PropertyControl } from '@asyra/design-system'
import { TEXT_PROPERTY_SCHEMA, type TextData } from '@asyra/preset'
import { COLOR_PICKER_FORMAT_DEFINITIONS } from './fills/color-picker-config'

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
  const pickingColor = useRef(false)
  const [inputRevision, setInputRevision] = useState(0)

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
      'w-full min-w-0 h-full bg-transparent pr-1 text-[11px] text-text-primary caret-accent outline-none',
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
  const prefixes: Partial<Record<keyof TextData, string>> = {
    fontFamily: 'T',
    fontSize: 'Ag',
    lineHeight: '↕',
    letterSpacing: '↔'
  }
  let control = (
    <Input
      key={inputRevision}
      value={value}
      prefix={prefixes[field]}
      noOutline
      containerClassName="w-full min-w-0"
      aria-label={label}
      aria-invalid={invalid}
      type={numeric ? 'number' : 'text'}
      step={numeric ? 'any' : undefined}
      onChange={(next) => {
        commit(next)
        return undefined
      }}
      onBlur={(event) => {
        if (cancelled.current) {
          cancelled.current = false
          return
        }
        commit(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        props.onKeyDown(event)
        if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
          setInputRevision((revision) => revision + 1)
        }
      }}
      onKeyUp={props.onKeyUp}
    />
  )
  if (field === 'text') {
    control = (
      <textarea
        {...props}
        rows={3}
        className={`${props.className} resize-y px-2 py-1.5`}
      />
    )
  } else if (options) {
    control = (
      <select
        aria-label={label}
        className={`${props.className} pl-2 [color-scheme:dark]`}
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
    <div title={label} className="flex min-w-0 flex-col text-[11px] text-white">
      <span className="sr-only">{label}</span>
      <PropertyControl className={field === 'text' ? '!h-auto min-h-16' : ''}>
        {field === 'textColor' && (
          <ColorPicker
            color={draft}
            showAlpha={false}
            formatDefinitions={COLOR_PICKER_FORMAT_DEFINITIONS}
            onChangeStart={() => {
              pickingColor.current = true
            }}
            onChange={({ color }) => {
              setDraft(color)
              if (!pickingColor.current) commit(color)
            }}
            onChangeEnd={({ color }) => {
              pickingColor.current = false
              commit(color)
            }}
            swatchStyle={{
              position: 'static',
              width: '14px',
              height: '14px',
              borderRadius: '2px'
            }}
            triggerClassName="group flex h-6 w-6 items-center justify-center flex-shrink-0 rounded-l-[3px] transition-all text-text-secondary hover:text-text-primary"
            data-testid="prop-text-color-picker"
          />
        )}
        {control}
      </PropertyControl>
      {invalid && (
        <span role="alert" className="text-amber-300">
          Enter a valid value.
        </span>
      )}
    </div>
  )
}
