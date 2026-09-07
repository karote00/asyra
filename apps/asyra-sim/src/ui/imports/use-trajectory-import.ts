import { useLayoutEffect, useRef, useState, type SetStateAction } from 'react'
import type { NormalizedTrajectorySource } from '../../domain/trajectory-source'
import type { Trajectory, Workcell } from '../../domain/workcell'
import {
  prepareTrajectoryCsv,
  previewTrajectoryCsv,
  previewTrajectoryJson,
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
  trajectory
}: {
  workcell: Workcell
  trajectory: Trajectory
}) {
  const [source, setSource] = useState(() => {
    const text = trajectoryToCsv(workcell, trajectory)
    return {
      kind: 'csv' as 'csv' | 'json',
      text,
      csv: prepareTrajectoryCsv(text)
    }
  })
  const [mapping, updateMapping] = useState<TrajectoryCsvMappingDraft>(() =>
    canonicalCsvMapping(workcell)
  )
  const declarations = useRef({ time: false, joints: new Set<string>() })
  const [receipt, setReceipt] = useState<{
    result: TrajectoryImportPreview
    source: typeof source
    mapping: TrajectoryCsvMappingDraft
    workcell: Workcell
    generation: number
  } | null>(null)
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
    const result =
      source.kind === 'csv'
        ? previewTrajectoryCsv(source.csv, workcell, mapping)
        : previewTrajectoryJson(source.text, workcell)
    setReceipt({
      result,
      source,
      mapping,
      workcell,
      generation: generation.current
    })
    return result
  }

  const accept = (onAccept: (value: NormalizedTrajectorySource) => void) => {
    if (preview?.value && receipt?.generation === generation.current)
      onAccept(preview.value)
  }

  const setText = (text: string) => {
    discard()
    const csv = source.kind === 'csv' ? prepareTrajectoryCsv(text) : source.csv
    setSource({ ...source, text, csv })
    // Source edits retire computed evidence, not explicit unit declarations.
    if (source.kind === 'csv') {
      const suggested = guessCsvMapping(csv.columns, workcell)
      const next = { ...suggested, joints: { ...suggested.joints } }
      if (csv.columns.includes(mapping.time.column))
        next.time = {
          ...mapping.time,
          unit: declarations.current.time ? mapping.time.unit : ''
        }
      else declarations.current.time = false
      for (const body of workcell.bodies) {
        if (body.joint.kind === 'fixed') continue
        const entry = mapping.joints[body.id]
        if (entry && csv.columns.includes(entry.column))
          next.joints[body.id] = {
            ...entry,
            unit: declarations.current.joints.has(body.id) ? entry.unit : ''
          }
        else declarations.current.joints.delete(body.id)
      }
      updateMapping(next)
    }
  }

  const setMapping = (next: SetStateAction<TrajectoryCsvMappingDraft>) => {
    discard()
    updateMapping(next)
  }

  const setTimeUnit = (unit: TrajectoryCsvMappingDraft['time']['unit']) => {
    declarations.current.time = unit !== ''
    setMapping((current) => ({ ...current, time: { ...current.time, unit } }))
  }

  const setJointUnit = (
    id: string,
    unit: TrajectoryCsvMappingDraft['joints'][string]['unit']
  ) => {
    if (unit) declarations.current.joints.add(id)
    else declarations.current.joints.delete(id)
    setMapping((current) => ({
      ...current,
      joints: {
        ...current.joints,
        [id]: { ...current.joints[id], unit }
      }
    }))
  }

  const load = async (file: File, nextKind: 'csv' | 'json') => {
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
    const csv = nextKind === 'csv' ? prepareTrajectoryCsv(text) : source.csv
    declarations.current = { time: false, joints: new Set<string>() }
    setSource({ kind: nextKind, text, csv })
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
    kind: source.kind,
    text: source.text,
    setText,
    mapping,
    setMapping,
    setTimeUnit,
    setJointUnit,
    preview,
    columns: source.csv.columns,
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
