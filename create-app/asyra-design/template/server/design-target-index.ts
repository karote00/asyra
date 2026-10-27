/** Immutable artifact keys, indexed once; query results retain source order. */
export const createDesignTargetIndex = (
  keyToId: Readonly<Record<string, string>>
) => {
  const orderedKeys = Object.keys(keyToId)
  const sorted = orderedKeys
    .map((key, order) => ({ key, order }))
    .sort((left, right) => {
      if (left.key < right.key) return -1
      if (left.key > right.key) return 1
      return 0
    })

  return {
    keys(prefix?: string): string[] {
      if (prefix === undefined) return [...orderedKeys]
      let low = 0
      let high = sorted.length
      while (low < high) {
        const middle = low + Math.floor((high - low) / 2)
        if (sorted[middle].key < prefix) low = middle + 1
        else high = middle
      }
      const matches: (typeof sorted)[number][] = []
      for (
        let index = low;
        index < sorted.length && sorted[index].key.startsWith(prefix);
        index++
      ) {
        matches.push(sorted[index])
      }
      return matches
        .sort((left, right) => left.order - right.order)
        .map(({ key }) => key)
    }
  }
}
