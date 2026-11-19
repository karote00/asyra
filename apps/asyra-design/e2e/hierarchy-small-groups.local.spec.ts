import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { createTestDocumentURL, waitForAppReady } from './test-utils'
import {
  installRenderStateObserver,
  type StateObservation
} from './render-state-observer'

type Phase = 'redraw' | 'pan' | 'translate' | 'reparent'
interface Sample {
  mutationMs: number
  renderMs: number
  completedMs: number
}
interface Work {
  draws: number
  uniformMatrices: number
  bufferUploads: number
  submission: StateObservation | null
}
interface GpuSamples {
  elapsedMs: number[]
  available: boolean
  disjoint: boolean
  timedOut: number
}
interface BenchmarkState {
  metadata: Record<string, unknown>
  restore(): void
  setPolicy(isolated: boolean): void
  run(phase: Phase, warmup: number, count: number): Promise<Sample[]>
  gpu(phase: Phase, count: number): Promise<GpuSamples>
  work(phase: Phase): Work
  pose(): void
  verify(): {
    policyIntact: boolean
    handlesPreserved: boolean
    maxWorldDelta: number
    orderPreserved: boolean
  }
}

const cases = [
  ...[20, 200, 1000].flatMap((groups) =>
    ['rect', 'vector'].map((primitive) => ({ groups, primitive }))
  ),
  { groups: 4, primitive: 'recorded' }
]

for (const { groups, primitive } of cases) {
  const title =
    primitive === 'recorded'
      ? 'measures recorded 101 - four roots and 25491 descendants'
      : `measures ${groups} Groups with ${4000 / groups} ${primitive} children each`

  test(title, async ({ page, browser }, testInfo) => {
    test.setTimeout(300_000)
    const attributionOnly = process.env.RENDER_STATE_ATTRIBUTION === '1'

    if (attributionOnly) {
      await page.addInitScript(installRenderStateObserver)
    }

    if (primitive === 'recorded') {
      await page.route('**/recorded-hierarchy-fixture.json', (route) =>
        route.fulfill({
          contentType: 'application/gzip',
          body: readFileSync(
            new URL(
              '../test-data/ai-drawing/fixtures/hierarchy-20261110.json.gz',
              import.meta.url
            )
          )
        })
      )
    }

    const batchModulePending = page.waitForResponse(
      /\/mesh-material-batch\.(?:ts|js)(?:\?.*)?$/
    )

    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
    const batchModule = await batchModulePending
    const servedBatchSource = await batchModule.text()

    expect(servedBatchSource).toContain(
      'this.ordinaryShader = createOrdinaryBatchShader(this.maxTextures)'
    )
    const metadata = await page.evaluate(
      async ({ groups, primitive, rootIds }) => {
        const { core, getActiveCollaborationHandle, testRuntimeState } =
          await import('../src/testing/runtime-access')
        const { transactionApis, hierarchyApis, viewportApis } =
          await import('../src/common-apis')

        await getActiveCollaborationHandle()?.dispose()
        const { createGroupRenderPolicyProbe, createBenchmarkVectorData } =
          await import('../e2e/group-render-policy-probe')
        const policy = createGroupRenderPolicyProbe()
        const vectorData = await createBenchmarkVectorData()

        const recordedLeaves: string[] = []
        const recordedGroups: string[] = []

        if (primitive === 'recorded') {
          const response = await fetch('/recorded-hierarchy-fixture.json')

          if (!response.body) {
            throw new Error('Missing recorded fixture stream')
          }

          const document = await new Response(
            response.body.pipeThrough(new DecompressionStream('gzip'))
          ).json()

          core.load(document)
          Object.entries(document.sceneTree.elements).forEach(([id, value]) => {
            const type = (value as { type: string }).type

            if (type === 'group') {
              recordedGroups.push(id)
            } else if (type !== 'workspace') {
              recordedLeaves.push(id)
            }
          })
        }

        const workspace = core.getCurrentWorkspaceId()
        const groupIds: string[] = []
        const leafIds: string[] = []
        const perGroup = 4000 / groups
        let source = ''
        let target = ''

        transactionApis.runTransaction(() => {
          if (primitive === 'recorded') {
            groupIds.push(...rootIds)
            source = core.getElementMetadata(rootIds[0])?.parentId ?? ''
            leafIds.push(...recordedLeaves)
            target = core.createElementInParent(
              { type: 'group', x: 0, y: 0, width: 0, height: 0 },
              workspace
            )

            return
          }

          source = core.createElementInParent(
            { type: 'group', x: 0, y: 0, width: 638, height: 398 },
            workspace
          )
          target = core.createElementInParent(
            { type: 'group', x: 0, y: 0, width: 0, height: 0 },
            workspace
          )
          for (let index = 0; index < groups; index++) {
            const points = Array.from({ length: perGroup }, (_, child) => {
              const ordinal = index * perGroup + child

              return { x: (ordinal % 80) * 8, y: Math.floor(ordinal / 80) * 8 }
            })
            const minX = Math.min(...points.map((point) => point.x))
            const minY = Math.min(...points.map((point) => point.y))
            const width = Math.max(...points.map((point) => point.x)) + 6 - minX
            const height =
              Math.max(...points.map((point) => point.y)) + 6 - minY
            const id = core.createElementInParent(
              { type: 'group', x: minX, y: minY, width, height },
              source
            )

            groupIds.push(id)
            leafIds.push(
              ...core.createElementsInParent(
                points.map((point) =>
                  primitive === 'vector'
                    ? vectorData(point.x, point.y, minX, minY)
                    : {
                        type: 'rect',
                        x: point.x - minX,
                        y: point.y - minY,
                        width: 6,
                        height: 6
                      }
                ),
                id
              )
            )
          }
        })
        core.selectElements([], { undoable: false })
        viewportApis.zoomToCenter(1, 0, 0)
        viewportApis.panTo(300, 100)
        if (primitive === 'recorded') {
          viewportApis.zoomFit()
        }

        const camera = {
          position: viewportApis.getPosition(),
          scale: viewportApis.getScale()
        }
        const originalOrder = core.getElementChildren(
          source,
          0,
          100_000
        ).elementIds
        const rootPositions = groupIds.slice(0, 4).map((id) => ({
          elementId: id,
          x: Number(core.getElementComputedData(id, ['x'])?.x)
        }))
        const render = core.deps.render

        render.flushFrame()
        const canvas = render.app?.canvas

        if (!canvas) {
          throw new Error('Missing active canvas')
        }

        const gl = canvas.getContext('webgl2')

        if (!(gl instanceof WebGL2RenderingContext)) {
          throw new Error('This benchmark requires the active WebGL2 renderer')
        }

        const debug = gl.getExtension('WEBGL_debug_renderer_info')
        const groupNodeIds =
          primitive === 'recorded'
            ? [...recordedGroups, target]
            : [source, target, ...groupIds]
        const groupNodes = groupNodeIds.map((id) => {
          const node = render.getElementById(id)

          if (!node) {
            throw new Error('Missing benchmark Group')
          }

          return node
        })
        const leaves = leafIds.map((id) => {
          const node = render.getElementById(id)

          if (!node) {
            throw new Error('Missing benchmark child')
          }

          return node
        })
        const initialHandles = leaves.map((node) => node.getEngineHandle())

        const matrix = (node: (typeof leaves)[number]) => {
          const value = node.worldTransform

          return [value.a, value.b, value.c, value.d, value.tx, value.ty]
        }

        const initialMatrices = leaves.map(matrix)
        let isolated = true
        let moved = false
        let panned = false
        let translated = false

        const mutate = (phase: Phase) => {
          if (phase === 'pan') {
            panned = !panned
            viewportApis.panTo(
              camera.position.x + (panned ? 2 : 0),
              camera.position.y
            )
          } else if (phase === 'translate') {
            translated = !translated
            transactionApis.runTransaction(() => {
              core.updateElementProperties(
                rootPositions.map(({ elementId, x }) => ({
                  elementId,
                  values: { x: x + (translated ? 2 / camera.scale : 0) }
                }))
              )
            })
          } else if (phase === 'reparent') {
            hierarchyApis.moveElements({
              elementIds: groupIds.slice(0, 4),
              targetParentId: moved ? source : target,
              targetIndex: 0
            })
            moved = !moved
          }
        }

        const frame = (phase: Phase): Sample => {
          // Drain prior GPU work outside the measured interval. No draw counters
          // are installed during timings; finish is a completion barrier, not a GPU timer.
          gl.finish()
          const started = performance.now()

          mutate(phase)
          const mutated = performance.now()

          render.requestRender()
          render.flushFrame()
          const rendered = performance.now()

          gl.finish()

          return {
            mutationMs: mutated - started,
            renderMs: rendered - mutated,
            completedMs: performance.now() - started
          }
        }

        const metadata = {
          groups,
          primitive,
          perGroup: primitive === 'recorded' ? null : perGroup,
          movedLeaves: primitive === 'recorded' ? 25491 : perGroup * 4,
          leaves: leafIds.length,
          movedGroups: 4,
          camera,
          viewport: {
            width: innerWidth,
            height: innerHeight,
            dpr: devicePixelRatio
          },
          canvas: { width: canvas.width, height: canvas.height },
          renderer: debug
            ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER),
          vendor: debug
            ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
            : gl.getParameter(gl.VENDOR),
          version: gl.getParameter(gl.VERSION),
          timerQueryAvailable: Boolean(
            gl.getExtension('EXT_disjoint_timer_query_webgl2')
          ),
          userAgent: navigator.userAgent,
          baselineStrategy: policy.baselineSource,
          candidateStrategy: policy.candidateSource,
          crossOriginIsolated
        }
        const state: BenchmarkState = {
          metadata,

          pose() {
            frame('translate')
          },

          restore() {
            policy.restore()
            groupNodes.forEach((node) => {
              node.transformGroup = true
            })
          },

          async gpu(phase, count) {
            const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2')
            const result: GpuSamples = {
              elapsedMs: [],
              available: Boolean(ext),
              disjoint: false,
              timedOut: 0
            }

            if (!ext) {
              return result
            }

            for (let i = 0; i < count; i++) {
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve())
              )
              gl.finish()
              mutate(phase)
              const query = gl.createQuery()

              if (!query) {
                throw new Error('GPU timer query allocation failed')
              }

              gl.beginQuery(ext.TIME_ELAPSED_EXT, query)
              render.requestRender()
              render.flushFrame()
              gl.endQuery(ext.TIME_ELAPSED_EXT)
              gl.flush()
              let settled = false

              for (let poll = 0; poll < 120; poll++) {
                await new Promise<void>((resolve) =>
                  requestAnimationFrame(() => resolve())
                )
                if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
                  result.disjoint = true
                  settled = true
                  break
                }

                if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
                  result.elapsedMs.push(
                    gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6
                  )
                  settled = true
                  break
                }
              }

              if (!settled) {
                result.timedOut++
              }

              gl.deleteQuery(query)
            }

            return result
          },

          setPolicy(value) {
            if (moved || panned || translated) {
              throw new Error('Prior phase did not return to the baseline')
            }

            isolated = value
            policy.select(value)
            groupNodes.forEach((node) => {
              node.transformGroup = value
            })
            render.requestRender()
            render.flushFrame()
            gl.finish()
          },

          async run(phase, warmup, count) {
            const samples: Sample[] = []

            for (let index = 0; index < warmup + count; index++) {
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve())
              )
              const sample = frame(phase)

              if (index >= warmup) {
                samples.push(sample)
              }
            }

            return samples
          },

          work(phase) {
            const work = { draws: 0, uniformMatrices: 0, bufferUploads: 0 }
            const names = [
              'drawArrays',
              'drawElements',
              'drawArraysInstanced',
              'drawElementsInstanced',
              'uniformMatrix3fv',
              'bufferData',
              'bufferSubData'
            ] as const
            const restore: (() => void)[] = []
            let submission: StateObservation | null = null

            try {
              for (const name of names) {
                const descriptor = Object.getOwnPropertyDescriptor(gl, name)
                const original = Reflect.get(gl, name)

                if (typeof original !== 'function') {
                  throw new Error(`Missing WebGL entry point ${name}`)
                }

                Object.defineProperty(gl, name, {
                  configurable: true,

                  value: (...args: unknown[]) => {
                    if (name === 'uniformMatrix3fv') {
                      work.uniformMatrices++
                    } else if (
                      name === 'bufferData' ||
                      name === 'bufferSubData'
                    ) {
                      work.bufferUploads++
                    } else {
                      work.draws++
                    }

                    return Reflect.apply(original, gl, args)
                  }
                })
                restore.push(() => {
                  if (descriptor) {
                    Object.defineProperty(gl, name, descriptor)
                  } else {
                    Reflect.deleteProperty(gl, name)
                  }
                })
              }

              const run = () => {
                frame(phase)
                frame(phase)
              }

              if (window.renderStateObserver) {
                submission = window.renderStateObserver.observe(gl, run)
              } else {
                run()
              }
            } finally {
              restore.reverse().forEach((reset) => reset())
            }

            return {
              draws: work.draws / 2,
              uniformMatrices: work.uniformMatrices / 2,
              bufferUploads: work.bufferUploads / 2,
              submission
            }
          },

          verify() {
            let maxWorldDelta = 0

            leaves.forEach((node, index) =>
              matrix(node).forEach((value, axis) => {
                maxWorldDelta = Math.max(
                  maxWorldDelta,
                  Math.abs(value - initialMatrices[index][axis])
                )
              })
            )
            const order = core.getElementChildren(source, 0, 100_000).elementIds

            return {
              policyIntact: groupNodes.every(
                (node) => node.transformGroup === isolated
              ),
              handlesPreserved: leaves.every(
                (node, index) =>
                  node.getEngineHandle() === initialHandles[index]
              ),
              maxWorldDelta,
              orderPreserved:
                !moved &&
                !panned &&
                !translated &&
                JSON.stringify(order) === JSON.stringify(originalOrder)
            }
          }
        }

        testRuntimeState.set('small-group-benchmark', state)

        return metadata
      },
      {
        groups,
        primitive,
        rootIds: JSON.parse(
          readFileSync(
            new URL(
              '../test-data/ai-drawing/fixtures/hierarchy-20261110.json',
              import.meta.url
            ),
            'utf8'
          )
        ).groupElementIds as string[]
      }
    )

    // Disposal may publish a transient offline toast. Let it finish naturally
    // before timing or comparing complete viewport pixels across policies.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    await expect(page.getByLabel('Status notifications')).toBeHidden({
      timeout: 15_000
    })

    const source = {
      head: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8'
      }).trim(),
      fixture:
        primitive === 'recorded'
          ? createHash('sha256')
              .update(
                readFileSync(
                  new URL(
                    '../test-data/ai-drawing/fixtures/hierarchy-20261110.json.gz',
                    import.meta.url
                  )
                )
              )
              .digest('hex')
          : null,
      benchmark: createHash('sha256')
        .update(
          readFileSync(
            new URL('./hierarchy-small-groups.local.spec.ts', import.meta.url)
          )
        )
        .digest('hex'),
      productionPolicy: createHash('sha256')
        .update(
          readFileSync(
            new URL(
              '../../../packages/preset/src/components/group.ts',
              import.meta.url
            )
          )
        )
        .digest('hex'),
      attributionOnly,
      servedBatchModule: {
        url: batchModule.url(),
        sha256: createHash('sha256').update(servedBatchSource).digest('hex')
      },
      batchShader: createHash('sha256')
        .update(
          readFileSync(
            new URL(
              '../../../packages/render-engine-pixi/src/mesh-material-shader.ts',
              import.meta.url
            )
          )
        )
        .digest('hex'),
      observer: createHash('sha256')
        .update(
          readFileSync(new URL('./render-state-observer.ts', import.meta.url))
        )
        .digest('hex')
    }
    const phases: Phase[] = ['redraw', 'pan', 'translate', 'reparent']
    const blocks = []
    const pixelsByPolicy = new Map<boolean, Buffer>()

    for (const [index, isolated] of [false, true, true, false].entries()) {
      await page.evaluate(async (isolated) => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        const state = testRuntimeState.get<BenchmarkState>(
          'small-group-benchmark'
        )

        if (!state) {
          throw new Error('Missing benchmark')
        }

        state.setPolicy(isolated)
      }, isolated)
      const results = []

      for (const phase of phases) {
        const result = await page.evaluate(
          async ({ phase, attributionOnly }) => {
            const { testRuntimeState } =
              await import('../src/testing/runtime-access')
            const state = testRuntimeState.get<BenchmarkState>(
              'small-group-benchmark'
            )

            if (!state) {
              throw new Error('Missing benchmark')
            }

            const samples = await state.run(
              phase,
              attributionOnly ? 0 : 8,
              attributionOnly ? 2 : 30
            )
            const work = state.work(phase)
            const gpu = attributionOnly ? null : await state.gpu(phase, 10)

            return { phase, samples, work, gpu, verify: state.verify() }
          },
          { phase, attributionOnly }
        )

        expect(result.verify).toEqual({
          policyIntact: true,
          handlesPreserved: true,
          maxWorldDelta: 0,
          orderPreserved: true
        })
        expect(result.work.draws).toBeGreaterThan(0)
        if (attributionOnly) {
          expect(result.work.submission).not.toBeNull()
          expect(result.work.submission?.uniforms.unknown).toBeUndefined()
          expect(result.work.submission?.draws).toBe(result.work.draws * 2)
          for (const uniform of Object.values(
            result.work.submission?.uniforms ?? {}
          )) {
            expect(uniform.unknown).toBe(0)
            expect(uniform.uploads).toBe(uniform.identical + uniform.changed)
          }
        }

        results.push(result)
      }

      const screenshot = await page.locator('#viewport-anchor').screenshot({
        path: testInfo.outputPath(
          `block-${index}-${isolated ? 'isolated' : 'shared'}.png`
        )
      })
      const pixels = await sharp(screenshot).removeAlpha().raw().toBuffer()

      const baselinePixels = pixelsByPolicy.get(isolated)

      if (baselinePixels) {
        expect(pixels.equals(baselinePixels)).toBe(true)
      } else {
        pixelsByPolicy.set(isolated, pixels)
      }

      const otherPolicyPixels = pixelsByPolicy.get(!isolated)

      if (otherPolicyPixels && primitive !== 'recorded') {
        expect(pixels.equals(otherPolicyPixels)).toBe(true)
      }

      await page.evaluate(async () => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')

        const state = testRuntimeState.get<BenchmarkState>(
          'small-group-benchmark'
        )

        if (!state) {
          throw new Error('Missing benchmark')
        }

        state.pose()
      })
      const movedImage = await page.locator('#viewport-anchor').screenshot({
        path: testInfo.outputPath(`block-${index}-translated.png`)
      })
      const movedPixels = await sharp(movedImage).removeAlpha().raw().toBuffer()

      expect(movedPixels.equals(pixels)).toBe(false)
      await page.evaluate(async () => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')

        const state = testRuntimeState.get<BenchmarkState>(
          'small-group-benchmark'
        )

        if (!state) {
          throw new Error('Missing benchmark')
        }

        state.pose()
      })
      const restoredImage = await page.locator('#viewport-anchor').screenshot()

      expect(
        (await sharp(restoredImage).removeAlpha().raw().toBuffer()).equals(
          pixels
        )
      ).toBe(true)
      blocks.push({ index, isolated, results })
      writeFileSync(
        testInfo.outputPath('measurement.json'),
        JSON.stringify(
          {
            metadata: {
              ...metadata,
              source,
              browserVersion: browser.version()
            },
            blocks
          },
          null,
          2
        )
      )
      process.stdout.write(
        `Measured ${groups} ${primitive} Groups, block ${index + 1}/4, isolated=${isolated}\n`
      )
    }

    await page.evaluate(async () => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')

      testRuntimeState.get<BenchmarkState>('small-group-benchmark')?.restore()
    })
    expect(blocks).toHaveLength(4)
  })
}
