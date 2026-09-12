import { WorkspaceEditor } from './robot-editor'
import { LanguageSelector, useTranslation, localizeError } from './i18n/locale'
import { useCameraFlight } from './use-camera-flight'
import {
  ConfigurationRuntime,
  useFarmConfiguration
} from './configuration-editor'
import { configurationSite } from '../domain/farm-configuration'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { bootstrap, type FarmRuntime } from '../runtime/bootstrap'
import { createLayout } from '../domain/greenhouse'
import { createDrainProfile } from '../domain/drain-profile'
import { type CameraMode, type LayerId } from '../render-app/site-projection'

const CAMERA_MODES: CameraMode[] = [
  'overview',
  'top',
  'front',
  'inside',
  'joint'
]

function Brand() {
  const { t } = useTranslation()
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
          {t('app.brand')}
        </div>
        <div className="text-[10px] tracking-[0.19em] text-[#7a8779]">
          {t('app.tagline')}
        </div>
      </div>
    </div>
  )
}

export function Workbench() {
  const { t } = useTranslation()
  const [runtime, setRuntime] = useState<FarmRuntime | null>(null)
  return (
    <ConfigurationRuntime.Provider value={runtime}>
      <div className="min-h-screen">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-[#dce1d6] bg-[#fafbf7] px-5 py-4 lg:px-8">
          <Brand />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-[#305d44]">
              {t('app.workspace')}
            </span>
            <ReferenceLibrary />
            <LanguageSelector />
            <span className="hidden text-[#8d968d] sm:inline">
              {t('app.monitoring')}
            </span>
            <span className="rounded-full border border-[#dce4cf] bg-[#edf2e5] px-3 py-1 text-xs text-[#62764e]">
              {t('app.phase')}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1900px] px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-medium tracking-[0.22em] text-[#8b9884]">
                {t('app.environment')}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t('app.heading')}
              </h1>
              <p className="mt-2 text-sm text-[#818b7d]">
                {t('app.description')}
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <FarmMetrics />
            </div>
          </div>
          <SceneWorkspace onReady={setRuntime} />
          <div className="mt-6">
            <CrossSection />
          </div>
          <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[11px] text-[#8b9487]">
            <span>{t('app.footer')}</span>
            <span>{t('app.engine')}</span>
          </footer>
        </main>
      </div>
    </ConfigurationRuntime.Provider>
  )
}
function FarmMetrics() {
  const { t, locale } = useTranslation()
  const config = useFarmConfiguration()
  return (
    <>
      <Metric
        value={(config.width * 4 * config.length).toLocaleString(locale)}
        unit="m²"
        label={t('metric.area')}
      />
      <Metric value="4" unit={t('metric.bayUnit')} label={t('metric.bays')} />
      <Metric
        value={config.height.toFixed(1)}
        unit="m"
        label={t('metric.height')}
      />
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

function SceneWorkspace({
  onReady
}: {
  onReady: (runtime: FarmRuntime) => void
}) {
  const { t } = useTranslation()
  const host = useRef<HTMLDivElement>(null)
  const [runtime, setRuntime] = useState<FarmRuntime | null>(null)
  const [error, setError] = useState<unknown>(null)
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
        if (!retired) setError(e)
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
          setError(e)
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
  const touches = useRef(new Map<number, { x: number; y: number }>())
  useEffect(() => {
    const clear = () => {
      touches.current.clear()
      previous.current = null
    }
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('blur', clear)
      clear()
    }
  }, [])
  const releasePointer = (event: { pointerId: number }) => {
    touches.current.delete(event.pointerId)
    if (previous.current?.id === event.pointerId) previous.current = null
  }
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
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2"
          data-testid="viewport-toolbar"
        >
          {runtime && <CameraToolbar runtime={runtime} onError={setError} />}
          {runtime && <ZoomControls runtime={runtime} />}
          {runtime && <MovementSpeedControl runtime={runtime} />}
        </div>
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
            <p className="p-5 text-xs">{t('scene.controlsLoading')}</p>
          )}
        </div>
      </div>
      <div className="workspace-canvas relative min-w-0 bg-[#e8ede4]">
        <div className="pointer-events-none absolute left-5 top-5 z-10">
          <div className="mb-1 text-xs font-semibold text-[#4f624b]">
            {t('scene.name')}
          </div>
          <div className="font-mono text-[10px] tracking-wide text-[#82917c]">
            <SceneDimensions />
          </div>
        </div>
        <div
          ref={host}
          data-testid="scene"
          aria-label={t('scene.accessible')}
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
              runtime.look(...keys[event.key])
            }
            if (event.key === '+' || event.key === '=') runtime.zoom(-100)
            if (event.key === '-') runtime.zoom(100)
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 && event.button !== 2) return
            event.preventDefault()
            event.currentTarget.focus({ preventScroll: true })
            event.currentTarget.setPointerCapture(event.pointerId)
            if (event.pointerType === 'touch') {
              previous.current = null
              touches.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
              })
              return
            }
            if (touches.current.size) return
            previous.current = {
              x: event.clientX,
              y: event.clientY,
              id: event.pointerId,
              button: event.button
            }
          }}
          onPointerMove={(event) => {
            if (event.pointerType === 'touch') {
              const points = touches.current
              const old = points.get(event.pointerId)
              if (!old) return
              const before = [...points.values()]
              points.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
              })
              if (!runtime) return
              if (points.size === 1) {
                runtime.look(event.clientX - old.x, event.clientY - old.y)
              } else if (points.size === 2) {
                const after = [...points.values()]
                runtime.pan(
                  (event.clientX - old.x) / 2,
                  (event.clientY - old.y) / 2
                )
                const distance = (pair: { x: number; y: number }[]) =>
                  Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y)
                const from = distance(before)
                const to = distance(after)
                if (from > 1 && to > 1 && from !== to)
                  runtime.dolly(-1000 * Math.log(to / from))
              }
              return
            }
            const p = previous.current
            if (!p || p.id !== event.pointerId || !runtime) return
            if (p.button === 2)
              runtime.look(event.clientX - p.x, event.clientY - p.y)
            else if (event.shiftKey)
              runtime.pan(event.clientX - p.x, event.clientY - p.y)
            else runtime.look(event.clientX - p.x, event.clientY - p.y)
            previous.current = { ...p, x: event.clientX, y: event.clientY }
          }}
          onContextMenu={(event) => event.preventDefault()}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onLostPointerCapture={releasePointer}
        />
        {!runtime && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#75836e]">
            {t('scene.loading')}
          </div>
        )}
        {Boolean(error) && (
          <div
            role="alert"
            className="absolute inset-6 flex items-center justify-center rounded-xl bg-white/90 p-6 text-sm text-red-700"
          >
            {t('scene.failed', { error: localizeError(error, t) })}
          </div>
        )}
        <div className="pointer-events-none absolute bottom-5 left-5 max-w-[calc(100%-10rem)] rounded-md bg-[#fafbf7]/85 px-2 py-1 text-[10px] leading-relaxed text-[#50664f]">
          <span className="camera-desktop-hint">{t('camera.desktopHint')}</span>
          <span className="camera-touch-hint">{t('camera.touchHint')}</span>
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[10px] text-[#607350]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#819c4d]" />
          {runtime ? t('scene.ready') : t('scene.initializing')}
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
            <WorkspaceEditor runtime={runtime} />
          ) : (
            <p className="p-5 text-xs">{t('scene.settingsLoading')}</p>
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
  const { t } = useTranslation()
  const label = t(`panel.${side}${open ? 'Close' : 'Open'}`)
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
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="2" />
        <path d={side === 'left' ? 'M9 4.75v14.5' : 'M15 4.75v14.5'} />
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
  onError: (message: unknown) => void
}) {
  const { t } = useTranslation()
  const view = useSyncExternalStore(runtime.subscribe, runtime.getView)
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 rounded-lg bg-[#edf1e8] p-1">
      {CAMERA_MODES.map((mode) => (
        <button
          key={mode}
          aria-pressed={view.camera === mode}
          onClick={() => void runtime.setCamera(mode).catch((e) => onError(e))}
          className={`rounded-lg px-3 py-2 text-[11px] transition-colors ${view.camera === mode ? 'bg-[#315a43] text-white shadow-sm' : 'text-[#718268] hover:bg-[#e3e9db]'}`}
        >
          {t(`camera.${mode}`)}
        </button>
      ))}
    </div>
  )
}
function MovementSpeedControl({ runtime }: { runtime: FarmRuntime }) {
  const { t } = useTranslation()
  const speed = useSyncExternalStore(
    runtime.subscribeMovementSpeed,
    runtime.getMovementSpeed
  )
  return (
    <label
      className="flex flex-wrap items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs text-[#527048]"
      title={t('camera.speedHint')}
    >
      {t('camera.speed')}
      <input
        type="range"
        aria-label={t('camera.speedLabel')}
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
  const { t } = useTranslation()
  const percent = useSyncExternalStore(runtime.subscribeZoom, runtime.getZoom)
  return (
    <div className="flex flex-wrap justify-center gap-1 rounded-lg border border-[#d9dfd2] bg-white p-1 text-xs text-[#527048]">
      <button
        onClick={runtime.fit}
        title={t('camera.fitHint')}
        className="rounded px-3 py-1.5 hover:bg-[#e3e9db]"
      >
        {t('camera.fit')} <span className="text-[#8d9985]">⌘1</span>
      </button>
      <button
        onClick={runtime.actualSize}
        title={t('camera.resetHint')}
        aria-label={t('camera.reset')}
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
  onError: (message: unknown) => void
}) {
  const { t } = useTranslation()
  const view = useSyncExternalStore(runtime.subscribe, runtime.getView)
  const handle = (promise: Promise<unknown>) => {
    void promise.catch((e) => onError(e))
  }
  return (
    <aside className="border-t border-[#dce2d5] lg:border-l lg:border-t-0">
      <div className="border-b border-[#e0e5d9] px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('layers.heading')}</h2>
          <span className="font-mono text-[10px] text-[#9ba38e]">
            {t('layers.environment')}
          </span>
        </div>
      </div>
      <div className="space-y-3.5 px-5 py-4">
        {(Object.keys(view.layers) as LayerId[])
          .filter((key): key is Exclude<LayerId, 'base'> => key !== 'base')
          .map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-2 text-xs"
            >
              <span>{t(`layer.${key}`)}</span>
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
            {t('layers.opacity')}
            <span className="font-mono">
              {Math.round(view.filmOpacity * 100)}%
            </span>
          </span>
          <input
            aria-label={t('layers.opacity')}
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
    </aside>
  )
}
export function CrossSection() {
  const { t } = useTranslation()
  const config = useFarmConfiguration()
  const site = configurationSite(config)
  const strips = createLayout(site, config.strips).strips.filter(
    (strip) => strip.bay === 0
  )
  const sectionDepth = Math.max(
    0.15,
    ...config.strips
      .filter((strip) => strip.kind === 'drain')
      .map((strip) => createDrainProfile(strip.width).depth)
  )
  return (
    <section className="rounded-2xl border border-[#dde3d8] bg-[#fafbf7] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{t('section.heading')}</h2>
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
        aria-label={t('section.accessible')}
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
                    fill="#c6b497"
                  />
                  <path
                    d={`${curve} L${strip.x + strip.width},0 Z`}
                    fill="#fafbf7"
                  />
                  <path
                    d={curve}
                    fill="none"
                    stroke="#8d785c"
                    strokeWidth="0.008"
                  />
                  <path
                    d={`${profile.waterPoints.map(([x, y], index) => `${index ? 'L' : 'M'}${strip.x + x},${-y}`).join(' ')} Z`}
                    fill="#8ab3b4"
                  />
                  <line
                    x1={strip.x + profile.lipRadius}
                    x2={strip.x + strip.width - profile.lipRadius}
                    y1={-profile.waterLevel}
                    y2={-profile.waterLevel}
                    stroke="#4f9299"
                    strokeWidth="0.012"
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
          {t('section.soil', {
            width: config.strips
              .filter((strip) => strip.kind === 'soil')
              .reduce((sum, strip) => sum + strip.width, 0)
              .toFixed(2)
          })}
        </span>
        <span className="text-[#668b8a]">
          {t('section.drains', {
            count: config.strips.filter((strip) => strip.kind === 'drain')
              .length
          })}
        </span>
        <span>{t('section.margin', { width: site.margin.toFixed(2) })}</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#8a9480]">
        {t('section.description', { width: (site.margin * 2).toFixed(2) })}
      </p>
    </section>
  )
}

function PlantingSummary() {
  const { t } = useTranslation()
  const config = useFarmConfiguration()
  const site = configurationSite(config)
  return (
    <>
      {t('references.plantingDetails', {
        height: (site.eave + config.topExtension).toFixed(2),
        top: config.netTop,
        bottom: config.netBottom
      })}
    </>
  )
}

function ReferenceLibrary() {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-lg border border-[#d9dfd2] px-3 py-2 text-xs hover:bg-[#edf1e8]"
      >
        {t('references.heading')}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="reference-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            dialog.current?.close()
          }
        }}
        className="fixed inset-0 m-auto max-h-[80vh] w-[min(32rem,calc(100%-2rem))] overflow-auto rounded-xl border border-[#d9dfd2] bg-[#fafbf7] p-5 text-[#22382f] shadow-xl backdrop:bg-black/30"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="reference-title" className="text-sm font-semibold">
            {t('references.heading')}
          </h2>
          <button
            type="button"
            aria-label={t('references.close')}
            onClick={() => dialog.current?.close()}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#edf1e8]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 5L19 19M19 5L5 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <a
          href="https://book.tndais.gov.tw/Brochure/tech171.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-[#d9dfd2] p-3 text-sm hover:bg-[#edf1e8]"
        >
          {t('references.journal')}
        </a>
        <details className="mt-4 text-xs text-[#50664f]">
          <summary className="py-2 font-medium">
            {t('references.planting')}
          </summary>
          <p className="leading-relaxed">
            <PlantingSummary />
          </p>
        </details>
        <details className="mt-4 text-xs text-[#50664f]">
          <summary className="py-2 font-medium">
            {t('references.dimensions')}
          </summary>
          <p className="mt-3 leading-relaxed">
            {t('references.dimensionsDetails')}
          </p>
          <p className="mt-2 leading-relaxed">{t('references.limits')}</p>
        </details>
      </dialog>
    </>
  )
}
