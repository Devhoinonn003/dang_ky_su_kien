import { Ticket } from 'lucide-react';
import type { Dictionary } from '../i18n';
import type { Language, TicketType } from '../types';
import { formatDateTime, formatPrice, parsePrice } from '../lib/format';
import { getTicketStatus, type TicketStatus } from '../lib/serverData';
import { ChoiceGroup, type ChoiceOption } from './ChoiceGroup';

interface TicketPickerProps {
  tickets: TicketType[];
  selected: string;
  onSelect: (ticketType: string) => void;
  now: number;
  language: Language;
  t: Dictionary;
  error?: string;
}

/** Ticket choice: sold-out or off-sale tickets stay visible but disabled; empty list shows a notice. */
export function TicketPicker({ tickets, selected, onSelect, now, language, t, error }: TicketPickerProps) {
  const statusLabel: Record<Exclude<TicketStatus, 'available'>, string> = {
    sold_out: t.soldOut,
    not_on_sale: t.notOnSale,
    sale_ended: t.saleEnded,
  };

  const options: ChoiceOption[] = tickets.map((ticket) => {
    const status = getTicketStatus(ticket, now);
    const price = parsePrice(ticket.price);
    const detail = [
      status === 'available' ? t.remaining(Number(ticket.available_quantity)) : statusLabel[status],
      price === 0 ? t.freeBadge : formatPrice(ticket.price),
      status === 'not_on_sale' && ticket.sale_start_time ? t.opensAt(formatDateTime(ticket.sale_start_time, language)) : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      value: ticket.ticket_code,
      label: <span className="font-semibold">{ticket.ticket_name}</span>,
      detail: ticket.description ? (
        <>
          {ticket.description}
          <br />
          {detail}
        </>
      ) : (
        detail
      ),
      disabled: status !== 'available',
    };
  });

  return (
    <ChoiceGroup
      name="er-ticket"
      title={t.ticketPrompt}
      columns={2}
      options={options}
      selected={selected}
      onSelect={onSelect}
      error={error}
      empty={
        <div className="flex items-start gap-3 rounded-(--er-radius) border border-dashed border-(--er-border-strong) p-4 text-sm text-(--er-on-surface)">
          <Ticket className="mt-0.5 size-5 shrink-0 text-(--er-muted)" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t.noTickets}</p>
            <p className="mt-1 text-(--er-muted)">{t.noTicketsHint}</p>
          </div>
        </div>
      }
    />
  );
}
