import type { CSSProperties, ReactElement } from 'react'

export interface CanvasRectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasAction {
  label: string
  execute: (editor: { drawRectangle(rectangle: CanvasRectangle): void }) => void
}

export interface CanvasProps {
  className?: string
  style?: CSSProperties
  title?: string
  documentId?: string
  actions?: readonly CanvasAction[]
}

export function AsyraCanvas(props: CanvasProps): ReactElement
