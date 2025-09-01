import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CurrencyModalProps {
  currentSymbol: string;
  onSave: (newSymbol: string) => void;
  onClose: () => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({ currentSymbol, onSave, onClose }) => {
  const { t } = useTranslation();
  const [newSymbol, setNewSymbol] = useState<string>(currentSymbol);
  const [error, setError] = useState<string>('');

  const handleSave = () => {
    if (!newSymbol.trim()) {
      setError(t('modals.currency.emptyError'));
      return;
    }
    if (newSymbol.length > 5) {
      setError(t('modals.currency.lengthError'));
      return;
    }
    setError('');
    onSave(newSymbol.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSymbol(e.target.value);
    if (error) setError(''); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{t('modals.currency.title')}</h2>
        
        <div>
          <label htmlFor="currencySymbol" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {t('modals.currency.label')}
          </label>
          <input
            type="text"
            id="currencySymbol"
            value={newSymbol}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition text-lg"
            placeholder={t('modals.currency.placeholder')}
            maxLength={5}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {t('modals.currency.description')}
          </p>
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
            {t('modals.currency.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrencyModal;