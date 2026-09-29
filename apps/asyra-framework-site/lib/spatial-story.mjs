export const storyChapters = Object.freeze([
  {
    id: 'library',
    title: 'An idea worth\nbuilding.',
    eyebrow: 'It starts with you',
    detail:
      'An idea takes shape. You define the experience. Asyra supplies the composable software infrastructure beneath it.',
    steps: [
      'A plan in mind',
      'A possible experience',
      'Something worth making'
    ],
    length: 1.5
  },
  {
    id: 'select',
    title: 'Give it a\nfoundation.',
    eyebrow: 'From an idea to a system',
    detail:
      'Your information and behavior, connected by defined contracts. Choose the capabilities your idea needs.',
    steps: [
      'Shape the information',
      'Define the behavior',
      'Connect the foundations'
    ],
    length: 1.8
  },
  {
    id: 'compose',
    title: 'One action.\nDefined relations.\nOne result.',
    eyebrow: 'Follow one drawing',
    detail:
      'An action enters through a Feature. A transaction bounds the change. The interface reflects the resulting state.',
    steps: [
      'Draw the house',
      'Change the authoritative state',
      'See the result'
    ],
    length: 2.4
  },
  {
    id: 'replace',
    title: 'Change the rule.\nKeep the work.',
    eyebrow: 'A different requirement',
    detail:
      'The same plan, a different building rule. A two-storey home becomes a tower while the surrounding composition stays in place.',
    steps: [
      'Keep the same site and plan',
      'Replace the drawing function',
      'Watch the result grow'
    ],
    length: 2.2
  },
  {
    id: 'extend',
    title: 'Build on what\nalready works.',
    eyebrow: 'The same work, growing',
    detail:
      'Add capabilities and new views as your idea develops. Evolve the same code from proof of concept onward.',
    steps: [
      'Add history',
      'Derive another view',
      'Continue the same implementation'
    ],
    length: 1.8
  },
  {
    id: 'possibilities',
    title: 'Your work.\nYour possibilities.',
    eyebrow: 'A foundation, not a finished product',
    detail:
      'This drawing is one example. The domain, experience and possibilities belong to you.',
    steps: [
      'The idea becomes usable',
      'The foundation stays underneath',
      'Make something of your own'
    ],
    length: 1.3
  }
])

export const storyArtwork = Object.freeze({
  thinker: { src: 'thinker-shapes.webp', width: 1000, height: 667 },
  gallery: { src: 'closing-atelier.webp', width: 1100, height: 550 }
})
// Every plane belongs to the same mounted scene. Pose: x/y/z, Euler x/y/z,
// uniform scale, opacity. Authored stops are prepared once per module lifetime.
const pose = (x = 0, y = 0, z = 0, scale = 1, opacity = 1, rx = 0, rz = 0) => [
  x,
  y,
  z,
  rx,
  0,
  rz,
  scale,
  opacity
]
const initialLayers = {
  thinker: pose(-30, 30, -120),
  notebook: pose(110, 155, 20, 0.65, 0, 28, -12),
  feature: pose(0, 0, 20, 1, 0),
  transaction: pose(0, 0, -105, 1, 0),
  state: pose(0, 0, -230, 1, 0),
  replacement: pose(650, 0, 20, 1, 0),
  signal: pose(-210, 0, 190, 1, 0),
  history: pose(290, -135, 100, 0.65, 0),
  collection: pose(-290, 135, 90, 0.65, 0),
  gallery: pose(0, 20, -300, 0.9, 0)
}
const initialEffects = {
  interface: 0,
  ink: 0,
  saved: 0,
  house: 0,
  tower: 0,
  feature: 0,
  transaction: 0,
  state: 0,
  result: 0,
  published: 0,
  expanded: 0,
  backdrop: 0
}
const authoredStops = [
  { at: 0 },
  { at: 0.22, layers: { notebook: pose(110, 155, 20, 0.65) } },
  {
    at: 0.55,
    layers: {
      notebook: pose(20, 25, 40, 0.9),
      thinker: pose(-110, 30, -180, 0.95, 0.25)
    },
    effects: { ink: 0.4 }
  },
  {
    at: 0.85,
    layers: {
      notebook: pose(0, 0, 70),
      thinker: pose(-150, 30, -180, 0.95, 0)
    },
    effects: { ink: 0.65 }
  },
  { at: 1 },
  { at: 1.23, effects: { interface: 1, ink: 1 } },
  {
    at: 1.48,
    camera: [0, 40, -100, 40, 0, -16],
    layers: { notebook: pose(0, -170, 200), feature: pose(0, 0, 20, 1, 1) },
    effects: { backdrop: 0.65 }
  },
  {
    at: 1.7,
    layers: {
      transaction: pose(0, 0, -105, 1, 1),
      state: pose(0, 0, -230, 1, 1)
    },
    effects: { backdrop: 1 }
  },
  { at: 2 },
  {
    at: 2.12,
    layers: { signal: pose(-255, -170, 200) },
    effects: { feature: 0 }
  },
  {
    at: 2.3,
    layers: { signal: pose(-255, 0, 20) },
    effects: { feature: 1 }
  },
  {
    at: 2.46,
    layers: { signal: pose(-255, 0, -105) },
    effects: { transaction: 1 }
  },
  {
    at: 2.62,
    layers: { signal: pose(-255, 0, -230) },
    effects: { state: 1, saved: 1 }
  },
  {
    at: 2.82,
    layers: { signal: pose(-255, -170, 200) },
    effects: { house: 0.65 }
  },
  {
    at: 2.94,
    effects: { house: 1, result: 1, published: 1 },
    layers: { signal: pose(-255, -170, 200, 1, 0) }
  },
  { at: 3 },
  { at: 3.12, effects: { feature: 0, transaction: 0, state: 0, result: 0 } },
  { at: 3.28, layers: { feature: pose(-570, 0, 20, 1, 0.25) } },
  { at: 3.3, layers: { replacement: pose(580, 0, 20, 1, 1) } },
  {
    at: 3.45,
    layers: { replacement: pose(0, 0, 20), feature: pose(-650, 0, 20, 1, 0) },
    effects: { tower: 0 }
  },
  { at: 3.52 },
  { at: 3.83, effects: { tower: 1 } },
  { at: 4 },
  {
    at: 4.23,
    camera: [0, 20, -100, 22, 0, -8],
    layers: { history: pose(310, -125, 140, 0.65) }
  },
  {
    at: 4.48,
    layers: { collection: pose(-315, 140, 140, 0.65) },
    effects: { expanded: 1 }
  },
  {
    at: 4.78,
    camera: [0, 0, -110, 0, 0, 0],
    layers: {
      notebook: pose(0, 0, 100, 0.9),
      replacement: pose(0, 85, -60, 1, 0.55),
      transaction: pose(0, 155, -120, 1, 0.45),
      state: pose(0, 225, -180, 1, 0.4),
      history: pose(280, -150, 130, 0.65),
      collection: pose(-280, 135, 130, 0.65)
    },
    effects: { backdrop: 0.4 }
  },
  { at: 5 },
  {
    at: 5.3,
    layers: {
      notebook: pose(0, 10, 160, 0.85),
      history: pose(240, -145, 170, 0.6),
      collection: pose(-250, 145, 170, 0.6),
      gallery: pose(0, -40, -320, 1.1, 0.45)
    },
    effects: { backdrop: 0 }
  },
  {
    at: 5.7,
    camera: [0, 0, -280, 0, 0, 0],
    layers: {
      gallery: pose(0, -90, -320, 1.2, 0.65),
      notebook: pose(0, 60, 160, 0.85)
    }
  },
  { at: 6 }
]
let inheritedLayers = initialLayers
let inheritedCamera = [0, 0, 0, 0, 0, 0]
let inheritedEffects = initialEffects
const stops = authoredStops.map((stop) => {
  inheritedLayers = { ...inheritedLayers, ...stop.layers }
  inheritedCamera = stop.camera || inheritedCamera
  inheritedEffects = { ...inheritedEffects, ...stop.effects }
  return {
    at: stop.at,
    layers: inheritedLayers,
    camera: inheritedCamera,
    effects: inheritedEffects
  }
})
export const storyLayerIds = Object.freeze(Object.keys(initialLayers))
export const clampProgress = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
const mix = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t)
export function getStoryFrame(chapter, value, reducedMotion = false) {
  const index = Number.isFinite(chapter)
    ? Math.max(0, Math.min(5, Math.floor(chapter)))
    : 0
  const progress = reducedMotion ? 1 : clampProgress(value)
  const time = index + progress
  let segment = 0
  while (segment < stops.length - 2 && stops[segment + 1].at <= time) segment++
  const a = stops[segment]
  const b = stops[segment + 1]
  const t = clampProgress((time - a.at) / (b.at - a.at))
  return {
    chapter: index,
    progress,
    phase: Math.min(2, Math.floor(progress * 3)),
    camera: mix(a.camera, b.camera, t),
    layers: Object.fromEntries(
      storyLayerIds.map((id) => [id, mix(a.layers[id], b.layers[id], t)])
    ),
    effects: Object.fromEntries(
      Object.keys(initialEffects).map((id) => [
        id,
        a.effects[id] + (b.effects[id] - a.effects[id]) * t
      ])
    )
  }
}
export function layerTransform([x, y, z, rx, ry, rz, scale]) {
  return `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, ${z.toFixed(3)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${scale.toFixed(5)}) translate(-50%, -50%)`
}
export function cameraTransform([x, y, z, rx, ry, rz]) {
  return `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
}
export function createScrollDriver({ requestFrame, cancelFrame, render }) {
  let lastChapter = -1
  let lastProgress = -1
  let queued = null
  let pending = null
  let disposed = false
  const tick = () => {
    pending = null
    if (disposed || !queued) return
    const [chapter, progress] = queued
    queued = null
    render(getStoryFrame(chapter, progress))
    lastChapter = chapter
    lastProgress = progress
  }
  return {
    update(chapter, value) {
      if (disposed) return
      const p = clampProgress(value)
      if (lastChapter === chapter && lastProgress === p && !queued) return
      queued = [chapter, p]
      if (pending === null) pending = requestFrame(tick)
    },
    dispose() {
      disposed = true
      if (pending !== null) cancelFrame(pending)
      queued = null
    }
  }
}
