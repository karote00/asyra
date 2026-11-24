import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DesignBoard from './examples/DesignBoard'

const app = globalThis.document.createElement('main')

globalThis.document.body.append(app)
const root = createRoot(app)

globalThis.unmount = () => root.unmount()
root.render(createElement(StrictMode, null, createElement(DesignBoard)))
