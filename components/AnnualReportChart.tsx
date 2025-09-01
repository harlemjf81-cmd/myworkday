import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonthName } from '../utils/dateUtils.ts';
import { ChartRenderSize } from '../types.ts';
import { ChartTooltip } from './ChartTooltip.tsx';

interface AnnualReportChartProps {
  earningsPerMonth: number[]; 
  year: number;
  idealMonthlyEarnings: number;
  chartSize: ChartRenderSize; 
  currencySymbol: string;
  locale: string;
}

interface SizeConfig {
  barSlotWidth: number;
  barPaddingFraction: number;
  labelInterval: number;
  axisLabelFontSize: string;
  monthLabelFontSize: string;
  goalLabelFontSize: string;
  shortfallTextFontSize: string;
  chartHeight: number;
  chartBottomMargin: number;
  chartLeftMargin: number;
}

const sizeConfigs: Record<ChartRenderSize, SizeConfig> = {
  small: { 
    barSlotWidth: 20, barPaddingFraction: 0.45, labelInterval: 1,
    axisLabelFontSize: '9px', monthLabelFontSize: '9px', goalLabelFontSize: '9px',
    shortfallTextFontSize: '7px',
    chartHeight: 200, chartBottomMargin: 35, chartLeftMargin: 40,
  },
  medium: { 
    barSlotWidth: 35, barPaddingFraction: 0.3, labelInterval: 1,
    axisLabelFontSize: '10px', monthLabelFontSize: '10px', goalLabelFontSize: '10px',
    shortfallTextFontSize: '8px',
    chartHeight: 250, chartBottomMargin: 40, chartLeftMargin: 45,
  },
  large: { 
    barSlotWidth: 50, barPaddingFraction: 0.2, labelInterval: 1,
    axisLabelFontSize: '11px', monthLabelFontSize: '11px', goalLabelFontSize: '11px',
    shortfallTextFontSize: '9px',
    chartHeight: 300, chartBottomMargin: 45, chartLeftMargin: 50,
  },
};

export const AnnualReportChart: React.FC<AnnualReportChartProps> = ({ earningsPerMonth, year, idealMonthlyEarnings, chartSize, currencySymbol, locale }) => {
  const { t } = useTranslation();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [tooltipConfig, setTooltipConfig] = useState<{ x: number, y: number, content: React.ReactNode } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const currentSizeConfig = useMemo(() => sizeConfigs[chartSize], [chartSize]);

  const chartData = useMemo(() => {
    const tempDate = new Date();
    tempDate.setDate(1);
    return earningsPerMonth.map((earnings, index) => {
        tempDate.setMonth(index);
        return {
            monthLabel: tempDate.toLocaleDateString(locale, { month: 'short' }),
            fullMonthName: getMonthName(index, locale),
            earnings,
        };
    });
  }, [earningsPerMonth, locale]);

  if (!earningsPerMonth || earningsPerMonth.length !== 12) {
    return <p className="text-slate-500 dark:text-slate-400">{t('charts.annualReport.insufficientData')}</p>;
  }

  const chartVisuals = useMemo(() => {
    const { 
      barSlotWidth, barPaddingFraction, chartHeight, 
      chartBottomMargin, chartLeftMargin 
    } = currentSizeConfig;
    
    const calculatedMaxEarnings = Math.max(...chartData.map(d => d.earnings), idealMonthlyEarnings > 0 ? idealMonthlyEarnings : 0);
    const effectiveMaxEarnings = calculatedMaxEarnings > 0 ? calculatedMaxEarnings : 100;

    const barActualWidth = barSlotWidth * (1 - barPaddingFraction);
    const chartRightMargin = 10;
    const totalChartContentWidth = chartData.length * barSlotWidth;
    const svgWidth = chartLeftMargin + totalChartContentWidth + chartRightMargin;

    const yAxisTicks = 5;
    const yTickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => (effectiveMaxEarnings / yAxisTicks) * i);

    const idealMonthlyEarningsYPosition = idealMonthlyEarnings > 0 && effectiveMaxEarnings > 0
      ? chartHeight - (idealMonthlyEarnings / effectiveMaxEarnings) * chartHeight
      : -1;
    
    return {
      effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues, idealMonthlyEarningsYPosition,
      chartHeight, chartBottomMargin, chartLeftMargin, chartRightMargin, totalChartContentWidth, barSlotWidth
    };
  }, [chartData, idealMonthlyEarnings, currentSizeConfig]);

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
            <div className="font-bold mb-1">{dataPoint.fullMonthName} {year}</div>
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

  const { 
    effectiveMaxEarnings, barActualWidth, svgWidth, yTickValues, idealMonthlyEarningsYPosition,
    chartHeight, chartBottomMargin, chartLeftMargin, totalChartContentWidth, barSlotWidth
  } = chartVisuals;
  const { axisLabelFontSize, monthLabelFontSize, goalLabelFontSize, shortfallTextFontSize } = currentSizeConfig;

  return (
    <div 
        className="w-full overflow-x-auto pb-4 mt-4 relative" 
        ref={svgContainerRef}
        onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${chartHeight + chartBottomMargin}`}
        className="min-w-full h-auto"
        style={{ minWidth: `${svgWidth}px` }}
        aria-labelledby={`annualChartTitle-${year}`}
        role="img"
        onClick={(e) => { e.stopPropagation(); handleInteraction(null); }}
      >
        <title id={`annualChartTitle-${year}`}>{t('charts.monthOfYear', { year })}</title>

        {yTickValues.map((tick, i) => {
          const yPos = chartHeight - (tick / effectiveMaxEarnings) * chartHeight;
          return (
            <g key={`y-tick-annual-${i}`} className="text-slate-500 dark:text-slate-400">
              <line x1={chartLeftMargin - 5} y1={yPos} x2={svgWidth} y2={yPos} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3"/>
              <text x={chartLeftMargin - 8} y={yPos + 4} textAnchor="end" style={{ fontSize: axisLabelFontSize }}>{currencySymbol}{Math.round(tick)}</text>
            </g>
          );
        })}
        <text transform={`translate(${chartLeftMargin / 3}, ${chartHeight / 2}) rotate(-90)`} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{ fontSize: axisLabelFontSize }}>{t('charts.earnings')} ({currencySymbol})</text>

        {chartData.map((d, i) => {
          const barHeightValue = d.earnings > 0 && effectiveMaxEarnings > 0 ? (d.earnings / effectiveMaxEarnings) * chartHeight : 0;
          const x = chartLeftMargin + i * barSlotWidth + ((barSlotWidth - barActualWidth) / 2);
          const y = chartHeight - barHeightValue;

          let barFillClass = "fill-sky-500 hover:fill-sky-400 dark:fill-sky-600 dark:hover:fill-sky-500";
          if (idealMonthlyEarnings > 0 && d.earnings > 0 && d.earnings < idealMonthlyEarnings) {
            barFillClass = "fill-red-500 hover:fill-red-400 dark:fill-red-600 dark:hover:fill-red-500";
          }

          return (
            <g key={`${d.monthLabel}-${year}`} onMouseEnter={(e) => handleInteraction(i, e)} onClick={(e) => { e.stopPropagation(); handleInteraction(i, e); }}>
              <rect x={x} y={y} width={barActualWidth} height={barHeightValue} className={`${barFillClass} transition-colors`} rx="2" ry="2" />

              {idealMonthlyEarnings > 0 && d.earnings > 0 && d.earnings < idealMonthlyEarnings && (
                <text x={x + barActualWidth / 2} y={y - 4} textAnchor="middle" className="fill-red-600 dark:fill-red-400 font-semibold" style={{ fontSize: shortfallTextFontSize }}>(-{currencySymbol}{(idealMonthlyEarnings - d.earnings).toFixed(2)})</text>
              )}

              <text x={x + barActualWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-slate-600 dark:text-slate-400 capitalize" style={{ fontSize: monthLabelFontSize }}>{d.monthLabel}</text>
            </g>
          );
        })}

        {idealMonthlyEarnings > 0 && idealMonthlyEarningsYPosition >= 0 && idealMonthlyEarningsYPosition <= chartHeight && (
          <g>
            <line x1={chartLeftMargin} y1={idealMonthlyEarningsYPosition} x2={svgWidth} y2={idealMonthlyEarningsYPosition} stroke="red" strokeWidth="1.5" strokeDasharray="4,4"/>
            <text x={chartLeftMargin + 5} y={idealMonthlyEarningsYPosition - 5 < 10 ? idealMonthlyEarningsYPosition + 15 : idealMonthlyEarningsYPosition - 5} className="fill-red-600 dark:fill-red-400 font-medium" style={{ fontSize: goalLabelFontSize }}>{t('charts.goal')} {t('modals.idealMonthlyEarnings.title')}: {currencySymbol}{idealMonthlyEarnings.toFixed(0)}</text>
          </g>
        )}

        <text x={chartLeftMargin + totalChartContentWidth / 2} y={chartHeight + chartBottomMargin - 5} textAnchor="middle" className="font-medium text-slate-600 dark:text-slate-300" style={{ fontSize: axisLabelFontSize }}>{t('charts.monthOfYear', { year })}</text>
      </svg>
       {tooltipConfig && <ChartTooltip isVisible={true} position={tooltipConfig} content={tooltipConfig.content} />}
      {chartData.length > 0 && Math.max(...chartData.map(d=>d.earnings)) === 0 && (!idealMonthlyEarnings || idealMonthlyEarnings === 0) && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">{t('charts.annualReport.noEarningsYear')}</p>
      )}
    </div>
  );
};

export default AnnualReportChart;