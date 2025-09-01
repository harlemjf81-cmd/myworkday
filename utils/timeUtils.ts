import type { WorkDay } from '../types.ts';

// Parses "HH:MM" string to minutes since midnight
export const timeStringToMinutes = (timeStr: string): number | null => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
    return null;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

// Calculates duration in hours between two "HH:MM" time strings
export const calculateHours = (startTimeStr: string, endTimeStr: string): number => {
  const startMinutes = timeStringToMinutes(startTimeStr);
  const endMinutes = timeStringToMinutes(endTimeStr);

  if (startMinutes === null || endMinutes === null) {
    return 0; // If either time is not set or invalid, duration is 0
  }

  let diffInMinutes = endMinutes - startMinutes;

  // Handle shifts crossing midnight (e.g., 22:00 to 02:00)
  if (diffInMinutes < 0) {
    diffInMinutes += 24 * 60; // Add 24 hours in minutes
  }

  return diffInMinutes / 60;
};

// Rounds a Date object to the nearest 15 minutes
export const roundToNearest15Minutes = (date: Date): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const newDate = new Date(date);

  if (roundedMinutes === 60) {
    newDate.setHours(newDate.getHours() + 1);
    newDate.setMinutes(0);
  } else {
    newDate.setMinutes(roundedMinutes);
  }
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

// Formats a Date object to "HH:MM" string
export const formatTimeHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Calculates total hours for a given WorkDay object
export const getTotalHoursForDay = (workDay: WorkDay): number => {
    if (!workDay) return 0;
    return calculateHours(workDay.shift1.start, workDay.shift1.end) +
           calculateHours(workDay.shift2.start, workDay.shift2.end);
};