import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runExecutionReportCli } from '@asyra/ai-agent-runtime/node'
import { designReportPolicy } from './design-profiler-policy'

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = await runExecutionReportCli(
    process.argv.slice(2),
    process.env,
    {
      policy: designReportPolicy,
      createProvider: ({ directory, signal, environment }) => {
        const model = environment.AI_PROVIDER_MODEL?.trim()
        if (environment.AI_PROVIDER_BACKEND !== 'local-codex' || !model)
          return undefined
        return async (summary) => {
          const { requestLocalAiAssessment } =
            await import('./local-ai-provider')
          return requestLocalAiAssessment(summary, {
            model,
            executable: environment.AI_PROVIDER_EXECUTABLE?.trim() || 'codex',
            recordDirectory: join(directory, 'assessments'),
            sourceRevision: environment.AI_EXECUTION_SOURCE_REVISION?.trim(),
            signal
          })
        }
      }
    }
  )
  process.stdout.write(result.output + '\n')
  process.exitCode = result.code
}
