import React from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkSessionsMap } from '../types.ts';
import { ListBulletIcon } from './icons/ListBulletIcon.tsx';
import { CheckCircleIcon } from './icons/CheckCircleIcon.tsx';

interface PendingPaymentsListProps {
  workSessions: WorkSessionsMap;
  currencySymbol: string;
  onMarkAsPaid: (dateKey: string) => void;
  getEarningsForDay: (workDay: WorkDay) => number;
  locale: string;
}

interface PendingPaymentItem {
  dateKey: string;
  dateLabel: string;
  earnings: number;
}

export const PendingPaymentsList: React.FC<PendingPaymentsListProps> = ({ workSessions, currencySymbol, onMarkAsPaid, getEarningsForDay, locale }) => {
  const { t } = useTranslation();
  
  const pendingPayments: PendingPaymentItem[] = React.useMemo(() => {
    return Object.entries(workSessions)
      // FIX: Cast workDay to WorkDay to fix TypeScript error about 'paymentPending' not existing on type 'unknown'.
      .filter(([_, workDay]) => (workDay as WorkDay).paymentPending)
      .map(([dateKey, workDay]) => {
        const date = new Date(dateKey + 'T00:00:00');
        const dailyEarnings = getEarningsForDay(workDay as WorkDay);
        
        return {
          dateKey,
          dateLabel: date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
          earnings: dailyEarnings,
        };
      })
      .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()); 
  }, [workSessions, getEarningsForDay, locale]);

  const totalPendingAmount = React.useMemo(() => {
    return pendingPayments.reduce((sum, item) => sum + item.earnings, 0);
  }, [pendingPayments]);

  if (pendingPayments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex items-center mb-3">
          <ListBulletIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 mr-2" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('charts.pendingPayments.title')}</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400">{t('charts.pendingPayments.noPending')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center">
          <ListBulletIcon className="w-6 h-6 text-sky-600 dark:text-sky-400 mr-2" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('charts.pendingPayments.titleCount', { count: pendingPayments.length })}</h3>
        </div>
        <p className="text-md font-semibold text-amber-600 dark:text-amber-400 mt-1 sm:mt-0">
          {t('charts.pendingPayments.totalPending')} {currencySymbol}{totalPendingAmount.toFixed(2)}
        </p>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {pendingPayments.map(item => (
          <div key={item.dateKey} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-amber-50 dark:bg-amber-800/30 border border-amber-200 dark:border-amber-700/50 rounded-lg">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">{item.dateLabel}</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('charts.pendingPayments.pendingEarning')} <span className="font-semibold">{currencySymbol}{item.earnings.toFixed(2)}</span></p>
            </div>
            <button
              onClick={() => onMarkAsPaid(item.dateKey)}
              className="mt-2 sm:mt-0 sm:ml-4 flex items-center text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
              title={t('charts.pendingPayments.markAsPaid')}
            >
              <CheckCircleIcon className="w-4 h-4 mr-1.5" />
              {t('charts.pendingPayments.markAsPaid')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingPaymentsList;