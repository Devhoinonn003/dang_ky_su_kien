/**
 * Declarative description of the attendee form.
 *
 * To add, remove or reorder an input, edit ATTENDEE_FIELDS only: rendering,
 * validation, focus order and the register() payload are all derived from it.
 * Labels come from i18n.ts; visibility toggles come from schema.json (Form block).
 */
import type { HTMLAttributes } from 'react'
import type { TextKey } from './i18n'
import { isValidEmail, isValidPhone, normalizePhone } from './lib/validation'
import type { HolderInfo, RegistrationContent, RegistrationRequest } from './types'

export interface FormValues {
  fullName: string
  email: string
  phone: string
  company: string
  position: string
  ticketCode: string
  sessionCode: string
  agreed: boolean
}

export type FieldKey = keyof FormValues
export type AttendeeKey = 'fullName' | 'email' | 'phone' | 'company' | 'position'
export type FormErrors = Partial<Record<FieldKey, TextKey>>

/** register() payload keys that hold a plain string. */
type IssuerKey = {
  [K in keyof RegistrationRequest]-?: RegistrationRequest[K] extends string | undefined
    ? K extends `order_issuer_${string}` ? K : never
    : never
}[keyof RegistrationRequest]

export interface AttendeeFieldDef {
  key: AttendeeKey
  /** DOM id; also used to focus the field when it is invalid. */
  id: string
  type: 'text' | 'email' | 'tel'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete: string
  label: TextKey
  placeholder: TextKey
  hint?: TextKey
  required: boolean
  /** Visibility controlled by the organizer in the editor. */
  isVisible?: (form: RegistrationContent['Form']) => boolean
  /** Returns an i18n key describing how to fix the value, or undefined when valid. */
  validate?: (value: string) => TextKey | undefined
  /** Cleans the value before it is sent. */
  normalize?: (value: string) => string
  /** Where the value goes in the register() payload. */
  issuerKey: IssuerKey
  holderKey: keyof HolderInfo
}

export const ATTENDEE_FIELDS: AttendeeFieldDef[] = [
  {
    key: 'fullName',
    id: 'er-fullname',
    type: 'text',
    autoComplete: 'name',
    label: 'fullName',
    placeholder: 'fullNamePlaceholder',
    required: true,
    validate: (v) => (v.trim() ? undefined : 'errFullName'),
    issuerKey: 'order_issuer_display_name',
    holderKey: 'display_name',
  },
  {
    key: 'email',
    id: 'er-email',
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    label: 'email',
    placeholder: 'emailPlaceholder',
    hint: 'emailHint',
    required: true,
    validate: (v) => (!v.trim() ? 'errEmailEmpty' : isValidEmail(v) ? undefined : 'errEmailFormat'),
    issuerKey: 'order_issuer_email',
    holderKey: 'email',
  },
  {
    key: 'phone',
    id: 'er-phone',
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    label: 'phone',
    placeholder: 'phonePlaceholder',
    required: true,
    validate: (v) => (!v.trim() ? 'errPhoneEmpty' : isValidPhone(v) ? undefined : 'errPhoneFormat'),
    normalize: normalizePhone,
    issuerKey: 'order_issuer_phone',
    holderKey: 'phone',
  },
  {
    key: 'company',
    id: 'er-company',
    type: 'text',
    autoComplete: 'organization',
    label: 'company',
    placeholder: 'companyPlaceholder',
    required: false,
    isVisible: (form) => form.showCompany,
    issuerKey: 'order_issuer_company',
    holderKey: 'company',
  },
  {
    key: 'position',
    id: 'er-position',
    type: 'text',
    autoComplete: 'organization-title',
    label: 'jobTitle',
    placeholder: 'jobTitlePlaceholder',
    required: false,
    isVisible: (form) => form.showPosition,
    issuerKey: 'order_issuer_position',
    holderKey: 'position',
  },
]

/** Non-text fields: DOM selectors used to focus them when invalid. */
export const CHOICE_FIELD_SELECTORS: Record<'ticketCode' | 'sessionCode' | 'agreed', string> = {
  ticketCode: 'input[name="er-ticket"]:not(:disabled)',
  sessionCode: 'input[name="er-session"]',
  agreed: '#er-terms',
}

export const EMPTY_FORM: FormValues = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  ticketCode: '',
  sessionCode: '',
  agreed: false,
}

export function visibleAttendeeFields(form: RegistrationContent['Form']): AttendeeFieldDef[] {
  return ATTENDEE_FIELDS.filter((f) => f.isVisible?.(form) ?? true)
}

/** Validation context that does not come from the inputs themselves. */
export interface ValidationContext {
  fields: AttendeeFieldDef[]
  needsSession: boolean
  /** Codes that can currently be chosen; a stale selection counts as empty. */
  selectableTickets: ReadonlySet<string>
  sessionCodes: ReadonlySet<string>
}

export function validateField(key: FieldKey, values: FormValues, ctx: ValidationContext): TextKey | undefined {
  switch (key) {
    case 'ticketCode':
      return ctx.selectableTickets.has(values.ticketCode) ? undefined : 'errTicket'
    case 'sessionCode':
      return !ctx.needsSession || ctx.sessionCodes.has(values.sessionCode) ? undefined : 'errSession'
    case 'agreed':
      return values.agreed ? undefined : 'errTerms'
    default: {
      const def = ctx.fields.find((f) => f.key === key)
      return def?.validate?.(values[key])
    }
  }
}

/** Fields in on-screen order; the first invalid one receives focus. */
export function fieldOrder(ctx: ValidationContext): FieldKey[] {
  return [...ctx.fields.map((f) => f.key), 'ticketCode', 'sessionCode', 'agreed']
}

export function validateForm(values: FormValues, ctx: ValidationContext): FormErrors {
  const errors: FormErrors = {}
  for (const key of fieldOrder(ctx)) {
    const error = validateField(key, values, ctx)
    if (error) errors[key] = error
  }
  return errors
}
