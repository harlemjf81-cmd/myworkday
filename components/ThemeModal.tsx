import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types.ts';

interface ThemeModalProps {
  currentThemeColors: ThemeColors;
  onSave: (newColors: ThemeColors) => void;
  onClose: () => void;
}

const presetThemes: (ThemeColors & { nameKey: string })[] = [
  { nameKey: 'modals.theme.presets.sky', headerBg: '#0284c7', appBg: '#f8fafc' },
  { nameKey: 'modals.theme.presets.slate', headerBg: '#334155', appBg: '#0f172a' },
  { nameKey: 'modals.theme.presets.forest', headerBg: '#166534', appBg: '#f0fdf4' },
  { nameKey: 'modals.theme.presets.plum', headerBg: '#581c87', appBg: '#f5f3ff' },
  { nameKey: 'modals.theme.presets.sunset', headerBg: '#f97316', appBg: '#fff7ed' },
  { nameKey: 'modals.theme.presets.ocean', headerBg: '#1d4ed8', appBg: '#eff6ff' },
  { nameKey: 'modals.theme.presets.hacker', headerBg: '#000000', appBg: '#00ff00' },
];


export const ThemeModal: React.FC<ThemeModalProps> = ({ currentThemeColors, onSave, onClose }) => {
  const { t } = useTranslation();
  const [headerBg, setHeaderBg] = useState<string>(currentThemeColors.headerBg);
  const [appBg, setAppBg] = useState<string>(currentThemeColors.appBg);
  const [showCustom, setShowCustom] = useState<boolean>(false);

  useEffect(() => {
    setHeaderBg(currentThemeColors.headerBg);
    setAppBg(currentThemeColors.appBg);
  }, [currentThemeColors]);

  const handleSave = () => {
    onSave({ headerBg, appBg });
  };
  
  const handleSelectPreset = (colors: ThemeColors) => {
    setHeaderBg(colors.headerBg);
    setAppBg(colors.appBg);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{t('modals.theme.title')}</h2>
        
        {showCustom ? (
          // Custom color picker view
          <div className="space-y-4">
            <div>
              <label htmlFor="headerBgColor" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {t('modals.theme.headerColor')}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="headerBgColor"
                  value={headerBg}
                  onChange={(e) => setHeaderBg(e.target.value)}
                  className="w-10 h-10 p-0 border-none rounded-md cursor-pointer"
                />
                <input 
                  type="text"
                  value={headerBg}
                  onChange={(e) => setHeaderBg(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
                  placeholder="#0284c7"
                />
              </div>
            </div>
            <div>
              <label htmlFor="appBgColor" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {t('modals.theme.appBgColor')}
              </label>
               <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="appBgColor"
                  value={appBg}
                  onChange={(e) => setAppBg(e.target.value)}
                  className="w-10 h-10 p-0 border-none rounded-md cursor-pointer"
                />
                <input 
                  type="text"
                  value={appBg}
                  onChange={(e) => setAppBg(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
                  placeholder="#f8fafc"
                />
              </div>
            </div>
          </div>
        ) : (
          // Preset themes view
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
              {presetThemes.map((theme, index) => {
                const isSelected = headerBg === theme.headerBg && appBg === theme.appBg;
                const themeName = t(theme.nameKey);
                return (
                  <div key={index} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleSelectPreset(theme)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${isSelected ? 'ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-slate-800' : 'ring-1 ring-slate-300 dark:ring-slate-600'}`}
                      style={{ 
                          background: `linear-gradient(45deg, ${theme.appBg} 50%, ${theme.headerBg} 50%)`,
                      }}
                      title={themeName}
                      aria-label={`${t('modals.theme.title')} ${themeName}`}
                    >
                    </button>
                    <span className="text-xs text-center text-slate-600 dark:text-slate-400">{themeName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3">
            {showCustom ? (
                <button
                    onClick={() => setShowCustom(false)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    {t('modals.theme.backToPresets')}
                </button>
            ) : (
                <button
                    onClick={() => setShowCustom(true)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    {t('modals.theme.customColor')}
                </button>
            )}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
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
              {t('modals.theme.saveButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;