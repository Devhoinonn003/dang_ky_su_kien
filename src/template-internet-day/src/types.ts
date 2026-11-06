/**
 * Types copied verbatim from the specification ("Dữ liệu đầu vào" and "API").
 * Field names must not be renamed. Only RegistrationContent is designed by the
 * template author and mirrors `defaultData` in schema.json.
 */

export type Language = 'vi' | 'en'
export type LocalizedText = { vi: string; en: string }

export interface TicketType {
  id: number
  ticket_name: string
  ticket_code: string        // sent to the API by this code
  price: string              // numeric string, e.g. "0.00", "150000.00"
  total_quantity: number
  available_quantity: number
  sold_quantity: number
  sale_start_time: string    // ISO 8601
  sale_end_time: string
  description: string | null
}

export interface Session {
  id: number
  name: string
  session_code: string       // sent to the API by this code
  start_time: string
  end_time: string
  description: string | null
}

export interface ServerData {
  event_name: string
  ticket_types: TicketType[]
  sessions: Session[]
}

export interface RegistrationPageProps {
  content: { defaultData: RegistrationContent }   // defaultData of schema.json
  language: Language
  serverData?: ServerData        // may be missing in preview
  isPreview?: boolean
  api: RegistrationApi
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string }

export interface DiscountRequest {
  discount_code: string
  ticket_types: { ticket_type: string; quantity: number }[]   // ticket_type = ticket_code
}
export interface DiscountResult {
  original_total_price: string | number
  discount_total_amount: string | number
  discounted_total_price: string | number
}

export interface HolderInfo {
  display_name: string
  email: string
  phone: string
  company?: string
  position?: string
}
export interface RegistrationRequest {
  order_issuer_display_name: string
  order_issuer_email: string
  order_issuer_phone: string
  order_issuer_company?: string
  order_issuer_position?: string
  ticket_type: Record<string, number>                  // { [ticket_code]: 1 }
  ticket_holder_infos: Record<string, HolderInfo[]>    // { [ticket_code]: [ticket holder] }
  registered_session: string[]                         // [session_code] or []
  language_code: Language
  discount_code?: string                               // only after a successful apply
}
export interface RegistrationResult {
  ticket_code: string[]
  qrcode_url: (string | null)[]
  order: { reference_id: string }
}

export interface RegistrationApi {
  checkDiscount(req: DiscountRequest): Promise<ApiResult<DiscountResult>>
  register(req: RegistrationRequest): Promise<ApiResult<RegistrationResult>>
}

/* ------------------------------------------------------------------ */
/* Content (designed by the template author = schema.json defaultData) */
/* ------------------------------------------------------------------ */

export interface AgendaItem {
  time: string
  label: LocalizedText
}

export interface RegistrationContent {
  customCSS: string
  metadata: {
    title: LocalizedText
    description: LocalizedText
    icon: string
  }
  Theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    /** Background of inputs and light cards. */
    surfaceColor: string
    /** Form title gradient, left to right. */
    headingFromColor: string
    headingToColor: string
    /** One of RADIUS_PRESETS in config.ts. */
    radius: string
  }
  Hero: {
    /** One of HERO_LAYOUTS in config.ts: text over the banner, or banner then text. */
    layout: string
    /** Overlay layout only: space kept above the text, in % of screen width. */
    overlayOffsetMobile: number
    overlayOffsetDesktop: number
    bannerDesktop: string
    bannerMobile: string
    logo: string
    tagline: LocalizedText
    title: LocalizedText
    time: LocalizedText
    location: LocalizedText
    description: LocalizedText
  }
  Agenda: AgendaItem[]
  Form: {
    /** Artwork behind the registration form; the form sits on top of it. */
    backgroundDesktop: string
    backgroundMobile: string
    /** "Phiên tham dự" group from the design; display only, the choice is not sent to register(). */
    showAttendanceSessions: boolean
    attendanceSessions: { code: string; startsRow: boolean; label: LocalizedText }[]
    showDiscount: boolean
    showCompany: boolean
    showPosition: boolean
    termsText: LocalizedText
    termsUrl: string
  }
  Confirmation: {
    thankYouTitle: LocalizedText
    thankYouMessage: LocalizedText
  }
  Organizer: {
    name: LocalizedText
    contactEmail: string
    hotline: string
  }
}
