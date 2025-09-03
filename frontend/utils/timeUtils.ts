// File: timeUtils.ts
// Description: Utility functions for consistent time handling across the application

/**
 * Converts 12-hour time format (e.g., "9:00 AM") to 24-hour format (e.g., "09:00")
 * @param time12Hour - Time in 12-hour format (e.g., "9:00 AM", "6:30 PM")
 * @returns Time in 24-hour format (e.g., "09:00", "18:30")
 */
export const convert12HourTo24Hour = (time12Hour: string): string => {
  if (!time12Hour) return '';
  
  // Remove any extra spaces and convert to uppercase
  const cleanTime = time12Hour.trim().toUpperCase();
  
  // Extract time and AM/PM
  const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) {
    console.warn('[timeUtils] Invalid 12-hour time format:', time12Hour);
    return time12Hour; // Return original if parsing fails
  }
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Format with leading zero
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Converts 24-hour time format (e.g., "09:00") to 12-hour format (e.g., "9:00 AM")
 * @param time24Hour - Time in 24-hour format (e.g., "09:00", "18:30")
 * @returns Time in 12-hour format (e.g., "9:00 AM", "6:30 PM")
 */
export const convert24HourTo12Hour = (time24Hour: string): string => {
  if (!time24Hour) return '';
  
  // Remove seconds if present
  const timeStr = time24Hour.substring(0, 5);
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  
  // Convert to 12-hour format
  let ampm = 'AM';
  let displayHour = hour;
  
  if (hour === 0) {
    // Midnight (00:00) = 12 AM
    displayHour = 12;
    ampm = 'AM';
  } else if (hour === 12) {
    // Noon (12:00) = 12 PM
    displayHour = 12;
    ampm = 'PM';
  } else if (hour > 12) {
    // Afternoon/Evening (13:00-23:59) = 1 PM - 11 PM
    displayHour = hour - 12;
    ampm = 'PM';
  } else {
    // Morning (1:00-11:59) = 1 AM - 11 AM
    displayHour = hour;
    ampm = 'AM';
  }
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Normalizes time format to ensure consistency
 * @param time - Time in any format
 * @returns Time in 24-hour format for internal use
 */
export const normalizeTime = (time: string): string => {
  if (!time) return '';
  
  // If it's already in 24-hour format, return as is
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // If it's in 12-hour format, convert to 24-hour
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time)) {
    return convert12HourTo24Hour(time);
  }
  
  // If it has seconds, remove them
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
    return time.substring(0, 5);
  }
  
  console.warn('[timeUtils] Unknown time format:', time);
  return time;
};

/**
 * Formats time for display in maps and UI
 * @param time - Time in any format
 * @returns Time in 12-hour format for display
 */
export const formatTimeForDisplay = (time: string): string => {
  if (!time) return 'Not set';
  
  // Normalize to 24-hour format first
  const normalizedTime = normalizeTime(time);
  
  // Convert to 12-hour format for display
  return convert24HourTo12Hour(normalizedTime);
};

/**
 * Checks if a shop is currently open based on working hours
 * @param openingTime - Opening time in any format
 * @param closingTime - Closing time in any format
 * @returns True if shop is currently open
 */
export const isShopCurrentlyOpen = (openingTime: string, closingTime: string): boolean => {
  if (!openingTime || !closingTime) return false;
  
  // Normalize times to 24-hour format
  const openTime = normalizeTime(openingTime);
  const closeTime = normalizeTime(closingTime);
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
  
  // Parse opening and closing times
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const openTimeMinutes = openHour * 60 + openMin;
  const closeTimeMinutes = closeHour * 60 + closeMin;
  
  // Handle shops that are open past midnight
  if (closeTimeMinutes < openTimeMinutes) {
    // Shop closes the next day (e.g., 9 AM to 2 AM)
    return currentTime >= openTimeMinutes || currentTime <= closeTimeMinutes;
  } else {
    // Shop closes the same day (e.g., 9 AM to 6 PM)
    return currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
  }
};

/**
 * Gets the time format type
 * @param time - Time string to check
 * @returns '12hour', '24hour', or 'unknown'
 */
export const getTimeFormat = (time: string): '12hour' | '24hour' | 'unknown' => {
  if (!time) return 'unknown';
  
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time)) {
    return '12hour';
  }
  
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    return '24hour';
  }
  
  return 'unknown';
};
