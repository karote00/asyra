import type { Point } from './workspace-tools.js'

// The editor frame and the host page have different pointer coordinate systems.
function frameGeometry(frame: HTMLIFrameElement) {
  const bounds = frame.getBoundingClientRect()

  return {
    x: bounds.left,
    y: bounds.top,
    scaleX: bounds.width / frame.offsetWidth,
    scaleY: bounds.height / frame.offsetHeight
  }
}

function toolDropTarget(
  frame: HTMLIFrameElement,
  x: number,
  y: number,
  source: HTMLElement
) {
  const host = frame.ownerDocument
  let top = host.elementFromPoint(x, y)

  if (source.contains(top)) {
    top =
      host
        .elementsFromPoint(x, y)
        .find((element) => !source.contains(element)) ?? null
  }

  if (top !== frame) {
    return null
  }

  const origin = frameGeometry(frame)

  return (
    frame.contentDocument?.elementFromPoint(
      (x - origin.x) / origin.scaleX,
      (y - origin.y) / origin.scaleY
    ) ?? null
  )
}

export function trackToolDrag(
  event: PointerEvent,
  node: HTMLElement,
  label: string,
  frame: HTMLIFrameElement,
  drop: (
    dock: HTMLElement | null | undefined,
    target: Element | null,
    position: Point
  ) => void,
  finish: () => void
) {
  event.preventDefault()
  const host = frame.ownerDocument
  const inner = frame.contentDocument

  if (!inner) {
    throw new Error('Design workspace is unavailable')
  }

  const dragRoot = inner.documentElement
  const grip = event.currentTarget as HTMLElement
  const origin =
    node.ownerDocument === inner
      ? frameGeometry(frame)
      : { x: 0, y: 0, scaleX: 1, scaleY: 1 }
  const bounds = node.getBoundingClientRect()
  const offset = {
    x: (event.clientX - bounds.left) * origin.scaleX,
    y: (event.clientY - bounds.top) * origin.scaleY
  }
  const start = {
    x: origin.x + event.clientX * origin.scaleX,
    y: origin.y + event.clientY * origin.scaleY
  }
  const preview = host.createElement('div')

  preview.textContent = label
  preview.style.cssText =
    'position:fixed;z-index:2147483647;display:grid;place-items:center;box-sizing:border-box;color:CanvasText;background:Canvas;border:1px dashed currentColor;pointer-events:none'
  preview.style.width = bounds.width * origin.scaleX + 'px'
  preview.style.height = bounds.height * origin.scaleY + 'px'

  const listeners = new globalThis.AbortController()
  const settings = { capture: true, signal: listeners.signal }

  let activeDock: HTMLElement | null | undefined

  const cleanup = () => {
    if (listeners.signal.aborted) {
      return
    }

    listeners.abort()
    dragRoot.removeAttribute('data-tool-dragging')
    activeDock?.removeAttribute('data-tool-dock-active')
    finish()
    preview.remove()
    if (grip.hasPointerCapture(event.pointerId)) {
      grip.releasePointerCapture(event.pointerId)
    }
  }

  function track(e: PointerEvent) {
    if (e.pointerId !== event.pointerId) {
      return
    }

    e.stopPropagation()
    if (e.type === 'pointercancel') {
      cleanup()

      return
    }

    const rect = e.currentTarget === inner ? frameGeometry(frame) : undefined
    const x = rect ? rect.x + e.clientX * rect.scaleX : e.clientX
    const y = rect ? rect.y + e.clientY * rect.scaleY : e.clientY
    const position = { x: x - offset.x, y: y - offset.y }

    if (!preview.isConnected) {
      if (e.type === 'pointerup') {
        cleanup()

        return
      }

      if (Math.hypot(x - start.x, y - start.y) < 3) {
        return
      }

      dragRoot.setAttribute('data-tool-dragging', '')
      host.body.append(preview)
    }

    const target = toolDropTarget(frame, x, y, node)
    const dock = target?.closest<HTMLElement>('[data-tool-dock]')

    if (e.type === 'pointerup') {
      cleanup()
      drop(dock, target, position)

      return
    }

    if (dock !== activeDock) {
      activeDock?.removeAttribute('data-tool-dock-active')
      activeDock = dock
      activeDock?.setAttribute('data-tool-dock-active', '')
      preview.textContent = dock ? 'Dock in ' + dock.dataset.toolDock : label
    }

    preview.style.left = position.x + 'px'
    preview.style.top = position.y + 'px'
  }

  grip.setPointerCapture(event.pointerId)
  grip.addEventListener('lostpointercapture', cleanup, settings)
  for (const doc of [host, inner]) {
    for (const type of ['pointermove', 'pointerup', 'pointercancel'] as const) {
      doc.addEventListener(type, track, settings)
    }

    doc.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') {
          cleanup()
        }
      },
      settings
    )
  }

  host.defaultView?.addEventListener('blur', cleanup, settings)

  return cleanup
}
