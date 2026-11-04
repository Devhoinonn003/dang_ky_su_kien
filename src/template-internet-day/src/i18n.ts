import type { Language } from './types';

/**
 * Fixed UI labels. Event-specific text lives in schema.json, never here.
 */
const vi = {
  langName: 'Tiếng Việt',
  skipToForm: 'Bỏ qua, tới form đăng ký',
  timeLabel: 'Thời gian',
  venueLabel: 'Địa điểm',
  registerNow: 'Đăng ký ngay',
  agenda: 'Lịch trình',
  freeBadge: 'Miễn phí',

  stepTicket: 'Chọn loại vé',
  stepSession: 'Chọn ngày tham dự',
  stepInfo: 'Thông tin người tham dự',
  stepDiscount: 'Mã ưu đãi',
  stepSummary: 'Tóm tắt đăng ký',
  optional: 'không bắt buộc',
  required: 'bắt buộc',

  noTickets: 'Chưa có loại vé',
  noTicketsHint: 'Ban tổ chức sẽ sớm mở bán. Vui lòng quay lại sau.',
  soldOut: 'Hết vé',
  notOnSale: 'Chưa mở bán',
  saleEnded: 'Đã ngừng bán',
  remaining: (n: number) => `Còn ${n.toLocaleString('vi-VN')} vé`,
  quantityOne: 'Số lượng: 1 vé',
  opensAt: (d: string) => `Mở bán từ ${d}`,

  fullName: 'Họ và tên',
  fullNamePlaceholder: 'Nguyễn Văn A',
  email: 'Email',
  emailPlaceholder: 'ban@congty.vn',
  emailHint: 'Vé và mã QR sẽ được gửi tới địa chỉ này.',
  phone: 'Số điện thoại',
  phonePlaceholder: '0912 345 678',
  company: 'Công ty',
  companyPlaceholder: 'Tên công ty / tổ chức',
  jobTitle: 'Chức danh',
  jobTitlePlaceholder: 'Ví dụ: Trưởng phòng kỹ thuật',
  viewTerms: 'Xem điều khoản',

  discountLabel: 'Nhập mã ưu đãi (nếu có)',
  discountPlaceholder: 'VD: SALE10',
  apply: 'Áp dụng',
  applying: 'Đang kiểm tra…',
  removeCode: 'Bỏ mã',
  discountApplied: (code: string) => `Đã áp dụng mã ${code}`,
  discountNeedTicket: 'Vui lòng chọn loại vé trước khi áp mã.',
  discountEmpty: 'Vui lòng nhập mã ưu đãi.',

  summaryTicket: 'Loại vé',
  summarySession: 'Ngày tham dự',
  summarySubtotal: 'Tạm tính',
  summaryDiscount: 'Giảm giá',
  summaryTotal: 'Tổng cộng',
  notSelected: 'Chưa chọn',
  submit: 'Gửi đăng ký',
  submitting: 'Đang xử lý…',
  previewNotice: 'Chế độ xem trước: nút Gửi không tạo đăng ký thật.',
  previewSubmitted: 'Form hợp lệ. Ở chế độ xem trước nên đăng ký không được gửi.',
  fixErrors: (n: number) => `Còn ${n} mục cần sửa. Vui lòng kiểm tra các ô được đánh dấu.`,

  errFullName: 'Vui lòng nhập họ và tên.',
  errEmailEmpty: 'Vui lòng nhập email.',
  errEmailFormat: 'Vui lòng nhập email đúng định dạng, ví dụ ten@congty.com',
  errPhoneEmpty: 'Vui lòng nhập số điện thoại.',
  errPhoneFormat: 'Vui lòng nhập số điện thoại gồm 9–11 chữ số, có thể bắt đầu bằng dấu +, ví dụ 0901234567',
  errTicket: 'Vui lòng chọn một loại vé.',
  errSession: 'Vui lòng chọn một ngày tham dự.',
  errTerms: 'Vui lòng tick ô đồng ý điều khoản để tiếp tục.',

  confirmRegistered: 'Thông tin đăng ký',
  confirmTicketCode: 'Mã vé',
  confirmReference: 'Mã đơn',
  confirmName: 'Họ và tên',
  confirmQrAlt: (code: string) => `Mã QR của vé ${code}`,
  confirmEmailSent: (email: string) => `Đã gửi email xác nhận tới ${email}`,
  registerAgain: 'Đăng ký mới',
  copy: 'Sao chép',
  copied: 'Đã chép',

  contact: 'Liên hệ',
  organizer: 'Ban tổ chức',
};

export type Dictionary = typeof vi;

const en: Dictionary = {
  langName: 'English',
  skipToForm: 'Skip to registration form',
  timeLabel: 'Time',
  venueLabel: 'Venue',
  registerNow: 'Register now',
  agenda: 'Agenda',
  freeBadge: 'Free',

  stepTicket: 'Choose a ticket',
  stepSession: 'Choose a day',
  stepInfo: 'Attendee details',
  stepDiscount: 'Discount code',
  stepSummary: 'Summary',
  optional: 'optional',
  required: 'required',

  noTickets: 'No ticket types yet',
  noTicketsHint: 'The organizer will open registration soon. Please check back later.',
  soldOut: 'Sold out',
  notOnSale: 'Not on sale yet',
  saleEnded: 'Sales closed',
  remaining: (n: number) => `${n.toLocaleString('en-US')} left`,
  quantityOne: 'Quantity: 1 ticket',
  opensAt: (d: string) => `On sale from ${d}`,

  fullName: 'Full name',
  fullNamePlaceholder: 'Jane Doe',
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  emailHint: 'Your ticket and QR code will be sent to this address.',
  phone: 'Phone number',
  phonePlaceholder: '+84 912 345 678',
  company: 'Company',
  companyPlaceholder: 'Company / organization',
  jobTitle: 'Job title',
  jobTitlePlaceholder: 'e.g. Engineering Manager',
  viewTerms: 'Read the terms',

  discountLabel: 'Discount code (if any)',
  discountPlaceholder: 'e.g. SALE10',
  apply: 'Apply',
  applying: 'Checking…',
  removeCode: 'Remove code',
  discountApplied: (code: string) => `Code ${code} applied`,
  discountNeedTicket: 'Please choose a ticket before applying a code.',
  discountEmpty: 'Please enter a discount code.',

  summaryTicket: 'Ticket',
  summarySession: 'Day',
  summarySubtotal: 'Subtotal',
  summaryDiscount: 'Discount',
  summaryTotal: 'Total',
  notSelected: 'Not selected',
  submit: 'Submit registration',
  submitting: 'Processing…',
  previewNotice: 'Preview mode: Submit does not create a real registration.',
  previewSubmitted: 'The form is valid. Nothing was sent because this is a preview.',
  fixErrors: (n: number) =>
    `${n} field${n > 1 ? 's' : ''} need${n > 1 ? '' : 's'} attention. Please check the highlighted fields.`,

  errFullName: 'Please enter your full name.',
  errEmailEmpty: 'Please enter your email.',
  errEmailFormat: 'Please enter a valid email, for example name@company.com',
  errPhoneEmpty: 'Please enter your phone number.',
  errPhoneFormat: 'Please enter a phone number with 9–11 digits, optionally starting with +, for example 0901234567',
  errTicket: 'Please choose a ticket type.',
  errSession: 'Please choose a day to attend.',
  errTerms: 'Please tick the box to accept the terms.',

  confirmRegistered: 'Registration details',
  confirmTicketCode: 'Ticket code',
  confirmReference: 'Order reference',
  confirmName: 'Full name',
  confirmQrAlt: (code: string) => `QR code for ticket ${code}`,
  confirmEmailSent: (email: string) => `A confirmation email has been sent to ${email}`,
  registerAgain: 'New registration',
  copy: 'Copy',
  copied: 'Copied',

  contact: 'Contact',
  organizer: 'Organizer',
};

const dictionaries: Record<Language, Dictionary> = { vi, en };

export function getDictionary(language: Language): Dictionary {
  return dictionaries[language] ?? vi;
}
