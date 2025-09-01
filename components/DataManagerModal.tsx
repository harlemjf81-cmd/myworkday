import React from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from './icons/XMarkIcon.tsx';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon.tsx';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportLocal: () => void;
  onImportLocal: () => void;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  onExportLocal,
  onImportLocal,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {t('modals.dataManager.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('modals.close')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-500 mb-2 border-b border-sky-200 dark:border-sky-800 pb-1">
              {t('modals.dataManager.localBackup')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {t('modals.dataManager.localDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onExportLocal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ArrowUpTrayIcon className="w-5 h-5" />
                {t('modals.dataManager.exportToFile')}
              </button>
              <button onClick={onImportLocal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ArrowDownTrayIcon className="w-5 h-5" />
                {t('modals.dataManager.importFromFile')}
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-semibold rounded-lg transition-colors duration-150"
          >
            {t('modals.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagerModal;