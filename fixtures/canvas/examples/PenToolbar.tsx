import { DesignUI, useDesignEditor } from '@asyra/design/react'

export function PenToolbar() {
  const editor = useDesignEditor()

  return (
    <aside>
      {editor && <DesignUI component={editor.getUI('penToolIcon')} />}
    </aside>
  )
}
