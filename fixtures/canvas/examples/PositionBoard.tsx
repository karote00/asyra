import { dimensionRow, positionRow } from '@asyra/design/inspector-rows'
import { Board } from './DesignBoard'

export function PositionBoard({
  targets = { [positionRow.id]: 'my-toolbar' }
}: {
  targets?: Record<string, string>
}) {
  return (
    <>
      <aside id="my-toolbar" />
      <aside id="size-toolbar" />
      <Board
        options={{ ui: [positionRow, dimensionRow], uiTargets: targets }}
      />
    </>
  )
}
