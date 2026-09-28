import { cancelFeatureTask, invokeFeatureTask, type Core } from '@asyra/core'
import type { ExperimentSnapshot } from '../analysis/contracts'
import type { LivePlaybackRunner } from '../analysis/live/runner'
import { FeatureNames } from '../constants'

const STATE_REVISION_PROPERTY = 'live-playback.state-revision'
const RECORDS_REVISION_PROPERTY = 'live-playback.records-revision'

export function installLivePlaybackFeature(
  core: Core,
  service: LivePlaybackRunner
) {
  core.defineUIProperty<number>(STATE_REVISION_PROPERTY, { defaultValue: 0 })
  core.defineUIProperty<number>(RECORDS_REVISION_PROPERTY, { defaultValue: 0 })

  const advanceRevision = (key: string) => {
    const revision = core.getUIProperty<number>(key) ?? 0

    core.setUIProperty(key, revision + 1)
  }

  service.setNotificationPublishers(
    () => advanceRevision(STATE_REVISION_PROPERTY),
    () => advanceRevision(RECORDS_REVISION_PROPERTY)
  )

  const api = {
    open: (
      snapshot: ExperimentSnapshot,
      time: number,
      options?: { signal?: AbortSignal }
    ) =>
      invokeFeatureTask<
        { snapshot: ExperimentSnapshot; time: number },
        undefined
      >(
        FeatureNames.LIVE_PLAYBACK,
        { snapshot: service.capture(snapshot), time },
        options
      ),
    prepare: (key: string, create: () => ExperimentSnapshot) =>
      service.prepare(key, create),
    getRecords: service.getRecords,
    sample: (time: number, discontinuity = false) =>
      service.sample(time, discontinuity),
    getState: service.getState,
    subscribe: (listener: () => void) =>
      core.onUIPropertyChange<number>(STATE_REVISION_PROPERTY, listener),
    subscribeRecords: (listener: () => void) =>
      core.onUIPropertyChange<number>(RECORDS_REVISION_PROPERTY, listener),
    cancel: () => cancelFeatureTask(FeatureNames.LIVE_PLAYBACK)
  }

  core.defineFeature(FeatureNames.LIVE_PLAYBACK, undefined, {
    priority: 80,
    exclusive: true,
    api,
    task: (input: unknown, { signal }) => {
      if (
        !input ||
        typeof input !== 'object' ||
        !('snapshot' in input) ||
        !('time' in input)
      )
        throw new Error('Invalid live playback Feature input')

      return service.open(
        input.snapshot as ExperimentSnapshot,
        input.time as number,
        signal
      )
    }
  })

  core.registerRuntimeCleanup(FeatureNames.LIVE_PLAYBACK, () =>
    service.dispose()
  )

  return api
}
