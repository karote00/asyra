import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

export const runOwnedBuildCommand = (
  command,
  args,
  { githubActions, timeoutMs }
) =>
  new Promise((resolve, reject) => {
    const env = { ...process.env, CI: 'true', FORCE_COLOR: '0' }
    if (githubActions) env.GITHUB_ACTIONS = 'true'
    else delete env.GITHUB_ACTIONS
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let output = ''
    let timedOut = false
    let oversized = false
    const killGroup = () => {
      if (!child.pid) return
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
    const timer = setTimeout(() => {
      timedOut = true
      killGroup()
    }, timeoutMs)
    const append = (data) => {
      output += data.toString()
      if (output.length > 8 * 1024 * 1024) {
        oversized = true
        killGroup()
      }
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (timedOut || oversized) {
        const error = new Error(
          timedOut ? `${command} timed out` : `${command} output exceeded limit`
        )
        error.output = output
        reject(error)
      } else resolve({ code, output })
    })
  })

export const countUtilsBuildExecutions = (output) =>
  output
    .split(/\r?\n/u)
    .filter((line) =>
      /@asyra\/utils:build:utils: cache bypass, force executing|::group::@asyra\/utils:build:utils/u.test(
        line
      )
    ).length

export async function assertStarterBuildArtifacts() {
  assertStarterArtifact(
    fs.existsSync(
      path.join(repositoryRoot, 'apps/starter-app/dist/frontend/index.html')
    ),
    'Starter frontend output'
  )
  const utils = await import(
    pathToFileURL(path.join(repositoryRoot, 'packages/utils/dist/index.js'))
  )
  const props = await import(
    pathToFileURL(
      path.join(
        repositoryRoot,
        'packages/props-manager/dist/components/base.js'
      )
    )
  )
  assertStarterArtifact(
    typeof utils.Setter === 'function',
    '@asyra/utils Setter'
  )
  assertStarterArtifact(typeof props.default === 'function', 'BaseProperty')
}

function assertStarterArtifact(passed, artifact) {
  if (!passed) throw new Error(`Missing built Starter artifact: ${artifact}`)
}
