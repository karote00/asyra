/* eslint-disable @typescript-eslint/no-require-imports */
// A formal consumer preload: read-only commands must not schedule work.
const reject = () => {
  throw new Error('Headless read attempted process or server execution')
}
for (const key of [
  'spawn',
  'spawnSync',
  'exec',
  'execSync',
  'execFile',
  'execFileSync',
  'fork'
]) {
  require('node:child_process')[key] = reject
}
require('node:http').createServer = reject
require('node:https').createServer = reject
