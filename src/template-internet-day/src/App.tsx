import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import { getDictionary, type Dictionary } from './i18n';
import type { Language, RegistrationPageProps, RegistrationRequest, RegistrationResult } from './types';
import {
  formatDate,
  formatPrice,
  formatTimeRange,
  getTicketStatus,
  isValidEmail,
  isValidPhone,
  localize,
  normalizePhone,
  normalizeServerData,
  parsePrice,
  readableTextOn,
  resolveContent,
} from './utils';
import { EventIntro } from './components/EventIntro';
import { TicketPicker } from './components/TicketPicker';
import { SessionPicker } from './components/SessionPicker';
import { Field } from './components/Field';
import { DiscountField, type DiscountState } from './components/DiscountField';
import { OrderSummary, type SubmitFeedback } from './components/OrderSummary';
import { Confirmation, type ConfirmationSnapshot } from './components/Confirmation';
import { SectionHeading } from './components/SectionHeading';

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  ticketType: string;
  sessionCode: string;
  agreed: boolean;
}

type FieldKey = keyof FormValues;

/** Errors are stored as dictionary keys so they re-translate on language change. */
type ErrorKey =
  | 'errFullName'
  | 'errEmailEmpty'
  | 'errEmailFormat'
  | 'errPhoneEmpty'
  | 'errPhoneFormat'
  | 'errTicket'
  | 'errSession'
  | 'errTerms';

type FormErrors = Partial<Record<FieldKey, ErrorKey>>;

const EMPTY_FORM: FormValues = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  position: '',
  ticketType: '',
  sessionCode: '',
  agreed: false,
};

/** Order used to focus the first invalid field. */
const FIELD_ORDER: FieldKey[] = ['ticketType', 'sessionCode', 'fullName', 'email', 'phone', 'agreed'];

function validateField(key: FieldKey, values: FormValues, needsSession: boolean): ErrorKey | undefined {
  switch (key) {
    case 'fullName':
      return values.fullName.trim() ? undefined : 'errFullName';
    case 'email':
      if (!values.email.trim()) return 'errEmailEmpty';
      return isValidEmail(values.email) ? undefined : 'errEmailFormat';
    case 'phone':
      if (!values.phone.trim()) return 'errPhoneEmpty';
      return isValidPhone(values.phone) ? undefined : 'errPhoneFormat';
    case 'ticketType':
      return values.ticketType ? undefined : 'errTicket';
    case 'sessionCode':
      return !needsSession || values.sessionCode ? undefined : 'errSession';
    case 'agreed':
      return values.agreed ? undefined : 'errTerms';
    default:
      return undefined;
  }
}

function validateAll(values: FormValues, needsSession: boolean): FormErrors {
  const errors: FormErrors = {};
  for (const key of FIELD_ORDER) {
    const error = validateField(key, values, needsSession);
    if (error) errors[key] = error;
  }
  return errors;
}

function translate(t: Dictionary, key: ErrorKey | undefined): string | undefined {
  return key ? t[key] : undefined;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/** Page layout: event intro, then either the registration form or the confirmation screen. */
export default function App({ content, language, serverData, isPreview = false, api }: RegistrationPageProps) {
  const lang: Language = language === 'en' ? 'en' : 'vi';
  const t = getDictionary(lang);
  const data = useMemo(() => resolveContent(content), [content]);
  const server = useMemo(() => normalizeServerData(serverData), [serverData]);
  const uid = useId().replace(/:/g, '');
  const formAnchorId = `er-form-${uid}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const discountRequestRef = useRef(0);

  // "now" is fixed per mount so ticket status does not flicker between renders.
  const [now] = useState(() => Date.now());
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<DiscountState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmitFeedback>({ kind: 'none' });
  const [result, setResult] = useState<{ data: RegistrationResult; snapshot: ConfirmationSnapshot } | null>(null);

  const needsSession = server.sessions.length >= 2;
  const { Form: form, Confirmation: confirmationText, Organizer: organizer, Theme: theme, Hero: hero } = data;

  // Server messages are written in the page language; drop them when it changes.
  const previousLang = useRef(lang);
  useEffect(() => {
    if (previousLang.current === lang) return;
    previousLang.current = lang;
    setFeedback((prev) => (prev.kind === 'api-error' || prev.kind === 'preview-ok' ? { kind: 'none' } : prev));
    setDiscount((prev) => (prev.status === 'error' ? { status: 'idle' } : prev));
  }, [lang]);

  // Drop a selection that is no longer valid when server data changes.
  useEffect(() => {
    setValues((prev) => {
      const ticketStillValid = server.ticketTypes.some(
        (tk) => tk.ticket_code === prev.ticketType && getTicketStatus(tk, now) === 'available',
      );
      const sessionStillValid = server.sessions.some((s) => s.session_code === prev.sessionCode);
      if ((ticketStillValid || !prev.ticketType) && (sessionStillValid || !prev.sessionCode)) return prev;
      return {
        ...prev,
        ticketType: ticketStillValid ? prev.ticketType : '',
        sessionCode: sessionStillValid ? prev.sessionCode : '',
      };
    });
  }, [server, now]);

  /* ---------------- derived values ---------------- */

  const selectedTicket = server.ticketTypes.find((tk) => tk.ticket_code === values.ticketType);
  const selectedSession = server.sessions.find((s) => s.session_code === values.sessionCode);
  const sessionLabel = selectedSession
    ? [formatDate(selectedSession.start_time, lang), formatTimeRange(selectedSession.start_time, selectedSession.end_time, lang)]
        .filter(Boolean)
        .join(', ') || selectedSession.name || selectedSession.session_code
    : '';

  const subtotal = parsePrice(selectedTicket?.price);
  const applied = discount.status === 'applied' ? discount : null;
  const discountAmount = applied ? parsePrice(applied.data.discount_total_amount) : null;
  const total = applied ? parsePrice(applied.data.discounted_total_price) : subtotal;

  const themeStyle = useMemo(() => {
    const onPrimary = readableTextOn(theme.primaryColor);
    const onBg = readableTextOn(theme.backgroundColor);
    return {
      '--er-primary': theme.primaryColor,
      '--er-on-primary': onPrimary,
      // Primary used as text on white only if it is dark enough to read.
      '--er-primary-text': onPrimary === '#ffffff' ? theme.primaryColor : '#0b1220',
      '--er-accent': theme.accentColor,
      '--er-bg': theme.backgroundColor,
      '--er-on-bg': onBg,
      // Background color used as ink on white surfaces, unless it is too light.
      '--er-ink': onBg === '#ffffff' ? theme.backgroundColor : '#0b1220',
      '--er-ring': `color-mix(in srgb, ${theme.primaryColor} 35%, transparent)`,
    } as CSSProperties;
  }, [theme]);

  /* ---------------- handlers ---------------- */

  const resetDiscount = useCallback(() => {
    discountRequestRef.current += 1; // ignore any in-flight response
    setDiscount({ status: 'idle' });
  }, []);

  const updateValue = <K extends FieldKey>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    // Re-validate live once the user has seen an error for this field.
    if (submitAttempted || errors[key]) {
      setErrors((prevErrors) => ({ ...prevErrors, [key]: validateField(key, next, needsSession) }));
    }
    if (feedback.kind !== 'none') setFeedback({ kind: 'none' });
  };

  const handleBlur = (key: FieldKey) => {
    // Validate on blur only when something was typed, to avoid nagging on tab-through.
    const raw = values[key];
    if (typeof raw === 'string' && raw.trim() === '' && !submitAttempted) return;
    setErrors((prev) => ({ ...prev, [key]: validateField(key, values, needsSession) }));
  };

  const handleTicketSelect = (ticketType: string) => {
    if (ticketType !== values.ticketType && discount.status !== 'idle') resetDiscount();
    updateValue('ticketType', ticketType);
  };

  const handleDiscountChange = (code: string) => {
    setDiscountCode(code);
    if (discount.status !== 'idle') resetDiscount();
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscount({ status: 'error', message: t.discountEmpty });
      return;
    }
    if (!selectedTicket) {
      setDiscount({ status: 'error', message: t.discountNeedTicket });
      return;
    }
    const requestId = ++discountRequestRef.current;
    setDiscount({ status: 'loading' });
    const response = await api.checkDiscount({
      discount_code: code,
      ticket_types: [{ ticket_type: selectedTicket.ticket_code, quantity: 1 }],
    });
    if (requestId !== discountRequestRef.current) return; // stale response
    setDiscount(
      response.ok
        ? { status: 'applied', code, data: response.data }
        : { status: 'error', message: response.message },
    );
  };

  const focusField = (key: FieldKey) => {
    const root = formRef.current;
    if (!root) return;
    const selectors: Record<FieldKey, string> = {
      ticketType: 'input[name="er-ticket"]:not(:disabled)',
      sessionCode: 'input[name="er-session"]',
      fullName: '#er-fullname',
      email: '#er-email',
      phone: '#er-phone',
      company: '#er-company',
      position: '#er-position',
      agreed: '#er-terms',
    };
    const el = root.querySelector<HTMLElement>(selectors[key]);
    if (el) {
      el.focus({ preventScroll: true });
      el.closest('fieldset, div')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setSubmitAttempted(true);
    const nextErrors = validateAll(values, needsSession);
    setErrors(nextErrors);
    const invalidKeys = FIELD_ORDER.filter((key) => nextErrors[key]);
    if (invalidKeys.length > 0) {
      setFeedback({ kind: 'invalid', count: invalidKeys.length });
      focusField(invalidKeys[0]);
      return;
    }
    if (!selectedTicket) return;

    if (isPreview) {
      setFeedback({ kind: 'preview-ok' });
      return;
    }

    const fullName = values.fullName.trim();
    const email = values.email.trim();
    const phone = normalizePhone(values.phone);
    const company = form.showCompany ? values.company.trim() : '';
    const position = form.showPosition ? values.position.trim() : '';

    const holder = {
      display_name: fullName,
      email,
      phone,
      ...(company && { company }),
      ...(position && { position }),
    };
    const code = selectedTicket.ticket_code;
    const request: RegistrationRequest = {
      order_issuer_display_name: fullName,
      order_issuer_email: email,
      order_issuer_phone: phone,
      ...(company && { order_issuer_company: company }),
      ...(position && { order_issuer_position: position }),
      ticket_type: { [code]: 1 },
      ticket_holder_infos: { [code]: [holder] }, // the guest attends alone, so holder = issuer
      registered_session: needsSession ? [values.sessionCode] : [], // single session -> []
      language_code: lang,
      ...(applied && { discount_code: applied.code }), // only after a successful apply
    };

    submittingRef.current = true;
    setSubmitting(true);
    setFeedback({ kind: 'none' });
    try {
      const response = await api.register(request);
      if (response.ok) {
        setResult({
          data: response.data,
          snapshot: {
            fullName,
            email,
            ticketName: selectedTicket.ticket_name,
            sessionLabel,
            totalText: formatPrice(total),
          },
        });
        document.getElementById(formAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setFeedback({ kind: 'api-error', message: response.message });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleRegisterAgain = () => {
    resetDiscount();
    setValues(EMPTY_FORM);
    setErrors({});
    setSubmitAttempted(false);
    setDiscountCode('');
    setFeedback({ kind: 'none' });
    setResult(null);
    window.requestAnimationFrame(() => {
      document.getElementById(formAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /* ---------------- render ---------------- */

  const err = (key: FieldKey) => translate(t, errors[key]);
  // Section numbers shift when the optional session / discount sections are hidden.
  const steps = {
    ticket: 1,
    session: 2,
    info: needsSession ? 3 : 2,
    discount: needsSession ? 4 : 3,
    summary: (needsSession ? 4 : 3) + (form.showDiscount ? 1 : 0),
  };
  const termsText = localize(form.termsText, lang);
  const organizerName = localize(organizer.name, lang);
  const fallbackTitle = server.eventName;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        lang={lang}
        style={themeStyle}
        className="er-root min-h-full overflow-x-clip bg-(--er-bg) font-sans text-(--er-on-bg) antialiased"
      >
        {data.customCSS && <style>{data.customCSS}</style>}
        <a
          href={`#${formAnchorId}`}
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-slate-900 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
        >
          {t.skipToForm}
        </a>

        <EventIntro
          content={data}
          language={lang}
          t={t}
          fallbackTitle={fallbackTitle}
          formAnchorId={formAnchorId}
          showCta={!result}
        />

        <main id={formAnchorId} className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-16 sm:px-6">
          <AnimatePresence mode="wait">
            {result ? (
              <Confirmation
                key="confirmation"
                t={t}
                title={localize(confirmationText.thankYouTitle, lang)}
                message={localize(confirmationText.thankYouMessage, lang)}
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
                <div className="grid gap-8 rounded-2xl bg-white p-5 text-slate-900 shadow-xl shadow-black/20 ring-1 ring-black/5 sm:p-8">
                  <TicketPicker
                    step={steps.ticket}
                    tickets={server.ticketTypes}
                    selected={values.ticketType}
                    onSelect={handleTicketSelect}
                    now={now}
                    language={lang}
                    t={t}
                    error={err('ticketType')}
                  />

                  {needsSession && (
                    <SessionPicker
                      step={steps.session}
                      sessions={server.sessions}
                      selected={values.sessionCode}
                      onSelect={(code) => updateValue('sessionCode', code)}
                      language={lang}
                      t={t}
                      error={err('sessionCode')}
                    />
                  )}

                  <section aria-labelledby="er-info-heading">
                    <div id="er-info-heading">
                      <SectionHeading step={steps.info} title={t.stepInfo} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id="er-fullname"
                        className="sm:col-span-2"
                        label={t.fullName}
                        requiredText={t.required}
                        required
                        autoComplete="name"
                        placeholder={t.fullNamePlaceholder}
                        value={values.fullName}
                        onChange={(e) => updateValue('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        error={err('fullName')}
                      />
                      <Field
                        id="er-email"
                        type="email"
                        inputMode="email"
                        label={t.email}
                        requiredText={t.required}
                        required
                        autoComplete="email"
                        placeholder={t.emailPlaceholder}
                        hint={t.emailHint}
                        value={values.email}
                        onChange={(e) => updateValue('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        error={err('email')}
                      />
                      <Field
                        id="er-phone"
                        type="tel"
                        inputMode="tel"
                        label={t.phone}
                        requiredText={t.required}
                        required
                        autoComplete="tel"
                        placeholder={t.phonePlaceholder}
                        value={values.phone}
                        onChange={(e) => updateValue('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        error={err('phone')}
                      />
                      {form.showCompany && (
                        <Field
                          id="er-company"
                          label={t.company}
                          optionalText={t.optional}
                          autoComplete="organization"
                          placeholder={t.companyPlaceholder}
                          value={values.company}
                          onChange={(e) => updateValue('company', e.target.value)}
                        />
                      )}
                      {form.showPosition && (
                        <Field
                          id="er-position"
                          label={t.jobTitle}
                          optionalText={t.optional}
                          autoComplete="organization-title"
                          placeholder={t.jobTitlePlaceholder}
                          value={values.position}
                          onChange={(e) => updateValue('position', e.target.value)}
                        />
                      )}
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="er-terms"
                        className={[
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed',
                          'has-focus-visible:ring-4 has-focus-visible:ring-(--er-ring)',
                          errors.agreed ? 'border-red-500 bg-red-50/50' : 'border-slate-200 bg-slate-50',
                        ].join(' ')}
                      >
                        <input
                          id="er-terms"
                          type="checkbox"
                          checked={values.agreed}
                          onChange={(e) => updateValue('agreed', e.target.checked)}
                          aria-invalid={errors.agreed ? true : undefined}
                          aria-describedby={errors.agreed ? 'er-terms-error' : undefined}
                          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-(--er-primary) focus:outline-none"
                        />
                        <span className="text-slate-800">
                          {termsText}
                          <span className="text-red-600" aria-hidden="true">
                            {' '}
                            *
                          </span>
                        </span>
                      </label>
                      {form.termsUrl && (
                        <a
                          href={form.termsUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-2 inline-block text-sm font-semibold text-(--er-primary-text) underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--er-ring)"
                        >
                          {t.viewTerms}
                        </a>
                      )}
                      {errors.agreed && (
                        <p id="er-terms-error" className="mt-1.5 text-sm font-medium text-red-700">
                          {translate(t, errors.agreed)}
                        </p>
                      )}
                    </div>
                  </section>

                  {form.showDiscount && (
                    <DiscountField
                      step={steps.discount}
                      code={discountCode}
                      onCodeChange={handleDiscountChange}
                      onApply={handleApplyDiscount}
                      onRemove={() => {
                        resetDiscount();
                        setDiscountCode('');
                      }}
                      state={discount}
                      t={t}
                    />
                  )}
                </div>

                <div className="lg:sticky lg:top-4">
                  <OrderSummary
                    step={steps.summary}
                    t={t}
                    ticketName={selectedTicket?.ticket_name ?? ''}
                    sessionLabel={sessionLabel}
                    showSession={needsSession}
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

        {(organizerName || organizer.contactEmail || organizer.hotline) && (
          <footer className="border-t border-current/15">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {organizerName && <p className="font-semibold">{organizerName}</p>}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {organizer.contactEmail && (
                  <a
                    href={`mailto:${organizer.contactEmail}`}
                    className="inline-flex items-center gap-2 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    {organizer.contactEmail}
                  </a>
                )}
                {organizer.hotline && (
                  <a
                    href={`tel:${organizer.hotline.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {organizer.hotline}
                  </a>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>
    </MotionConfig>
  );
}
