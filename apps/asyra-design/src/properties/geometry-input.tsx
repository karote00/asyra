import { useRef } from 'react'
import { Input, PropertyControl } from '@asyra/design-system'
import { formatInputNumber, parseFiniteInputNumber } from './number-input'

export function InspectorNumberInput({
  field,
  label,
  value,
  onCommit,
  disabled
}: {
  field: string
  label: string
  value: number | string
  disabled?: boolean
  onCommit(value: number): void
}) {
  const cancelled = useRef(false)

  return (
    <PropertyControl>
      <Input
        value={typeof value === 'string' ? '' : formatInputNumber(value)}
        placeholder={typeof value === 'string' ? value : undefined}
        aria-label={label}
        prefix={label}
        data-testid={'prop-' + field}
        disabled={disabled}
        noOutline
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            cancelled.current = true
            event.currentTarget.blur()
          }
        }}
        onChange={(text) => {
          if (cancelled.current) {
            cancelled.current = false

            return false
          }

          const next = parseFiniteInputNumber(text)

          if (next === null) {
            return false
          }

          onCommit(next)

          return true
        }}
      />
    </PropertyControl>
  )
}
