import type { Dictionary } from '../i18n'
import { focusRing, focusWithinRing, formText, formWide } from '../lib/ui'

interface TermsFieldProps {
  t: Dictionary
  checked: boolean
  text: string
  url: string
  error?: string
  onChange: (checked: boolean) => void
}

/** Consent checkbox, drawn like the artwork's white option marks. */
export function TermsField({ t, checked, text, url, error, onChange }: TermsFieldProps) {
  return (
    <div className={formWide}>
      <label
        htmlFor="er-terms"
        className={`flex cursor-pointer items-start gap-3 rounded-(--er-radius) leading-snug text-(--er-on-surface) ${formText} ${focusWithinRing}`}
      >
        <input
          id="er-terms"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'er-terms-error' : undefined}
          className={[
            'mt-0.5 size-5 shrink-0 cursor-pointer accent-(--er-primary) focus-visible:outline-none',
            error ? 'outline-2 outline-offset-1 outline-(--er-danger)' : '',
          ].join(' ')}
        />
        <span>
          {text}
          <span className="text-(--er-danger)" aria-hidden="true">
            {' '}*
          </span>
        </span>
      </label>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className={`mt-1 ml-8 inline-block text-xs font-semibold text-(--er-primary-text) underline underline-offset-4 md:text-sm ${focusRing}`}
        >
          {t.viewTerms}
        </a>
      )}
      {error && (
        <p id="er-terms-error" className="mt-1 ml-8 text-xs font-medium text-(--er-danger) md:text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
