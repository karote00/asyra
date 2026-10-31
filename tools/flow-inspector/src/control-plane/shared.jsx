import { createContext, useContext, useEffect, useState } from 'react'

const RemoteContext = createContext(null)

export function RemoteProvider({ children }) {
  const [resources] = useState(() => new Map())

  return (
    <RemoteContext.Provider value={resources}>
      {children}
    </RemoteContext.Provider>
  )
}

function sharedRead(resources, route, revision, signal, refresh) {
  if (!resources) {
    return request(route, undefined, signal)
  }

  const key = route
  let resource = resources.get(key)

  if (
    !resource ||
    resource.revision !== revision ||
    resource.controller.signal.aborted ||
    (refresh && resource.settled)
  ) {
    const controller = new AbortController()
    resource = { controller, revision, settled: false, users: 0 }
    const current = resource
    current.promise = request(route, undefined, controller.signal).then(
      (value) => {
        current.settled = true

        return value
      },
      (error) => {
        if (resources.get(key) === current) {
          resources.delete(key)
        }

        throw error
      }
    )
    resources.set(key, current)
  }

  resource.users++
  const current = resource
  let released = false

  function release() {
    if (released) {
      return
    }

    released = true
    current.users--
    signal.removeEventListener('abort', release)

    if (!current.users && !current.settled) {
      current.controller.abort()
    }
  }

  signal.addEventListener('abort', release, { once: true })

  return current.promise.finally(release)
}

export async function request(route, body, signal) {
  const options = { signal }

  if (body !== undefined) {
    const session = await request('/api/session', undefined, signal)
    options.method = 'POST'
    options.headers = {
      'Content-Type': 'application/json',
      'X-Proof-Capability': session.capability
    }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(route, options)
  const value = await response.json()

  if (!response.ok) {
    throw new Error(value.error ?? 'Request failed')
  }

  return value
}

/**
 * @template T
 * @param {string | null} route
 * @param {number} revision
 * @param {boolean | ((value: T) => boolean)} poll
 * @param {string | number} identity
 * @param {boolean} retainOnError
 */
export function useRemote(
  route,
  revision = 0,
  poll = false,
  identity = revision,
  retainOnError = false
) {
  const resources = useContext(RemoteContext)
  const [result, setResult] = useState({ route: '', value: null, error: '' })

  useEffect(() => {
    if (!route) {
      return
    }

    const controller = new AbortController()
    let timer

    async function load() {
      let shouldPoll = poll === true

      try {
        const value = await sharedRead(
          resources,
          route,
          identity,
          controller.signal,
          Boolean(poll)
        )
        shouldPoll = typeof poll === 'function' ? poll(value) : poll

        if (!controller.signal.aborted) {
          setResult({ route, value, error: '' })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult((current) => ({
            route,
            value:
              retainOnError && current.route === route ? current.value : null,
            error: error.message
          }))
        }
      } finally {
        if (shouldPoll && !controller.signal.aborted) {
          timer = setTimeout(load, 1000)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [route, revision, poll, resources, identity, retainOnError])

  return result.route === route ? result : { value: null, error: '' }
}

export function Field({
  id,
  label,
  fields,
  setField,
  options,
  multiple = false,
  disabled = false,
  type = 'text',
  rows,
  maxLength
}) {
  const value = fields[id] ?? (multiple ? [] : '')
  const onChange = (event) =>
    setField(
      id,
      multiple
        ? Array.from(event.target.selectedOptions, (option) => option.value)
        : event.target.value
    )
  const common = { id, value, disabled, onChange }
  let control = <input {...common} type={type} maxLength={maxLength} />

  if (options) {
    control = (
      <select {...common} multiple={multiple}>
        {options.map(([key, title, unavailable]) => (
          <option key={key} value={key} disabled={unavailable}>
            {title}
          </option>
        ))}
      </select>
    )
  } else if (rows) {
    control = <textarea {...common} rows={rows} maxLength={maxLength} />
  }

  return (
    <label>
      {label}
      {control}
    </label>
  )
}

export function Json({ id, value, empty = 'None selected', ...props }) {
  let text = empty

  if (value != null) {
    text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }

  return (
    <pre id={id} {...props}>
      {text}
    </pre>
  )
}

export function ExternalLink({ id, href, children }) {
  return (
    <a
      id={id}
      href={href || undefined}
      hidden={!href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export function splitList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
