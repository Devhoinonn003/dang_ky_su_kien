import type {
  ApiResult,
  DiscountRequest,
  DiscountResult,
  Language,
  RegistrationApi,
  RegistrationRequest,
  RegistrationResult,
  ServerData,
} from '../template-internet-day/src/types'

const DELAY_MS = 800

type MessageKey = 'invalidCode' | 'duplicate' | 'soldOut' | 'rateLimited' | 'network'

const MESSAGES: Record<Language, Record<MessageKey, string>> = {
  vi: {
    invalidCode: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
    duplicate:
      'Chưa thể hoàn tất đăng ký. Nếu bạn đã đăng ký sự kiện này trước đó, vui lòng kiểm tra hộp thư email.',
    soldOut: 'Loại vé này hiện không còn đủ số lượng. Vui lòng chọn loại vé khác.',
    rateLimited: 'Bạn thao tác hơi nhanh, vui lòng thử lại sau ít phút.',
    network: 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.',
  },
  en: {
    invalidCode: 'The discount code is invalid or has expired.',
    duplicate:
      'We could not complete your registration. If you have registered for this event before, please check your email inbox.',
    soldOut: 'There are not enough tickets of this type left. Please choose another ticket type.',
    rateLimited: 'You are going a bit fast. Please try again in a few minutes.',
    network: 'Unable to connect to the system. Please check your network and try again.',
  },
}

/** Prefix of the email -> error message (table in the specification). */
const REGISTER_ERRORS: [prefix: string, key: MessageKey][] = [
  ['trung', 'duplicate'],
  ['hetve', 'soldOut'],
  ['nhanh', 'rateLimited'],
  ['matmang', 'network'],
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function randomCode(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export interface MockApiCall {
  name: 'checkDiscount' | 'register'
  request: DiscountRequest | RegistrationRequest
}

interface MockApiOptions {
  /** checkDiscount has no language field, so the demo tells the mock which one is active. */
  getLanguage: () => Language
  /** Ticket prices are looked up here to compute the discount. */
  getServerData: () => ServerData | undefined
  /** Lets the demo page show how many times each function was called. */
  onCall?: (call: MockApiCall) => void
}

export function createMockApi({ getLanguage, getServerData, onCall }: MockApiOptions): RegistrationApi {
  return {
    async checkDiscount(req): Promise<ApiResult<DiscountResult>> {
      onCall?.({ name: 'checkDiscount', request: req })
      await wait(DELAY_MS)

      if (req.discount_code.trim().toUpperCase() !== 'SALE10') {
        return { ok: false, message: MESSAGES[getLanguage()].invalidCode }
      }

      const tickets = getServerData()?.ticket_types ?? []
      const original = req.ticket_types.reduce((sum, item) => {
        const ticket = tickets.find((t) => t.ticket_code === item.ticket_type)
        return sum + Number.parseFloat(ticket?.price ?? '0') * item.quantity
      }, 0)
      const discount = Math.round(original * 0.1)
      return {
        ok: true,
        data: {
          original_total_price: original.toFixed(2),
          discount_total_amount: discount.toFixed(2),
          discounted_total_price: (original - discount).toFixed(2),
        },
      }
    },

    async register(req): Promise<ApiResult<RegistrationResult>> {
      onCall?.({ name: 'register', request: req })
      await wait(DELAY_MS)

      const language: Language = req.language_code === 'en' ? 'en' : 'vi'
      const email = req.order_issuer_email.trim().toLowerCase()
      const failure = REGISTER_ERRORS.find(([prefix]) => email.startsWith(prefix))
      if (failure) return { ok: false, message: MESSAGES[language][failure[1]] }

      const ticketCode = randomCode(8)
      return {
        ok: true,
        data: {
          ticket_code: [ticketCode],
          // A real, scannable QR image so the confirmation screen looks realistic.
          qrcode_url: [`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${ticketCode}`],
          order: { reference_id: randomCode(8) },
        },
      }
    },
  }
}
