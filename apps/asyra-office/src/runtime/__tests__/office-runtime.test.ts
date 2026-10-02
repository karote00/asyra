import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThreeEngine, type GraphicsDriver } from '@asyra/preset/spatial'
import { createOfficeRuntime, type OfficeRuntime } from '../office-runtime'
import type { OfficeStorage } from '../layout-controller'
class MemoryStorage implements OfficeStorage {
  values = new Map<string, string>()
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}
let runtime: OfficeRuntime | undefined
let frames: FrameRequestCallback[] = []
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        /* Test driver owns no platform resources. */
      }
      disconnect() {
        /* Test driver owns no platform resources. */
      }
    }
  )
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    /* No scheduled frame in this deterministic test. */
  })
})
afterEach(async () => {
  await runtime?.dispose()
  runtime = undefined
  vi.unstubAllGlobals()
})
async function start(storage = new MemoryStorage()) {
  const driver: GraphicsDriver = {
    domElement: document.createElement('canvas'),
    autoClear: true,
    setSize() {
      /* Test driver owns no platform resources. */
    },
    setPixelRatio() {
      /* Test driver owns no platform resources. */
    },
    setClearColor() {
      /* Test driver owns no platform resources. */
    },
    clear() {
      /* Test driver owns no platform resources. */
    },
    clearDepth() {
      /* Test driver owns no platform resources. */
    },
    render() {
      /* Test driver owns no platform resources. */
    },
    dispose() {
      /* Test driver owns no platform resources. */
    }
  }
  runtime = await createOfficeRuntime(
    document.createElement('div'),
    storage,
    () =>
      new ThreeEngine({
        createDriver: () => driver,
        requestFrame: () => 1,
        cancelFrame() {
          /* Test driver owns no platform resources. */
        }
      })
  )
  return { runtime, storage }
}
describe('Office canonical interaction path', () => {
  it('keeps the bootstrap room when Undo is requested before any user edit', async () => {
    const { runtime } = await start()
    const layout = runtime.layout.getSnapshot().layout
    await runtime.layout.undo()
    expect(runtime.layout.getSnapshot().layout).toEqual(layout)
  })
  it('groups a validated edit into one Undo and Redo and saves only canonical layout', async () => {
    const { runtime, storage } = await start()
    const initial = runtime.layout.getSnapshot().layout
    const depth = runtime.core.getUndoHistoryDepth()
    await runtime.layout.apply(
      runtime.layout.propose({ ...initial, wall: 0xbacaba }, 'Human')
    )
    expect(runtime.core.getUndoHistoryDepth()).toBe(depth + 1)
    expect(runtime.layout.getSnapshot().layout.wall).toBe(0xbacaba)
    await runtime.layout.undo()
    expect(runtime.layout.getSnapshot().layout).toEqual(initial)
    await runtime.layout.redo()
    expect(runtime.layout.getSnapshot().layout.wall).toBe(0xbacaba)
    await runtime.layout.save()
    const saved = storage.getItem('asyra-office.layout.v1') ?? ''
    expect(saved).not.toContain('sample-task')
    expect(saved).not.toContain('cameraPosition')
    await runtime.layout.apply(runtime.layout.propose(initial, 'Human'))
    await runtime.layout.reload()
    expect(runtime.layout.getSnapshot().layout.wall).toBe(0xbacaba)
  })
  it('rejects stale and invalid proposals without a transaction or partial mutation', async () => {
    const { runtime } = await start()
    const initial = runtime.layout.getSnapshot().layout
    const old = runtime.layout.propose(
      { ...initial, wall: 0xcbd8df },
      'Synthetic decorator'
    )
    await runtime.layout.apply(
      runtime.layout.propose({ ...initial, wall: 0xbacaba }, 'Human')
    )
    const depth = runtime.core.getUndoHistoryDepth()
    await expect(runtime.layout.apply(old)).rejects.toThrow(
      'changed since preview'
    )
    expect(() =>
      runtime.layout.propose({ ...initial, width: 2 }, 'Human')
    ).toThrow('Invalid layout')
    expect(runtime.core.getUndoHistoryDepth()).toBe(depth)
    expect(runtime.layout.getSnapshot().layout.wall).toBe(0xbacaba)
  })
  it('isolates task events and camera/movement from canonical publications and reads', async () => {
    const { runtime } = await start()
    const publication = vi.fn(),
      read = vi.spyOn(runtime.core, 'getCanonicalOwnerSnapshot')
    const unsubscribe = runtime.core.subscribeToSharedPublication(publication)
    const snapshot = runtime.layout.getSnapshot()
    await runtime.send('working')
    await runtime.send('completed')
    runtime.scene.focus('park')
    runtime.scene.visit('park')
    runtime.scene.follow()
    for (let frame = 0; frame < 10; frame++) {
      const pending = frames.splice(0)
      pending.forEach((callback) => callback(performance.now() + frame * 16))
    }
    expect(publication).not.toHaveBeenCalled()
    expect(read).not.toHaveBeenCalled()
    expect(runtime.layout.getSnapshot()).toBe(snapshot)
    expect(runtime.activity.getAgent(runtime.key)?.status).toBe('completed')
    unsubscribe()
  })
  it('retains explicit evidence and replays local history after runtime replacement', async () => {
    const { runtime: first, storage } = await start()
    await first.send('working')
    await first.send('completed')
    await first.dispose()
    runtime = undefined
    const { runtime: second } = await start(storage)
    expect(second.activity.eventCount).toBe(2)
    expect(second.activity.getAgent(second.key)?.status).toBe('completed')
    await second.send('working')
    expect(second.activity.getAgent(second.key)?.attempt).toBe(2)
  })
  it('does not rebuild scene geometry for persistence acknowledgement', async () => {
    const { runtime } = await start()
    const render = vi.spyOn(runtime.scene, 'setLayout')
    await runtime.layout.save()
    expect(render).not.toHaveBeenCalled()
    await runtime.layout.reload()
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('does not let an older save acknowledgement mark a newer edit as saved', async () => {
    const { runtime } = await start()
    const document = await runtime.core.save()
    let finish: (value: typeof document) => void = () => {
      /* Set by the controlled save boundary. */
    }
    vi.spyOn(runtime.core, 'save').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const pending = runtime.layout.save()
    const before = runtime.layout.getSnapshot()
    await runtime.layout.apply(
      runtime.layout.propose({ ...before.layout, wall: 0xbacaba }, 'Human')
    )
    finish(document)
    await pending
    expect(runtime.layout.getSnapshot().savedRevision).toBe(before.revision)
    expect(runtime.layout.getSnapshot().revision).toBeGreaterThan(
      before.revision
    )
  })

  it('does not claim saved or project events after storage failure', async () => {
    const { runtime, storage } = await start()
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Disk full')
    })
    await expect(runtime.layout.save()).rejects.toThrow('Disk full')
    expect(runtime.layout.getSnapshot().savedRevision).toBe(null)
    await expect(runtime.send('working')).rejects.toThrow('Disk full')
    expect(runtime.activity.eventCount).toBe(0)
  })
})
