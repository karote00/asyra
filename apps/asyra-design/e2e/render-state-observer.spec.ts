import { expect, test } from '@playwright/test'
import { installRenderStateObserver } from './render-state-observer'

test('observes actual program state and forwards changed and repeated matrices', async ({
  page
}) => {
  await page.addInitScript(installRenderStateObserver)
  await page.goto('about:blank')
  const result = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')

    if (!gl) {
      throw new Error('WebGL2 required for state observation')
    }

    const createProgram = () => {
      const program = gl.createProgram()
      const vertex = gl.createShader(gl.VERTEX_SHADER)
      const fragment = gl.createShader(gl.FRAGMENT_SHADER)

      if (!program || !vertex || !fragment) {
        throw new Error('Shader resources unavailable')
      }

      gl.shaderSource(
        vertex,
        '#version 300 es\nin vec2 point; uniform mat3 matrix; void main(){gl_Position=vec4((matrix*vec3(point,1.)).xy,0.,1.);}'
      )
      gl.shaderSource(
        fragment,
        '#version 300 es\nprecision highp float; out vec4 color; void main(){color=vec4(1.);}'
      )
      gl.compileShader(vertex)
      gl.compileShader(fragment)
      gl.attachShader(program, vertex)
      gl.attachShader(program, fragment)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'Program failed')
      }

      gl.deleteShader(vertex)
      gl.deleteShader(fragment)

      return program
    }

    const first = createProgram()
    const second = createProgram()
    const firstLocation = gl.getUniformLocation(first, 'matrix')
    const secondLocation = gl.getUniformLocation(second, 'matrix')

    if (!firstLocation || !secondLocation) {
      throw new Error('Active matrix locations unavailable')
    }

    const identity = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
    const native = gl.uniformMatrix3fv
    const observation = window.renderStateObserver.observe(gl, () => {
      gl.useProgram(first)
      gl.uniformMatrix3fv(firstLocation, false, identity)
      gl.uniformMatrix3fv(firstLocation, false, identity)
      identity[6] = 5
      gl.uniformMatrix3fv(firstLocation, false, identity)
      gl.useProgram(second)
      gl.uniformMatrix3fv(secondLocation, false, identity)
      gl.useProgram(first)
      gl.uniformMatrix3fv(firstLocation, false, identity)
      identity[6] = 0
      gl.uniformMatrix3fv(firstLocation, false, identity)
    })
    const final = Array.from(
      gl.getUniform(first, firstLocation) as Float32Array
    )
    let failed = false

    try {
      window.renderStateObserver.observe(gl, () => {
        throw new Error('probe failure')
      })
    } catch {
      failed = true
    }

    const restored = gl.uniformMatrix3fv === native
    const error = gl.getError()

    gl.deleteProgram(first)
    gl.deleteProgram(second)
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    return { observation, final, restored, failed, error }
  })

  expect(result.observation.uniforms.matrix).toEqual({
    uploads: 6,
    identical: 2,
    changed: 4,
    unknown: 0
  })
  expect(result.final).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1])
  expect(result.restored).toBe(true)
  expect(result.failed).toBe(true)
  expect(result.error).toBe(0)
})
