import { AlertCircle, Eye, Info, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '../i18n';
import { formatPrice } from '../lib/format';
import { buttonGradient, focusRing, formText, formWide, notice } from '../lib/ui';

export type SubmitFeedback =
  | { kind: 'none' }
  | { kind: 'api-error'; message: string }
  | { kind: 'invalid'; count: number }
  | { kind: 'preview-ok' };

interface OrderSummaryProps {
  t: Dictionary;
  ticketName: string;
  sessionLabel: string;
  showSession: boolean;
  subtotal: number;
  discountAmount: number | null;
  total: number;
  submitting: boolean;
  isPreview: boolean;
  feedback: SubmitFeedback;
}

const FEEDBACK_ID = 'er-submit-feedback';

/** Compact summary (ticket, day, total) + submit button, busy state, and API error right under the button. */
export function OrderSummary({
  t,
  ticketName,
  sessionLabel,
  showSession,
  subtotal,
  discountAmount,
  total,
  submitting,
  isPreview,
  feedback,
}: OrderSummaryProps) {
  const hasFeedback = feedback.kind !== 'none';
  const rows: { label: string; value: string; tone?: 'muted' | 'success' }[] = [
    { label: t.summaryTicket, value: ticketName || t.notSelected, tone: ticketName ? undefined : 'muted' },
    ...(showSession
      ? [{ label: t.summarySession, value: sessionLabel || t.notSelected, tone: sessionLabel ? undefined : ('muted' as const) }]
      : []),
    ...(discountAmount !== null
      ? [
          { label: t.summarySubtotal, value: formatPrice(subtotal) },
          { label: t.summaryDiscount, value: `−${formatPrice(discountAmount)}`, tone: 'success' as const },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="er-summary-heading" className={formWide}>
      <h2 id="er-summary-heading" className="sr-only">
        {t.stepSummary}
      </h2>

      <dl className={`grid gap-y-1 text-(--er-on-surface) ${formText}`}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-(--er-muted)">{row.label}:</dt>
            <dd
              className={[
                'text-right font-semibold first-letter:uppercase',
                row.tone === 'muted' ? 'font-normal text-(--er-muted) italic' : '',
                row.tone === 'success' ? 'text-(--er-success)' : '',
              ].join(' ')}
            >
              {row.value}
            </dd>
          </div>
        ))}
        <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-(--er-border) pt-2">
          <dt className="font-bold">{t.summaryTotal}:</dt>
          <dd className="text-right text-xl font-bold text-(--er-heading-from) tabular-nums md:text-[1.5em]">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>

      {isPreview && (
        <p className={`mt-3 ${notice} border-(--er-warning) bg-(--er-warning-bg) text-(--er-warning)`}>
          <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.previewNotice}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-disabled={submitting}
        aria-describedby={hasFeedback ? FEEDBACK_ID : undefined}
        className={`${buttonGradient} ${focusRing} mt-4 w-full ${formText}`}
      >
        {submitting ? (
          <Loader2 className="size-[1.2em] animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-[1.2em]" aria-hidden="true" />
        )}
        {submitting ? t.submitting : t.submit}
      </button>

      <div id={FEEDBACK_ID} aria-live="assertive">
        {feedback.kind === 'api-error' && (
          <p role="alert" className={`mt-3 ${notice} border-(--er-danger) bg-(--er-danger-bg) font-medium text-(--er-danger)`}>
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{feedback.message}</span>
          </p>
        )}
        {feedback.kind === 'invalid' && (
          <p role="alert" className="mt-3 flex items-start gap-2 text-sm font-medium text-(--er-danger)">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t.fixErrors(feedback.count)}</span>
          </p>
        )}
        {feedback.kind === 'preview-ok' && (
          <p role="status" className={`mt-3 ${notice} border-(--er-info) bg-(--er-info-bg) text-(--er-info)`}>
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t.previewSubmitted}</span>
          </p>
        )}
      </div>
    </section>
  );
}
