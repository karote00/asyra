export const buildingExample: Readonly<{
  original: string
  replacement: string
  width: number
  depth: number
  floorHeight: number
  houseFloors: number
  towerFloors: number
}>
export function getBuildingGeometry(
  rise: number,
  tower: number
): {
  height: number
  tower: number
  rise: number
  floors: { slab: number; wall: number; facade: number }[]
  parts: {
    id: string
    points: string
    fill: string
    opacity: number
    stroke: string
  }[]
}
