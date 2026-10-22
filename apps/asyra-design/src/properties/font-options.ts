import {
  GENERIC_FONT_FAMILIES,
  LOCAL_FONT_CANDIDATES
} from '../constants/fonts'

interface FontCatalog {
  values: readonly string[] | null
}
const catalogs = new WeakMap<Document, FontCatalog>()

/** Discover fonts once per document/font-load revision, never per property edit. */
export const getAvailableFontFamilies = (
  owner: Document
): readonly string[] => {
  let catalog = catalogs.get(owner)
  if (!catalog) {
    catalog = { values: null }
    catalogs.set(owner, catalog)
    const entry = catalog
    owner.fonts?.addEventListener('loadingdone', () => {
      entry.values = null
    })
  }
  if (catalog.values) return catalog.values
  const context = owner.createElement('canvas').getContext('2d')
  const values: string[] = [...GENERIC_FONT_FAMILIES]
  if (context) {
    const sample = 'mmmmmmmmmmlliWW0123456789'
    const baselines = ['monospace', 'serif']
    const widths = baselines.map((base) => {
      context.font = `72px ${base}`
      return context.measureText(sample).width
    })
    for (const family of LOCAL_FONT_CANDIDATES) {
      if (
        baselines.some((base, index) => {
          context.font = `72px "${family}", ${base}`
          return context.measureText(sample).width !== widths[index]
        })
      )
        values.push(family)
    }
  }
  catalog.values = values
  return values
}
