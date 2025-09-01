import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'firebase/auth';
import { auth } from '../firebase.ts';
import { CogIcon } from './icons/CogIcon.tsx';
import { PaintBrushIcon } from './icons/PaintBrushIcon.tsx';
import { TargetIcon } from './icons/TargetIcon.tsx';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon.tsx';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon.tsx';
import { BellIcon } from './icons/BellIcon.tsx'; 
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon.tsx';
import { InformationCircleIcon } from './icons/InformationCircleIcon.tsx';
import { ClockIcon } from './icons/ClockIcon.tsx';
import { ServerStackIcon } from './icons/ServerStackIcon.tsx';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { TvIcon } from './icons/TvIcon.tsx';
import { ArrowLeftStartOnRectangleIcon } from './icons/ArrowLeftStartOnRectangleIcon.tsx';
import { ShareIcon } from './icons/ShareIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';

interface HeaderProps {
  onOpenDataManagerModal: () => void;
  headerBgColor: string;
  user: User | null;
  isAsciiMode: boolean;
  isCrtEffectEnabled: boolean;
  onToggleCrtEffect: () => void;
  onEditRate?: () => void;
  onOpenOvertimeSettingsModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenIdealEarningsModal?: () => void;
  onOpenIdealMonthlyEarningsModal?: () => void;
  onOpenPaymentReminderSettingsModal?: () => void;
  onOpenCurrencyModal?: () => void;
  onOpenInfoModal?: () => void;
  onGenerateReport?: () => void;
  onEditWorkerName?: () => void;
}

interface ActionMenuItem {
  type?: 'action'; 
  labelKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  action: () => void;
  disabled?: boolean;
}

interface DividerMenuItem {
  type: 'divider';
}

interface GroupHeaderMenuItem {
  type: 'groupHeader';
  labelKey: string;
}

type MenuItem = ActionMenuItem | DividerMenuItem | GroupHeaderMenuItem;

export const Header: React.FC<HeaderProps> = ({ 
  onOpenDataManagerModal,
  headerBgColor,
  user,
  isAsciiMode,
  isCrtEffectEnabled,
  onToggleCrtEffect,
  onEditRate,
  onOpenOvertimeSettingsModal,
  onOpenThemeModal,
  onOpenIdealEarningsModal,
  onOpenIdealMonthlyEarningsModal,
  onOpenPaymentReminderSettingsModal,
  onOpenCurrencyModal,
  onOpenInfoModal,
  onGenerateReport,
  onEditWorkerName,
}) => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleSignOut = () => {
    if (auth) {
        auth.signOut();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    if (isSettingsMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsMenuOpen]);

  const handleMenuToggle = () => setIsSettingsMenuOpen(prev => !prev);
  const handleMenuItemClick = (action: () => void) => { action(); setIsSettingsMenuOpen(false); };

  const menuItems: MenuItem[] = [
      { type: 'groupHeader', labelKey: "header.dataManagement" },
      { labelKey: "header.localBackup", icon: ServerStackIcon, action: onOpenDataManagerModal },
      { labelKey: "header.generateReport", icon: ShareIcon, action: onGenerateReport! },
      { type: 'divider' },
      { type: 'groupHeader', labelKey: "header.goalsAndReminders" },
      { labelKey: "header.dailyGoal", icon: TargetIcon, action: onOpenIdealEarningsModal! },
      { labelKey: "header.monthlyGoal", icon: CalendarDaysIcon, action: onOpenIdealMonthlyEarningsModal! },
      { labelKey: "header.paymentReminder", icon: BellIcon, action: onOpenPaymentReminderSettingsModal! },
      { type: 'divider' },
      { type: 'groupHeader', labelKey: "header.customizationAndRate" },
      { labelKey: "header.editName", icon: UserIcon, action: onEditWorkerName! },
      { labelKey: "header.changeCurrency", icon: CurrencyDollarIcon, action: onOpenCurrencyModal! },
      { labelKey: "header.customizeTheme", icon: PaintBrushIcon, action: onOpenThemeModal! },
      { labelKey: "header.editRate", icon: CogIcon, action: onEditRate! },
      { labelKey: "header.configureOvertime", icon: ClockIcon, action: onOpenOvertimeSettingsModal! },
      { type: 'divider' },
      { labelKey: "header.quickGuide", icon: InformationCircleIcon, action: onOpenInfoModal! },
      { type: 'divider' },
      { labelKey: "header.signOut", icon: ArrowLeftStartOnRectangleIcon, action: handleSignOut },
  ];

  return (
    <header 
      className="text-white dark:text-slate-100 p-3 sm:p-4 shadow-md sticky top-0 z-50 transition-colors duration-300 relative"
      style={{ backgroundColor: headerBgColor }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap">
          {t('appName')}
          {isAsciiMode && <span className="blinking-cursor">_</span>}
        </h1>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isAsciiMode && (
              <button
                onClick={onToggleCrtEffect}
                title={t('header.toggleCrtEffect')}
                className={`p-2 rounded-full transition-colors duration-150 ${isCrtEffectEnabled ? 'bg-green-500/50' : ''}`}
              >
                  <TvIcon className="w-6 h-6" />
              </button>
          )}
          <LanguageSwitcher />
          <div className="relative">
             {user ? (
              <button
                ref={buttonRef}
                onClick={handleMenuToggle}
                className="flex items-center rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-700 dark:focus:ring-offset-sky-800 focus:ring-sky-300 dark:focus:ring-sky-600"
                aria-label={t('header.openSettings')}
                aria-haspopup="true"
                aria-expanded={isSettingsMenuOpen}
                title={t('header.settingsFor', { name: user.displayName || 'User' })}
              >
                {user.photoURL ? (
                    <img
                    src={user.photoURL}
                    alt="User profile"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-700 dark:bg-sky-800 flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                            {(user.displayName?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                        </span>
                    </div>
                )}
              </button>
            ) : (
              <button
                ref={buttonRef}
                onClick={handleMenuToggle}
                className="flex items-center gap-1 sm:gap-2 bg-white/20 dark:bg-slate-700/60 hover:bg-white/30 dark:hover:bg-slate-600/60 text-white dark:text-slate-100 font-semibold px-2 py-2 sm:px-3 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-600"
                aria-label={t('header.openSettings')}
                aria-haspopup="true"
                aria-expanded={isSettingsMenuOpen}
              >
                <EllipsisVerticalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden md:inline text-xs sm:text-sm">{t('header.settings')}</span>
              </button>
            )}

            {isSettingsMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-72 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none z-40 py-1" 
                role="menu"
                aria-orientation="vertical"
              >
                {menuItems.map((item, index) => {
                   if (item.type === 'divider') return <hr key={`divider-${index}`} className="my-1 border-slate-200 dark:border-slate-700" />;
                  if (item.type === 'groupHeader') {
                    return (
                      <div key={`groupHeader-${index}`} className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                        {t(item.labelKey)}
                      </div>
                    );
                  }

                  const isDisabled = 'disabled' in item && !!item.disabled;
                  
                  return (
                    <button
                      key={item.labelKey}
                      onClick={() => handleMenuItemClick(item.action)}
                      disabled={isDisabled}
                      className={`w-full flex items-center px-4 py-2.5 text-sm text-left
                        ${ isDisabled 
                            ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                        } transition-colors duration-150`}
                      role="menuitem"
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${ isDisabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400' }`} />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};