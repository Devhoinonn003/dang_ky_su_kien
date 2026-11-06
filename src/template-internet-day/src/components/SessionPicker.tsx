import type { Dictionary } from '../i18n';
import type { Language, Session } from '../types';
import { formatShortDate, formatTimeRange } from '../lib/format';
import { ChoiceGroup } from './ChoiceGroup';

interface SessionPickerProps {
  sessions: Session[];
  selected: string;
  onSelect: (sessionCode: string) => void;
  language: Language;
  t: Dictionary;
  error?: string;
}

/** Day choice, rendered only when there are at least two sessions. */
export function SessionPicker({ sessions, selected, onSelect, language, t, error }: SessionPickerProps) {
  const options = sessions.map((session) => {
    const date = formatShortDate(session.start_time, language);
    const time = formatTimeRange(session.start_time, session.end_time, language);
    return {
      value: session.session_code,
      label: session.name || date || session.session_code,
      detail: [session.name ? date : '', time, session.description].filter(Boolean).join(' · ') || undefined,
    };
  });

  return (
    <ChoiceGroup
      name="er-session"
      title={t.sessionPrompt}
      options={options}
      selected={selected}
      onSelect={onSelect}
      error={error}
    />
  );
}
