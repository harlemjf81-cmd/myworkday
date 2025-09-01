import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkShift, WorkSessionsMap, OvertimeSettings } from '../types.ts';
import { calculateHours, roundToNearest15Minutes, formatTimeHHMM } from '../utils/timeUtils.ts';
import { calculateDailyEarnings } from '../utils/earningsUtils.ts';
import { CalendarGrid } from './CalendarGrid.tsx';
import { AiShiftInputModal } from './AiShiftInputModal.tsx';
import { ChevronDownIcon } from './icons/ChevronDownIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { useNotifications } from '../contexts/NotificationContext.tsx'; 
import { XMarkIcon } from './icons/XMarkIcon.tsx';
import { MicrophoneIcon } from './icons/MicrophoneIcon.tsx';

interface DayEditorProps {
  selectedDate: Date;
  hourlyRate: number;
  overtimeSettings: OvertimeSettings;
  currencySymbol: string; 
  initialSessionData: WorkDay | null;
  onSaveDay: (date: Date, data: WorkDay) => void;
  onSaveAndNext: (date: Date, data: WorkDay) => void;
  isCalendarOpen: boolean;
  onToggleCalendar: () => void;
  onCalendarDateSelect: (date: Date) => void;
  calendarWorkSessions: WorkSessionsMap;
  getEarningsForDay: (workDay: WorkDay) => number;
}

const emptyShift: WorkShift = { start: '', end: '' };

export const DayEditor: React.FC<DayEditorProps> = ({ 
  selectedDate, 
  hourlyRate, 
  overtimeSettings,
  currencySymbol,
  initialSessionData, 
  onSaveDay,
  onSaveAndNext,
  isCalendarOpen,
  onToggleCalendar,
  onCalendarDateSelect,
  calendarWorkSessions,
  getEarningsForDay
}) => {
  const { t, i18n } = useTranslation();
  const [shift1, setShift1] = useState<WorkShift>(emptyShift);
  const [shift2, setShift2] = useState<WorkShift>(emptyShift);
  const [paymentPending, setPaymentPending] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const { addNotification } = useNotifications(); 

  useEffect(() => {
    if (initialSessionData) {
      setShift1(initialSessionData.shift1 || emptyShift);
      setShift2(initialSessionData.shift2 || emptyShift);
      setPaymentPending(initialSessionData.paymentPending || false);
    } else {
      setShift1(emptyShift);
      setShift2(emptyShift);
      setPaymentPending(false);
    }
    setIsDirty(false);
  }, [selectedDate, initialSessionData]);

  const handleShiftChange = <K extends keyof WorkShift,>(
    shiftSetter: React.Dispatch<React.SetStateAction<WorkShift>>, 
    field: K, 
    value: string
  ) => {
    shiftSetter(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTogglePaymentPending = () => {
    setPaymentPending(prev => !prev);
    setIsDirty(true);
  };

  const handleSetCurrentTime = (
    shiftSetter: React.Dispatch<React.SetStateAction<WorkShift>>,
    field: keyof WorkShift
  ) => {
    const now = new Date();
    const roundedTime = roundToNearest15Minutes(now);
    const formattedTime = formatTimeHHMM(roundedTime);
    shiftSetter(prev => ({ ...prev, [field]: formattedTime }));
    setIsDirty(true);
  };

  const handleClearShift = useCallback((shiftSetter: React.Dispatch<React.SetStateAction<WorkShift>>) => {
    shiftSetter(emptyShift);
    setIsDirty(true);
  }, []);

  const totalHoursShift1 = useMemo(() => calculateHours(shift1.start, shift1.end), [shift1]);
  const totalHoursShift2 = useMemo(() => calculateHours(shift2.start, shift2.end), [shift2]);
  const totalHoursDay = useMemo(() => totalHoursShift1 + totalHoursShift2, [totalHoursShift1, totalHoursShift2]);
  
  const { totalEarningsDay, earningsBreakdown } = useMemo(() => {
    if (!isDirty && initialSessionData) {
      return { totalEarningsDay: getEarningsForDay(initialSessionData), earningsBreakdown: null };
    }
    
    const { earnings, baseHours, overtimeHours } = calculateDailyEarnings(totalHoursDay, hourlyRate, overtimeSettings);
    
    const breakdownString = overtimeHours > 0
      ? `(${baseHours.toFixed(2)}h @ ${currencySymbol}${hourlyRate.toFixed(2)} + ${overtimeHours.toFixed(2)}h @ ${currencySymbol}${overtimeSettings.rate.toFixed(2)})`
      : null;

    return { totalEarningsDay: earnings, earningsBreakdown: breakdownString };
  }, [totalHoursDay, hourlyRate, overtimeSettings, currencySymbol, isDirty, initialSessionData, getEarningsForDay]);


  const collectDayData = (): WorkDay => ({
    shift1,
    shift2,
    paymentPending,
  });
  
  const handleSaveOnly = () => {
    if (isDirty) {
      const dayData = collectDayData();
      onSaveDay(selectedDate, dayData);
      setIsDirty(false);
    } else {
        addNotification(t('dayEditor.noChangesToSave'), 'info');
    }
  };

  const handleProceedToNextDay = () => {
    const dayData = collectDayData(); 
    onSaveAndNext(selectedDate, dayData); 
    setIsDirty(false);
  };
  
  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [selectedDate, i18n.language]);

  const handleAiComplete = (shifts: { shift1: WorkShift; shift2?: WorkShift }) => {
    setShift1(shifts.shift1);
    setShift2(shifts.shift2 || emptyShift);
    setIsDirty(true);
  };

  const renderShiftInputs = (
    shift: WorkShift, 
    setShift: React.Dispatch<React.SetStateAction<WorkShift>>, 
    shiftNumber: 1 | 2,
    totalHoursShift: number
  ) => (
    <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200">{t('dayEditor.shift', { number: shiftNumber })}</h3>
        <button
          onClick={() => handleClearShift(setShift)}
          disabled={!shift.start && !shift.end}
          className="p-1 text-slate-400 hover:text-red-500 disabled:text-slate-300 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          aria-label={t('dayEditor.deleteShift', { number: shiftNumber })}
          title={t('dayEditor.deleteShift', { number: shiftNumber })}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-2">
        <div>
          <label htmlFor={`shift${shiftNumber}-start`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">{t('dayEditor.startTime')}</label>
          <div className="flex items-center">
            <input
              type="time"
              id={`shift${shiftNumber}-start`}
              value={shift.start}
              onChange={(e) => handleShiftChange(setShift, 'start', e.target.value)}
              className="flex-grow p-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition" 
              style={{ colorScheme: 'light' }}
            />
            <button
              onClick={() => handleSetCurrentTime(setShift, 'start')}
              disabled={!!shift.start}
              className="ml-2 text-xs px-1 py-0.5 rounded text-sky-700 bg-sky-100 hover:bg-sky-200 dark:text-sky-300 dark:bg-sky-700 dark:hover:bg-sky-600 disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap" 
              title={t('dayEditor.setCurrentTime')}
            >
              {t('dayEditor.now')}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor={`shift${shiftNumber}-end`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">{t('dayEditor.endTime')}</label>
          <div className="flex items-center">
            <input
              type="time"
              id={`shift${shiftNumber}-end`}
              value={shift.end}
              onChange={(e) => handleShiftChange(setShift, 'end', e.target.value)}
              className="flex-grow p-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition" 
              style={{ colorScheme: 'light' }}
            />
            <button
              onClick={() => handleSetCurrentTime(setShift, 'end')}
              disabled={!shift.start || !!shift.end}
              className="ml-2 text-xs px-1 py-0.5 rounded text-sky-700 bg-sky-100 hover:bg-sky-200 dark:text-sky-300 dark:bg-sky-700 dark:hover:bg-sky-600 disabled:bg-slate-100 dark:disabled:bg-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap" 
              title={t('dayEditor.setCurrentTime')}
            >
              {t('dayEditor.now')}
            </button>
          </div>
        </div>
      </div>
       <p className="text-xs text-slate-500 dark:text-slate-400">{t('dayEditor.hoursForShift', { number: shiftNumber })} <span className="font-medium text-slate-700 dark:text-slate-200">{totalHoursShift.toFixed(2)}</span></p>
    </div>
  );

  return (
    <div className="flex flex-col space-y-3 h-full"> 
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-0 relative min-w-0"> 
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 shrink-0"> 
              {t('dayEditor.title')}
            </h2>
            <button
              onClick={onToggleCalendar}
              className="flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sky-600 dark:text-sky-400 font-medium text-lg sm:text-xl min-w-0 flex-1"
              aria-expanded={isCalendarOpen}
              aria-controls="day-editor-calendar-grid"
              title={t('dayEditor.selectDate')}
            >
              <span className="truncate">{formattedDate}</span>
              <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-sky-500 dark:text-sky-400 transform transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''} shrink-0`} />
            </button>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                className="ml-1 p-2 rounded-full hover:bg-sky-100 dark:hover:bg-sky-800 transition-colors"
                title={t('dayEditor.aiVoiceInput')}
             >
                <MicrophoneIcon className="w-5 h-5 text-sky-600 dark:text-sky-400"/>
             </button>
            {isCalendarOpen && (
              <div 
                id="day-editor-calendar-grid" 
                className="absolute top-full mt-1.5 left-0 max-w-xs sm:max-w-md md:max-w-lg bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl z-30 border border-slate-200 dark:border-slate-700"
              >
                <CalendarGrid
                  selectedDate={selectedDate}
                  onDateSelect={onCalendarDateSelect}
                  workSessions={calendarWorkSessions}
                  currencySymbol={currencySymbol}
                  getEarningsForDay={getEarningsForDay}
                  locale={i18n.language}
                />
              </div>
            )}
        </div>
        
        <div className="flex items-center mt-1 sm:mt-0 self-end sm:self-center">
            <label htmlFor="paymentPendingToggle" className="mr-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              {t('dayEditor.pendingPayment')}
            </label>
            <button
              type="button"
              id="paymentPendingToggle"
              role="switch"
              aria-checked={paymentPending}
              onClick={handleTogglePaymentPending}
              className={`${
                paymentPending ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
              } relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 dark:focus:ring-amber-500`}
            >
              <span
                className={`${
                  paymentPending ? 'translate-x-5' : 'translate-x-1' 
                } inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg shadow">
        <div className="flex flex-col gap-y-1">
            <div className="flex flex-row flex-wrap sm:flex-nowrap justify-between items-baseline gap-x-3">
              <div className="flex items-baseline whitespace-nowrap">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mr-1">{t('dayEditor.dayHours')}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{totalHoursDay.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline whitespace-nowrap">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mr-1">{t('dayEditor.dayEarnings')}</span>
                <span className="text-base font-bold text-green-600 dark:text-green-400">{currencySymbol}{totalEarningsDay.toFixed(2)}</span>
              </div>
            </div>
            {earningsBreakdown && (
              <div className="text-center text-xs text-sky-700 dark:text-sky-400 font-medium">
                {earningsBreakdown}
              </div>
            )}
        </div>
      </div>

      <div className="space-y-3 flex-grow overflow-y-auto">
        {renderShiftInputs(shift1, setShift1, 1, totalHoursShift1)}
        {renderShiftInputs(shift2, setShift2, 2, totalHoursShift2)}
      </div>

      <div className="mt-auto pt-2 border-t border-slate-200 dark:border-slate-700"> 
        <div className="grid grid-cols-5 gap-3 mt-1"> 
          <button
            onClick={handleSaveOnly}
            disabled={!isDirty} 
            className={`col-span-3 py-2.5 px-4 font-semibold rounded-lg transition-colors duration-150 text-white
              ${isDirty ? 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600 dark:focus:ring-sky-400' 
                        : 'bg-slate-400 dark:bg-slate-500 cursor-not-allowed'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {t('dayEditor.save')}
          </button>
          <button
            onClick={handleProceedToNextDay}
            className="col-span-2 py-2.5 px-4 flex justify-center items-center bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400 text-white font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label={t('dayEditor.saveAndNext')}
            title={t('dayEditor.saveAndNext')}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {isAiModalOpen && (
        <AiShiftInputModal 
            isOpen={isAiModalOpen} 
            onClose={() => setIsAiModalOpen(false)} 
            onComplete={handleAiComplete}
        />
      )}
    </div>
  );
};