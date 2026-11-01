export async function readJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { signal })
  const value = await response.json()

  if (!response.ok) {
    throw new Error(value.error ?? `Request failed (${response.status})`)
  }

  return value as T
}

export async function writeJson<T>(url: string, body: unknown): Promise<T> {
  const session = await readJson<{ capability: string }>('/api/session')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-flow-capability': session.capability
    },
    body: JSON.stringify(body)
  })
  const value = await response.json()

  if (!response.ok) {
    throw new Error(value.error ?? `Request failed (${response.status})`)
  }

  return value as T
}
