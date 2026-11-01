import { useId, useMemo, useState } from 'react'
import type { ReactNode, MouseEvent, KeyboardEvent } from 'react'
import { StepContract } from './StepContract'
import { FlowViewport } from './FlowViewport'
import type { ArchitectureData } from './types'
import { validateArchitecture } from './validate'

export interface ArchitectureViewProps {
  data: ArchitectureData
  onSelect?: (stepId: string) => void
  selectedStepId?: string
  detailsVisible?: boolean
  headerVisible?: boolean
  onCloseDetails?: () => void
  onShowDetails?: () => void
  stepStatuses?: Record<string, string>
  observationSteps?: string[]
  focusRequest?: { id: string; stepIds: string[]; padding: number }
  onStepMenu?: (stepId: string, event: MouseEvent | KeyboardEvent) => void
  foldContract?: boolean
  renderTask?: (stepId: string) => ReactNode
}

const geometry = {
  left: 60,
  top: 68,
  width: 290,
  height: 168,
  column: 470,
  row: 252
}

function routePath(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  if (from.x === to.x) {
    const x = from.x + geometry.width / 2
    const startY = from.y + geometry.height
    const middleY = (startY + to.y) / 2

    return `M ${x} ${startY} C ${x} ${middleY}, ${x} ${middleY}, ${x} ${to.y}`
  }

  const direction = to.x >= from.x ? 1 : -1
  const startX = from.x + (direction > 0 ? geometry.width : 0)
  const endX = to.x + (direction > 0 ? 0 : geometry.width)
  const startY = from.y + geometry.height / 2
  const endY = to.y + geometry.height / 2
  const curve = Math.max(
    120,
    Math.min(Math.abs(endX - startX) * 0.46, 180 * 0.92)
  )

  return `M ${startX} ${startY} C ${startX + direction * curve} ${startY}, ${endX - direction * curve} ${endY}, ${endX} ${endY}`
}

export function ArchitectureView(props: ArchitectureViewProps) {
  const errors = useMemo(() => validateArchitecture(props.data), [props.data])

  if (errors.length) {
    return (
      <section role="alert">
        Invalid architecture contract:
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    )
  }

  return <ArchitectureCanvas {...props} />
}

function ArchitectureCanvas({
  data,
  onSelect,
  selectedStepId,
  detailsVisible = true,
  headerVisible = true,
  onCloseDetails,
  onShowDetails,
  stepStatuses,
  observationSteps = [],
  focusRequest,
  onStepMenu,
  foldContract = false,
  renderTask
}: ArchitectureViewProps) {
  const [localSelectedId, setSelectedId] = useState(data.steps[0]?.id)
  const selectedId = selectedStepId ?? localSelectedId
  const [laneId, setLaneId] = useState<string | null>(null)
  const markerId = useId()
  const visibleSteps = data.steps.filter(
    (step) => laneId === null || step.laneId === laneId
  )
  const selected =
    visibleSteps.find((step) => step.id === selectedId) ?? visibleSteps[0]
  const positions = new Map<string, { x: number; y: number }>()

  for (const [column, lane] of data.lanes.entries()) {
    const laneSteps = visibleSteps
      .filter((step) => step.laneId === lane.id)
      .sort((a, b) => a.order - b.order)

    for (const [row, step] of laneSteps.entries()) {
      positions.set(step.id, {
        x: geometry.left + column * geometry.column,
        y: geometry.top + row * geometry.row
      })
    }
  }

  const width = Math.max(
    geometry.width + 120,
    ...Array.from(
      positions.values(),
      (position) => position.x + geometry.width + 60
    )
  )
  const height = Math.max(
    geometry.height + 136,
    ...Array.from(
      positions.values(),
      (position) => position.y + geometry.height + 68
    )
  )
  const focused =
    focusRequest?.stepIds.flatMap((id) => {
      const position = positions.get(id)

      return position ? [position] : []
    }) ?? []
  const focusBounds =
    focused.length && focusRequest
      ? {
          id: focusRequest.id,
          x: Math.min(...focused.map((point) => point.x)),
          y: Math.min(...focused.map((point) => point.y)),
          width:
            Math.max(...focused.map((point) => point.x)) -
            Math.min(...focused.map((point) => point.x)) +
            geometry.width,
          height:
            Math.max(...focused.map((point) => point.y)) -
            Math.min(...focused.map((point) => point.y)) +
            geometry.height,
          padding: focusRequest.padding
        }
      : undefined

  function select(stepId: string) {
    setSelectedId(stepId)
    onSelect?.(stepId)
    onShowDetails?.()
  }

  function filter(nextLane: string | null) {
    setLaneId(nextLane)
    const nextSelected =
      data.steps.find(
        (step) =>
          (nextLane === null || step.laneId === nextLane) &&
          step.id === selectedId
      ) ??
      data.steps.find((step) => nextLane === null || step.laneId === nextLane)

    if (nextSelected && nextSelected.id !== selectedId) {
      select(nextSelected.id)
    }
  }

  return (
    <div
      className={`architecture-view app${detailsVisible ? '' : ' is-detail-collapsed'}`}
    >
      <main className="main">
        <header className="header" hidden={!headerVisible}>
          <h1>{data.target.title}</h1>
          <p>{data.target.subtitle}</p>
          <nav aria-label="Target references" className="header-links">
            {data.links.map((link) => (
              <a
                key={link.id ?? link.href}
                className="header-link"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <details className="target-meta">
            <summary>Target contract</summary>
            <p>
              Target:{' '}
              <code>
                {data.target.kind}:{data.target.id}
              </code>
            </p>
            <p>
              Schema:{' '}
              <code>
                {data.schema.id}/v{data.schema.version}
              </code>
            </p>
            <p>
              Semantic authority: <code>{data.authority.specPath}</code>
            </p>
            <p>
              Inspector data: <code>{data.authority.inspectorPath}</code>
            </p>
          </details>
        </header>
        <nav aria-label="Lanes" className="filters">
          <button
            type="button"
            className={`filter-button${laneId === null ? ' is-active' : ''}`}
            aria-pressed={laneId === null}
            onClick={() => filter(null)}
          >
            All
          </button>
          {data.lanes.map((lane) => (
            <button
              key={lane.id}
              type="button"
              className={`filter-button${laneId === lane.id ? ' is-active' : ''}`}
              aria-pressed={laneId === lane.id}
              onClick={() => filter(lane.id)}
            >
              {lane.title}
            </button>
          ))}
        </nav>
        <FlowViewport
          width={width}
          height={height}
          onShowAll={() => filter(null)}
          focusBounds={focusBounds}
        >
          <div
            id="flow"
            className="flow"
            style={{ position: 'relative', width, height }}
          >
            {data.lanes
              .filter((lane) => laneId === null || lane.id === laneId)
              .map((lane) => (
                <div
                  className="lane-label"
                  key={lane.id}
                  style={{
                    left:
                      geometry.left + data.lanes.indexOf(lane) * geometry.column
                  }}
                >
                  {lane.title}
                </div>
              ))}
            <svg
              className="flow-svg"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              aria-label="Architecture routes"
            >
              <defs>
                <marker
                  id={markerId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              {data.routes.map((route) => {
                const from = positions.get(route.from)
                const to = route.to ? positions.get(route.to) : undefined

                if (!from || !to) {
                  return null
                }

                return (
                  <path
                    key={route.id}
                    data-route-id={route.id}
                    className={`edge-path route-${route.kind}${route.from === selected?.id || route.to === selected?.id ? ' is-active' : ''}`}
                    d={routePath(from, to)}
                    markerEnd={`url(#${markerId})`}
                  >
                    <title>
                      {route.id}: {route.kind}; {route.predicate}
                    </title>
                  </path>
                )
              })}
            </svg>
            {visibleSteps.map((step) => (
              <button
                type="button"
                key={step.id}
                data-step-id={step.id}
                data-status={stepStatuses?.[step.id]}
                aria-label={
                  stepStatuses
                    ? `${step.title} - ${stepStatuses[step.id] ?? 'unavailable'}`
                    : undefined
                }
                aria-pressed={step.id === selected?.id}
                className={[
                  'step-card',
                  observationSteps.includes(step.id)
                    ? 'observation-failed'
                    : '',
                  stepStatuses?.[step.id] === 'failed' ? 'proof-failed' : '',
                  step.id === selected?.id ? 'is-selected' : '',
                  ...(step.tags ?? [])
                    .filter((tag) =>
                      ['risk', 'critical', 'blocker'].includes(tag)
                    )
                    .map((tag) => `is-${tag}`)
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  position: 'absolute',
                  left: positions.get(step.id)?.x,
                  top: positions.get(step.id)?.y,
                  width: geometry.width,
                  height: geometry.height
                }}
                onClick={() => select(step.id)}
                onContextMenu={(event) => onStepMenu?.(step.id, event)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'ContextMenu' ||
                    (event.shiftKey && event.key === 'F10')
                  ) {
                    onStepMenu?.(step.id, event)
                  }
                }}
              >
                <div className="step-kicker">
                  <span className="step-number">Step {step.order}</span>
                  <span>
                    {data.lanes.find((lane) => lane.id === step.laneId)?.title}
                  </span>
                </div>
                <div className="step-title">{step.title}</div>
                <div className="step-summary">{step.purpose}</div>
                <div className="badge-row">
                  {stepStatuses?.[step.id] && (
                    <span
                      className="proof-badge"
                      data-status={stepStatuses[step.id]}
                    >
                      {stepStatuses[step.id]}
                    </span>
                  )}
                  <span className="badge owner">
                    Owner: {step.ownerPackage}
                  </span>
                  {step.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </FlowViewport>
      </main>
      <aside
        id="detail"
        className="detail"
        aria-label="Step contract"
        hidden={!detailsVisible}
      >
        {onCloseDetails && (
          <button
            type="button"
            className="panel-close-button"
            aria-label="Close step details"
            onClick={onCloseDetails}
          >
            ×
          </button>
        )}
        {selected ? (
          <>
            {foldContract && (
              <div className="detail-heading">
                <span className="step-number">Step {selected.order}</span>
                <h2>{selected.title}</h2>
              </div>
            )}
            {renderTask?.(selected.id)}
            {foldContract ? (
              <details data-full-contract>
                <summary>Architecture contract</summary>
                <StepContract data={data} step={selected} showHeading={false} />
              </details>
            ) : (
              <StepContract data={data} step={selected} />
            )}
          </>
        ) : (
          <p>No steps are declared.</p>
        )}
      </aside>
    </div>
  )
}
