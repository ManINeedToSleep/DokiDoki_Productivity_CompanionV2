import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimerSettings } from '@/components/Timer/types';
import { updateTimerSettings as updateTimerSettingsInFirebase } from '@/lib/firebase/user';

interface TimerState {
  // Default timer settings
  settings: TimerSettings;
  
  // Last synced with Firebase timestamp
  lastSyncTime: number | null;
  
  // User ID for whom these settings apply
  userId: string | null;
  
  // Actions
  setSettings: (settings: TimerSettings) => void;
  updateSettings: (key: keyof TimerSettings, value: number) => void;
  syncWithFirebase: (userId: string) => Promise<void>;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Default settings
      settings: {
        workDuration: 25 * 60, // 25 minutes in seconds
        breakDuration: 5 * 60, // 5 minutes in seconds
        longBreakDuration: 15 * 60, // 15 minutes in seconds
        sessionsBeforeLongBreak: 4
      },
      lastSyncTime: null,
      userId: null,
      
      // Set entire settings object
      setSettings: (settings) => set({ settings }),
      
      // Update a single setting
      updateSettings: (key, value) => set(state => ({
        settings: {
          ...state.settings,
          [key]: value
        }
      })),
      
      // Sync settings with Firebase
      syncWithFirebase: async (userId) => {
        try {
          const { settings } = get();
          
          // Convert seconds to minutes for Firebase
          await updateTimerSettingsInFirebase(userId, {
            workDuration: Math.floor(settings.workDuration / 60),
            shortBreakDuration: Math.floor(settings.breakDuration / 60),
            longBreakDuration: Math.floor(settings.longBreakDuration / 60),
            longBreakInterval: settings.sessionsBeforeLongBreak,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            notifications: true
          });
          
          set({ 
            lastSyncTime: Date.now(),
            userId
          });
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error syncing timer settings with Firebase:', error);
          return Promise.reject(error);
        }
      },
      
      // Reset timer to default settings
      resetTimer: () => set({
        settings: {
          workDuration: 25 * 60, // 25 minutes in seconds
          breakDuration: 5 * 60, // 5 minutes in seconds
          longBreakDuration: 15 * 60, // 15 minutes in seconds
          sessionsBeforeLongBreak: 4
        }
      })
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        settings: state.settings,
        userId: state.userId
      }),
    }
  )
); 