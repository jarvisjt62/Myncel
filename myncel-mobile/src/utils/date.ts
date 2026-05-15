import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy h:mm a');
  } catch {
    return '—';
  }
}

export function formatRelative(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function isOverdue(iso?: string | null): boolean {
  if (!iso) return false;
  try {
    return isPast(parseISO(iso));
  } catch {
    return false;
  }
}
