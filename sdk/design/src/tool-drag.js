// The editor frame and the host page have different pointer coordinate systems.
function frameGeometry(frame) {
  const bounds = frame.getBoundingClientRect()

  return {
    x: bounds.left,
    y: bounds.top,
    scaleX: bounds.width / frame.offsetWidth,
    scaleY: bounds.height / frame.offsetHeight
  }
}

export function toolDropTarget(frame, { x, y }) {
  if (frame.ownerDocument.elementFromPoint(x, y) !== frame) {
    return null
  }

  const origin = frameGeometry(frame)

  return frame.contentDocument.elementFromPoint(
    (x - origin.x) / origin.scaleX,
    (y - origin.y) / origin.scaleY
  )
}

export function trackToolDrag(event, node, label, frame, drop, finish) {
  event.preventDefault()
  const host = frame.ownerDocument
  const inner = frame.contentDocument
  const grip = event.currentTarget
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

  const cleanup = () => {
    if (listeners.signal.aborted) {
      return
    }

    listeners.abort()
    finish()
    preview.remove()
    if (grip.hasPointerCapture(event.pointerId)) {
      grip.releasePointerCapture(event.pointerId)
    }
  }

  function track(e) {
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

    if (e.type === 'pointerup') {
      const moved = preview.isConnected

      cleanup()
      if (moved) {
        drop({ x, y }, position)
      }

      return
    }

    if (!preview.isConnected) {
      if (Math.hypot(x - start.x, y - start.y) < 3) {
        return
      }

      host.body.append(preview)
    }

    preview.style.left = position.x + 'px'
    preview.style.top = position.y + 'px'
  }

  grip.setPointerCapture(event.pointerId)
  grip.addEventListener('lostpointercapture', cleanup, settings)
  for (const doc of [host, inner]) {
    for (const type of ['pointermove', 'pointerup', 'pointercancel']) {
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

  host.defaultView.addEventListener('blur', cleanup, settings)

  return cleanup
}
