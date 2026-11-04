import { useState } from 'react';
import { ArrowDown, CalendarDays, Clock, MapPin } from 'lucide-react';
import type { Dictionary } from '../i18n';
import type { Language, RegistrationContent } from '../types';
import { localize } from '../utils';

interface EventIntroProps {
  content: RegistrationContent;
  language: Language;
  t: Dictionary;
  fallbackTitle: string;
  formAnchorId: string;
  showCta: boolean;
}

/** Event intro: banner, title, time, location, short description and agenda. */
export function EventIntro({ content, language, t, fallbackTitle, formAnchorId, showCta }: EventIntroProps) {
  const { Hero: hero, Organizer: organizer, Agenda: agenda } = content;
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const title = localize(hero.title, language) || fallbackTitle;
  const tagline = localize(hero.tagline, language);
  const time = localize(hero.time, language);
  const venue = localize(hero.location, language);
  const description = localize(hero.description, language);
  const organizerName = localize(organizer.name, language);
  const agendaItems = agenda
    .map((item) => ({ time: item.time.trim(), label: localize(item.label, language) }))
    .filter((item) => item.label || item.time);

  const desktopBanner = hero.bannerDesktop || hero.bannerMobile;
  const mobileBanner = hero.bannerMobile || hero.bannerDesktop;
  const hasBanner = Boolean(desktopBanner) && !bannerFailed;

  return (
    <header className="relative isolate overflow-hidden">
      {hasBanner && (
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopBanner} />
          <img
            src={mobileBanner}
            alt=""
            className="absolute inset-x-0 top-0 -z-20 h-auto w-full [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
            onError={() => setBannerFailed(true)}
            fetchPriority="high"
          />
        </picture>
      )}
      {/* Light scrim keeps text readable on any banner without hiding the artwork. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--er-bg)_30%,transparent)_40%,transparent_100%)] md:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--er-bg)_45%,transparent)_0%,transparent_50%)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-[36vw] pb-10 sm:px-6 md:pt-[12vw] md:pb-16 xl:pt-44">
        <div className="max-w-xl">
          {tagline && (
            <p className="mb-3 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-(--er-on-bg) uppercase backdrop-blur-sm sm:text-sm">
              {tagline}
            </p>
          )}
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-(--er-on-bg) [text-shadow:0_2px_16px_rgb(0_0_0/0.45)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {(time || venue) && (
            <dl className="mt-6 grid gap-3 text-(--er-on-bg)">
              {time && (
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 rounded-lg bg-white/15 p-2">
                    <CalendarDays className="size-5" aria-hidden="true" />
                    <span className="sr-only">{t.timeLabel}</span>
                  </dt>
                  <dd className="pt-1.5 text-base font-semibold sm:text-lg">{time}</dd>
                </div>
              )}
              {venue && (
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 rounded-lg bg-white/15 p-2">
                    <MapPin className="size-5" aria-hidden="true" />
                    <span className="sr-only">{t.venueLabel}</span>
                  </dt>
                  <dd className="pt-1.5 text-base font-semibold sm:text-lg">{venue}</dd>
                </div>
              )}
            </dl>
          )}

          {description && <p className="mt-6 text-base leading-relaxed text-(--er-on-bg) opacity-90 sm:text-lg">{description}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {showCta && (
              <a
                href={`#${formAnchorId}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-(--er-primary) px-6 text-base font-bold text-(--er-on-primary) shadow-lg shadow-black/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
              >
                {t.registerNow}
                <ArrowDown className="size-5" aria-hidden="true" />
              </a>
            )}
            {(organizerName || (hero.logo && !logoFailed)) && (
              <div className="flex items-center gap-3">
                {hero.logo && !logoFailed && (
                  <img
                    src={hero.logo}
                    alt={organizerName || t.organizer}
                    className="h-9 w-auto max-w-40 rounded-md object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                )}
                {organizerName && (
                  <p className="text-sm text-(--er-on-bg) opacity-90">
                    <span className="sr-only">{t.organizer}: </span>
                    {organizerName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {agendaItems.length > 0 && (
          <section aria-labelledby="er-agenda-heading" className="mt-10 lg:mt-14">
            <h2 id="er-agenda-heading" className="mb-4 flex items-center gap-2 text-lg font-bold text-(--er-on-bg) sm:text-xl">
              <Clock className="size-5 text-(--er-accent)" aria-hidden="true" />
              {t.agenda}
            </h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              {agendaItems.map((item, index) => (
                <li
                  key={`${item.time}-${index}`}
                  className="rounded-2xl border border-white/15 bg-(--er-bg)/60 p-4 text-(--er-on-bg) backdrop-blur-md"
                >
                  {item.time && (
                    <p className="font-mono text-sm font-bold tracking-wide text-(--er-accent)">{item.time}</p>
                  )}
                  {item.label && <p className="mt-1 font-semibold leading-snug">{item.label}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </header>
  );
}
