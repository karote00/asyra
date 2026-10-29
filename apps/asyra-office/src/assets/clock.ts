import specification from '../../../../assets/asyra-office/models/wall-decor/wall-decor-model-spec.json'
import { append, box, emptyMesh, lathe, type Mesh } from './geometry'
import { part, type AssetPart } from './catalog'
import { roundedTaper } from './rounded-turning'
import { requiredSpecValue } from './specification'
export function wallClock(): AssetPart[] {
  const source = requiredSpecValue(
    specification.modules.find((m) => m.moduleId === 'wall-clock'),
    'wall-clock'
  )
  const pieces: AssetPart[] = []
  const add = (id: string, mesh: Mesh, material: string) => {
    const palette = specification.materials as Record<
      string,
      { baseColorSRGB: string; roughness: number }
    >
    const mat = requiredSpecValue(palette[material], material)
    pieces.push(
      part(
        id,
        mesh,
        parseInt(mat.baseColorSRGB.slice(1), 16),
        'plain',
        mat.roughness
      )
    )
  }
  for (const c of source.components) {
    if (!('yMin' in c) || !('material' in c))
      throw new Error('Non-clock component in clock source')
    if (c.primitive === 'cylinder') {
      const radius = requiredSpecValue(c.radius, 'clock radius'),
        min = requiredSpecValue(c.yMin, 'clock yMin'),
        max = requiredSpecValue(c.yMax, 'clock yMax')
      const mesh = roundedTaper(
          [0, 0, -max],
          [0, 0, -min],
          radius,
          radius,
          c.bevel?.width ?? 0.0001,
          64
        ),
        placed = emptyMesh()
      append(placed, mesh, [0, 0, 0], [90, 0, 0])
      add(c.partId, placed, c.material)
    } else if (c.primitive === 'annular-cylinder') {
      const r = requiredSpecValue(c.outerRadius, 'outer radius'),
        inner = requiredSpecValue(c.innerRadius, 'inner radius'),
        z0 = -requiredSpecValue(c.yMax, 'rim back'),
        z1 = -requiredSpecValue(c.yMin, 'rim front'),
        b = 0.002
      const ring = lathe(
          [
            [inner, z0],
            [r - b, z0],
            [r, z0 + b],
            [r, z1 - b],
            [r - b, z1],
            [inner + b, z1],
            [inner, z1 - b],
            [inner, z0]
          ],
          96
        ),
        placed = emptyMesh()
      append(placed, ring, [0, 0, 0], [90, 0, 0])
      add(c.partId, placed, c.material)
    } else if (c.primitive === 'radial-array-of-capsules') {
      for (let i = 0; i < requiredSpecValue(c.count, 'index count'); i++) {
        const angle =
          ((requiredSpecValue(c.angleStart, 'index start') +
            i * requiredSpecValue(c.angleStep, 'index step')) *
            Math.PI) /
          180
        const r = requiredSpecValue(c.centreRadius, 'index radius'),
          mesh = box(
            [
              requiredSpecValue(c.tangentialWidth, 'index width'),
              requiredSpecValue(c.radialLength, 'index height'),
              0.002
            ],
            0.001
          ),
          placed = emptyMesh()
        append(placed, mesh, [0, 0, 0], [0, 0, (-angle * 180) / Math.PI])
        for (let j = 0; j < placed.positions.length; j += 3) {
          const x = placed.positions[j],
            z = placed.positions[j + 1]
          placed.positions[j] = x + r * Math.sin(angle)
          placed.positions[j + 1] = -0.044 + placed.positions[j + 2]
          placed.positions[j + 2] = z + r * Math.cos(angle)
        }
        add(`index-${i}`, placed, c.material)
      }
    } else if (c.primitive === 'extruded-planar-polygon') {
      const vertices = requiredSpecValue(c.vertices, 'hand polygon'),
        n = vertices.length,
        angle = (requiredSpecValue(c.angle, 'hand angle') * Math.PI) / 180,
        mesh = emptyMesh()
      for (const y of [
        requiredSpecValue(c.yMin, 'hand front'),
        requiredSpecValue(c.yMax, 'hand back')
      ])
        for (const [x, z] of vertices) {
          mesh.positions.push(
            x * Math.cos(angle) + z * Math.sin(angle),
            y,
            z * Math.cos(angle) - x * Math.sin(angle)
          )
          mesh.uvs.push(0, 0)
        }
      for (let i = 1; i < n - 1; i++)
        mesh.indices.push(0, i, i + 1, n, n + i + 1, n + i)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        mesh.indices.push(i, i + n, j + n, i, j + n, j)
      }
      add(c.partId, mesh, c.material)
    } else throw new Error(`Unsupported clock part ${c.partId}`)
  }
  return pieces
}
