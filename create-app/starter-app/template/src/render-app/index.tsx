import { useEffect, useRef } from 'react'
import { useApp } from '../contexts/app.js'

export const RenderApp = () => {
  const app = useApp()
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = host.current
    if (!element) return
    let active = true
    const dimensions = () => ({
      width: Math.max(1, element.clientWidth || 800),
      height: Math.max(390, element.clientHeight || 390)
    })
    const resize = (): void => {
      if (active) {
        const { width, height } = dimensions()
        app.resize(width, height)
      }
    }
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    void app
      .start(element, dimensions())
      .then(() => {
        if (!active) return
        observer?.observe(element)
        resize()
      })
      .catch(app.controller.reportError)
    return () => {
      active = false
      observer?.disconnect()
    }
  }, [app])
  return <div ref={host} id="starter-render-host" className="render-host" />
}
