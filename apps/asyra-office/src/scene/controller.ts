import { OFFICE_STRUCTURE } from './office-layout'
import {
  readSpatialCamera,
  moveSpatialCamera,
  orbitSpatialCamera,
  dollySpatialCamera,
  spatialCameraDistance,
  type SpatialCamera,
  type SpatialLayer
} from '@asyra/preset/spatial'
import { ACTORS, PLACES } from './reference-scene'
import { renderPosition, type Vec } from '../assets/geometry'

export const DEMO_TASKS = [
  {
    id: 'sprint',
    title: 'Plan next sprint',
    agent: 'leo',
    status: 'In progress',
    date: 'Today'
  },
  {
    id: 'tea',
    title: 'Design tea point',
    agent: 'mina',
    status: 'Not started',
    date: 'Tomorrow'
  },
  {
    id: 'feedback',
    title: 'Client feedback',
    agent: 'mina',
    status: 'In progress',
    date: 'Today'
  },
  {
    id: 'docs',
    title: 'Update help docs',
    agent: 'sage',
    status: 'Blocked',
    date: 'Today'
  },
  {
    id: 'meeting',
    title: 'Prep meeting',
    agent: 'noah',
    status: 'Done',
    date: 'Today'
  }
] as const
export const DEMO_LOGS = [
  { time: '10:42', agent: 'Sage', text: 'prepared a fresh cup of coffee' },
  { time: '10:40', agent: 'Mina', text: 'started exploring the new workspace' },
  {
    time: '10:38',
    agent: 'Kai',
    text: 'stepped outside for a little fresh air'
  },
  {
    time: '10:35',
    agent: 'Noah',
    text: 'finished preparing the meeting notes'
  },
  { time: '10:32', agent: 'Leo', text: 'sat down to plan the next sprint' }
] as const
export function overviewCamera(aspect = 1): SpatialCamera {
  const framing = Math.max(1, 845 / 756 / aspect)
  const target = renderPosition(OFFICE_STRUCTURE.camera.target as Vec)
  const position = renderPosition(OFFICE_STRUCTURE.camera.position as Vec)
  return readSpatialCamera({
    kind: 'camera',
    position: position.map(
      (v, i) => target[i] + (v - target[i]) * framing
    ) as Vec,
    target,
    fov: OFFICE_STRUCTURE.camera.fov,
    near: 0.2,
    far: Math.max(90, OFFICE_STRUCTURE.parameters.distance * 2)
  })
}
export function createSceneController(
  layer: Pick<SpatialLayer, 'submitCamera'>,
  aspect = 1
) {
  let camera = overviewCamera(aspect),
    snapshot: Readonly<{ view: string }> = Object.freeze({ view: 'Overview' }),
    disposed = false
  const listeners = new Set<() => void>()
  const publish = (next: SpatialCamera, view: string) => {
    if (disposed) throw new Error('Scene disposed')
    camera = next
    layer.submitCamera(camera)
    if (view !== snapshot.view) {
      snapshot = Object.freeze({ view })
      listeners.forEach((fn) => fn())
    }
  }
  return {
    getSnapshot: () => snapshot,
    getCamera: () => camera,
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    overview: () => publish(overviewCamera(aspect), 'Overview'),
    focusPlace: (id: string) => {
      const place = PLACES.find((p) => p.id === id)
      if (!place) throw new Error('Unknown place')
      if (id === 'office') {
        publish(overviewCamera(aspect), 'Overview')
        return
      }
      const target = renderPosition(place.target)
      publish(
        readSpatialCamera({
          kind: 'camera',
          position: [target[0] + 3.2, target[1] + 3.6, target[2] + 4.6],
          target,
          fov: 38,
          near: 0.1,
          far: 60
        }),
        place.name
      )
    },
    follow: (id: string) => {
      const agent = ACTORS.find((a) => a.id === id)
      if (!agent) throw new Error('Agent has no scene representation')
      const p = agent.position,
        angle = (agent.rotation * Math.PI) / 180,
        behind: Vec = [
          p[0] - Math.sin(angle) * 1.25 + Math.cos(angle) * 0.65,
          p[1] + Math.cos(angle) * 1.25 + Math.sin(angle) * 0.65,
          p[2] + 2.6
        ]
      publish(
        readSpatialCamera({
          kind: 'camera',
          position: renderPosition(behind),
          target: renderPosition([
            p[0] + Math.sin(angle) * 0.65,
            p[1] - Math.cos(angle) * 0.65,
            p[2] + 0.9
          ]),
          fov: 48,
          near: 0.05,
          far: 70
        }),
        `Following ${agent.name}`
      )
    },
    orbit: (dx: number, dy: number) =>
      publish(
        orbitSpatialCamera(camera, dx, dy, { minPolar: 0.18, maxPolar: 1.4 }),
        'Free view'
      ),
    move: (right: number, forward: number, fast = false) => {
      if (!Number.isFinite(right) || !Number.isFinite(forward))
        throw new Error('Invalid camera movement')
      const distance = spatialCameraDistance(camera)
      const horizontal = Math.hypot(
        camera.position[0] - camera.target[0],
        camera.position[2] - camera.target[2]
      )
      const step =
        Math.max(0.05, Math.min(0.45, distance * 0.035)) * (fast ? 3 : 1)
      // Resolve ground-plane motion through the public camera-relative basis.
      // Its up and forward components cancel vertical movement at any pitch.
      const rise = (camera.position[1] - camera.target[1]) / distance
      publish(
        moveSpatialCamera(
          camera,
          right * step,
          forward * step * rise,
          (forward * step * horizontal) / distance
        ),
        'Free view'
      )
    },
    zoom: (factor: number) =>
      publish(
        dollySpatialCamera(
          camera,
          Math.min(45, Math.max(2, spatialCameraDistance(camera) * factor))
        ),
        'Free view'
      ),
    resize: (nextAspect: number) => {
      aspect = nextAspect
      if (snapshot.view === 'Overview')
        publish(overviewCamera(aspect), 'Overview')
    },
    dispose: () => {
      disposed = true
      listeners.clear()
    }
  }
}
export type SceneController = ReturnType<typeof createSceneController>
