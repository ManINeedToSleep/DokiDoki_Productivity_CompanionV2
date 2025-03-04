"use client";

import { useState } from 'react';
import { 
  useDialogueNotifications, 
  useAchievementNotifications,
  useGoalNotifications,
  useReminderNotifications
} from './NotificationManager';
import { CompanionId } from '@/lib/firebase/companion';
import { Timestamp } from 'firebase/firestore';

export default function NotificationDemo() {
  const { showDialogue } = useDialogueNotifications();
  const { showAchievement } = useAchievementNotifications();
  const { 
    showGoalCompleted, 
    showGoalAdded, 
    showGoalUpdated, 
    showGoalRemoved, 
    showGoalProgress 
  } = useGoalNotifications();
  const { 
    showReminder, 
    showInactivityReminder, 
    showStreakReminder 
  } = useReminderNotifications();

  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>('sayori');

  // Sample achievement
  const sampleAchievement = {
    id: 'demo-achievement',
    title: 'First Steps',
    description: 'Complete your first focus session',
    icon: '🏆',
    unlockedAt: Timestamp.now(),
    type: 'focus' as 'focus' | 'streak' | 'companion' | 'goal' | 'hidden',
    requirement: {
      type: 'sessions' as 'minutes' | 'streak' | 'goals' | 'affinity' | 'sessions' | 'special',
      value: 1
    },
    reward: {
      type: 'background' as 'background' | 'sprite' | 'gift' | 'feature',
      id: 'cherry-blossoms',
      description: 'Cherry Blossoms Background'
    }
  };

  // Sample goal
  const sampleGoal = {
    id: 'demo-goal',
    title: 'Study for Exam',
    description: 'Focus on studying for the upcoming math exam',
    targetMinutes: 120,
    currentMinutes: 60,
    deadline: Timestamp.now(),
    createdAt: Timestamp.now(),
    completed: false,
    type: 'daily' as 'daily' | 'weekly' | 'challenge'
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-pink-600 mb-4 font-[Riffic]">Notification Demo</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Companion</label>
        <select 
          value={selectedCompanion}
          onChange={(e) => setSelectedCompanion(e.target.value as CompanionId)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="sayori">Sayori</option>
          <option value="natsuki">Natsuki</option>
          <option value="yuri">Yuri</option>
          <option value="monika">Monika</option>
        </select>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Dialogue Notifications</h3>
          <button
            onClick={() => showDialogue(
              selectedCompanion, 
              "Hey there! I'm so excited to help you focus today! Let's do our best together, okay?",
              7000
            )}
            className="w-full py-2 px-4 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            Show Dialogue
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Achievement Notifications</h3>
          <button
            onClick={() => showAchievement(sampleAchievement)}
            className="w-full py-2 px-4 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            Show Achievement
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Goal Notifications</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => showGoalCompleted(sampleGoal, selectedCompanion)}
              className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Goal Completed
            </button>
            <button
              onClick={() => showGoalAdded(sampleGoal)}
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Goal Added
            </button>
            <button
              onClick={() => showGoalUpdated(sampleGoal)}
              className="py-2 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              Goal Updated
            </button>
            <button
              onClick={() => showGoalRemoved(sampleGoal)}
              className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
            >
              Goal Removed
            </button>
            <button
              onClick={() => showGoalProgress(sampleGoal, 50, selectedCompanion)}
              className="py-2 px-4 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm col-span-2"
            >
              Goal Progress (50%)
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Reminder Notifications</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => showInactivityReminder(
                "I haven't seen you focus in a while! Want to start a session?",
                selectedCompanion,
                () => alert('Starting session...')
              )}
              className="py-2 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
            >
              Inactivity Reminder
            </button>
            <button
              onClick={() => showStreakReminder(
                "You're on a 5-day streak! Keep it up!",
                selectedCompanion
              )}
              className="py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm"
            >
              Streak Reminder
            </button>
            <button
              onClick={() => showReminder(
                "Session Complete",
                "You've completed your focus session!",
                {
                  companionId: selectedCompanion,
                  reminderType: 'session',
                  duration: 5000
                }
              )}
              className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm col-span-2"
            >
              Session Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 