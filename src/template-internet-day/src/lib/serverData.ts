import { MIN_SESSIONS_FOR_PICKER } from '../config'
import type { Language, ServerData, Session, TicketType } from '../types'
import { formatDate, formatTimeRange, toTime } from './format'

export interface SafeServerData {
  eventName: string
  ticketTypes: TicketType[]
  sessions: Session[]
  /** True when the guest must pick a day. */
  needsSession: boolean
}

/** Missing or malformed server data becomes empty lists, never an error. */
export function normalizeServerData(serverData: ServerData | undefined): SafeServerData {
  const tickets = Array.isArray(serverData?.ticket_types) ? serverData.ticket_types : []
  const sessions = Array.isArray(serverData?.sessions) ? serverData.sessions : []
  const validSessions = sessions.filter((s) => s && typeof s.session_code === 'string')
  return {
    eventName: typeof serverData?.event_name === 'string' ? serverData.event_name : '',
    ticketTypes: tickets.filter((t) => t && typeof t.ticket_code === 'string'),
    sessions: validSessions,
    needsSession: validSessions.length >= MIN_SESSIONS_FOR_PICKER,
  }
}

export type TicketStatus = 'available' | 'sold_out' | 'not_on_sale' | 'sale_ended'

/** Sold out, or outside the sale window: shown but not selectable. */
export function getTicketStatus(ticket: TicketType, now: number): TicketStatus {
  if (!(Number(ticket.available_quantity) > 0)) return 'sold_out'
  const start = toTime(ticket.sale_start_time)
  const end = toTime(ticket.sale_end_time)
  if (start !== null && now < start) return 'not_on_sale'
  if (end !== null && now > end) return 'sale_ended'
  return 'available'
}

/** "Thứ Năm, 10 tháng 12, 2026, 08:00 – 17:00", falling back to the session name or code. */
export function describeSession(session: Session | undefined, language: Language): string {
  if (!session) return ''
  const parts = [formatDate(session.start_time, language), formatTimeRange(session.start_time, session.end_time, language)]
  return parts.filter(Boolean).join(', ') || session.name || session.session_code
}
