'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

export interface ProductEvidenceSlide {
  src: string
  alt: string
  label: string
  width: number
  height: number
}

interface ProductEvidenceSliderProps {
  label: string
  slides: readonly ProductEvidenceSlide[]
  testId: string
}

function stackScale(depth: number) {
  if (depth === 0) return 1
  return depth === 1 ? 0.9 : 0.81
}

function stackOffset(offset: number) {
  if (offset === 0) return '-50%'
  const direction = Math.sign(offset)
  let centerOffset = 0
  let previousScale = 1

  for (let depth = 1; depth <= Math.abs(offset); depth += 1) {
    const scale = stackScale(depth)
    centerOffset += previousScale / 2 - scale * 0.25
    previousScale = scale
  }

  return `${(direction * centerOffset - 0.5) * 100}%`
}

function createStackSlots(
  slides: readonly ProductEvidenceSlide[],
  activeIndex: number,
  maxVisible: number
) {
  const count = Math.min(slides.length, maxVisible)
  return Array.from({ length: count }, (_, slot) => {
    const offset = count === 2 ? slot : slot - Math.floor(count / 2)
    const slideIndex = (activeIndex + offset + slides.length) % slides.length
    return { offset, slide: slides[slideIndex], slideIndex }
  })
}

export function ProductEvidenceSlider({
  label,
  slides,
  testId
}: ProductEvidenceSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [desktopPreview, setDesktopPreview] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1025px)')
    const update = () => {
      setDesktopPreview(query.matches)
      if (!query.matches) setPreviewOpen(false)
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!previewOpen) return
    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
    }
  }, [previewOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (previewOpen && desktopPreview && dialog && !dialog.open)
      dialog.showModal()
    else if ((!previewOpen || !desktopPreview) && dialog?.open) dialog.close()
  }, [desktopPreview, previewOpen])

  const previewSlots = useMemo(() => {
    return createStackSlots(slides, activeIndex, 5)
  }, [activeIndex, slides])
  const inlineSlots = useMemo(
    () =>
      createStackSlots(slides, activeIndex, 3).sort(
        (left, right) => left.slideIndex - right.slideIndex
      ),
    [activeIndex, slides]
  )

  function moveBy(direction: number) {
    if (slides.length < 2) return
    setActiveIndex(
      (index) => (index + direction + slides.length) % slides.length
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveBy(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveBy(1)
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch')
      pointerStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2)
      return
    moveBy(deltaX < 0 ? 1 : -1)
  }

  return (
    <>
      <div
        aria-label={`${label} image slider`}
        aria-roledescription="carousel"
        className="product-evidence-showcase relative mx-auto w-full select-none overflow-hidden rounded-lg border border-[#183f35]/15 bg-white"
        data-testid={testId}
        onKeyDown={handleKeyDown}
        onPointerCancel={() => {
          pointerStartRef.current = null
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        role="region"
        style={{ touchAction: 'pan-y' }}
        tabIndex={0}
      >
        <div
          aria-hidden="true"
          className="mx-auto my-2 aspect-[1440/1174] w-[76%] min-[1025px]:my-3"
        />
        {inlineSlots.map(({ offset, slide, slideIndex }) => {
          const depth = Math.abs(offset)
          const scale = stackScale(depth)
          const x = stackOffset(offset)
          const isActive = offset === 0
          const isSide = offset !== 0
          const isInteractive = isSide || (isActive && desktopPreview)
          let ariaLabel: string | undefined
          if (isSide) ariaLabel = `Show ${label} image: ${slide.label}`
          else if (isActive && desktopPreview)
            ariaLabel = `Open ${label} image preview`
          let onClick: (() => void) | undefined
          if (isSide) onClick = () => setActiveIndex(slideIndex)
          else if (isActive && desktopPreview)
            onClick = () => setPreviewOpen(true)
          const imageStyle = {
            opacity: isActive ? 1 : 0.88,
            transform: `translateX(${x}) scale(${scale})`
          }
          return (
            <figure
              aria-label={ariaLabel}
              className={`absolute bottom-2 left-1/2 m-0 w-[76%] origin-bottom rounded-lg transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] min-[1025px]:bottom-3 motion-reduce:transition-none ${isActive ? 'pointer-events-none' : ''} ${isInteractive ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#183f35]' : ''}`}
              data-active={isActive ? 'true' : 'false'}
              data-depth={depth}
              data-offset={offset}
              data-scale={scale}
              data-slide-index={slideIndex}
              data-testid="product-evidence-slide"
              data-side-preview={isSide ? 'true' : undefined}
              key={slide.src}
              onClick={onClick}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (isSide) setActiveIndex(slideIndex)
                        else setPreviewOpen(true)
                      }
                    }
                  : undefined
              }
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : -1}
              style={{
                ...imageStyle,
                aspectRatio: '1440 / 1174',
                zIndex: 10 - depth
              }}
            >
              <img
                alt={slide.alt}
                className="pointer-events-auto absolute inset-0 m-auto block h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-lg"
                decoding="async"
                height={slide.height}
                loading="eager"
                src={slide.src}
                width={slide.width}
              />
            </figure>
          )
        })}
      </div>
      {desktopPreview && previewOpen ? (
        <dialog
          aria-label={`${label} image preview`}
          className="product-evidence-preview fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-white [&::backdrop]:bg-black/45 [&::backdrop]:backdrop-blur-xl"
          data-testid="product-evidence-preview"
          onClose={() => setPreviewOpen(false)}
          ref={dialogRef}
        >
          <div className="relative flex h-full w-full flex-col items-center justify-center px-8 pb-8 pt-16">
            <button
              aria-label="Close preview"
              autoFocus
              className="fixed right-6 top-5 z-50 grid size-11 place-items-center rounded-full bg-black/45 text-3xl leading-none text-white hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              ×
            </button>
            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
              {previewSlots.map(({ offset, slide, slideIndex }) => {
                const depth = Math.abs(offset)
                const scale = stackScale(depth)
                const x = stackOffset(offset)
                const widthLimit = previewSlots.length >= 4 ? 36 : 62
                return (
                  <button
                    aria-label={`Show ${label} image: ${slide.label}`}
                    className="absolute left-1/2 top-1/2 m-0 block rounded-lg transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    data-active={offset === 0 ? 'true' : 'false'}
                    data-depth={depth}
                    data-offset={offset}
                    data-slide-index={slideIndex}
                    data-scale={scale}
                    data-testid="preview-slide"
                    key={slide.src}
                    onClick={() => setActiveIndex(slideIndex)}
                    style={{
                      aspectRatio: '1440 / 1174',
                      maxHeight: '76vh',
                      opacity: offset === 0 ? 1 : 0.88,
                      transform: `translate(${x}, -50%) scale(${scale})`,
                      transformOrigin: 'center center',
                      width: `min(${widthLimit}vw, 720px, calc(76vh * 1.226576))`,
                      zIndex: 10 - depth
                    }}
                    type="button"
                  >
                    <img
                      alt={slide.alt}
                      className="absolute inset-0 m-auto block h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-lg"
                      src={slide.src}
                    />
                  </button>
                )
              })}
            </div>
            <div
              aria-label={`${label} images`}
              className="mt-6 flex max-w-full gap-3 overflow-x-auto rounded-lg bg-black/35 p-2"
            >
              {slides.map((slide, index) => (
                <button
                  aria-label={`Select ${label} image: ${slide.label}`}
                  aria-pressed={activeIndex === index}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${activeIndex === index ? 'border-white' : 'border-white/30 opacity-70 hover:opacity-100'}`}
                  data-testid="preview-thumbnail"
                  key={slide.src}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={slide.src}
                  />
                </button>
              ))}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
