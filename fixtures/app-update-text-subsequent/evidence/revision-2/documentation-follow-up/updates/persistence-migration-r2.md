# Define migrations for your product - revision 2

Asyra provides the migration integration point and load lifecycle. Extend your
product by supplying its version history and deterministic transforms, then let
Core and the canonical packages validate the migrated candidate before
activation.

This standalone revision preserves the original attachment separately and
replaces its unavailable documentation-tree links with supplied consumer paths.
The generic string-version example below is background only: this consumer uses
numeric `documentVersion` 1/2 and must retain its existing loader, not copy the
example or introduce version 3. See the [selected update](text-spacing-example-2-r2.md).

## Prerequisites

- `@asyra/core` load/save composition
- `@asyra/persistence` contracts or a compatible app provider
- app-owned document versions and a connected migration chain
- current property and hierarchy schemas

## Ownership

Persistence owns `DocumentLoadSource`, `IPersistenceProvider`, load/save hook
types, and reference providers. Core owns migration hook ordering, result
enforcement, and package-owner validation/apply. Props Manager and Scene Tree
validate their canonical data. The app owns migration meaning, supported
versions, domain transforms, storage selection, scheduling, authentication,
retention, and backend topology.

## Public APIs

- `core.registerLoadHook(...)`
- `core.save()` and the Core load lifecycle
- `DocumentLoadSource` and `IPersistenceProvider`
- `MemoryPersistence`, `IndexedDbPersistence`, and
  `LocalStoragePersistence`
- `SaveHook` and `LoadHook`

The transition registry below is product code built on the Framework migration
lifecycle. It supplies domain meaning without replacing Core's migration and
load orchestration.

## Where this runs

Install migration hooks in the app's document composition before Core starts.
The provider returns untrusted data to the load source; migration happens
before canonical package apply. Keep backend selection, retries, retention, and
credentials in app/server adapters rather than the browser document model.

## Implementation

```ts
type AppDocument = {
  version: string
  [key: string]: unknown
}

type DocumentEnvelope = {
  version?: unknown
}

type Migration = (document: AppDocument) => AppDocument

const migrations = new Map<string, Migration>([
  [
    'v1',
    (document) => {
      const { legacyTitle, ...rest } = document
      return { ...rest, version: 'v2', title: legacyTitle ?? '' }
    }
  ],
  [
    'v2',
    (document) => ({
      ...document,
      version: 'v3',
      metadata: { schema: 'v3' }
    })
  ]
])

core.registerLoadHook((rawDocument) => {
  if (!rawDocument || typeof rawDocument !== 'object') {
    throw new Error('Invalid document envelope')
  }
  if (typeof (rawDocument as DocumentEnvelope).version !== 'string') {
    throw new Error('Document version is required')
  }
  let document = rawDocument as AppDocument
  const visited = new Set<string>()
  while (migrations.has(document.version)) {
    if (visited.has(document.version)) throw new Error('Migration cycle')
    visited.add(document.version)
    document = migrations.get(document.version)!(document)
  }
  if (document.version !== 'v3') {
    throw new Error(`Unsupported document version: ${document.version}`)
  }
  return document
})
```

Production registration should validate the entire transition batch up front:
one head, no duplicate input/output versions, no disconnected components, and
no asynchronous step results.

## Flow

1. Register one complete, connected app migration batch.
2. Read an untrusted document from the selected source.
3. Require an explicit string version.
4. Apply synchronous migration steps in deterministic order.
5. Require each step to return exactly its declared next version.
6. Return the migrated candidate to Core.
7. Let package owners validate the complete candidate before apply.
8. Activate the document only after all owners accept it.

## Expected result

The implementation migrates a `v1` document through one connected chain to
`v3`. Missing versions, disconnected/cyclic chains, duplicate registration,
asynchronous results, malformed results, and wrong output versions fail before
canonical apply.

If Persistence is not composed, no storage I/O occurs. If a provider fails,
that failure cannot redefine whether an already settled runtime transaction
committed. The app decides retry and recovery policy.

## Validate

Add round-trip, invalid-document, unsupported-version, partial-owner failure,
prior-document preservation, and provider-failure tests for your app schema.

## Forbidden shortcuts

- no package-owned app version table
- no asynchronous migration hidden inside a synchronous load hook
- no apply before full migration and owner validation
- no defaulting an explicitly invalid value
- no automatic save scheduling claimed by Persistence or Core
- no treating browser reference providers as production backend policy

## Sources available in this consumer

- [Actual numeric-version conversion and validation](../src/documents.ts)
- [Load-hook registration and storage wrapper](../src/runtime.ts)
- [Composed field schema](../src/definitions.ts)
- [Document round trips and preservation tests](../src/__tests__/subsequent-preservation.test.ts)
- [Validation, migration and history tests](../src/__tests__/text-preservation.test.ts)
- [Pinned Framework sources and public API requirements](text-spacing-example-2-r2.md)

These local files establish this App's behavior, not the full Framework contract.
The original attachment's Persistence, Props Manager and validation-learning
references are optional background documents not bundled here. Their unavailable
relative links are intentionally not used in this revision. If a future task
requires those broader contracts, supply verified sources before dependent work.
See the [handoff inventory](handoff-inventory-r2.md) for delivery boundaries.
