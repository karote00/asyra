import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ComparisonBoard } from './examples/ComparisonBoard'

const identities = { left: [], right: [] }
const current = { left: null, right: null }
const observations = { left: [], right: [] }

globalThis.boardScopes = { identities, current, observations }

createRoot(globalThis.document.body).render(
  createElement(
    StrictMode,
    null,
    createElement(ComparisonBoard, {
      ready(name, editor) {
        identities[name].push(editor)
      },

      observed(name, editor) {
        current[name] = editor
        observations[name].push(editor)
      }
    })
  )
)
