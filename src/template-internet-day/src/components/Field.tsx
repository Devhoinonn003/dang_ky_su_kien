import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { AlertCircle } from 'lucide-react';
import { formRow, formText, inputBase, inputState } from '../lib/ui';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  requiredText?: string;
  optionalText?: string;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Extra control drawn inside the input on the right (e.g. an Apply button). */
  trailing?: ReactNode;
  /** Extra content under the input (e.g. an applied-discount notice). */
  below?: ReactNode;
}

/** Shared "Label:" cell of a form row, right-aligned next to its control as in the artwork. */
export function RowLabel({ htmlFor, children, required, requiredText, optionalText }: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  requiredText?: string;
  optionalText?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`flex min-h-9 items-center justify-end gap-x-1 self-start text-right leading-tight text-(--er-on-surface) md:min-h-[clamp(32px,2.29vw,42px)] ${formText}`}
    >
      <span>
        {children}
        {required && (
          <span className="text-(--er-danger)" aria-hidden="true">
            *
          </span>
        )}
        :
      </span>
      {required && requiredText && <span className="sr-only">({requiredText})</span>}
      {!required && optionalText && <span className="sr-only">({optionalText})</span>}
    </label>
  );
}

/** Labelled text input: "Label:" on the left, white pill input on the right, message under the input. */
export function Field({
  id,
  label,
  requiredText,
  optionalText,
  hint,
  error,
  inputRef,
  required,
  className,
  trailing,
  below,
  ...inputProps
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={[formRow, className].filter(Boolean).join(' ')}>
      <RowLabel htmlFor={id} required={required} requiredText={requiredText} optionalText={optionalText}>
        {label}
      </RowLabel>
      <div className="min-w-0">
        <div className="relative">
          <input
            id={id}
            ref={inputRef}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${inputBase} ${inputState(Boolean(error))} ${trailing ? 'pr-24' : ''}`}
            {...inputProps}
          />
          {trailing}
        </div>
        {error && (
          <p id={errorId} className="mt-1 flex items-start gap-1 text-xs font-medium text-(--er-danger) md:text-sm">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-(--er-muted) md:text-sm">
            {hint}
          </p>
        )}
        {below}
      </div>
    </div>
  );
}
