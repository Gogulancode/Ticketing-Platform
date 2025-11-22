export interface TicketWithPublicId {
  id?: string;
  ticketId?: string;
  Id?: string;
  publicId?: number | null;
}

/**
 * Returns the display ticket number, falling back to a stable hash-based value if no publicId exists.
 */
export const getDisplayTicketNumber = (ticket: TicketWithPublicId | null | undefined): string => {
  if (!ticket) {
    return '';
  }

  if (ticket.publicId && ticket.publicId > 0) {
    return ticket.publicId.toString();
  }

  const candidateId = ticket.id || ticket.ticketId || ticket.Id;
  const rawId = candidateId?.toString().replace(/-/g, '');
  if (!rawId) {
    return '';
  }

  let hash = 0;
  for (let i = 0; i < rawId.length; i += 1) {
    const charCode = rawId.charCodeAt(i);
    hash = ((hash << 5) - hash) + charCode;
    hash |= 0; // Force 32-bit integer
  }

  const fallbackId = 100000 + Math.abs(hash) % 900000;
  return fallbackId.toString();
};
