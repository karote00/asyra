import { getAssets } from './workspace-assets.js'
import type {
  InspectorRowId,
  WorkspaceTools,
  WorkspaceEditingTools
} from './index.js'

type Observations = Pick<WorkspaceEditingTools, 'observe' | 'observeKeys'>
export type Commands = Omit<WorkspaceEditingTools, keyof Observations>
export type Session = Omit<WorkspaceTools, keyof Commands> & {
  mountInspectorRow(id: InspectorRowId, container: HTMLElement): () => void
  commands: Commands
  updateFeatures(ids: readonly string[]): Promise<void>
  destroy(): Promise<void>
}
type RuntimeWindow = Window & {
  workspaceAssets: ReturnType<typeof getAssets>
  DesignWorkspaceRuntime: {
    mount(
      options: object
    ): Omit<Session, keyof Observations> & { ready: Promise<Observations> }
  }
}

function loadResource(
  element: HTMLElement,
  parent: HTMLElement,
  signal: AbortSignal
) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    signal.addEventListener('abort', () => reject(signal.reason), {
      once: true
    })
    element.onload = () => resolve()
    element.onerror = () =>
      reject(new Error('Unable to load Design workspace asset'))
    parent.append(element)
  })
}

async function loadWorkspaceRuntime(
  frame: HTMLIFrameElement,
  doc: Document,
  signal: AbortSignal
) {
  const realm = frame.contentWindow as RuntimeWindow

  const assets = getAssets(frame.ownerDocument.baseURI)

  realm.workspaceAssets = assets
  const stylesheet = doc.createElement('link')

  stylesheet.rel = 'stylesheet'
  const style = Object.entries(assets).find(([name]) => name.endsWith('.css'))

  if (!style) {
    throw new Error('Design workspace stylesheet is unavailable')
  }

  stylesheet.href = style[1]
  const script = doc.createElement('script')

  script.src = assets['workspace.js']
  await Promise.all([
    loadResource(stylesheet, doc.head, signal),
    loadResource(script, doc.head, signal)
  ])
  signal.throwIfAborted()

  return realm.DesignWorkspaceRuntime
}

// Reparenting replaces an iframe's document even when the host element survives.
// Before readiness this cancels the mount. Afterwards the new frame restores the document.
export async function startWorkspaceFrame(
  frame: HTMLIFrameElement,
  lifetime: AbortController,
  options: Record<string, unknown>,
  reopen: (document?: unknown) => Promise<void>
) {
  const doc = frame.contentDocument
  const realm = frame.contentWindow

  if (!doc || !realm) {
    throw new Error('Design workspace is unavailable')
  }

  let ready: Session | undefined
  let departingDocument: unknown
  const { signal } = lifetime

  const cancelStartup = () =>
    lifetime.abort(new Error('Design workspace moved during startup'))

  realm.addEventListener(
    'pagehide',
    () => {
      if (!ready) {
        cancelStartup()
      } else if (!options.collaboration) {
        departingDocument = ready.save()
      }
    },
    { once: true, signal }
  )
  frame.addEventListener(
    'load',
    () => {
      if (!frame.contentDocument || frame.contentDocument === doc) {
        return
      }

      if (!ready) {
        cancelStartup()
      } else {
        void reopen(departingDocument).catch((error) =>
          globalThis.reportError(error)
        )
      }
    },
    { signal }
  )

  const runtime = await loadWorkspaceRuntime(frame, doc, signal)
  const session = runtime.mount(options)

  const stop = () => {
    void session.destroy()
  }

  signal.addEventListener('abort', stop, { once: true })
  try {
    const observations = await session.ready

    signal.throwIfAborted()
    ready = Object.assign(session, observations)

    return ready
  } catch (error) {
    await session.destroy()
    throw error
  } finally {
    signal.removeEventListener('abort', stop)
  }
}
