import { useState, useEffect } from 'react';
import type { AppState, NotificationData } from '../types';
import * as storageService from '../services/storageService';
import '../styles/NotificationSystem.css';

interface NotificationSystemProps {
  appState: AppState;
  onFillQuestionnaire: (questionnaireId: string) => void;
  onDismissNotification: (notificationId: string) => void;
}

export default function NotificationSystem({
  appState,
  onFillQuestionnaire,
  onDismissNotification
}: NotificationSystemProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Check for pending notifications every minute
    const checkNotifications = () => {
      const pending = storageService.getPendingNotifications(appState);
      setPendingNotifications(pending);

      // Show notification panel if there are pending notifications
      if (pending.length > 0 && !showNotifications) {
        setShowNotifications(true);
      }
    };

    // Initial check
    checkNotifications();

    // Set up interval to check every minute
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [appState, showNotifications]);

  useEffect(() => {
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Show browser notifications for new pending notifications
    if (pendingNotifications.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      pendingNotifications.forEach(notification => {
        // Only show if notification was just created (within last 2 minutes)
        const notificationAge = Date.now() - notification.createdAt;
        if (notificationAge < 2 * 60 * 1000) {
          new Notification(`Time to fill: ${notification.questionnaireName}`, {
            body: 'Your questionnaire is ready to be filled out.',
            icon: '/favicon.ico',
            tag: notification.id, // Prevent duplicate notifications
          });
        }
      });
    }
  }, [pendingNotifications]);

  const handleFillQuestionnaire = (questionnaireId: string, notificationId: string) => {
    onFillQuestionnaire(questionnaireId);
    onDismissNotification(notificationId);

    // If this was the last notification, hide the panel
    if (pendingNotifications.length === 1) {
      setShowNotifications(false);
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    onDismissNotification(notificationId);

    // If this was the last notification, hide the panel
    if (pendingNotifications.length === 1) {
      setShowNotifications(false);
    }
  };

  const handleDismissAll = () => {
    pendingNotifications.forEach(notification => {
      onDismissNotification(notification.id);
    });
    setShowNotifications(false);
  };

  const formatTimeAgo = (scheduledFor: number): string => {
    const now = Date.now();
    const diff = now - scheduledFor;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  // Don't render anything if there are no notifications
  if (pendingNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      <button
        className="notification-badge"
        onClick={() => setShowNotifications(!showNotifications)}
        title={`${pendingNotifications.length} pending questionnaire${pendingNotifications.length !== 1 ? 's' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span className="notification-count">{pendingNotifications.length}</span>
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="notification-overlay" onClick={() => setShowNotifications(false)}></div>
          <div className="notification-panel">
            <div className="notification-panel-header">
              <h3>Pending Questionnaires</h3>
              <div className="notification-header-actions">
                {pendingNotifications.length > 1 && (
                  <button
                    className="dismiss-all-button"
                    onClick={handleDismissAll}
                    title="Dismiss all notifications"
                  >
                    Dismiss All
                  </button>
                )}
                <button
                  className="close-notification-panel"
                  onClick={() => setShowNotifications(false)}
                  title="Close panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div className="notification-list">
              {pendingNotifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-content">
                    <div className="notification-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div className="notification-info">
                      <h4 className="notification-title">{notification.questionnaireName}</h4>
                      <p className="notification-time">Scheduled {formatTimeAgo(notification.scheduledFor)}</p>
                    </div>
                  </div>

                  <div className="notification-actions">
                    <button
                      className="fill-questionnaire-button"
                      onClick={() => handleFillQuestionnaire(notification.questionnaireId, notification.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                      Fill
                    </button>
                    <button
                      className="dismiss-notification-button"
                      onClick={() => handleDismissNotification(notification.id)}
                      title="Dismiss notification"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="notification-panel-footer">
              <p className="notification-help">
                Questionnaires appear here when it's time to fill them out based on their schedule.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}