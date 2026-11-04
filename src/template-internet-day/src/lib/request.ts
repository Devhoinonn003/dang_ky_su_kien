import { TICKET_QUANTITY } from '../config'
import type { AttendeeFieldDef, FormValues } from '../formFields'
import type { DiscountRequest, HolderInfo, Language, RegistrationRequest } from '../types'

interface BuildRequestInput {
  values: FormValues
  fields: AttendeeFieldDef[]
  ticketCode: string
  needsSession: boolean
  language: Language
  /** Only set after checkDiscount succeeded. */
  discountCode?: string
}

/**
 * Maps the form to the register() payload described in the spec.
 * Field-to-payload mapping comes from ATTENDEE_FIELDS (issuerKey / holderKey).
 * The guest attends alone, so the ticket holder equals the order issuer.
 */
export function buildRegistrationRequest(input: BuildRequestInput): RegistrationRequest {
  const { values, fields, ticketCode, needsSession, language, discountCode } = input
  const issuer: Record<string, string> = {}
  const holder: Record<string, string> = {}

  for (const field of fields) {
    const raw = values[field.key].trim()
    const value = field.normalize ? field.normalize(raw) : raw
    // Optional fields are omitted when empty; required ones are guaranteed by validation.
    if (!value && !field.required) continue
    issuer[field.issuerKey] = value
    holder[field.holderKey] = value
  }

  return {
    ...(issuer as Pick<RegistrationRequest, 'order_issuer_display_name' | 'order_issuer_email' | 'order_issuer_phone'>),
    ticket_type: { [ticketCode]: TICKET_QUANTITY },
    ticket_holder_infos: { [ticketCode]: [holder as unknown as HolderInfo] },
    registered_session: needsSession && values.sessionCode ? [values.sessionCode] : [],
    language_code: language,
    ...(discountCode && { discount_code: discountCode }),
  }
}

export function buildDiscountRequest(code: string, ticketCode: string): DiscountRequest {
  return { discount_code: code, ticket_types: [{ ticket_type: ticketCode, quantity: TICKET_QUANTITY }] }
}
