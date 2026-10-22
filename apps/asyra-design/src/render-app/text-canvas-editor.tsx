import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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
  const draft = useRef(session.typography.text)
  const [error, setError] = useState(session.error)
  const [transform, setTransform] = useState('')

  useEffect(() => {
    const update = () => {
      const project = (x: number, y: number) => {
        let point = { x: x + session.bounds.x, y: y + session.bounds.y }
        if (session.elementId) {
          const world = core.elementLocalToWorkspace(session.elementId, {
            x,
            y
          })
          if (!world) return null
          point = world
        }
        return core.workspaceToCanvas(point)
      }
      const origin = project(0, 0)
      const horizontal = project(1, 0)
      const vertical = project(0, 1)
      if (!origin || !horizontal || !vertical) return
      const next = `matrix(${horizontal.x - origin.x},${horizontal.y - origin.y},${vertical.x - origin.x},${vertical.y - origin.y},${origin.x},${origin.y})`
      setTransform((previous) => (previous === next ? previous : next))
    }
    update()
    input.current?.focus()
    if (session.elementId) input.current?.select()
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
    const load = subscribeToFileLoadComplete(() => textCanvasApis.cancel())
    return () => {
      window.removeEventListener('pointerdown', outsidePointer, true)
      frame()
      publication()
      load.unsubscribe()
    }
  }, [session])

  const finish = () => {
    if (composing.current || error) return
    action('finish', draft.current)
  }
  return (
    <>
      <textarea
        ref={input}
        aria-label="Canvas text editor"
        aria-describedby="canvas-text-help"
        aria-invalid={Boolean(error || session.error)}
        defaultValue={session.typography.text}
        spellCheck={false}
        maxLength={100_000}
        className="absolute left-0 top-0 m-0 resize-none border-0 bg-panel-surface p-0 text-text-primary outline-1 outline-accent origin-top-left"
        style={{
          transform,
          width: session.bounds.width,
          height: session.bounds.height,
          fontFamily: session.typography.fontFamily,
          fontSize: session.typography.fontSize,
          fontStyle: session.typography.fontStyle,
          fontWeight: session.typography.fontWeight,
          lineHeight: `${session.typography.lineHeight}px`,
          letterSpacing: session.typography.letterSpacing,
          textAlign: session.typography.textAlign,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word'
        }}
        onChange={(event) => {
          draft.current = event.target.value
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
          )
            return
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
      <div
        id="canvas-text-help"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-panel-surface px-3 py-2 text-xs text-text-primary shadow"
      >
        {error || session.error ? (
          <span role="alert">{error || session.error}</span>
        ) : (
          'Enter: new line - Cmd/Ctrl+Enter: finish - Escape: cancel'
        )}
        {error && (
          <button className="ml-2 underline" onClick={() => action('cancel')}>
            Close editor
          </button>
        )}
      </div>
    </>
  )
}

export const TextCanvasEditor = () => {
  const session = useSyncExternalStore(
    textCanvasApis.subscribe,
    textCanvasApis.getSnapshot
  )
  useEffect(() => () => textCanvasApis.cancel(), [])
  if (!session) return null
  return <ActiveTextEditor session={session} />
}
