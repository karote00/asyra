import { useWidth, useHeight } from '../providers'
import { GeometryInput } from './geometry-input'

export default function Dimension() {
  const width = useWidth()
  const height = useHeight()

  return (
    <div className="grid grid-cols-2 items-center gap-2 pl-4 pr-2 h-8 min-h-8">
      <GeometryInput field="width" label="W" value={width} />
      <GeometryInput field="height" label="H" value={height} />
    </div>
  )
}
