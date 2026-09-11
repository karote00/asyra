// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProjectControls } from '../project-controls'
import { encodeProject } from '../../../storage/project-format'
import type {
  PersistenceState,
  ProjectSession
} from '../../../storage/project-session'

let host: HTMLDivElement
let root: Root
const originalShow = HTMLDialogElement.prototype.showModal
const originalClose = HTMLDialogElement.prototype.close
const state: PersistenceState = {
  project: null,
  status: 'unsaved',
  busy: null,
  dirty: true,
  error: ''
}
const summary = {
  id: 'saved',
  name: 'Saved review',
  savedAt: '2026-09-09T00:00:00Z',
  revision: '1'
}
const session = {
  subscribe: () => () => undefined,
  getState: () => state,
  start: vi.fn(),
  list: vi.fn(),
  copy: vi.fn(),
  open: vi.fn(),
  flush: vi.fn(),
  rename: vi.fn(),
  exportProject: vi.fn(),
  importProject: vi.fn()
}
const button = (name: string) => {
  const value = [...host.querySelectorAll('button')].find(
    (el) => el.textContent === name || el.getAttribute('aria-label') === name
  )
  if (!value) throw new Error(`Missing action: ${name}`)
  return value
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  Object.values(session).forEach((value) => {
    if (vi.isMockFunction(value)) value.mockReset()
  })
  session.list.mockResolvedValue({ projects: [summary], limited: false })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(() =>
    root.render(
      createElement(ProjectControls, {
        session: session as unknown as ProjectSession,
        ready: true
      })
    )
  )
  await act(() => button('Projects').click())
})
afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  HTMLDialogElement.prototype.showModal = originalShow
  HTMLDialogElement.prototype.close = originalClose
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([
  ['Copy project', 'Copying project…', 'copy'],
  ['Open Saved review', 'Opening project…', 'open'],
  ['Export project', 'Preparing export…', 'exportProject']
] as const)(
  'shows local pending feedback for %s and restores the action on failure',
  async (label, pending, method) => {
    let reject: (error: Error) => void = () => undefined
    session[method].mockImplementation(
      () =>
        new Promise((_resolve, failure) => {
          reject = failure
        })
    )
    const action = button(label)
    await act(() => {
      action.click()
      action.click()
    })
    expect(action.textContent).toBe(pending)
    expect(action.disabled).toBe(true)
    expect(action.getAttribute('aria-busy')).toBe('true')
    expect(session[method]).toHaveBeenCalledTimes(1)
    await act(() => reject(new Error('Operation failed')))
    expect(button(label).disabled).toBe(false)
    expect(host.textContent).toContain('Operation failed')
  }
)

it('reveals the validated project preview and reports import progress without repeated acceptance', async () => {
  const text = encodeProject({
    document: {
      version: '1.0.0',
      sceneTree: { workspace: '', workspaceList: [], elements: {} },
      props: {}
    },
    loadIssues: []
  })
  const file = new File([], 'review.json')
  file.text = async () => text
  const input = host.querySelector<HTMLInputElement>(
    '[aria-label="Portable project file"]'
  )
  if (!input) throw new Error('Missing portable input')
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  await act(() => input.dispatchEvent(new Event('change', { bubbles: true })))
  expect(document.activeElement?.getAttribute('data-testid')).toBe(
    'project-import-preview'
  )
  let reject: (error: Error) => void = () => undefined
  session.importProject.mockImplementation(
    () =>
      new Promise((_resolve, failure) => {
        reject = failure
      })
  )
  const action = button('Import and replace current project')
  await act(() => {
    action.click()
    action.click()
  })
  expect(action.textContent).toBe('Importing project…')
  expect(action.disabled).toBe(true)
  expect(session.importProject).toHaveBeenCalledTimes(1)
  await act(() => reject(new Error('Import failed')))
  expect(button('Import and replace current project').disabled).toBe(false)
  expect(host.textContent).toContain('Import failed')
})
