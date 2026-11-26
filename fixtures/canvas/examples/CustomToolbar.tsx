import { useState } from 'react'
import type { DesignEditor } from '@asyra/design'
import { DesignUI } from '@asyra/design/react'
import { Board } from './DesignBoard'

export function CustomToolbar({
  onMount
}: {
  onMount(editor: DesignEditor): void
}) {
  const [editor, setEditor] = useState<DesignEditor | null>(null)
  const [visible, setVisible] = useState(true)

  return (
    <main>
      <Board
        hideUI
        onMount={(ready) => {
          setEditor(ready)
          onMount(ready)
        }}
      />
      <aside>
        {editor && visible && (
          <DesignUI component={editor.getUI('penToolIcon')} />
        )}
      </aside>
      <button onClick={() => setVisible(!visible)}>
        {visible ? 'Hide pen' : 'Show pen'}
      </button>
    </main>
  )
}
