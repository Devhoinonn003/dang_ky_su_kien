import { Clock } from 'lucide-react'
import type { Dictionary } from '../i18n'
import { localize } from '../lib/content'
import type { AgendaItem, Language } from '../types'

interface AgendaProps {
  items: AgendaItem[]
  language: Language
  t: Dictionary
}

/** Agenda repeater from schema.json; hidden when there is nothing to show. */
export function Agenda({ items, language, t }: AgendaProps) {
  const rows = items
    .map((item) => ({ time: item.time.trim(), label: localize(item.label, language) }))
    .filter((item) => item.label || item.time)
  if (rows.length === 0) return null

  return (
    <section aria-labelledby="er-agenda-heading" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:pb-14">
      <h2 id="er-agenda-heading" className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
        <Clock className="size-5 text-(--er-accent)" aria-hidden="true" />
        {t.agenda}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {rows.map((row, index) => (
          <li
            key={`${row.time}-${index}`}
            className="rounded-(--er-radius-card) border border-current/15 bg-(--er-bg)/60 p-4 backdrop-blur-md"
          >
            {row.time && <p className="font-mono text-sm font-bold tracking-wide text-(--er-accent)">{row.time}</p>}
            {row.label && <p className="mt-1 leading-snug font-semibold">{row.label}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
