import { useCallback, useEffect, useRef, useState } from 'react'
import type { DesignEditor } from '@asyra/design'
import { DesignEditorProvider, useDesignEditor } from '@asyra/design/react'
import { Board } from './DesignBoard'

function Controls({
  name,
  register
}: {
  name: string
  register(name: string, editor: DesignEditor<string> | null): () => void
}) {
  const editor = useDesignEditor()

  useEffect(() => register(name, editor), [editor, name, register])

  return (
    <button disabled={!editor} onClick={() => editor?.setTool('pen')}>
      {name} pen
    </button>
  )
}

export function ComparisonBoard({
  ready,
  observed
}: {
  ready(name: string, editor: DesignEditor): void
  observed(name: string, editor: DesignEditor<string> | null): void
}) {
  const [leftKey, setLeftKey] = useState('left')
  const [showLeft, setShowLeft] = useState(true)

  const boards = useRef(new Map<string, DesignEditor<string>>())
  const register = useCallback(
    (name: string, editor: DesignEditor<string> | null) => {
      observed(name, editor)
      if (editor) {
        boards.current.set(name, editor)
      }

      return () => {
        boards.current.delete(name)
      }
    },
    [observed]
  )

  return (
    <>
      <button
        onClick={() => {
          for (const editor of boards.current.values()) {
            editor.setTool('select')
          }
        }}
      >
        Select tool on all boards
      </button>
      <DesignEditorProvider>
        <Controls name="left" register={register} />
        {showLeft && (
          <Board
            hideUI
            storageKey={leftKey}
            onMount={(e) => ready('left', e)}
          />
        )}
        <DesignEditorProvider>
          <Controls name="right" register={register} />
          <Board hideUI onMount={(e) => ready('right', e)} />
        </DesignEditorProvider>
        <button onClick={() => setLeftKey('replacement')}>Replace left</button>
        <button onClick={() => setShowLeft(!showLeft)}>Toggle left</button>
      </DesignEditorProvider>
    </>
  )
}
