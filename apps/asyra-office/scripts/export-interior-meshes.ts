/** Modeling input for reference fitting; uses the same catalog geometry as the app. */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { catalogAsset } from '../src/assets/catalog'
import { teaChair, teaTable } from '../src/assets/furnishings'
import { pantryCanister } from '../src/assets/pantry-smallware'
import landmarks from '../src/scene/reference/interior-landmarks.json'
import { planter } from '../src/assets/plants'
const assets = {
  ...Object.fromEntries(
    Object.entries(landmarks.indoorPlants).map(([id, config]) => [
      id + '-foliage',
      planter(1, undefined, config.seed, 'rosette').filter((p) =>
        p.id.startsWith('leaf-')
      )
    ])
  ),
  sinkCountertop: catalogAsset('sink-cabinet').filter(
    (p) => p.id === 'countertop'
  ),
  canister: pantryCanister(),
  desk: catalogAsset('writing-desk'),
  chair: catalogAsset('work-chair'),
  sofa: catalogAsset('two-seat-sofa'),
  armchair: catalogAsset('lounge-armchair'),
  fridge: catalogAsset('pantry-fridge'),
  dispenser: catalogAsset('water-dispenser'),
  dispenserBody: catalogAsset('water-dispenser').filter(
    (p) => p.id !== 'bottle'
  ),
  dispenserBottle: catalogAsset('water-dispenser').filter(
    (p) => p.id === 'bottle'
  ),
  sink: catalogAsset('sink-cabinet'),
  coffeeTable: catalogAsset('round-coffee-table'),
  teaChair: teaChair(),
  teaTable: teaTable(),
  planterVessel: planter().filter((p) => p.id === 'pot')
}
const meshes = Object.fromEntries(
  Object.entries(assets).map(([id, parts]) => {
    const unique = new Map<string, number[]>()
    for (const p of parts) {
      for (let i = 0; i < p.mesh.positions.length; i += 3) {
        const vertex = p.mesh.positions.slice(i, i + 3)
        unique.set(vertex.map((n) => n.toFixed(6)).join(','), vertex)
      }
    }
    return [id, [...unique.values()]]
  })
)
writeFileSync(
  resolve('tmp/setup/office-fit-meshes.json'),
  JSON.stringify(meshes)
)
process.stdout.write(
  'Exported production asset meshes and named dispenser regions for image-bound fitting.\n'
)
