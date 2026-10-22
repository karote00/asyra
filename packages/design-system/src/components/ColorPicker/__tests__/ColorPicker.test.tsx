import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ColorPicker, { type ColorFormatDefinition } from '../ColorPicker'

const formats: ColorFormatDefinition[] = []
afterEach(cleanup)

describe('ColorPicker alpha visibility', () => {
  it.each([false, true])(
    'honors showAlpha=%s for the alpha slider',
    (showAlpha) => {
      render(
        <ColorPicker
          color="#ffffff"
          showAlpha={showAlpha}
          onChange={vi.fn()}
          formatDefinitions={formats}
          data-testid="color"
        />
      )
      fireEvent.pointerDown(screen.getByTestId('color-trigger'))
      expect(screen.queryByTestId('color-hue')).not.toBeNull()
      expect(screen.queryByTestId('color-alpha') !== null).toBe(showAlpha)
    }
  )
})
