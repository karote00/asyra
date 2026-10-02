export interface Furniture {
  readonly id: string
  readonly kind: 'desk' | 'sofa' | 'plant'
  readonly x: number
  readonly z: number
}
export interface OfficeLayout {
  readonly version: 1
  readonly width: number
  readonly depth: number
  readonly wall: number
  readonly furniture: readonly Furniture[]
}
export const INITIAL_LAYOUT: OfficeLayout = Object.freeze({
  version: 1,
  width: 8,
  depth: 6,
  wall: 0xe7d8c5,
  furniture: Object.freeze([
    Object.freeze({ id: 'desk', kind: 'desk' as const, x: -1.5, z: -1 }),
    Object.freeze({ id: 'sofa', kind: 'sofa' as const, x: -2, z: 1.5 }),
    Object.freeze({ id: 'plant', kind: 'plant' as const, x: 2.5, z: -2 })
  ])
})
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
export function validLayout(value: unknown): value is OfficeLayout {
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.width !== 'number' ||
    typeof value.depth !== 'number' ||
    value.width < 6 ||
    value.width > 16 ||
    value.depth < 6 ||
    value.depth > 16 ||
    !Number.isInteger(value.width) ||
    !Number.isInteger(value.depth) ||
    !Number.isInteger(value.wall) ||
    Number(value.wall) < 0 ||
    Number(value.wall) > 0xffffff ||
    !Array.isArray(value.furniture) ||
    value.furniture.length > 50
  )
    return false
  const ids = new Set<string>()
  const occupied = new Set<string>()
  for (const item of value.furniture) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      !['desk', 'sofa', 'plant'].includes(String(item.kind)) ||
      typeof item.x !== 'number' ||
      typeof item.z !== 'number' ||
      !Number.isFinite(item.x) ||
      !Number.isFinite(item.z) ||
      !Number.isInteger(item.x * 2) ||
      !Number.isInteger(item.z * 2) ||
      Math.abs(item.x) > value.width / 2 - 1 ||
      Math.abs(item.z) > value.depth / 2 - 1
    )
      return false
    const cell = `${item.x}:${item.z}`
    if (occupied.has(cell)) return false
    ids.add(item.id)
    occupied.add(cell)
  }
  return true
}
export function readLayout(value: unknown): OfficeLayout {
  if (!validLayout(value))
    throw new Error(
      'Invalid layout: use the room grid and keep furniture inside the room without duplicate cells'
    )
  return Object.freeze({
    ...value,
    furniture: Object.freeze(
      value.furniture.map((item) => Object.freeze({ ...item }))
    )
  })
}
export interface LayoutProposal {
  readonly expectedRevision: number
  readonly author: string
  readonly layout: OfficeLayout
}
export const PLACES = Object.freeze({
  office: { label: 'Studio', point: [0, 0, 0] as const },
  park: { label: 'Pocket park', point: [5.5, 0, 2] as const },
  coffee: { label: 'Coffee stop', point: [5.5, 0, -3] as const }
})
export type PlaceId = keyof typeof PLACES
export type Point3 = readonly [number, number, number]
/** Renderer-local motion; route changes never mutate the document. */
export class WaypointMotion {
  private position: Point3 = [0, 0, 0]
  private target: Point3 = [0, 0, 0]
  setTarget(point: Point3): void {
    this.target = [...point]
  }
  getPosition(): Point3 {
    return this.position
  }
  get moving(): boolean {
    return this.position.some(
      (value, index) => Math.abs(value - this.target[index]) > 0.001
    )
  }
  advance(seconds: number, reducedMotion = false): Point3 {
    const distance = Math.hypot(
      ...this.target.map((value, index) => value - this.position[index])
    )
    if (!distance) return this.position
    const fraction = reducedMotion
      ? 1
      : Math.min(1, (Math.max(0, seconds) * 2.5) / distance)
    this.position = this.position.map(
      (value, index) => value + (this.target[index] - value) * fraction
    ) as unknown as Point3
    return this.position
  }
}
