/**
 * Date utility functions for local timezone-safe date calculations
 */

/**
 * Format a Date object into YYYY-MM-DD in the user's local timezone
 * @param {Date|string|number} d 
 * @returns {string} 'YYYY-MM-DD'
 */
export const formatLocalDate = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's date in YYYY-MM-DD local format
 * @returns {string}
 */
export const getTodayDateStr = () => {
  return formatLocalDate(new Date());
};

/**
 * Returns yesterday's date in YYYY-MM-DD local format
 * @returns {string}
 */
export const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
};

/**
 * Get the Monday 00:00:00 Date of the current week in local timezone
 * @param {Date} [baseDate]
 * @returns {Date}
 */
export const getStartOfWeek = (baseDate = new Date()) => {
  const now = new Date(baseDate);
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  // Diff to get to Monday (if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days)
  const diffToMonday = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  return new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);
};

/**
 * Check if two dates represent the exact same calendar day in local timezone
 * @param {Date|string|number} d1 
 * @param {Date|string|number} d2 
 * @returns {boolean}
 */
export const isSameDay = (d1, d2) => {
  return formatLocalDate(d1) === formatLocalDate(d2);
};
