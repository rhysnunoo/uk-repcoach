/**
 * Centralized date-fns utilities
 * Import from here instead of directly from date-fns to optimize bundle size
 */

export {
  format,
  formatDistanceToNow,
  isPast,
  isFuture,
  subDays,
  startOfDay,
  parseISO,
  differenceInDays,
  addDays,
} from 'date-fns';

// Common format patterns
export const DATE_FORMATS = {
  short: 'MMM d',
  medium: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  time: 'h:mm a',
  dateTime: 'MMM d, h:mm a',
  full: 'MMM d, yyyy h:mm a',
  iso: 'yyyy-MM-dd',
} as const;

// Helper functions
export function formatDate(date: Date | string, pattern: keyof typeof DATE_FORMATS | string = 'medium'): string {
  const { format } = require('date-fns');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatPattern = DATE_FORMATS[pattern as keyof typeof DATE_FORMATS] || pattern;
  return format(dateObj, formatPattern);
}

export function formatRelative(date: Date | string): string {
  const { formatDistanceToNow } = require('date-fns');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}
