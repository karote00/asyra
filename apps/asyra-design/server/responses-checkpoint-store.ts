import { closeSync, mkdirSync, openSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  isResponsesCheckpoint,
  type ProviderConversationStorage,
  type ResponsesCheckpoint
} from '@asyra/ai-agent-runtime/node'

/** Compare the last read value in the same write that claims an execution. */
export const createResponsesCheckpointStore = (
  path = '.app-data/ai-continuation/responses.sqlite'
): ProviderConversationStorage<ResponsesCheckpoint> & { close(): void } => {
  let database: DatabaseSync | undefined

  const open = () => {
    if (!database) {
      if (path !== ':memory:') {
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
        closeSync(openSync(path, 'a', 0o600))
      }

      const db = new DatabaseSync(path, { allowExtension: false })

      try {
        db.exec(
          'CREATE TABLE IF NOT EXISTS checkpoints (id TEXT PRIMARY KEY, record TEXT NOT NULL) STRICT'
        )
        db.exec(`CREATE TABLE IF NOT EXISTS operation_receipts (
          conversation_id TEXT NOT NULL, turn_id TEXT NOT NULL, call_id TEXT NOT NULL,
          namespace TEXT NOT NULL, tool TEXT NOT NULL, arguments TEXT NOT NULL, output TEXT NOT NULL,
          PRIMARY KEY (conversation_id, call_id)
        ) STRICT`)
        database = db
      } catch (error) {
        db.close()
        throw error
      }
    }

    return database
  }

  return {
    read(key) {
      const row = open()
        .prepare('SELECT record FROM checkpoints WHERE id=?')
        .get(key)

      if (!row) {
        return undefined
      }

      const value: unknown =
        typeof row.record === 'string' && JSON.parse(row.record)

      if (
        !value ||
        typeof value !== 'object' ||
        !('contract' in value) ||
        typeof value.contract !== 'string' ||
        !('state' in value) ||
        !isResponsesCheckpoint(value.state)
      ) {
        throw Error('Invalid Responses checkpoint')
      }

      return { contract: value.contract, state: value.state }
    },

    write(key, next, expected) {
      const db = open()
      const serialized = JSON.stringify(next)
      const dispatched = expected?.state.pending[0]
      const settled = next.state.outputs.at(-1)

      db.exec('BEGIN IMMEDIATE')
      try {
        const result = expected
          ? db
              .prepare(
                'UPDATE checkpoints SET record=? WHERE id=? AND record=?'
              )
              .run(serialized, key, JSON.stringify(expected))
          : db
              .prepare(
                'INSERT INTO checkpoints(id,record) VALUES (?,?) ON CONFLICT(id) DO NOTHING'
              )
              .run(key, serialized)

        if (result.changes !== 1) {
          throw Error('Responses checkpoint changed during execution')
        }

        if (
          dispatched &&
          settled &&
          expected?.state.executing === dispatched.callId &&
          settled.call_id === dispatched.callId
        ) {
          db.prepare(
            `INSERT INTO operation_receipts
            (conversation_id, turn_id, call_id, namespace, tool, arguments, output)
            VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(
            key,
            next.state.turn,
            dispatched.callId,
            dispatched.namespace,
            dispatched.name,
            dispatched.arguments,
            JSON.stringify(settled.output)
          )
        }

        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },

    close() {
      database?.close()
      database = undefined
    }
  }
}
