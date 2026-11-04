import { AlertCircle, BadgePercent, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dictionary } from '../i18n';
import type { DiscountState } from '../hooks/useDiscount';
import { formatPrice } from '../lib/format';
import { SectionHeading } from './SectionHeading';

interface DiscountFieldProps {
  code: string;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onRemove: () => void;
  state: DiscountState;
  t: Dictionary;
  step: number;
}

const INPUT_ID = 'er-discount';

/** Optional discount code; errors appear right under the input. */
export function DiscountField({ code, onCodeChange, onApply, onRemove, state, t, step }: DiscountFieldProps) {
  const loading = state.status === 'loading';
  // Server messages are shown verbatim; local checks are translated keys.
  const errorText = state.status === 'error' ? state.message : state.status === 'error-key' ? t[state.key] : '';
  const errorId = errorText ? `${INPUT_ID}-error` : undefined;

  return (
    <section aria-labelledby={`${INPUT_ID}-heading`}>
      <div id={`${INPUT_ID}-heading`}>
        <SectionHeading step={step} title={t.stepDiscount} aside={<span className="text-xs font-normal text-(--er-muted)">({t.optional})</span>} />
      </div>
      <label htmlFor={INPUT_ID} className="mb-1.5 block text-sm font-semibold text-(--er-on-surface)">
        {t.discountLabel}
      </label>
      <div className="flex flex-col gap-2 min-[400px]:flex-row">
        <input
          id={INPUT_ID}
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter applies the code instead of submitting the whole form.
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!loading) onApply();
            }
          }}
          placeholder={t.discountPlaceholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorId}
          className={[
            'block min-w-0 flex-1 rounded-(--er-radius) border bg-(--er-surface) px-3.5 py-3 text-base text-(--er-on-surface) uppercase placeholder:normal-case placeholder:text-(--er-muted)',
            'focus:outline-none focus-visible:ring-4',
            errorText
              ? 'border-(--er-danger) focus-visible:ring-(--er-danger)/30'
              : 'border-(--er-border-strong) hover:border-(--er-muted) focus-visible:border-(--er-primary) focus-visible:ring-(--er-ring)',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          aria-describedby={errorId}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-(--er-radius) border-2 border-(--er-ink) bg-(--er-surface) px-5 font-bold text-(--er-ink) transition hover:bg-(--er-subtle) focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring) disabled:cursor-wait disabled:opacity-70"
        >
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {loading ? t.applying : t.apply}
        </button>
      </div>

      <div aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {errorText && (
            <motion.p
              key="error"
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-start gap-1.5 text-sm font-medium text-(--er-danger)"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{errorText}</span>
            </motion.p>
          )}
          {state.status === 'applied' && (
            <motion.div
              key="applied"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-(--er-radius) border border-(--er-success-border) bg-(--er-success-bg) p-4 text-(--er-success)"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-bold">
                  <BadgePercent className="size-5 shrink-0" aria-hidden="true" />
                  {t.discountApplied(state.code)}
                </p>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex shrink-0 items-center gap-1 rounded-(--er-radius) px-2 py-1 text-sm font-semibold text-(--er-success) underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-(--er-success)"
                >
                  <X className="size-4" aria-hidden="true" />
                  {t.removeCode}
                </button>
              </div>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt>{t.summaryDiscount}</dt>
                <dd className="text-right font-semibold">−{formatPrice(state.data.discount_total_amount)}</dd>
                <dt className="font-bold">{t.summaryTotal}</dt>
                <dd className="text-right font-bold">{formatPrice(state.data.discounted_total_price)}</dd>
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
