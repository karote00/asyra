const finite = (value) => typeof value === 'number' && Number.isFinite(value)

const positive = (value) => finite(value) && value > 0

const count = (value) => Number.isSafeInteger(value) && value >= 0

const yes = (value) => value === true

const exactRecord = (value, fields) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length === Object.keys(fields).length &&
  Object.entries(fields).every(
    ([key, accepts]) => Object.hasOwn(value, key) && accepts(value[key])
  )

const point = (value) => exactRecord(value, { x: finite, y: finite })

const bounds = (value) =>
  exactRecord(value, {
    x: finite,
    y: finite,
    width: positive,
    height: positive
  })

const inputCounts = (value) =>
  exactRecord(value, {
    rectangleButton: (number) => number === 1,

    rectangleShortcut: (number) => number === 1
  })

// The endpoint owns these observations; resource admission preserves them rather
// than interpreting preventDefault as a document lock or accepting old reports.
export function normalizeEndpointInteractionEvidence(value, totalCount) {
  if (!Number.isSafeInteger(totalCount) || totalCount < 2) {
    return null
  }

  const vectors = totalCount - 1
  const targets = [
    1,
    ...[0.25, 0.5, 0.75].map((n) => Math.ceil(vectors * n)),
    vectors
  ]

  const activeSwitch = (sample) =>
    exactRecord(sample, {
      canonicalElements: (number) =>
        count(number) && number > 0 && number < totalCount,

      loadingConnected: yes,
      rectangleActive: yes,
      turnAccepted: yes,

      turnOutcome: (outcome) => outcome === null
    })

  const valid = exactRecord(value, {
    duringCreation: (entry) =>
      exactRecord(entry, {
        keyboard: activeSwitch,
        pointer: activeSwitch,
        documentEventAttempts: inputCounts,
        documentEventDeliveries: inputCounts
      }) && entry.pointer.canonicalElements >= entry.keyboard.canonicalElements,

    completion: (entry) =>
      exactRecord(entry, {
        canonicalElements: (number) => number === totalCount,

        historyActionCount: (number) => number === 1,

        loadingRemoved: yes,
        ordinaryKeyboardToolSwitchAccepted: yes,
        ordinaryToolSwitchAccepted: yes
      }),

    loadingAtZero: (entry) =>
      exactRecord(entry, {
        canonicalElements: (number) => number === 0,

        connected: yes,

        phase: (phase) => ['preparing', 'drawing'].includes(phase),

        rect: bounds,
        sourceBounds: bounds
      }),

    pan: (entry) =>
      exactRecord(entry, { before: point, after: point }) &&
      (entry.before.x !== entry.after.x || entry.before.y !== entry.after.y),

    zoom: (entry) =>
      exactRecord(entry, { before: positive, after: positive }) &&
      entry.before !== entry.after,

    progress: (entry) =>
      exactRecord(entry, {
        cooperativeYieldCount: (number) => count(number) && number > 0,

        longestCanonicalWorkUnitMs: positive,

        milestones: (items) =>
          Array.isArray(items) &&
          items.length === targets.length &&
          items.every((item, index) =>
            exactRecord(item, {
              atMs: (number) => finite(number) && number >= 0,

              completedElements: (number) =>
                count(number) && number >= targets[index] && number <= vectors,

              sampleIndex: (number) =>
                count(number) &&
                (index === 0 || number > items[index - 1].sampleIndex),

              targetElements: (number) => number === targets[index]
            })
          )
      })
  })

  return valid ? globalThis.structuredClone(value) : null
}
