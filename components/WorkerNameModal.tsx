import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WorkerNameModalProps {
  currentName: string;
  onSave: (newName: string) => void;
  onClose: () => void;
}

export const WorkerNameModal: React.FC<WorkerNameModalProps> = ({ currentName, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError(t('modals.workerName.error'));
      return;
    }
    setError('');
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{t('modals.workerName.title')}</h2>
        
        <div>
          <label htmlFor="workerName" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {t('modals.workerName.label')}
          </label>
          <input
            type="text"
            id="workerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition text-lg"
            placeholder={t('modals.workerName.placeholder')}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
            {t('modals.workerName.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerNameModal;
