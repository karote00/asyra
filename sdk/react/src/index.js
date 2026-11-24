import { createElement, useRef } from 'react'
import { editorDocument } from './document.js'

export function AsyraCanvas({
  title = 'Asyra canvas',
  documentId,
  actions,
  className,
  style
} = {}) {
  const frame = useRef(null)

  return createElement('iframe', {
    ref: frame,
    key: documentId,
    title,
    className,
    style: {
      display: 'block',
      width: '100%',
      height: 480,
      border: 0,
      ...style
    },
    srcDoc: editorDocument,

    onLoad(event) {
      const node = event.currentTarget

      if (frame.current === node) {
        node.contentWindow.canvasEditor?.start(documentId, actions ?? [])
      }
    }
  })
}
