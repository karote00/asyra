import { useEffect, useMemo, useRef, useState } from 'react'
import { version as appVersion } from '../../../package.json'
import type {
  ExperimentSnapshot,
  PreflightReport
} from '../../analysis/contracts'
import type { ExperimentDraft } from '../../common-apis/experiment'
import { jointValuesAt, type Workcell } from '../../domain/workcell'
import type { SimRuntime } from '../../init/bootstrap'
import type { RunRecord } from '../../storage/run-record'
import {
  createDefaultExperimentDraft,
  definitionToDraft,
  formatExclusions
} from './experiment-draft'
import type { PlaybackView } from './playback-view'
import { useViewValue } from '../shared/use-view-value'

type Perform = (
  action: (assertCurrent: () => void) => Promise<unknown>,
  message: string
) => Promise<void>

export function useExperimentController({
  runtime,
  candidateId,
  workcell,
  perform,
  onPlayback,
  runs,
  onRun
}: {
  runtime: SimRuntime
  candidateId: string
  workcell: Workcell
  perform: Perform
  onPlayback: (value: PlaybackView | null) => void
  runs: readonly RunRecord[]
  onRun: (run: RunRecord) => void
}) {
  const experiments = useViewValue(
    runtime.views,
    (snapshot) => snapshot.experiments
  )

  const [experimentId, setExperimentId] = useState(experiments[0]?.id ?? '')

  const canonical = experiments.find((item) => item.id === experimentId) ?? null

  const methods = runtime.getMethodDescriptors()

  const [name, setName] = useState('New clearance study')

  const [draft, setDraft] = useState<ExperimentDraft>(() =>
    canonical
      ? definitionToDraft(canonical.definition)
      : createDefaultExperimentDraft(workcell)
  )

  const [exclusions, setExclusions] = useState(
    () => draft.exclusionsInput ?? formatExclusions(draft.scope.excludedPairs)
  )

  const [preflight, setPreflight] = useState<PreflightReport | null>(null)

  const [warnings, setWarnings] = useState<string[]>([])

  const [running, setRunning] = useState(false)

  const [runningInput, setRunningInput] = useState<ExperimentSnapshot | null>(
    null
  )

  const [error, setError] = useState('')
  const [trajectoryValid, setTrajectoryValid] = useState(true)
  const resolvedInput = useMemo(() => {
    if (!canonical) return null
    try {
      return runtime.experimentInputs.resolve(canonical.definition, workcell)
    } catch {
      return null
    }
  }, [runtime, canonical, workcell])
  const exclusionsError = useMemo(() => {
    try {
      runtime.experimentInputs.readExclusions(exclusions)
      return ''
    } catch (reason) {
      return reason instanceof Error ? reason.message : String(reason)
    }
  }, [runtime, exclusions])
  const executable = !!resolvedInput && trajectoryValid && !exclusionsError
  const [saving, setSaving] = useState(false)
  const pendingWrites = useRef(0)
  const writeQueue = useRef(Promise.resolve())
  const expectedCanonical = useRef('')
  const requestedWrite = useRef('')

  const live = useRef(true)

  const active = useRef<AbortController | null>(null)

  const canonicalDraft = useMemo(
    () => (canonical ? definitionToDraft(canonical.definition) : null),
    [canonical]
  )

  const canonicalKey = useMemo(
    () => JSON.stringify(canonicalDraft),
    [canonicalDraft]
  )

  useEffect(() => {
    live.current = true

    return () => {
      live.current = false

      active.current?.abort()
    }
  }, [])

  useEffect(() => {
    const acknowledgedWrite = canonicalKey === expectedCanonical.current
    expectedCanonical.current = ''
    if (canonical && !acknowledgedWrite) {
      setDraft(definitionToDraft(canonical.definition))

      setExclusions(
        canonical.definition.exclusionsInput ??
          formatExclusions(canonical.definition.scope.excludedPairs)
      )
    }

    setPreflight(null)

    setWarnings([])

    setError('')

    onPlayback(null)
  }, [experimentId, canonicalKey, onPlayback])

  useEffect(() => {
    setPreflight(null)

    setWarnings([])

    onPlayback(null)
  }, [workcell, onPlayback])

  const changed = (next: ExperimentDraft) => {
    setDraft(next)

    setPreflight(null)

    setWarnings([])

    onPlayback(null)
  }

  const withExclusions = (input: ExperimentDraft): ExperimentDraft =>
    input.exclusionsInput !== undefined ||
    exclusions !== formatExclusions(input.scope.excludedPairs)
      ? { ...input, exclusionsInput: exclusions }
      : input

  const dirty =
    !canonical || JSON.stringify(withExclusions(draft)) !== canonicalKey

  const fail = (reason: unknown) => {
    if (live.current)
      setError(reason instanceof Error ? reason.message : String(reason))
  }

  const save = async (input: ExperimentDraft = draft) => {
    const next = withExclusions(input)
    setDraft(next)
    const key = JSON.stringify(next)
    if (pendingWrites.current && requestedWrite.current === key)
      return writeQueue.current
    requestedWrite.current = key
    pendingWrites.current++
    setSaving(true)
    const write = async () => {
      if (!live.current) return
      let committed = false
      await perform(async (assertCurrent) => {
        const current = runtime
          .getExperiments(candidateId)
          .find((item) => item.id === experimentId)
        expectedCanonical.current = key
        if (current)
          await runtime.features.edit.updateExperiment(
            current.id,
            current.definition.revision,
            next
          )
        else {
          const id = await runtime.features.edit.createExperiment(
            candidateId,
            name,
            next
          )
          assertCurrent()
          if (live.current) setExperimentId(id)
        }
        assertCurrent()
        committed = true
      }, 'Experiment updated - one Undo action')
      if (!committed) throw new Error('Experiment edit was not committed.')
    }
    const pending = writeQueue.current.then(write)
    writeQueue.current = pending.catch(() => undefined)
    try {
      await pending
      if (live.current) setError('')
      return true
    } catch (reason) {
      fail(reason)
      return false
    } finally {
      pendingWrites.current--
      if (live.current) setSaving(pendingWrites.current > 0)
    }
  }

  const freshDraft = () => {
    setExperimentId('')

    const next = createDefaultExperimentDraft(workcell)

    setDraft(next)

    setExclusions('')

    setName('New clearance study')

    setPreflight(null)
  }

  const inspect = () => {
    if (!canonical || dirty || !executable)
      throw new Error(
        'Correct the current experiment input errors before preflight.'
      )

    const report = runtime.preflightExperiment(canonical.id)

    setPreflight(report)

    return report
  }

  const replayCurrent = (value: number) => {
    if (!resolvedInput || !executable || dirty) return

    try {
      const joints = jointValuesAt(resolvedInput.trajectory, value)

      onPlayback({
        workcell,
        joints,
        time: value,
        historical: false,
        bodyIds: []
      })
    } catch (reason) {
      fail(reason)
    }
  }

  const replayRun = (
    snapshot: ExperimentSnapshot,
    value: number,
    bodyIds: readonly string[]
  ) => {
    onPlayback({
      workcell: snapshot.workcell,
      joints: jointValuesAt(snapshot.trajectory, value),
      time: value,
      historical: true,
      bodyIds,
      historicalHighlight: {
        colors: new Map(bodyIds.map((id) => [id, 0x62e6c1]))
      }
    })
  }

  const run = async () => {
    try {
      inspect()

      if (!canonical) return

      const snapshot = runtime.createExperimentSnapshot(canonical.id, warnings)

      const lineage = runtime.getCandidateLineage(candidateId)

      const candidateName =
        runtime
          .getCandidates()
          .find((candidate) => candidate.id === candidateId)?.name ??
        candidateId

      const runName = `${candidateName.slice(0, 60)} - ${canonical.name.slice(0, 90)} - r${canonical.definition.revision}`

      const controller = new AbortController()

      const environment = {
        appVersion,
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency
      }

      active.current = controller

      setRunning(true)

      setRunningInput(snapshot)

      setError('')

      const result = await runtime.features.analysis.run(snapshot, {
        signal: controller.signal
      })

      if (!live.current) return
      const record: RunRecord = {
        version: 1,
        name: runName,
        retainedAt: new Date().toISOString(),
        environment,
        snapshot,
        result,
        ...(lineage ? { lineage } : {})
      }
      try {
        await runtime.features.storage.retain(record)
      } catch (reason) {
        fail(reason)
      }
      if (live.current) onRun(record)
    } catch (reason) {
      fail(reason)
    } finally {
      if (live.current) {
        setRunning(false)

        setRunningInput(null)
      }

      active.current = null
    }
  }

  const selectedRun = [...runs]
    .reverse()
    .find((item) => item.snapshot.source.experimentId === experimentId)

  const retainSelectedRun = () =>
    selectedRun &&
    void perform(
      () => runtime.features.storage.retain(selectedRun),
      'Result retained in project'
    )

  return {
    resolvedInput,
    executable,
    setTrajectoryValid,
    exclusionsError,
    methods,
    canonicalDraft,
    experiments,
    experimentId,
    setExperimentId,
    canonical,
    name,
    setName,
    draft,
    exclusions,
    setExclusions,
    preflight,
    setPreflight,
    warnings,
    setWarnings,
    running,
    runningInput,
    error,
    setError,
    active,
    canonicalKey,
    changed,
    dirty,
    fail,
    save,
    saving,
    freshDraft,
    inspect,
    replayCurrent,
    replayRun,
    run,
    selectedRun,
    retainSelectedRun
  }
}
