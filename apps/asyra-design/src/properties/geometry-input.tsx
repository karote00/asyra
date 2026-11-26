import { useRef } from 'react'
import { Input, PropertyControl } from '@asyra/design-system'
import { updateSelectedElementProperties } from '../controllers/scene-tree'
import { formatInputNumber, parseFiniteInputNumber } from './number-input'

export function GeometryInput({
  field,
  label,
  value
}: {
  field: 'x' | 'y' | 'width' | 'height'
  label: string
  value: number | string
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

          updateSelectedElementProperties(field, next)

          return true
        }}
      />
    </PropertyControl>
  )
}
