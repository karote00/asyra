import spec from '../../../../assets/asyra-office/models/shop-awning/shop-awning-model-spec.json'
import { part, type AssetPart } from './catalog'
import { extrudeProfile } from './profile-extrusion'
export interface AwningOptions {
  moduleWidth?: number
  count?: number
  width?: number
  length?: number
  angle?: number
  valance?: number
  mode?: 'solid' | 'alternating'
  palette?: readonly number[]
}
export function awning(options: AwningOptions = {}): AssetPart[] {
  const w = options.moduleWidth ?? spec.assembly.defaultModuleWidth,
    length = options.length ?? Math.hypot(0.8, 0.3),
    angle =
      ((options.angle ?? (Math.atan2(0.3, 0.8) * 180) / Math.PI) * Math.PI) /
      180,
    valance = options.valance ?? 0.12,
    t = spec.object.canopyVerticalThickness,
    d = spec.object.valanceDepth,
    mode = options.mode ?? 'alternating',
    palette =
      options.palette ?? (mode === 'solid' ? [0x657b89] : [0x657b89, 0xeee4d2])
  if (options.count !== undefined && options.width !== undefined)
    throw new Error('Choose count or width')
  let q = options.width !== undefined ? options.width / w : (options.count ?? 8)
  if (
    ![w, length, valance, q].every((n) => Number.isFinite(n) && n > 0) ||
    !Number.isFinite(angle) ||
    angle < 0 ||
    angle >= Math.PI / 2
  )
    throw new Error('Invalid awning dimensions')
  if (
    !['solid', 'alternating'].includes(mode) ||
    palette.length !== (mode === 'solid' ? 1 : 2)
  )
    throw new Error('Invalid awning palette')
  const nearest = Math.round(q)
  if (
    nearest > 0 &&
    Math.abs(q - nearest) <= 8 * Number.EPSILON * Math.max(1, Math.abs(q))
  )
    q = nearest
  const P = length * Math.cos(angle),
    H = valance + length * Math.sin(angle),
    m = Math.tan(angle),
    W = q * w,
    N = Math.ceil(q)
  if (P <= d || valance - t + d * m <= 0)
    throw new Error('Degenerate awning fold')
  const profile = [
    [-P, 0],
    [-P + d, 0],
    [-P + d, valance - t + d * m],
    [0, H - t],
    [0, H],
    [-P, valance]
  ]
  return Array.from({ length: N }, (_, i) =>
    part(
      `strip-${i}`,
      extrudeProfile(
        profile,
        0,
        [-W / 2 + i * w, Math.min(W / 2, -W / 2 + (i + 1) * w)],
        [i === 0, i === N - 1]
      ),
      palette[i % palette.length],
      'fabric',
      0.9
    )
  )
}
