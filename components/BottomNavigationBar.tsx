import React from 'react';
import { useTranslation } from 'react-i18next';
import { HomeIcon } from './icons/HomeIcon.tsx';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon.tsx';
import { ChartBarIcon } from './icons/ChartBarIcon.tsx';

export type TabKey = 'jornada' | 'pagos' | 'graficos';

const tabsConfig: { key: TabKey; labelKey: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'jornada', labelKey: 'tabs.workday', icon: HomeIcon },
  { key: 'pagos', labelKey: 'tabs.payments', icon: CurrencyDollarIcon },
  { key: 'graficos', labelKey: 'tabs.charts', icon: ChartBarIcon },
];

interface BottomNavigationBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-top z-40">
      <div className="container mx-auto grid grid-cols-3">
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;
          const label = t(tab.labelKey);
          const activeColor = 'text-sky-600 dark:text-sky-500';
          const inactiveColor = 'text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400';

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 focus:outline-none transition-colors duration-150 ${
                isActive ? activeColor : inactiveColor
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 ${isActive ? 'fill-current' : ''}`} />
              <span className={`text-xs sm:text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};