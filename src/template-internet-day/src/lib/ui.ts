/**
 * Shared class strings for the Swiss / minimal look: flat surfaces, hairline
 * borders, no shadows, solid focus outlines. Colors come only from the
 * --er-* variables built in theme.ts; nothing here is event-specific.
 */

/** Solid focus outline for controls sitting on the card surface. */
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--er-ring)'

/** Same outline, drawn on a label/card when its hidden input has keyboard focus. */
export const focusWithinRing =
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--er-ring)'

/** Focus outline for controls placed directly on the page background. */
export const focusRingOnBg =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--er-on-bg)'

/** Flat card: surface color, hairline border, no shadow. */
export const card =
  'rounded-(--er-radius-card) border border-(--er-border) bg-(--er-surface) text-(--er-on-surface)'

/**
 * Translucent panel placed straight on the page background (registration form).
 * Pair with buildPanelStyle() so the surface tokens follow the background.
 */
export const panel =
  'rounded-(--er-radius-card) border border-(--er-border) bg-(--er-surface) text-(--er-on-surface) backdrop-blur-md'

/** Small uppercase label used for meta text and badges. */
export const eyebrow = 'text-xs font-semibold tracking-[0.08em] uppercase'

export const badge = `inline-flex items-center rounded-(--er-radius) px-2 py-0.5 ${eyebrow}`

const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-(--er-radius-field) px-6 text-base font-semibold transition-colors disabled:cursor-wait disabled:opacity-70'

export const buttonPrimary = `${buttonBase} bg-(--er-primary) text-(--er-on-primary) hover:bg-(--er-primary-hover)`

/** Outlined button that inverts on hover. */
export const buttonSecondary = `${buttonBase} border-2 border-(--er-ink) text-(--er-ink) hover:bg-(--er-ink) hover:text-(--er-on-ink)`

/*
 * Registration artwork geometry, measured on the PDF mock-up
 * (mobile page 412.5 pt wide, desktop page 960 pt wide), expressed in % of the
 * stage width so the form lines up with the background at any screen size.
 *   mobile : labels end at 34.7%, inputs 37.1% -> 91.4%, choices start at 11.6%
 *   desktop: labels end at 29.9%, inputs 31.25% -> 68.75%, choices start at 30.2%
 */

/** One "label : input" row. */
export const formRow =
  'grid grid-cols-[34.7%_54.3%] gap-x-[2.4%] md:grid-cols-[29.9%_37.5%] md:gap-x-[1.35%]'

/** Wider blocks below the inputs (choices, terms, summary), aligned like the mock-up's radio groups. */
export const formWide = 'ml-[11.6%] w-[79.8%] md:ml-[30.2%] md:w-[46%]'

/** Body text size of the form: 11 pt on a 960 pt page, never below 13px. */
export const formText = 'text-[13px] md:text-[clamp(13px,1.146vw,18px)]'

/** Text input base (light field even on a dark panel); pair with inputState(). */
export const inputBase =
  'block h-9 w-full min-w-0 rounded-(--er-radius-field) border bg-(--er-field) px-4 text-[13px] text-(--er-on-field) placeholder:text-(--er-field-muted) placeholder:italic transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:h-[clamp(32px,2.29vw,42px)] md:text-[clamp(13px,1.04vw,16px)]'

export function inputState(hasError: boolean): string {
  return hasError
    ? 'border-(--er-danger) outline-2 -outline-offset-1 outline-(--er-danger) focus-visible:outline-(--er-danger)'
    : 'border-(--er-field-edge) focus-visible:outline-(--er-ring)'
}

/** Gradient call-to-action matching the form title. */
export const buttonGradient =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-(--er-radius-field) bg-linear-to-r from-(--er-heading-from) to-(--er-heading-to) px-8 font-bold text-(--er-bg) transition-[filter] hover:brightness-110 disabled:cursor-wait disabled:opacity-70'

/** Status notice with a leading rule; pass the tone's text/bg/border classes. */
export const notice = 'flex items-start gap-2 rounded-(--er-radius) border-l-4 p-3 text-sm'
