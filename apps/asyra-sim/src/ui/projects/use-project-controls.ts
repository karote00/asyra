import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ProjectSummary } from '../../storage/project-format'
import type { ProjectSession } from '../../storage/project-session'
import { errorMessage } from '../shared/error-message'

export function useProjectControls({
  session,
  unsavedRunCount = 0
}: {
  session: ProjectSession
  unsavedRunCount?: number
}) {
  const state = useSyncExternalStore(session.subscribe, session.getState)

  const [open, setOpen] = useState(false)

  const [name, setName] = useState('Untitled project')

  const [projects, setProjects] = useState<ProjectSummary[]>([])

  const [limited, setLimited] = useState(false)

  const [listing, setListing] = useState(false)

  const [problem, setProblem] = useState('')

  const dialog = useRef<HTMLDialogElement>(null)

  const request = useRef(0)
  const [pendingAction, setPendingAction] = useState<{
    kind: 'copy' | 'open' | 'retry'
    projectId?: string
  } | null>(null)
  const actionPending = useRef(false)

  const beginAction = (action: NonNullable<typeof pendingAction>) => {
    if (actionPending.current) return false
    actionPending.current = true
    setPendingAction(action)
    setProblem('')
    return true
  }
  const endAction = () => {
    actionPending.current = false
    setPendingAction(null)
  }

  useEffect(() => {
    if (!open) return

    const element = dialog.current

    element?.showModal()

    return () => {
      element?.close()

      request.current++
    }
  }, [open])

  const refresh = async () => {
    const id = ++request.current

    setListing(true)

    try {
      const result = await session.list()

      if (id !== request.current) return

      setProjects(result.projects)

      setLimited(result.limited)

      setProblem('')
    } catch (error) {
      if (id === request.current) setProblem(errorMessage(error))
    } finally {
      if (id === request.current) setListing(false)
    }
  }

  const copy = async () => {
    if (!beginAction({ kind: 'copy' })) return
    try {
      await session.start()
      await session.copy(`${state.project?.name ?? name} - Copy`)

      setName(session.getState().project?.name ?? name)

      setProblem('')

      await refresh()
    } catch (error) {
      setProblem(errorMessage(error))
    } finally {
      endAction()
    }
  }

  const choose = async (project: ProjectSummary) => {
    if (actionPending.current) return
    if (
      !window.confirm(
        `Open “${project.name}”? This starts a new document with empty Undo/Redo. ${unsavedRunCount} unretained results will be lost.`
      )
    )
      return

    if (!beginAction({ kind: 'open', projectId: project.id })) return
    try {
      await session.start()
      await session.open(project.id, true)

      setName(project.name)

      setProblem('')

      setOpen(false)
    } catch (error) {
      setProblem(errorMessage(error))
    } finally {
      endAction()
    }
  }

  let caption = 'Unsaved changes'

  if (state.busy === 'open') caption = 'Opening…'
  else if (state.busy === 'export') caption = 'Preparing export…'
  else if (state.status === 'saving') caption = 'Saving…'
  else if (state.status === 'saved')
    caption = `Saved locally - ${state.project?.name}`
  else if (state.status === 'error')
    caption = 'Save/open error - changes not acknowledged'

  const rename = (value: string) => {
    try {
      session.rename(value)
      setName(value.trim())
      setProblem('')
    } catch (error) {
      setProblem(errorMessage(error))
    }
  }

  const retry = async () => {
    if (!beginAction({ kind: 'retry' })) return
    try {
      if (!session.getState().project)
        await session.start(
          new URL(window.location.href).searchParams.get('projectId') ??
            undefined
        )
      else await session.flush()
      setProblem('')
    } catch (error) {
      setProblem(errorMessage(error))
    } finally {
      endAction()
    }
  }

  return {
    state,
    pendingAction,
    open,
    setOpen,
    name,
    setName,
    projects: projects.map((project) =>
      project.id === state.project?.id ? state.project : project
    ),
    limited,
    listing,
    problem,
    setProblem,
    dialog,
    refresh,
    copy,
    rename,
    choose,
    caption,
    retry
  }
}
