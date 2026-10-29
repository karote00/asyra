/** Export production parts for the offline room-relative measurement solver. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { catalogAsset } from '../src/assets/catalog'
import { teaChair, teaTable } from '../src/assets/furnishings'
const assets = {
  desk: catalogAsset('writing-desk'),
  'desk-chair': catalogAsset('work-chair'),
  'meeting-table': teaTable(),
  'meeting-chair-left': teaChair(),
  'meeting-chair-right': teaChair(),
  'lounge-coffee-table': catalogAsset('round-coffee-table'),
  'lounge-side-chair': catalogAsset('lounge-armchair')
}
mkdirSync('tmp/setup', { recursive: true })
writeFileSync(
  'tmp/setup/seating-measurement-meshes.json',
  JSON.stringify(
    Object.fromEntries(
      Object.entries(assets).map(([id, parts]) => [
        id,
        parts.map((p) => ({ id: p.id, positions: p.mesh.positions }))
      ])
    )
  )
)
