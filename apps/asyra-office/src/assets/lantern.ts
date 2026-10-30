import { requiredSpecValue } from './specification'
import street from '../../../../assets/asyra-office/models/street/street-model-spec.json'
import { append, box, emptyMesh, lathe, type Mesh, type Vec } from './geometry'
import { part, placeParts, type AssetPart } from './catalog'
const spec = requiredSpecValue(
  street.modules.find((m) => m.moduleId === 'streetlight-vintage-lantern'),
  "street.modules.find(\n  (m) => m.moduleId === 'streetlight-vintage-lantern'\n)"
)
/** Shape-preserving radial interpolation from the approved construction guide. */
function profile(stations: number[][], lastDerivative = 0): number[][] {
  const h = stations.slice(1).map((s, i) => s[0] - stations[i][0])
  const d = h.map((v, i) => (stations[i + 1][1] - stations[i][1]) / v)
  const slopes = stations.map((_, i) => {
    if (i === 0) {
      return 0
    }
    if (i === stations.length - 1) {
      return lastDerivative
    }
    if (d[i - 1] * d[i] <= 0) {
      return 0
    }
    const a = 2 * h[i] + h[i - 1],
      b = h[i] + 2 * h[i - 1]
    return (a + b) / (a / d[i - 1] + b / d[i])
  })
  return stations
    .slice(0, -1)
    .flatMap(([z, r], i) =>
      Array.from({ length: 8 }, (_, j) => {
        const u = j / 8
        return [
          (2 * u ** 3 - 3 * u * u + 1) * r +
            (u ** 3 - 2 * u * u + u) * h[i] * slopes[i] +
            (-2 * u ** 3 + 3 * u * u) * stations[i + 1][1] +
            (u ** 3 - u * u) * h[i] * slopes[i + 1],
          z + u * h[i]
        ]
      })
    )
    .concat([
      [
        requiredSpecValue(stations.at(-1), 'stations.at(-1)')[1],
        requiredSpecValue(stations.at(-1), 'stations.at(-1)')[0]
      ]
    ])
}
/** Closed ruled prism; matching polygon vertices preserve the specified slope. */
function prism(bottom: Vec[], top: Vec[]): Mesh {
  const m = emptyMesh(),
    n = bottom.length
  for (const p of [...bottom, ...top]) {
    m.positions.push(...p)
    m.uvs.push((p[0] + 0.3) / 0.6, (p[2] - 1.94) / 0.8)
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    m.indices.push(i, j, j + n, i, j + n, i + n)
  }
  for (let i = 1; i < n - 1; i++) {
    m.indices.push(0, i + 1, i, n, n + i, n + i + 1)
  }
  return m
}
const square = (half: number, z: number): Vec[] => [
  [-half, -half, z],
  [half, -half, z],
  [half, half, z],
  [-half, half, z]
]
export function lantern(): AssetPart[] {
  const s = spec,
    metal = 0x393b37,
    p: AssetPart[] = []
  const revolve = (id: string, stations: number[][], color = metal) =>
    p.push(part(id, lathe(profile(stations), 64), color, 'metal'))
  revolve('foot', [
    [0, 0],
    ...requiredSpecValue(s.foot, 's.foot').latheZRadiusMetres
  ])
  for (const c of requiredSpecValue(s.collars, 's.collars')) {
    revolve(
      c.partId,
      c.latheZRadiusMetres,
      c.partId === 'foot-collar' ? 0x756344 : metal
    )
  }
  const shaft = requiredSpecValue(s.shaft, 's.shaft')
  p.push(
    part(
      'shaft',
      lathe(
        [
          [shaft.radiusBottomMetres, shaft.zRangeMetres[0]],
          [shaft.radiusTopMetres, shaft.zRangeMetres[1]]
        ],
        64
      ),
      metal,
      'metal'
    )
  )
  revolve('neck', requiredSpecValue(s.neck, 's.neck').latheZRadiusMetres)
  const f = requiredSpecValue(s.frame, 's.frame'),
    [z0, z1] = f.zRangeMetres,
    a = (z: number) =>
      f.bottomOuterSideMetres / 2 +
      (((f.topOuterSideMetres - f.bottomOuterSideMetres) / 2) * (z - z0)) /
        (z1 - z0)
  p.push(
    part(
      'tray',
      prism(
        square(a(z0), z0),
        square(
          a(z0 + f.bottomTrayThicknessMetres),
          z0 + f.bottomTrayThicknessMetres
        )
      ),
      metal,
      'metal'
    )
  )
  // Each face is divided into two posts and two rails, leaving a real pane opening.
  for (let face = 0; face < 4; face++) {
    const segments = [
      [z0, z0 + f.bottomRingHeightMetres, -1, 1],
      [z1 - f.topRingHeightMetres, z1, -1, 1],
      [z0 + f.bottomRingHeightMetres, z1 - f.topRingHeightMetres, -1, -1],
      [z0 + f.bottomRingHeightMetres, z1 - f.topRingHeightMetres, 1, 1]
    ]
    for (const [i, [lo, hi, left, right]] of segments.entries()) {
      const section = (z: number): Vec[] => {
        const half = a(z)
        let x0 = -half,
          x1 = half
        if (left === right) {
          x0 = left < 0 ? -half : half - f.postFaceWidthMetres
          x1 = right < 0 ? -half + f.postFaceWidthMetres : half
        }
        return [
          [x0, -half, z],
          [x1, -half, z],
          [x1, -half + f.wallDepthAlongXYMetres, z],
          [x0, -half + f.wallDepthAlongXYMetres, z]
        ]
      }
      const mesh = emptyMesh()
      append(
        mesh,
        prism(section(lo), section(hi)),
        [0, 0, 0],
        [0, 0, face * 90]
      )
      p.push(part(`frame-${face}-${i}`, mesh, metal, 'metal'))
    }
    const g = requiredSpecValue(s.glass, 's.glass'),
      section = (z: number, width: number): Vec[] => {
        const front = -a(z) + g.frontPlaneSetbackAlongXYMetres
        return [
          [-width / 2, front, z],
          [width / 2, front, z],
          [width / 2, front + g.wallThicknessMetres, z],
          [-width / 2, front + g.wallThicknessMetres, z]
        ]
      }
    const pane = emptyMesh()
    append(
      pane,
      prism(
        section(g.bottomZMetres, g.bottomPanelWidthMetres),
        section(g.topZMetres, g.topPanelWidthMetres)
      ),
      [0, 0, 0],
      [0, 0, face * 90]
    )
    p.push(part(`pane-${face}`, pane, 0xe6c47f, 'plain'))
  }
  const r = requiredSpecValue(s.roof, 's.roof')
  p.push(
    ...placeParts(
      [
        part(
          'eave',
          box(
            [
              r.eaveSideMetres,
              r.eaveSideMetres,
              r.eaveTopZMetres - r.eaveBottomZMetres
            ],
            r.bevelMetres
          ),
          metal,
          'metal'
        )
      ],
      [0, 0, (r.eaveBottomZMetres + r.eaveTopZMetres) / 2]
    )
  )
  p.push(
    part(
      'hip-roof',
      prism(
        square(r.eaveSideMetres / 2, r.eaveTopZMetres),
        square(r.peakSideMetres / 2, r.peakZMetres)
      ),
      metal,
      'metal'
    )
  )
  const ftop = requiredSpecValue(s.finial, 's.finial'),
    fp = profile(ftop.latheZRadiusMetres, ftop.lastDerivativeRadiusPerZ)
  const start = Math.acos(
    (ftop.topSphereStartZMetres - ftop.topSphereCentreZMetres) /
      ftop.topSphereRadiusMetres
  )
  for (let i = 1; i <= 24; i++) {
    const t = start * (1 - i / 24)
    fp.push([
      ftop.topSphereRadiusMetres * Math.sin(t),
      ftop.topSphereCentreZMetres + ftop.topSphereRadiusMetres * Math.cos(t)
    ])
  }
  p.push(part('finial', lathe(fp, 64), metal, 'metal'))
  return p
}
