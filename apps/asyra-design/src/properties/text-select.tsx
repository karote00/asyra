import { useEffect, useState } from 'react'
import { PropertyControl } from '@asyra/design-system'
import { getAvailableFontFamilies } from './font-options'

export const TextSelect = ({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}) => (
  <PropertyControl className="relative">
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      className="h-full w-full min-w-0 appearance-none bg-transparent pl-2 pr-5 text-[11px] text-text-primary outline-none [color-scheme:dark]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </PropertyControl>
)

export const FontFamilySelect = ({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [families, setFamilies] = useState(() =>
    getAvailableFontFamilies(document)
  )
  useEffect(() => {
    const refresh = () => setFamilies(getAvailableFontFamilies(document))
    document.fonts?.addEventListener('loadingdone', refresh)
    return () => document.fonts?.removeEventListener('loadingdone', refresh)
  }, [])
  // An existing document font remains selectable even when absent on this machine.
  const values = families.includes(value) ? families : [value, ...families]
  return (
    <TextSelect
      label="Font family"
      value={value}
      options={values.map((family) => ({ value: family, label: family }))}
      onChange={onChange}
    />
  )
}
