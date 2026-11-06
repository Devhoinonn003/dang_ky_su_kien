import { BadgePercent, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Dictionary } from '../i18n';
import type { DiscountState } from '../hooks/useDiscount';
import { formatPrice } from '../lib/format';
import { focusRing } from '../lib/ui';
import { Field } from './Field';

interface DiscountFieldProps {
  code: string;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onRemove: () => void;
  state: DiscountState;
  t: Dictionary;
}

const INPUT_ID = 'er-discount';

/** Optional discount code as a regular form row, with the Apply button inside the pill. */
export function DiscountField({ code, onCodeChange, onApply, onRemove, state, t }: DiscountFieldProps) {
  const loading = state.status === 'loading';
  // Server messages are shown verbatim; local checks are translated keys.
  const errorText = state.status === 'error' ? state.message : state.status === 'error-key' ? t[state.key] : '';

  return (
    <div aria-live="polite">
      <Field
        id={INPUT_ID}
        type="text"
        label={t.discountRowLabel}
        optionalText={t.optional}
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
        className="[&_input]:uppercase [&_input]:placeholder:normal-case"
        error={errorText || undefined}
        trailing={
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            aria-describedby={errorText ? `${INPUT_ID}-error` : undefined}
            className={`absolute inset-y-1 right-1 inline-flex items-center gap-1 rounded-(--er-radius-field) bg-(--er-primary) px-3 text-xs font-semibold text-(--er-on-primary) transition-colors hover:bg-(--er-primary-hover) disabled:cursor-wait disabled:opacity-70 md:px-4 md:text-sm ${focusRing}`}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            {loading ? t.applying : t.apply}
          </button>
        }
        below={
          <AnimatePresence initial={false}>
            {state.status === 'applied' && (
              <motion.div
                key="applied"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 rounded-(--er-radius) border-l-4 border-(--er-success) bg-(--er-success-bg) p-3 text-xs text-(--er-success) md:text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-bold">
                    <BadgePercent className="size-4 shrink-0" aria-hidden="true" />
                    {t.discountApplied(state.code)}
                  </p>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex shrink-0 items-center gap-1 rounded-(--er-radius) px-1 font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-(--er-success)"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    {t.removeCode}
                  </button>
                </div>
                <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
                  <dt>{t.summaryDiscount}</dt>
                  <dd className="text-right font-semibold tabular-nums">−{formatPrice(state.data.discount_total_amount)}</dd>
                  <dt className="font-bold">{t.summaryTotal}</dt>
                  <dd className="text-right font-bold tabular-nums">{formatPrice(state.data.discounted_total_price)}</dd>
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
    </div>
  );
}
