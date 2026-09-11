// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { en, zhTW, type MessageKey } from '../i18n/messages'
import {
  LocaleProvider,
  LanguageSelector,
  LOCALE_STORAGE_KEY,
  localizeError,
  translate
} from '../i18n/locale'
import {
  ConfigurationError,
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('provides complete bilingual copy with matching interpolation parameters', () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(zhTW).sort())
  for (const key of Object.keys(zhTW) as MessageKey[]) {
    expect(zhTW[key].trim(), key).not.toBe('')
    expect(en[key].trim(), key).not.toBe('')
    expect(en[key], key).not.toMatch(/\p{Script=Han}/u)
    const tokens = (value: string) =>
      [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    expect(tokens(en[key]), key).toEqual(tokens(zhTW[key]))
    const parameters = Object.fromEntries(
      tokens(en[key]).map((token) => [token, 3.25])
    )
    expect(translate('en', key, parameters)).not.toMatch(/\{\w+\}/)
    expect(translate('zh-TW', key, parameters)).not.toMatch(/\{\w+\}/)
  }
})

it('translates structured validation in either language without changing its bounds', () => {
  let error: unknown
  try {
    validateConfiguration({ ...DEFAULT_CONFIGURATION, length: 1 })
  } catch (caught) {
    error = caught
  }
  expect(error).toBeInstanceOf(ConfigurationError)
  expect(error).toMatchObject({
    code: 'range',
    field: 'length',
    min: 2,
    max: 200
  })
  expect(
    localizeError(error, (key, args) => translate('zh-TW', key, args))
  ).toBe('縱向深度必須介於 2 與 200 公尺')
  expect(localizeError(error, (key, args) => translate('en', key, args))).toBe(
    'Length must be between 2 and 200 metres.'
  )
  for (const code of [
    'stripCount',
    'stripKind',
    'clearance',
    'arch',
    'inset',
    'poleTop',
    'roots',
    'capacity'
  ] as const) {
    expect(
      localizeError(new ConfigurationError(code), (key, args) =>
        translate('en', key, args)
      )
    ).not.toMatch(/\p{Script=Han}|\{/u)
  }
})

for (const saved of [null, 'en', 'zh-CN', 'bogus']) {
  it(`defaults to Traditional Chinese unless an explicit English preference exists: ${saved}`, async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    if (saved) localStorage.setItem(LOCALE_STORAGE_KEY, saved)
    const host = document.createElement('div')
    const root = createRoot(host)
    try {
      await act(async () =>
        root.render(
          <LocaleProvider>
            <LanguageSelector />
          </LocaleProvider>
        )
      )
      expect(host.querySelector('select')?.value).toBe(
        saved === 'en' ? 'en' : 'zh-TW'
      )
      expect(document.documentElement.lang).toBe(
        saved === 'en' ? 'en' : 'zh-TW'
      )
      expect(host.querySelectorAll('option')).toHaveLength(2)
    } finally {
      await act(async () => root.unmount())
    }
  })
}

it('switches language when browser storage is unavailable', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Storage denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage denied')
  })
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    await act(async () =>
      root.render(
        <LocaleProvider>
          <LanguageSelector />
        </LocaleProvider>
      )
    )
    const select = host.querySelector('select')
    if (!select) throw new Error('Missing language selector')
    expect(select.value).toBe('zh-TW')
    await act(async () => {
      select.value = 'en'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('FieldScope - Greenhouse workspace')
  } finally {
    await act(async () => root.unmount())
  }
})
