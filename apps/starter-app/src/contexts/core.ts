import initialCore, { type Core } from '@asyra/core'

// Core reset returns the next lifetime. Mounts wait for in-flight teardown.
let core: Core = initialCore
let resetting: Promise<void> = Promise.resolve()
export const getCore = (): Core => core
export const waitForCore = (): Promise<void> => resetting
export const resetCore = (): Promise<void> => {
  resetting = core.resetRuntime().then((next) => {
    core = next
  })
  return resetting
}
