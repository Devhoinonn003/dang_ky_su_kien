import type { ReactNode } from 'react';
import { SquareCheckBig } from 'lucide-react';
import { focusWithinRing, formText, formWide } from '../lib/ui';

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  /** Small second line (time, price, availability). */
  detail?: ReactNode;
  disabled?: boolean;
  /** Forces the option onto a new row (the artwork shows 2 options, then 3). */
  startsRow?: boolean;
}

interface ChoiceGroupProps {
  /** Radio group name; also prefixes element ids. */
  name: string;
  title: string;
  options: ChoiceOption[];
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
  /** Rendered instead of the options when there are none. */
  empty?: ReactNode;
  /** Options per row on wide screens (the artwork uses 3; wordier options read better in 2). */
  columns?: 2 | 3;
  /** Options per row on phones; short labels fit 3 like the mobile artwork. */
  mobileColumns?: 2 | 3;
}

/** "Title: choose one of the following ✓" + round white radio marks laid out on a grid, as in the artwork. */
export function ChoiceGroup({ name, title, options, selected, onSelect, error, empty, columns = 3, mobileColumns = 2 }: ChoiceGroupProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset
      className={formWide}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={`mb-2.5 flex items-center gap-1.5 font-bold text-(--er-on-surface) md:mb-[clamp(8px,0.9vw,14px)] ${formText}`}>
        {title}
        <SquareCheckBig className="size-[1.15em] shrink-0 text-(--er-heading-to)" aria-hidden="true" />
      </legend>

      {options.length === 0 ? (
        empty
      ) : (
        <div
          className={[
            'grid gap-x-3 gap-y-3 md:gap-y-[clamp(8px,0.9vw,14px)]',
            mobileColumns === 3 ? 'grid-cols-3' : 'grid-cols-2',
            columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
          ].join(' ')}
        >
          {options.map((option, index) => {
            const checked = selected === option.value;
            const inputId = `${name}-${index}`;
            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={[
                  'flex items-start gap-2 rounded-(--er-radius) md:gap-[clamp(8px,0.8vw,12px)]',
                  option.startsRow ? 'col-start-1' : '',
                  focusWithinRing,
                  option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                ].join(' ')}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  disabled={option.disabled}
                  onChange={() => onSelect(option.value)}
                  className="sr-only"
                />
                {/* White disc as in the artwork; a filled dot marks the choice. */}
                <span
                  aria-hidden="true"
                  className={[
                    'flex size-5 shrink-0 items-center justify-center rounded-full bg-(--er-field) md:size-[clamp(20px,2.19vw,30px)]',
                    error ? 'outline-2 outline-offset-1 outline-(--er-danger)' : '',
                  ].join(' ')}
                >
                  {checked && <span className="size-[45%] rounded-full bg-(--er-primary)" />}
                </span>
                <span className={`min-w-0 leading-tight text-(--er-on-surface) md:pt-[0.2em] ${formText}`}>
                  <span className="block">{option.label}</span>
                  {option.detail && <span className="mt-0.5 block text-[11px] text-(--er-muted) md:text-[0.8em]">{option.detail}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-2 text-xs font-medium text-(--er-danger) md:text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}
