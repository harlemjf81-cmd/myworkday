import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentReminderSettingsModalProps {
  currentReminderDays: number;
  onSave: (newReminderDays: number) => void;
  onClose: () => void;
}

export const PaymentReminderSettingsModal: React.FC<PaymentReminderSettingsModalProps> = ({ currentReminderDays, onSave, onClose }) => {
  const { t } = useTranslation();
  const [newReminderDays, setNewReminderDays] = useState<string>(currentReminderDays.toString());
  const [error, setError] = useState<string>('');

  const handleSave = () => {
    const daysValue = parseInt(newReminderDays, 10);
    if (isNaN(daysValue) || daysValue <= 0) {
      setError(t('modals.paymentReminder.error'));
      return;
    }
    setError('');
    onSave(daysValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReminderDays(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{t('modals.paymentReminder.title')}</h2>
        
        <div>
          <label htmlFor="reminderDays" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {t('modals.paymentReminder.label')}
          </label>
          <input
            type="number"
            id="reminderDays"
            value={newReminderDays}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition text-lg"
            placeholder={t('modals.paymentReminder.placeholder')}
            min="1"
            step="1"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {t('modals.paymentReminder.description')}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {t('modals.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {t('modals.paymentReminder.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReminderSettingsModal;