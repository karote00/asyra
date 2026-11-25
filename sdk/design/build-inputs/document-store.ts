import { IndexedDbPersistence } from '@asyra/persistence'

export async function createDocumentStore(key: string) {
  const session = await new IndexedDbPersistence(key, {
    databaseName: 'design-workspace-documents'
  }).connect()

  type Snapshot = Parameters<typeof session.save>[0]

  return {
    load: session.load,

    save: (snapshot: unknown) => session.save(snapshot as Snapshot),

    importIfAbsent: (snapshot: unknown) =>
      session.importIfAbsent(snapshot as Snapshot),

    clear: session.clear,
    close: session.close
  }
}
