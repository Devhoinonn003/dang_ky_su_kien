/**
 * Template-wide constants. Business rules and design tokens that are not
 * event-specific live here, so they can be changed in one place.
 * Anything that varies per event belongs in schema.json instead.
 */
import type { Language } from './types'

/** Every registration books exactly one ticket (free-ticket scope of the spec). */
export const TICKET_QUANTITY = 1

/** Minimum number of sessions before the day picker is shown. */
export const MIN_SESSIONS_FOR_PICKER = 2

export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  /** 9–11 digits, optional leading "+". Spaces, dots and dashes are stripped first. */
  phone: /^\+?\d{9,11}$/,
  phoneSeparators: /[\s.-]/g,
} as const

/** Prices are always shown in Vietnamese format, e.g. "150.000 đ" (spec rule). */
export const PRICE_FORMAT = { locale: 'vi-VN', suffix: ' đ' } as const

/** Locale used for dates and numbers per page language. */
export const DATE_LOCALES: Record<Language, string> = { vi: 'vi-VN', en: 'en-GB' }

/** Values allowed for `Theme.radius` in schema.json -> CSS radii (control, card). */
export const RADIUS_PRESETS = {
  none: { control: '0px', card: '0px' },
  small: { control: '6px', card: '10px' },
  medium: { control: '12px', card: '18px' },
  large: { control: '18px', card: '28px' },
} as const
export type RadiusPreset = keyof typeof RADIUS_PRESETS

/** Values allowed for `Hero.layout` in schema.json. */
export const HERO_LAYOUTS = ['overlay', 'stacked'] as const
export type HeroLayout = (typeof HERO_LAYOUTS)[number]

/** Minimum WCAG contrast ratio used when picking readable text colors. */
export const MIN_CONTRAST = 4.5

/** Delay before the "Copied" label goes back to "Copy". */
export const COPY_FEEDBACK_MS = 2000

/** URL schemes accepted for `image` / `url` fields; anything else is dropped. */
export const SAFE_URL = /^(https?:\/\/|\/|\.\/|mailto:|tel:)/i
