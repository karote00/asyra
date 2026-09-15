'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import {
  cameraTransform,
  createScrollDriver,
  getStoryFrame,
  layerTransform,
  storyArtwork,
  storyChapters,
  storyLayerIds,
  type StoryFrame
} from '../lib/spatial-story.mjs'

import { buildingExample, getBuildingGeometry } from '../lib/story-building.mjs'

const artworkRoot = '/illustrations/spatial-story/'

function Illustration({ name }: { name: string }) {
  const art = storyArtwork[name]
  return (
    <img
      src={`${artworkRoot}${art.src}`}
      width={art.width}
      height={art.height}
      alt=""
      draggable={false}
      loading="eager"
      className="block h-full w-full object-contain"
    />
  )
}

function DrawingOutput({ frame }: { frame: StoryFrame }) {
  const geometry = getBuildingGeometry(frame.effects.house, frame.effects.tower)
  return (
    <svg
      data-drawing-output
      data-building-height={geometry.height}
      viewBox="0 0 320 300"
      className="h-full w-full"
      aria-hidden="true"
    >
      <polygon
        points="45,238 167,289 283,245 159,194"
        fill="#254c40"
        opacity=".08"
      />
      <polygon
        points="57,228 171,274 269,237 155,192"
        fill="#d7ddc7"
        stroke="#849b7d"
        strokeWidth=".6"
      />
      <polygon points="57,228 171,274 171,280 57,234" fill="#bac6ac" />
      <polygon points="171,274 269,237 269,243 171,280" fill="#96ad92" />
      <g data-building-plan fill="none" stroke="#527866" strokeWidth=".8">
        <polygon points="150,199 228.2,233.96 170.4,259.8 92.2,224.84" />
        <path
          d="M 121.1 211.92 L 199.3 246.88 M 185.7 214.96 L 127.9 240.8"
          strokeDasharray="3 3"
        />
        <path
          d="M 81 234 L 157 265 M 88 230 L 81 238 M 160 262 L 154 270"
          opacity=".55"
        />
      </g>
      <g strokeWidth=".75" strokeLinejoin="round">
        {geometry.parts.map((part) => (
          <polygon
            key={part.id}
            data-building-part={part.id}
            points={part.points}
            fill={part.fill}
            stroke={part.stroke}
            opacity={part.opacity}
          />
        ))}
      </g>
      <g stroke="#385d48" strokeWidth=".65">
        <path d="M 237 243 L 237 226 M 72 228 L 72 213" />
        <ellipse cx="237" cy="223" rx="8" ry="11" fill="#8aa270" />
        <ellipse cx="72" cy="210" rx="7" ry="10" fill="#a4b986" />
        <path d="M 237 229 L 237 219 M 72 215 L 72 207" fill="none" />
      </g>
    </svg>
  )
}

function Notebook({ frame }: { frame: StoryFrame }) {
  return (
    <div className="relative h-[370px] w-[500px] rounded-[5px] border border-[#34574a]/40 bg-[#fbf8ee] text-[#183f35] shadow-[0_15px_50px_#183f3520]">
      <div className="absolute inset-x-0 top-0 flex h-11 items-center justify-between border-b border-[#183f35]/15 px-6 text-xs">
        <span className="font-serif text-lg">Your composition</span>
        <span className="text-[12px] uppercase tracking-[.15em]">
          An idea, made visible
        </span>
      </div>
      <div
        className="absolute left-0 top-11 h-[275px] w-[310px]"
        data-scene-ink
        style={{
          filter: `grayscale(${1 - frame.effects.ink})`,
          opacity: 0.5 + frame.effects.ink * 0.5
        }}
      >
        <DrawingOutput frame={frame} />
      </div>
      <div className="absolute left-[322px] right-5 top-[86px]">
        <span className="text-[12px] uppercase tracking-[.15em] opacity-50">
          Site 001
        </span>
        <h3 className="mt-3 font-serif text-[29px] font-normal leading-[1.1]">
          One plan.
          <br />
          Room to grow.
        </h3>
        <p className="mt-4 text-[14px] leading-relaxed opacity-75">
          Same footprint.
          <br />
          Different building rule.
        </p>
        <div
          data-scene-effect="interface"
          style={{ opacity: frame.effects.interface }}
          className="mt-5 flex items-center gap-2 text-[10px]"
        >
          <span className="rounded-full border border-[#183f35]/25 px-2 py-1">
            Plan
          </span>
          <span className="rounded-full border border-[#183f35]/25 px-2 py-1">
            Site
          </span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-between border-t border-[#183f35]/15 px-6 text-[10px]">
        <span className="relative block w-44">
          <span
            data-scene-inverse="published"
            style={{ opacity: 1 - frame.effects.published }}
          >
            A plan, still an idea.
          </span>
          <span
            data-scene-effect="published"
            style={{ opacity: frame.effects.published }}
            className="absolute left-0 top-0 font-medium"
          >
            ✓ Building created
          </span>
        </span>
        <span className="rounded-full bg-[#183f35] px-4 py-2 text-[#f4f1e7]">
          Draw building ↗
        </span>
      </div>
      <div
        data-scene-effect="result"
        style={{ opacity: frame.effects.result }}
        className="pointer-events-none absolute -inset-[3px] rounded-[6px] border-2 border-[#8fac67]"
      />
    </div>
  )
}

function StructurePlane({ name, frame }: { name: string; frame: StoryFrame }) {
  const replacement = name === 'replacement'
  let title = 'Feature'
  let subtitle = 'App-owned behavior'
  let code = buildingExample.original
  let surface = 'bg-[#dce5ce]'
  let effect = 'feature'
  if (replacement) {
    code = buildingExample.replacement
    surface = 'bg-[#b7cda6]'
  }
  if (name === 'transaction') {
    title = 'Transaction'
    subtitle = 'One bounded change'
    code = 'begin → apply → commit'
    surface = 'bg-[#eceddf]'
    effect = 'transaction'
  }
  if (name === 'state') {
    title = 'State'
    subtitle = 'Authoritative information'
    code = 'site: { id: "001", plan: input.plan }'
    surface = 'bg-[#becdb8]'
    effect = 'state'
  }
  return (
    <div
      className={`story-depth relative h-[150px] w-[460px] rounded-[4px] border border-[#183f35]/45 ${surface} text-[#183f35]`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[4px] border border-[#183f35]/40 bg-[#8ea68d]"
        style={{ transform: 'translateZ(-9px)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[9px] w-full bg-[#718e74]"
        style={{ transformOrigin: 'bottom', transform: 'rotateX(90deg)' }}
      />
      <code className="absolute left-6 top-6 block border-l-2 border-[#183f35]/35 pl-3 text-[18px]">
        {code}
      </code>
      {name === 'state' && (
        <div className="absolute left-6 top-[54px] font-mono text-[16px]">
          <span
            data-scene-inverse="saved"
            style={{ opacity: 1 - frame.effects.saved }}
          >
            records: []
          </span>
          <span
            data-scene-effect="saved"
            style={{ opacity: frame.effects.saved }}
            className="absolute left-0 top-0 whitespace-nowrap"
          >
            records: [ site_001 ] ✓
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex h-[58px] items-center justify-between border-t border-[#183f35]/20 px-6">
        <strong className="font-serif text-[32px] font-normal">{title}</strong>
        <span className="relative text-[14px] uppercase tracking-[.1em]">
          {name === 'state' ? (
            <>
              <span
                data-scene-inverse="saved"
                style={{ opacity: 1 - frame.effects.saved }}
              >
                No building yet
              </span>
              <span
                data-scene-effect="saved"
                style={{ opacity: frame.effects.saved }}
                className="absolute right-0 top-0 whitespace-nowrap"
              >
                Same site data ✓
              </span>
            </>
          ) : (
            subtitle
          )}
        </span>
      </div>
      <div
        data-scene-effect={effect}
        style={{ opacity: frame.effects[effect] }}
        className="pointer-events-none absolute -inset-[3px] rounded-[5px] border-[3px] border-[#b88b42]"
      />
    </div>
  )
}

function ExtraView({
  history,
  frame
}: {
  history: boolean
  frame: StoryFrame
}) {
  return (
    <div className="h-[270px] w-[260px] rounded-[5px] border border-[#183f35]/30 bg-[#fbf8ee] p-6 text-[#183f35] shadow-[0_12px_35px_#183f351a]">
      <span className="text-[12px] uppercase tracking-[.16em]">
        {history ? 'One more capability' : 'Another projection'}
      </span>
      <h3 className="mt-3 font-serif text-[27px] font-normal">
        {history ? 'A history of changes.' : 'The collection.'}
      </h3>
      {history ? (
        <ol className="mt-6 list-none space-y-4 border-l border-[#183f35]/25 pl-4 text-[11px]">
          <li>House created</li>
          <li>Drawing function replaced</li>
          <li>Collection expanded</li>
        </ol>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-24 rounded border border-[#183f35]/20 bg-[#e7eddc]">
            <DrawingOutput frame={frame} />
          </div>
          <div className="flex h-24 items-center justify-center rounded border border-dashed border-[#183f35]/30 font-serif text-3xl">
            +
          </div>
        </div>
      )}
    </div>
  )
}

function StoryScene({
  chapter = 0,
  shared = false
}: {
  chapter?: number
  shared?: boolean
}) {
  let snapshot = 1
  if (shared || chapter === 0) snapshot = 0
  const frame = getStoryFrame(chapter, snapshot)
  const caption = (
    <div
      data-scene-caption
      className="absolute inset-x-6 bottom-7 flex justify-between border-t border-[#183f35]/20 pt-3 text-[12px] leading-relaxed tracking-[.025em] text-[#34574a] lg:inset-x-10"
    >
      <span>One illustrative composition</span>
      <span>Powered by Asyra</span>
    </div>
  )
  if (!shared && chapter === 0) {
    return (
      <div
        data-scene-viewport
        data-static-illustration
        role="img"
        aria-label="A person sketches an idea before choosing its software foundation."
      >
        <Illustration name="thinker" />
        {caption}
      </div>
    )
  }
  return (
    <div className="relative h-full">
      <div
        data-scene-viewport
        data-shared-scene={shared || undefined}
        data-focused-snapshot={
          (!shared && chapter > 0 && chapter < 4) || undefined
        }
        className="relative h-full min-h-[370px] w-full overflow-hidden"
        role="img"
        aria-label="A flat plan rises into a two-storey house. Replacing drawHouse with drawTower grows the same footprint into an eight-storey building. The site, transaction and surrounding composition remain in place."
      >
        <div
          className="absolute inset-[8%] rounded-[50%] bg-[#dce7cf] blur-[45px]"
          data-scene-effect="backdrop"
          style={{ opacity: frame.effects.backdrop * 0.65 }}
        />
        <div
          className="story-depth absolute left-1/2 top-[48%]"
          style={{ transform: 'scale(var(--scene-scale, .75))' }}
        >
          <div
            data-scene-camera
            className="story-depth"
            style={{ transform: cameraTransform(frame.camera) }}
          >
            {storyLayerIds.map((id) => (
              <div
                key={id}
                data-story-layer={id}
                className="story-depth absolute left-0 top-0"
                style={{
                  transformOrigin: '0 0',
                  transform: layerTransform(frame.layers[id]),
                  opacity: frame.layers[id][7],
                  pointerEvents: frame.layers[id][7] > 0.01 ? 'auto' : 'none'
                }}
              >
                {(id === 'thinker' || id === 'gallery') && (
                  <div
                    style={{
                      width: storyArtwork[id].width,
                      height: storyArtwork[id].height
                    }}
                  >
                    <Illustration name={id} />
                  </div>
                )}
                {id === 'notebook' && <Notebook frame={frame} />}
                {['feature', 'replacement', 'transaction', 'state'].includes(
                  id
                ) && <StructurePlane name={id} frame={frame} />}
                {id === 'signal' && (
                  <div className="h-[22px] w-[22px] rounded-full border-4 border-[#fff5ce] bg-[#b88b42] shadow-[0_0_25px_#b88b4280]" />
                )}
                {id === 'history' && <ExtraView history frame={frame} />}
                {id === 'collection' && (
                  <ExtraView history={false} frame={frame} />
                )}
              </div>
            ))}
          </div>
        </div>
        {shared && caption}
      </div>
      {!shared && caption}
    </div>
  )
}

function StoryChapter({ index }: { index: number }) {
  const chapter = storyChapters[index]
  const Heading = index === 0 ? 'h1' : 'h2'
  return (
    <section
      id={chapter.id}
      data-story-chapter={index}
      aria-labelledby={`title-${chapter.id}`}
      style={
        {
          '--chapter-length': chapter.length,
          '--chapter-tail': index === 5 ? 'calc(100svh - 80px)' : '0px'
        } as React.CSSProperties
      }
      className="relative px-6 py-16 lg:px-0 lg:py-0 lg:group-data-[motion=on]:min-h-[calc(var(--chapter-length)*100svh+var(--chapter-tail))]"
    >
      <div className="relative lg:group-data-[motion=on]:sticky lg:group-data-[motion=on]:top-[22svh] lg:group-data-[motion=on]:py-8">
        <p className="mb-7! flex items-center gap-3 text-[12px] uppercase tracking-[.16em]">
          <span className="h-px w-7 bg-current" />0{index + 1}{' '}
          <span className="opacity-80">{chapter.eyebrow}</span>
        </p>
        <Heading
          id={`title-${chapter.id}`}
          className="whitespace-pre-line font-serif text-[52px] font-normal leading-[.98] tracking-[-.045em] lg:text-[clamp(48px,4.25vw,74px)]"
        >
          {chapter.title}
        </Heading>
        <p className="mt-6! max-w-[420px] text-[16px] leading-[1.7] text-[#34574a] lg:text-[clamp(18px,1.35vw,20px)]">
          {chapter.detail}
        </p>
        <ol className="mt-8 list-none space-y-3 border-l border-[#183f35]/25 pl-4 text-[14px] leading-relaxed lg:text-[16px]">
          {chapter.steps.map((step, i) => (
            <li key={step} data-scene-step={i}>
              <span className="mr-3 opacity-70">0{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        {index === 0 && (
          <a
            href="#select"
            className="mt-8 inline-flex items-center gap-6 min-h-11 border-b border-current pb-2 text-[15px]"
          >
            Follow the idea <span>↓</span>
          </a>
        )}
        {index === 5 && (
          <a
            href="/docs/start/custom-composition"
            className="mt-8 inline-flex items-center gap-8 rounded-full bg-[#183f35] px-6 py-3 text-[15px] text-[#f4f1e7]!"
          >
            Start building <span>↗</span>
          </a>
        )}
      </div>
      <div
        data-static-scene
        className="mt-6 h-[410px] lg:group-data-[motion=on]:hidden"
      >
        <StoryScene chapter={index} />
      </div>
    </section>
  )
}

function applyFrame(
  view: HTMLElement,
  frame: StoryFrame,
  nodes: ReturnType<typeof sceneNodes>
) {
  view.dataset.chapter = String(frame.chapter)
  view.dataset.progress = frame.progress.toFixed(4)
  if (nodes.camera) nodes.camera.style.transform = cameraTransform(frame.camera)
  for (const layer of nodes.layers) {
    const pose = frame.layers[layer.dataset.storyLayer || '']
    layer.style.transform = layerTransform(pose)
    layer.style.opacity = String(pose[7])
    layer.style.pointerEvents = pose[7] > 0.01 ? 'auto' : 'none'
  }
  for (const node of nodes.effects)
    node.style.opacity = String(frame.effects[node.dataset.sceneEffect || ''])
  for (const node of nodes.inverse)
    node.style.opacity = String(
      1 - frame.effects[node.dataset.sceneInverse || '']
    )
  const building = getBuildingGeometry(frame.effects.house, frame.effects.tower)
  for (const drawing of nodes.drawings) {
    drawing.root.dataset.buildingHeight = String(building.height)
    for (let i = 0; i < building.parts.length; i++) {
      drawing.parts[i].setAttribute('points', building.parts[i].points)
      drawing.parts[i].setAttribute(
        'opacity',
        String(building.parts[i].opacity)
      )
    }
  }
  if (nodes.ink) {
    nodes.ink.style.filter = `grayscale(${1 - frame.effects.ink})`
    nodes.ink.style.opacity = String(0.5 + frame.effects.ink * 0.5)
  }
}
function sceneNodes(view: HTMLElement) {
  return {
    drawings: [
      ...view.querySelectorAll<SVGSVGElement>('[data-drawing-output]')
    ].map((root) => ({
      root,
      parts: [
        ...root.querySelectorAll<SVGPolygonElement>('[data-building-part]')
      ]
    })),
    camera: view.querySelector<HTMLElement>('[data-scene-camera]'),
    layers: [...view.querySelectorAll<HTMLElement>('[data-story-layer]')],
    effects: [...view.querySelectorAll<HTMLElement>('[data-scene-effect]')],
    inverse: [...view.querySelectorAll<HTMLElement>('[data-scene-inverse]')],
    ink: view.querySelector<HTMLElement>('[data-scene-ink]')
  }
}

export function SpatialStory({
  children,
  footer
}: {
  children?: ReactNode
  footer?: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const view = root.querySelector<HTMLElement>('[data-shared-scene]')
    if (!view) return
    const nodes = sceneNodes(view)
    const sections = [
      ...root.querySelectorAll<HTMLElement>('[data-story-chapter]')
    ]
    const links = [...root.querySelectorAll<HTMLElement>('[data-chapter-link]')]
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let measurements: { top: number; height: number }[] = []
    let animated = false
    let active = -1
    const driver = createScrollDriver({
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (id) => window.cancelAnimationFrame(id),
      render: (frame) => {
        applyFrame(view, frame, nodes)
        if (frame.chapter !== active) {
          active = frame.chapter
          links.forEach((link, i) => {
            if (i === active) link.setAttribute('aria-current', 'step')
            else link.removeAttribute('aria-current')
          })
        }
      }
    })
    const scroll = () => {
      if (!animated || !measurements.length) return
      const y = window.scrollY
      let chapter = 0
      while (chapter < 5 && y >= measurements[chapter + 1].top) chapter++
      driver.update(
        chapter,
        (y - measurements[chapter].top) / measurements[chapter].height
      )
    }
    const measure = () => {
      animated =
        !media.matches && window.innerWidth >= 1024 && window.innerHeight >= 760
      root.dataset.motion = animated ? 'on' : 'off'
      measurements = sections.map((section) => ({
        top: section.getBoundingClientRect().top + window.scrollY - 80,
        height:
          section.offsetHeight -
          (animated && section === sections[5] ? window.innerHeight - 80 : 0)
      }))
      for (const viewport of root.querySelectorAll<HTMLElement>(
        '[data-scene-viewport]'
      )) {
        if (viewport.clientWidth)
          viewport.style.setProperty(
            '--scene-scale',
            String(
              Math.min(
                viewport.clientWidth /
                  (viewport.dataset.focusedSnapshot ? 650 : 1000),
                viewport.clientHeight / 800
              )
            )
          )
      }
      scroll()
    }
    measure()
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', measure)
    media.addEventListener('change', measure)
    return () => {
      driver.dispose()
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('resize', measure)
      media.removeEventListener('change', measure)
    }
  }, [])
  return (
    <div
      ref={rootRef}
      id="top"
      className="spatial-story-shell group"
      data-motion="off"
    >
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-[#183f35]/15 bg-[#f4f1e7]/95 px-6 backdrop-blur-sm lg:px-[4vw]">
        <a
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center font-serif text-[24px] tracking-[-.05em] sm:text-[34px]"
          aria-label="Asyra home"
        >
          ASYRA
        </a>
        <nav
          aria-label="Story chapters"
          className="hidden items-center gap-4 text-[14px] xl:flex"
        >
          {storyChapters.map((chapter, i) => (
            <a
              key={chapter.id}
              data-chapter-link={i}
              href={`#${chapter.id}`}
              className="inline-flex min-h-11 items-center border-b border-transparent py-2 opacity-75 aria-[current=step]:border-current aria-[current=step]:opacity-100"
            >
              {
                [
                  'Idea',
                  'Foundation',
                  'Action',
                  'Adapt',
                  'Grow',
                  'Possibilities'
                ][i]
              }
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[14px]">
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-5 lg:flex"
          >
            <a className="inline-flex min-h-11 items-center" href="/docs">
              Docs
            </a>
            <a className="inline-flex min-h-11 items-center" href="/atlas">
              Runtime Atlas
            </a>
            <a
              className="inline-flex min-h-11 items-center"
              href="https://github.com/karote00/asyra"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </nav>
          <a
            className="inline-flex min-h-11 items-center font-medium"
            data-site-cta=""
            href="/docs/start/custom-composition"
          >
            Start building ↗
          </a>
          <details className="relative lg:hidden">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded border border-[#183f35]/25 px-3 py-2">
              Menu
            </summary>
            <nav
              aria-label="Primary navigation"
              className="absolute right-0 top-full mt-3 grid min-w-56 gap-1 rounded-lg border border-[#183f35]/20 bg-[#f4f1e7] p-4 text-base shadow-xl [&_a]:flex [&_a]:min-h-11 [&_a]:items-center"
            >
              <a href="/docs">Docs</a>
              <a href="/atlas">Runtime Atlas</a>
              <a href="/asyra-design">Asyra Design</a>
              <a href="/releases">Releases</a>
              <a href="/roadmap">Roadmap</a>
              <a
                href="https://github.com/karote00/asyra"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
            </nav>
          </details>
        </div>
      </header>
      <main className="pt-20">
        <div
          data-story-track
          className="relative lg:group-data-[motion=on]:grid lg:group-data-[motion=on]:grid-cols-[.36fr_.64fr] lg:group-data-[motion=on]:pl-[5vw]"
        >
          <div className="relative z-10 lg:col-start-1 lg:row-start-1 lg:group-data-[motion=off]:mx-auto lg:group-data-[motion=off]:max-w-[900px]">
            {storyChapters.map((chapter, index) => (
              <StoryChapter key={chapter.id} index={index} />
            ))}
          </div>
          <div className="hidden h-[calc(100svh-80px)] lg:group-data-[motion=on]:sticky lg:group-data-[motion=on]:top-20 lg:group-data-[motion=on]:col-start-2 lg:group-data-[motion=on]:row-start-1 lg:group-data-[motion=on]:block">
            <StoryScene shared />
          </div>
        </div>
        {children}
        <section
          aria-label="Start your next product"
          className="relative z-20 bg-[#183f35] px-6 py-20 text-[#f4f1e7] lg:px-[8vw]"
        >
          <div className="mx-auto">
            <p className="max-w-[900px] font-serif text-[40px] leading-tight lg:text-[64px]">
              The foundation is shared.
              <br />
              What comes next is yours.
            </p>
            <a
              href="/docs/start/custom-composition"
              className="mt-8 inline-flex items-center gap-12 border-b border-current pb-3 text-sm"
            >
              Explore the framework <span>↗</span>
            </a>
          </div>
        </section>
      </main>
      {footer}
    </div>
  )
}
