import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkSessionsMap } from '../types.ts';
import { getWeeksInMonth, formatDateISO } from '../utils/dateUtils.ts';
import { getTotalHoursForDay } from '../utils/timeUtils.ts';
import { ChartPieIcon } from './icons/ChartPieIcon.tsx';

interface WeeklyAverageStatsProps {
  workSessions: WorkSessionsMap;
  currentMonthDate: Date;
  locale: string;
}

export const WeeklyAverageStats: React.FC<WeeklyAverageStatsProps> = ({ workSessions, currentMonthDate, locale }) => {
  const { t } = useTranslation();
  
  const stats = useMemo(() => {
    const weeksInMonth = getWeeksInMonth(currentMonthDate);
    if (weeksInMonth.length === 0) return null;

    let totalHours = 0;
    let totalDaysWorked = 0;
    const hoursByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    weeksInMonth.forEach(week => {
      week.days.forEach(day => {
        const dayKey = formatDateISO(day);
        const workDay = workSessions[dayKey];
        if (workDay) {
          const dailyHours = getTotalHoursForDay(workDay);
          if (dailyHours > 0) {
            totalHours += dailyHours;
            totalDaysWorked++;
            const dayOfWeek = day.getDay(); // 0=Sun, 1=Mon...
            const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            hoursByDayOfWeek[adjustedDayIndex] += dailyHours;
          }
        }
      });
    });

    const avgDailyHours = totalDaysWorked > 0 ? totalHours / totalDaysWorked : 0;
    const busiestDayIndex = hoursByDayOfWeek.indexOf(Math.max(...hoursByDayOfWeek));
    const dayNames = [
      t('weekdays.monday'), t('weekdays.tuesday'), t('weekdays.wednesday'),
      t('weekdays.thursday'), t('weekdays.friday'), t('weekdays.saturday'),
      t('weekdays.sunday')
    ];

    return {
      avgDailyHours: avgDailyHours.toFixed(2),
      totalDaysWorked,
      busiestDay: totalDaysWorked > 0 ? dayNames[busiestDayIndex] : t('weekdays.na'),
      totalHours: totalHours.toFixed(2),
    };
  }, [workSessions, currentMonthDate, t]);

  const renderStat = (label: string, value: string) => (
    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{value}</p>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
        <ChartPieIcon className="w-6 h-6 mr-2 text-sky-500" />
        {t('charts.weeklyAverage.title')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderStat(t('charts.weeklyAverage.daysWorked'), stats.totalDaysWorked.toString())}
        {renderStat(t('charts.weeklyAverage.totalHours'), `${stats.totalHours}h`)}
        {renderStat(t('charts.weeklyAverage.avgHoursDay'), `${stats.avgDailyHours}h`)}
        {renderStat(t('charts.weeklyAverage.busiestDay'), stats.busiestDay)}
      </div>
    </div>
  );
};

export default WeeklyAverageStats;