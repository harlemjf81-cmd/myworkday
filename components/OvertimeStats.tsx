import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkSessionsMap, OvertimeSettings, WorkDay } from '../types.ts';
import { getWeeksInMonth, formatDateISO } from '../utils/dateUtils.ts';
import { getTotalHoursForDay } from '../utils/timeUtils.ts';
import { calculateDailyEarnings } from '../utils/earningsUtils.ts';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { ChartBarSquareIcon } from './icons/ChartBarSquareIcon.tsx';

interface OvertimeStatsProps {
  workSessions: WorkSessionsMap;
  overtimeSettings: OvertimeSettings;
  currentMonthDate: Date;
  onMonthChange: (newMonth: Date) => void;
  locale: string;
}

interface WeeklyOvertimeData {
  label: string;
  hours: number;
  startDate: Date;
  endDate: Date;
}

interface DailyOvertimeData {
  date: Date;
  hours: number;
}

export const OvertimeStats: React.FC<OvertimeStatsProps> = ({ workSessions, overtimeSettings, currentMonthDate, onMonthChange, locale }) => {
  const { t } = useTranslation();
  const displayDate = currentMonthDate;

  const overtimeStats = useMemo(() => {
    if (!overtimeSettings.enabled) {
      return { totalMonth: 0, byWeek: [], byDay: [] };
    }

    const weeksInMonth = getWeeksInMonth(displayDate);
    const byDay: DailyOvertimeData[] = [];
    
    const byWeek: WeeklyOvertimeData[] = weeksInMonth.map((week, index) => {
      let weeklyTotal = 0;
      week.days.forEach(day => {
        const workDay = workSessions[formatDateISO(day)];
        if (workDay) {
          const totalHours = getTotalHoursForDay(workDay);
          const otSettings = workDay.recordedOvertimeSettings ?? overtimeSettings;
          
          if (otSettings.enabled && totalHours > otSettings.threshold) {
            const { overtimeHours } = calculateDailyEarnings(totalHours, 0, otSettings);
            if (overtimeHours > 0) {
              weeklyTotal += overtimeHours;
              byDay.push({ date: day, hours: overtimeHours });
            }
          }
        }
      });
      return {
        label: `${t('charts.weeklySummary.week')} ${index + 1}`,
        hours: weeklyTotal,
        startDate: week.days[0],
        endDate: week.days[week.days.length - 1],
      };
    });

    const totalMonth = byWeek.reduce((sum, week) => sum + week.hours, 0);

    return { totalMonth, byWeek, byDay: byDay.sort((a,b) => a.date.getTime() - b.date.getTime()) };
  }, [displayDate, workSessions, overtimeSettings, t]);

  const handlePrevMonth = () => onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const handleNextMonth = () => onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

  if (!overtimeSettings.enabled) {
    return (
      <div>
        <div className="flex items-center mb-4">
          <ChartBarSquareIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 mr-2" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('charts.overtime.title')}</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {t('charts.overtime.notEnabled')}
        </p>
      </div>
    );
  }
  
  const { totalMonth, byWeek, byDay } = overtimeStats;
  const maxWeeklyHours = Math.max(...byWeek.map(w => w.hours), 1); // Avoid division by zero, min 1 hour for scale

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <ChartBarSquareIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {t('charts.overtime.title')}
                </h3>
            </div>
             <div className="flex items-center">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('charts.previousMonth')}>
                    <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                 <span className="text-sm font-medium w-28 text-center">{displayDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
                <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('charts.nextMonth')}>
                    <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
            </div>
        </div>

        <div className="bg-sky-50 dark:bg-sky-900/50 p-3 rounded-lg text-center mb-6 shadow-inner">
            <p className="text-sm font-medium text-sky-800 dark:text-sky-300">{t('charts.overtime.totalMonth')}</p>
            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{totalMonth.toFixed(2)}h</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('charts.overtime.weeklyBreakdown')}</h4>
                {byWeek.length > 0 && totalMonth > 0 ? (
                    <div className="space-y-3">
                        {byWeek.map(week => (
                            <div key={week.label}>
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{week.label}</span>
                                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">{week.hours.toFixed(2)}h</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                    <div 
                                        className="bg-sky-500 h-2.5 rounded-full" 
                                        style={{ width: `${(week.hours / maxWeeklyHours) * 100}%` }}
                                        title={`${week.hours.toFixed(2)} ${t('notifications.hours')}`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('charts.overtime.noOvertimeMonth')}</p>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('charts.overtime.dailyBreakdown')}</h4>
                {byDay.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {byDay.map(day => (
                            <div key={day.date.toISOString()} className="flex justify-between items-center text-sm p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <span className="text-slate-600 dark:text-slate-300">{day.date.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{day.hours.toFixed(2)}h</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('charts.overtime.noOvertimeDays')}</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default OvertimeStats;