import { lathe, type Mesh, type Vec } from './geometry'

/** Tangent end fillets, then horizontal-ring shear; caps remain horizontal. */
export function roundedTaper(
  bottom: Vec,
  top: Vec,
  r0: number,
  r1: number,
  bevel: number,
  segments = 48
): Mesh {
  const height = top[2] - bottom[2]
  if (height <= 2 * bevel || Math.min(r0, r1) <= bevel) {
    throw new Error('Invalid rounded taper')
  }
  const k = (r1 - r0) / height,
    q = Math.hypot(1, k),
    alpha = -Math.atan(k)
  const lower = r0 + k * bevel - bevel * q,
    upper = r1 - k * bevel - bevel * q
  const profile: number[][] = [
    [0, 0],
    [lower, 0]
  ]
  for (let i = 0; i <= 4; i++) {
    const angle = -Math.PI / 2 + ((alpha + Math.PI / 2) * i) / 4
    profile.push([
      lower + bevel * Math.cos(angle),
      bevel + bevel * Math.sin(angle)
    ])
  }
  for (let i = 0; i <= 4; i++) {
    const angle = alpha + ((Math.PI / 2 - alpha) * i) / 4
    profile.push([
      upper + bevel * Math.cos(angle),
      height - bevel + bevel * Math.sin(angle)
    ])
  }
  profile.push([0, height])
  const mesh = lathe(profile, segments)
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const u = mesh.positions[i + 2] / height
    mesh.positions[i] += bottom[0] + (top[0] - bottom[0]) * u
    mesh.positions[i + 1] += bottom[1] + (top[1] - bottom[1]) * u
    mesh.positions[i + 2] += bottom[2]
  }
  return mesh
}
