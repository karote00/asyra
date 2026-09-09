import { useEffect } from 'react'
import type { TrajectoryInput } from '../../domain/trajectory-input'
import type { ExperimentInputReader } from '../../storage/experiment-input'
import type { TrajectoryImportPreview } from '../../storage/trajectory-import'
import type { NormalizedTrajectorySource } from '../../domain/trajectory-source'
import type { Trajectory, Workcell } from '../../domain/workcell'
import { useTrajectoryImport } from './use-trajectory-import'

export function TrajectoryImportPanel({
  workcell,
  open,
  onOpen,
  trajectory,
  onAccept,
  onEdit,
  input,
  reader,
  onValidity,
  saving = false
}: {
  workcell: Workcell
  open?: boolean
  onOpen?: (open: boolean) => void
  trajectory: Trajectory
  onAccept: (value: NormalizedTrajectorySource, input: TrajectoryInput) => void
  onEdit?: (
    input: TrajectoryInput,
    result: TrajectoryImportPreview
  ) => Promise<boolean>
  input?: TrajectoryInput
  reader?: ExperimentInputReader
  onValidity?: (valid: boolean) => void
  saving?: boolean
}) {
  const {
    importPending,
    complete,
    kind,
    text,
    setText,
    mapping,
    setMapping,
    setTimeUnit,
    setJointUnit,
    preview,
    diagnostics,
    valid,
    executable,
    columns,
    error,
    reading,
    actuated,
    inspect,
    accept,
    discard,
    load,
    setJointMapping
  } = useTrajectoryImport({ workcell, trajectory, input, reader })

  useEffect(() => {
    onValidity?.(importPending || executable)
  }, [onValidity, importPending, executable])

  return (
    <details
      className="trajectory-import"
      open={open}
      onToggle={(event) => onOpen?.(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          event.target instanceof HTMLSelectElement
        ) {
          event.preventDefault()
          event.target.blur()
        }
      }}
      onBlur={(event) => {
        if (
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement
        )
          void complete(
            onEdit ??
              (async (_input, result) => {
                if (result.value) onAccept(result.value, _input)
                return true
              })
          )
      }}
    >
      <summary>Trajectory input</summary>

      <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
        Choose source units for imported CSV files, then preview the conversion.
      </p>

      <div className="file-row flex items-center gap-2 my-3 mx-0">
        <label
          className="file-button inline-block cursor-pointer py-[7px] px-[10px] border
            border-sim-border rounded-[5px] text-[10px] [&_input]:hidden
            [&:focus-within]:[outline:2px_solid_var(--sim-focus)]"
        >
          Load CSV
          <input
            aria-label="Load trajectory CSV"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0]

              if (file) void load(file, 'csv')

              event.currentTarget.value = ''
            }}
          />
        </label>

        <label
          className="file-button inline-block cursor-pointer py-[7px] px-[10px] border
            border-sim-border rounded-[5px] text-[10px] [&_input]:hidden
            [&:focus-within]:[outline:2px_solid_var(--sim-focus)]"
        >
          Load JSON
          <input
            aria-label="Load trajectory JSON"
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]

              if (file) void load(file, 'json')

              event.currentTarget.value = ''
            }}
          />
        </label>

        <span className="format-tag text-[9px] text-sim-muted ml-auto">
          {kind.toUpperCase()}
        </span>
      </div>

      {error && (
        <p
          className="inline-error text-sim-error-text bg-sim-error p-[11px] rounded-[5px]
            text-[11px] leading-[1.6] wrap-anywhere"
          role="alert"
        >
          {error}
        </p>
      )}

      <label>
        Source data
        <textarea
          aria-label="Trajectory source data"
          rows={7}
          aria-invalid={!valid}
          maxLength={kind === 'csv' ? 8 * 1024 * 1024 : 1024 * 1024}
          value={text}
          spellCheck={false}
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      {diagnostics.length > 0 && (
        <ul
          className="diagnostic-list text-[11px] leading-[1.7] pl-[18px] text-sim-error-text"
          role="alert"
        >
          {diagnostics.slice(0, 20).map((item, index) => (
            <li key={`${item.code}:${item.row ?? 0}:${index}`}>
              {item.row ? `Row ${item.row}: ` : ''}
              {item.message}
            </li>
          ))}
        </ul>
      )}

      {kind === 'csv' && (
        <table className="mapping-grid w-full table-fixed border-collapse mb-3 text-[11px] [&_th]:text-left [&_th]:font-semibold [&_th]:text-sim-secondary [&_td]:py-1 [&_td]:pl-2 [&_select]:text-[11px]">
          <colgroup>
            <col className="w-[31%]" />
            <col className="w-[42%]" />
            <col className="w-[27%]" />
          </colgroup>
          <tbody>
            <tr>
              <th scope="row" className="wrap-anywhere">
                Time
              </th>
              <td>
                <select
                  aria-label="Time column"
                  value={mapping.time.column}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      time: { ...current.time, column: event.target.value }
                    }))
                  }
                >
                  <option value="">Choose column</option>

                  {columns.map((column) => (
                    <option key={column}>{column}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  aria-label="Time unit"
                  value={mapping.time.unit}
                  onChange={(event) =>
                    setTimeUnit(event.target.value as '' | 'ms' | 's')
                  }
                >
                  <option value="">Choose unit</option>

                  <option value="s">seconds</option>

                  <option value="ms">milliseconds</option>
                </select>
              </td>
            </tr>

            {actuated.map((body) => {
              const entry = mapping.joints[body.id] ?? {
                column: '',
                unit: '' as const
              }

              return (
                <tr className="mapping-row" key={body.id}>
                  <th scope="row" className="wrap-anywhere">
                    {body.name}
                  </th>
                  <td>
                    <select
                      aria-label={`${body.name} CSV column`}
                      value={entry.column}
                      title={entry.column || 'Choose column'}
                      onChange={(event) =>
                        setJointMapping(body.id, {
                          ...entry,
                          column: event.target.value
                        })
                      }
                    >
                      <option value="">Choose column</option>

                      {columns.map((column) => (
                        <option key={column}>{column}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label={`${body.name} CSV unit`}
                      value={entry.unit}
                      onChange={(event) =>
                        setJointUnit(
                          body.id,
                          event.target.value as typeof entry.unit
                        )
                      }
                    >
                      <option value="">Choose unit</option>

                      {body.joint.kind === 'revolute' ? (
                        <>
                          <option value="rad">radians</option>

                          <option value="deg">degrees</option>
                        </>
                      ) : (
                        <>
                          <option value="m">meters</option>

                          <option value="mm">millimeters</option>
                        </>
                      )}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {reading && (
        <p className="hint text-[10px] leading-[1.6] text-sim-muted font-normal">
          Reading trajectory file…
        </p>
      )}

      <button
        className="wide w-full"
        disabled={reading}
        onClick={() => inspect()}
      >
        Preview trajectory
      </button>

      {(preview || reading) && (
        <button className="wide w-full mt-2" onClick={discard}>
          Discard preview
        </button>
      )}

      {preview?.value && (
        <div className="accepted-preview p-3 bg-sim-success rounded-[6px] grid gap-2 mt-[10px] text-[11px]">
          <strong>
            {preview.value.trajectory.keyframes.length} valid keyframes
          </strong>

          <span>
            {preview.value.trajectory.keyframes[0]?.time ?? 0}s →{' '}
            {preview.value.trajectory.keyframes.at(-1)?.time ?? 0}s
          </span>

          <div
            aria-label="Trajectory conversion preview"
            className="grid gap-2 max-h-48 min-[700px]:max-h-72 overflow-y-auto"
          >
            <p className="text-sim-muted">
              Source → converted values. Showing first, middle and last
              keyframes. Displayed values are rounded.
            </p>
            {preview.conversions.map((sample) => (
              <div
                key={`${sample.frameIndex}:${sample.sourceField}`}
                className="min-w-0 border-t border-sim-border pt-2 wrap-anywhere"
              >
                <div>
                  Keyframe {sample.frameIndex + 1} - {sample.sourceField}
                </div>
                <div className="font-mono">
                  {Number(sample.sourceValue.toPrecision(10))}{' '}
                  {sample.sourceUnit}
                  {' → '}
                  {Number(sample.canonicalValue.toPrecision(10))}{' '}
                  {sample.canonicalUnit}
                </div>
              </div>
            ))}
          </div>

          {importPending && (
            <button
              className="primary bg-sim-accent text-[#fff] border-sim-accent [&:hover]:bg-sim-accent-hover"
              disabled={saving}
              onClick={() => accept(onAccept)}
            >
              Import trajectory
            </button>
          )}
        </div>
      )}
    </details>
  )
}
