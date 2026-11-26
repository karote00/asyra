import { useX, useY } from '../providers'
import { GeometryInput } from './geometry-input'

export default function Position() {
  const x = useX()
  const y = useY()

  return (
    <div className="grid grid-cols-2 items-center gap-2 pl-4 pr-2 h-8 min-h-8">
      <GeometryInput field="x" label="X" value={x} />
      <GeometryInput field="y" label="Y" value={y} />
    </div>
  )
}
