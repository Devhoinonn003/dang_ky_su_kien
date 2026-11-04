import { useCallback, useRef, useState } from 'react'
import { buildDiscountRequest } from '../lib/request'
import type { TextKey } from '../i18n'
import type { DiscountResult, RegistrationApi } from '../types'

export type DiscountState =
  | { status: 'idle' }
  | { status: 'loading' }
  /** Either a server message (shown verbatim) or a local i18n key. */
  | { status: 'error'; message: string }
  | { status: 'error-key'; key: TextKey }
  | { status: 'applied'; code: string; data: DiscountResult }

/**
 * Discount code state machine.
 * Changing the code or the ticket drops an applied code; stale responses are ignored.
 */
export function useDiscount(api: RegistrationApi) {
  const [code, setCodeState] = useState('')
  const [state, setState] = useState<DiscountState>({ status: 'idle' })
  const requestId = useRef(0)

  const clear = useCallback(() => {
    requestId.current += 1 // ignore any in-flight response
    setState({ status: 'idle' })
  }, [])

  const setCode = useCallback(
    (next: string) => {
      setCodeState(next)
      clear()
    },
    [clear],
  )

  const apply = useCallback(
    async (ticketCode: string | undefined) => {
      const normalized = code.trim().toUpperCase()
      if (!normalized) return setState({ status: 'error-key', key: 'discountEmpty' })
      if (!ticketCode) return setState({ status: 'error-key', key: 'discountNeedTicket' })

      const id = ++requestId.current
      setState({ status: 'loading' })
      const response = await api.checkDiscount(buildDiscountRequest(normalized, ticketCode))
      if (id !== requestId.current) return
      setState(
        response.ok
          ? { status: 'applied', code: normalized, data: response.data }
          : { status: 'error', message: response.message },
      )
    },
    [api, code],
  )

  const reset = useCallback(() => {
    setCodeState('')
    clear()
  }, [clear])

  /** Server messages are in the page language; drop them when it changes. */
  const dropServerMessage = useCallback(() => {
    setState((prev) => (prev.status === 'error' ? { status: 'idle' } : prev))
  }, [])

  const applied = state.status === 'applied' ? state : null
  return { code, setCode, state, apply, clear, reset, applied, dropServerMessage }
}
