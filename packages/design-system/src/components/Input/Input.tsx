import React, {
  ChangeEvent,
  useState,
  useCallback,
  useEffect,
  KeyboardEvent,
  useRef
} from 'react'
import { MIXED_STRING } from '@asyra/utils'
import { IconButton } from '../IconButton/index.js'

// InputProps Interface
interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size' | 'prefix'
> {
  /** Content inside the input */
  value?: number | string | typeof MIXED_STRING
  /** Prefix element (e.g., currency symbol) */
  prefix?: React.ReactNode
  /** Suffix element (e.g., measurement unit) */
  suffix?: string
  /** Input size: small, medium, or large */
  size?: 'small' | 'medium' | 'large'
  /** Change event handler */
  onChange: (newData: string) => boolean | undefined
  /** Additional class name for the container div */
  containerClassName?: string
  /** Additional styles for the container div */
  containerStyle?: React.CSSProperties
  /** Whether to hide the outline rings on hover and focus */
  noOutline?: boolean
  /** Additional class name for the internal input element */
  inputClassName?: string
  /** Show themed increment/decrement buttons for number inputs. */
  stepControls?: boolean
  isStepAllowed?: (value: number) => boolean
}

const sizeClasses = {
  small: 'text-[10px]',
  medium: 'text-[11px]',
  large: 'text-[12px]'
}

const Input: React.FC<InputProps> = ({
  value,
  placeholder = '',
  disabled = false,
  prefix,
  suffix,
  size = 'medium',
  onChange,
  containerClassName,
  containerStyle,
  noOutline = false,
  inputClassName,
  stepControls = false,
  isStepAllowed,
  ...rest
}) => {
  const inputRef = useRef(null)
  const [data, setData] = useState<string>(value?.toString() ?? '')

  const handleKeydon = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()

      if (!inputRef.current) {
        return
      }

      const input = inputRef.current as HTMLInputElement
      if (e.code === 'Enter') {
        e.preventDefault()
        input.blur()
      }
    },
    [inputRef]
  )

  const handleKeyup = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }, [])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newData = e.target.value
      setData(newData)
    },
    [setData]
  )

  const handleBlur = useCallback(() => {
    const accepted = onChange(data)
    if (accepted === false) {
      setData(value?.toString() ?? '')
    }
  }, [data, onChange, value])

  useEffect(() => {
    setData(value?.toString() ?? '')
  }, [value])

  const showsSteps = stepControls && rest.type === 'number'
  const step =
    rest.step === 'any' || rest.step === undefined ? 1 : Number(rest.step)
  const nextStep = (direction: number) => {
    if (!data.trim()) return null
    const next = Number((Number(data) + direction * step).toPrecision(12))
    if (
      !Number.isFinite(next) ||
      disabled ||
      (rest.min !== undefined && next < Number(rest.min)) ||
      (rest.max !== undefined && next > Number(rest.max)) ||
      (isStepAllowed && !isStepAllowed(next))
    )
      return null
    return next
  }
  const applyStep = (direction: number) => {
    const next = nextStep(direction)
    if (next === null) return
    const nextData = String(next)
    if (onChange(nextData) !== false) setData(nextData)
  }

  return (
    <div
      className={`group flex items-center h-full bg-transparent transition-all
      ${!noOutline ? 'hover:ring-1 hover:ring-border-hover focus-within:ring-1 focus-within:ring-border-focus' : ''}
      ${sizeClasses[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${containerClassName ?? 'rounded'}`}
      style={containerStyle}
    >
      {prefix && (
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
          <span className="text-[10px] font-medium text-white">{prefix}</span>
        </div>
      )}
      <input
        type="text"
        ref={inputRef}
        value={data}
        onKeyDown={handleKeydon}
        onKeyUp={handleKeyup}
        onChange={handleChange}
        onBlur={(e) => {
          handleBlur()
        }}
        onFocus={(e) => {
          e.currentTarget.select()
        }}
        placeholder={placeholder}
        disabled={disabled}
        {...rest}
        className={`bg-transparent w-full h-full pr-1 outline-none text-text-primary caret-accent text-[11px] ${!prefix ? 'pl-2' : ''} ${showsSteps ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none' : ''} ${inputClassName ?? ''}`}
      />
      {showsSteps && (
        <div className="flex h-full w-4 shrink-0 flex-col border-l border-white/5">
          {([1, -1] as const).map((direction) => (
            <IconButton
              key={direction}
              icon="ChevronDown"
              aria-label={`${direction === 1 ? 'Increase' : 'Decrease'} ${rest['aria-label'] ?? 'value'}`}
              className="flex h-1/2 items-center justify-center text-white/60 hover:bg-panel-surface-hover hover:text-white disabled:opacity-20"
              iconClassName={`${direction === 1 ? 'rotate-180' : ''} [&>svg]:h-[5px] [&>svg]:w-2`}
              disabled={nextStep(direction) === null}
              onPointerDown={(event) => event.preventDefault()}
              onKeyDown={(event) => event.stopPropagation()}
              onKeyUp={(event) => event.stopPropagation()}
              onClick={() => applyStep(direction)}
            />
          ))}
        </div>
      )}
      {suffix && (
        <div className="pr-1.5 flex-shrink-0">
          <span className="text-[10px] text-white">{suffix}</span>
        </div>
      )}
    </div>
  )
}

export default Input
