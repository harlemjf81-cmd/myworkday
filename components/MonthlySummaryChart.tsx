import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkDay, WorkSessionsMap, MonthlyAggregatedEarnings, ChartRenderSize } from '../types.ts';
import { getMonthName, getWeeksInMonth, formatDateISO } from '../utils/dateUtils.ts';
import { ChartSizeSelector } from './ChartSizeSelector.tsx';
import { ChartTooltip } from './ChartTooltip.tsx';

interface MonthlySummaryChartProps {
  workSessions: WorkSessionsMap;
  idealMonthlyEarnings: number;
  idealDailyEarnings: number;
  currencySymbol: string;
  getEarningsForDay: (workDay: WorkDay) => number;
  locale: string;
}

interface SizeConfig {
  barHeight: number;
  barPadding: number;
  chartLeftMargin: number;
  valueTextSpace: number;
  dataAreaForBarsWidth: number;
  labelFontSize: string;
  valueFontSize: string;
  goalLabelFontSize: string;
  shortfallTextFontSize: string;
  legendFontSize: string;
}

const sizeConfigs: Record<ChartRenderSize, SizeConfig> = {
  small: { 
    barHeight: 20, barPadding: 6, chartLeftMargin: 70, 
    valueTextSpace: 45, dataAreaForBarsWidth: 180, 
    labelFontSize: '10px', valueFontSize: '10px', goalLabelFontSize: '9px',
    shortfallTextFontSize: '8px', legendFontSize: '9px',
  },
  medium: { 
    barHeight: 28, barPadding: 8, chartLeftMargin: 100, 
    valueTextSpace: 60, dataAreaForBarsWidth: 250, 
    labelFontSize: '11px', valueFontSize: '11px', goalLabelFontSize: '10px',
    shortfallTextFontSize: '9px', legendFontSize: '10px',
  },
  large: { 
    barHeight: 35, barPadding: 10, chartLeftMargin: 130, 
    valueTextSpace: 75, dataAreaForBarsWidth: 320, 
    labelFontSize: '12px', valueFontSize: '12px', goalLabelFontSize: '11px',
    shortfallTextFontSize: '10px', legendFontSize: '11px',
  },
};

const WEEK_COLORS = ['#0ea5e9', '#14b8a6', '#6366f1', '#f59e0b', '#f43f5e', '#84cc16']; // sky, teal, indigo, amber, rose, lime
const SURPLUS_COLOR = '#22c55e'; // green-500

export const MonthlySummaryChart: React.FC<MonthlySummaryChartProps> = ({ workSessions, idealMonthlyEarnings, idealDailyEarnings, currencySymbol, getEarningsForDay, locale }) => {
  const { t } = useTranslation();
  const [chartSize, setChartSize] = useState<ChartRenderSize>('medium');
  const [activeSegment, setActiveSegment] = useState<{ monthIndex: number; weekIndex: number } | null>(null);
  const [tooltipConfig, setTooltipConfig] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  const currentSizeConfig = useMemo(() => sizeConfigs[chartSize], [chartSize]);

  const aggregatedData = useMemo((): MonthlyAggregatedEarnings[] => {
    const monthlyTotals: { [key: string]: { year: number, month: number, weeklyEarningsMap: Map<string, number>, totalSurplus: number } } = {};

    Object.entries(workSessions).forEach(([dateKey, workDay]) => {
      const date = new Date(dateKey + 'T00:00:00'); 
      const year = date.getFullYear();
      const month = date.getMonth(); 
      const monthYearKey = `${year}-${month}`;

      if (!monthlyTotals[monthYearKey]) {
        monthlyTotals[monthYearKey] = { year, month, weeklyEarningsMap: new Map(), totalSurplus: 0 };
      }

      const dailyEarning = getEarningsForDay(workDay);
      if(idealDailyEarnings > 0 && dailyEarning > idealDailyEarnings) {
        monthlyTotals[monthYearKey].totalSurplus += dailyEarning - idealDailyEarnings;
      }
      
      const dayOfWeek = date.getDay(); 
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayOfWeek = new Date(date);
      mondayOfWeek.setDate(mondayOfWeek.getDate() - diffToMonday);
      const mondayKey = formatDateISO(mondayOfWeek);

      const currentWeekEarnings = monthlyTotals[monthYearKey].weeklyEarningsMap.get(mondayKey) || 0;
      monthlyTotals[monthYearKey].weeklyEarningsMap.set(mondayKey, currentWeekEarnings + dailyEarning);
    });

    return Object.values(monthlyTotals)
      .map(data => {
        const weeksOfMonth = getWeeksInMonth(new Date(data.year, data.month, 1));
        const sortedWeekKeys = weeksOfMonth.map(w => formatDateISO(w.days[0]));
        
        const weeklyEarnings = sortedWeekKeys.map(key => data.weeklyEarningsMap.get(key) || 0);
        const totalEarnings = weeklyEarnings.reduce((sum, e) => sum + e, 0);

        return {
          ...data,
          monthYearLabel: `${getMonthName(data.month, locale)} ${data.year.toString().slice(-2)}`,
          totalEarnings,
          totalSurplus: data.totalSurplus,
          weeklyEarnings,
        };
      })
      .sort((a, b) => { 
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  }, [workSessions, getEarningsForDay, idealDailyEarnings, locale]);

  const chartLayout = useMemo(() => {
    const { 
      barHeight, barPadding, chartLeftMargin, valueTextSpace, dataAreaForBarsWidth
    } = currentSizeConfig;
    
    const chartTopMargin = 20; 
    const chartBottomMargin = 30; 
    const chartRightMargin = 10;
    const legendHeight = 30;

    const totalChartContentHeight = aggregatedData.length * (barHeight + barPadding) - (aggregatedData.length > 0 ? barPadding : 0);
    const svgHeight = chartTopMargin + legendHeight + totalChartContentHeight + chartBottomMargin;

    const maxDataValue = Math.max(...aggregatedData.map(d => d.totalEarnings), 0);
    const maxDomainValue = Math.max(maxDataValue, idealMonthlyEarnings > 0 ? idealMonthlyEarnings : 0);
    const effectiveMaxEarnings = maxDomainValue > 0 ? maxDomainValue : 100; 

    const viewBoxWidth = chartLeftMargin + dataAreaForBarsWidth + valueTextSpace + chartRightMargin;

    return {
      chartLeftMargin, valueTextSpace, dataAreaForBarsWidth, barHeight, barPadding,
      chartTopMargin, chartBottomMargin, svgHeight, effectiveMaxEarnings, viewBoxWidth, chartRightMargin, legendHeight,
    };
  }, [aggregatedData, idealMonthlyEarnings, currentSizeConfig]);

  const handleInteraction = (monthIndex: number | null, weekIndex: number | null, event?: React.MouseEvent | React.TouchEvent) => {
    if (monthIndex === null || weekIndex === null || (activeSegment && activeSegment.monthIndex === monthIndex && activeSegment.weekIndex === weekIndex)) {
      setActiveSegment(null);
      setTooltipConfig(null);
      return;
    }

    if (!event || !svgContainerRef.current) return;

    setActiveSegment({ monthIndex, weekIndex });
    const monthData = aggregatedData[monthIndex];
    const weekEarning = monthData.weeklyEarnings[weekIndex];
    if (weekEarning > 0) {
      const rect = svgContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in event.nativeEvent ? event.nativeEvent.touches[0].clientX : event.nativeEvent.clientX;
      const clientY = 'touches' in event.nativeEvent ? event.nativeEvent.touches[0].clientY : event.nativeEvent.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setTooltipConfig({
        x, y, content: (
          <div className="text-left">
            <div className="font-bold mb-1">{monthData.monthYearLabel} - {t('charts.week')} {weekIndex + 1}</div>
            <div>{t('charts.earningsTooltip')}: <span className="font-semibold">{currencySymbol}{weekEarning.toFixed(2)}</span></div>
          </div>
        )
      });
    }
  };
  
  const handleMouseLeave = () => {
    setActiveSegment(null);
    setTooltipConfig(null);
  };

  if (aggregatedData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('charts.monthlySummary.title')}</h3>
        <p className="text-slate-500 dark:text-slate-400">{t('charts.noDataForChartGeneric')}</p>
      </div>
    );
  }

  const {
    chartLeftMargin, barHeight, barPadding, chartTopMargin, chartBottomMargin, 
    svgHeight, effectiveMaxEarnings, viewBoxWidth, dataAreaForBarsWidth, chartRightMargin, valueTextSpace, legendHeight
  } = chartLayout;
  const { labelFontSize, valueFontSize, goalLabelFontSize, shortfallTextFontSize, legendFontSize } = currentSizeConfig;

  const valueTextGap = 8; 

  const goalLineXPosition = idealMonthlyEarnings > 0 && effectiveMaxEarnings > 0 ? chartLeftMargin + (idealMonthlyEarnings / effectiveMaxEarnings) * dataAreaForBarsWidth : -1; 
  const maxWeeksInView = Math.max(...aggregatedData.map(d => d.weeklyEarnings.length), 0);
  const anyMonthHasSurplus = aggregatedData.some(d => d.totalSurplus > 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('charts.monthlySummary.title')}</h3>
        <ChartSizeSelector currentSize={chartSize} onSizeChange={setChartSize} />
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 my-2" style={{ fontSize: legendFontSize }}>
        {Array.from({ length: maxWeeksInView }).map((_, index) => (
          <div key={`legend-week-${index}`} className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WEEK_COLORS[index % WEEK_COLORS.length] }}></div>
            <span className="text-slate-600 dark:text-slate-400">{t('charts.week')} {index + 1}</span>
          </div>
        ))}
        {anyMonthHasSurplus && (<div key="legend-surplus" className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SURPLUS_COLOR }}></div><span className="text-slate-600 dark:text-slate-400">{t('charts.surplus')}</span></div>)}
      </div>

      <div 
        className="w-full overflow-y-auto relative"
        ref={svgContainerRef}
        onMouseLeave={handleMouseLeave}
      > 
        <svg viewBox={`0 0 ${viewBoxWidth} ${svgHeight}`} className="min-w-full h-auto" style={{ minHeight: `${svgHeight}px` }} aria-labelledby="monthlyChartTitle" role="img" onClick={(e) => { e.stopPropagation(); handleInteraction(null, null); }}>
          <title id="monthlyChartTitle">{t('charts.monthlySummary.chartAriaLabel')}</title>

          {idealMonthlyEarnings > 0 && goalLineXPosition > chartLeftMargin && goalLineXPosition < (chartLeftMargin + dataAreaForBarsWidth) && (
            <g>
              <line x1={goalLineXPosition} y1={chartTopMargin + legendHeight - (barPadding/2)} x2={goalLineXPosition} y2={svgHeight - chartBottomMargin + (barPadding/2)} stroke="rgb(220 38 38)" strokeWidth="1.5" strokeDasharray="4,4" />
              <text x={goalLineXPosition + 5 > viewBoxWidth - chartRightMargin - 20 ? goalLineXPosition - 5 : goalLineXPosition + 5} y={chartTopMargin + legendHeight + 5} className="fill-red-600 dark:fill-red-400 font-medium" textAnchor={goalLineXPosition + 5 > viewBoxWidth - chartRightMargin - 20 ? "end" : "start"} style={{ fontSize: goalLabelFontSize }}>{t('charts.goal')}: {currencySymbol}{idealMonthlyEarnings.toFixed(0)}</text>
            </g>
          )}

          {aggregatedData.map((d, i) => {
            const yPosition = chartTopMargin + legendHeight + i * (barHeight + barPadding);
            const isBelowGoal = idealMonthlyEarnings > 0 && d.totalEarnings < idealMonthlyEarnings;
            let cumulativeWidth = 0;

            return (
              <g key={d.monthYearLabel}>
                <text x={chartLeftMargin - valueTextGap} y={yPosition + barHeight / 2 + (parseFloat(labelFontSize) / 2.5)} textAnchor="end" className="text-slate-600 dark:text-slate-300 font-medium capitalize fill-current" style={{ fontSize: labelFontSize }}>{d.monthYearLabel}</text>
                
                {d.weeklyEarnings.map((weekEarning, weekIndex) => {
                  if (weekEarning <= 0) return null;
                  const segmentWidth = (weekEarning / effectiveMaxEarnings) * dataAreaForBarsWidth;
                  const segmentX = chartLeftMargin + cumulativeWidth;
                  cumulativeWidth += segmentWidth;
                  return (
                    <rect key={`week-${weekIndex}`} x={segmentX} y={yPosition} width={segmentWidth} height={barHeight} style={{ fill: WEEK_COLORS[weekIndex % WEEK_COLORS.length] }} className="hover:opacity-80 transition-opacity" rx="2" ry="2" onMouseEnter={(e) => handleInteraction(i, weekIndex, e)} onClick={(e) => { e.stopPropagation(); handleInteraction(i, weekIndex, e); }} />
                  );
                })}
                
                {d.totalSurplus > 0 &&
                  (() => {
                    const totalBarWidth = (d.totalEarnings / effectiveMaxEarnings) * dataAreaForBarsWidth;
                    const surplusBarWidth = (d.totalSurplus / effectiveMaxEarnings) * dataAreaForBarsWidth;
                     return (<rect key="surplus-segment" x={chartLeftMargin + totalBarWidth - surplusBarWidth} y={yPosition} width={surplusBarWidth} height={barHeight} style={{ fill: SURPLUS_COLOR }} className="hover:opacity-80 transition-opacity" rx="2" ry="2" />);
                  })()
                }

                {isBelowGoal && (
                  (() => {
                    const barEndX = chartLeftMargin + (d.totalEarnings / effectiveMaxEarnings) * dataAreaForBarsWidth;
                    if (goalLineXPosition > barEndX) {
                      const gapFillWidth = Math.min(goalLineXPosition - barEndX, dataAreaForBarsWidth - barEndX);
                      return (<rect x={barEndX} y={yPosition} width={gapFillWidth} height={barHeight} className="fill-red-300 dark:fill-red-800 opacity-60" rx="2" ry="2" />);
                    }
                    return null;
                  })()
                )}
                
                <text x={chartLeftMargin + (d.totalEarnings / effectiveMaxEarnings) * dataAreaForBarsWidth + valueTextGap} y={yPosition + barHeight / 2 + (parseFloat(valueFontSize) / 2.5)} textAnchor="start" className={`font-semibold ${isBelowGoal ? "fill-red-700 dark:fill-red-400" : "fill-green-700 dark:fill-green-400"}`} style={{ fontSize: valueFontSize }}>
                  {currencySymbol}{d.totalEarnings.toFixed(2)}
                  {d.totalSurplus > 0 && !isBelowGoal && (<tspan dx="5" className="fill-green-600 dark:fill-green-400" style={{ fontSize: shortfallTextFontSize }}>(+{currencySymbol}{d.totalSurplus.toFixed(2)})</tspan>)}
                  {isBelowGoal && (<tspan dx="5" className="fill-red-700 dark:fill-red-300" style={{ fontSize: shortfallTextFontSize }}>(-{currencySymbol}{(idealMonthlyEarnings - d.totalEarnings).toFixed(2)})</tspan>)}
                </text>
              </g>
            );
          })}
        </svg>
        {tooltipConfig && <ChartTooltip isVisible={true} position={tooltipConfig} content={tooltipConfig.content} />}
      </div>
       {aggregatedData.length > 0 && effectiveMaxEarnings <= (idealMonthlyEarnings > 0 ? idealMonthlyEarnings : 100) && Math.max(...aggregatedData.map(d => d.totalEarnings)) === 0 && (
         <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">{t('charts.noEarningsMonths')}</p>
       )}
    </div>
  );
};

export default MonthlySummaryChart;