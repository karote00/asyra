import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UI } from '@asyra/design/react'
import { CustomToolbar } from './examples/CustomToolbar'

globalThis.nativeControlNames = Object.keys(UI)
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
