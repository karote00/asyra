// Read-only inspection through the already-running desktop daemon. No model turn,
// configuration write, daemon startup, hook trust change, or thread is created.
import { spawn } from 'node:child_process'
import readline from 'node:readline'
import path from 'node:path'

const binary = process.argv[2]
if (!binary || !path.isAbsolute(binary))
  throw new Error('Pass the absolute path to the desktop Codex binary.')
const directories = process.argv.slice(3)
if (!directories.length) directories.push(process.cwd())
if (directories.some((directory) => !path.isAbsolute(directory)))
  throw new Error('Directories must be absolute.')
const child = spawn(binary, ['app-server', 'proxy'], {
  stdio: ['pipe', 'pipe', 'pipe']
})
const lines = readline.createInterface({ input: child.stdout })
let settled = false
let errorText = ''
const timer = setTimeout(
  () => finish({ error: 'Desktop hook inspection timed out.' }, 1),
  5000
)
function finish(value, code) {
  if (settled) return
  settled = true
  clearTimeout(timer)
  process.exitCode = code
  process.stdout.write(`${JSON.stringify(value)}\n`)
  lines.close()
  child.stdin.destroy()
  child.kill('SIGTERM')
}
function send(value) {
  child.stdin.write(`${JSON.stringify(value)}\n`)
}
child.stderr.on('data', (chunk) => {
  errorText = (errorText + chunk).slice(-1000)
})
child.on('error', (error) => finish({ error: error.message }, 1))
child.on('exit', (code) => {
  if (!settled)
    finish(
      {
        error: 'Desktop proxy exited before inspection completed.',
        code,
        detail: errorText
      },
      1
    )
})
lines.on('line', (line) => {
  try {
    const message = JSON.parse(line)
    if (message.id === 1) {
      if (message.error) return finish({ error: message.error }, 1)
      send({ method: 'initialized', params: {} })
      send({ id: 2, method: 'hooks/list', params: { cwds: directories } })
    }
    if (message.id === 2)
      finish(
        message.error ? { error: message.error } : message.result,
        message.error ? 1 : 0
      )
  } catch (error) {
    finish({ error: `Invalid hook inspection response: ${error.message}` }, 1)
  }
})
send({
  id: 1,
  method: 'initialize',
  params: {
    clientInfo: { name: 'coordination_hook_inspector', version: '1.0.0' }
  }
})
