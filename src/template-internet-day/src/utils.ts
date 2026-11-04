import schema from '../schema.json';
import type {
  Language,
  LocalizedText,
  RegistrationContent,
  ServerData,
  Session,
  TicketType,
} from './types';

/* ------------------------------------------------------------------ */
/* Content resolution: missing fields fall back to schema defaults    */
/* ------------------------------------------------------------------ */

const SCHEMA_DEFAULTS = schema.defaultData as RegistrationContent;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Builds an empty item with the same shape (used for repeater items). */
function blankOf<T>(shape: T): T {
  if (typeof shape === 'string') return '' as T;
  if (Array.isArray(shape)) return [] as T;
  if (isPlainObject(shape)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(shape)) out[key] = blankOf(val);
    return out as T;
  }
  return shape;
}

/**
 * Merges an unknown value onto a typed default, key by key.
 * Values with the wrong primitive type are ignored so that a broken
 * editor value never crashes the page.
 */
function mergeDeep<T>(fallback: T, value: unknown): T {
  if (value === undefined || value === null) return fallback;

  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return fallback;
    const itemShape: unknown = fallback.length > 0 ? blankOf(fallback[0]) : undefined;
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => (itemShape === undefined ? item : mergeDeep(itemShape, item))) as T;
  }

  if (isPlainObject(fallback)) {
    if (!isPlainObject(value)) return fallback;
    const out: Record<string, unknown> = {};
    for (const [key, def] of Object.entries(fallback)) out[key] = mergeDeep(def, value[key]);
    return out as T;
  }

  return typeof value === typeof fallback ? (value as T) : fallback;
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns a complete content object, filling any gap from schema.json defaults. */
export function resolveContent(raw: unknown): RegistrationContent {
  const data = isPlainObject(raw) ? raw.defaultData : undefined;
  const merged = mergeDeep(SCHEMA_DEFAULTS, data);

  // Colors must be valid hex values, otherwise the theme would break.
  const Theme = { ...merged.Theme };
  for (const key of Object.keys(Theme) as (keyof typeof Theme)[]) {
    if (!HEX_COLOR.test(Theme[key])) Theme[key] = SCHEMA_DEFAULTS.Theme[key];
  }

  return { ...merged, Theme };
}

/** Picks the text for the current language, falling back to the other one. */
export function localize(text: LocalizedText | undefined, language: Language): string {
  if (!text) return '';
  const other: Language = language === 'vi' ? 'en' : 'vi';
  return (text[language] || text[other] || '').trim();
}

/* ------------------------------------------------------------------ */
/* Server data                                                         */
/* ------------------------------------------------------------------ */

export interface SafeServerData {
  eventName: string;
  ticketTypes: TicketType[];
  sessions: Session[];
}

/** Missing or malformed server data becomes empty lists. */
export function normalizeServerData(serverData: ServerData | undefined): SafeServerData {
  const tickets = Array.isArray(serverData?.ticket_types) ? serverData.ticket_types : [];
  const sessions = Array.isArray(serverData?.sessions) ? serverData.sessions : [];
  return {
    eventName: typeof serverData?.event_name === 'string' ? serverData.event_name : '',
    ticketTypes: tickets.filter((t) => t && typeof t.ticket_code === 'string'),
    sessions: sessions.filter((s) => s && typeof s.session_code === 'string'),
  };
}

export type TicketStatus = 'available' | 'sold_out' | 'not_on_sale' | 'sale_ended';

function toTime(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/** Sold out, or outside the sale window: shown but not selectable. */
export function getTicketStatus(ticket: TicketType, now: number): TicketStatus {
  if (!(Number(ticket.available_quantity) > 0)) return 'sold_out';
  const start = toTime(ticket.sale_start_time);
  const end = toTime(ticket.sale_end_time);
  if (start !== null && now < start) return 'not_on_sale';
  if (end !== null && now > end) return 'sale_ended';
  return 'available';
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const priceFormatter = new Intl.NumberFormat('vi-VN');

export function parsePrice(price: string | number | null | undefined): number {
  const n = typeof price === 'number' ? price : Number.parseFloat(price ?? '');
  return Number.isFinite(n) ? n : 0;
}

/** "0 đ" / "150.000 đ" using Intl.NumberFormat('vi-VN'). */
export function formatPrice(price: string | number | null | undefined): string {
  return `${priceFormatter.format(parsePrice(price))} đ`;
}

const LOCALES: Record<Language, string> = { vi: 'vi-VN', en: 'en-GB' };

export function formatDate(iso: string | undefined, language: Language): string {
  const t = toTime(iso);
  if (t === null) return '';
  return new Intl.DateTimeFormat(LOCALES[language], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(t);
}

export function formatTimeRange(start: string | undefined, end: string | undefined, language: Language): string {
  const s = toTime(start);
  if (s === null) return '';
  const fmt = new Intl.DateTimeFormat(LOCALES[language], { hour: '2-digit', minute: '2-digit' });
  const e = toTime(end);
  return e === null ? fmt.format(s) : `${fmt.format(s)} – ${fmt.format(e)}`;
}

export function formatDateTime(iso: string | undefined, language: Language): string {
  const t = toTime(iso);
  if (t === null) return '';
  return new Intl.DateTimeFormat(LOCALES[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(t);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?\d{9,11}$/;

/** Removes spaces, dots and dashes that people often type in phone numbers. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(phone));
}

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

function luminance(hex: string): number {
  const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const channels = [1, 3, 5].map((i) => {
    const c = Number.parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Picks black or white text, whichever has more contrast on the given color. */
export function readableTextOn(hex: string): string {
  return luminance(hex) > 0.179 ? '#0b1220' : '#ffffff';
}
