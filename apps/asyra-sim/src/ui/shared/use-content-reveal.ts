import { useEffect, useRef } from 'react'

/** Reveal one explicit UI request or completed preview, never an ordinary data refresh. */
export function useContentReveal<T extends HTMLElement>(request: unknown) {
  const target = useRef<T>(null)
  useEffect(() => {
    if (request == null) return
    target.current?.focus({ preventScroll: true })
    target.current?.scrollIntoView?.({
      block: 'start',
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth'
    })
  }, [request])
  return target
}
