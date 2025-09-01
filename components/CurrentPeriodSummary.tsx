import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkSessionsMap, WorkDay } from '../types.ts';
import { formatDateISO } from '../utils/dateUtils.ts';
import { TargetIcon } from './icons/TargetIcon.tsx';

interface CurrentPeriodSummaryProps {
  selectedDate: Date;
  workSessions: WorkSessionsMap;
  currencySymbol: string;
  idealDailyEarnings: number;
  idealMonthlyEarnings: number;
  getEarningsForDay: (workDay: WorkDay) => number;
}

export const CurrentPeriodSummary: React.FC<CurrentPeriodSummaryProps> = ({ selectedDate, workSessions, currencySymbol, idealDailyEarnings, idealMonthlyEarnings, getEarningsForDay }) => {
  const { t } = useTranslation();

  const summary = useMemo(() => {
    // Daily
    const todayKey = formatDateISO(selectedDate);
    const dayData = workSessions[todayKey];
    const dailyEarnings = dayData ? getEarningsForDay(dayData) : 0;

    // Weekly
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    
    let weeklyEarnings = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateKey = formatDateISO(date);
        if (workSessions[dateKey]) {
            weeklyEarnings += getEarningsForDay(workSessions[dateKey]);
        }
    }

    // Monthly
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    let monthlyEarnings = 0;
    Object.entries(workSessions).forEach(([dateKey, workDay]) => {
        const date = new Date(dateKey + 'T00:00:00');
        if (date.getFullYear() === year && date.getMonth() === month) {
            monthlyEarnings += getEarningsForDay(workDay);
        }
    });

    return {
        dailyEarnings,
        weeklyEarnings,
        monthlyEarnings,
    };
  }, [selectedDate, workSessions, getEarningsForDay]);

  const renderStat = (labelKey: string, value: string, detailKey: string, detailValue: string) => (
    <div className="flex-1 text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(labelKey)}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</p>
        {detailValue && <p className="text-xs text-slate-500 dark:text-slate-400">{t(detailKey, { amount: detailValue })}</p>}
    </div>
  );

  return (
    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg mt-6 lg:mt-8">
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
        <TargetIcon className="w-5 h-5 mr-2 text-sky-500"/> {t('charts.currentPeriodSummary.title')}
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        {renderStat("charts.currentPeriodSummary.today", `${currencySymbol}${summary.dailyEarnings.toFixed(2)}`, 'charts.goal', `${currencySymbol}${idealDailyEarnings.toFixed(2)}`)}
        {renderStat("charts.currentPeriodSummary.thisWeek", `${currencySymbol}${summary.weeklyEarnings.toFixed(2)}`, '', '')}
        {renderStat("charts.currentPeriodSummary.thisMonth", `${currencySymbol}${summary.monthlyEarnings.toFixed(2)}`, 'charts.goal', `${currencySymbol}${idealMonthlyEarnings.toFixed(2)}`)}
      </div>
    </div>
  );
};