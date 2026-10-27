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

/** Shared leaf samples are attached to real sprigs, not a spherical placement skin. */
export function createShrubSprigs(
  samples: ReturnType<typeof createPlantGrowth>
) {
  const variant = requiredSpecValue(
    spec.modules[0].growthVariants,
    'plant variants'
  ).shrub
  const crown = variant.crown
  const fraction = (value: number, range: readonly number[]) =>
    (value - range[0]) / (range[1] - range[0])
  const branches = Array.from({ length: crown.sprigCount }, (_, index) => {
    const sample = samples[index]
    const angle =
      ((samples[0].azimuthDegrees + index * variant.growth.azimuthStepDegrees) *
        Math.PI) /
      180
    const reach =
      crown.sprigReach[0] +
      fraction((sample.roll * 180) / Math.PI, variant.growth.rollDegrees) *
        (crown.sprigReach[1] - crown.sprigReach[0])
    const radius =
      reach * (index < crown.innerSprigCount ? crown.innerSprigReachScale : 1)
    const top =
      crown.sprigTipHeight[0] +
      fraction(sample.archScale, variant.growth.archScale) *
        (crown.sprigTipHeight[1] - crown.sprigTipHeight[0])
    return [
      [0, 0, crown.sprigBaseZ],
      [
        radius * 0.35 * Math.cos(angle),
        radius * 0.35 * Math.sin(angle),
        crown.sprigBaseZ + (top - crown.sprigBaseZ) * 0.55
      ],
      [radius * Math.cos(angle), radius * Math.sin(angle), top]
    ]
  })
  const origins = samples.map((sample, index) => {
    const branch = index % branches.length
    const rank = Math.floor(index / branches.length)
    const count = Math.ceil((samples.length - branch) / branches.length)
    const phase =
      (rank +
        0.2 +
        0.6 * fraction(sample.archScale, variant.growth.archScale)) /
      count
    const t =
      crown.leafFraction[0] +
      phase * (crown.leafFraction[1] - crown.leafFraction[0])
    const segment = t < 0.55 ? 0 : 1
    const local = segment === 0 ? t / 0.55 : (t - 0.55) / 0.45
    return branches[branch][segment].map(
      (value, axis) =>
        value + (branches[branch][segment + 1][axis] - value) * local
    )
  })
  return { branches, origins }
}
