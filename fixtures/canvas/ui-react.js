import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { PositionBoard } from './examples/PositionBoard'

const container = globalThis.document.createElement('main')

globalThis.document.body.append(container)
createRoot(container).render(createElement(PositionBoard))
