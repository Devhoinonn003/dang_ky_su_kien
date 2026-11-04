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
import { buildThemeStyle } from './lib/theme'
import type { Language, RegistrationPageProps, RegistrationResult } from './types'
import { EventIntro } from './components/EventIntro'
import { Agenda } from './components/Agenda'
import { TicketPicker } from './components/TicketPicker'
import { SessionPicker } from './components/SessionPicker'
import { AttendeeSection } from './components/AttendeeSection'
import { DiscountField } from './components/DiscountField'
import { OrderSummary, type SubmitFeedback } from './components/OrderSummary'
import { Confirmation, type ConfirmationSnapshot } from './components/Confirmation'
import { SiteFooter } from './components/SiteFooter'

interface FormSection {
  id: string
  visible: boolean
  render: (step: number) => ReactNode
}

/** Page layout: event intro, agenda, then either the registration form or the confirmation. */
export default function App({ content, language, serverData, isPreview = false, api }: RegistrationPageProps) {
  const lang: Language = language === 'en' ? 'en' : 'vi'
  const t = getDictionary(lang)
  const data = useMemo(() => resolveContent(content), [content])
  const server = useMemo(() => normalizeServerData(serverData), [serverData])
  const themeStyle = useMemo(() => buildThemeStyle(data.Theme), [data.Theme])
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
    setFeedback({ kind: 'none' })
    setResult(null)
    scrollToForm()
  }

  /* ---------------- sections (numbered automatically) ---------------- */

  const sections: FormSection[] = [
    {
      id: 'ticket',
      visible: true,
      render: (step) => (
        <TicketPicker
          step={step}
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
      render: (step) => (
        <SessionPicker
          step={step}
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
      id: 'attendee',
      visible: true,
      render: (step) => (
        <AttendeeSection
          step={step}
          t={t}
          fields={fields}
          values={values}
          errors={form.errors}
          termsText={localize(formContent.termsText, lang)}
          termsUrl={formContent.termsUrl}
          onChange={setField}
          onBlur={form.blurField}
        />
      ),
    },
    {
      id: 'discount',
      visible: formContent.showDiscount,
      render: (step) => (
        <DiscountField
          step={step}
          t={t}
          code={discount.code}
          state={discount.state}
          onCodeChange={discount.setCode}
          onApply={() => discount.apply(selectedTicket?.ticket_code)}
          onRemove={discount.reset}
        />
      ),
    },
  ]
  const visibleSections = sections.filter((s) => s.visible)

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
          className="sr-only z-50 rounded-(--er-radius) bg-(--er-surface) px-4 py-2 font-semibold text-(--er-on-surface) focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
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

        <main id={formAnchorId} className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-16 sm:px-6">
          <AnimatePresence mode="wait">
            {result ? (
              <Confirmation
                key="confirmation"
                t={t}
                title={localize(confirmationContent.thankYouTitle, lang)}
                message={localize(confirmationContent.thankYouMessage, lang)}
                logo={hero.logo}
                logoAlt={organizerName || t.organizer}
                data={result.data}
                snapshot={result.snapshot}
                onRegisterAgain={handleRegisterAgain}
              />
            ) : (
              <form
                key="form"
                ref={formRef}
                noValidate
                onSubmit={handleSubmit}
                className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
              >
                <div className="grid gap-8 rounded-(--er-radius-card) bg-(--er-surface) p-5 text-(--er-on-surface) shadow-xl shadow-black/20 ring-1 ring-black/5 sm:p-8">
                  {visibleSections.map((section, index) => (
                    <div key={section.id}>{section.render(index + 1)}</div>
                  ))}
                </div>

                <div className="lg:sticky lg:top-4">
                  <OrderSummary
                    step={visibleSections.length + 1}
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
                </div>
              </form>
            )}
          </AnimatePresence>
        </main>

        <SiteFooter t={t} organizerName={organizerName} email={organizer.contactEmail} hotline={organizer.hotline} />
      </div>
    </MotionConfig>
  )
}
