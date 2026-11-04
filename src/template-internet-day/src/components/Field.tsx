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
      <label htmlFor={id} className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold text-slate-800">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        ) : (
          optionalText && <span className="text-xs font-normal text-slate-500">({optionalText})</span>
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
          'block w-full rounded-xl border bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400',
          'transition-colors focus:outline-none focus-visible:ring-4',
          error
            ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-200'
            : 'border-slate-300 hover:border-slate-400 focus-visible:border-(--er-primary) focus-visible:ring-(--er-ring)',
        ].join(' ')}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-600">
          {hint}
        </p>
      )}
    </div>
  );
}
