import { VALIDATION } from '../config'

/** Removes spaces, dots and dashes people often type in phone numbers. */
export function normalizePhone(phone: string): string {
  return phone.replace(VALIDATION.phoneSeparators, '')
}

export function isValidEmail(email: string): boolean {
  return VALIDATION.email.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  return VALIDATION.phone.test(normalizePhone(phone))
}
