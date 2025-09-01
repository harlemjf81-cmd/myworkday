import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { formatDateISO, getMonthName, getDaysInMonthGrid } from '../utils/dateUtils.ts';
import { calculateHours } from '../utils/timeUtils.ts'; 
import { WorkDay, WorkSessionsMap } from '../types.ts';

interface CalendarGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  workSessions: WorkSessionsMap;
  currencySymbol: string;
  getEarningsForDay: (workDay: WorkDay) => number;
  locale: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ selectedDate, onDateSelect, workSessions, currencySymbol, getEarningsForDay, locale }) => {
  const { t } = useTranslation();
  const [displayDate, setDisplayDate] = useState<Date>(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth();

  const WEEK_DAYS = useMemo(() => [
    t('weekdaysShort.monday'), t('weekdaysShort.tuesday'), t('weekdaysShort.wednesday'),
    t('weekdaysShort.thursday'), t('weekdaysShort.friday'), t('weekdaysShort.saturday'),
    t('weekdaysShort.sunday')
  ], [t]);

  const WEEK_DAYS_WITH_TOTAL = [...WEEK_DAYS, t('charts.calendar.weekTotal')];

  const { totalMonthEarnings, daysInGrid } = useMemo(() => {
    const gridDays = getDaysInMonthGrid(currentYear, currentMonth);
    let totalEarnings = 0;

    if (workSessions && typeof workSessions === 'object') {
        Object.entries(workSessions).forEach(([dateKey, workDay]) => {
            const date = new Date(dateKey + 'T00:00:00');
            if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                totalEarnings += getEarningsForDay(workDay);
            }
        });
    }
    return { totalMonthEarnings: totalEarnings, daysInGrid: gridDays };
  }, [currentYear, currentMonth, workSessions, getEarningsForDay]);


  const handlePrevMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const handleToday = () => {
    const today = new Date();
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(today);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={t('charts.previousMonth')}
        >
          <ChevronLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize">
                {getMonthName(currentMonth, locale)} {currentYear}
            </h2>
            {totalMonthEarnings > 0 && (
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 -mt-1">
                    {t('charts.totalMonth')} {currencySymbol}{totalMonthEarnings.toFixed(2)}
                </p>
            )}
            <button 
                onClick={handleToday}
                className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium"
            >
                {t('charts.today')}
            </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={t('charts.nextMonth')}
        >
          <ChevronRightIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-8 gap-1 text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
        {WEEK_DAYS_WITH_TOTAL.map(day => <div key={day} className={day === t('charts.calendar.weekTotal') ? 'font-semibold text-sky-600 dark:text-sky-400' : ''}>{day}</div>)}
      </div>

      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: Math.ceil(daysInGrid.length / 7) }).map((_, weekIndex) => {
          const weekDays = daysInGrid.slice(weekIndex * 7, weekIndex * 7 + 7);
          let weeklyTotal = 0;

          const weekDayCells = weekDays.map((day, dayIndex) => {
            if (!day) return <div key={`empty-${weekIndex}-${dayIndex}`} className="p-2"></div>;
            
            const dateISO = formatDateISO(day);
            const workDayData = workSessions[dateISO];
            
            if (workDayData) {
              weeklyTotal += getEarningsForDay(workDayData);
            }

            const isCurrentlySelected = formatDateISO(selectedDate) === dateISO;
            const isToday = formatDateISO(new Date()) === dateISO;
            
            let showDot = false;
            let dotIsAmber = false;
            let dotTitle = '';

            if (workDayData) {
              const isActuallyPending = workDayData.paymentPending === true;
              const earnings = getEarningsForDay(workDayData);
              const hoursShift1 = calculateHours(workDayData.shift1?.start || '', workDayData.shift1?.end || '');
              const hoursShift2 = calculateHours(workDayData.shift2?.start || '', workDayData.shift2?.end || '');
              const totalHoursOnDay = hoursShift1 + hoursShift2;

              if (isActuallyPending) {
                showDot = true;
                dotIsAmber = true;
                dotTitle = t('dayEditor.pendingPayment');
              } else if (earnings > 0 || totalHoursOnDay > 0) {
                showDot = true;
                dotIsAmber = false;
                dotTitle = t('dayEditor.save');
              }
            }
            
            let dayClasses = "p-1.5 sm:p-2 rounded-lg cursor-pointer transition-all duration-150 ease-in-out flex items-center justify-center aspect-square text-sm relative ";
            
            if (isCurrentlySelected) {
              dayClasses += "bg-sky-500 text-white font-semibold ring-2 ring-sky-300 dark:bg-sky-600 dark:ring-sky-500";
            } else if (isToday) {
              dayClasses += "bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-200 font-medium hover:bg-sky-200 dark:hover:bg-sky-700";
            } else {
              dayClasses += "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700";
            }
            
            return (
              <div
                key={dateISO}
                onClick={() => onDateSelect(day)}
                className={dayClasses}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onDateSelect(day);}}
                aria-pressed={isCurrentlySelected}
                aria-label={`${t('dayEditor.selectDate')} ${day.toLocaleDateString(locale)}${showDot && dotTitle ? `, ${dotTitle}` : ''}`}
              >
                {day.getDate()}
                {showDot && !isCurrentlySelected && ( 
                  <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 
                                    ${dotIsAmber ? 'w-2 h-2 bg-amber-500' : 'w-1.5 h-1.5 bg-green-500'} 
                                    rounded-full`}
                        title={dotTitle}>
                  </span>
                )}
              </div>
            );
          });
          
          return (
            <React.Fragment key={`week-row-${weekIndex}`}>
              {weekDayCells}
              <div className="flex items-center justify-center aspect-square bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                <span className={`text-xs font-bold ${weeklyTotal > 0 ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {weeklyTotal > 0 ? `${currencySymbol}${weeklyTotal.toFixed(0)}` : '-'}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  );
};