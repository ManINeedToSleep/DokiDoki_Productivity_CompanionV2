"use client";

import { useState, createContext, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DialogueNotification from './DialogueNotification';
import AchievementNotification from './AchievementNotification';
import GoalNotification from './GoalNotification';
import ReminderNotification from './ReminderNotification';
import { CompanionId } from '@/lib/firebase/companion';
import { Achievement } from '@/lib/firebase/achievements';
import { Goal } from '@/lib/firebase/goals';
import { useAudio } from '@/lib/contexts/AudioContext';

// Notification Types
export type NotificationType = 
  | 'dialogue'
  | 'achievement'
  | 'goal'
  | 'reminder';

// Notification Data Types
export interface DialogueNotificationData {
  type: 'dialogue';
  companionId: CompanionId;
  message: string;
  duration?: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'bottom-center';
}

export interface AchievementNotificationData {
  type: 'achievement';
  achievement: Achievement;
  duration?: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'top-center';
}

export interface GoalNotificationData {
  type: 'goal';
  goal: Goal;
  action: 'completed' | 'added' | 'updated' | 'removed' | 'progress';
  companionId?: CompanionId;
  progress?: number;
  duration?: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export interface ReminderNotificationData {
  type: 'reminder';
  title: string;
  message: string;
  companionId?: CompanionId;
  reminderType?: 'inactivity' | 'streak' | 'goal' | 'session' | 'general';
  duration?: number;
  onAction?: () => void;
  actionLabel?: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'center';
}

export type NotificationData = 
  | DialogueNotificationData
  | AchievementNotificationData
  | GoalNotificationData
  | ReminderNotificationData;

// Notification Item with ID
interface NotificationItem {
  id: string;
  data: NotificationData;
}

// Context Type
interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (data: NotificationData) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { playSoundEffect, isSoundEffectsEnabled } = useAudio();

  const addNotification = (data: NotificationData): string => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, data }]);
    
    // Play notification sound based on type
    if (isSoundEffectsEnabled) {
      switch (data.type) {
        case 'achievement':
          playSoundEffect('giggle');
          break;
        case 'dialogue':
          playSoundEffect('select');
          break;
        case 'goal':
          if (data.action === 'completed') {
            playSoundEffect('giggle');
          } else {
            playSoundEffect('notif');
          }
          break;
        case 'reminder':
          playSoundEffect('notif');
          break;
        default:
          playSoundEffect('notif');
      }
    }
    
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationRenderer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </NotificationContext.Provider>
  );
}

// Hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper functions for specific notification types
export function useDialogueNotifications() {
  const { addNotification } = useNotifications();
  
  return {
    showDialogue: (
      companionId: CompanionId, 
      message: string, 
      duration?: number,
      position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'bottom-center'
    ) => {
      return addNotification({
        type: 'dialogue',
        companionId,
        message,
        duration,
        position
      });
    }
  };
}

export function useAchievementNotifications() {
  const { addNotification } = useNotifications();
  
  return {
    showAchievement: (
      achievement: Achievement,
      duration?: number,
      position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'top-center'
    ) => {
      return addNotification({
        type: 'achievement',
        achievement,
        duration,
        position
      });
    }
  };
}

export function useGoalNotifications() {
  const { addNotification } = useNotifications();
  
  return {
    showGoalCompleted: (goal: Goal, companionId?: CompanionId, duration?: number) => {
      return addNotification({
        type: 'goal',
        goal,
        action: 'completed',
        companionId,
        duration
      });
    },
    showGoalAdded: (goal: Goal, duration?: number) => {
      return addNotification({
        type: 'goal',
        goal,
        action: 'added',
        duration
      });
    },
    showGoalUpdated: (goal: Goal, duration?: number) => {
      return addNotification({
        type: 'goal',
        goal,
        action: 'updated',
        duration
      });
    },
    showGoalRemoved: (goal: Goal, duration?: number) => {
      return addNotification({
        type: 'goal',
        goal,
        action: 'removed',
        duration
      });
    },
    showGoalProgress: (goal: Goal, progress: number, companionId?: CompanionId, duration?: number) => {
      return addNotification({
        type: 'goal',
        goal,
        action: 'progress',
        progress,
        companionId,
        duration
      });
    }
  };
}

export function useReminderNotifications() {
  const { addNotification } = useNotifications();
  
  return {
    showReminder: (
      title: string,
      message: string,
      options?: {
        companionId?: CompanionId;
        reminderType?: 'inactivity' | 'streak' | 'goal' | 'session' | 'general';
        duration?: number;
        onAction?: () => void;
        actionLabel?: string;
        position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'center';
      }
    ) => {
      return addNotification({
        type: 'reminder',
        title,
        message,
        ...options
      });
    },
    showInactivityReminder: (
      message: string,
      companionId: CompanionId,
      onAction?: () => void
    ) => {
      return addNotification({
        type: 'reminder',
        title: 'Time to Focus!',
        message,
        companionId,
        reminderType: 'inactivity',
        onAction,
        actionLabel: 'Start Session'
      });
    },
    showStreakReminder: (
      message: string,
      companionId: CompanionId
    ) => {
      return addNotification({
        type: 'reminder',
        title: 'Streak Alert',
        message,
        companionId,
        reminderType: 'streak',
        duration: 8000
      });
    }
  };
}

// Renderer Component
function NotificationRenderer({ 
  notifications, 
  removeNotification 
}: { 
  notifications: NotificationItem[]; 
  removeNotification: (id: string) => void;
}) {
  return (
    <>
      {notifications.map(({ id, data }) => {
        switch (data.type) {
          case 'dialogue':
            return (
              <DialogueNotification
                key={id}
                companionId={data.companionId}
                message={data.message}
                duration={data.duration}
                position={data.position}
                onClose={() => removeNotification(id)}
              />
            );
          case 'achievement':
            return (
              <AchievementNotification
                key={id}
                achievement={data.achievement}
                duration={data.duration}
                position={data.position}
                onClose={() => removeNotification(id)}
              />
            );
          case 'goal':
            return (
              <GoalNotification
                key={id}
                goal={data.goal}
                action={data.action}
                companionId={data.companionId}
                progress={data.progress}
                duration={data.duration}
                position={data.position}
                onClose={() => removeNotification(id)}
              />
            );
          case 'reminder':
            return (
              <ReminderNotification
                key={id}
                title={data.title}
                message={data.message}
                companionId={data.companionId}
                type={data.reminderType}
                duration={data.duration}
                onAction={data.onAction}
                actionLabel={data.actionLabel}
                position={data.position}
                onClose={() => removeNotification(id)}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
} 