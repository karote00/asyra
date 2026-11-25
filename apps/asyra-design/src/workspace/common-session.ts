import { cloneDeep } from 'lodash'
import { common } from './common'
import { commonPolicy } from './common-policy'
import { featureEnabled, hasDisabledFeatures } from '../workspace-features'

export function createCommonSession(signal: AbortSignal) {
  // The raw event publisher accepts arbitrary application payloads. Restricted
  // editors use semantic commands whose feature owner is known before mutation.
  const cleanup = new Set<() => void>()

  signal.addEventListener(
    'abort',
    () => {
      for (const dispose of cleanup) {
        dispose()
      }

      cleanup.clear()
    },
    { once: true }
  )

  function own(release: () => void) {
    const dispose = () => {
      if (cleanup.delete(dispose)) {
        release()
      }
    }

    cleanup.add(dispose)

    return dispose
  }

  function check(policy: ReturnType<typeof commonPolicy>, args: never[]) {
    const features = typeof policy === 'function' ? policy(...args) : policy

    if (typeof features === 'string') {
      featureEnabled(features, 'reject')
    } else {
      features?.forEach((id) => featureEnabled(id, 'reject'))
    }
  }

  function exposeResult(
    group: string,
    method: string,
    result: unknown
  ): unknown {
    if (
      typeof result === 'function' &&
      (method.startsWith('subscribe') || method.startsWith('observe'))
    ) {
      return own(() => result())
    }

    if (group === 'transaction' || group === 'properties') {
      return result
    }

    if (
      result &&
      (typeof result === 'object' || typeof result === 'function') &&
      'dispose' in result &&
      typeof result.dispose === 'function'
    ) {
      const dispose = own(result.dispose.bind(result))
      const wrapped = Object.fromEntries(
        Object.entries(result).map(([key, value]) => [
          key,
          typeof value === 'function'
            ? (...args: unknown[]) => {
                signal.throwIfAborted()
                if (key === 'undoCurrent') {
                  featureEnabled('undo', 'reject')
                }

                if (key === 'redoCurrent') {
                  featureEnabled('redo', 'reject')
                }

                return value(...args)
              }
            : value
        ])
      )

      if (typeof result === 'function') {
        return Object.assign(
          (...args: unknown[]) => {
            signal.throwIfAborted()

            return Reflect.apply(result, undefined, args)
          },
          wrapped,
          { dispose }
        )
      }

      return { ...wrapped, dispose }
    }

    if (typeof result === 'function') {
      const owners: Record<string, string> = {
        createDesignArranger: 'arrangeDesign',
        createDesignOrganizer: 'organizeDesign',
        createDesignElementEditor: 'editDesignElement',
        createDesignElementEditPreparer: 'prepareDesignElementEdit',
        createDesignContextReader: 'readDesignContext'
      }

      return (...args: never[]) => {
        signal.throwIfAborted()
        const owner = owners[method] ?? method

        check(commonPolicy(group, owner), args)

        return exposeResult(group, owner, result(...args))
      }
    }

    // Transaction callbacks and history groups can deliberately exchange opaque
    // values. Ordinary document reads never hand live mutable records to a host.
    if (result && typeof result === 'object' && !(result instanceof Promise)) {
      // Hierarchy snapshots can contain reactive records nested inside groups.
      return group === 'hierarchy' && method === 'getElementDataMap'
        ? cloneDeep(result)
        : structuredClone(result)
    }

    return result
  }

  return Object.fromEntries(
    Object.entries(common).map(([group, methods]) => [
      group,
      Object.fromEntries(
        Object.entries(methods).map(([name, method]) => {
          const policy = commonPolicy(group, name)

          return [
            name,
            (...args: never[]) => {
              signal.throwIfAborted()
              if (hasDisabledFeatures()) {
                check(policy, args)
                if (group === 'transaction' && name === 'updateTransaction') {
                  throw new Error(
                    'Raw transaction events require unrestricted Design features'
                  )
                }
              }

              const result = Reflect.apply(method, undefined, args)

              return exposeResult(group, name, result)
            }
          ]
        })
      )
    ])
  )
}
