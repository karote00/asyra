import { expect, test } from '@playwright/test'
import { waitForAppReady } from './test-utils'

// Observe the already-ready session; do not alter product assertions or state.
export const waitForObservedAppReady = async (
  ...args: Parameters<typeof waitForAppReady>
): Promise<void> => {
  await waitForAppReady(...args)
  let identity: unknown = null
  await expect
    .poll(
      async () => {
        identity = await args[0].evaluate(async () => {
          const { getActiveCollaborationHandle } =
            await import('../src/testing/runtime-access')
          return getActiveCollaborationHandle()?.identity ?? null
        })
        return identity
      },
      { timeout: 5000 }
    )
    .not.toBeNull()
  const info = test.info()
  await info.attach('collaboration-participant', {
    contentType: 'application/json',
    body: JSON.stringify({
      observationId: process.env.FLOW_OBSERVATION_ID ?? null,
      testId: info.testId,
      projectName: info.project.name,
      retry: info.retry,
      identity
    })
  })
}
