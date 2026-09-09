import { useEffect, useRef, useState } from 'react'
import { compareRuns, type RunComparison } from '../../storage/run-comparison'
import type { RunRecord } from '../../storage/run-record'
import {
  exportRunCsv,
  exportRunHtml,
  exportRunJson
} from '../../storage/run-reports'
import { downloadText } from '../projects/download-project'
import { errorMessage } from '../shared/error-message'

export function useRunLibrary({
  runs,
  onRetain
}: {
  runs: readonly RunRecord[]
  onRetain: (run: RunRecord) => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  const [selectedId, setSelectedId] = useState(runs.at(-1)?.result.runId ?? '')

  const [requestedComparisonIds, setComparisonIds] = useState<string[]>([])

  const [comparisonState, setComparisonState] = useState<{
    value: RunComparison
    sources: readonly RunRecord[]
  } | null>(null)

  const comparisonRuns = requestedComparisonIds
    .map((id) => runs.find((run) => run.result.runId === id))
    .filter((run): run is RunRecord => !!run)
  const comparisonIds = comparisonRuns.map((run) => run.result.runId)
  const comparison =
    comparisonState?.sources.every(
      (run, index) => comparisonRuns[index] === run
    ) && comparisonState.sources.length === comparisonRuns.length
      ? comparisonState.value
      : null
  const [pendingComparison, setPendingComparison] = useState<
    readonly RunRecord[] | null
  >(null)
  const comparisonRequest = useRef<readonly RunRecord[] | null>(null)

  const clearComparison = () => {
    comparisonRequest.current = null
    setPendingComparison(null)
    setComparisonState(null)
  }

  const compareSelected = () => {
    if (comparisonRequest.current) return
    comparisonRequest.current = comparisonRuns
    setPendingComparison(comparisonRuns)
    setComparisonState(null)
    setError('')
  }

  useEffect(() => {
    if (!pendingComparison) return

    // Give the pending button a paint before the synchronous stored-input comparison.
    // This is one cancellable request, not a recurring rendering loop or a minimum delay.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (comparisonRequest.current !== pendingComparison) return
        try {
          setComparisonState({
            value: compareRuns(pendingComparison),
            sources: pendingComparison
          })
        } catch (reason) {
          setError(errorMessage(reason))
        } finally {
          comparisonRequest.current = null
          setPendingComparison(null)
        }
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingComparison])

  useEffect(() => {
    if (comparisonRequest.current?.some((run) => !runs.includes(run))) {
      comparisonRequest.current = null
      setPendingComparison(null)
    }
    setComparisonIds((current) => {
      const retained = current.filter((id) =>
        runs.some((run) => run.result.runId === id)
      )
      return retained.length === current.length ? current : retained
    })
    setComparisonState((current) =>
      current && !current.sources.every((run) => runs.includes(run))
        ? null
        : current
    )
  }, [runs])

  const [error, setError] = useState('')

  const [saving, setSaving] = useState(false)

  const [page, setPage] = useState(0)

  useEffect(() => {
    const element = dialog.current
    const returnFocus = document.activeElement

    element?.showModal()

    return () => {
      element?.close()
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected)
        returnFocus.focus()
    }
  }, [])

  const selected = runs.find((run) => run.result.runId === selectedId)

  const pages = Math.max(1, Math.ceil(runs.length / 30))

  const currentPage = Math.min(page, pages - 1)

  const exportReport = (format: 'json' | 'csv' | 'html') => {
    if (!selected) return

    try {
      const text = {
        json: exportRunJson,
        csv: exportRunCsv,
        html: exportRunHtml
      }[format](selected)

      downloadText(
        `sim-${selected.result.runId}.${format}`,
        text,
        {
          json: 'application/json',
          csv: 'text/csv;charset=utf-8',
          html: 'text/html;charset=utf-8'
        }[format]
      )

      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  const retainSelected = async () => {
    if (!selected) return

    setSaving(true)

    try {
      await onRetain(selected)

      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  return {
    dialog,
    selectedId,
    setSelectedId,
    comparisonIds,
    setComparisonIds,
    comparison,
    comparisonRuns,
    comparing: pendingComparison !== null,
    clearComparison,
    compareSelected,
    error,
    setError,
    saving,
    setSaving,
    setPage,
    selected,
    pages,
    currentPage,
    exportReport,
    retainSelected
  }
}
