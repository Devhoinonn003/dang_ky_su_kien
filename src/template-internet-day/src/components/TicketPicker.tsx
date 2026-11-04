import { Check, Ticket } from 'lucide-react';
import type { Dictionary } from '../i18n';
import type { Language, TicketType } from '../types';
import { formatDateTime, formatPrice, parsePrice } from '../lib/format';
import { getTicketStatus, type TicketStatus } from '../lib/serverData';
import { SectionHeading } from './SectionHeading';

interface TicketPickerProps {
  tickets: TicketType[];
  selected: string;
  onSelect: (ticketType: string) => void;
  now: number;
  language: Language;
  t: Dictionary;
  error?: string;
  step: number;
}

const GROUP_ID = 'er-ticket';

/** Ticket list: sold-out or off-sale tickets stay visible but disabled; empty list shows a notice. */
export function TicketPicker({ tickets, selected, onSelect, now, language, t, error, step }: TicketPickerProps) {
  const statusLabel: Record<Exclude<TicketStatus, 'available'>, string> = {
    sold_out: t.soldOut,
    not_on_sale: t.notOnSale,
    sale_ended: t.saleEnded,
  };

  return (
    <fieldset
      aria-describedby={error ? `${GROUP_ID}-error` : undefined}
      aria-invalid={error ? true : undefined}
    >
      <SectionHeading as="legend" step={step} title={t.stepTicket} />

      {tickets.length === 0 ? (
        <div className="flex items-start gap-3 rounded-(--er-radius) border border-dashed border-(--er-border-strong) bg-(--er-subtle) p-5 text-(--er-on-surface)">
          <Ticket className="mt-0.5 size-5 shrink-0 text-(--er-muted)" aria-hidden="true" />
          <div>
            <p className="font-semibold text-(--er-on-surface)">{t.noTickets}</p>
            <p className="mt-1 text-sm">{t.noTicketsHint}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map((ticket, index) => {
            const status = getTicketStatus(ticket, now);
            const disabled = status !== 'available';
            const checked = selected === ticket.ticket_code;
            const price = parsePrice(ticket.price);
            const inputId = `${GROUP_ID}-${index}`;

            return (
              <label
                key={ticket.ticket_code}
                htmlFor={inputId}
                className={[
                  'relative flex gap-3 rounded-(--er-radius) border-2 p-4 transition-colors',
                  'has-focus-visible:ring-4 has-focus-visible:ring-(--er-ring)',
                  disabled
                    ? 'cursor-not-allowed border-(--er-border) bg-(--er-subtle)'
                    : checked
                      ? 'cursor-pointer border-(--er-primary) bg-(--er-primary)/5'
                      : 'cursor-pointer border-(--er-border) bg-(--er-surface) hover:border-(--er-muted)',
                ].join(' ')}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={GROUP_ID}
                  value={ticket.ticket_code}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onSelect(ticket.ticket_code)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={[
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    disabled
                      ? 'border-(--er-border-strong) bg-(--er-subtle)'
                      : checked
                        ? 'border-(--er-primary) bg-(--er-primary) text-(--er-on-primary)'
                        : 'border-(--er-muted) bg-(--er-surface)',
                  ].join(' ')}
                >
                  {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <span className={`font-bold ${disabled ? 'text-(--er-muted)' : 'text-(--er-on-surface)'}`}>{ticket.ticket_name}</span>
                    <span className={`font-bold whitespace-nowrap ${disabled ? 'text-(--er-muted)' : 'text-(--er-on-surface)'}`}>
                      {formatPrice(ticket.price)}
                    </span>
                  </span>
                  {ticket.description && (
                    <span className={`mt-1 block text-sm ${disabled ? 'text-(--er-muted)' : 'text-(--er-muted)'}`}>
                      {ticket.description}
                    </span>
                  )}
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    {disabled ? (
                      <span className="rounded-md bg-(--er-on-surface) px-2 py-0.5 text-(--er-surface)">{statusLabel[status]}</span>
                    ) : (
                      <span className="rounded-md bg-(--er-success-bg) px-2 py-0.5 text-(--er-success)">
                        {t.remaining(Number(ticket.available_quantity))}
                      </span>
                    )}
                    {price === 0 && <span className="rounded-md bg-(--er-info-bg) px-2 py-0.5 text-(--er-info)">{t.freeBadge}</span>}
                    {status === 'not_on_sale' && ticket.sale_start_time && (
                      <span className="font-medium text-(--er-muted)">
                        {t.opensAt(formatDateTime(ticket.sale_start_time, language))}
                      </span>
                    )}
                    {checked && <span className="font-medium text-(--er-muted)">{t.quantityOne}</span>}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error && (
        <p id={`${GROUP_ID}-error`} className="mt-2 text-sm font-medium text-(--er-danger)">
          {error}
        </p>
      )}
    </fieldset>
  );
}
