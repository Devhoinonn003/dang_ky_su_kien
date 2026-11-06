import type { Dictionary } from '../i18n'
import type { AttendeeFieldDef, FieldKey, FormErrors, FormValues } from '../formFields'
import { Field } from './Field'

interface AttendeeSectionProps {
  t: Dictionary
  fields: AttendeeFieldDef[]
  values: FormValues
  errors: FormErrors
  onChange: <K extends FieldKey>(key: K, value: FormValues[K]) => void
  onBlur: (key: FieldKey) => void
}

/** Attendee inputs rendered from ATTENDEE_FIELDS, one "label : input" row each. */
export function AttendeeSection({ t, fields, values, errors, onChange, onBlur }: AttendeeSectionProps) {
  return (
    <section aria-label={t.stepInfo} className="grid gap-y-2.5 md:gap-y-[clamp(8px,0.625vw,12px)]">
      {fields.map((field) => {
        const error = errors[field.key]
        return (
          <Field
            key={field.key}
            id={field.id}
            type={field.type}
            inputMode={field.inputMode}
            autoComplete={field.autoComplete}
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
    </section>
  )
}
