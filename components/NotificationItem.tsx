import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types.ts';
import { InformationCircleIcon } from './icons/InformationCircleIcon.tsx';
import { CheckCircleIconFilled } from './icons/CheckCircleIconFilled.tsx';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon.tsx';
import { XCircleIcon } from './icons/XCircleIcon.tsx';

interface NotificationItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: CheckCircleIconFilled,
  error: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const colorMap = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    icon: 'text-green-500',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: 'text-red-500',
    progress: 'bg-red-500',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    icon: 'text-sky-500',
    progress: 'bg-sky-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: 'text-amber-500',
    progress: 'bg-amber-500',
  },
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const { id, message, type, duration = 3000 } = notification;
  const IconComponent = iconMap[type];
  const colors = colorMap[type];
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = duration - elapsedTime;
        if (remainingTime <= 0) {
          clearInterval(timer);
          onDismiss(id);
        } else {
          setProgress((remainingTime / duration) * 100);
        }
      }, 50); // Update progress roughly every 50ms

      return () => clearInterval(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div 
      className={`relative ${colors.bg} p-3 rounded-lg shadow-md mb-3 overflow-hidden transition-all duration-300 ease-out transform animate-toast-in`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-2.5 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-medium ${colors.text}`}>{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onDismiss(id)}
            className={`inline-flex rounded-md p-1 ${colors.bg} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.progress}`}
            aria-label="Cerrar notificación"
          >
            <XCircleIcon className={`h-5 w-5 ${colors.text}`} aria-hidden="true" />
          </button>
        </div>
      </div>
      {duration > 0 && (
         <div className={`absolute bottom-0 left-0 h-0.5 ${colors.progress} opacity-70`} style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}></div>
      )}
    </div>
  );
};