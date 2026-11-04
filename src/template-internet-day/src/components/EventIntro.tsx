import { useState, type CSSProperties } from 'react'
import { ArrowDown, CalendarDays, MapPin } from 'lucide-react'
import type { HeroLayout } from '../config'
import type { Dictionary } from '../i18n'
import { localize } from '../lib/content'
import type { Language, RegistrationContent } from '../types'

interface EventIntroProps {
  content: RegistrationContent
  language: Language
  t: Dictionary
  fallbackTitle: string
  formAnchorId: string
  showCta: boolean
}

/**
 * Event intro: banner, title, time, location and short description.
 * Layout ("overlay" or "stacked") and the space above the text come from schema.json.
 */
export function EventIntro({ content, language, t, fallbackTitle, formAnchorId, showCta }: EventIntroProps) {
  const { Hero: hero, Organizer: organizer } = content
  const [bannerFailed, setBannerFailed] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const title = localize(hero.title, language) || fallbackTitle
  const tagline = localize(hero.tagline, language)
  const time = localize(hero.time, language)
  const location = localize(hero.location, language)
  const description = localize(hero.description, language)
  const organizerName = localize(organizer.name, language)
  const showLogo = Boolean(hero.logo) && !logoFailed

  const desktopBanner = hero.bannerDesktop || hero.bannerMobile
  const mobileBanner = hero.bannerMobile || hero.bannerDesktop
  const hasBanner = Boolean(desktopBanner) && !bannerFailed
  const layout: HeroLayout = hero.layout === 'stacked' ? 'stacked' : 'overlay'
  const overlay = layout === 'overlay' && hasBanner

  const offsetStyle = {
    '--er-offset-m': `${hero.overlayOffsetMobile}vw`,
    '--er-offset-d': `${hero.overlayOffsetDesktop}vw`,
  } as CSSProperties

  const banner = hasBanner && (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopBanner} />
      <img
        src={mobileBanner}
        alt=""
        fetchPriority="high"
        onError={() => setBannerFailed(true)}
        className={
          overlay
            ? 'absolute inset-x-0 top-0 -z-20 h-auto w-full [mask-image:linear-gradient(to_bottom,black_75%,transparent)]'
            : 'block h-auto w-full'
        }
      />
    </picture>
  )

  return (
    <header className="relative isolate overflow-hidden" style={offsetStyle}>
      {banner}
      {overlay && (
        // Light scrim keeps text readable on any banner without hiding the artwork.
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--er-bg)_30%,transparent)_40%,transparent_100%)] md:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--er-bg)_45%,transparent)_0%,transparent_50%)]"
        />
      )}

      <div
        className={[
          'mx-auto max-w-6xl px-4 pb-10 sm:px-6 md:pb-14',
          overlay ? 'pt-(--er-offset-m) md:pt-(--er-offset-d)' : 'pt-8 md:pt-12',
        ].join(' ')}
      >
        <div className="max-w-xl">
          {tagline && (
            <p className="mb-3 inline-flex rounded-full border border-current/25 bg-current/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm sm:text-sm">
              {tagline}
            </p>
          )}
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight [text-shadow:0_2px_16px_rgb(0_0_0/0.35)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {(time || location) && (
            <dl className="mt-6 grid gap-3">
              {[
                { value: time, label: t.timeLabel, Icon: CalendarDays },
                { value: location, label: t.venueLabel, Icon: MapPin },
              ]
                .filter((row) => row.value)
                .map(({ value, label, Icon }) => (
                  <div key={label} className="flex items-start gap-3">
                    <dt className="mt-0.5 rounded-(--er-radius) bg-current/15 p-2">
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </dt>
                    <dd className="pt-1.5 text-base font-semibold sm:text-lg">{value}</dd>
                  </div>
                ))}
            </dl>
          )}

          {description && <p className="mt-6 text-base leading-relaxed opacity-90 sm:text-lg">{description}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {showCta && (
              <a
                href={`#${formAnchorId}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-(--er-radius) bg-(--er-primary) px-6 text-base font-bold text-(--er-on-primary) shadow-lg shadow-black/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring)"
              >
                {t.registerNow}
                <ArrowDown className="size-5" aria-hidden="true" />
              </a>
            )}
            {(organizerName || showLogo) && (
              <div className="flex items-center gap-3">
                {showLogo && (
                  <img
                    src={hero.logo}
                    alt={organizerName || t.organizer}
                    className="h-9 w-auto max-w-40 rounded-md object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                )}
                {organizerName && (
                  <p className="text-sm opacity-90">
                    <span className="sr-only">{t.organizer}: </span>
                    {organizerName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
