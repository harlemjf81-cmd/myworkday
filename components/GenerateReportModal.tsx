import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkSessionsMap, OvertimeSettings, WorkerReport, WorkDay } from '../types.ts';
import { formatDateISO } from '../utils/dateUtils.ts';
import { calculateHours } from '../utils/timeUtils.ts';
import { calculateDailyEarnings } from '../utils/earningsUtils.ts';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { XMarkIcon } from './icons/XMarkIcon.tsx';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workSessions: WorkSessionsMap;
  workerName: string;
  currencySymbol: string;
  hourlyRate: number;
  overtimeSettings: OvertimeSettings;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
  workSessions,
  workerName,
  currencySymbol,
  hourlyRate,
  overtimeSettings,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const today = formatDateISO(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const handleGenerateReport = useCallback(() => {
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');

      if (start > end) {
        addNotification(t('notifications.errorGeneratingReport', { error: 'Start date cannot be after end date.' }), 'error');
        return;
      }

      const reportSessions: WorkSessionsMap = {};
      let totalEarnings = 0;

      Object.entries(workSessions).forEach(([dateKey, session]) => {
        const sessionDate = new Date(dateKey + 'T00:00:00');
        if (sessionDate >= start && sessionDate <= end) {
          // FIX: Cast session to WorkDay to resolve TypeScript errors about properties not existing on 'unknown'.
          const sessionTyped = session as WorkDay;
          reportSessions[dateKey] = sessionTyped;
          const totalHours = calculateHours(sessionTyped.shift1.start, sessionTyped.shift1.end) + calculateHours(sessionTyped.shift2.start, sessionTyped.shift2.end);
          const { earnings } = calculateDailyEarnings(
            totalHours,
            sessionTyped.recordedHourlyRate ?? hourlyRate,
            sessionTyped.recordedOvertimeSettings ?? overtimeSettings
          );
          totalEarnings += earnings;
        }
      });

      const report: WorkerReport = {
        id: `report-${workerName.replace(/\s/g, '-')}-${Date.now()}`,
        workerName,
        currencySymbol,
        hourlyRate,
        overtimeSettings,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        workSessions: reportSessions,
        totalEarnings,
        generatedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `work_report_${workerName.replace(/\s/g, '_')}_${startDate}_${endDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addNotification(t('notifications.reportGenerated'), 'success');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification(t('notifications.errorGeneratingReport', { error: errorMessage }), 'error');
    }
  }, [startDate, endDate, workSessions, workerName, currencySymbol, hourlyRate, overtimeSettings, addNotification, onClose, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('modals.generateReport.title')}</h2>
             <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{t('modals.generateReport.description')}</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              {t('modals.generateReport.startDate')}
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              {t('modals.generateReport.endDate')}
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGenerateReport}
            className="w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {t('modals.generateReport.generateButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;