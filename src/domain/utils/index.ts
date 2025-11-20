/**
 * Utility Functions
 * 
 * Helper functions for date formatting, number formatting, normalization, etc.
 */

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date to ISO string (handles null/undefined)
 */
export function toISODate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === "string") return date;
  return date.toISOString();
}

/**
 * Format date for display (MM/DD/YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Format date for display with time (MM/DD/YYYY HH:MM)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Get date N months from now
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get date N years from now
 */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

/**
 * Calculate months between two dates
 */
export function monthsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months;
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Format currency (USD)
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0";
  }
  
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSign = false,
  } = options;
  
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
  
  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  
  return formatted;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Round to nearest cent
 */
export function roundToCent(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Round to nearest dollar
 */
export function roundToDollar(amount: number): number {
  return Math.round(amount);
}

/**
 * Round to nearest thousand
 */
export function roundToThousand(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

// ============================================================================
// NORMALIZATION UTILITIES
// ============================================================================

/**
 * Normalize string (trim, lowercase)
 */
export function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  return str.trim().toLowerCase();
}

/**
 * Normalize address (remove extra spaces, standardize)
 */
export function normalizeAddress(address: string | null | undefined): string {
  if (!address) return "";
  return address
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ","); // Remove double commas
}

/**
 * Normalize phone number (remove non-digits)
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Format phone number (XXX) XXX-XXXX
 */
export function formatPhone(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return phone || "";
  
  return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

/**
 * Normalize EIN (remove dashes, format)
 */
export function normalizeEIN(ein: string | null | undefined): string {
  if (!ein) return "";
  const cleaned = ein.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return ein;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Sum array of numbers
 */
export function sum(numbers: (number | null | undefined)[]): number {
  return numbers.reduce((total, num) => total + (num || 0), 0);
}

/**
 * Average of array of numbers
 */
export function average(numbers: (number | null | undefined)[]): number {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * Group array by key
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if value is not empty
 */
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value);
}

// ============================================================================
// DEBOUNCE/THROTTLE (for UI)
// ============================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}





