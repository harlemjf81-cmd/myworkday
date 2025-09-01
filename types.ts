export interface WorkShift {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface OvertimeSettings {
  enabled: boolean;
  threshold: number; // hours after which overtime rate applies
  rate: number;      // the overtime hourly rate
}

export interface WorkDay {
  shift1: WorkShift;
  shift2: WorkShift;
  paymentPending?: boolean;
  recordedEarnings?: number; // Earnings calculated at the time of save
  recordedHourlyRate?: number; // Base hourly rate at the time of save
  recordedOvertimeSettings?: OvertimeSettings; // Overtime settings at the time of save
}

export interface WorkSessionsMap {
  [dateKey: string]: WorkDay; // dateKey is YYYY-MM-DD
}

export interface ExportedData {
  workerName?: string;
  workSessions: WorkSessionsMap;
  hourlyRate: number;
  idealDailyEarnings?: number;
  idealMonthlyEarnings?: number; 
  themeColors?: ThemeColors;
  paymentReminderDays?: number; 
  currencySymbol?: string;
  overtimeSettings?: OvertimeSettings;
  dataTimestamp?: string; // ISO 8601 format of last modification
  uid?: string; // Firebase User ID
}

export interface InitialSetupSettings {
  workerName: string;
  hourlyRate: number;
  currencySymbol: string;
  idealDailyEarnings: number;
  idealMonthlyEarnings: number;
  theme: 'light' | 'dark';
  role: 'worker';
}

// FIX: The UserProfile can have a legacy 'payer' role for migration purposes,
// even though new profiles are always created with the 'worker' role.
// The type is widened here to reflect this possibility and resolve type errors.
export interface UserProfile extends Omit<InitialSetupSettings, 'theme' | 'role'> {
  uid: string;
  email: string | null;
  displayName: string | null;
  themeColors: ThemeColors;
  paymentReminderDays: number;
  overtimeSettings: OvertimeSettings;
  role: 'worker' | 'payer';
}

export interface ThemeColors {
  headerBg: string;
  appBg: string;
}

// For MonthlySummaryChart
export interface MonthlyAggregatedEarnings {
  monthYearLabel: string; // e.g., "Enero 2024"
  year: number;
  month: number; // 0-indexed
  totalEarnings: number;
  totalSurplus: number;
  weeklyEarnings: number[]; // Array of earnings for each week of the month
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// Chart Size Types
export type ChartRenderSize = 'small' | 'medium' | 'large';

// --- Worker Role Type ---

export interface WorkerReport {
  id: string;
  workerName: string;
  currencySymbol: string;
  hourlyRate: number;
  overtimeSettings: OvertimeSettings;
  dateRange: {
    start: string; // ISO Date
    end: string;   // ISO Date
  };
  workSessions: WorkSessionsMap;
  totalEarnings: number;
  generatedAt: string; // ISO Timestamp
}