import type { InputHTMLAttributes, Ref } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  requiredText?: string;
  optionalText?: string;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/** Labelled text input with inline hint and error message . */
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
  ...inputProps
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold text-(--er-on-surface)">
        {label}
        {required ? (
          <span className="text-(--er-danger)" aria-hidden="true">
            *
          </span>
        ) : (
          optionalText && <span className="text-xs font-normal text-(--er-muted)">({optionalText})</span>
        )}
        {required && requiredText && <span className="sr-only">({requiredText})</span>}
      </label>
      <input
        id={id}
        ref={inputRef}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'block w-full rounded-(--er-radius) border bg-(--er-surface) px-3.5 py-3 text-base text-(--er-on-surface) placeholder:text-(--er-muted)',
          'transition-colors focus:outline-none focus-visible:ring-4',
          error
            ? 'border-(--er-danger) focus-visible:border-(--er-danger) focus-visible:ring-(--er-danger)/30'
            : 'border-(--er-border-strong) hover:border-(--er-muted) focus-visible:border-(--er-primary) focus-visible:ring-(--er-ring)',
        ].join(' ')}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-(--er-danger)">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-(--er-muted)">
          {hint}
        </p>
      )}
    </div>
  );
}
