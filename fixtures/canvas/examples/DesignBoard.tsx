import { AsyraDesign } from '@asyra/design/react'

export default function DesignBoard() {
  return <AsyraDesign />
}

export { AsyraDesign as Board }

export function SavedBoard() {
  return <AsyraDesign options={{ storageKey: 'my-board' }} />
}
