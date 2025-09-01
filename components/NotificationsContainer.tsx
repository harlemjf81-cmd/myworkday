import React from 'react';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { NotificationItem } from './NotificationItem.tsx';

export const NotificationsContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (!notifications.length) {
    return null;
  }

  return (
    <div 
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-start z-[200]" // High z-index
      style={{paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)'}} // Adjust for potential notches
    >
      <div className="max-w-sm w-full">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};