import type { CanvasBinding } from '@asyra/canvas'
import { PlaybackClock } from './playback-clock.js'

export { PlaybackClock }
export type { FrameScheduler } from './playback-clock.js'

export function attachSimulationTools(canvas: CanvasBinding) {
  return canvas.mount((target) => {
    const host = target.ownerDocument.defaultView

    if (!host) {
      throw new Error('Simulation playback requires a browser window')
    }

    const clock = new PlaybackClock({
      now: () => host.performance.now(),

      request: (callback) => host.requestAnimationFrame(callback),

      cancel: (handle) => host.cancelAnimationFrame(handle)
    })
    let active = true

    return {
      tools: {
        play(
          from: number,
          end: number,
          sample: (seconds: number) => void,
          stopped: () => void
        ) {
          if (!active) {
            throw new Error('Simulation playback is disposed')
          }

          clock.play(from, end, sample, stopped)
        },

        pause() {
          clock.pause()
        }
      },

      destroy() {
        active = false
        clock.pause()
      }
    }
  })
}
