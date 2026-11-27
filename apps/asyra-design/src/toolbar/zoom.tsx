import { useZoom } from '../providers'

const Zoom = () => {
  const zoom = useZoom()

  return (
    <div
      data-toolbar-readout="zoom"
      className="zoom-display"
      data-testid="zoom-level"
      data-value={zoom}
    >
      {(zoom * 100).toFixed(0)}%
    </div>
  )
}

export default Zoom
