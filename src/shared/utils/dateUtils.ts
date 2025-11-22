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
 * Manually converts UTC to IST by adding +5:30 offset
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

    // Parse date string, ensuring it's treated as UTC
    let d: Date;
    if (typeof date === 'string') {
      // If the string doesn't end with 'Z', it might not be parsed as UTC
      // Force UTC parsing by ensuring the string has 'Z' or using Date.UTC
      if (!date.endsWith('Z') && !date.includes('+') && !date.includes('GMT')) {
        // Append 'Z' to force UTC interpretation
        d = new Date(date + (date.includes('T') ? 'Z' : 'T00:00:00Z'));
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.error('Invalid date provided to formatIST:', date);
      return 'Invalid Date';
    }
    
    // Manually convert UTC to IST by adding 5 hours 30 minutes offset
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const utcTime = d.getTime();
    const istDate = new Date(utcTime + IST_OFFSET_MS);
    
    // Format using UTC methods to avoid browser timezone interference
    const year = istDate.getUTCFullYear();
    const month = istDate.getUTCMonth();
    const day = istDate.getUTCDate();
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const seconds = istDate.getUTCSeconds();
    
    // Month names
    const monthNames = {
      short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    
    // Format date part
    let dateStr = '';
    if (format === 'short') {
      dateStr = `${day}/${month + 1}/${year}`;
    } else if (format === 'medium') {
      dateStr = `${day} ${monthNames.short[month]} ${year}`;
    } else {
      dateStr = `${day} ${monthNames.long[month]} ${year}`;
    }
    
    // Format time part if needed
    if (includeTime) {
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'pm' : 'am';
      const minuteStr = minutes.toString().padStart(2, '0');
      
      if (includeSeconds) {
        const secondStr = seconds.toString().padStart(2, '0');
        dateStr += `, ${hour12.toString().padStart(2, '0')}:${minuteStr}:${secondStr} ${ampm}`;
      } else {
        dateStr += `, ${hour12.toString().padStart(2, '0')}:${minuteStr} ${ampm}`;
      }
    }
    
    return dateStr;
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