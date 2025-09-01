import React, { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'firebase/auth';

import { Header } from './Header.tsx';
import { DayEditor } from './DayEditor.tsx';
import { NotificationsContainer } from './NotificationsContainer.tsx';
import { BottomNavigationBar, TabKey } from './BottomNavigationBar.tsx';
import { CurrentPeriodSummary } from './CurrentPeriodSummary.tsx';
import { LoadingFallback } from './LoadingFallback.tsx';

import { useWorkData } from '../hooks/useWorkData.ts';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { WorkDay, ThemeColors, OvertimeSettings } from '../types.ts';
import { DEFAULT_THEME_COLORS } from '../constants.ts';
import { formatDateISO, addDays } from '../utils/dateUtils.ts';
import { calculateHours } from '../utils/timeUtils.ts';
import { calculateDailyEarnings } from '../utils/earningsUtils.ts';

// Lazy load modals for better performance
const HourlyRateModal = lazy(() => import('./HourlyRateModal.tsx'));
const OvertimeSettingsModal = lazy(() => import('./OvertimeSettingsModal.tsx'));
const ThemeModal = lazy(() => import('./ThemeModal.tsx'));
const IdealEarningsModal = lazy(() => import('./IdealEarningsModal.tsx'));
const IdealMonthlyEarningsModal = lazy(() => import('./IdealMonthlyEarningsModal.tsx'));
const PaymentReminderSettingsModal = lazy(() => import('./PaymentReminderSettingsModal.tsx'));
const CurrencyModal = lazy(() => import('./CurrencyModal.tsx'));
const InfoModal = lazy(() => import('./InfoModal.tsx'));
const DataManagerModal = lazy(() => import('./DataManagerModal.tsx'));
const Welcome1980Modal = lazy(() => import('./Welcome1980Modal.tsx'));
const GenerateReportModal = lazy(() => import('./GenerateReportModal.tsx'));
const WorkerNameModal = lazy(() => import('./WorkerNameModal.tsx'));

// Lazy load heavy tab components
const PendingPaymentsList = lazy(() => import('./PendingPaymentsList.tsx'));
const EarningsChart = lazy(() => import('./EarningsChart.tsx'));
const WeeklyAverageStats = lazy(() => import('./WeeklyAverageStats.tsx'));
const OvertimeStats = lazy(() => import('./OvertimeStats.tsx'));
const WeeklySummaryChart = lazy(() => import('./WeeklySummaryChart.tsx'));
const MonthlySummaryChart = lazy(() => import('./MonthlySummaryChart.tsx'));
const AnnualReport = lazy(() => import('./AnnualReport.tsx'));


const ASCII_HEADER_BG = '#000000';
const ASCII_APP_BG = '#00ff00';

const WorkerView: React.FC<{ user: User }> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // UI State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Pass the selectedDate to the hook to enable progressive data loading.
  const {
      profile,
      workSessions,
      loading: dataLoading,
      updateProfile,
      saveWorkSession,
      markSessionAsPaid,
      getDataForExport,
      loadDataFromExport,
  } = useWorkData(user, selectedDate);
  
  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);
  const [isOvertimeSettingsModalOpen, setIsOvertimeSettingsModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isIdealEarningsModalOpen, setIsIdealEarningsModalOpen] = useState<boolean>(false);
  const [isIdealMonthlyEarningsModalOpen, setIsIdealMonthlyEarningsModalOpen] = useState<boolean>(false);
  const [isPaymentReminderSettingsModalOpen, setIsPaymentReminderSettingsModalOpen] = useState<boolean>(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false); 
  const [activeTab, setActiveTab] = useState<TabKey>('jornada');
  const [isDataManagerModalOpen, setIsDataManagerModalOpen] = useState(false);
  const [isWelcome1980ModalOpen, setWelcome1980ModalOpen] = useState(false);
  const [chartsDisplayMonth, setChartsDisplayMonth] = useState<Date>(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [isGenerateReportModalOpen, setGenerateReportModalOpen] = useState(false);
  const [isWorkerNameModalOpen, setWorkerNameModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();
  
  const isAsciiMode = useMemo(() => {
    const theme = profile?.themeColors ?? DEFAULT_THEME_COLORS;
    return theme.headerBg?.toLowerCase() === ASCII_HEADER_BG && theme.appBg?.toLowerCase() === ASCII_APP_BG;
  }, [profile?.themeColors]);

  const [isCrtEffectEnabled, setIsCrtEffectEnabled] = useState(true);

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.title = t('appName');
  }, [currentLanguage, t]);

  useEffect(() => {
    setChartsDisplayMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);
  
  useEffect(() => {
    document.documentElement.classList.toggle('crt-effect', isAsciiMode && isCrtEffectEnabled);
    document.documentElement.classList.toggle('ascii-mode', isAsciiMode);
  }, [isAsciiMode, isCrtEffectEnabled]);

  useEffect(() => {
    if (profile?.themeColors?.appBg) {
        document.body.style.backgroundColor = profile.themeColors.appBg;
    }
    const isDark = (profile?.themeColors?.headerBg ?? DEFAULT_THEME_COLORS.headerBg) === '#334155';
    document.documentElement.classList.toggle('dark', isDark);
  }, [profile?.themeColors]);
  
  const getEarningsForDay = useCallback((workDay: WorkDay): number => {
    if (typeof workDay.recordedEarnings === 'number') return workDay.recordedEarnings;
    const totalHours = calculateHours(workDay.shift1.start, workDay.shift1.end) + calculateHours(workDay.shift2.start, workDay.shift2.end);
    if (totalHours === 0) return 0;
    const baseRate = workDay.recordedHourlyRate ?? profile?.hourlyRate ?? 0;
    const otSettings = workDay.recordedOvertimeSettings ?? profile?.overtimeSettings;
    if (!otSettings) return totalHours * baseRate;
    const { earnings } = calculateDailyEarnings(totalHours, baseRate, otSettings);
    return earnings;
  }, [profile?.hourlyRate, profile?.overtimeSettings]);

  const handleDateSelect = useCallback((date: Date) => { setSelectedDate(date); setIsCalendarOpen(false); }, []);

  const internalSaveDay = useCallback(async (date: Date, data: WorkDay) => {
    if (!profile) return 0;
    const dateKey = formatDateISO(date);
    const totalHours = calculateHours(data.shift1.start, data.shift1.end) + calculateHours(data.shift2.start, data.shift2.end);
    const { earnings: currentEarnings } = calculateDailyEarnings(totalHours, profile.hourlyRate, profile.overtimeSettings);
    
    await saveWorkSession(dateKey, { ...data, recordedEarnings: currentEarnings, recordedHourlyRate: profile.hourlyRate, recordedOvertimeSettings: profile.overtimeSettings });
    return currentEarnings;
  }, [saveWorkSession, profile]);

  const handleSaveDay = useCallback(async (date: Date, data: WorkDay) => {
    const currentEarnings = await internalSaveDay(date, data);
    if ((profile?.idealDailyEarnings ?? 0) > 0 && currentEarnings > 0 && currentEarnings < (profile?.idealDailyEarnings ?? 0)) { 
      addNotification(t('notifications.goalNotMet', { currencySymbol: profile?.currencySymbol, amount: ((profile?.idealDailyEarnings ?? 0) - currentEarnings).toFixed(2) }), 'warning'); 
    } else { 
      addNotification(t('notifications.daySaved'), 'success'); 
    }
  }, [internalSaveDay, addNotification, profile, t]);
  
  const handleSaveAndNextDay = useCallback(async (date: Date, data: WorkDay) => {
    const currentEarnings = await internalSaveDay(date, data);
    if ((profile?.idealDailyEarnings ?? 0) > 0 && currentEarnings > 0 && currentEarnings < (profile?.idealDailyEarnings ?? 0)) { 
      addNotification(t('notifications.goalNotMet', { currencySymbol: profile?.currencySymbol, amount: ((profile?.idealDailyEarnings ?? 0) - currentEarnings).toFixed(2) }), 'warning'); 
    } else { 
      addNotification(t('notifications.daySavedAndNext'), 'success'); 
    }
    setSelectedDate(prevDate => addDays(prevDate, 1));
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }, [internalSaveDay, addNotification, profile, t]);

  const handleMarkAsPaid = useCallback(async (dateKeyToUpdate: string) => {
    await markSessionAsPaid(dateKeyToUpdate);
    addNotification(t('notifications.paymentMarkedAsReceived', { date: dateKeyToUpdate }), 'success');
  }, [markSessionAsPaid, addNotification, t]);

  const handleExportData = useCallback(() => {
    try {
      const dataToExport = getDataForExport();
      if (!dataToExport || Object.keys(dataToExport.workSessions).length === 0) { 
        addNotification(t('notifications.noDataToExport'), 'warning'); 
        return; 
      }
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateSuffix = new Date().toISOString().split('T')[0];
      link.download = `myworkday_backup_${dateSuffix}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addNotification(t('notifications.dataExportedSuccess'), 'success');
    } catch (error) { 
      addNotification(t('notifications.errorExportingData', { error: error instanceof Error ? error.message : 'Unknown error' }), 'error'); 
    }
  }, [addNotification, getDataForExport, t]);
  
   const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { addNotification(t('notifications.noFileSelected'), 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error(t('notifications.errorReadingFile'));
        const importedData = JSON.parse(text);
        await loadDataFromExport(importedData);
        addNotification(t('notifications.dataImportedSuccess'), 'success');
      } catch (error) { 
        addNotification(t('notifications.errorImportingData', { error: error instanceof Error ? error.message : 'Unknown error' }), 'error'); 
      } finally { 
        if (event.target) event.target.value = ''; 
      }
    };
    reader.readAsText(file);
  }, [loadDataFromExport, addNotification, t]);

  const handleImportDataClick = () => fileInputRef.current?.click();

  const handleHourlyRateSave = useCallback((newRate: number) => { updateProfile({ hourlyRate: newRate }); setIsRateModalOpen(false); addNotification(t('notifications.hourlyRateUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handleOvertimeSettingsSave = useCallback((newSettings: OvertimeSettings) => { updateProfile({ overtimeSettings: newSettings }); setIsOvertimeSettingsModalOpen(false); addNotification(t('notifications.overtimeSettingsUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handleThemeSave = useCallback((newColors: ThemeColors) => {
    const wasAscii = (profile?.themeColors ?? DEFAULT_THEME_COLORS).headerBg?.toLowerCase() === ASCII_HEADER_BG;
    const isNowAscii = newColors.headerBg?.toLowerCase() === ASCII_HEADER_BG;
    if (isNowAscii && !wasAscii) setWelcome1980ModalOpen(true);
    updateProfile({ themeColors: newColors });
    setIsThemeModalOpen(false);
    addNotification(t('notifications.themeUpdated'), 'success');
  }, [profile, updateProfile, addNotification, t]);
  const handleIdealEarningsSave = useCallback((newIdealEarnings: number) => { updateProfile({ idealDailyEarnings: newIdealEarnings }); setIsIdealEarningsModalOpen(false); addNotification(t('notifications.dailyGoalUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handleIdealMonthlyEarningsSave = useCallback((newIdealMonthlyEarnings: number) => { updateProfile({ idealMonthlyEarnings: newIdealMonthlyEarnings }); setIsIdealMonthlyEarningsModalOpen(false); addNotification(t('notifications.monthlyGoalUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handlePaymentReminderDaysSave = useCallback((newReminderDays: number) => { updateProfile({ paymentReminderDays: newReminderDays }); setIsPaymentReminderSettingsModalOpen(false); addNotification(t('notifications.paymentReminderUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handleCurrencySymbolSave = useCallback((newSymbol: string) => { updateProfile({ currencySymbol: newSymbol }); setIsCurrencyModalOpen(false); addNotification(t('notifications.currencySymbolUpdated'), 'success'); }, [updateProfile, addNotification, t]);
  const handleWorkerNameSave = useCallback((newName: string) => { updateProfile({ workerName: newName, displayName: newName }); setWorkerNameModalOpen(false); addNotification(t('notifications.nameUpdated'), 'success'); }, [updateProfile, addNotification, t]);

  const currentDayData = useMemo(() => {
    if (!workSessions || typeof workSessions !== 'object') return null;
    const dayData = workSessions[formatDateISO(selectedDate)]; 
    return dayData ? { ...dayData, paymentPending: dayData.paymentPending || false } : null;
  }, [selectedDate, workSessions]);

  const handleTabChange = (tab: TabKey) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  if (dataLoading || !profile) {
    return <LoadingFallback />;
  }

  const tabContentFallback = <div className="lg:col-span-3"><LoadingFallback /></div>;

  const renderMainContent = () => {
    switch (activeTab) {
      case 'jornada': return (
          <>
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                <DayEditor {...{selectedDate, hourlyRate: profile.hourlyRate, overtimeSettings: profile.overtimeSettings, currencySymbol: profile.currencySymbol, initialSessionData: currentDayData, onSaveDay: handleSaveDay, onSaveAndNext: handleSaveAndNextDay, isCalendarOpen, onToggleCalendar: () => setIsCalendarOpen(p => !p), onCalendarDateSelect: handleDateSelect, calendarWorkSessions: workSessions, getEarningsForDay}} />
            </div>
            <CurrentPeriodSummary 
                {...{selectedDate, workSessions, currencySymbol: profile.currencySymbol, idealDailyEarnings: profile.idealDailyEarnings ?? 0, idealMonthlyEarnings: profile.idealMonthlyEarnings ?? 0, getEarningsForDay}} 
            />
          </>
      );
      case 'pagos': return (
          <Suspense fallback={tabContentFallback}>
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
              <PendingPaymentsList workSessions={workSessions} currencySymbol={profile.currencySymbol} onMarkAsPaid={handleMarkAsPaid} getEarningsForDay={getEarningsForDay} locale={currentLanguage} />
            </div>
          </Suspense>
      );
      case 'graficos': return (
          <Suspense fallback={tabContentFallback}>
            <>
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                  <EarningsChart 
                      workSessions={workSessions} idealDailyEarnings={profile.idealDailyEarnings ?? 0} currencySymbol={profile.currencySymbol} getEarningsForDay={getEarningsForDay} 
                      currentMonthDate={chartsDisplayMonth}
                      onMonthChange={setChartsDisplayMonth}
                      locale={currentLanguage}
                  />
              </div>
              <WeeklyAverageStats workSessions={workSessions} currentMonthDate={chartsDisplayMonth} locale={currentLanguage} />
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                  <OvertimeStats 
                      workSessions={workSessions} overtimeSettings={profile.overtimeSettings} 
                      currentMonthDate={chartsDisplayMonth}
                      onMonthChange={setChartsDisplayMonth}
                      locale={currentLanguage}
                  />
              </div>
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                  <WeeklySummaryChart 
                      workSessions={workSessions} currencySymbol={profile.currencySymbol} getEarningsForDay={getEarningsForDay} 
                      currentMonthDate={chartsDisplayMonth}
                      onMonthChange={setChartsDisplayMonth}
                      locale={currentLanguage}
                  />
              </div>
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg"><MonthlySummaryChart workSessions={workSessions} idealMonthlyEarnings={profile.idealMonthlyEarnings ?? 0} idealDailyEarnings={profile.idealDailyEarnings ?? 0} currencySymbol={profile.currencySymbol} getEarningsForDay={getEarningsForDay} locale={currentLanguage} /></div>
              <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg"><AnnualReport workSessions={workSessions} idealMonthlyEarnings={profile.idealMonthlyEarnings ?? 0} currencySymbol={profile.currencySymbol} getEarningsForDay={getEarningsForDay} locale={currentLanguage} /></div>
            </>
          </Suspense>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-200 transition-colors duration-300 pb-20" style={{ backgroundColor: profile.themeColors.appBg }}>
      <NotificationsContainer />
      <Header
        user={user}
        headerBgColor={profile.themeColors.headerBg}
        isAsciiMode={isAsciiMode}
        isCrtEffectEnabled={isCrtEffectEnabled}
        onToggleCrtEffect={() => setIsCrtEffectEnabled(prev => !prev)}
        onOpenDataManagerModal={() => setIsDataManagerModalOpen(true)}
        onGenerateReport={() => setGenerateReportModalOpen(true)}
        onEditWorkerName={() => setWorkerNameModalOpen(true)}
        onEditRate={() => setIsRateModalOpen(true)}
        onOpenOvertimeSettingsModal={() => setIsOvertimeSettingsModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenIdealEarningsModal={() => setIsIdealEarningsModalOpen(true)}
        onOpenIdealMonthlyEarningsModal={() => setIsIdealMonthlyEarningsModalOpen(true)}
        onOpenPaymentReminderSettingsModal={() => setIsPaymentReminderSettingsModalOpen(true)}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
      />
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} aria-hidden="true" />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">{renderMainContent()}</main>
      <BottomNavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <Suspense fallback={null}>
        {isRateModalOpen && <HourlyRateModal currentRate={profile.hourlyRate} currencySymbol={profile.currencySymbol} onSave={handleHourlyRateSave} onClose={() => setIsRateModalOpen(false)} />}
        {isOvertimeSettingsModalOpen && <OvertimeSettingsModal currentSettings={profile.overtimeSettings} baseHourlyRate={profile.hourlyRate} currencySymbol={profile.currencySymbol} onSave={handleOvertimeSettingsSave} onClose={() => setIsOvertimeSettingsModalOpen(false)} />}
        {isThemeModalOpen && <ThemeModal currentThemeColors={profile.themeColors} onSave={handleThemeSave} onClose={() => setIsThemeModalOpen(false)} />}
        {isIdealEarningsModalOpen && <IdealEarningsModal currentIdealEarnings={profile.idealDailyEarnings ?? 0} currencySymbol={profile.currencySymbol} onSave={handleIdealEarningsSave} onClose={() => setIsIdealEarningsModalOpen(false)} />}
        {isIdealMonthlyEarningsModalOpen && <IdealMonthlyEarningsModal currentIdealMonthlyEarnings={profile.idealMonthlyEarnings ?? 0} currencySymbol={profile.currencySymbol} onSave={handleIdealMonthlyEarningsSave} onClose={() => setIsIdealMonthlyEarningsModalOpen(false)} />}
        {isPaymentReminderSettingsModalOpen && <PaymentReminderSettingsModal currentReminderDays={profile.paymentReminderDays} onSave={handlePaymentReminderDaysSave} onClose={() => setIsPaymentReminderSettingsModalOpen(false)} />}
        {isCurrencyModalOpen && <CurrencyModal currentSymbol={profile.currencySymbol} onSave={handleCurrencySymbolSave} onClose={() => setIsCurrencyModalOpen(false)} />}
        {isInfoModalOpen && <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />}
        {isDataManagerModalOpen && (
          <DataManagerModal
            isOpen={isDataManagerModalOpen}
            onClose={() => setIsDataManagerModalOpen(false)}
            onExportLocal={handleExportData}
            onImportLocal={handleImportDataClick}
          />
        )}
        {isWelcome1980ModalOpen && <Welcome1980Modal isOpen={isWelcome1980ModalOpen} onClose={() => setWelcome1980ModalOpen(false)} />}
        {isGenerateReportModalOpen && <GenerateReportModal isOpen={isGenerateReportModalOpen} onClose={() => setGenerateReportModalOpen(false)} workSessions={workSessions} workerName={profile.workerName} currencySymbol={profile.currencySymbol} hourlyRate={profile.hourlyRate} overtimeSettings={profile.overtimeSettings} />}
        {isWorkerNameModalOpen && <WorkerNameModal currentName={profile.workerName} onSave={handleWorkerNameSave} onClose={() => setWorkerNameModalOpen(false)} />}
      </Suspense>

      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400">{t('footer')} &copy; {new Date().getFullYear()}</footer>
    </div>
  );
};

export default WorkerView;