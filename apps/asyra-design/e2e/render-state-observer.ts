export interface UniformWork {
  uploads: number
  identical: number
  changed: number
  unknown: number
}

export interface StateObservation {
  uniforms: Record<string, UniformWork>
  programSwitches: number
  repeatedProgramBinds: number
  programs: number
  draws: number
  bufferUploads: number
}

/** Browser-only measurement. Reads GPU state and always forwards the real call.
 * Installed before shader creation to preserve exact uniform-location names.
 * No observer is active during benchmark timing or application use.
 */
export function installRenderStateObserver() {
  const names = new WeakMap<WebGLUniformLocation, string>()
  const prototypes = [
    WebGLRenderingContext.prototype,
    WebGL2RenderingContext.prototype
  ]

  for (const prototype of prototypes) {
    const original = prototype.getUniformLocation

    prototype.getUniformLocation = function (program, name) {
      const location = original.call(this, program, name)

      if (location) {
        names.set(location, name)
      }

      return location
    }
  }

  const observe = (gl: WebGL2RenderingContext, operation: () => void) => {
    const output: StateObservation = {
      uniforms: {},
      programSwitches: 0,
      repeatedProgramBinds: 0,
      programs: 0,
      draws: 0,
      bufferUploads: 0
    }
    const restore: (() => void)[] = []
    const programs = new Set<WebGLProgram>()
    const methods = [
      'uniformMatrix3fv',
      'uniformMatrix4fv',
      'useProgram',
      'drawArrays',
      'drawElements',
      'drawArraysInstanced',
      'drawElementsInstanced',
      'bufferData',
      'bufferSubData'
    ] as const

    try {
      for (const name of methods) {
        const descriptor = Object.getOwnPropertyDescriptor(gl, name)
        const original = gl[name]

        Object.defineProperty(gl, name, {
          configurable: true,

          value: (...args: unknown[]) => {
            if (name.startsWith('uniformMatrix')) {
              const location = args[0] as WebGLUniformLocation | null
              const role = location
                ? (names.get(location) ?? 'unknown')
                : 'null'
              const work = (output.uniforms[role] ??= {
                uploads: 0,
                identical: 0,
                changed: 0,
                unknown: 0
              })

              work.uploads++
              const program = gl.getParameter(gl.CURRENT_PROGRAM)

              if (program) {
                programs.add(program)
              }

              const previous =
                location && program && gl.getUniform(program, location)
              const input = args[2] as ArrayLike<number>
              const offset = Number(args[3] ?? 0)
              const length = Number(args[4] ?? 0) || input.length - offset
              const values = Array.from(input).slice(offset, offset + length)

              if (!previous || typeof previous.length !== 'number') {
                work.unknown++
              } else if (
                previous.length === values.length &&
                values.every(
                  (value, index) => previous[index] === Math.fround(value)
                )
              ) {
                work.identical++
              } else {
                work.changed++
              }
            } else if (name === 'useProgram') {
              if (gl.getParameter(gl.CURRENT_PROGRAM) === args[0]) {
                output.repeatedProgramBinds++
              } else {
                output.programSwitches++
              }
            } else if (name.startsWith('draw')) {
              output.draws++
            } else {
              output.bufferUploads++
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

      operation()
      output.programs = programs.size

      return output
    } finally {
      restore.reverse().forEach((reset) => reset())
    }
  }

  Object.assign(window, { renderStateObserver: { observe } })
}

declare global {
  interface Window {
    renderStateObserver: {
      observe(
        gl: WebGL2RenderingContext,
        operation: () => void
      ): StateObservation
    }
  }
}
