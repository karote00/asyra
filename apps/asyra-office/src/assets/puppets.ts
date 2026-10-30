import { smoothRows, garmentDetails } from './puppet-garments'
import { requiredSpecValue } from './specification'
import male from '../../../../assets/asyra-office/models/people/man-puppet-model-spec.json'
import female from '../../../../assets/asyra-office/models/people/woman-puppet-model-spec.json'
import {
  add,
  append,
  bezier,
  ellipsoid,
  emptyMesh,
  loft,
  mul,
  tube,
  vec,
  type Vec
} from './geometry'
import { part, type AssetPart } from './catalog'
interface BodyPart {
  id: string
  recipe: string
  centre?: number[]
  radii?: number[]
  rings?: number[][]
  start?: number[]
  end?: number[]
  startRadii?: number[]
  endRadii?: number[]
  defaultMaterial: string
  centreXZ?: number[]
  radiiXZ?: number[]
  pointsXZ?: number[][]
  radius?: number
  surfaceOffset?: number
}
export function puppet(
  profile: 'man' | 'woman',
  shirt = 0xf3ead9,
  eyewear = profile === 'man',
  seatHeight?: number
): AssetPart[] {
  const spec = profile === 'man' ? male : female,
    p: AssetPart[] = [],
    head = spec.defaultDimensions
  const faceY = (x: number, z: number, offset = 0.002) =>
    (-head.skinHeadSize[1] / 2) *
      Math.sqrt(
        Math.max(
          0,
          1 -
            (x / (head.skinHeadSize[0] / 2)) ** 2 -
            ((z - head.skinHeadCentre[2]) / (head.skinHeadSize[2] / 2)) ** 2
        )
      ) -
    offset
  const materials: Record<string, number> = Object.fromEntries(
    Object.entries(spec.materials).map(([id, material]) => [
      id,
      parseInt(material.baseColorSRGB.slice(1), 16)
    ])
  )
  for (const c of spec.bodyAndFaceParts as BodyPart[]) {
    let mesh = emptyMesh()
    if (c.recipe === 'ellipsoid') {
      append(mesh, ellipsoid(vec(c.radii ?? [])), vec(c.centre ?? []))
    } else if (c.recipe === 'z-loft') {
      mesh = loft(smoothRows(c.rings ?? []))
    } else if (c.recipe === 'tapered-limb') {
      mesh = tube(
        [vec(c.start ?? []), vec(c.end ?? [])],
        [(c.startRadii ?? [])[0], (c.endRadii ?? [])[0]],
        12
      )
    } else if (c.recipe === 'face-ellipse' || c.recipe === 'face-ellipsoid') {
      const [x, z] = c.centreXZ ?? [0, 0],
        r = c.radii ?? [(c.radiiXZ ?? [])[0], 0.004, (c.radiiXZ ?? [])[1]]
      if (c.recipe === 'face-ellipse') {
        mesh = ellipsoid(vec(r), 16, 10)
        for (let i = 0; i < mesh.positions.length; i += 3) {
          mesh.positions[i] += x
          mesh.positions[i + 2] += z
          mesh.positions[i + 1] += faceY(
            mesh.positions[i],
            mesh.positions[i + 2],
            c.surfaceOffset ?? 0.001
          )
        }
      } else {
        append(mesh, ellipsoid(vec(r), 16, 10), [
          x,
          faceY(x, z, c.surfaceOffset ?? 0.001),
          z
        ])
      }
    } else if (c.recipe === 'face-curve') {
      mesh = tube(
        bezier(
          (c.pointsXZ ?? []).map(([x, z]) => [x, faceY(x, z), z]),
          12
        ),
        c.radius ?? 0.002,
        6
      )
    } else {
      throw new Error(`Unsupported puppet part ${c.id}`)
    }
    p.push(
      part(
        c.id,
        mesh,
        requiredSpecValue(materials[c.defaultMaterial], c.defaultMaterial)
      )
    )
  }
  const hair = spec.hair,
    cap = emptyMesh(),
    rows = 16,
    columns = 40
  const scalp = (theta: number, phi: number): Vec => {
    const t = (theta * Math.PI) / 180,
      f = (phi * Math.PI) / 180
    return [
      hair.scalpCentre[0] + hair.scalpRadii[0] * Math.sin(t) * Math.sin(f),
      hair.scalpCentre[1] - hair.scalpRadii[1] * Math.sin(t) * Math.cos(f),
      hair.scalpCentre[2] + hair.scalpRadii[2] * Math.cos(t)
    ]
  }
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      const phi = -180 + (i / columns) * 360,
        a = Math.abs(phi),
        limits = hair.capThetaLimitsDegrees
      const limit =
        a < 90
          ? limits.front +
            (limits.side - limits.front) * ((a / 90) ** 2 * (3 - (2 * a) / 90))
          : limits.side +
            (limits.back - limits.side) *
              (((a - 90) / 90) ** 2 * (3 - (2 * (a - 90)) / 90))
      cap.positions.push(...scalp((j / rows) * limit, phi))
      cap.uvs.push(i / columns, j / rows)
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i,
        b = a + 1,
        c = a + columns + 1,
        d = c + 1
      cap.indices.push(a, c, d, a, d, b)
    }
  }
  const hairColor = profile === 'man' ? 0x403026 : 0x292c2a
  p.push(part('hair-cap', cap, hairColor))
  for (const lock of hair.locks) {
    let points: Vec[]
    if ('controlAnglesDegrees' in lock && lock.controlAnglesDegrees) {
      points = bezier(
        lock.controlAnglesDegrees.map((a) => [a[0], a[1], 0]),
        20
      ).map((a) => scalp(a[0], a[1]))
    } else if ('points' in lock && lock.points) {
      points = bezier(lock.points.map(vec), 20)
    } else {
      throw new Error('Missing hair lock path')
    }
    const m = emptyMesh(),
      sections = 8
    for (let j = 0; j < points.length; j++) {
      const t = j / (points.length - 1),
        table = hair.leafProfile.widthSamples
      const k = Math.min(
        table.length - 2,
        Math.max(
          0,
          table.findIndex(
            (p, i) => i < table.length - 1 && t >= p[0] && t <= table[i + 1][0]
          )
        )
      )
      const u = (t - table[k][0]) / (table[k + 1][0] - table[k][0]),
        f = table[k][1] + (table[k + 1][1] - table[k][1]) * u * u * (3 - 2 * u)
      const next = points[Math.min(j + 1, points.length - 1)],
        prior = points[Math.max(0, j - 1)]
      const tangent = vec(next.map((v, k) => v - prior[k])),
        tl = Math.hypot(...tangent),
        T = mul(tangent, 1 / tl)
      const free = 'frameHint' in lock && lock.frameHint
      const gradient = free
        ? vec(lock.frameHint)
        : vec(
            points[j].map(
              (v, k) => (v - hair.scalpCentre[k]) / hair.scalpRadii[k] ** 2
            )
          )
      const dot = gradient.reduce((sum, v, k) => sum + v * T[k], 0),
        projected = vec(gradient.map((v, k) => v - dot * T[k]))
      const normal = mul(projected, 1 / Math.hypot(...projected)),
        side: Vec = [
          T[1] * normal[2] - T[2] * normal[1],
          T[2] * normal[0] - T[0] * normal[2],
          T[0] * normal[1] - T[1] * normal[0]
        ]
      const w = (lock.width * f) / 2,
        depth = (lock.depth * f) / 2,
        centre = free
          ? points[j]
          : add(points[j], mul(normal, depth - hair.leafProfile.rootInset))
      for (let i = 0; i <= sections; i++) {
        const a = (i / sections) * Math.PI * 2
        m.positions.push(
          ...add(
            centre,
            add(mul(side, Math.cos(a) * w), mul(normal, Math.sin(a) * depth))
          )
        )
        m.uvs.push(i / sections, t)
      }
    }
    for (let j = 0; j < points.length - 1; j++) {
      for (let i = 0; i < sections; i++) {
        const a = j * (sections + 1) + i,
          b = a + 1,
          c = a + sections + 1,
          d = c + 1
        m.indices.push(a, b, d, a, d, c)
      }
    }
    p.push(part(lock.id, m, hairColor))
  }
  const clothing = spec.clothing
  p.push(
    part(
      'shirt',
      loft(smoothRows(clothing.shirt.bodyOuterRings)),
      shirt,
      'fabric'
    )
  )
  for (const s of clothing.shirt.sleeves) {
    p.push(part(s.id, loft(smoothRows(s.rings)), shirt, 'fabric'))
  }
  p.push(
    part(
      'trousers-pelvis',
      loft(smoothRows(clothing.trousers.pelvisOuterRings)),
      0x756f5c,
      'fabric'
    )
  )
  for (const leg of clothing.trousers.legs) {
    p.push(part(leg.id, loft(smoothRows(leg.rings)), 0x756f5c, 'fabric'))
  }
  for (const shoe of clothing.shoes) {
    p.push(part(shoe.id, loft(smoothRows(shoe.outerRings)), 0x584333, 'wood'))
  }
  p.push(...garmentDetails(clothing.shirt, shirt, materials))
  if (eyewear) {
    const g = male.glasses
    g.templePaths.forEach((path, i) =>
      p.push(
        part(
          `eyewear-temple-${i}`,
          tube(bezier(path.map(vec), 16), g.wireRadius, 8),
          0x363832,
          'metal'
        )
      )
    )
    for (const [i, c] of g.ringCentres.entries()) {
      p.push(
        part(
          `rim-${i}`,
          tube(
            Array.from({ length: 41 }, (_, n) => [
              c[0] + g.ringRadius * Math.cos((n / 40) * Math.PI * 2),
              c[1],
              c[2] + g.ringRadius * Math.sin((n / 40) * Math.PI * 2)
            ]),
            g.wireRadius,
            8
          ),
          0x363832,
          'metal'
        )
      )
    }
    p.push(
      part(
        'bridge',
        tube(bezier(g.bridge.map(vec)), g.wireRadius, 8),
        0x363832,
        'metal'
      )
    )
  }
  if (seatHeight !== undefined) {
    if (!Number.isFinite(seatHeight) || seatHeight <= 0) {
      throw new Error('Invalid seat height')
    }
    const body = spec.bodyAndFaceParts as BodyPart[],
      thigh = requiredSpecValue(
        body.find((c) => c.id === 'thigh-left'),
        "body.find((c) => c.id === 'thigh-left')"
      ),
      hip = requiredSpecValue(thigh.start, 'thigh.start')[2],
      knee = requiredSpecValue(thigh.end, 'thigh.end')[2],
      lift =
        seatHeight -
        Math.min(...clothing.trousers.pelvisOuterRings.map((r) => r[0]))
    const upperArm = requiredSpecValue(
        body.find((c) => c.id === 'upper-arm-left'),
        "body.find((c) => c.id === 'upper-arm-left')"
      ),
      shoulder = requiredSpecValue(upperArm.start, 'upperArm.start')[2]
    for (const piece of p) {
      const leg =
        /^(thigh|shin|foot|trouser-|shoe)/.test(piece.id) &&
        piece.id !== 'trousers-pelvis'
      const arm = /^(upper-arm|forearm|hand|sleeve|cuff)/.test(piece.id)
      for (let i = 0; i < piece.mesh.positions.length; i += 3) {
        const y = piece.mesh.positions[i + 1],
          z = piece.mesh.positions[i + 2]
        if (leg) {
          const t = Math.max(0, Math.min(1, (z - knee + 0.04) / 0.08)),
            weight = t * t * (3 - 2 * t)
          piece.mesh.positions[i + 1] =
            (z - hip) * weight + (y - (hip - knee)) * (1 - weight)
          piece.mesh.positions[i + 2] =
            (hip - y) * weight + (z + hip - knee) * (1 - weight)
        } else if (arm) {
          const angle = -Math.PI / 4
          piece.mesh.positions[i + 1] =
            y * Math.cos(angle) - (z - shoulder) * Math.sin(angle)
          piece.mesh.positions[i + 2] =
            y * Math.sin(angle) + (z - shoulder) * Math.cos(angle) + shoulder
        }
        piece.mesh.positions[i + 2] += lift
      }
    }
  }
  return p
}
