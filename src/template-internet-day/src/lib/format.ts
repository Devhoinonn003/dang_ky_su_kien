import { DATE_LOCALES, PRICE_FORMAT } from '../config'
import type { Language } from '../types'

const priceFormatter = new Intl.NumberFormat(PRICE_FORMAT.locale)

export function toTime(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

/** Prices arrive as strings ("150000.00") or numbers; anything else counts as 0. */
export function parsePrice(price: string | number | null | undefined): number {
  const n = typeof price === 'number' ? price : Number.parseFloat(price ?? '')
  return Number.isFinite(n) ? n : 0
}

/** "0 đ" / "150.000 đ". */
export function formatPrice(price: string | number | null | undefined): string {
  return `${priceFormatter.format(parsePrice(price))}${PRICE_FORMAT.suffix}`
}

export function formatDate(iso: string | undefined, language: Language): string {
  const t = toTime(iso)
  if (t === null) return ''
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(t)
}

/** Compact date for narrow option labels, e.g. "Th 5, 10/12/2026". */
export function formatShortDate(iso: string | undefined, language: Language): string {
  const t = toTime(iso)
  if (t === null) return ''
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(t)
}

export function formatTimeRange(start: string | undefined, end: string | undefined, language: Language): string {
  const s = toTime(start)
  if (s === null) return ''
  const fmt = new Intl.DateTimeFormat(DATE_LOCALES[language], { hour: '2-digit', minute: '2-digit' })
  const e = toTime(end)
  return e === null ? fmt.format(s) : `${fmt.format(s)} – ${fmt.format(e)}`
}

export function formatDateTime(iso: string | undefined, language: Language): string {
  const t = toTime(iso)
  if (t === null) return ''
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(t)
}
