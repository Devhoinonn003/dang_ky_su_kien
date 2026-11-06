import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { getDictionary } from './i18n'
import { CHOICE_FIELD_SELECTORS, visibleAttendeeFields, type FieldKey } from './formFields'
import { useRegistrationForm } from './hooks/useRegistrationForm'
import { useDiscount } from './hooks/useDiscount'
import { localize, resolveContent } from './lib/content'
import { formatPrice, parsePrice } from './lib/format'
import { buildRegistrationRequest } from './lib/request'
import { describeSession, getTicketStatus, normalizeServerData } from './lib/serverData'
import { buildPanelStyle, buildThemeStyle } from './lib/theme'
import { focusRing } from './lib/ui'
import { FORM_FONTS } from './config'
import type { Language, RegistrationPageProps, RegistrationResult } from './types'
import { EventIntro } from './components/EventIntro'
import { Agenda } from './components/Agenda'
import { TicketPicker } from './components/TicketPicker'
import { SessionPicker } from './components/SessionPicker'
import { AttendeeSection } from './components/AttendeeSection'
import { DiscountField } from './components/DiscountField'
import { TermsField } from './components/TermsField'
import { ChoiceGroup } from './components/ChoiceGroup'
import { OrderSummary, type SubmitFeedback } from './components/OrderSummary'
import { Confirmation, type ConfirmationSnapshot } from './components/Confirmation'
import { SiteFooter } from './components/SiteFooter'

interface FormSection {
  id: string
  visible: boolean
  render: () => ReactNode
}

/** Page layout: event intro, agenda, then either the registration form or the confirmation. */
export default function App({ content, language, serverData, isPreview = false, api }: RegistrationPageProps) {
  const lang: Language = language === 'en' ? 'en' : 'vi'
  const t = getDictionary(lang)
  const data = useMemo(() => resolveContent(content), [content])
  const server = useMemo(() => normalizeServerData(serverData), [serverData])
  const themeStyle = useMemo(() => buildThemeStyle(data.Theme), [data.Theme])
  const panelStyle = useMemo(() => buildPanelStyle(data.Theme), [data.Theme])
  const { Form: formContent, Confirmation: confirmationContent, Organizer: organizer, Hero: hero } = data
  const formAnchorId = `er-form-${useId().replace(/:/g, '')}`

  const fields = useMemo(() => visibleAttendeeFields(formContent), [formContent])
  // "now" is fixed per mount so ticket status does not flicker between renders.
  const [now] = useState(() => Date.now())
  const validationCtx = useMemo(
    () => ({
      fields,
      needsSession: server.needsSession,
      selectableTickets: new Set(
        server.ticketTypes.filter((tk) => getTicketStatus(tk, now) === 'available').map((tk) => tk.ticket_code),
      ),
      sessionCodes: new Set(server.sessions.map((s) => s.session_code)),
    }),
    [fields, server, now],
  )
  const form = useRegistrationForm(validationCtx)
  const discount = useDiscount(api)
  const { dropServerMessage: dropDiscountMessage } = discount

  const formRef = useRef<HTMLFormElement>(null)
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback>({ kind: 'none' })
  // Display-only choice from the design ("Phiên tham dự"); register() has no field for it.
  const [attendanceSession, setAttendanceSession] = useState('')
  const [result, setResult] = useState<{ data: RegistrationResult; snapshot: ConfirmationSnapshot } | null>(null)

  // Server messages are written in the page language; drop them when it changes.
  const previousLang = useRef(lang)
  useEffect(() => {
    if (previousLang.current === lang) return
    previousLang.current = lang
    setFeedback((prev) => (prev.kind === 'api-error' || prev.kind === 'preview-ok' ? { kind: 'none' } : prev))
    dropDiscountMessage()
  }, [lang, dropDiscountMessage])

  /* ---------------- derived values ---------------- */

  const { values } = form
  const selectedTicket = validationCtx.selectableTickets.has(values.ticketCode)
    ? server.ticketTypes.find((tk) => tk.ticket_code === values.ticketCode)
    : undefined
  const selectedSession = server.needsSession
    ? server.sessions.find((s) => s.session_code === values.sessionCode)
    : undefined
  const sessionLabel = describeSession(selectedSession, lang)
  const subtotal = parsePrice(selectedTicket?.price)
  const applied = discount.applied
  const discountAmount = applied ? parsePrice(applied.data.discount_total_amount) : null
  const total = applied ? parsePrice(applied.data.discounted_total_price) : subtotal
  const organizerName = localize(organizer.name, lang)

  /* ---------------- handlers ---------------- */

  const setField: typeof form.setField = (key, value) => {
    if (key === 'ticketCode' && value !== values.ticketCode) discount.clear() // a new ticket needs a new apply
    form.setField(key, value)
    if (feedback.kind !== 'none') setFeedback({ kind: 'none' })
  }

  const focusField = (key: FieldKey) => {
    const selector =
      key in CHOICE_FIELD_SELECTORS
        ? CHOICE_FIELD_SELECTORS[key as keyof typeof CHOICE_FIELD_SELECTORS]
        : `#${fields.find((f) => f.key === key)?.id ?? ''}`
    const el = formRef.current?.querySelector<HTMLElement>(selector)
    if (!el) return
    el.focus({ preventScroll: true })
    el.closest('fieldset, div')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const scrollToForm = () =>
    window.requestAnimationFrame(() =>
      document.getElementById(formAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return // one register call per submission

    const invalid = form.validateAll()
    if (invalid.length > 0) {
      setFeedback({ kind: 'invalid', count: invalid.length })
      focusField(invalid[0])
      return
    }
    if (!selectedTicket) return
    if (isPreview) {
      setFeedback({ kind: 'preview-ok' }) // preview never calls register
      return
    }

    const request = buildRegistrationRequest({
      values,
      fields,
      ticketCode: selectedTicket.ticket_code,
      needsSession: server.needsSession,
      language: lang,
      discountCode: applied?.code,
    })

    submittingRef.current = true
    setSubmitting(true)
    setFeedback({ kind: 'none' })
    try {
      const response = await api.register(request)
      if (response.ok) {
        setResult({
          data: response.data,
          snapshot: {
            fullName: request.order_issuer_display_name,
            email: request.order_issuer_email,
            ticketName: selectedTicket.ticket_name,
            sessionLabel,
            totalText: formatPrice(total),
          },
        })
        scrollToForm()
      } else {
        setFeedback({ kind: 'api-error', message: response.message })
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleRegisterAgain = () => {
    form.reset()
    discount.reset()
    setAttendanceSession('')
    setFeedback({ kind: 'none' })
    setResult(null)
    scrollToForm()
  }

  /* ---------------- sections, in the order of the registration artwork ---------------- */

  const sections: FormSection[] = [
    {
      id: 'attendee',
      visible: true,
      render: () => (
        <AttendeeSection
          t={t}
          fields={fields}
          values={values}
          errors={form.errors}
          onChange={setField}
          onBlur={form.blurField}
        />
      ),
    },
    {
      id: 'discount',
      visible: formContent.showDiscount,
      render: () => (
        <DiscountField
          t={t}
          code={discount.code}
          state={discount.state}
          onCodeChange={discount.setCode}
          onApply={() => discount.apply(selectedTicket?.ticket_code)}
          onRemove={discount.reset}
        />
      ),
    },
    {
      id: 'ticket',
      visible: true,
      render: () => (
        <TicketPicker
          tickets={server.ticketTypes}
          selected={values.ticketCode}
          onSelect={(code) => setField('ticketCode', code)}
          now={now}
          language={lang}
          t={t}
          error={form.errors.ticketCode && t[form.errors.ticketCode]}
        />
      ),
    },
    {
      id: 'session',
      visible: server.needsSession,
      render: () => (
        <SessionPicker
          sessions={server.sessions}
          selected={values.sessionCode}
          onSelect={(code) => setField('sessionCode', code)}
          language={lang}
          t={t}
          error={form.errors.sessionCode && t[form.errors.sessionCode]}
        />
      ),
    },
    {
      id: 'attendance',
      visible: formContent.showAttendanceSessions && formContent.attendanceSessions.length > 0,
      render: () => (
        <ChoiceGroup
          name="er-attendance"
          title={t.attendancePrompt}
          mobileColumns={3}
          options={formContent.attendanceSessions.map((item, index) => ({
            value: item.code || String(index),
            label: localize(item.label, lang),
            startsRow: item.startsRow,
          }))}
          selected={attendanceSession}
          onSelect={setAttendanceSession}
        />
      ),
    },
    {
      id: 'terms',
      visible: true,
      render: () => (
        <TermsField
          t={t}
          checked={values.agreed}
          text={localize(formContent.termsText, lang)}
          url={formContent.termsUrl}
          error={form.errors.agreed && t[form.errors.agreed]}
          onChange={(checked) => setField('agreed', checked)}
        />
      ),
    },
    {
      id: 'summary',
      visible: true,
      render: () => (
        <OrderSummary
          t={t}
          ticketName={selectedTicket?.ticket_name ?? ''}
          sessionLabel={sessionLabel}
          showSession={server.needsSession}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          submitting={submitting}
          isPreview={isPreview}
          feedback={feedback}
        />
      ),
    },
  ]
  const visibleSections = sections.filter((s) => s.visible)
  const formBackground = formContent.backgroundMobile || formContent.backgroundDesktop

  /* ---------------- render ---------------- */

  return (
    <MotionConfig reducedMotion="user">
      <div
        lang={lang}
        style={themeStyle}
        className="er-root min-h-full overflow-x-clip bg-(--er-bg) font-sans text-(--er-on-bg) antialiased"
      >
        {data.customCSS && <style>{data.customCSS}</style>}
        <a
          href={`#${formAnchorId}`}
          className={`sr-only z-50 rounded-(--er-radius) bg-(--er-surface) px-4 py-2 font-semibold text-(--er-on-surface) focus:not-sr-only focus:absolute focus:top-3 focus:left-3 ${focusRing}`}
        >
          {t.skipToForm}
        </a>

        <EventIntro
          content={data}
          language={lang}
          t={t}
          fallbackTitle={server.eventName}
          formAnchorId={formAnchorId}
          showCta={!result}
        />
        <Agenda items={data.Agenda} language={lang} t={t} />

        {/* Registration stage: the form sits on the event artwork, laid out like the design mock-up. */}
        <main
          id={formAnchorId}
          style={{ ...panelStyle, fontFamily: FORM_FONTS.body }}
          className="relative isolate scroll-mt-0"
        >
          <link rel="stylesheet" href={FORM_FONTS.stylesheet} precedence="default" />
          {formBackground && (
            <picture>
              {formContent.backgroundDesktop && (
                <source media="(min-width: 768px)" srcSet={formContent.backgroundDesktop} />
              )}
              <img
                src={formBackground}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-auto w-full select-none [mask-image:linear-gradient(to_bottom,black_82%,transparent)]"
              />
            </picture>
          )}

          <div className="pt-[32.5vw] pb-16 md:pt-[4.2vw] md:pb-[6vw]">
            <AnimatePresence mode="wait">
              {result ? (
                <div key="confirmation" className="px-4 sm:px-6">
                  <Confirmation
                    t={t}
                    title={localize(confirmationContent.thankYouTitle, lang)}
                    message={localize(confirmationContent.thankYouMessage, lang)}
                    logo={hero.logo}
                    logoAlt={organizerName || t.organizer}
                    data={result.data}
                    snapshot={result.snapshot}
                    onRegisterAgain={handleRegisterAgain}
                    panelStyle={panelStyle}
                  />
                </div>
              ) : (
                <form key="form" ref={formRef} noValidate onSubmit={handleSubmit} aria-labelledby="er-form-title">
                  <h2
                    id="er-form-title"
                    style={{ fontFamily: FORM_FONTS.heading }}
                    className="mb-[7vw] bg-linear-to-r from-(--er-heading-from) to-(--er-heading-to) bg-clip-text px-4 pt-[0.15em] pb-[0.05em] text-center text-[6.4vw] leading-[1.25] font-bold text-transparent uppercase md:mb-[1.6vw] md:text-[2.52vw]"
                  >
                    {t.formTitle}
                  </h2>

                  <div className="grid gap-y-6 md:gap-y-[clamp(18px,1.8vw,28px)]">
                    {visibleSections.map((section) => (
                      <div key={section.id}>{section.render()}</div>
                    ))}
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </main>

        <SiteFooter t={t} organizerName={organizerName} email={organizer.contactEmail} hotline={organizer.hotline} />
      </div>
    </MotionConfig>
  )
}
