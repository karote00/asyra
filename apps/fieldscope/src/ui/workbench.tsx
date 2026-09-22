import { useCameraFlight } from './use-camera-flight'
import {
  ConfigurationRuntime,
  ConfigurationEditor,
  useFarmConfiguration
} from './configuration-editor'
import { configurationSite } from '../domain/farm-configuration'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { bootstrap, type FarmRuntime } from '../runtime/bootstrap'
import { CROPS, createLayout } from '../domain/greenhouse'
import { createDrainProfile } from '../domain/drain-profile'
import {
  LAYER_LABELS,
  type CameraMode,
  type LayerId
} from '../render-app/site-projection'

const CAMERA_LABELS: Record<CameraMode, string> = {
  overview: 'Perspective',
  top: 'Top',
  front: 'Front',
  inside: 'Inside passage',
  joint: 'Clip close-up'
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#254e3d] text-[#d9e9aa]">
        <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 20V9a4 4 0 0 1 8 0v11M12 20V9a4 4 0 0 1 8 0v11M2 20h20M8 14v6m8-6v6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div>
        <div className="text-lg font-semibold tracking-tight">
          <span className="font-normal">FieldScope</span>
        </div>
        <div className="text-[10px] tracking-[0.19em] text-[#7a8779]">
          FARM ROBOTICS WORKSPACE
        </div>
      </div>
    </div>
  )
}

export function Workbench() {
  const [runtime, setRuntime] = useState<FarmRuntime | null>(null)
  return (
    <ConfigurationRuntime.Provider value={runtime}>
      <div className="min-h-screen">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#dce1d6] bg-[#fafbf7] px-5 py-4 lg:px-8">
          <Brand />
          <div className="flex items-center gap-7 text-sm">
            <span className="font-medium text-[#305d44]">
              Greenhouse workstation
            </span>
            <span className="hidden text-[#8d968d] sm:inline">
              Harvest robot monitor
            </span>
            <span className="rounded-full border border-[#dce4cf] bg-[#edf2e5] px-3 py-1 text-xs text-[#62764e]">
              Scene build stage
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1900px] px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-medium tracking-[0.22em] text-[#8b9884]">
                FIELD ENVIRONMENT / 01
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Start understanding harvest from one greenhouse.
              </h1>
              <p className="mt-2 text-sm text-[#818b7d]">
                A spatial prototype of a four-bay plastic-film greenhouse gives
                future harvest runs a shared coordinate frame.
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <FarmMetrics />
            </div>
          </div>
          <SceneWorkspace onReady={setRuntime} />
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <CrossSection />
            <section className="rounded-2xl border border-[#dde3d8] bg-[#fafbf7] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Next, make the field testable
                </h2>
                <span className="text-[10px] tracking-widest text-[#8c967f]">
                  ROADMAP
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <Roadmap
                  step="02"
                  title="Replaceable cultivation"
                  text="Trellis nets, bamboo stakes, bent metal frames, and crop spacing."
                />
                <Roadmap
                  step="03"
                  title="Harvest simulation"
                  text="Paths, arms, foliage contact, and load stability."
                />
                <Roadmap
                  step="04"
                  title="Robot monitoring"
                  text="Synchronized poses, task events, faults, and replay."
                />
              </div>
            </section>
          </div>
          <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[11px] text-[#8b9487]">
            <span>FieldScope - Build the next harvest step at real scale.</span>
            <span>Asyra + Three.js - metre coordinates</span>
          </footer>
        </main>
      </div>
    </ConfigurationRuntime.Provider>
  )
}
function FarmMetrics() {
  const config = useFarmConfiguration()
  return (
    <>
      <Metric
        value={(config.width * 4 * config.length).toLocaleString()}
        unit="m²"
        label="Greenhouse footprint"
      />
      <Metric value="4" unit="bays" label="connected bays" />
      <Metric value={config.height.toFixed(1)} unit="m" label="arch peak" />
    </>
  )
}
function SceneDimensions() {
  const config = useFarmConfiguration()
  return (
    <>
      {(config.width * 4).toFixed(1)} × {config.length.toFixed(1)} ×{' '}
      {config.height.toFixed(1)} m
    </>
  )
}
function Metric({
  value,
  unit,
  label
}: {
  value: string
  unit: string
  label: string
}) {
  return (
    <div>
      <div className="font-mono text-2xl tracking-tight">
        {value}
        <span className="ml-1 text-xs text-[#85917c]">{unit}</span>
      </div>
      <div className="mt-1 text-[10px] text-[#829078]">{label}</div>
    </div>
  )
}
function Roadmap({
  step,
  title,
  text
}: {
  step: string
  title: string
  text: string
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[#a0ad89]">{step}</div>
      <div className="mb-2 font-medium">{title}</div>
      <p className="leading-relaxed text-[#8b9383]">{text}</p>
    </div>
  )
}

function SceneWorkspace({
  onReady
}: {
  onReady: (runtime: FarmRuntime) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [runtime, setRuntime] = useState<FarmRuntime | null>(null)
  const [error, setError] = useState('')
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 1100)
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth >= 1100)
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1099px)')
    const closePanels = () => {
      if (narrow.matches) {
        setLeftOpen(false)
        setRightOpen(false)
      }
    }
    narrow.addEventListener('change', closePanels)
    return () => narrow.removeEventListener('change', closePanels)
  }, [])
  useEffect(() => {
    if (!host.current) return
    let retired = false
    let current: FarmRuntime | undefined
    void bootstrap(host.current)
      .then((value) => {
        current = value
        if (retired) {
          void value.dispose()
          return
        }
        setRuntime(value)
        onReady(value)
      })
      .catch((e) => {
        if (!retired) setError(String(e))
      })
    return () => {
      retired = true
      if (current) void current.dispose()
    }
  }, [onReady])
  useEffect(() => {
    const target = host.current
    if (!target || !runtime) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      let unit = 1
      if (event.deltaMode === 1) unit = 16
      if (event.deltaMode === 2) unit = target.clientHeight
      const delta = event.deltaY * unit
      if (previous.current?.button === 2) {
        runtime.setMovementSpeed(
          Math.max(
            0.01,
            Math.min(60, runtime.getMovementSpeed() * Math.exp(-delta * 0.002))
          )
        )
      } else if (event.altKey) runtime.zoom(delta)
      else runtime.dolly(delta * (event.shiftKey ? 4 : 1))
    }
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.repeat)
        return
      const element = event.target
      if (
        element instanceof HTMLElement &&
        (element.isContentEditable ||
          element.tagName === 'TEXTAREA' ||
          (element instanceof HTMLInputElement &&
            !['range', 'checkbox', 'button'].includes(element.type)))
      )
        return
      if (event.code === 'KeyZ') {
        event.preventDefault()
        event.stopPropagation()
        void (event.shiftKey ? runtime.redo() : runtime.undo()).catch((e) =>
          setError(String(e))
        )
        return
      }
      if (
        event.shiftKey ||
        (event.code !== 'Digit1' && event.code !== 'Digit0')
      )
        return
      event.preventDefault()
      event.stopPropagation()
      if (event.code === 'Digit1') runtime.fit()
      else runtime.actualSize()
    }
    target.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', shortcut, true)
    return () => {
      target.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', shortcut, true)
    }
  }, [runtime])
  useCameraFlight(host, runtime)
  const previous = useRef<{
    x: number
    y: number
    id: number
    button: number
  } | null>(null)
  return (
    <div
      className="scene-workspace"
      data-left-open={leftOpen}
      data-right-open={rightOpen}
    >
      <div className="workspace-toolbar">
        <PanelToggle
          side="left"
          open={leftOpen}
          onClick={() => {
            setLeftOpen(!leftOpen)
            if (window.innerWidth < 1100) setRightOpen(false)
          }}
        />
        <span
          className="text-[11px] text-[#718268]"
          title="After focusing the canvas: W/S forward and back, A/D left and right, E/Q up and down; hold Shift to accelerate"
        >
          WASD move - Q/E lift - Shift accelerate
        </span>
        <PanelToggle
          side="right"
          open={rightOpen}
          onClick={() => {
            setRightOpen(!rightOpen)
            if (window.innerWidth < 1100) setLeftOpen(false)
          }}
        />
      </div>
      <div
        id="layer-panel"
        className="workspace-panel workspace-panel-left"
        inert={!leftOpen}
        aria-hidden={!leftOpen}
      >
        <div className="workspace-panel-content">
          {runtime ? (
            <Controls runtime={runtime} onError={setError} />
          ) : (
            <p className="p-5 text-xs">Preparing scene controls...</p>
          )}
        </div>
      </div>
      <div className="workspace-canvas relative min-w-0 bg-[#e8ede4]">
        <div className="pointer-events-none absolute left-5 top-5 z-10">
          <div className="mb-1 text-xs font-semibold text-[#4f624b]">
            Four-bay greenhouse
          </div>
          <div className="font-mono text-[10px] tracking-wide text-[#82917c]">
            <SceneDimensions />
          </div>
        </div>
        <div
          ref={host}
          data-testid="scene"
          aria-label="rotatable 3D scene of a four-bay greenhouse"
          role="application"
          tabIndex={0}
          className="h-[440px] outline-offset-[-3px] sm:h-[540px] xl:h-[610px]"
          onKeyDown={(event) => {
            if (!runtime) return
            const keys: Record<string, [number, number]> = {
              ArrowLeft: [-15, 0],
              ArrowRight: [15, 0],
              ArrowUp: [0, -15],
              ArrowDown: [0, 15]
            }
            if (keys[event.key]) {
              event.preventDefault()
              runtime.orbit(...keys[event.key])
            }
            if (event.key === '+' || event.key === '=') runtime.zoom(-100)
            if (event.key === '-') runtime.zoom(100)
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 && event.button !== 2) return
            event.preventDefault()
            event.currentTarget.focus({ preventScroll: true })
            event.currentTarget.setPointerCapture(event.pointerId)
            previous.current = {
              x: event.clientX,
              y: event.clientY,
              id: event.pointerId,
              button: event.button
            }
          }}
          onPointerMove={(event) => {
            const p = previous.current
            if (!p || p.id !== event.pointerId || !runtime) return
            if (p.button === 2)
              runtime.look(event.clientX - p.x, event.clientY - p.y)
            else if (event.shiftKey)
              runtime.pan(event.clientX - p.x, event.clientY - p.y)
            else runtime.orbit(event.clientX - p.x, event.clientY - p.y)
            previous.current = { ...p, x: event.clientX, y: event.clientY }
          }}
          onContextMenu={(event) => event.preventDefault()}
          onPointerUp={() => {
            previous.current = null
          }}
          onPointerCancel={() => {
            previous.current = null
          }}
          onLostPointerCapture={() => {
            previous.current = null
          }}
        />
        {!runtime && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#75836e]">
            Building greenhouse scene...
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="absolute inset-6 flex items-center justify-center rounded-xl bg-white/90 p-6 text-sm text-red-700"
          >
            Scene startup failed: {error}
          </div>
        )}
        {runtime && <CameraToolbar runtime={runtime} onError={setError} />}
        {runtime && <ZoomControls runtime={runtime} />}
        {runtime && <MovementSpeedControl runtime={runtime} />}
        <div className="pointer-events-none absolute bottom-5 left-5 max-w-[calc(100%-10rem)] text-[10px] text-[#7b8873]">
          Left drag orbit - Shift left drag pan - right drag look - wheel dolly
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[10px] text-[#607350]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#819c4d]" />
          {runtime ? 'Spatial model ready' : 'Initializing'}
        </div>
      </div>
      <div
        id="configuration-panel"
        className="workspace-panel workspace-panel-right"
        inert={!rightOpen}
        aria-hidden={!rightOpen}
      >
        <div className="workspace-panel-content">
          {runtime ? (
            <ConfigurationEditor runtime={runtime} />
          ) : (
            <p className="p-5 text-xs">Preparing scene settings...</p>
          )}
        </div>
      </div>
    </div>
  )
}
function PanelToggle({
  side,
  open,
  onClick
}: {
  side: 'left' | 'right'
  open: boolean
  onClick: () => void
}) {
  const name = side === 'left' ? 'layer panel' : 'editor panel'
  const label = `${open ? 'Collapse ' : 'Expand '}${name}`
  const arrowPaths = {
    left: open ? 'm16 9-3 3 3 3' : 'm13 9 3 3-3 3',
    right: open ? 'm8 9 3 3-3 3' : 'm11 9-3 3 3 3'
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={open}
      aria-controls={side === 'left' ? 'layer-panel' : 'configuration-panel'}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#42624c] hover:bg-[#e3e9db]"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d={side === 'left' ? 'M9 4v16' : 'M15 4v16'} />
        <path d={arrowPaths[side]} />
      </svg>
    </button>
  )
}
function CameraToolbar({
  runtime,
  onError
}: {
  runtime: FarmRuntime
  onError: (message: string) => void
}) {
  const view = useSyncExternalStore(runtime.subscribe, runtime.getView)
  return (
    <div className="absolute right-4 top-16 flex max-w-[calc(100%-2rem)] flex-wrap gap-1 rounded-xl border border-white/80 bg-[#f9fbf4]/90 p-1 shadow-sm">
      {(Object.keys(CAMERA_LABELS) as CameraMode[]).map((mode) => (
        <button
          key={mode}
          aria-pressed={view.camera === mode}
          onClick={() =>
            void runtime.setCamera(mode).catch((e) => onError(String(e)))
          }
          className={`rounded-lg px-3 py-2 text-[11px] transition-colors ${view.camera === mode ? 'bg-[#315a43] text-white shadow-sm' : 'text-[#718268] hover:bg-[#e3e9db]'}`}
        >
          {CAMERA_LABELS[mode]}
        </button>
      ))}
    </div>
  )
}
function MovementSpeedControl({ runtime }: { runtime: FarmRuntime }) {
  const speed = useSyncExternalStore(
    runtime.subscribeMovementSpeed,
    runtime.getMovementSpeed
  )
  return (
    <label
      className="absolute right-4 top-40 flex items-center gap-2 rounded-lg bg-[#f9fbf4]/90 px-3 py-2 text-[11px] text-[#527048]"
      title="Right mouse plus wheel adjusts speed; Shift accelerates 4x; Alt plus wheel uses optical zoom"
    >
      Movement speed
      <input
        type="range"
        aria-label="Camera movement speed"
        min={Math.log(0.01)}
        max={Math.log(60)}
        step="any"
        value={Math.log(speed)}
        className="w-20"
        onChange={(event) =>
          runtime.setMovementSpeed(
            Math.max(0.01, Math.min(60, Math.exp(Number(event.target.value))))
          )
        }
      />
      <output data-testid="movement-speed" className="min-w-16 font-mono">
        {speed.toFixed(2)} m/s
      </output>
    </label>
  )
}
function ZoomControls({ runtime }: { runtime: FarmRuntime }) {
  const percent = useSyncExternalStore(runtime.subscribeZoom, runtime.getZoom)
  return (
    <div className="absolute right-4 top-28 flex gap-1 rounded-lg border border-white/80 bg-[#f9fbf4]/90 p-1 text-[11px] text-[#527048]">
      <button
        onClick={runtime.fit}
        title="Fit view (⌘1)"
        className="rounded px-3 py-1.5 hover:bg-[#e3e9db]"
      >
        Fit view <span className="text-[#8d9985]">⌘1</span>
      </button>
      <button
        onClick={runtime.actualSize}
        title="Restore 100% (⌘0)"
        aria-label="Restore 100% zoom"
        className="min-w-20 rounded px-3 py-1.5 font-mono hover:bg-[#e3e9db]"
      >
        <span data-testid="zoom-percent">{percent}%</span>{' '}
        <span className="text-[#8d9985]">⌘0</span>
      </button>
    </div>
  )
}

function Controls({
  runtime,
  onError
}: {
  runtime: FarmRuntime
  onError: (message: string) => void
}) {
  const view = useSyncExternalStore(runtime.subscribe, runtime.getView)
  const handle = (promise: Promise<unknown>) => {
    void promise.catch((e) => onError(String(e)))
  }
  return (
    <aside className="border-t border-[#dce2d5] lg:border-l lg:border-t-0">
      <div className="border-b border-[#e0e5d9] px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Scene layers</h2>
          <span className="font-mono text-[10px] text-[#9ba38e]">
            01 / ENVIRONMENT
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#87917e]">
          Toggle film to inspect the greenhouse structure.
        </p>
      </div>
      <div className="space-y-3.5 px-5 py-4">
        {(
          Object.entries(LAYER_LABELS) as [Exclude<LayerId, 'base'>, string][]
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between gap-2 text-xs"
          >
            <span>{label}</span>
            <input
              type="checkbox"
              checked={view.layers[key]}
              onChange={(event) =>
                handle(runtime.setLayer(key, event.target.checked))
              }
              className="h-3.5 w-3.5"
            />
          </label>
        ))}
        <label className="block border-t border-[#e1e6da] pt-3">
          <span className="flex justify-between text-[11px] text-[#85917b]">
            Film opacity
            <span className="font-mono">
              {Math.round(view.filmOpacity * 100)}%
            </span>
          </span>
          <input
            aria-label="Film opacity"
            type="range"
            min="0"
            max="65"
            value={Math.round(view.filmOpacity * 100)}
            onChange={(event) =>
              handle(runtime.setOpacity(Number(event.target.value) / 100))
            }
            className="mt-2 h-1 w-full"
          />
        </label>
      </div>
      <div className="mx-4 rounded-xl bg-[#eef2e7] px-4 py-3">
        <div className="text-[11px] font-semibold text-[#698052]">
          Planting plan
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CROPS.map((crop) => (
            <span
              key={crop}
              className="rounded-md border border-[#dae3cc] bg-[#f8faf3] px-2 py-1 text-[10px] text-[#6e8057]"
            >
              {crop}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#8a957d]">
          <PlantingSummary />
        </p>
      </div>
      <details className="px-5 py-4 text-[11px] text-[#7c8971]">
        <summary className="font-medium">
          Model assumptions and structure references
        </summary>
        <p className="mt-3 leading-relaxed">
          Beam height derives from total height; arches repeat every 1m; posts
          and beams repeat every 5m, with the tail station filled; arch tube
          diameter is 48mm; post diameter is 76mm; semicircular drain depth is
          half the width; lip radius is at most 1cm; barriers are 0.35m high;
          end openings are limited by bay width and eave height, up to 2m wide
          and 2.5m high. Clear passage width must subtract posts.
        </p>
        <p className="mt-2 leading-relaxed">
          This is a dimensional and structural model, not a wind, load, or robot
          clearance verification.
        </p>
        <a
          href="https://book.tndais.gov.tw/Brochure/tech171.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block underline"
        >
          Tainan District Agricultural Research and Extension Station greenhouse
          technical bulletin ↗
        </a>
      </details>
    </aside>
  )
}
function CrossSection() {
  const config = useFarmConfiguration()
  const site = configurationSite(config)
  const strips = createLayout(site, config.strips).strips.filter(
    (strip) => strip.bay === 0
  )
  const sectionDepth = Math.max(
    0.15,
    ...config.strips
      .filter((strip) => strip.kind === 'drain')
      .map((strip) => strip.width / 2)
  )
  return (
    <section className="rounded-2xl border border-[#dde3d8] bg-[#fafbf7] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Cross-bay layout</h2>
        <span className="font-mono text-[10px] text-[#8d9880]">
          {config.width.toFixed(2)}m = {site.margin.toFixed(2)} +{' '}
          {config.strips
            .reduce((sum, strip) => sum + strip.width, 0)
            .toFixed(2)}{' '}
          + {site.margin.toFixed(2)}
        </span>
      </div>
      <svg
        viewBox={`0 -0.04 ${config.width} ${sectionDepth + 0.22}`}
        className="w-full"
        role="img"
        aria-label="scaled section of soil beds and rounded semicircular drains"
      >
        <rect
          x="0"
          y="0"
          width={config.width}
          height={sectionDepth + 0.04}
          fill="#e3e8db"
        />
        {strips.map((strip, i) => {
          const profile =
            strip.kind === 'drain' ? createDrainProfile(strip.width) : null
          const curve = profile?.points
            .map(([x, y], index) => `${index ? 'L' : 'M'}${strip.x + x},${-y}`)
            .join(' ')
          return (
            <g key={i}>
              {profile ? (
                <>
                  <path
                    d={`${curve} L${strip.x + strip.width},${sectionDepth + 0.04} L${strip.x},${sectionDepth + 0.04} Z`}
                    fill="#c0d3d1"
                  />
                  <path
                    d={`${curve} L${strip.x + strip.width},0 Z`}
                    fill="#fafbf7"
                  />
                  <path
                    d={curve}
                    fill="none"
                    stroke="#668b8a"
                    strokeWidth="0.008"
                  />
                </>
              ) : (
                <rect
                  x={strip.x}
                  y="0"
                  width={strip.width}
                  height={sectionDepth + 0.04}
                  fill="#c6b497"
                />
              )}
              <text
                x={strip.x + strip.width / 2}
                y={sectionDepth + 0.14}
                textAnchor="middle"
                fontSize="0.10"
                fill="#6c5a42"
              >
                {strip.width}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-[#85917a]">
        <span>
          ■ Soil{' '}
          {config.strips
            .filter((strip) => strip.kind === 'soil')
            .reduce((sum, strip) => sum + strip.width, 0)
            .toFixed(2)}
          m
        </span>
        <span className="text-[#668b8a]">
          ■ Drain{' '}
          {config.strips.filter((strip) => strip.kind === 'drain').length} items
        </span>
        <span>side margins {site.margin.toFixed(2)}m</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#8a9480]">
        Connected bay margins merge into a {(site.margin * 2).toFixed(2)}m
        passage; black rigid waterproof barriers exist only on the far left and
        right outside edges. Harvest use of passages and drains remains a joint
        decision between cultivation layout and robot specifications.
      </p>
    </section>
  )
}

function PlantingSummary() {
  const config = useFarmConfiguration()
  const site = configurationSite(config)
  return (
    <>
      Ø20mm support pipes, buried 15cm, top height{' '}
      {(site.eave + config.topExtension).toFixed(2)}m, longitudinal spacing
      60cm. A 15cm grid net is fixed with ties, with top edge {config.netTop}m,
      bottom edge {config.netBottom}m. Plants are not configured yet.
    </>
  )
}
