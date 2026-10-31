import { runTransaction } from '@asyra/core'
import {
  DEFAULT_TEXT_DATA,
  TextSizing,
  TEXT_COMPONENT_TYPE,
  type TextData
} from '@asyra/preset'
import { createDefaultFills, type Rect } from '@asyra/utils'
import core from '../contexts'
import { PrimaryToolType, DEFAULT_ELEMENT_FILL_COLOR } from '../constants'
import { measureTextBox } from './text-layout'
import { selectionApis } from './selection'
import { systemContextApis } from './system-context'

export interface TextCanvasSession {
  readonly elementId: string | null
  readonly workspaceId: string
  readonly bounds: Rect
  readonly typography: TextData
  readonly baseline: string
  readonly error?: string
}
let session: TextCanvasSession | null = null
let draft: { text: string; bounds: Rect } | null = null
const listeners = new Set<() => void>()
const publish = (next: TextCanvasSession | null, preserveDraft = false) => {
  session = next
  if (!preserveDraft) {
    draft = next ? { text: next.typography.text, bounds: next.bounds } : null
  }
  listeners.forEach((listener) => listener())
}
const readTarget = (id: string) => {
  const element = core.getElementData(id)
  if (
    !element ||
    element.type !== TEXT_COMPONENT_TYPE ||
    element.lock ||
    element.visible === false
  ) {
    return null
  }
  return core.getElementComputedData(id)
}

export const textCanvasApis = {
  getSnapshot: () => session,
  getDraftSnapshot: () => draft,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  beginCreate: (
    bounds: Rect,
    textSizing: TextData['textSizing'] = TextSizing.FIXED
  ) => {
    const workspaceId = core.getCurrentWorkspaceId()
    if (!workspaceId) {
      return
    }
    const typography = { ...DEFAULT_TEXT_DATA, textSizing }
    publish({
      elementId: null,
      workspaceId,
      bounds: measureTextBox(typography, bounds, ''),
      typography,
      baseline: ''
    })
  },
  beginEdit: (elementId: string) => {
    const data = readTarget(elementId)
    const workspaceId = core.getCurrentWorkspaceId()
    if (!data || !workspaceId) {
      return
    }
    const typography = Object.fromEntries(
      Object.keys(DEFAULT_TEXT_DATA).map((key) => [key, data[key]])
    ) as unknown as TextData
    publish({
      elementId,
      workspaceId,
      bounds: {
        x: 0,
        y: 0,
        width: Number(data.width),
        height: Number(data.height)
      },
      typography,
      baseline: JSON.stringify(data)
    })
  },
  updateDraft: (text: string, remeasure = false) => {
    if (!session || !draft) {
      return null
    }
    if (draft.text !== text || remeasure) {
      draft = {
        text,
        bounds: measureTextBox(session.typography, session.bounds, text)
      }
      listeners.forEach((listener) => listener())
    }
    return draft.bounds
  },
  isCurrent: (current: TextCanvasSession) => {
    if (core.getCurrentWorkspaceId() !== current.workspaceId) {
      return false
    }
    if (!current.elementId) {
      return true
    }
    const data = readTarget(current.elementId)
    return data !== null && JSON.stringify(data) === current.baseline
  },
  finish: (text: string) => {
    const current = session
    if (!current || current.error) {
      return
    }
    if (!textCanvasApis.isCurrent(current)) {
      publish(
        {
          ...current,
          error:
            'This text changed or is unavailable. Copy your draft before closing.'
        },
        true
      )
      return
    }
    if (text.length > 100_000) {
      publish(
        {
          ...current,
          error: 'Text must contain at most 100,000 characters.'
        },
        true
      )
      return
    }
    const bounds = textCanvasApis.updateDraft(text) ?? current.bounds
    if (
      (current.elementId && text !== current.typography.text) ||
      (!current.elementId && text.length > 0)
    ) {
      runTransaction(() => {
        if (current.elementId) {
          core.updateElementProperties([
            {
              elementId: current.elementId,
              values: {
                text,
                ...(current.typography.textSizing === TextSizing.FIXED
                  ? {}
                  : { width: bounds.width, height: bounds.height })
              }
            }
          ])
        } else {
          const id = core.createElementInParent(
            {
              type: TEXT_COMPONENT_TYPE,
              fills: createDefaultFills({ color: DEFAULT_ELEMENT_FILL_COLOR }),
              ...bounds,
              ...current.typography,
              text
            },
            current.workspaceId
          )
          if (!id) {
            throw new Error('Text creation failed.')
          }
          selectionApis.selectElements([id])
        }
      })
    }
    publish(null)
    systemContextApis.switchPrimaryTool(PrimaryToolType.SELECT)
  },
  cancel: () => {
    publish(null)
  }
}
