import { AlertCircle, Eye, Info, Loader2, Send } from 'lucide-react';
import type { Dictionary } from '../i18n';
import { formatPrice } from '../lib/format';

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
  step: number;
}

const FEEDBACK_ID = 'er-submit-feedback';

/** Summary + submit button, busy state, and API error right under the button. */
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
  step,
}: OrderSummaryProps) {
  const hasFeedback = feedback.kind !== 'none';

  return (
    <section
      aria-labelledby="er-summary-heading"
      className="rounded-(--er-radius-card) bg-(--er-surface) p-5 text-(--er-on-surface) shadow-xl shadow-black/20 ring-1 ring-black/5 sm:p-6"
    >
      <h2 id="er-summary-heading" className="mb-4 flex items-center gap-3 text-lg font-bold sm:text-xl">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--er-ink) text-sm font-bold text-(--er-on-ink)"
        >
          {step}
        </span>
        {t.stepSummary}
      </h2>

      <dl className="divide-y divide-(--er-border) text-sm">
        <div className="flex justify-between gap-4 py-2.5">
          <dt className="text-(--er-muted)">{t.summaryTicket}</dt>
          <dd className={`text-right font-semibold ${ticketName ? '' : 'text-(--er-muted) italic'}`}>
            {ticketName || t.notSelected}
          </dd>
        </div>
        {showSession && (
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-(--er-muted)">{t.summarySession}</dt>
            <dd className={`text-right font-semibold first-letter:uppercase ${sessionLabel ? '' : 'text-(--er-muted) italic'}`}>
              {sessionLabel || t.notSelected}
            </dd>
          </div>
        )}
        {discountAmount !== null && (
          <>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-(--er-muted)">{t.summarySubtotal}</dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5 text-(--er-success)">
              <dt>{t.summaryDiscount}</dt>
              <dd className="font-semibold">−{formatPrice(discountAmount)}</dd>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-between gap-4 pt-3">
          <dt className="text-base font-bold">{t.summaryTotal}</dt>
          <dd className="text-2xl font-extrabold text-(--er-primary-text)">{formatPrice(total)}</dd>
        </div>
      </dl>

      {isPreview && (
        <p className="mt-4 flex items-start gap-2 rounded-(--er-radius) bg-(--er-warning-bg) p-3 text-sm text-(--er-warning) ring-1 ring-(--er-warning-border)">
          <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.previewNotice}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-disabled={submitting}
        aria-describedby={hasFeedback ? FEEDBACK_ID : undefined}
        className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-(--er-radius) bg-(--er-primary) px-6 text-base font-bold text-(--er-on-primary) shadow-md transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring) focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75"
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-5" aria-hidden="true" />
        )}
        {submitting ? t.submitting : t.submit}
      </button>

      <div id={FEEDBACK_ID} aria-live="assertive">
        {feedback.kind === 'api-error' && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-(--er-radius) bg-(--er-danger-bg) p-3 text-sm font-medium text-(--er-danger) ring-1 ring-(--er-danger-border)">
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
          <p role="status" className="mt-3 flex items-start gap-2 rounded-(--er-radius) bg-(--er-info-bg) p-3 text-sm text-(--er-info) ring-1 ring-(--er-info-border)">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t.previewSubmitted}</span>
          </p>
        )}
      </div>
    </section>
  );
}
