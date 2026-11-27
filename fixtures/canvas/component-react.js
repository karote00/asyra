import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CustomToolbar } from './examples/CustomToolbar'

const host = globalThis.document.body.appendChild(
  globalThis.document.createElement('div')
)

createRoot(host).render(
  createElement(
    StrictMode,
    null,
    createElement(CustomToolbar, {
      onMount(editor) {
        globalThis.editor = editor
      }
    })
  )
)
