import { useState } from 'react'
import type { DesignEditor } from '@asyra/design'
import { DesignEditorProvider } from '@asyra/design/react'
import { Board } from './DesignBoard'
import { PenToolbar } from './PenToolbar'

export function CustomToolbar({
  onMount
}: {
  onMount(editor: DesignEditor): void
}) {
  const [visible, setVisible] = useState(true)

  return (
    <DesignEditorProvider>
      <main>
        <Board hideUI onMount={onMount} />
        {visible && <PenToolbar />}
        <button onClick={() => setVisible(!visible)}>
          {visible ? 'Hide pen' : 'Show pen'}
        </button>
      </main>
    </DesignEditorProvider>
  )
}
