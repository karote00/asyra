import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction
} from 'react'
import type { TrajectoryInput } from '../../domain/trajectory-input'
import { ExperimentInputReader } from '../../storage/experiment-input'
import type { NormalizedTrajectorySource } from '../../domain/trajectory-source'
import type { Trajectory, Workcell } from '../../domain/workcell'
import {
  TRAJECTORY_IMPORT_LIMITS,
  type TrajectoryCsvMappingDraft,
  type TrajectoryImportPreview
} from '../../storage/trajectory-import'
import {
  canonicalCsvMapping,
  guessCsvMapping,
  trajectoryToCsv
} from '../experiments/experiment-draft'

export function useTrajectoryImport({
  workcell,
  trajectory,
  input,
  reader: suppliedReader
}: {
  workcell: Workcell
  trajectory: Trajectory
  input?: TrajectoryInput
  reader?: ExperimentInputReader
}) {
  const [ownedReader] = useState(() => new ExperimentInputReader())
  const reader = suppliedReader ?? ownedReader
  const [source, setSource] = useState(() => ({
    kind: input?.kind ?? 'csv',
    text: input?.text ?? trajectoryToCsv(workcell, trajectory)
  }))
  const [mapping, updateMapping] = useState<TrajectoryCsvMappingDraft>(
    () => input?.mapping ?? canonicalCsvMapping(workcell)
  )
  const authored = useMemo<TrajectoryInput>(
    () => ({ version: 1, ...source, mapping }),
    [source, mapping]
  )
  const current = useMemo(
    () => reader.previewTrajectory(authored, workcell),
    [reader, authored, workcell]
  )
  const [receipt, setReceipt] = useState<{
    result: TrajectoryImportPreview
    source: typeof source
    mapping: TrajectoryCsvMappingDraft
    workcell: Workcell
    generation: number
  } | null>(null)
  const [importPending, setImportPending] = useState(false)
  const pendingEdit = useRef(false)
  const [settled, setSettled] = useState(true)
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const generation = useRef(0)

  const discard = () => {
    generation.current++
    setReceipt(null)
    setReading(false)
    setError('')
  }

  // The workbench owns a stable read projection until canonical inputs change.
  // Retire reads at that boundary, without serializing the workcell on renders.
  useLayoutEffect(() => {
    discard()
    return () => {
      generation.current++
    }
  }, [workcell])

  const preview =
    receipt &&
    receipt.source === source &&
    receipt.mapping === mapping &&
    receipt.workcell === workcell &&
    receipt.generation === generation.current &&
    !reading
      ? receipt.result
      : null

  const inspect = () => {
    if (reading) return null
    if (preview) return preview
    const result = current
    setReceipt({
      result,
      source,
      mapping,
      workcell,
      generation: generation.current
    })
    return result
  }

  const accept = (
    onAccept: (
      value: NormalizedTrajectorySource,
      input: TrajectoryInput
    ) => void
  ) => {
    if (preview?.value && receipt?.generation === generation.current)
      onAccept(preview.value, authored)
  }

  const complete = async (
    onEdit: (
      input: TrajectoryInput,
      result: TrajectoryImportPreview
    ) => Promise<boolean>
  ) => {
    if (importPending || reading || !pendingEdit.current) return
    const result = inspect()
    if (!result) return
    const token = generation.current
    pendingEdit.current = false
    try {
      const saved = await onEdit(authored, result)
      if (token === generation.current) {
        if (saved === false) pendingEdit.current = true
        else setSettled(true)
      }
    } catch (reason) {
      if (token === generation.current) {
        pendingEdit.current = true
        setError(reason instanceof Error ? reason.message : String(reason))
      }
    }
  }

  const setText = (text: string) => {
    pendingEdit.current = true
    setSettled(false)
    discard()
    const csv = source.kind === 'csv' ? reader.readCsv(text) : current
    setSource({ ...source, text })
    // Incomplete syntax cannot prove that a mapped column was removed.
    // Keep choices until parsing can establish the edited header.
    if (source.kind === 'csv' && csv.columns.length) {
      const suggested = guessCsvMapping(csv.columns, workcell)
      const next = { ...suggested, joints: { ...suggested.joints } }
      if (csv.columns.includes(mapping.time.column))
        next.time = { ...mapping.time }
      for (const body of workcell.bodies) {
        if (body.joint.kind === 'fixed') continue
        const entry = mapping.joints[body.id]
        if (entry && csv.columns.includes(entry.column))
          next.joints[body.id] = { ...entry }
      }
      updateMapping(next)
    }
  }

  const setMapping = (next: SetStateAction<TrajectoryCsvMappingDraft>) => {
    pendingEdit.current = true
    setSettled(false)
    discard()
    updateMapping(next)
  }

  const setTimeUnit = (unit: TrajectoryCsvMappingDraft['time']['unit']) => {
    setMapping((current) => ({ ...current, time: { ...current.time, unit } }))
  }

  const setJointUnit = (
    id: string,
    unit: TrajectoryCsvMappingDraft['joints'][string]['unit']
  ) => {
    setMapping((current) => ({
      ...current,
      joints: {
        ...current.joints,
        [id]: { ...current.joints[id], unit }
      }
    }))
  }

  const load = async (file: File, nextKind: 'csv' | 'json') => {
    setImportPending(true)
    pendingEdit.current = false
    discard()
    const token = generation.current
    const limit =
      nextKind === 'csv'
        ? TRAJECTORY_IMPORT_LIMITS.csvBytes
        : TRAJECTORY_IMPORT_LIMITS.jsonBytes
    if (file.size > limit) {
      setError(
        `Trajectory ${nextKind.toUpperCase()} exceeds the ${limit / 1024 / 1024} MiB import limit.`
      )
      return
    }
    setReading(true)
    let text: string
    try {
      text = await file.text()
    } catch (reason) {
      if (token === generation.current) setError(String(reason))
      return
    } finally {
      if (token === generation.current) setReading(false)
    }
    if (token !== generation.current) return
    const csv = nextKind === 'csv' ? reader.readCsv(text) : current
    setSource({ kind: nextKind, text })
    if (nextKind === 'csv')
      updateMapping(guessCsvMapping(csv.columns, workcell))
  }

  const setJointMapping = (
    id: string,
    value: TrajectoryCsvMappingDraft['joints'][string]
  ) =>
    setMapping((current) => ({
      ...current,
      joints: { ...current.joints, [id]: value }
    }))

  return {
    importPending,
    complete,
    kind: source.kind,
    text: source.text,
    setText,
    mapping,
    setMapping,
    setTimeUnit,
    setJointUnit,
    preview,
    columns: current.columns,
    diagnostics: current.diagnostics,
    valid: !!current.value,
    executable: !!current.value && settled,
    error,
    reading,
    actuated: workcell.bodies.filter((body) => body.joint.kind !== 'fixed'),
    inspect,
    accept,
    discard,
    load,
    setJointMapping
  }
}
