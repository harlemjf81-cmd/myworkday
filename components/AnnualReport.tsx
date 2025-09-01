import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkSessionsMap, ChartRenderSize } from '../types.ts';
import { getMonthName } from '../utils/dateUtils.ts';
import { AnnualReportChart } from './AnnualReportChart.tsx';
import { ChartBarIcon } from './icons/ChartBarIcon.tsx';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { ChartSizeSelector } from './ChartSizeSelector.tsx'; // Import selector

interface AnnualReportProps {
  workSessions: WorkSessionsMap;
  idealMonthlyEarnings: number;
  currencySymbol: string;
  getEarningsForDay: (workDay: WorkDay) => number;
  locale: string;
}

interface MonthlyEarnings {
  monthIndex: number;
  monthName: string;
  earnings: number;
}

export const AnnualReport: React.FC<AnnualReportProps> = ({ workSessions, idealMonthlyEarnings, currencySymbol, getEarningsForDay, locale }) => {
  const { t } = useTranslation();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [chartSize, setChartSize] = useState<ChartRenderSize>('medium'); // State for chart size

  const yearlyData = useMemo(() => {
    const monthlyTotals: MonthlyEarnings[] = Array(12).fill(null).map((_, index) => ({
      monthIndex: index,
      monthName: getMonthName(index, locale),
      earnings: 0,
    }));

    Object.entries(workSessions).forEach(([dateKey, workDay]) => {
      const date = new Date(dateKey + 'T00:00:00'); 
      const year = date.getFullYear();
      const month = date.getMonth();

      if (year === currentYear) {
        monthlyTotals[month].earnings += getEarningsForDay(workDay);
      }
    });
    return monthlyTotals;
  }, [workSessions, getEarningsForDay, currentYear, locale]);

  const totalAnnualEarnings = useMemo(() => {
    return yearlyData.reduce((sum, month) => sum + month.earnings, 0);
  }, [yearlyData]);

  const earningsPerMonthForChart = useMemo(() => {
    return yearlyData.map(m => m.earnings);
  }, [yearlyData]);

  const handlePreviousYear = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);
  
  const handleCurrentYear = useCallback(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
        <div className="flex items-center mb-2 sm:mb-0">
          <ChartBarIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 mr-2" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('charts.annualReport.title')}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePreviousYear} 
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('charts.previousYear')}
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="text-center">
             <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">{currentYear}</span>
             {currentYear !== new Date().getFullYear() && (
                <button 
                    onClick={handleCurrentYear}
                    className="block text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium leading-tight"
                >
                    {t('charts.currentYear')}
                </button>
             )}
          </div>
          <button 
            onClick={handleNextYear} 
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('charts.nextYear')}
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
      
      <div className="flex justify-end mb-4">
        <ChartSizeSelector currentSize={chartSize} onSizeChange={setChartSize} />
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('charts.annualReport.month')}
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('charts.earnings')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
            {yearlyData.map((monthData) => (
              <tr key={monthData.monthIndex} className={monthData.earnings > 0 && idealMonthlyEarnings > 0 && monthData.earnings < idealMonthlyEarnings ? "bg-red-50 dark:bg-red-900/30" : ""}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {monthData.monthName}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${monthData.earnings > 0 && idealMonthlyEarnings > 0 && monthData.earnings < idealMonthlyEarnings ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-600 dark:text-slate-300"}`}>
                  {currencySymbol}{monthData.earnings.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <td className="px-4 py-3 text-left text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">{t('charts.annualReport.totalAnnual')}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800 dark:text-slate-100">
                {currencySymbol}{totalAnnualEarnings.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {totalAnnualEarnings > 0 || idealMonthlyEarnings > 0 ? (
        <AnnualReportChart
          earningsPerMonth={earningsPerMonthForChart}
          year={currentYear}
          idealMonthlyEarnings={idealMonthlyEarnings}
          chartSize={chartSize} 
          currencySymbol={currencySymbol}
          locale={locale}
        />
      ) : (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-4">{t('charts.annualReport.noEarningsYear')}</p>
      )}
    </div>
  );
};

export default AnnualReport;