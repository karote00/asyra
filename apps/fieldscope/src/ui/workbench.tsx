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
  overview: '透視',
  top: '俯視',
  front: '端面',
  inside: '走道內部',
  joint: '夾具近看'
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
          田巡 <span className="font-normal">FieldScope</span>
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
            <span className="font-medium text-[#305d44]">溫室工作站</span>
            <span className="hidden text-[#8d968d] sm:inline">
              採收機器人監控
            </span>
            <span className="rounded-full border border-[#dce4cf] bg-[#edf2e5] px-3 py-1 text-xs text-[#62764e]">
              場景建置階段
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
                從一座溫室，開始理解採收。
              </h1>
              <p className="mt-2 text-sm text-[#818b7d]">
                四連棟塑膠布溫室的空間原型，為未來每一次採收建立共同座標。
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
                  接下來，讓田區成為可測試的環境
                </h2>
                <span className="text-[10px] tracking-widest text-[#8c967f]">
                  ROADMAP
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <Roadmap
                  step="02"
                  title="可替換栽培"
                  text="攀藤網、竹竿、彎曲鐵架與作物行距。"
                />
                <Roadmap
                  step="03"
                  title="採收模擬"
                  text="路徑、手臂、枝葉接觸與載運穩定性。"
                />
                <Roadmap
                  step="04"
                  title="實機監控"
                  text="同步姿態、任務事件、異常與重播。"
                />
              </div>
            </section>
          </div>
          <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[11px] text-[#8b9487]">
            <span>田巡 FieldScope - 以真實尺度，建立採收的下一步。</span>
            <span>Asyra + Three.js - 公尺座標</span>
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
        label="溫室占地"
      />
      <Metric value="4" unit="棟" label="相連溫室" />
      <Metric value={config.height.toFixed(1)} unit="m" label="圓拱最高點" />
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
      runtime.zoom(event.deltaY)
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
  const previous = useRef<{ x: number; y: number; id: number } | null>(null)
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
        <span className="text-[11px] text-[#718268]">溫室工作區</span>
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
            <p className="p-5 text-xs">準備場景控制項…</p>
          )}
        </div>
      </div>
      <div className="workspace-canvas relative min-w-0 bg-[#e8ede4]">
        <div className="pointer-events-none absolute left-5 top-5 z-10">
          <div className="mb-1 text-xs font-semibold text-[#4f624b]">
            四連棟溫室
          </div>
          <div className="font-mono text-[10px] tracking-wide text-[#82917c]">
            <SceneDimensions />
          </div>
        </div>
        <div
          ref={host}
          data-testid="scene"
          aria-label="可旋轉的四連棟溫室三維場景"
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
            if (event.button !== 0) return
            event.currentTarget.setPointerCapture(event.pointerId)
            previous.current = {
              x: event.clientX,
              y: event.clientY,
              id: event.pointerId
            }
          }}
          onPointerMove={(event) => {
            const p = previous.current
            if (!p || p.id !== event.pointerId || !runtime) return
            if (event.shiftKey)
              runtime.pan(event.clientX - p.x, event.clientY - p.y)
            else runtime.orbit(event.clientX - p.x, event.clientY - p.y)
            previous.current = { ...p, x: event.clientX, y: event.clientY }
          }}
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
            正在建立溫室場景…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="absolute inset-6 flex items-center justify-center rounded-xl bg-white/90 p-6 text-sm text-red-700"
          >
            場景啟動失敗：{error}
          </div>
        )}
        {runtime && <CameraToolbar runtime={runtime} onError={setError} />}
        {runtime && <ZoomControls runtime={runtime} />}
        <div className="pointer-events-none absolute bottom-5 left-5 text-[10px] text-[#7b8873]">
          拖曳旋轉 - Shift 拖曳平移 - 滾輪縮放
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[10px] text-[#607350]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#819c4d]" />
          {runtime ? '空間模型已就緒' : '初始化中'}
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
            <p className="p-5 text-xs">準備場景設定…</p>
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
  const name = side === 'left' ? '圖層面板' : '編輯面板'
  const label = `${open ? '收合' : '展開'}${name}`
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
function ZoomControls({ runtime }: { runtime: FarmRuntime }) {
  const percent = useSyncExternalStore(runtime.subscribeZoom, runtime.getZoom)
  return (
    <div className="absolute right-4 top-28 flex gap-1 rounded-lg border border-white/80 bg-[#f9fbf4]/90 p-1 text-[11px] text-[#527048]">
      <button
        onClick={runtime.fit}
        title="適合畫面（⌘1）"
        className="rounded px-3 py-1.5 hover:bg-[#e3e9db]"
      >
        適合畫面 <span className="text-[#8d9985]">⌘1</span>
      </button>
      <button
        onClick={runtime.actualSize}
        title="恢復 100%（⌘0）"
        aria-label="恢復 100% 縮放"
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
          <h2 className="text-sm font-semibold">場景圖層</h2>
          <span className="font-mono text-[10px] text-[#9ba38e]">
            01 / ENVIRONMENT
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#87917e]">
          切換覆膜，檢視溫室內部結構。
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
            覆膜不透明度
            <span className="font-mono">
              {Math.round(view.filmOpacity * 100)}%
            </span>
          </span>
          <input
            aria-label="覆膜不透明度"
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
        <div className="text-[11px] font-semibold text-[#698052]">種植規劃</div>
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
        <summary className="font-medium">建模假設與結構參考</summary>
        <p className="mt-3 leading-relaxed">
          橫樑高度隨總高計算；拱架每 1m；立柱每 5m，尾端補齊；拱管直徑
          48mm；立柱直徑 76mm；半圓水道深度為寬度一半，槽口圓角最大 1cm；擋板高
          0.35m；端面開口依跨寬與簷高縮限，上限寬 2m、高
          2.5m。通道淨寬須扣除立柱。
        </p>
        <p className="mt-2 leading-relaxed">
          這是尺寸與構造模型，尚未進行耐風、承載或機器人通行驗證。
        </p>
        <a
          href="https://book.tndais.gov.tw/Brochure/tech171.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block underline"
        >
          南改場溫網室技術專刊 ↗
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
        <h2 className="text-sm font-semibold">每棟橫向配置</h2>
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
        aria-label="土壤與半圓水道圓角的等比例剖面"
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
          ■ 土壤{' '}
          {config.strips
            .filter((strip) => strip.kind === 'soil')
            .reduce((sum, strip) => sum + strip.width, 0)
            .toFixed(2)}
          m
        </span>
        <span className="text-[#668b8a]">
          ■ 水道{' '}
          {config.strips.filter((strip) => strip.kind === 'drain').length} 條
        </span>
        <span>兩側各留 {site.margin.toFixed(2)}m</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#8a9480]">
        連棟留白合併為 {(site.margin * 2).toFixed(2)}m
        走道；黑色硬質防水擋板只設在整體左右最外側。走道與水溝的採收用途，留待栽培配置及機器人規格共同決定。
      </p>
    </section>
  )
}

function PlantingSummary() {
  const config = useFarmConfiguration()
  const site = configurationSite(config)
  return (
    <>
      Ø20mm 栽培管，埋深 15cm、頂高{' '}
      {(site.eave + config.topExtension).toFixed(2)}m，縱向間距 60cm。15cm
      方格網由束帶固定，上緣 {config.netTop}m、下緣 {config.netBottom}
      m。尚未配置植株。
    </>
  )
}
