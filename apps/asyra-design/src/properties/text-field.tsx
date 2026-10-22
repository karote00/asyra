import { useEffect, useRef, useState } from 'react'
import { Icon, Input, PropertyControl } from '@asyra/design-system'
import { TEXT_PROPERTY_SCHEMA, type TextData } from '@asyra/preset'

export const TextField = ({
  field,
  label,
  showLabel = false,
  value,
  onCommit,
  onDraftChange,
  onCancel
}: {
  field: keyof TextData
  label: string
  showLabel?: boolean
  value: string | number
  onCommit(value: string | number): void
  onDraftChange?(value: string): void
  onCancel?(): void
}) => {
  const [draft, setDraft] = useState(String(value))
  const [invalid, setInvalid] = useState(false)
  const cancelled = useRef(false)
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
      return false
    }
    setInvalid(false)
    if (next !== value || onDraftChange) onCommit(next)
    return true
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
      if (onDraftChange) {
        const valid = TEXT_PROPERTY_SCHEMA.fields
          .find((entry) => entry.key === field)
          ?.validate?.(event.target.value)
        if (valid) onDraftChange(event.target.value)
        else setInvalid(true)
      }
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
        onCancel?.()
        setDraft(String(value))
        setInvalid(false)
        event.currentTarget.blur()
      }
      if (event.key === 'Enter' && field !== 'text') event.currentTarget.blur()
    },
    onKeyUp: (event: React.KeyboardEvent) => event.stopPropagation()
  }

  const prefixes: Partial<
    Record<keyof TextData, 'LineHeight' | 'LetterSpacing'>
  > = {
    lineHeight: 'LineHeight',
    letterSpacing: 'LetterSpacing'
  }
  let control = (
    <Input
      key={inputRevision}
      value={value}
      prefix={
        prefixes[field] ? (
          <Icon
            name={prefixes[field]}
            showCursor={false}
            className="[&>svg]:h-4 [&>svg]:w-4"
          />
        ) : undefined
      }
      stepControls={numeric}
      isStepAllowed={(next) =>
        TEXT_PROPERTY_SCHEMA.fields
          .find((entry) => entry.key === field)
          ?.validate?.(next) === true
      }
      noOutline
      containerClassName="w-full min-w-0"
      aria-label={label}
      aria-invalid={invalid}
      type={numeric ? 'number' : 'text'}
      step={numeric ? 'any' : undefined}
      onChange={commit}
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
  }

  return (
    <div
      title={label}
      className="flex flex-1 min-w-0 flex-col text-[11px] text-white"
    >
      <span className={showLabel ? 'mb-1 text-text-secondary' : 'sr-only'}>
        {label}
      </span>
      <PropertyControl className={field === 'text' ? '!h-auto min-h-16' : ''}>
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
