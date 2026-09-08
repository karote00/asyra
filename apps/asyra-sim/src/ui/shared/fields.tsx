import { useRef, useState, type ComponentProps } from 'react'
import type { Vec3 } from '../../domain/math'

export function CommittedInput({
  value,
  onCommit,
  diagnose,
  validateOnCommit = false,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string | number
  onCommit: (value: string) => void
  diagnose?: (value: string) => string
  validateOnCommit?: boolean
}) {
  const [draft, setDraft] = useState<{
    source: string | number
    text: string
    error: string
  } | null>(null)

  if (draft !== null && draft.source !== value) setDraft(null)

  const cancelled = useRef(false)

  const error = draft?.source === value ? draft.error : ''
  const message =
    error ||
    diagnose?.(draft?.source === value ? draft.text : String(value)) ||
    ''

  return (
    <>
      <input
        {...props}
        value={draft?.source === value ? draft.text : value}
        aria-invalid={!!message || props['aria-invalid']}
        onChange={(event) => {
          const field = event.currentTarget
          let error = ''
          if (
            props.type === 'number' &&
            (field.value.trim() === '' || !Number.isFinite(Number(field.value)))
          )
            error = 'Enter a finite number.'
          else if (validateOnCommit && !field.validity.valid)
            error = field.validationMessage
          setDraft({ source: value, text: field.value, error })
        }}
        onBlur={(event) => {
          if (
            !cancelled.current &&
            (error ||
              (validateOnCommit &&
                (!event.currentTarget.checkValidity() ||
                  (props.type === 'number' &&
                    event.currentTarget.value.trim() === ''))))
          )
            return
          if (
            !cancelled.current &&
            draft?.source === value &&
            draft.text !== String(value)
          )
            onCommit(draft.text)

          cancelled.current = false

          setDraft(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()

            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            event.preventDefault()

            cancelled.current = true

            setDraft(null)

            event.currentTarget.blur()
          }
        }}
      />
      {message && (
        <span role="alert" className="text-[10px] text-sim-error-text">
          {message}
        </span>
      )}
    </>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  step = 0.01
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}) {
  return (
    <label className="number-field [&_span]:text-[10px]">
      <span>{label}</span>

      <CommittedInput
        aria-label={label}
        type="number"
        step={step}
        value={value}
        onCommit={(text) => {
          if (text.trim() !== '' && Number.isFinite(Number(text)))
            onChange(Number(text))
        }}
      />
    </label>
  )
}

export function VectorField({
  label,
  value,
  onChange,
  scale = 1
}: {
  label: string
  value: Vec3
  onChange: (value: Vec3) => void
  scale?: number
}) {
  return (
    <fieldset
      className="vector-field border-0 m-0 p-0 min-w-0 [&_legend]:text-[11px]
        [&_legend]:text-sim-secondary [&_legend]:font-semibold
        [&_legend]:mb-[6px] [&_>_div]:grid
        [&_>_div]:grid-cols-[repeat(3,_minmax(0,_1fr))] [&_>_div]:gap-[6px]
        [&_.number-field_span]:text-[0]
        [&_.number-field_span::first-letter]:text-[0] [&_input]:p-[7px]"
    >
      <legend>{label}</legend>

      <div>
        {value.map((entry, index) => (
          <NumberField
            key={index}
            label={`${label} ${'XYZ'[index]}`}
            value={Number((entry * scale).toPrecision(10))}
            onChange={(next) =>
              onChange(
                value.map((v, i) =>
                  i === index ? next / scale : v
                ) as unknown as Vec3
              )
            }
          />
        ))}
      </div>
    </fieldset>
  )
}

export function ErrorNotice({
  message,
  onDismiss
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      className="error-notice flex items-center justify-between bg-sim-warning
        text-sim-warning-text py-[10px] px-5 border-b border-b-sim-warning-text
        gap-4 [&_button]:bg-transparent [&_button]:border-0"
      role="alert"
    >
      <span>{message}</span>

      <button onClick={onDismiss} aria-label="Dismiss error">
        ×
      </button>
    </div>
  )
}
