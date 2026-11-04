import { useCallback, useMemo, useState } from 'react'
import {
  EMPTY_FORM,
  fieldOrder,
  validateField,
  validateForm,
  type FieldKey,
  type FormErrors,
  type FormValues,
  type ValidationContext,
} from '../formFields'

/** Form values, inline errors and validation timing (on blur, then live after a submit). */
export function useRegistrationForm(ctx: ValidationContext) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const setField = useCallback(
    <K extends FieldKey>(key: K, value: FormValues[K]) => {
      const next = { ...values, [key]: value }
      setValues(next)
      // Re-validate live once the guest has seen an error for this field.
      if (submitAttempted || errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: validateField(key, next, ctx) }))
      }
    },
    [values, submitAttempted, errors, ctx],
  )

  const blurField = useCallback(
    (key: FieldKey) => {
      // Skip empty fields before the first submit, to avoid nagging on tab-through.
      const raw = values[key]
      if (typeof raw === 'string' && raw.trim() === '' && !submitAttempted) return
      setErrors((prev) => ({ ...prev, [key]: validateField(key, values, ctx) }))
    },
    [values, submitAttempted, ctx],
  )

  /** Validates everything; returns the invalid keys in on-screen order. */
  const validateAll = useCallback((): FieldKey[] => {
    setSubmitAttempted(true)
    const next = validateForm(values, ctx)
    setErrors(next)
    return fieldOrder(ctx).filter((key) => next[key])
  }, [values, ctx])

  const reset = useCallback(() => {
    setValues(EMPTY_FORM)
    setErrors({})
    setSubmitAttempted(false)
  }, [])

  return useMemo(
    () => ({ values, errors, setField, blurField, validateAll, reset }),
    [values, errors, setField, blurField, validateAll, reset],
  )
}
