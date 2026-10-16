export class FeatureRuntimeClosedError extends Error {
  readonly code = 'FEATURE_RUNTIME_CLOSED'

  constructor() {
    super('The Feature runtime is closed or belongs to a retired generation')
    this.name = 'FeatureRuntimeClosedError'
  }
}

export class InteractionQueue {
  private tail: Promise<void> = Promise.resolve()
  private active?: { immediate: boolean; result: Promise<unknown> }
  private accepting = true
  private generation = 0
  private drained = false

  private assertOpen(generation: number): void {
    if (!this.accepting || generation !== this.generation) {
      throw new FeatureRuntimeClosedError()
    }
  }

  /** An immediate invocation occupies the existing execution boundary, never the tail. */
  createImmediateRunner(): <T>(
    operation: (assertOpen: () => void) => T | Promise<T>
  ) => Promise<T | undefined> {
    const generation = this.generation
    return (operation) => {
      try {
        this.assertOpen(generation)
        const previous = this.active
        if (previous?.immediate) return Promise.resolve(undefined)
        const invoke = () => {
          this.assertOpen(generation)
          return operation(() => this.assertOpen(generation))
        }
        return this.executeNow(
          () => (previous ? previous.result.then(invoke) : invoke()),
          true
        )
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }

  private executeNow<T>(
    operation: () => T | Promise<T>,
    immediate: boolean
  ): Promise<T> {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (error: unknown) => void
    const result = new Promise<T>((done, fail) => {
      resolve = done
      reject = fail
    })
    const entry = { immediate, result }
    this.active = entry
    const release = () => {
      if (this.active === entry) this.active = undefined
    }
    try {
      Promise.resolve(operation()).then(
        (value) => {
          release()
          resolve(value)
        },
        (error) => {
          release()
          reject(error)
        }
      )
    } catch (error) {
      release()
      reject(error)
    }
    return result
  }

  /** Capture admission identity so a retained caller cannot enter a successor. */
  createRunner(): <T>(operation: () => T | Promise<T>) => Promise<T> {
    const generation = this.generation
    return (operation) => this.runInGeneration(operation, generation)
  }

  run<T>(operation: () => T | Promise<T>): Promise<T> {
    return this.runInGeneration(operation, this.generation)
  }

  private runInGeneration<T>(
    operation: () => T | Promise<T>,
    generation: number
  ): Promise<T> {
    if (!this.accepting || generation !== this.generation) {
      return Promise.reject(new FeatureRuntimeClosedError())
    }
    const result = this.tail.then(async () => {
      this.assertOpen(generation)
      // Ordinary work remains serialized while an immediate invocation settles.
      while (this.active) {
        await this.active.result.then(
          () => undefined,
          () => undefined
        )
        this.assertOpen(generation)
      }
      return this.executeNow(operation, false)
    })
    this.tail = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  /** Close synchronously; the returned promise also drains rejected queued work. */
  close(): Promise<void> {
    this.accepting = false
    return Promise.allSettled([this.tail, this.active?.result]).then(() => {
      this.drained = true
    })
  }

  beginRuntime(): void {
    if (this.accepting || !this.drained) throw new FeatureRuntimeClosedError()
    this.generation += 1
    this.drained = false
    this.accepting = true
  }
}

export const interactionQueue = new InteractionQueue()
