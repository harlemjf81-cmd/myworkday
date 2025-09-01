import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  children: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmButtonText,
  confirmButtonColor = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  children,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
          {children}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {t('modals.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2.5 text-white font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonColor}`}
          >
            {confirmButtonText || t('modals.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
