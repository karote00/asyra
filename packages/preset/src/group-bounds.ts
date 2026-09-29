// Pure geometry shared by Preset operations and server-side preparation.
export interface GroupBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export const deriveGroupBounds = (
  rectangles: readonly GroupBounds[]
): GroupBounds => {
  if (rectangles.length === 0) {
    return Object.freeze({ x: 0, y: 0, width: 0, height: 0 })
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  rectangles.forEach(({ x, y, width, height }) => {
    const values = [x, y, width, height]
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(
        '[Preset] Group operation requires finite 2D geometry: direct-child rectangle is invalid'
      )
    }
    minX = Math.min(minX, x, x + width)
    minY = Math.min(minY, y, y + height)
    maxX = Math.max(maxX, x, x + width)
    maxY = Math.max(maxY, y, y + height)
  })

  return Object.freeze({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  })
}
