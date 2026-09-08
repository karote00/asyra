import { useEffect, useRef, useState } from 'react'
import {
  validObservationDraft,
  type FieldObservation,
  type ObservationDraft,
  type ObservationAttachmentReference
} from '../../common-apis/observation-contract'
import { downloadBytes, downloadText } from '../projects/download-project'
import { errorMessage } from '../shared/error-message'
import type { ObservationAccess } from './observation-access'
import { useObservationFiles } from './use-observation-files'

export function useObservationController({
  runtime,
  runId,
  retained,
  isCurrent
}: {
  runtime: ObservationAccess
  runId: string
  retained: boolean
  isCurrent: () => boolean
}) {
  const [open, setOpen] = useState(false)

  const selectedId = useRef<string | null>(null)
  const writes = useRef({
    tail: Promise.resolve(),
    pending: 0,
    acknowledged: null as FieldObservation | null
  })

  const [editing, setEditing] = useState<FieldObservation | null>(null)

  const [title, setTitle] = useState('')

  const [text, setText] = useState('')

  const [existing, setExisting] = useState<
    readonly ObservationAttachmentReference[]
  >([])

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [status, setStatus] = useState('')

  const files = useObservationFiles(runtime.features.observations, isCurrent)

  const mounted = useRef(true)

  const generation = useRef(0)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false

      generation.current++
    }
  }, [])

  let notes: readonly FieldObservation[] = []

  let readError = ''

  if (retained) {
    try {
      notes = runtime.getObservations(runId)
    } catch (reason) {
      readError = errorMessage(reason)
    }
  }

  const current = selectedId.current
    ? notes.find((note) => note.id === selectedId.current)
    : undefined

  const stale =
    editing !== null && JSON.stringify(current) !== JSON.stringify(editing)

  const draft = {
    title,
    text,
    attachments: [...existing, ...(files.prepared?.attachments ?? [])]
  }

  const currentKey = JSON.stringify(current)
  useEffect(() => {
    if (
      saving ||
      !selectedId.current ||
      currentKey === JSON.stringify(editing ?? undefined)
    )
      return
    // External canonical replay refreshes clean fields. A competing publication
    // must not overwrite an unfinished local gesture.
    if (
      title !== (editing?.title ?? '') ||
      text !== (editing?.text ?? '') ||
      JSON.stringify(existing) !== JSON.stringify(editing?.attachments ?? [])
    )
      return
    writes.current.acknowledged = current ?? null
    setEditing(current ? structuredClone(current) : null)
    setTitle(current?.title ?? '')
    setText(current?.text ?? '')
    setExisting(current ? structuredClone(current.attachments) : [])
  }, [currentKey, saving])

  const reset = () => {
    selectedId.current = null
    writes.current = { tail: Promise.resolve(), pending: 0, acknowledged: null }
    generation.current++

    files.clear()

    setOpen(false)

    setEditing(null)

    setTitle('')

    setText('')

    setExisting([])

    setSaving(false)

    setError('')

    setStatus('')
  }

  const begin = (note?: FieldObservation) => {
    reset()

    setOpen(true)

    if (note) {
      selectedId.current = note.id
      writes.current.acknowledged = note
      setEditing(structuredClone(note))

      setTitle(note.title)

      setText(note.text)

      setExisting(structuredClone(note.attachments))
    }
  }

  const save = async (
    input: ObservationDraft = draft,
    includePrepared = true
  ) => {
    const queue = writes.current
    if (
      !validObservationDraft(input) ||
      (stale && !queue.pending) ||
      (includePrepared && (files.busy || files.error)) ||
      !isCurrent()
    )
      return
    if (
      !editing &&
      !queue.pending &&
      !input.title &&
      !input.text &&
      !input.attachments.length
    )
      return
    const next = structuredClone(input)
    const prepared = includePrepared ? files.prepared : null
    const ticket = generation.current
    const active = () =>
      mounted.current && ticket === generation.current && isCurrent()
    queue.pending++
    setSaving(true)
    const write = async () => {
      // Completed gestures outlive their editor, but never their document.
      // The preceding acknowledgement owns the identity/revision for this queue.
      if (!isCurrent()) throw new Error('The document is no longer active')
      const previous = queue.acknowledged
      if (
        previous &&
        !prepared &&
        next.title === previous.title &&
        next.text === previous.text &&
        JSON.stringify(next.attachments) ===
          JSON.stringify(previous.attachments)
      )
        return
      if (active()) setError('')
      let id = previous?.id
      if (prepared)
        id = await runtime.features.observations.retain(prepared, {
          runId,
          draft: next,
          ...(previous
            ? { edit: { id: previous.id, expectedRevision: previous.revision } }
            : {})
        })
      else if (previous)
        await runtime.features.edit.updateObservation(
          runId,
          previous.id,
          previous.revision,
          next
        )
      else id = await runtime.features.edit.addObservation(runId, next)
      const acknowledged = runtime
        .getObservations(runId)
        .find((note) => note.id === id)
      if (!acknowledged)
        throw new Error('The observation acknowledgement is unavailable')
      queue.acknowledged = acknowledged
      if (active()) {
        selectedId.current = acknowledged.id
        setEditing(structuredClone(acknowledged))
        if (queue.pending === 1)
          setExisting(structuredClone(acknowledged.attachments))
        if (prepared) files.clear()
        setStatus(
          'Observation updated - one Undo action for a material change.'
        )
      }
    }
    const pending = queue.tail.then(write)
    queue.tail = pending.catch(() => undefined)
    try {
      await pending
    } catch (reason) {
      if (active()) setError(errorMessage(reason))
    } finally {
      queue.pending--
      if (active()) setSaving(queue.pending > 0)
    }
  }

  const remove = async (note: FieldObservation) => {
    if (
      !isCurrent() ||
      !window.confirm(`Remove observation "${note.title}"? This can be undone.`)
    )
      return

    const ticket = generation.current

    setSaving(true)

    setError('')

    try {
      await runtime.features.edit.removeObservation(
        runId,
        note.id,
        note.revision
      )

      if (mounted.current && ticket === generation.current && isCurrent()) {
        reset()

        setStatus('Observation removed - Undo can restore it.')
      }
    } catch (reason) {
      if (mounted.current && isCurrent()) setError(errorMessage(reason))
    } finally {
      if (mounted.current && ticket === generation.current && isCurrent())
        setSaving(false)
    }
  }

  const download = (action: () => void) => {
    if (!isCurrent()) return

    try {
      action()

      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  const exportObservations = () =>
    download(() =>
      downloadText(
        `sim-${runId}-observations.json`,
        runtime.exportObservations(runId),
        'application/json'
      )
    )

  const downloadAttachment = (reference: ObservationAttachmentReference) =>
    download(() =>
      downloadBytes(
        reference.filename,
        runtime.getObservationAttachment(reference),
        'application/octet-stream'
      )
    )

  return {
    exportObservations,
    downloadAttachment,
    open,
    editing,
    title,
    setTitle,
    text,
    setText,
    existing,
    setExisting,
    saving,
    error,
    status,
    files,
    notes,
    readError,
    current,
    stale,
    draft,
    reset,
    begin,
    save,
    remove,
    download
  }
}
