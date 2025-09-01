import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkSessionsMap, ChartRenderSize } from '../types.ts';
import { formatDateISO, getWeeksInMonth } from '../utils/dateUtils.ts';
import { ChartSizeSelector } from './ChartSizeSelector.tsx';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { CalendarWeekIcon } from './icons/CalendarWeekIcon.tsx';
import { ChartTooltip } from './ChartTooltip.tsx';

interface WeeklySummaryChartProps {
  workSessions: WorkSessionsMap;
  currentMonthDate: Date;
  currencySymbol: string;
  getEarningsForDay: (workDay: WorkDay) => number;
  onMonthChange: (newMonth: Date) => void;
  locale: string;
}

interface WeeklyChartDataPoint {
  weekLabel: string;
  startDate: Date;
  endDate: Date;
  earnings: number;
}

interface SizeConfig {
  barSlotWidth: number;
  barPaddingFraction: number;
  axisLabelFontSize: string;
  weekLabelFontSize: string;
  chartHeight: number;
  chartBottomMargin: number;
  chartLeftMargin: number;
}

const sizeConfigs: Record<ChartRenderSize, SizeConfig> = {
  small: { barSlotWidth: 40, barPaddingFraction: 0.4, axisLabelFontSize: '9px', weekLabelFontSize: '9px', chartHeight: 200, chartBottomMargin: 40, chartLeftMargin: 40 },
  medium: { barSlotWidth: 60, barPaddingFraction: 0.3, axisLabelFontSize: '10px', weekLabelFontSize: '10px', chartHeight: 250, chartBottomMargin: 45, chartLeftMargin: 45 },
  large: { barSlotWidth: 80, barPaddingFraction: 0.2, axisLabelFontSize: '11px', weekLabelFontSize: '11px', chartHeight: 300, chartBottomMargin: 50, chartLeftMargin: 50 },
};

export const WeeklySummaryChart: React.FC<WeeklySummaryChartProps> = ({ workSessions, currentMonthDate, currencySymbol, getEarningsForDay, onMonthChange, locale }) => {
  const { t } = useTranslation();
  const [chartSize, setChartSize] = useState<ChartRenderSize>('medium');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [tooltipConfig, setTooltipConfig] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  const displayDate = currentMonthDate;
  const currentSizeConfig = useMemo(() => sizeConfigs[chartSize], [chartSize]);

  const chartData = useMemo(() => {
    const weeksInMonth = getWeeksInMonth(displayDate);
    return weeksInMonth.map(week => {
      let weeklyEarnings = 0;
      week.days.forEach(day => {
        const dateKey = formatDateISO(day);
        const workDay = workSessions[dateKey];
        if (workDay) {
          weeklyEarnings += getEarningsForDay(workDay);
        }
      });
      const startDate = week.days[0];
      const endDate = week.days[week.days.length - 1];
      return {
        weekLabel: `${t('charts.weeklySummary.week')} ${week.weekNumber}`,
        startDate,
        endDate,
        earnings: weeklyEarnings,
      };
    });
  }, [workSessions, displayDate, getEarningsForDay, t]);

  const totalMonthEarnings = useMemo(() => chartData.reduce((sum, week) => sum + week.earnings, 0), [chartData]);

  const chartVisuals = useMemo(() => {
    const { barSlotWidth, barPaddingFraction, chartHeight, chartBottomMargin, chartLeftMargin } = currentSizeConfig;
    const effectiveMaxEarnings = Math.max(...chartData.map(d => d.earnings), 50);
    const barActualWidth = barSlotWidth * (1 - barPaddingFraction);
    const chartRightMargin = 10;
    const totalChartContentWidth = chartData.length * barSlotWidth;
    const svgWidth = chartLeftMargin + totalChartContentWidth + chartRightMargin;
    const yAxisTicks = 5;
    const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => (effectiveMaxEarnings / yAxisTicks) * i);
    return {
      effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues,
      chartHeight, chartBottomMargin, chartLeftMargin, chartRightMargin, totalChartContentWidth, barSlotWidth
    };
  }, [chartData, currentSizeConfig]);

  const handleInteraction = (index: number | null, event?: React.MouseEvent | React.TouchEvent) => {
    if (index === null || index === activeBarIndex) {
      setActiveBarIndex(null);
      setTooltipConfig(null);
      return;
    }

    if (!event || !svgContainerRef.current) return;

    setActiveBarIndex(index);
    const dataPoint = chartData[index];
    if (dataPoint) {
      const rect = svgContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in event.nativeEvent ? event.nativeEvent.touches[0].clientX : event.nativeEvent.clientX;
      const clientY = 'touches' in event.nativeEvent ? event.nativeEvent.touches[0].clientY : event.nativeEvent.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      setTooltipConfig({
        x,
        y,
        content: (
          <div className="text-left">
            <div className="font-bold mb-1">{`${dataPoint.startDate.toLocaleDateString(locale, {day: '2-digit', month:'short'})} - ${dataPoint.endDate.toLocaleDateString(locale, {day: '2-digit', month:'short'})}`}</div>
            <div className="flex justify-between items-center gap-2">
              <span>{t('charts.earningsTooltip')}</span>
              <span className="font-semibold">{currencySymbol}{dataPoint.earnings.toFixed(2)}</span>
            </div>
          </div>
        )
      });
    }
  };

  const handleMouseLeave = () => {
    setActiveBarIndex(null);
    setTooltipConfig(null);
  };

  const handlePrevMonth = () => onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const handleNextMonth = () => onMonthChange(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  
  const {
    effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues,
    chartHeight, chartBottomMargin, chartLeftMargin, barSlotWidth, chartRightMargin, totalChartContentWidth
  } = chartVisuals;
  const { axisLabelFontSize, weekLabelFontSize } = currentSizeConfig;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-1">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <CalendarWeekIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('charts.previousMonth')}>
            <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {t('charts.weeklySummary.title')} ({displayDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })})
          </h3>
          <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('charts.nextMonth')}>
            <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
        <ChartSizeSelector currentSize={chartSize} onSizeChange={setChartSize} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 ml-1 sm:ml-0 text-center sm:text-left">
        {t('charts.totalMonth')} <span className="font-semibold text-green-600 dark:text-green-400">{currencySymbol}{totalMonthEarnings.toFixed(2)}</span>
      </p>

      {chartData.every(d => d.earnings === 0) ? (
        <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
          <p>{t('charts.weeklySummary.noEarningsWeek')}</p>
        </div>
      ) : (
        <div 
            className="w-full overflow-x-auto pb-4 relative" 
            ref={svgContainerRef}
            onMouseLeave={handleMouseLeave}
        >
          <svg viewBox={`0 0 ${svgWidth} ${chartHeight + chartBottomMargin}`} className="min-w-full h-auto" style={{ minWidth: `${svgWidth}px` }} role="img" onClick={(e) => { e.stopPropagation(); handleInteraction(null); }}>
            {yTickValues.map((tick, i) => {
              const yPos = chartHeight - (tick / effectiveMaxEarnings) * chartHeight;
              return (
                <g key={`y-tick-weekly-${i}`} className="text-xs text-slate-500 dark:text-slate-400">
                  <line x1={chartLeftMargin - 5} y1={yPos} x2={svgWidth - chartRightMargin} y2={yPos} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                  <text x={chartLeftMargin - 8} y={yPos + 4} textAnchor="end" style={{ fontSize: axisLabelFontSize }}>{currencySymbol}{Math.round(tick)}</text>
                </g>
              );
            })}
             <text transform={`translate(${chartLeftMargin / 3}, ${chartHeight/2}) rotate(-90)`} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{ fontSize: axisLabelFontSize }}>{t('charts.earnings')} ({currencySymbol})</text>

            {chartData.map((d, i) => {
              const barHeightValue = d.earnings > 0 ? (d.earnings / effectiveMaxEarnings) * chartHeight : 0;
              const x = chartLeftMargin + i * barSlotWidth + (barSlotWidth - barActualWidth) / 2;
              const y = chartHeight - barHeightValue;
              return (
                <g key={d.weekLabel} onMouseEnter={(e) => handleInteraction(i, e)} onClick={(e) => { e.stopPropagation(); handleInteraction(i, e); }}>
                  <rect x={x} y={y} width={barActualWidth} height={barHeightValue} className="fill-sky-500 hover:fill-sky-400 dark:fill-sky-600 dark:hover:fill-sky-500 transition-colors" rx="2" ry="2" />
                  <text x={x + barActualWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-slate-600 dark:text-slate-400" style={{ fontSize: weekLabelFontSize }}>{d.weekLabel}</text>
                  <text x={x + barActualWidth / 2} y={chartHeight + 28} textAnchor="middle" className="text-slate-500 dark:text-slate-400" style={{ fontSize: `calc(${weekLabelFontSize} - 1px)` }}>({d.startDate.getDate()}-{d.endDate.getDate()})</text>
                </g>
              );
            })}
             <text x={chartLeftMargin + totalChartContentWidth / 2} y={chartHeight + chartBottomMargin - 5} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{ fontSize: axisLabelFontSize }}>{t('charts.weekOfMonth')}</text>
          </svg>
          {tooltipConfig && <ChartTooltip isVisible={true} position={tooltipConfig} content={tooltipConfig.content} />}
        </div>
      )}
    </div>
  );
};

export default WeeklySummaryChart;