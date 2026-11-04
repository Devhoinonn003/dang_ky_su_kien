import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Copy, Mail, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Dictionary } from '../i18n';
import type { RegistrationResult } from '../types';

export interface ConfirmationSnapshot {
  fullName: string;
  email: string;
  ticketName: string;
  sessionLabel: string;
  totalText: string;
}

interface ConfirmationProps {
  t: Dictionary;
  title: string;
  message: string;
  logo: string;
  logoAlt: string;
  data: RegistrationResult;
  snapshot: ConfirmationSnapshot;
  onRegisterAgain: () => void;
}

/** thank-you screen with ticket code(s), QR image(s) and email notice. */
export function Confirmation({ t, title, message, logo, logoAlt, data, snapshot, onRegisterAgain }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [failedQr, setFailedQr] = useState<Record<number, boolean>>({});
  const [logoFailed, setLogoFailed] = useState(false);

  const ticketCodes = Array.isArray(data.ticket_code) ? data.ticket_code.filter(Boolean) : [];
  const qrUrls = Array.isArray(data.qrcode_url) ? data.qrcode_url : [];
  const referenceId = data.order?.reference_id ?? '';

  useEffect(() => {
    // Move focus so keyboard and screen-reader users land on the result.
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!copiedCode) return undefined;
    const timer = window.setTimeout(() => setCopiedCode(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  const copy = (code: string) => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => setCopiedCode(code))
      .catch(() => setCopiedCode(null));
  };

  const details: { label: string; value: string }[] = [
    { label: t.confirmName, value: snapshot.fullName },
    { label: t.email, value: snapshot.email },
    { label: t.summaryTicket, value: snapshot.ticketName },
    { label: t.summarySession, value: snapshot.sessionLabel },
    { label: t.summaryTotal, value: snapshot.totalText },
    { label: t.confirmReference, value: referenceId },
  ].filter((row) => row.value);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-labelledby="er-confirm-heading"
      className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/30"
    >
      <div className="bg-(--er-bg) px-5 py-8 text-center text-(--er-on-bg) sm:px-10">
        {logo && !logoFailed && (
          <img
            src={logo}
            alt={logoAlt}
            className="mx-auto mb-5 h-10 w-auto max-w-48 object-contain"
            onError={() => setLogoFailed(true)}
          />
        )}
        <CheckCircle2 className="mx-auto size-14 text-(--er-accent)" aria-hidden="true" />
        <h2
          id="er-confirm-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-2xl font-extrabold focus:outline-none sm:text-3xl"
        >
          {title}
        </h2>
        {message && <p className="mx-auto mt-3 max-w-xl opacity-90">{message}</p>}
      </div>

      <div className="grid gap-8 px-5 py-8 sm:px-10 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          {ticketCodes.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-600">{t.confirmTicketCode}</p>
              <ul className="mt-2 grid gap-2">
                {ticketCodes.map((code) => (
                  <li key={code} className="flex flex-wrap items-center gap-3">
                    <span className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-2 font-mono text-2xl font-bold tracking-wider break-all">
                      {code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(code)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring)"
                    >
                      {copiedCode === code ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      <span aria-live="polite">{copiedCode === code ? t.copied : t.copy}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="text-sm font-semibold text-slate-600">{t.confirmRegistered}</h3>
          <dl className="mt-2 divide-y divide-slate-200 text-sm">
            {details.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 py-2">
                <dt className="text-slate-600">{row.label}</dt>
                <dd className="text-right font-semibold [overflow-wrap:anywhere]">{row.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-950 ring-1 ring-emerald-200">
            <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">{t.confirmEmailSent(snapshot.email)}</span>
          </p>
        </div>

        {qrUrls.some((url, i) => url && !failedQr[i]) && (
          <div className="flex flex-wrap justify-center gap-4 md:flex-col md:justify-start">
            {qrUrls.map((url, i) =>
              url && !failedQr[i] ? (
                <figure key={`${url}-${i}`} className="rounded-2xl border border-slate-200 p-3">
                  <img
                    src={url}
                    alt={t.confirmQrAlt(ticketCodes[i] ?? '')}
                    width={200}
                    height={200}
                    className="size-48 object-contain sm:size-52"
                    onError={() => setFailedQr((prev) => ({ ...prev, [i]: true }))}
                  />
                  {ticketCodes[i] && (
                    <figcaption className="mt-2 text-center font-mono text-xs text-slate-600">{ticketCodes[i]}</figcaption>
                  )}
                </figure>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-5 py-5 sm:px-10">
        <button
          type="button"
          onClick={onRegisterAgain}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-(--er-ink) px-6 font-bold text-(--er-ink) transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring) sm:w-auto"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          {t.registerAgain}
        </button>
      </div>
    </motion.section>
  );
}
