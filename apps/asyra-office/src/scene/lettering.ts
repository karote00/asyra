/** Tessellate printed glyph coverage, preserving counters and spaces as empty wall. */
export function glyphTriangles(
  rgba: ArrayLike<number>,
  resolution: number,
  width: number,
  height: number
) {
  const rows: { x0: number; x1: number; y: number }[] = []
  let minX = resolution,
    minY = resolution,
    maxX = 0,
    maxY = 0
  for (let y = 0; y < resolution; y++) {
    let x = 0
    while (x < resolution) {
      if (rgba[(y * resolution + x) * 4 + 3] < 128) {
        x++
        continue
      }
      const x0 = x
      while (x < resolution && rgba[(y * resolution + x) * 4 + 3] >= 128) x++
      rows.push({ x0, x1: x, y })
      minX = Math.min(minX, x0)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y + 1)
    }
  }
  if (!rows.length) throw new Error('Lettering has no visible glyph coverage')
  const positions: number[] = [],
    indices: number[] = []
  for (const row of rows) {
    const x0 = ((row.x0 - minX) / (maxX - minX) - 0.5) * width,
      x1 = ((row.x1 - minX) / (maxX - minX) - 0.5) * width,
      y0 = (0.5 - (row.y + 1 - minY) / (maxY - minY)) * height,
      y1 = (0.5 - (row.y - minY) / (maxY - minY)) * height,
      offset = positions.length / 3
    positions.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0)
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3)
  }
  return { kind: 'triangles' as const, positions, indices }
}
