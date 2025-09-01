import React from 'react';
import { ChartRenderSize } from '../types';

interface ChartSizeSelectorProps {
  currentSize: ChartRenderSize;
  onSizeChange: (size: ChartRenderSize) => void;
}

const sizes: { key: ChartRenderSize; label: string }[] = [
  { key: 'small', label: 'S' },
  { key: 'medium', label: 'M' },
  { key: 'large', label: 'L' },
];

export const ChartSizeSelector: React.FC<ChartSizeSelectorProps> = ({ currentSize, onSizeChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-md">
      {sizes.map((size) => {
        const isActive = currentSize === size.key;
        return (
          <button
            key={size.key}
            onClick={() => onSizeChange(size.key)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors duration-150
              ${isActive 
                ? 'bg-sky-500 text-white dark:bg-sky-600' 
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            aria-pressed={isActive}
            title={`Tamaño ${size.key === 'small' ? 'Pequeño' : size.key === 'medium' ? 'Mediano' : 'Grande'}`}
          >
            {size.label}
          </button>
        );
      })}
    </div>
  );
};