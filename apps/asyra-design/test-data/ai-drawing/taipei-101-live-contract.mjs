import { URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const TAIPEI_101_PROMPT_SHA256 =
  '25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51'
export const TAIPEI_101_DEADLINE_MS = 10 * 60 * 1000
export const readTaipei101Prompt = () => {
  const bytes = readFileSync(
    new URL('./taipei-101-full-building-prompt.txt', import.meta.url)
  )
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== TAIPEI_101_PROMPT_SHA256)
    throw new Error('The user-approved fixed prompt has changed.')
  const text = bytes.toString('utf8')
  return {
    prompt: text.endsWith('\n') ? text.slice(0, -1) : text,
    sha256
  }
}
export const assertTaipei101Submission = (request, prompt) => {
  if (
    request.intent !== prompt ||
    request.metadata?.imageAttachments?.length ||
    request.metadata?.conversationContext?.turns?.length
  )
    throw new Error(
      'The fixed benchmark requires the exact prompt in a fresh conversation without attachments.'
    )
}
