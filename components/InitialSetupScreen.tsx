import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { InitialSetupSettings, UserProfile } from '../types.ts';
import { CogIcon } from './icons/CogIcon.tsx';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon.tsx';
import { TargetIcon } from './icons/TargetIcon.tsx';
import { SunIcon } from './icons/SunIcon.tsx';
import { MoonIcon } from './icons/MoonIcon.tsx';
import { UserIcon } from './icons/UserIcon.tsx';
import { FIRESTORE_COLLECTIONS, DEFAULT_THEME_COLORS } from '../constants.ts';
import { useNotifications } from '../contexts/NotificationContext.tsx';


interface InitialSetupScreenProps {
  user: User;
  onComplete: (settings: UserProfile) => void;
}

const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({ user, onComplete }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(user.displayName || '');
  const [rate, setRate] = useState('15');
  const [symbol, setSymbol] = useState('$');
  const [dailyGoal, setDailyGoal] = useState('100');
  const [monthlyGoal, setMonthlyGoal] = useState('2000');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, setError] = useState('');
  const { addNotification } = useNotifications();

  const handleSubmit = async () => {
    if (!db) {
        addNotification("Firebase is not configured. Cannot save profile.", "error");
        return;
    }
    const hourlyRate = parseFloat(rate);
    const idealDailyEarnings = parseFloat(dailyGoal);
    const idealMonthlyEarnings = parseFloat(monthlyGoal);

    if (!name.trim()) { setError(t('initialSetup.nameError')); return; }
    if (isNaN(hourlyRate) || hourlyRate < 0) { setError(t('initialSetup.rateError')); return; }
    if (!symbol.trim()) { setError(t('initialSetup.currencyError')); return; }
    if (isNaN(idealDailyEarnings) || idealDailyEarnings < 0) { setError(t('initialSetup.dailyGoalError')); return; }
    if (isNaN(idealMonthlyEarnings) || idealMonthlyEarnings < 0) { setError(t('initialSetup.monthlyGoalError')); return; }
    
    setError('');

    const settings: InitialSetupSettings = {
      workerName: name.trim(),
      hourlyRate,
      currencySymbol: symbol.trim(),
      idealDailyEarnings,
      idealMonthlyEarnings,
      role: 'worker',
      theme,
    };
    
    const userProfile: UserProfile = {
      ...settings,
      uid: user.uid,
      email: user.email,
      displayName: name.trim(),
      themeColors: theme === 'dark' ? { headerBg: '#334155', appBg: '#0f172a' } : DEFAULT_THEME_COLORS,
      paymentReminderDays: 7,
      overtimeSettings: { enabled: false, threshold: 8, rate: hourlyRate * 1.5 }
    };

    try {
        const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        await setDoc(userDocRef, userProfile);
        onComplete(userProfile);
    } catch (e) {
        console.error("Error creating user profile: ", e);
        addNotification("Error creating profile.", "error");
    }
  };
  
  const renderInputRow = (Icon: React.FC<any>, labelKey: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type: string = 'number', placeholderKey: string) => (
    <div className="flex items-center gap-4">
      <div className="bg-sky-100 dark:bg-sky-900/50 p-2 rounded-full">
        <Icon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
      </div>
      <div className="flex-1">
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          {t(labelKey)}
        </label>
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition text-base"
          placeholder={t(placeholderKey)}
          min={type === 'number' ? '0' : undefined}
        />
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 z-[200] text-slate-800 dark:text-slate-200">
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl transform transition-all">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{t('initialSetup.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('initialSetup.description')}</p>
        </div>
        
        <div className="space-y-5">
            {renderInputRow(UserIcon, "initialSetup.nameLabel", "name", name, e => setName(e.target.value), 'text', "initialSetup.namePlaceholder")}
            {renderInputRow(CogIcon, "initialSetup.rateLabel", "rate", rate, e => setRate(e.target.value), 'number', "modals.hourlyRate.placeholder")}
            {renderInputRow(CurrencyDollarIcon, "initialSetup.currencyLabel", "symbol", symbol, e => setSymbol(e.target.value), 'text', "modals.currency.placeholder")}
            {renderInputRow(TargetIcon, "initialSetup.dailyGoalLabel", "daily-goal", dailyGoal, e => setDailyGoal(e.target.value), 'number', "modals.idealDailyEarnings.placeholder")}
            {renderInputRow(TargetIcon, "initialSetup.monthlyGoalLabel", "monthly-goal", monthlyGoal, e => setMonthlyGoal(e.target.value), 'number', "modals.idealMonthlyEarnings.placeholder")}
            
            {/* Theme Selector */}
            <div className="flex items-center gap-4">
              <div className="bg-sky-100 dark:bg-sky-900/50 p-2 rounded-full"><SunIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" /></div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('initialSetup.themeLabel')}</label>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${theme === 'light' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400'}`}><SunIcon className="w-5 h-5" /><span className="font-medium">{t('initialSetup.lightTheme')}</span></button>
                    <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${theme === 'dark' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400'}`}><MoonIcon className="w-5 h-5" /><span className="font-medium">{t('initialSetup.darkTheme')}</span></button>
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        <div className="mt-8">
            <button onClick={handleSubmit} className="w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 text-lg">{t('initialSetup.startButton')}</button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">{t('initialSetup.footerNote')}</p>
        </div>
      </div>
    </div>
  );
};

export default InitialSetupScreen;