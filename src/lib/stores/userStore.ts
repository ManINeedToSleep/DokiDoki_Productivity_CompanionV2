import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { 
  UserDocument, 
  FocusSession,
  UserStats,
  updateFocusGoals as updateFocusGoalsFirebase,
  recordFocusSession as recordFocusSessionFirebase,
  updateSelectedCompanion as updateSelectedCompanionFirebase,
  updateTimerSettings as updateTimerSettingsFirebase,
  updateThemeSettings as updateThemeSettingsFirebase,
  updateCompanionMood as updateCompanionMoodFirebase,
  updateCompanionStats as updateCompanionStatsFirebase,
  updateCompanionAffinity as updateCompanionAffinityFirebase,
  incrementCompletedGoals as incrementCompletedGoalsFirebase,
  getUserDocument
} from '@/lib/firebase/user';
import { CompanionId } from '@/lib/firebase/companion';

// Types for pending updates
interface PendingFocusGoalsUpdate {
  type: 'updateFocusGoals';
  uid: string;
  dailyGoal?: number;
  weeklyGoal?: number;
}

interface PendingFocusSessionUpdate {
  type: 'recordFocusSession';
  uid: string;
  session: Omit<FocusSession, 'id'>;
}

interface PendingCompanionUpdate {
  type: 'updateCompanion';
  uid: string;
  companionId: CompanionId;
  updateType: 'mood' | 'stats' | 'affinity';
  data: number | null;
}

interface PendingSettingsUpdate {
  type: 'updateSettings';
  uid: string;
  updateType: 'timer' | 'theme' | 'selectedCompanion';
  data: UserDocument['settings']['timerSettings'] | UserDocument['settings']['theme'] | CompanionId;
}

interface PendingGoalUpdate {
  type: 'incrementCompletedGoals';
  uid: string;
  isChallenge: boolean;
}

type PendingUpdate = 
  | PendingFocusGoalsUpdate 
  | PendingFocusSessionUpdate 
  | PendingCompanionUpdate
  | PendingSettingsUpdate
  | PendingGoalUpdate;

interface UserState {
  user: UserDocument | null;
  pendingUpdates: PendingUpdate[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  
  // Actions
  setUser: (user: UserDocument | null) => void;
  updateFocusGoals: (uid: string, dailyGoal?: number, weeklyGoal?: number) => void;
  recordFocusSession: (uid: string, session: Omit<FocusSession, 'id'>) => void;
  updateSelectedCompanion: (uid: string, companionId: CompanionId) => void;
  updateTimerSettings: (uid: string, settings: UserDocument['settings']['timerSettings']) => void;
  updateThemeSettings: (uid: string, theme: UserDocument['settings']['theme']) => void;
  updateCompanionMood: (uid: string, companionId: CompanionId) => void;
  updateCompanionStats: (uid: string, companionId: CompanionId, interactionTime: number) => void;
  updateCompanionAffinity: (uid: string, companionId: CompanionId, interactionTime: number) => void;
  incrementCompletedGoals: (uid: string, isChallenge?: boolean) => void;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  refreshUserData: (uid: string) => Promise<void>;
}

// Helper function to calculate updated stats
function calculateUpdatedStats(currentStats: UserStats, newSession: FocusSession): UserStats {
  const sessionDuration = newSession.duration;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lastSessionDate = currentStats.lastSessionDate?.toDate().getTime() || 0;
  const isNewDay = lastSessionDate < today;
  
  // Calculate streaks
  let dailyStreak = currentStats.dailyStreak;
  let weekStreak = currentStats.weekStreak;
  
  if (isNewDay) {
    // If it's a new day, increment the daily streak
    dailyStreak += 1;
    
    // Check if we completed a week
    const lastSessionDay = new Date(lastSessionDate).getDay();
    const today = new Date().getDay();
    if (lastSessionDay > today) { // We've wrapped around to a new week
      weekStreak += 1;
    }
  }
  
  // Calculate today's focus time
  const todaysFocusTime = isNewDay 
    ? sessionDuration 
    : currentStats.todaysFocusTime + sessionDuration;
  
  // Calculate weekly focus time (simplified - a more accurate implementation would check the actual week)
  const weeklyFocusTime = currentStats.weeklyFocusTime + sessionDuration;
  
  return {
    ...currentStats,
    totalFocusTime: currentStats.totalFocusTime + sessionDuration,
    todaysFocusTime,
    weeklyFocusTime,
    totalSessions: currentStats.totalSessions + 1,
    completedSessions: newSession.completed 
      ? currentStats.completedSessions + 1 
      : currentStats.completedSessions,
    dailyStreak,
    weekStreak,
    longestStreak: Math.max(currentStats.longestStreak, weekStreak),
    averageFocusPerDay: (currentStats.totalFocusTime + sessionDuration) / (dailyStreak || 1),
    taskCompletionRate: ((currentStats.completedSessions + (newSession.completed ? 1 : 0)) / 
      (currentStats.totalSessions + 1)) * 100,
    lastSessionDate: Timestamp.now(),
    totalBreaks: currentStats.totalBreaks + newSession.breaks.count,
    averageSessionDuration: ((currentStats.averageSessionDuration * currentStats.totalSessions) + 
      sessionDuration) / (currentStats.totalSessions + 1)
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      pendingUpdates: [],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      
      setUser: (user) => set({ user }),
      
      updateFocusGoals: (uid, dailyGoal, weeklyGoal) => {
        // Update local state immediately
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              goals: {
                ...state.user.goals,
                dailyGoal: dailyGoal ?? state.user.goals.dailyGoal,
                weeklyGoal: weeklyGoal ?? state.user.goals.weeklyGoal,
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateFocusGoals', 
                uid, 
                dailyGoal, 
                weeklyGoal 
              }
            ]
          };
        });
      },
      
      recordFocusSession: (uid, session) => {
        // Update local state immediately
        set((state) => {
          if (!state.user) return state;
          
          // Generate a temporary ID for the session
          const newSession = {
            ...session,
            id: `temp_session_${Date.now()}`,
          } as FocusSession;
          
          // Calculate new stats based on the session
          const updatedStats = calculateUpdatedStats(state.user.focusStats, newSession);
          
          // Update companion stats locally
          const companionId = session.companionId;
          const companion = state.user.companions[companionId];
          
          if (companion) {
            const updatedCompanion = {
              ...companion,
              stats: {
                ...companion.stats,
                totalInteractionTime: companion.stats.totalInteractionTime + session.duration,
                sessionsCompleted: session.completed 
                  ? companion.stats.sessionsCompleted + 1 
                  : companion.stats.sessionsCompleted,
              }
            };
            
            return {
              user: {
                ...state.user,
                focusStats: updatedStats,
                recentSessions: [newSession, ...state.user.recentSessions].slice(0, 10),
                companions: {
                  ...state.user.companions,
                  [companionId]: updatedCompanion
                }
              },
              pendingUpdates: [
                ...state.pendingUpdates,
                { 
                  type: 'recordFocusSession', 
                  uid, 
                  session 
                }
              ]
            };
          }
          
          return {
            user: {
              ...state.user,
              focusStats: updatedStats,
              recentSessions: [newSession, ...state.user.recentSessions].slice(0, 10),
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'recordFocusSession', 
                uid, 
                session 
              }
            ]
          };
        });
      },
      
      updateSelectedCompanion: (uid, companionId) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              settings: {
                ...state.user.settings,
                selectedCompanion: companionId
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateSettings', 
                uid, 
                updateType: 'selectedCompanion',
                data: companionId
              }
            ]
          };
        });
      },
      
      updateTimerSettings: (uid, settings) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              settings: {
                ...state.user.settings,
                timerSettings: settings
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateSettings', 
                uid, 
                updateType: 'timer',
                data: settings
              }
            ]
          };
        });
      },
      
      updateThemeSettings: (uid, theme) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              settings: {
                ...state.user.settings,
                theme
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateSettings', 
                uid, 
                updateType: 'theme',
                data: theme
              }
            ]
          };
        });
      },
      
      updateCompanionMood: (uid, companionId) => {
        set((state) => {
          if (!state.user || !state.user.companions[companionId]) return state;
          
          // For mood, we'll just mark it for update but not change local state
          // since mood calculation is complex and done on the server
          return {
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateCompanion', 
                uid, 
                companionId,
                updateType: 'mood',
                data: null
              }
            ]
          };
        });
      },
      
      updateCompanionStats: (uid, companionId, interactionTime) => {
        set((state) => {
          if (!state.user || !state.user.companions[companionId]) return state;
          
          const companion = state.user.companions[companionId];
          
          return {
            user: {
              ...state.user,
              companions: {
                ...state.user.companions,
                [companionId]: {
                  ...companion,
                  stats: {
                    ...companion.stats,
                    totalInteractionTime: companion.stats.totalInteractionTime + interactionTime
                  }
                }
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateCompanion', 
                uid, 
                companionId,
                updateType: 'stats',
                data: interactionTime
              }
            ]
          };
        });
      },
      
      updateCompanionAffinity: (uid, companionId, interactionTime) => {
        set((state) => {
          if (!state.user || !state.user.companions[companionId]) return state;
          
          // For affinity, we'll just mark it for update but not change local state
          // since affinity calculation is complex and done on the server
          return {
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'updateCompanion', 
                uid, 
                companionId,
                updateType: 'affinity',
                data: interactionTime
              }
            ]
          };
        });
      },
      
      incrementCompletedGoals: (uid, isChallenge = false) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              goals: {
                ...state.user.goals,
                completedGoals: state.user.goals.completedGoals + 1,
                challengeGoalsCompleted: isChallenge 
                  ? state.user.goals.challengeGoalsCompleted + 1 
                  : state.user.goals.challengeGoalsCompleted
              }
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              { 
                type: 'incrementCompletedGoals', 
                uid, 
                isChallenge 
              }
            ]
          };
        });
      },
      
      syncWithFirebase: async (uid, force = false) => {
        const state = get();
        if (!state.user) return;
        
        // Check if we need to sync (if not forced)
        const now = Date.now();
        if (!force && state.lastSyncTime && (now - state.lastSyncTime < 5 * 60 * 1000)) {
          // Less than 5 minutes since last sync and not forced
          return;
        }
        
        // If there are no pending updates, just update the sync time
        if (state.pendingUpdates.length === 0) {
          set({ lastSyncTime: now });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Process all pending updates
          const updates = [...state.pendingUpdates];
          
          for (const update of updates) {
            switch (update.type) {
              case 'updateFocusGoals':
                await updateFocusGoalsFirebase(
                  update.uid, 
                  update.dailyGoal, 
                  update.weeklyGoal
                );
                break;
                
              case 'recordFocusSession':
                await recordFocusSessionFirebase(
                  update.uid, 
                  update.session
                );
                break;
                
              case 'updateSettings':
                if (update.updateType === 'timer') {
                  // Type guard to ensure we have timer settings
                  const timerSettings = update.data as UserDocument['settings']['timerSettings'];
                  await updateTimerSettingsFirebase(update.uid, timerSettings);
                } else if (update.updateType === 'theme') {
                  // Type guard to ensure we have theme settings
                  const themeSettings = update.data as UserDocument['settings']['theme'];
                  await updateThemeSettingsFirebase(update.uid, themeSettings);
                } else if (update.updateType === 'selectedCompanion') {
                  // Type guard to ensure we have a companion ID
                  const companionId = update.data as CompanionId;
                  await updateSelectedCompanionFirebase(update.uid, companionId);
                }
                break;
                
              case 'updateCompanion':
                if (update.updateType === 'mood') {
                  await updateCompanionMoodFirebase(update.uid, update.companionId);
                } else if (update.updateType === 'stats' && update.data !== null) {
                  await updateCompanionStatsFirebase(
                    update.uid, 
                    update.companionId, 
                    update.data
                  );
                } else if (update.updateType === 'affinity' && update.data !== null) {
                  await updateCompanionAffinityFirebase(
                    update.uid, 
                    update.companionId, 
                    update.data
                  );
                }
                break;
                
              case 'incrementCompletedGoals':
                await incrementCompletedGoalsFirebase(
                  update.uid, 
                  update.isChallenge
                );
                break;
            }
          }
          
          // Clear pending updates after successful sync
          set({ 
            isLoading: false,
            pendingUpdates: [],
            lastSyncTime: now
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Unknown error during sync'
          });
        }
      },
      
      refreshUserData: async (uid) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get fresh data from Firebase
          const userData = await getUserDocument(uid);
          
          if (userData) {
            set({ 
              user: userData,
              isLoading: false
            });
          } else {
            set({ 
              isLoading: false,
              error: 'User data not found'
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Unknown error refreshing user data'
          });
        }
      }
    }),
    {
      name: 'user-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        user: state.user,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Hook for automatic syncing
export function useSyncUserData() {
  const { user, syncWithFirebase } = useUserStore();
  
  // Set up sync on component mount and cleanup on unmount
  React.useEffect(() => {
    if (!user) return;
    
    // Initial sync
    syncWithFirebase(user.base.uid);
    
    // Set up interval for periodic syncing
    const syncInterval = setInterval(() => {
      syncWithFirebase(user.base.uid);
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    // Sync on page unload
    const handleBeforeUnload = () => {
      syncWithFirebase(user.base.uid, true); // Force sync
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, syncWithFirebase]);
} 