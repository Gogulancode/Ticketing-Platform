/**
 * Date and Time Utilities for Indian Standard Time (IST)
 */

// IST Timezone Configuration
export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET = '+05:30';

/**
 * Convert UTC date to IST
 */
export const toIST = (utcDate: Date | string): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
};

/**
 * Format date in IST with various options
 */
export const formatIST = (
  date: Date | string,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  } = {}
): string => {
  try {
    const {
      includeTime = true,
      includeSeconds = false,
      format = 'medium'
    } = options;

    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.error('Invalid date provided to formatIST:', date);
      return 'Invalid Date';
    }
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: format === 'short' ? 'numeric' : format === 'medium' ? 'short' : 'long',
      day: 'numeric',
    };

    if (includeTime) {
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
      if (includeSeconds) {
        dateOptions.second = '2-digit';
      }
      dateOptions.hour12 = true;
    }

    return d.toLocaleString('en-IN', dateOptions);
  } catch (error) {
    console.error('Error formatting date to IST:', error, 'Date:', date);
    return 'Invalid Date';
  }
};

/**
 * Format time only in IST
 */
export const formatTimeIST = (
  date: Date | string,
  includeSeconds: boolean = false
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  if (includeSeconds) {
    timeOptions.second = '2-digit';
  }

  return d.toLocaleString('en-IN', timeOptions);
};

/**
 * Format date only in IST
 */
export const formatDateIST = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get relative time in IST (e.g., "2 hours ago")
 */
export const getRelativeTimeIST = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatDateIST(d);
};

/**
 * Check if a date is today in IST
 */
export const isTodayIST = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const dateIST = d.toLocaleDateString('en-IN', { timeZone: IST_TIMEZONE });
  const todayIST = today.toLocaleDateString('en-IN', { timeZone: IST_TIMEZONE });
  
  return dateIST === todayIST;
};

/**
 * Get current IST time
 */
export const getCurrentIST = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
};

/**
 * Convert local time to IST for API submission
 */
export const toISTForAPI = (localDate: Date): string => {
  // Convert to IST and return as ISO string
  const istDate = new Date(localDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
  return istDate.toISOString();
};

/**
 * Format datetime for ticket displays
 */
export const formatTicketDateTime = (date: Date | string): string => {
  return formatIST(date, { includeTime: true, format: 'medium' });
};

/**
 * Format datetime for email timestamps  
 */
export const formatEmailDateTime = (date: Date | string): string => {
  return formatIST(date, { includeTime: true, includeSeconds: true, format: 'medium' });
};

/**
 * Format duration between two dates
 */
export const formatDuration = (startDate: Date | string, endDate?: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return remainingHours > 0 ? `${diffDays}d ${remainingHours}h` : `${diffDays}d`;
  }
  
  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    return remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}m` : `${diffHours}h`;
  }
  
  return `${diffMinutes}m`;
};

// Default export with all utilities
export default {
  toIST,
  formatIST,
  formatTimeIST,
  formatDateIST,
  getRelativeTimeIST,
  isTodayIST,
  getCurrentIST,
  toISTForAPI,
  formatTicketDateTime,
  formatEmailDateTime,
  formatDuration,
  IST_TIMEZONE,
  IST_OFFSET
};