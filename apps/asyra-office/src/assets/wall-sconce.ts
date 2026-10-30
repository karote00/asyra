import accents from '../../../../assets/asyra-office/models/wall-accents/wall-accents-model-spec.json'
import { part, placeParts } from './catalog'
import { bezier, cylinder, ellipsoid, lathe, tube, type Vec } from './geometry'
import { requiredSpecValue } from './specification'

/** Catalog-defined fixture; composition owns its mount and scale. */
export function wallSconce() {
  const spec = requiredSpecValue(
    accents.modules.find((m) => m.moduleId === 'wall-sconce'),
    'sconce'
  )
  const shadePart = requiredSpecValue(
    spec.components.find((c) => c.partId === 'shade'),
    'shade'
  )
  if (!('profileRZ' in shadePart)) {
    throw new Error('Missing shade profile')
  }
  const shade = requiredSpecValue(shadePart.profileRZ, 'shade profile')
  const path: Vec[] = bezier(
    [
      [0, -0.01, 0.15],
      [0, -0.034, 0.15],
      [0, -0.04, 0.167],
      [0, -0.04, 0.185]
    ],
    24
  )
  for (let i = 1; i <= 48; i++) {
    const t = (i * Math.PI) / 48
    path.push([0, -0.1 + 0.06 * Math.cos(t), 0.185 + 0.06 * Math.sin(t)])
  }
  path.push([0, -0.16, 0.145])
  const plate = cylinder(0.05, 0.012, 0.05, 48)
  for (let i = 0; i < plate.positions.length; i += 3) {
    const y = plate.positions[i + 1],
      z = plate.positions[i + 2]
    plate.positions[i + 1] = -z - 0.006
    plate.positions[i + 2] = y + 0.14
  }
  const pieces = [
    part('wall-plate', plate, 0x70543a, 'metal'),
    part('arm', tube(path, 0.005, 16), 0x70543a, 'metal'),
    ...placeParts(
      [part('neck', cylinder(0.022, 0.035, 0.022, 32), 0xbd9254, 'metal')],
      [0, -0.16, 0.1325]
    ),
    ...placeParts(
      [part('shade', lathe([...shade, shade[0]], 64), 0xd7b16c, 'metal')],
      [0, -0.16, 0]
    ),
    ...placeParts(
      [
        part(
          'bulb',
          ellipsoid([0.0275, 0.0275, 0.0275], 24, 16),
          0xfff0c5,
          'ceramic'
        )
      ],
      [0, -0.16, 0.0275]
    ),
    ...placeParts(
      [part('bulb-stem', cylinder(0.012, 0.075), 0xfff0c5, 'ceramic')],
      [0, -0.16, 0.0825]
    )
  ]
  return pieces
}
