import { OvertimeSettings } from '../types.ts';

/**
 * Calculates the total earnings for a day, applying overtime rules if applicable.
 * @param totalHours - The total hours worked in the day.
 * @param baseRate - The standard hourly rate.
 * @param overtimeSettings - The overtime configuration object.
 * @returns An object containing the total earnings, base hours, and overtime hours.
 */
export const calculateDailyEarnings = (
  totalHours: number,
  baseRate: number,
  overtimeSettings?: OvertimeSettings
): { earnings: number; baseHours: number; overtimeHours: number } => {
  if (!overtimeSettings || !overtimeSettings.enabled || totalHours <= overtimeSettings.threshold || overtimeSettings.threshold <= 0 || overtimeSettings.rate < 0) {
    return { earnings: totalHours * baseRate, baseHours: totalHours, overtimeHours: 0 };
  }

  const baseHours = Math.min(totalHours, overtimeSettings.threshold);
  const overtimeHours = totalHours - baseHours;

  const baseEarnings = baseHours * baseRate;
  const overtimeEarnings = overtimeHours * overtimeSettings.rate;

  return { earnings: baseEarnings + overtimeEarnings, baseHours, overtimeHours };
};