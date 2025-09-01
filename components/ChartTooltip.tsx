
import React from 'react';

interface ChartTooltipProps {
  content: React.ReactNode;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ content, position, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  // Adjust transform to ensure tooltip stays within viewport as much as possible
  const transformClasses = 'transform -translate-x-1/2 -translate-y-[110%]';

  return (
    <div
      className={`absolute bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-md shadow-lg p-2.5 pointer-events-none transition-opacity duration-150 z-50 ${transformClasses}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isVisible ? 1 : 0,
        minWidth: '120px',
      }}
    >
      {content}
    </div>
  );
};
