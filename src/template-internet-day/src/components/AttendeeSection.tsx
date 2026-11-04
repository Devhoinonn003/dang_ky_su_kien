import type { Dictionary } from '../i18n'
import type { AttendeeFieldDef, FieldKey, FormErrors, FormValues } from '../formFields'
import { Field } from './Field'
import { SectionHeading } from './SectionHeading'

interface AttendeeSectionProps {
  step: number
  t: Dictionary
  fields: AttendeeFieldDef[]
  values: FormValues
  errors: FormErrors
  termsText: string
  termsUrl: string
  onChange: <K extends FieldKey>(key: K, value: FormValues[K]) => void
  onBlur: (key: FieldKey) => void
}

/** Attendee inputs rendered from ATTENDEE_FIELDS, plus the terms consent. */
export function AttendeeSection({ step, t, fields, values, errors, termsText, termsUrl, onChange, onBlur }: AttendeeSectionProps) {
  const termsError = errors.agreed ? t[errors.agreed] : undefined

  return (
    <section aria-labelledby="er-info-heading">
      <div id="er-info-heading">
        <SectionHeading step={step} title={t.stepInfo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const error = errors[field.key]
          return (
            <Field
              key={field.key}
              id={field.id}
              type={field.type}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              className={field.wide ? 'sm:col-span-2' : undefined}
              label={t[field.label]}
              placeholder={t[field.placeholder]}
              hint={field.hint ? t[field.hint] : undefined}
              required={field.required}
              requiredText={t.required}
              optionalText={t.optional}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              onBlur={() => onBlur(field.key)}
              error={error ? t[error] : undefined}
            />
          )
        })}
      </div>

      <div className="mt-5">
        <label
          htmlFor="er-terms"
          className={[
            'flex cursor-pointer items-start gap-3 rounded-(--er-radius) border p-4 text-sm leading-relaxed',
            'has-focus-visible:ring-4 has-focus-visible:ring-(--er-ring)',
            termsError ? 'border-(--er-danger)' : 'border-(--er-border) bg-(--er-subtle)',
          ].join(' ')}
        >
          <input
            id="er-terms"
            type="checkbox"
            checked={values.agreed}
            onChange={(e) => onChange('agreed', e.target.checked)}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? 'er-terms-error' : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-(--er-primary) focus:outline-none"
          />
          <span>
            {termsText}
            <span className="text-(--er-danger)" aria-hidden="true">
              {' '}*
            </span>
          </span>
        </label>
        {termsUrl && (
          <a
            href={termsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-sm font-semibold text-(--er-primary-text) underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--er-ring)"
          >
            {t.viewTerms}
          </a>
        )}
        {termsError && (
          <p id="er-terms-error" className="mt-1.5 text-sm font-medium text-(--er-danger)">
            {termsError}
          </p>
        )}
      </div>
    </section>
  )
}
