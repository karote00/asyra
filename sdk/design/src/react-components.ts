import { createElement, useLayoutEffect, useRef } from 'react'
import { components } from './ui.js'
import { useDesignEditor } from './react-editor-scope.js'

/** Place a live editor component here for the lifetime of this React host. */
export function DesignUI({
  component
}: {
  component: import('./editor-types.js').ComponentHandle
}) {
  const host = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (host.current) {
      return component.mount(host.current)
    }
  }, [component])

  return createElement('div', { ref: host, style: { display: 'contents' } })
}

function scopedComponent(id: keyof typeof components) {
  function NativeControl() {
    const editor = useDesignEditor()

    return editor
      ? createElement(DesignUI, { component: editor.getUI(id) })
      : null
  }

  NativeControl.displayName = id

  return NativeControl
}

function reactComponents() {
  return Object.freeze(
    Object.fromEntries(
      Object.values(components).map(({ id }) => [
        id[0].toUpperCase() + id.slice(1),
        scopedComponent(id)
      ])
    )
  ) as {
    readonly [Id in keyof typeof components as Capitalize<Id>]: ReturnType<
      typeof scopedComponent
    >
  }
}

/** JSX components bound to the nearest DesignEditorProvider. */
export const UI = /* @__PURE__ */ reactComponents()
