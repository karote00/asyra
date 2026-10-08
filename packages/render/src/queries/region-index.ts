import type { Rect } from '@asyra/utils'

export const assertRegionBounds = (bounds: Rect): void => {
  if (
    !bounds ||
    ![
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      bounds.x + bounds.width,
      bounds.y + bounds.height
    ].every(Number.isFinite) ||
    bounds.width < 0 ||
    bounds.height < 0
  )
    throw new Error('Region bounds must be finite with nonnegative dimensions')
}

interface Cell<T> {
  x: number
  y: number
  entries: Map<T, Rect>
}
interface Location {
  size: number
  key: string
}

/** One cell per entry; large extents use a coarser level instead of duplicating IDs. */
export class RegionIndex<T> {
  private readonly levels = new Map<number, Map<string, Cell<T>>>()
  private readonly locations = new Map<T, Location>()

  set(id: T, bounds: Rect): void {
    assertRegionBounds(bounds)
    const size =
      2 **
      Math.min(
        1023,
        Math.max(
          0,
          Math.ceil(Math.log2(Math.max(bounds.width, bounds.height, 1)))
        )
      )
    const x = Math.floor((bounds.x + bounds.width / 2) / size)
    const y = Math.floor((bounds.y + bounds.height / 2) / size)
    const key = `${x},${y}`
    this.delete(id)
    let level = this.levels.get(size)
    if (!level) this.levels.set(size, (level = new Map()))
    let cell = level.get(key)
    if (!cell) level.set(key, (cell = { x, y, entries: new Map() }))
    cell.entries.set(id, { ...bounds })
    this.locations.set(id, { size, key })
  }

  has(id: T): boolean {
    return this.locations.has(id)
  }

  delete(id: T): void {
    const location = this.locations.get(id)
    if (!location) return
    const level = this.levels.get(location.size)
    const cell = level?.get(location.key)
    if (!level || !cell)
      throw new Error('Region index location has no owning cell')
    cell.entries.delete(id)
    if (!cell.entries.size) level.delete(location.key)
    if (!level.size) this.levels.delete(location.size)
    this.locations.delete(id)
  }

  query(bounds: Rect): {
    values: T[]
    visitedCells: number
    checkedEntries: number
  } {
    assertRegionBounds(bounds)
    const result = { values: [] as T[], visitedCells: 0, checkedEntries: 0 }
    const visit = (cell: Cell<T> | undefined) => {
      result.visitedCells++
      if (!cell) return
      for (const [id, entry] of cell.entries) {
        result.checkedEntries++
        if (
          entry.x <= bounds.x + bounds.width &&
          entry.x + entry.width >= bounds.x &&
          entry.y <= bounds.y + bounds.height &&
          entry.y + entry.height >= bounds.y
        )
          result.values.push(id)
      }
    }
    for (const [size, cells] of this.levels) {
      // Full cell padding covers the largest entry in this level, including boundaries.
      const minX = Math.floor(bounds.x / size) - 1
      const maxX = Math.floor((bounds.x + bounds.width) / size) + 1
      const minY = Math.floor(bounds.y / size) - 1
      const maxY = Math.floor((bounds.y + bounds.height) / size) + 1
      const cellCount = (maxX - minX + 1) * (maxY - minY + 1)
      if (
        cellCount <= cells.size &&
        [minX, maxX, minY, maxY].every(Number.isSafeInteger)
      ) {
        for (let x = minX; x <= maxX; x++)
          for (let y = minY; y <= maxY; y++) visit(cells.get(`${x},${y}`))
      } else {
        for (const cell of cells.values()) {
          if (
            cell.x >= minX &&
            cell.x <= maxX &&
            cell.y >= minY &&
            cell.y <= maxY
          )
            visit(cell)
          else result.visitedCells++
        }
      }
    }
    return result
  }
}
