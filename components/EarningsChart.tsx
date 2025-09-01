import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkSessionsMap, ChartRenderSize } from '../types.ts';
import { formatDateISO } from '../utils/dateUtils.ts';
import { ChartSizeSelector } from './ChartSizeSelector.tsx';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon.tsx';
import { ChevronRightIcon } from './icons/ChevronRightIcon.tsx';
import { ChartTooltip } from './ChartTooltip.tsx';

interface EarningsChartProps {
  workSessions: WorkSessionsMap;
  currentMonthDate: Date;
  idealDailyEarnings: number;
  currencySymbol: string;
  getEarningsForDay: (workDay: WorkDay) => number;
  onMonthChange: (newMonth: Date) => void;
  locale: string;
}

interface ChartDataPoint {
  dateLabel: string; 
  fullDate: Date; 
  earnings: number;
}

interface SizeConfig {
  barSlotWidth: number;
  barPaddingFraction: number;
  labelInterval: number;
  axisLabelFontSize: string;
  dayLabelFontSize: string;
  goalLabelFontSize: string;
  shortfallTextFontSize: string; 
  chartHeight: number;
  chartBottomMargin: number;
  chartLeftMargin: number;
}

const sizeConfigs: Record<ChartRenderSize, SizeConfig> = {
  small: { 
    barSlotWidth: 20, barPaddingFraction: 0.45, labelInterval: 4, 
    axisLabelFontSize: '9px', dayLabelFontSize: '9px', goalLabelFontSize: '9px',
    shortfallTextFontSize: '7px',
    chartHeight: 200, chartBottomMargin: 35, chartLeftMargin: 40,
  },
  medium: { 
    barSlotWidth: 35, barPaddingFraction: 0.3, labelInterval: 2, 
    axisLabelFontSize: '10px', dayLabelFontSize: '10px', goalLabelFontSize: '10px',
    shortfallTextFontSize: '8px',
    chartHeight: 250, chartBottomMargin: 40, chartLeftMargin: 45,
  },
  large: { 
    barSlotWidth: 50, barPaddingFraction: 0.2, labelInterval: 1, 
    axisLabelFontSize: '11px', dayLabelFontSize: '11px', goalLabelFontSize: '11px',
    shortfallTextFontSize: '9px',
    chartHeight: 300, chartBottomMargin: 45, chartLeftMargin: 50,
  },
};

export const EarningsChart: React.FC<EarningsChartProps> = ({ workSessions, currentMonthDate, idealDailyEarnings, currencySymbol, getEarningsForDay, onMonthChange, locale }) => {
  const { t } = useTranslation();
  const [chartSize, setChartSize] = useState<ChartRenderSize>('medium');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [tooltipConfig, setTooltipConfig] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  const displayDate = currentMonthDate;
  const currentSizeConfig = useMemo(() => sizeConfigs[chartSize], [chartSize]);
  const monthYearLabel = useMemo(() => displayDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), [displayDate, locale]);

  const chartData = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dataPoints: ChartDataPoint[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateKey = formatDateISO(currentDate);
      const workDay = workSessions[dateKey];
      let earnings = 0;

      if (workDay) {
        earnings = getEarningsForDay(workDay);
      }
      
      dataPoints.push({
        dateLabel: day.toString(),
        fullDate: currentDate,
        earnings,
      });
    }
    return dataPoints;
  }, [workSessions, getEarningsForDay, displayDate]);

  const totalMonthEarnings = useMemo(() => chartData.reduce((sum, day) => sum + day.earnings, 0), [chartData]);
  
  const chartVisuals = useMemo(() => {
    const { 
      barSlotWidth, barPaddingFraction, chartHeight, 
      chartBottomMargin, chartLeftMargin 
    } = currentSizeConfig;
    const calculatedMaxEarnings = Math.max(...chartData.map(d => d.earnings), idealDailyEarnings > 0 ? idealDailyEarnings : 0);
    const effectiveMaxEarnings = calculatedMaxEarnings > 0 ? calculatedMaxEarnings : 50; 
    const barActualWidth = barSlotWidth * (1 - barPaddingFraction);
    const chartRightMargin = 10;
    const totalChartContentWidth = chartData.length * barSlotWidth;
    const svgWidth = chartLeftMargin + totalChartContentWidth + chartRightMargin;
    const yAxisTicks = 5;
    const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => (effectiveMaxEarnings / yAxisTicks) * i);
    const idealEarningsYPosition = idealDailyEarnings > 0 && effectiveMaxEarnings > 0
      ? chartHeight - (idealDailyEarnings / effectiveMaxEarnings) * chartHeight
      : -1;
    return {
      effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues, idealEarningsYPosition,
      chartHeight, chartBottomMargin, chartLeftMargin, chartRightMargin, totalChartContentWidth, barSlotWidth
    };
  }, [chartData, idealDailyEarnings, currentSizeConfig]);

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
            <div className="font-bold mb-1">{dataPoint.fullDate.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</div>
            <div className="flex justify-between items-center gap-2">
              <span>{t('charts.earningsTooltip')}</span>
              <span className="font-semibold">{currencySymbol}{dataPoint.earnings.toFixed(2)}</span>
            </div>
            {idealDailyEarnings > 0 && 
              <div className="flex justify-between items-center gap-2">
                <span>{t('charts.goalTooltip')}</span>
                <span className="font-semibold">{currencySymbol}{idealDailyEarnings.toFixed(2)}</span>
              </div>
            }
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

  if (chartData.length === 0 && displayDate.getMonth() === currentMonthDate.getMonth() && displayDate.getFullYear() === currentMonthDate.getFullYear() ) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('charts.monthlyEarnings.title')}</h3>
        <p className="mt-2">{t('charts.noDataForChart', { monthYear: monthYearLabel })}</p>
      </div>
    );
  }
  
  const { 
    effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues, idealEarningsYPosition,
    chartHeight, chartBottomMargin, chartLeftMargin, chartRightMargin, totalChartContentWidth, barSlotWidth
  } = chartVisuals;
  const { axisLabelFontSize, dayLabelFontSize, goalLabelFontSize, labelInterval, shortfallTextFontSize } = currentSizeConfig;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-1">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={t('charts.previousMonth')}>
            <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {t('charts.monthlyEarnings.title')} ({monthYearLabel})
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

      <div 
        className="w-full overflow-x-auto pb-4 relative" 
        ref={svgContainerRef}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
            viewBox={`0 0 ${svgWidth} ${chartHeight + chartBottomMargin}`} 
            className="min-w-full h-auto" 
            style={{ minWidth: `${svgWidth}px` }}
            aria-labelledby="earningsChartTitle"
            role="img"
            onClick={(e) => { e.stopPropagation(); handleInteraction(null); }}
        >
          <title id="earningsChartTitle">{t('charts.monthlyEarnings.title')} {monthYearLabel}</title>
          
          {/* Y-Axis Grid Lines & Labels */}
          {yTickValues.map((tick, i) => {
            const yPos = chartHeight - (tick / effectiveMaxEarnings) * chartHeight;
            return (
              <g key={`y-tick-${i}`} className="text-slate-500 dark:text-slate-400">
                <line x1={chartLeftMargin - 5} y1={yPos} x2={svgWidth - chartRightMargin} y2={yPos} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                <text x={chartLeftMargin - 8} y={yPos + 4} textAnchor="end" style={{ fontSize: axisLabelFontSize }}>
                  {currencySymbol}{Math.round(tick)}
                </text>
              </g>
            );
          })}
          <text transform={`translate(${chartLeftMargin / 3}, ${chartHeight/2}) rotate(-90)`} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{ fontSize: axisLabelFontSize }}>{t('charts.earnings')} ({currencySymbol})</text>

          {/* Chart Bars & X-Axis Labels */}
          {chartData.map((d, i) => {
            const barHeightValue = d.earnings > 0 && effectiveMaxEarnings > 0 ? (d.earnings / effectiveMaxEarnings) * chartHeight : 0;
            const x = chartLeftMargin + i * barSlotWidth + ((barSlotWidth - barActualWidth) / 2);
            const y = chartHeight - barHeightValue;
            
            let barFillClass = "fill-sky-500 hover:fill-sky-400 dark:fill-sky-600 dark:hover:fill-sky-500";
            if (idealDailyEarnings > 0 && d.earnings > 0 && d.earnings < idealDailyEarnings) {
              barFillClass = "fill-red-500 hover:fill-red-400 dark:fill-red-600 dark:hover:fill-red-500";
            }

            return (
              <g key={d.dateLabel} onMouseEnter={(e) => handleInteraction(i, e)} onClick={(e) => { e.stopPropagation(); handleInteraction(i, e); }}>
                <rect x={x} y={y} width={barActualWidth} height={barHeightValue} className={`${barFillClass} transition-colors`} rx="2" ry="2" />
                
                {idealDailyEarnings > 0 && d.earnings > 0 && d.earnings < idealDailyEarnings && (
                   <text x={x + barActualWidth / 2} y={y - 4} textAnchor="middle" className="fill-red-600 dark:fill-red-400 font-semibold" style={{fontSize: shortfallTextFontSize}}>
                    (-{currencySymbol}{(idealDailyEarnings - d.earnings).toFixed(2)})
                   </text>
                )}

                {i % labelInterval === 0 && (
                  <text x={x + barActualWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-slate-600 dark:text-slate-400" style={{ fontSize: dayLabelFontSize }}>
                    {d.dateLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Ideal Earnings Goal Line */}
          {idealDailyEarnings > 0 && idealEarningsYPosition >= 0 && idealEarningsYPosition <= chartHeight && (
            <g>
              <line x1={chartLeftMargin} y1={idealEarningsYPosition} x2={svgWidth - chartRightMargin} y2={idealEarningsYPosition} stroke="red" strokeWidth="1.5" strokeDasharray="4,4" />
              <text x={chartLeftMargin + 5} y={idealEarningsYPosition - 5 < 10 ? idealEarningsYPosition + 15 : idealEarningsYPosition - 5} className="fill-red-600 dark:fill-red-400 font-medium" style={{ fontSize: goalLabelFontSize }}>
                {t('charts.goal')}: {currencySymbol}{idealDailyEarnings.toFixed(0)}
              </text>
            </g>
          )}

          <text x={chartLeftMargin + totalChartContentWidth / 2} y={chartHeight + chartBottomMargin - 5} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{fontSize: axisLabelFontSize}}>{t('charts.dayOfMonth')}</text>
        </svg>

        {tooltipConfig && <ChartTooltip isVisible={true} position={tooltipConfig} content={tooltipConfig.content} />}
      </div>
      
      {chartData.length > 0 && totalMonthEarnings === 0 && (!idealDailyEarnings || idealDailyEarnings === 0) && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">{t('charts.noEarningsRecorded', { monthYear: monthYearLabel })}</p>
      )}
    </div>
  );
};

export default EarningsChart;