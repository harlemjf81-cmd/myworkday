import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OvertimeSettings } from '../types.ts';

interface OvertimeSettingsModalProps {
  currentSettings: OvertimeSettings;
  baseHourlyRate: number;
  currencySymbol: string;
  onSave: (newSettings: OvertimeSettings) => void;
  onClose: () => void;
}

export const OvertimeSettingsModal: React.FC<OvertimeSettingsModalProps> = ({ currentSettings, baseHourlyRate, currencySymbol, onSave, onClose }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [threshold, setThreshold] = useState<string>(currentSettings.threshold.toString());
  const [rate, setRate] = useState<string>(currentSettings.rate.toString());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setEnabled(currentSettings.enabled);
    setThreshold(currentSettings.threshold.toString());
    setRate(currentSettings.rate.toString());
  }, [currentSettings]);

  const handleSave = () => {
    const thresholdValue = parseFloat(threshold);
    const rateValue = parseFloat(rate);

    if (enabled) {
      if (isNaN(thresholdValue) || thresholdValue <= 0) {
        setError(t('modals.overtime.thresholdError'));
        return;
      }
      if (isNaN(rateValue) || rateValue < 0) {
        setError(t('modals.overtime.rateError'));
        return;
      }
    }
    
    setError('');
    onSave({
      enabled,
      threshold: thresholdValue,
      rate: rateValue,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('modals.overtime.title')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t('modals.overtime.description', { currencySymbol, rate: baseHourlyRate.toFixed(2) })}
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
            <label htmlFor="enableOvertime" className="font-medium text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              {t('modals.overtime.enableLabel')}
            </label>
            <button
              type="button"
              id="enableOvertime"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(prev => !prev)}
              className={`${
                enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
              } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500`}
            >
              <span
                className={`${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>
          
          <div className={`transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="overtimeThreshold" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('modals.overtime.thresholdLabel')}
                </label>
                <input
                  type="number"
                  id="overtimeThreshold"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  disabled={!enabled}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label htmlFor="overtimeRate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t('modals.overtime.newRateLabel', { currencySymbol })}
                </label>
                <input
                  type="number"
                  id="overtimeRate"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={!enabled}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {t('modals.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {t('modals.overtime.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

// FIX: Add default export to comply with React.lazy expectation in WorkerView.tsx
export default OvertimeSettingsModal;
