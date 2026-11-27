import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { SavedBoard } from './examples/DesignBoard'

createRoot(globalThis.document.getElementById('root')).render(
  createElement(SavedBoard)
)
