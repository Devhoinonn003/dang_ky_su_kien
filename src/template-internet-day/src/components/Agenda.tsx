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
      <h2 id="er-agenda-heading" className="mb-5 flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
        <Clock className="size-5 text-(--er-accent-text)" aria-hidden="true" />
        {t.agenda}
      </h2>
      <ol className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {rows.map((row, index) => (
          <li
            key={`${row.time}-${index}`}
            className="border-t-2 border-current pt-3"
          >
            {row.time && <p className="text-sm font-semibold tracking-wide text-(--er-accent-text) tabular-nums">{row.time}</p>}
            {row.label && <p className="mt-1 leading-snug font-semibold">{row.label}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
