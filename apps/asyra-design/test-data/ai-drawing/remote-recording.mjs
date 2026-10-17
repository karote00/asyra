import { stat, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Export while the remote browser server still owns its video artifact. */
export const saveRemoteRecording = async (context, page, destination) => {
  const video = page.video()
  if (!video) throw new Error('The test page has no recording')
  await mkdir(dirname(destination), { recursive: true })
  await context.close()
  await video.saveAs(destination)
  const saved = await stat(destination)
  if (!saved.size) throw new Error('The test recording is empty')
  return { path: destination, bytes: saved.size }
}
