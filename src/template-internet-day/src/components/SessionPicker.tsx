import { CalendarCheck } from 'lucide-react';
import type { Dictionary } from '../i18n';
import type { Language, Session } from '../types';
import { formatDate, formatTimeRange } from '../utils';
import { SectionHeading } from './SectionHeading';

interface SessionPickerProps {
  sessions: Session[];
  selected: string;
  onSelect: (sessionCode: string) => void;
  language: Language;
  t: Dictionary;
  error?: string;
  step: number;
}

const GROUP_ID = 'er-session';

/** rendered only when there are at least two sessions. */
export function SessionPicker({ sessions, selected, onSelect, language, t, error, step }: SessionPickerProps) {
  return (
    <fieldset
      aria-describedby={error ? `${GROUP_ID}-error` : undefined}
      aria-invalid={error ? true : undefined}
    >
      <SectionHeading as="legend" step={step} title={t.stepSession} />
      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((session, index) => {
          const checked = selected === session.session_code;
          const date = formatDate(session.start_time, language);
          const time = formatTimeRange(session.start_time, session.end_time, language);
          const inputId = `${GROUP_ID}-${index}`;
          return (
            <label
              key={session.session_code}
              htmlFor={inputId}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors',
                'has-focus-visible:ring-4 has-focus-visible:ring-(--er-ring)',
                checked
                  ? 'border-(--er-primary) bg-(--er-primary)/5'
                  : 'border-slate-200 bg-white hover:border-slate-400',
              ].join(' ')}
            >
              <input
                id={inputId}
                type="radio"
                name={GROUP_ID}
                value={session.session_code}
                checked={checked}
                onChange={() => onSelect(session.session_code)}
                className="sr-only"
              />
              <CalendarCheck
                aria-hidden="true"
                className={`mt-0.5 size-5 shrink-0 ${checked ? 'text-(--er-primary)' : 'text-slate-400'}`}
              />
              <span className="min-w-0">
                {session.name && <span className="block text-sm font-semibold text-slate-600">{session.name}</span>}
                <span className="block font-bold text-slate-900 first-letter:uppercase">
                  {date || session.session_code}
                </span>
                {time && <span className="block text-sm text-slate-600">{time}</span>}
                {session.description && <span className="mt-1 block text-sm text-slate-600">{session.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${GROUP_ID}-error`} className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
