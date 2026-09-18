import * as presentation from '../../ai/presentation'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AiConversationPanel } from '../ai-conversation-panel'
import { createAiConversationController } from '../../ai/conversation'
import { createAiConfirmationBroker } from '../../ai/confirmation'
import { createDeferred } from '../../ai/__tests__/deferred'
import {
  AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE,
  AiDocumentInteractionTargets
} from '../../constants'
import { documentInteractionLock } from '../../ai/document-interaction-lock'

const createPanelHarness = () => {
  const pending = createDeferred<Record<string, unknown>>()
  const feature = {
    cancel: vi.fn(() => true),
    execute: vi.fn(() => pending.promise)
  }
  const confirmation = createAiConfirmationBroker()
  const conversation = createAiConversationController({
    confirmation,
    createConversationId: () => 'panel-conversation',
    feature,
    getElementType: vi.fn()
  })
  return {
    confirmation,
    conversation,
    feature,
    pending
  }
}

describe('AI Agent conversation panel intent boundary', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ state: 'ready' })))
    )
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('discloses personal subscription usage immediately when the panel opens', () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    const notice = screen.getByRole('note', { name: 'Your AI subscription' })
    expect(notice.textContent).toContain(
      'Local AI uses your own subscription and counts toward its usage limits.'
    )
    expect(notice.textContent).toContain(
      'Asyra Design does not provide an AI subscription.'
    )
    expect(harness.feature.execute).not.toHaveBeenCalled()
    expect(screen.queryByTestId('ai-agent-message')).toBeNull()
  })

  it('does not reproject conversation history while editing the next draft', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    await screen.findByText('Local AI connected')
    act(() => {
      void harness.conversation.submit('Draw')
    })
    const project = vi.spyOn(presentation, 'projectAiActivity')
    for (const value of ['N', 'Ne', 'Next']) {
      fireEvent.change(screen.getByLabelText('Message Agent'), {
        target: { value }
      })
    }
    expect(project).not.toHaveBeenCalled()
    await act(async () => {
      harness.pending.resolve({ status: 'executed', actionResults: [] })
    })
    expect(project).toHaveBeenCalled()
  })

  it('accepts one trimmed draft, stays non-modal, and exposes active cancellation', () => {
    const harness = createPanelHarness()
    const onClose = vi.fn()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={onClose}
      />
    )

    expect(screen.getByTestId('ai-agent-panel')).toBeTruthy()
    expect(screen.queryByTestId('ai-agent-message')).toBeNull()
    expect(screen.getByRole('button', { name: 'Add image' })).toBeTruthy()
    expect(screen.getByRole('complementary').getAttribute('aria-modal')).toBe(
      'false'
    )
    const input = screen.getByLabelText('Message Agent')
    expect(document.activeElement).toBe(input)
    const send = screen.getByRole('button', { name: 'Send' })
    expect((send as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(input, {
      target: {
        value: '  畫一個貓臉  '
      }
    })
    fireEvent.click(send)

    expect(harness.feature.execute).toHaveBeenCalledOnce()
    expect(harness.feature.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: '畫一個貓臉'
      })
    )
    expect((input as HTMLTextAreaElement).value).toBe('')
    expect((send as HTMLButtonElement).disabled).toBe(true)
    const cancelRequest = screen.getByRole('button', {
      name: 'Cancel request'
    })
    expect(
      cancelRequest.getAttribute(AI_DOCUMENT_INTERACTION_TARGET_ATTRIBUTE)
    ).toBe(AiDocumentInteractionTargets.AGENT_CANCEL)

    fireEvent.click(screen.getByRole('button', { name: 'Close Agent panel' }))
    expect(harness.feature.cancel).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the same user message node on the right from submission through settlement', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: { value: 'Draw a 240px logo' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    const userMessage = screen.getByLabelText('Your message')
    expect(userMessage.textContent).toBe('Draw a 240px logo')
    expect(userMessage.className).toContain('self-end')
    expect(screen.getByLabelText('Agent response').textContent).not.toContain(
      'Draw a 240px logo'
    )
    await act(async () => {
      harness.pending.resolve({ status: 'executed', actionResults: [] })
      await harness.pending.promise
    })
    expect(screen.getByLabelText('Your message')).toBe(userMessage)
  })

  it('offers a safe retry and editable retained request after a provider deadline', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: { value: 'Replace the previous drawing using this image' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await act(async () => {
      harness.pending.resolve({
        status: 'failed',
        stage: 'provider',
        code: 'AI_PROVIDER_TIMEOUT'
      })
      await harness.pending.promise
    })
    expect(screen.getByText(/timed out/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Edit request' }))
    expect(
      (screen.getByLabelText('Message Agent') as HTMLTextAreaElement).value
    ).toBe('Replace the previous drawing using this image')
  })

  it('does not submit whitespace or queue a second active turn', () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Message Agent')
    const send = screen.getByRole('button', { name: 'Send' })

    fireEvent.change(input, { target: { value: '   ' } })
    expect((send as HTMLButtonElement).disabled).toBe(true)
    fireEvent.submit(screen.getByRole('form'))
    expect(harness.feature.execute).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'first' } })
    fireEvent.click(send)
    fireEvent.change(input, { target: { value: 'second' } })
    expect((send as HTMLButtonElement).disabled).toBe(true)
    expect(harness.feature.execute).toHaveBeenCalledOnce()
  })

  it('restores the reference into an explicitly edited failed text continuation', async () => {
    const harness = createPanelHarness()
    const attachment = {
      dataUrl: 'data:image/png;base64,YQ==',
      mediaType: 'image/png' as const,
      name: 'reference.png',
      size: 1
    }
    harness.feature.execute = vi
      .fn()
      .mockResolvedValueOnce({
        status: 'executed',
        actionResults: [
          {
            actionName: 'request_clarification',
            result: {
              status: 'no-change',
              clarification: { kind: 'question', question: 'Keep the size?' }
            }
          }
        ]
      })
      .mockResolvedValue({
        status: 'failed',
        stage: 'provider',
        code: 'AI_PROVIDER_TIMEOUT'
      })
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    await act(async () => {
      await harness.conversation.submit({
        intent: 'Draw the reference at 240 by 240',
        attachments: [attachment]
      })
      await harness.conversation.submit('Yes')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Edit request' }))
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(
      (screen.getByLabelText('Message Agent') as HTMLTextAreaElement).value
    ).toBe('Draw the reference at 240 by 240\nYes')
  })

  it('keeps mouse, touch, and keyboard cancellation inside the Agent control while the document is locked', () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: { value: 'draw progressively' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    const cancelRequest = screen.getByRole('button', {
      name: 'Cancel request'
    })
    const escapedDocumentInteraction = vi.fn()
    const eventTypes = [
      'click',
      'keydown',
      'keyup',
      'mousedown',
      'mouseup',
      'pointerdown',
      'pointerup',
      'touchend',
      'touchstart'
    ] as const
    for (const eventType of eventTypes) {
      window.addEventListener(eventType, escapedDocumentInteraction)
    }
    const release = documentInteractionLock.acquire()

    try {
      fireEvent.keyDown(cancelRequest, { code: 'Enter', key: 'Enter' })
      fireEvent.keyUp(cancelRequest, { code: 'Enter', key: 'Enter' })
      fireEvent.mouseDown(cancelRequest)
      fireEvent.mouseUp(cancelRequest)
      fireEvent.pointerDown(cancelRequest)
      fireEvent.pointerUp(cancelRequest)
      fireEvent.touchStart(cancelRequest)
      fireEvent.touchEnd(cancelRequest)
      fireEvent.click(cancelRequest)
    } finally {
      release()
      for (const eventType of eventTypes) {
        window.removeEventListener(eventType, escapedDocumentInteraction)
      }
    }

    expect(escapedDocumentInteraction).not.toHaveBeenCalled()
    expect(harness.feature.cancel).toHaveBeenCalledOnce()
    expect(harness.feature.cancel).toHaveBeenCalledWith('user-cancelled')
  })

  it('keeps typing, editing shortcuts and IME keys inside the composer without preventing native editing', () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Message Agent')
    const shortcut = vi.fn()
    window.addEventListener('keydown', shortcut)
    window.addEventListener('keyup', shortcut)
    try {
      for (const key of [
        'r',
        'o',
        'v',
        'p',
        'Backspace',
        'Delete',
        ' ',
        'Escape',
        'Enter',
        'z'
      ]) {
        for (const type of ['keydown', 'keyup']) {
          const event = new KeyboardEvent(type, {
            key,
            bubbles: true,
            cancelable: true,
            metaKey: key === 'z',
            isComposing: key === 'Enter'
          })
          fireEvent(input, event)
          expect(event.defaultPrevented).toBe(false)
        }
      }
      expect(shortcut).not.toHaveBeenCalled()
      fireEvent.keyDown(document.body, { key: 'r' })
      expect(shortcut).toHaveBeenCalledOnce()
    } finally {
      window.removeEventListener('keydown', shortcut)
      window.removeEventListener('keyup', shortcut)
    }
  })

  it('adds the same removable image draft through file selection and drag-and-drop, then preserves it in the submitted turn', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    const selectedImage = new File(['png-image'], 'selected-tabby.png', {
      type: 'image/png'
    })
    fireEvent.change(screen.getByLabelText('Choose images'), {
      target: {
        files: [selectedImage]
      }
    })

    expect(
      await screen.findByRole('img', { name: 'selected-tabby.png' })
    ).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove selected-tabby.png' })
    )
    expect(screen.queryByRole('img', { name: 'selected-tabby.png' })).toBeNull()

    const droppedImage = new File(['jpeg-image'], 'dropped-tabby.jpg', {
      type: 'image/jpeg'
    })
    fireEvent.drop(screen.getByTestId('agent-image-drop-target'), {
      dataTransfer: {
        files: [droppedImage]
      }
    })
    expect(
      await screen.findByRole('img', { name: 'dropped-tabby.jpg' })
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: {
        value: '請依照這張圖繪製'
      }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(harness.feature.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          intent: '請依照這張圖繪製',
          metadata: expect.objectContaining({
            imageAttachments: [
              expect.objectContaining({
                dataUrl: expect.stringMatching(
                  /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/
                ),
                mediaType: 'image/jpeg',
                name: 'dropped-tabby.jpg',
                size: droppedImage.size
              })
            ]
          })
        })
      )
    })
    expect(screen.getByRole('img', { name: 'dropped-tabby.jpg' })).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Add image' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)

    await act(async () => {
      harness.pending.resolve({
        actionResults: [],
        status: 'executed'
      })
      await harness.pending.promise
    })
    expect(screen.getByRole('img', { name: 'dropped-tabby.jpg' })).toBeTruthy()
  })

  it('rejects unsupported image drafts with a concise error and no Feature request', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Choose images'), {
      target: {
        files: [
          new File(['not-an-image'], 'notes.txt', {
            type: 'text/plain'
          })
        ]
      }
    })

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Choose PNG, JPEG, or WebP images.'
    )
    expect(harness.feature.execute).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('contains browser image read failure in the editable draft', async () => {
    const originalReadAsDataUrl = FileReader.prototype.readAsDataURL
    FileReader.prototype.readAsDataURL = vi.fn(function (
      this: FileReader
    ): void {
      this.dispatchEvent(new Event('error'))
    })
    try {
      const harness = createPanelHarness()
      render(
        <AiConversationPanel
          confirmation={harness.confirmation}
          conversation={harness.conversation}
          onClose={vi.fn()}
        />
      )
      fireEvent.change(screen.getByLabelText('Choose images'), {
        target: {
          files: [
            new File(['broken-image'], 'broken.webp', {
              type: 'image/webp'
            })
          ]
        }
      })

      expect((await screen.findByRole('alert')).textContent).toBe(
        'Could not read one or more images. Try adding them again.'
      )
      expect(harness.feature.execute).not.toHaveBeenCalled()
      expect(screen.queryByRole('img')).toBeNull()
    } finally {
      FileReader.prototype.readAsDataURL = originalReadAsDataUrl
    }
  })

  it.each([
    ['Approve', true],
    ['Decline', false]
  ] as const)(
    'renders a concise confirmation and routes %s to the broker',
    async (decision, expected) => {
      const harness = createPanelHarness()
      render(
        <AiConversationPanel
          confirmation={harness.confirmation}
          conversation={harness.conversation}
          onClose={vi.fn()}
        />
      )
      harness.confirmation.beginTurn('panel-conversation:turn:1')
      let settlement: Promise<boolean> | undefined
      await act(async () => {
        settlement = harness.confirmation.requestConfirmation(
          {
            actions: [
              {
                summary: {
                  affectedCount: 1
                },
                id: 'remove-1',
                name: 'remove_ai_composition',
                permission: 'confirm'
              }
            ],
            batchId: 'remove-batch'
          },
          {
            signal: new AbortController().signal
          }
        )
      })

      expect(screen.getByText('Delete 1 existing composition.')).toBeTruthy()
      expect(screen.getByText('Destructive')).toBeTruthy()
      expect(screen.getByText('Undoable')).toBeTruthy()
      expect(screen.queryByText(/secret-group-id/)).toBeNull()
      expect(JSON.stringify(harness.confirmation.getSnapshot())).not.toMatch(
        /arguments|compositionId/
      )
      fireEvent.click(screen.getByRole('button', { name: decision }))

      await expect(settlement).resolves.toBe(expected)
    }
  )

  it('projects ordered settled progress and a safe result without raw action evidence', async () => {
    let now = 2_000
    const confirmation = createAiConfirmationBroker()
    const conversation = createAiConversationController({
      confirmation,
      createConversationId: () => 'panel-progress',
      feature: {
        cancel: vi.fn(() => false),
        execute: vi.fn(async (request) => {
          request.progressObserver({
            attempt: 1,
            phase: 'context',
            summary: 'Understanding the request'
          })
          request.progressObserver({
            actionCount: 1,
            attempt: 1,
            phase: 'execution',
            summary: 'Applying changes'
          })
          now = 3_250
          return {
            actionResults: [
              {
                actionId: 'secret-action-id',
                actionName: 'insert_vector_composition',
                result: {
                  appliedElementIds: ['secret-canonical-id'],
                  skipped: [],
                  status: 'complete'
                }
              }
            ],
            status: 'executed'
          }
        })
      },
      getElementType: vi.fn(),
      now: () => now
    })
    render(
      <AiConversationPanel
        confirmation={confirmation}
        conversation={conversation}
        onClose={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: {
        value: '畫一個貓臉'
      }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('Updated 1 editable element.')).toBeTruthy()
    const settledMessage = screen.getByTestId('ai-agent-message')
    expect(settledMessage.tagName).toBe('ARTICLE')
    expect(settledMessage.getAttribute('data-outcome')).toBe('success')
    expect(screen.getByText('畫一個貓臉')).toBeTruthy()
    expect(screen.getByText('Reviewing the drawing')).toBeTruthy()
    expect(screen.getByText('Applying changes')).toBeTruthy()
    expect(screen.getByText('Elapsed 1.3s')).toBeTruthy()
    expect(screen.queryByText('You')).toBeNull()
    expect(screen.queryByText(/secret-action-id/)).toBeNull()
    expect(screen.queryByText(/secret-canonical-id/)).toBeNull()
  })

  it('projects App-owned balanced and maximum detail cards for the exact no-change clarification', async () => {
    const harness = createPanelHarness()
    render(
      <AiConversationPanel
        confirmation={harness.confirmation}
        conversation={harness.conversation}
        onClose={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Message Agent'), {
      target: {
        value: '請依照這張圖繪製'
      }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await act(async () => {
      harness.pending.resolve({
        actionResults: [
          {
            actionId: 'provider-choice-action-id',
            actionName: 'request_drawing_detail_choice',
            result: {
              action: 'request_drawing_detail_choice',
              clarification: {
                kind: 'drawing-detail',
                optionIds: ['balanced', 'maximum']
              },
              status: 'no-change'
            }
          }
        ],
        providerBody: 'provider-choice-copy',
        status: 'executed'
      })
      await harness.pending.promise
    })

    expect(
      await screen.findByText('Choose a drawing detail level.')
    ).toBeTruthy()
    expect(screen.getByText('Balanced detail')).toBeTruthy()
    expect(screen.queryByText('7,111 editable elements')).toBeNull()
    expect(screen.queryByText('At least 115,000 points')).toBeNull()
    expect(screen.getByText('Maximum detail')).toBeTruthy()
    expect(screen.queryByText('27,471 editable elements')).toBeNull()
    expect(screen.queryByText('295,794 points')).toBeNull()
    expect(
      screen.getByText(
        'May temporarily use much more memory and reduce app responsiveness.'
      )
    ).toBeTruthy()
    expect(screen.queryByText(/provider-choice/)).toBeNull()
    expect(screen.queryByText('You')).toBeNull()
  })

  it.each(
    [
      ['Balanced detail', 'draw this image with balanced detail'],
      ['Maximum detail', 'draw this image with maximum detail']
    ].flatMap(
      ([label, expectedIntent]) =>
        [
          [label, expectedIntent, true],
          [label, expectedIntent, false]
        ] as const
    )
  )(
    'submits the %s choice with original context (attachment: %s)',
    async (label, expectedIntent, withAttachment) => {
      const referenceAttachment = Object.freeze({
        dataUrl: 'data:image/png;base64,cmV0YWluZWQtcmVmZXJlbmNl',
        mediaType: 'image/png' as const,
        name: 'retained-reference.png',
        size: 18
      })
      const feature = {
        cancel: vi.fn(() => false),
        execute: vi
          .fn()
          .mockResolvedValueOnce({
            actionResults: [
              {
                actionId: 'choice-action',
                actionName: 'request_drawing_detail_choice',
                result: {
                  action: 'request_drawing_detail_choice',
                  clarification: {
                    kind: 'drawing-detail',
                    optionIds: ['balanced', 'maximum']
                  },
                  status: 'no-change'
                }
              }
            ],
            status: 'executed'
          })
          .mockResolvedValueOnce({
            actionResults: [],
            status: 'executed'
          })
      }
      const confirmation = createAiConfirmationBroker()
      const conversation = createAiConversationController({
        confirmation,
        createConversationId: () => `panel-${label}`,
        feature,
        getElementType: vi.fn()
      })
      render(
        <AiConversationPanel
          confirmation={confirmation}
          conversation={conversation}
          onClose={vi.fn()}
        />
      )

      await act(async () => {
        await conversation.submit({
          attachments: withAttachment ? [referenceAttachment] : [],
          intent: '請依照這張圖繪製'
        })
      })

      const choice = screen.getByRole('button', {
        name: `Choose ${label}`
      })
      fireEvent.click(choice)

      await waitFor(() => {
        expect(feature.execute).toHaveBeenCalledTimes(2)
      })
      expect(feature.execute.mock.calls[1][0]).toMatchObject({
        intent: expectedIntent,
        metadata: {
          replyTo: { intent: '請依照這張圖繪製', turnId: expect.any(String) },
          ...(withAttachment ? { imageAttachments: [referenceAttachment] } : {})
        }
      })
      expect(
        screen.queryByRole('button', { name: `Choose ${label}` })
      ).toBeNull()
      expect(feature.execute).toHaveBeenCalledTimes(2)
      expect(screen.queryAllByRole('img')).toHaveLength(withAttachment ? 1 : 0)
    }
  )
})
