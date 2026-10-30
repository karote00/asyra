import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { TextSizing } from '@asyra/preset'
import { getFeature, subscribeToFileLoadComplete } from '@asyra/core'
import core from '../contexts'
import { FeatureNames } from '../constants'
import {
  textCanvasApis,
  type TextCanvasSession
} from '../common-apis/text-canvas'

const action = (name: 'finish' | 'cancel', value?: string) => {
  const feature = getFeature(FeatureNames.EDIT_TEXT)
  const callback = feature?.[name] as ((value?: string) => void) | undefined
  callback?.(value)
}

const ActiveTextEditor = ({ session }: { session: TextCanvasSession }) => {
  const input = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  const sharedDraft = useSyncExternalStore(
    textCanvasApis.subscribe,
    textCanvasApis.getDraftSnapshot
  )
  const draft = useRef(session.typography.text)
  draft.current = sharedDraft?.text ?? session.typography.text
  const [error, setError] = useState(session.error)
  const [transform, setTransform] = useState('')
  const bounds = sharedDraft?.bounds ?? session.bounds

  useEffect(() => {
    const resumePresentation = session.elementId
      ? core.suspendElementPresentation(session.elementId)
      : null
    const update = () => {
      const project = (x: number, y: number) => {
        let point = { x: x + session.bounds.x, y: y + session.bounds.y }
        if (session.elementId) {
          const world = core.elementLocalToWorkspace(session.elementId, {
            x,
            y
          })
          if (!world) {
            return null
          }
          point = world
        }
        return core.workspaceToCanvas(point)
      }
      const origin = project(0, 0)
      const horizontal = project(1, 0)
      const vertical = project(0, 1)
      if (!origin || !horizontal || !vertical) {
        return
      }
      const next = `matrix(${horizontal.x - origin.x},${horizontal.y - origin.y},${vertical.x - origin.x},${vertical.y - origin.y},${origin.x},${origin.y})`
      setTransform((previous) => (previous === next ? previous : next))
    }
    update()
    input.current?.focus()
    if (session.elementId) {
      input.current?.select()
    }
    const frame = core.subscribeToFrameComplete(update)
    const publication = core.subscribeToSharedPublication(() => {
      if (
        textCanvasApis.getSnapshot() === session &&
        !textCanvasApis.isCurrent(session)
      ) {
        setError(
          'This text changed or is unavailable. Copy your draft before closing.'
        )
      }
    })
    const outsidePointer = (event: PointerEvent) => {
      if (
        !composing.current &&
        event.target instanceof Node &&
        !input.current?.contains(event.target)
      ) {
        action('finish', draft.current)
      }
    }
    window.addEventListener('pointerdown', outsidePointer, true)
    const refreshLayout = () => {
      textCanvasApis.updateDraft(draft.current, true)
    }
    document.fonts?.addEventListener('loadingdone', refreshLayout)
    const load = subscribeToFileLoadComplete(() => textCanvasApis.cancel())
    return () => {
      window.removeEventListener('pointerdown', outsidePointer, true)
      resumePresentation?.()
      document.fonts?.removeEventListener('loadingdone', refreshLayout)
      frame()
      publication()
      load.unsubscribe()
    }
  }, [session])

  const finish = () => {
    if (composing.current || error) {
      return
    }
    action('finish', draft.current)
  }
  return (
    <>
      <textarea
        ref={input}
        aria-label="Canvas text editor"
        aria-description={error || session.error || undefined}
        aria-invalid={Boolean(error || session.error)}
        value={draft.current}
        spellCheck={false}
        wrap={
          session.typography.textSizing === TextSizing.AUTO_WIDTH
            ? 'off'
            : 'soft'
        }
        maxLength={100_000}
        className="absolute left-0 top-0 m-0 resize-none border-0 bg-transparent p-0 text-text-primary outline-1 outline-accent origin-top-left"
        style={{
          transform,
          width: bounds.width,
          height: bounds.height,
          fontFamily: session.typography.fontFamily,
          fontSize: session.typography.fontSize,
          fontStyle: session.typography.fontStyle,
          fontWeight: session.typography.fontWeight,
          lineHeight: `${session.typography.lineHeight}px`,
          letterSpacing: session.typography.letterSpacing,
          textAlign: session.typography.textAlign,
          whiteSpace:
            session.typography.textSizing === TextSizing.AUTO_WIDTH
              ? 'pre'
              : 'pre-wrap',
          overflow: 'hidden',
          overflowWrap: 'break-word'
        }}
        onChange={(event) => {
          draft.current = event.target.value
          textCanvasApis.updateDraft(draft.current)
        }}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={() => {
          composing.current = false
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (
            composing.current ||
            event.nativeEvent.isComposing ||
            event.keyCode === 229
          ) {
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            action('cancel')
          } else if (
            event.key === 'Enter' &&
            (event.metaKey || event.ctrlKey)
          ) {
            event.preventDefault()
            finish()
          }
        }}
        onKeyUp={(event) => event.stopPropagation()}
        onBlur={finish}
      />
    </>
  )
}

export const TextCanvasEditor = () => {
  const session = useSyncExternalStore(
    textCanvasApis.subscribe,
    textCanvasApis.getSnapshot
  )
  useEffect(() => () => textCanvasApis.cancel(), [])
  if (!session) {
    return null
  }
  return <ActiveTextEditor session={session} />
}
