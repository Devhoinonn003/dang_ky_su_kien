import schema from '../../schema.json'
import { SAFE_URL } from '../config'
import type { Language, LocalizedText, RegistrationContent } from '../types'

/**
 * Content resolution driven by `editable` in schema.json.
 *
 * Every value coming from the editor is checked against its field definition
 * (type, options, min/max). Invalid or missing values fall back to the schema
 * default, so a broken editor value never crashes the page. Adding a field to
 * schema.json needs no change here.
 */

export interface EditableNode {
  type: string
  label?: string
  fields?: Record<string, EditableNode>
  options?: { label: string; value: string }[]
  default?: unknown
  min?: number
  max?: number
}

const EDITABLE = schema.editable as unknown as Record<string, EditableNode>
const DEFAULTS = schema.defaultData as unknown as RegistrationContent
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Empty value for a field, used for repeater items that miss a field. */
function blankFor(node: EditableNode): unknown {
  switch (node.type) {
    case 'block':
      return Object.fromEntries(Object.entries(node.fields ?? {}).map(([k, child]) => [k, blankFor(child)]))
    case 'repeater':
      return []
    case 'toggle':
      return false
    case 'number':
      return node.min ?? 0
    case 'select':
      return node.default ?? node.options?.[0]?.value ?? ''
    default:
      return ''
  }
}

function sanitize(value: unknown, fallback: unknown, node: EditableNode): unknown {
  switch (node.type) {
    case 'block': {
      const source = isPlainObject(value) ? value : {}
      const base = isPlainObject(fallback) ? fallback : {}
      const out: Record<string, unknown> = {}
      for (const [key, child] of Object.entries(node.fields ?? {})) {
        out[key] = sanitize(source[key], base[key] ?? blankFor(child), child)
      }
      return out
    }
    case 'repeater': {
      if (!Array.isArray(value)) return fallback
      const itemNode: EditableNode = { type: 'block', fields: node.fields }
      return value.filter(isPlainObject).map((item) => sanitize(item, blankFor(itemNode), itemNode))
    }
    case 'toggle':
      return typeof value === 'boolean' ? value : fallback
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
      return Math.min(node.max ?? Infinity, Math.max(node.min ?? -Infinity, value))
    }
    case 'select':
      return node.options?.some((o) => o.value === value) ? value : fallback
    case 'color':
      return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback
    case 'image':
    case 'url':
      // Empty is allowed (hides the element); unsafe schemes such as javascript: are dropped.
      return typeof value === 'string' && (value === '' || SAFE_URL.test(value)) ? value : fallback
    default:
      return typeof value === 'string' ? value : fallback
  }
}

/** Returns a complete, valid content object from whatever the host passed in. */
export function resolveContent(content: unknown): RegistrationContent {
  const data = isPlainObject(content) ? content.defaultData : undefined
  return sanitize(data, DEFAULTS, { type: 'block', fields: EDITABLE }) as RegistrationContent
}

/** Picks the text for the current language, falling back to the other one. */
export function localize(text: LocalizedText | undefined, language: Language): string {
  if (!text) return ''
  const other: Language = language === 'vi' ? 'en' : 'vi'
  return (text[language] || text[other] || '').trim()
}
