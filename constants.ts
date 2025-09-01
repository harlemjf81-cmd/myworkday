import { OvertimeSettings } from './types.ts';

// Firestore Collection Names
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  WORK_SESSIONS: 'work_sessions',
};

// App Defaults
export const DEFAULT_HOURLY_RATE = 15;
export const DEFAULT_IDEAL_DAILY_EARNINGS = 0;
export const DEFAULT_IDEAL_MONTHLY_EARNINGS = 0;
export const DEFAULT_PAYMENT_REMINDER_DAYS = 7;
export const DEFAULT_CURRENCY_SYMBOL = '$';
export const DEFAULT_WORKER_NAME = 'My Name';
export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  enabled: false,
  threshold: 8,
  rate: 22.5,
};
export const DEFAULT_HEADER_BG_COLOR = '#0284c7'; // sky-600
export const DEFAULT_APP_BG_COLOR = '#f8fafc'; // slate-50
export const DEFAULT_THEME_COLORS = {
  headerBg: DEFAULT_HEADER_BG_COLOR,
  appBg: DEFAULT_APP_BG_COLOR,
};