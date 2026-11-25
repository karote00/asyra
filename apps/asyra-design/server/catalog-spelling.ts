/** A single insertion, deletion, substitution or adjacent transposition in an identifier. */
export function nearbyCatalogNames(
  query: string,
  names: readonly string[]
): string[] {
  const word = query.trim().toLowerCase()

  if (word.length < 3 || /\s/.test(word)) {
    return []
  }

  const near = (candidate: string) => {
    let a = word
    let b = candidate.toLowerCase()

    if (a === b || Math.abs(a.length - b.length) > 1) {
      return false
    }

    if (a.length > b.length) {
      ;[a, b] = [b, a]
    }

    let i = 0

    while (i < a.length && a[i] === b[i]) {
      i++
    }

    if (a.length !== b.length) {
      return a.slice(i) === b.slice(i + 1)
    }

    return (
      a.slice(i + 1) === b.slice(i + 1) ||
      (a[i] === b[i + 1] &&
        a[i + 1] === b[i] &&
        a.slice(i + 2) === b.slice(i + 2))
    )
  }

  return names
    .filter(
      (name) =>
        near(name) ||
        (!word.includes('.') && near(name.split('.').at(-1) ?? name))
    )
    .sort()
}
