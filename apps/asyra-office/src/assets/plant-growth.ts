import { requiredSpecValue } from './specification'
import spec from '../../../../assets/asyra-office/models/small-plants/small-plants-model-spec.json'

interface LeafScaffold {
  tipRadius: number
  width: number
  tipZ: number
  attachZ: number
}

/** Stable growth is constructed once per plant, independently of the camera. */
export function createPlantGrowth(
  seed: number,
  scaffold: readonly LeafScaffold[],
  config = requiredSpecValue(spec.modules[0].growth, 'plant growth recipe')
) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error('Plant seed must be an unsigned 32-bit integer')
  let state = seed >>> 0
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return (state + 0.5) / 2 ** 32
  }
  const sample = (range: readonly number[]) =>
    range[0] + next() * (range[1] - range[0])
  const count =
    config.leafCount[0] +
    Math.floor(next() * (config.leafCount[1] - config.leafCount[0] + 1))
  const phase = next() * 360
  const pairs = [0, 2, 4].map((i) => ({
    reach: (scaffold[i].tipRadius + scaffold[i + 1].tipRadius) / 2,
    width: (scaffold[i].width + scaffold[i + 1].width) / 2,
    rise:
      (scaffold[i].tipZ -
        scaffold[i].attachZ +
        scaffold[i + 1].tipZ -
        scaffold[i + 1].attachZ) /
      2
  }))
  return Array.from({ length: count }, (_, i) => {
    const age = (i + sample(config.stratumJitter)) / count
    const lo = Math.min(1, Math.floor(age * 2)),
      f = age * 2 - lo
    const blend = (key: keyof (typeof pairs)[number]) =>
      pairs[lo][key] * (1 - f) + pairs[lo + 1][key] * f
    const attachZ =
      config.attachmentHeight[0] +
      age * (config.attachmentHeight[1] - config.attachmentHeight[0])
    return {
      attachZ,
      azimuthDegrees:
        phase +
        i * config.azimuthStepDegrees +
        (2 * next() - 1) * config.azimuthJitterDegrees,
      tipRadius: blend('reach') * sample(config.reachScale),
      width: blend('width') * sample(config.widthScale),
      tipZ: attachZ + blend('rise') * sample(config.riseScale),
      archScale: sample(config.archScale),
      roll: (sample(config.rollDegrees) * Math.PI) / 180,
      lateralBend: sample(config.lateralBend)
    }
  })
}
