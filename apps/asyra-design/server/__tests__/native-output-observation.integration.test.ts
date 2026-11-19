import { it as nativeTest, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isRecord } from '@asyra/utils'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import {
  createNativeProviderFixture,
  nativeProviderExecutable
} from './native-provider-fixture'

const it = nativeTest.skipIf(!nativeProviderExecutable)

for (const mode of ['progressive', 'silent', 'interrupted'] as const) {
  it(
    'observes actual native ' +
      mode +
      ' arguments before production App dispatch',
    async () => {
      const fixture = await createNativeProviderFixture(
        [
          {
            type: 'function_call',
            id: 'read',
            call_id: 'read',
            namespace: 'design_knowledge',
            name: 'read_knowledge',
            arguments: JSON.stringify({ ids: ['colors'] })
          }
        ],
        undefined,
        mode
      )
      const signal = AbortSignal.timeout(45000)
      const request = requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Read color advice without editing.'
        },
        { environment: fixture.environment, signal }
      )
      // Attach rejection handling before intentionally disconnecting the native stream.
      const outcome = request.then(
        (value) => ({ value }),
        (error) => ({ error })
      )

      try {
        await Promise.race([
          fixture.waitForUnfinished(),
          outcome.then(() => {
            throw Error('Provider settled before unfinished-output checkpoint')
          })
        ])
        expect(fixture.emittedArgumentBytes()).toBe(
          mode === 'silent' ? 0 : 64000
        )
        expect(fixture.toolCalls()).toHaveLength(0)
        const before: unknown[] = (
          await readFile(
            join(fixture.directory, 'native-protocol.jsonl'),
            'utf8'
          )
        )
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))

        expect(
          before
            .filter(isRecord)
            .filter((packet) => packet.method === 'item/tool/call')
        ).toHaveLength(0)
        fixture.releaseUnfinished()
        const settled = await outcome

        if (mode === 'interrupted') {
          expect(settled).toHaveProperty('error')
          expect(fixture.toolCalls()).toHaveLength(0)
          expect(fixture.requests).toHaveLength(1)
        } else {
          expect(settled).not.toHaveProperty('error')
          expect(fixture.toolCalls()).toHaveLength(1)
          const received = fixture.successorOutput('read')

          expect(received).toContain('"target":"colors"')
          expect(received).toContain(
            '"toolOutcome":{"status":"success","settlement":"completed","issues":[]}'
          )
        }
      } finally {
        fixture.releaseUnfinished()
        await outcome
        await fixture.dispose()
      }
    },
    60000
  )
}
