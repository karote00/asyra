import spec from '../../../../assets/asyra-office/models/textiles/textiles-model-spec.json'
import { bezier, emptyMesh } from './geometry'
import { part, type AssetPart } from './catalog'
import { requiredSpecValue } from './specification'
const source = requiredSpecValue(
  spec.modules.find((m) => m.moduleId === 'throw-pillow'),
  'throw-pillow'
)
function pillowMesh(intervals: readonly number[], radial: number) {
  const g = requiredSpecValue(source.geometry, 'pillow geometry')
  const curves = requiredSpecValue(g.outlineCubicSegments, 'pillow outline')
  const outline = curves.flatMap((points, i) =>
    bezier(
      points.map(([x, z]) => [x, 0, z]),
      intervals[i]
    ).slice(0, -1)
  )
  const mesh = emptyMesh(),
    n = outline.length
  let seam: number[] = []
  for (const side of [-1, 1]) {
    const centre = mesh.positions.length / 3
    mesh.positions.push(0, side * 0.055, 0.16)
    mesh.uvs.push(0.5, 0.5)
    let prior: number[] = []
    const triangle = (a: number, b: number, c: number) =>
      mesh.indices.push(...(side === -1 ? [a, c, b] : [a, b, c]))
    for (let j = 1; j <= radial; j++) {
      const a = (j * Math.PI) / (2 * radial),
        r = Math.sin(a),
        y = j === radial ? 0 : side * 0.055 * Math.cos(a)
      const row =
        j === radial && seam.length
          ? seam
          : outline.map(([x, , z]) => {
              const id = mesh.positions.length / 3
              mesh.positions.push(r * x, y, 0.16 + r * z)
              mesh.uvs.push(0.5 + (r * x) / 0.32, 0.5 + (r * z) / 0.32)
              return id
            })
      for (let i = 0; i < n; i++) {
        const k = (i + 1) % n
        if (j === 1) {
          triangle(centre, row[i], row[k])
        } else {
          triangle(prior[i], row[i], row[k])
          triangle(prior[i], row[k], prior[k])
        }
      }
      if (j === radial) {
        seam = row
      }
      prior = row
    }
  }
  return mesh
}
export function throwPillow(): AssetPart {
  const g = requiredSpecValue(source.geometry, 'pillow geometry'),
    tier = requiredSpecValue(source.lod, 'pillow LoD').tiers[2]
  if (!('outlineIntervals' in tier) || !('radialIntervals' in tier)) {
    throw new Error('Invalid pillow LoD')
  }
  return {
    ...part(
      'pillow',
      pillowMesh(
        requiredSpecValue(g.outlineIntervals, 'outline samples'),
        requiredSpecValue(g.radialIntervals, 'radial samples')
      ),
      0xd4ac57,
      'fabric',
      0.93
    ),
    distant: {
      mesh: pillowMesh(tier.outlineIntervals, tier.radialIntervals),
      maxError: tier.maxSurfaceError
    }
  }
}
