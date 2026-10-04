import initialCore, { type Core } from '@asyra/core'

// Publish the complete teardown barrier before waiting for startup or cleanup.
// A new mount must never acquire the Core that is about to be retired.
let core: Core = initialCore
let resetting: Promise<void> = Promise.resolve()
export const getCore = (): Core => core
export const waitForCore = (): Promise<void> => resetting
export const resetCore = (beforeReset?: () => Promise<void>): Promise<void> => {
  const retiring = core
  resetting = Promise.resolve()
    .then(beforeReset)
    .then(() => retiring.resetRuntime())
    .then((next) => {
      core = next
    })
  return resetting
}
