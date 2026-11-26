import { createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DesignBoard, { Board, SavedBoard } from './examples/DesignBoard'

const app = globalThis.document.createElement('main')

globalThis.document.body.append(app)
const root = createRoot(app)

globalThis.unmount = () => root.unmount()
root.render(createElement(StrictMode, null, createElement(DesignBoard)))

globalThis.renderBoard = (options, key) =>
  root.render(
    createElement(StrictMode, null, createElement(Board, { options, key }))
  )

globalThis.renderSavedBoard = () => root.render(createElement(SavedBoard))

globalThis.renderMountedBoard = (storageKey, onMount) =>
  root.render(
    createElement(
      StrictMode,
      null,
      createElement(Board, { options: { storageKey }, onMount })
    )
  )

globalThis.showBoard = (props) => root.render(createElement(Board, props))
