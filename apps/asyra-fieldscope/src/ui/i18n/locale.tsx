import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import { ConfigurationError } from '../../domain/farm-configuration'
import { en, zhTW, type Locale, type MessageKey } from './messages'

export const LOCALE_STORAGE_KEY = 'greenhouse-workspace.locale'
export function translate(
  locale: Locale,
  key: MessageKey,
  values: Record<string, string | number> = {}
) {
  const message = (locale === 'en' ? en : zhTW)[key]
  return message.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`)
  )
}
type Translator = (
  key: MessageKey,
  values?: Record<string, string | number>
) => string
const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
}>({ locale: 'zh-TW', setLocale: () => undefined })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'zh-TW'
    } catch {
      return 'zh-TW'
    }
  })
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = translate(locale, 'app.title')
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // Storage may be unavailable in private or embedded browsers.
    }
  }, [locale])
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useTranslation() {
  const { locale, setLocale } = useContext(LocaleContext)
  const t: Translator = (key, values) => translate(locale, key, values)
  return { locale, setLocale, t }
}

export function localizeError(error: unknown, t: Translator) {
  if (error instanceof ConfigurationError) {
    const field = error.field ? t(`field.${error.field}`) : ''
    return t(`validation.${error.code}`, {
      field,
      min: error.min ?? '',
      max: error.max ?? ''
    })
  }
  return t('error.unexpected', {
    detail: error instanceof Error ? error.message : String(error)
  })
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation()
  return (
    <label className="flex shrink-0 items-center gap-2 text-xs text-[#50664f]">
      <span>{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={locale}
        onChange={(event) =>
          setLocale(event.target.value === 'en' ? 'en' : 'zh-TW')
        }
        className="h-9 rounded-lg border border-[#d9dfd2] bg-white px-2 text-xs"
      >
        <option value="zh-TW" lang="zh-TW">
          繁體中文
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  )
}
