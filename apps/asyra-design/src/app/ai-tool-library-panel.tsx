import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readToolLibrary,
  updateToolLibrary,
  type ToolLibraryInventory,
  type ToolLibraryRequest
} from '../ai/tool-library-management'

/** Independent panel state keeps inventory work out of conversation and canvas updates. */
export const AiToolLibraryPanel = () => {
  const [open, setOpen] = useState(false)
  const [inventory, setInventory] = useState<ToolLibraryInventory>()
  const [issue, setIssue] = useState<string>()
  const [busy, setBusy] = useState(false)
  const active = useRef<AbortController | undefined>(undefined)
  const refresh = useCallback(
    async (change?: Exclude<ToolLibraryRequest, { operation: 'list' }>) => {
      active.current?.abort()
      const request = new AbortController()
      active.current = request
      setBusy(true)
      setIssue(undefined)
      try {
        if (change) await updateToolLibrary(change, request.signal)
        const next = await readToolLibrary(request.signal)
        if (!request.signal.aborted) setInventory(next)
      } catch (error) {
        if (!request.signal.aborted)
          setIssue(
            error instanceof Error
              ? error.message
              : 'Saved tools are unavailable.'
          )
      } finally {
        if (!request.signal.aborted) setBusy(false)
      }
    },
    []
  )
  useEffect(() => {
    if (open) void refresh()
    return () => active.current?.abort()
  }, [open, refresh])
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Close saved tools' : 'Saved tools'}
        className="rounded border border-[#45464b] bg-transparent px-2 py-1 text-[12px] text-[#c7c8ce] hover:bg-[#303136]"
        onClick={() => setOpen(!open)}
      >
        Tools
      </button>
      {open ? (
        <section
          aria-label="Saved tools"
          className="absolute right-0 top-9 z-20 max-h-[65vh] w-72 max-w-[85vw] overflow-y-auto rounded-lg border border-[#45464b] bg-[#222328] p-3 text-[12px] shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <strong>Saved tools</strong>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="text-[#b4a5ff] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          <p className="text-[#aaabb3]">
            Saved status is shown below. Dependencies are checked before use.
            Changes affect future calls; drawings stay unchanged.
          </p>
          {busy ? <p role="status">Updating saved tools…</p> : null}
          {issue ? (
            <p role="alert" className="break-words text-[#ffb8b8]">
              {issue}
            </p>
          ) : null}
          {inventory?.truncated ? (
            <p role="alert">
              The saved inventory is incomplete. Some tools are not shown.
            </p>
          ) : null}
          {inventory?.unavailable.length ? (
            <p role="alert">
              {inventory.unavailable.length} saved entries could not be read.
            </p>
          ) : null}
          {inventory?.entries.length === 0 ? <p>No saved tools.</p> : null}
          <ul className="m-0 list-none space-y-3 p-0">
            {inventory?.entries.map((tool) => (
              <li
                className="border-t border-[#45464b] pt-2"
                key={`${tool.name}:${tool.revision}`}
              >
                <div className="break-words font-medium">{tool.name}</div>
                <div className="text-[#aaabb3]">
                  Revision {tool.revision} - <span>{tool.availability}</span>
                </div>
                <p className="break-words">{tool.description}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label={`Suspend ${tool.name}`}
                    disabled={
                      busy ||
                      tool.availability === 'suspended' ||
                      tool.availability === 'retired'
                    }
                    className="text-[#b4a5ff] disabled:opacity-40"
                    onClick={() =>
                      void refresh({
                        operation: 'suspend',
                        name: tool.name,
                        revision: tool.revision,
                        expectedVersion: tool.version
                      })
                    }
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${tool.name}`}
                    disabled={busy || tool.availability === 'retired'}
                    className="text-[#ffb8b8] disabled:opacity-40"
                    onClick={() =>
                      void refresh({
                        operation: 'remove',
                        name: tool.name,
                        revision: tool.revision,
                        expectedVersion: tool.version
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
