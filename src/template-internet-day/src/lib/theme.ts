import type { CSSProperties } from 'react'
import { MIN_CONTRAST, RADIUS_PRESETS, type RadiusPreset } from '../config'
import type { RegistrationContent } from '../types'

const DARK_TEXT = '#0b1220'
const LIGHT_TEXT = '#ffffff'

/** Semantic status palette: [text, background, border] for light and dark surfaces. */
type StatusTone = readonly [text: string, bg: string, border: string]
const STATUS: Record<'danger' | 'success' | 'info' | 'warning', { light: StatusTone; dark: StatusTone }> = {
  danger: { light: ['#b91c1c', '#fef2f2', '#fecaca'], dark: ['#fca5a5', '#450a0a', '#7f1d1d'] },
  success: { light: ['#065f46', '#ecfdf5', '#a7f3d0'], dark: ['#6ee7b7', '#022c22', '#065f46'] },
  info: { light: ['#0c4a6e', '#f0f9ff', '#bae6fd'], dark: ['#7dd3fc', '#082f49', '#075985'] },
  warning: { light: ['#78350f', '#fffbeb', '#fde68a'], dark: ['#fcd34d', '#451a03', '#78350f'] },
}

function statusVars(name: string, [text, bg, border]: StatusTone): Record<string, string> {
  return { [`--er-${name}`]: text, [`--er-${name}-bg`]: bg, [`--er-${name}-border`]: border }
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  return [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Black or white, whichever reads better on the given color. */
export function readableTextOn(hex: string): string {
  return contrastRatio(hex, DARK_TEXT) >= contrastRatio(hex, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT
}

/** Uses `preferred` as text on `surface` only when it is readable, else black/white. */
function readableOr(preferred: string, surface: string): string {
  return contrastRatio(preferred, surface) >= MIN_CONTRAST ? preferred : readableTextOn(surface)
}

/** Linear blend of two hex colors; t = 0 gives `a`, t = 1 gives `b`. */
function mixHex(a: string, b: string, t: number): string {
  const [ca, cb] = [toRgb(a), toRgb(b)]
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Keeps the hue of `color` but tints it toward black/white just enough to be
 * readable on `surface` (e.g. a dark green becomes a light green on navy).
 */
function tintToReadable(color: string, surface: string, minTint = 0): string {
  const target = readableTextOn(surface)
  for (let t = minTint; t <= 1; t += 0.05) {
    const candidate = mixHex(color, target, t)
    if (contrastRatio(candidate, surface) >= MIN_CONTRAST) return candidate
  }
  return target
}

/**
 * Variables for content sitting directly on the page background (the
 * registration panel). Re-maps the surface tokens to the background so every
 * component keeps using --er-surface / --er-on-surface unchanged, while inputs
 * keep the light field colors (--er-field-*) set on the root.
 */
export function buildPanelStyle(theme: RegistrationContent['Theme']): CSSProperties {
  const { primaryColor, backgroundColor } = theme
  const onBg = readableTextOn(backgroundColor)
  const isDarkBg = onBg === LIGHT_TEXT
  const primaryText = tintToReadable(primaryColor, backgroundColor)

  return {
    '--er-surface': `color-mix(in srgb, ${backgroundColor} 72%, transparent)`,
    '--er-on-surface': onBg,
    '--er-muted': `color-mix(in srgb, ${onBg} 72%, ${backgroundColor})`,
    '--er-border': `color-mix(in srgb, ${onBg} 16%, transparent)`,
    '--er-border-strong': `color-mix(in srgb, ${onBg} 50%, ${backgroundColor})`,
    '--er-subtle': `color-mix(in srgb, ${onBg} 6%, transparent)`,
    '--er-ink': onBg,
    '--er-on-ink': backgroundColor,
    '--er-primary-text': primaryText,
    '--er-ring': primaryText,
    ...Object.assign(
      {},
      ...Object.entries(STATUS).map(([name, tone]) => statusVars(name, isDarkBg ? tone.dark : tone.light)),
    ),
  } as CSSProperties
}

/**
 * Turns the Theme block of the content into CSS variables.
 * Components only use these variables, never fixed colors, so any palette
 * chosen in the editor stays readable.
 */
export function buildThemeStyle(theme: RegistrationContent['Theme']): CSSProperties {
  const { primaryColor, accentColor, backgroundColor, surfaceColor } = theme
  const onSurface = readableTextOn(surfaceColor)
  const ink = readableOr(backgroundColor, surfaceColor)
  const isDarkSurface = onSurface === LIGHT_TEXT
  const radius = RADIUS_PRESETS[theme.radius as RadiusPreset] ?? RADIUS_PRESETS.medium
  const onPrimary = readableTextOn(primaryColor)
  const primaryText = readableOr(primaryColor, surfaceColor)

  return {
    '--er-primary': primaryColor,
    '--er-on-primary': onPrimary,
    // Hover moves away from the label color, so contrast only goes up.
    '--er-primary-hover': `color-mix(in srgb, ${primaryColor} 86%, ${onPrimary === LIGHT_TEXT ? '#000' : '#fff'})`,
    '--er-primary-text': primaryText,
    '--er-accent': accentColor,
    '--er-accent-text': readableOr(accentColor, backgroundColor),
    '--er-bg': backgroundColor,
    '--er-on-bg': readableTextOn(backgroundColor),
    '--er-surface': surfaceColor,
    '--er-on-surface': onSurface,
    '--er-muted': `color-mix(in srgb, ${onSurface} 68%, ${surfaceColor})`,
    '--er-border': `color-mix(in srgb, ${onSurface} 14%, ${surfaceColor})`,
    // Input and card outlines: strong enough for the 3:1 non-text contrast rule.
    '--er-border-strong': `color-mix(in srgb, ${onSurface} 48%, ${surfaceColor})`,
    '--er-subtle': `color-mix(in srgb, ${onSurface} 5%, ${surfaceColor})`,
    '--er-ink': ink,
    '--er-on-ink': readableTextOn(ink),
    // Status colors: one hue each, tuned for light or dark card backgrounds.
    ...Object.assign(
      {},
      ...Object.entries(STATUS).map(([name, tone]) => statusVars(name, isDarkSurface ? tone.dark : tone.light)),
    ),
    // Solid focus outline, readable on the card surface.
    '--er-ring': primaryText,
    // Text inputs always use the light surface, even inside the dark panel.
    '--er-field': surfaceColor,
    '--er-on-field': onSurface,
    '--er-field-muted': `color-mix(in srgb, ${onSurface} 60%, ${surfaceColor})`,
    '--er-field-border': `color-mix(in srgb, ${onSurface} 48%, ${surfaceColor})`,
    // Inputs need no outline when the field already stands out from the page (white on navy).
    '--er-field-edge':
      contrastRatio(surfaceColor, backgroundColor) >= 3
        ? surfaceColor
        : `color-mix(in srgb, ${onSurface} 48%, ${surfaceColor})`,
    // Form title gradient from the theme, nudged only if unreadable on the background.
    '--er-heading-from': tintToReadable(theme.headingFromColor, backgroundColor),
    '--er-heading-to': tintToReadable(theme.headingToColor, backgroundColor),
    '--er-radius': radius.control,
    '--er-radius-field': radius.field,
    '--er-radius-card': radius.card,
  } as CSSProperties
}
