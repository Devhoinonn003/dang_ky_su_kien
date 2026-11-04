import { AlertCircle, BadgePercent, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dictionary } from '../i18n';
import type { DiscountResult } from '../types';
import { formatPrice } from '../utils';
import { SectionHeading } from './SectionHeading';

export type DiscountState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'applied'; code: string; data: DiscountResult };

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
  const errorId = state.status === 'error' ? `${INPUT_ID}-error` : undefined;

  return (
    <section aria-labelledby={`${INPUT_ID}-heading`}>
      <div id={`${INPUT_ID}-heading`}>
        <SectionHeading step={step} title={t.stepDiscount} aside={<span className="text-xs font-normal text-slate-500">({t.optional})</span>} />
      </div>
      <label htmlFor={INPUT_ID} className="mb-1.5 block text-sm font-semibold text-slate-800">
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
          aria-invalid={state.status === 'error' ? true : undefined}
          aria-describedby={errorId}
          className={[
            'block min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-3 text-base text-slate-900 uppercase placeholder:normal-case placeholder:text-slate-400',
            'focus:outline-none focus-visible:ring-4',
            state.status === 'error'
              ? 'border-red-500 focus-visible:ring-red-200'
              : 'border-slate-300 hover:border-slate-400 focus-visible:border-(--er-primary) focus-visible:ring-(--er-ring)',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          aria-describedby={errorId}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-(--er-ink) bg-white px-5 font-bold text-(--er-ink) transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-(--er-ring) disabled:cursor-wait disabled:opacity-70"
        >
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {loading ? t.applying : t.apply}
        </button>
      </div>

      <div aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {state.status === 'error' && (
            <motion.p
              key="error"
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-start gap-1.5 text-sm font-medium text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{state.message}</span>
            </motion.p>
          )}
          {state.status === 'applied' && (
            <motion.div
              key="applied"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 font-bold">
                  <BadgePercent className="size-5 shrink-0" aria-hidden="true" />
                  {t.discountApplied(state.code)}
                </p>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-900 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
