import { Mail, Phone } from 'lucide-react'
import type { Dictionary } from '../i18n'

interface SiteFooterProps {
  t: Dictionary
  organizerName: string
  email: string
  hotline: string
}

const linkClass =
  'inline-flex items-center gap-2 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current'

/** Organizer contact; each item is hidden when empty in the editor. */
export function SiteFooter({ t, organizerName, email, hotline }: SiteFooterProps) {
  if (!organizerName && !email && !hotline) return null
  return (
    <footer className="border-t border-current/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {organizerName && (
          <p className="font-semibold">
            <span className="sr-only">{t.organizer}: </span>
            {organizerName}
          </p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {email && (
            <a href={`mailto:${email}`} className={linkClass}>
              <Mail className="size-4" aria-hidden="true" />
              {email}
            </a>
          )}
          {hotline && (
            <a href={`tel:${hotline.replace(/\s/g, '')}`} className={linkClass}>
              <Phone className="size-4" aria-hidden="true" />
              {hotline}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
