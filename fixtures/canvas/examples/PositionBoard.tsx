import { positionRow } from '@asyra/design-ui'
import { Board } from './DesignBoard'

export function PositionBoard() {
  return (
    <>
      <aside id="my-toolbar" />
      <Board
        options={{
          hideUI: true,
          ui: [positionRow],
          uiTargets: { [positionRow.id]: 'my-toolbar' }
        }}
      />
    </>
  )
}
