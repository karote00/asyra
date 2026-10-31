import { requiredSpecValue } from './specification'
import spec from '../../../../assets/asyra-office/models/accent-furniture/accent-furniture-model-spec.json'
import { box, emptyMesh, append, type Mesh, type Vec } from './geometry'
import { part, type AssetPart } from './catalog'

/** One joined exterior: four underside openings, with no hidden leg caps. */
export function lowStool(): AssetPart[] {
  const source = requiredSpecValue(
    spec.assets.find((a) => a.name === 'square-low-stool'),
    'square-low-stool'
  )
  const boxes = source.parts.filter((p) => 'size' in p && 'center' in p)
  const cushion = requiredSpecValue(
    boxes.find((p) => p.name === 'cushion'),
    'cushion'
  )
  const legs = boxes.filter((p) => p.name.startsWith('leg-'))
  const make = (segments: number) => {
    const mesh = emptyMesh()
    append(
      mesh,
      box(cushion.size as Vec, cushion.radius, segments),
      cushion.center as Vec
    )
    const bottom = 0.16
    const index: number[] = []
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const face = mesh.indices.slice(i, i + 3)
      if (
        !face.every((j) => Math.abs(mesh.positions[j * 3 + 2] - bottom) < 1e-9)
      ) {
        index.push(...face)
      }
    }
    mesh.indices = index
    const triangle = (a: number[], b: number[], c: number[]) => {
      const n = mesh.positions.length / 3
      for (const v of [a, c, b]) {
        mesh.positions.push(v[0], v[1], bottom)
        mesh.uvs.push(v[0], v[1])
      }
      mesh.indices.push(n, n + 1, n + 2)
    }
    const rect = (x0: number, x1: number, y0: number, y1: number) => {
      triangle([x0, y0], [x1, y0], [x1, y1])
      triangle([x0, y0], [x1, y1], [x0, y1])
    }
    const a = 0.145,
      b = 0.1425,
      d = 0.1075
    rect(-d, d, -d, d)
    rect(-d, d, d, b)
    rect(-d, d, -b, -d)
    rect(d, b, -d, d)
    rect(-b, -d, -d, d)
    // Four trapezoids; the inner chain includes every leg/arm boundary vertex.
    for (let side = 0; side < 4; side++) {
      const rotate = ([x, y]: number[]) => {
        for (let i = 0; i < side; i++) {
          ;[x, y] = [-y, x]
        }
        return [x, y]
      }
      const points = [
        [a, -a],
        [a, a],
        [b, b],
        [b, d],
        [b, -d],
        [b, -b]
      ].map(rotate)
      for (let j = 1; j < points.length - 1; j++) {
        triangle(points[0], points[j], points[j + 1])
      }
    }
    const result: Mesh[] = [mesh]
    for (const leg of legs) {
      const m = emptyMesh()
      append(m, box([leg.size[0], leg.size[1], bottom]), [
        leg.center[0],
        leg.center[1],
        bottom / 2
      ])
      m.indices = m.indices.filter((_, i, indices) => {
        const start = i - (i % 3)
        return !indices
          .slice(start, start + 3)
          .every((j) => Math.abs(m.positions[j * 3 + 2] - bottom) < 1e-9)
      })
      result.push(m)
    }
    return result
  }
  const near = make(3),
    far = make(2)
  return [cushion, ...legs].map((p, i) => ({
    ...part(
      p.name,
      near[i],
      i === 0 ? 0xcb7135 : 0x60422e,
      i === 0 ? 'fabric' : 'wood'
    ),
    distant: { mesh: far[i], maxError: i === 0 ? 0.002 : 0.000001 }
  }))
}
