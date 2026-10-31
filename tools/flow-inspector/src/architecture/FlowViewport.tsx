import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ViewportProps {
  width: number
  height: number
  children: ReactNode
  onShowAll: () => void
  focusBounds?: {
    id: string
    x: number
    y: number
    width: number
    height: number
    padding: number
  }
}

export function FlowViewport({
  width,
  height,
  children,
  onShowAll,
  focusBounds
}: ViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [fitRequested, setFitRequested] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const focusedId = useRef<string | undefined>(undefined)
  const anchorRef = useRef<{
    x: number
    y: number
    contentX: number
    contentY: number
  } | null>(null)

  function fit() {
    onShowAll()
    setFitRequested(true)
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const requestedFocus = focusBounds && focusedId.current !== focusBounds.id

    if (fitRequested || requestedFocus) {
      const bounds = requestedFocus
        ? focusBounds
        : {
            x: 60,
            y: 68,
            width: width - 120,
            height: height - 136,
            padding: 24
          }
      const outerWidth = viewport.offsetWidth || viewport.clientWidth
      const outerHeight = viewport.offsetHeight || viewport.clientHeight
      const availableWidth = outerWidth - bounds.padding * 2
      const availableHeight = outerHeight - bounds.padding * 2

      if (availableWidth > 0 && availableHeight > 0) {
        const nextScale = Math.min(
          availableWidth / bounds.width,
          availableHeight / bounds.height
        )
        setScale(nextScale)
        setOffset({
          x:
            (outerWidth - bounds.width * nextScale) / 2 -
            viewport.clientLeft -
            bounds.x * nextScale,
          y:
            (outerHeight - bounds.height * nextScale) / 2 -
            viewport.clientTop -
            bounds.y * nextScale
        })
        viewport.scrollLeft = 0
        viewport.scrollTop = 0
      }

      focusedId.current = focusBounds?.id
      setFitRequested(false)
    }

    const anchor = anchorRef.current

    if (anchor) {
      viewport.scrollLeft = offset.x + anchor.contentX * scale - anchor.x
      viewport.scrollTop = offset.y + anchor.contentY * scale - anchor.y
      anchorRef.current = null
    }
  }, [fitRequested, width, height, scale, focusBounds, offset])

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    function zoom(event: WheelEvent) {
      if (!event.ctrlKey || !viewport) {
        return
      }

      event.preventDefault()
      const bounds = viewport.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top
      const multiplier = event.deltaMode === 1 ? 16 : 1
      anchorRef.current = {
        x,
        y,
        contentX: (viewport.scrollLeft + x - offset.x) / scale,
        contentY: (viewport.scrollTop + y - offset.y) / scale
      }
      setScale(
        Math.min(
          2.5,
          Math.max(0.2, scale * Math.exp(-event.deltaY * multiplier * 0.002))
        )
      )
    }

    viewport.addEventListener('wheel', zoom, { passive: false })

    return () => viewport.removeEventListener('wheel', zoom)
  }, [scale, offset])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.isComposing || event.altKey || event.ctrlKey) {
        return
      }

      const command = event.metaKey && !event.shiftKey
      const alternative = event.shiftKey && !event.metaKey

      if (
        alternative &&
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]'
        )
      ) {
        return
      }

      const reset =
        (command && event.key === '0') ||
        (alternative && event.code === 'Digit0')
      const fitAll =
        (command && event.key === '1') ||
        (alternative && event.code === 'Digit1')

      if (!reset && !fitAll) {
        return
      }

      event.preventDefault()

      if (reset) {
        setScale(1)
        setOffset({ x: 0, y: 0 })
      } else {
        onShowAll()
        setFitRequested(true)
      }
    }

    document.addEventListener('keydown', handleShortcut, true)

    return () => document.removeEventListener('keydown', handleShortcut, true)
  }, [onShowAll])

  return (
    <div className="flow-stage">
      <div className="zoom-controls">
        <button type="button" data-fit-all onClick={fit}>
          Fit all
        </button>
        <button
          type="button"
          data-reset-zoom
          onClick={() => {
            setScale(1)
            setOffset({ x: 0, y: 0 })
          }}
        >
          Reset zoom - {Math.round(scale * 100)}%
        </button>
      </div>
      <div
        ref={viewportRef}
        role="region"
        className="flow-viewport"
        tabIndex={0}
        aria-label="Inspector flow"
        data-zoom-scale={scale}
      >
        <div
          className="flow-surface"
          style={{
            width: width * scale + offset.x,
            height: height * scale + offset.y
          }}
        >
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width,
              height
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
