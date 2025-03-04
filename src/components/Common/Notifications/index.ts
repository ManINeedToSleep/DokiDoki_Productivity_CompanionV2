// Export individual notification components
export { default as DialogueNotification } from './DialogueNotification';
export { default as AchievementNotification } from './AchievementNotification';
export { default as GoalNotification } from './GoalNotification';
export { default as ReminderNotification } from './ReminderNotification';

// Export notification manager and hooks
export {
  NotificationProvider,
  useNotifications,
  useDialogueNotifications,
  useAchievementNotifications,
  useGoalNotifications,
  useReminderNotifications,
  type NotificationType,
  type NotificationData,
  type DialogueNotificationData,
  type AchievementNotificationData,
  type GoalNotificationData,
  type ReminderNotificationData
} from './NotificationManager'; 