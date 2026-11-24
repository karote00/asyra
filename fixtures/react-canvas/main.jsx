import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AsyraCanvas } from '@asyra/react'

function App() {
  const [first, setFirst] = useState(true)
  return (
    <>
      <button onClick={() => setFirst(!first)}>Toggle first editor</button>
      {first && <AsyraCanvas />}
      <AsyraCanvas
        title="Persistent diagram"
        documentId="diagram"
        actions={[
          {
            label: 'Add block',
            execute: (editor) =>
              editor.drawRectangle({ x: 16, y: 12, width: 30, height: 20 })
          },
          {
            label: 'Invalid block',
            execute: (editor) =>
              editor.drawRectangle({ x: 0, y: 0, width: -1, height: 20 })
          }
        ]}
      />
    </>
  )
}

createRoot(globalThis.document.querySelector('#root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
