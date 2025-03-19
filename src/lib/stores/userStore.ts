import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect } from 'react';
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
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

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
  const lastSessionDate = currentStats.lastSessionDate?.toDate() || null;
  const lastSessionTime = lastSessionDate?.getTime() || 0;
  const isNewDay = lastSessionTime < today;
  
  console.log(`📊 Calculating stats - Last session: ${lastSessionDate}, Is new day: ${isNewDay}`);
  
  // Calculate streaks
  let dailyStreak = currentStats.dailyStreak;
  let weekStreak = currentStats.weekStreak;
  
  // Check if this is the user's first session ever (no last session date)
  const isFirstSession = !lastSessionDate;
  
  if (isFirstSession) {
    // First ever session - start the streaks at 1
    dailyStreak = 1;
    console.log(`📊 First session ever detected - Setting daily streak to 1`);
  } else if (isNewDay) {
    // If it's a new day, increment the daily streak
    dailyStreak += 1;
    console.log(`📊 New day detected - Incrementing daily streak: ${currentStats.dailyStreak} → ${dailyStreak}`);
    
    // Check if this completes a calendar week
    // We need to check if we've completed a full calendar week (Sunday to Saturday)
    // First, check if there was a last session date
    if (lastSessionDate) {
      // Get the week number for last session and current date
      const getWeekNumber = (d: Date) => {
        // Copy date to avoid modifying the original
        const date = new Date(d.getTime());
        // Set to the nearest Thursday (to handle year boundaries correctly)
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // Get first day of year
        const week1 = new Date(date.getFullYear(), 0, 4);
        // Return week number
        return Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + 
                          (week1.getDay() + 6) % 7) / 7) + 1;
      };
      
      const lastWeek = getWeekNumber(lastSessionDate);
      const currentWeek = getWeekNumber(now);
      
      // Different week and we're not just starting fresh (dailyStreak > 1)
      if (currentWeek !== lastWeek && dailyStreak > 1) {
        weekStreak += 1;
        console.log(`📊 New week detected (Week ${lastWeek} → Week ${currentWeek}) - Incrementing week streak: ${currentStats.weekStreak} → ${weekStreak}`);
      }
    }
  }
  
  // Calculate today's focus time
  const todaysFocusTime = isNewDay 
    ? sessionDuration 
    : currentStats.todaysFocusTime + sessionDuration;
  
  // Calculate weekly focus time - reset if it's a new week
  let weeklyFocusTime = currentStats.weeklyFocusTime;
  
  // If it's a new week, reset weekly focus time
  const now_day = now.getDay(); // 0 = Sunday
  const lastDay = lastSessionDate ? lastSessionDate.getDay() : -1;
  
  // Reset weekly focus time if we've crossed from Saturday to Sunday (end of week to start of new week)
  if (lastDay === 6 && now_day === 0) {
    console.log(`📊 End of week detected - Resetting weekly focus time (${currentStats.weeklyFocusTime}s → 0s)`);
    weeklyFocusTime = sessionDuration; // Start with this session's time
  } else {
    weeklyFocusTime += sessionDuration; // Add to existing weekly time
  }
  
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
    longestStreak: Math.max(currentStats.longestStreak, dailyStreak),
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
        console.log("🔄 UserStore: Recording focus session to store", session);
        // Update local state immediately
        set((state) => {
          if (!state.user) {
            console.error("❌ UserStore: No user found in state, cannot record session");
            
            // Attempt to load user data first, then record the session
            console.log("🔄 UserStore: Attempting to load user data before recording session");
            
            // Use setTimeout to avoid state update during rendering
            setTimeout(async () => {
              try {
                console.log("🔄 UserStore: Fetching user document from Firebase...");
                set({ isLoading: true });
                const userData = await getUserDocument(uid);
                
                if (userData) {
                  console.log("✅ UserStore: User data loaded successfully from Firebase");
                  set({ 
                    user: userData,
                    isLoading: false
                  });
                  
                  // Now record the session with the loaded user
                  console.log("🔄 UserStore: Now recording session with loaded user data");
                  get().recordFocusSession(uid, session);
                } else {
                  console.error("❌ UserStore: Failed to load user data, user document not found");
                  set({ isLoading: false });
                }
              } catch (error) {
                console.error("❌ UserStore: Error loading user data:", error);
                set({ isLoading: false });
              }
            }, 0);
            
            return state;
          }
          
          // Generate a temporary ID for the session
          const newSession = {
            ...session,
            id: `temp_session_${Date.now()}`,
          } as FocusSession;
          
          console.log("📊 UserStore: Calculating updated stats based on session");
          // Calculate new stats based on the session
          const updatedStats = calculateUpdatedStats(state.user.focusStats, newSession);
          console.log("📊 UserStore: Current stats:", state.user.focusStats);
          console.log("📊 UserStore: Updated stats:", updatedStats);
          
          // Update companion stats locally
          const companionId = session.companionId;
          const companion = state.user.companions[companionId];
          
          if (companion) {
            console.log(`🧠 UserStore: Updating stats for companion ${companionId}`);
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
          
          console.log("🔄 UserStore: Companion not found, updating only user stats");
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
        
        // Trigger sync to Firebase
        console.log("🔄 UserStore: Triggering sync to Firebase after recording session");
        get().syncWithFirebase(uid);
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
          console.log(`🔄 UserStore: Skipping sync, last sync was ${Math.round((now - state.lastSyncTime) / 1000)} seconds ago`);
          return;
        }
        
        // Check if we need to reset today's focus time
        // This ensures the time resets even if the user comes back after a day without completing a session
        const lastSessionDate = state.user.focusStats.lastSessionDate;
        let lastSessionDateTime: Date | null = null;
        
        // Handle different types that lastSessionDate might be
        if (lastSessionDate) {
          if (typeof lastSessionDate.toDate === 'function') {
            // It's a Firestore Timestamp
            lastSessionDateTime = lastSessionDate.toDate();
          } else if (lastSessionDate instanceof Date) {
            // It's already a Date object
            lastSessionDateTime = lastSessionDate;
          } else if (typeof lastSessionDate === 'number') {
            // It's a timestamp in milliseconds
            lastSessionDateTime = new Date(lastSessionDate);
          } else if (lastSessionDate.seconds !== undefined && lastSessionDate.nanoseconds !== undefined) {
            // It's a Firestore Timestamp-like object with seconds and nanoseconds
            lastSessionDateTime = new Date(lastSessionDate.seconds * 1000);
          } else {
            // Try to convert from other formats or log the issue
            console.warn(`⚠️ Unknown lastSessionDate format:`, lastSessionDate);
            try {
              // Use toString() to ensure we're passing a string to the Date constructor
              lastSessionDateTime = new Date(lastSessionDate.toString());
            } catch (e) {
              console.error(`❌ Could not convert lastSessionDate to Date:`, e);
            }
          }
        }
        
        if (lastSessionDateTime) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          
          const lastSessionDay = new Date(lastSessionDateTime);
          lastSessionDay.setHours(0, 0, 0, 0); // Start of the day of last session
          
          // If the last session was on a different day and todaysFocusTime is not zero, reset it
          if (today.getTime() !== lastSessionDay.getTime() && state.user.focusStats.todaysFocusTime > 0) {
            console.log(`⏰ UserStore: New day detected, resetting today's focus time from ${state.user.focusStats.todaysFocusTime}s to 0s`);
            
            // Update local state
            set({
              user: {
                ...state.user,
                focusStats: {
                  ...state.user.focusStats,
                  todaysFocusTime: 0
                }
              }
            });
            
            // Also update in Firebase directly
            try {
              const userRef = doc(db, 'users', uid);
              await updateDoc(userRef, {
                'focusStats.todaysFocusTime': 0
              });
              console.log(`✅ UserStore: Reset today's focus time in Firebase`);
            } catch (error) {
              console.error("❌ UserStore: Error resetting today's focus time:", error);
            }
          }
        }
        
        // If there are no pending updates, just update the sync time
        if (state.pendingUpdates.length === 0) {
          console.log("🔄 UserStore: No pending updates, updating sync time only");
          set({ lastSyncTime: now });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Process all pending updates
          const updates = [...state.pendingUpdates];
          
          for (const update of updates) {
            console.log(`🔄 UserStore: Processing update of type ${update.type}`);
            
            switch (update.type) {
              case 'updateFocusGoals':
                await updateFocusGoalsFirebase(
                  update.uid, 
                  update.dailyGoal, 
                  update.weeklyGoal
                );
                break;
                
              case 'recordFocusSession':
                console.log("💾 UserStore: Recording focus session to Firebase", update.session);
                await recordFocusSessionFirebase(
                  update.uid, 
                  update.session
                );
                console.log("✅ UserStore: Focus session recorded in Firebase");
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

// This is in the useUserData hook
export function useUserData() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);
  const syncWithFirebase = useUserStore((state) => state.syncWithFirebase);
  const refreshUserData = useUserStore((state) => state.refreshUserData);

  // Subscribe to auth state changes and sync user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log(`🔑 UserStore: Auth state changed - user ${user.uid} logged in, syncing data`);
        
        // Check token status
        try {
          const tokenResult = await user.getIdTokenResult();
          const expTime = new Date(tokenResult.expirationTime);
          const timeUntilExp = expTime.getTime() - Date.now();
          console.log(`🔑 UserStore: Token expires in ${Math.round(timeUntilExp/60000)} minutes`);
          
          // Force refresh token if it's close to expiring (less than 5 minutes)
          if (timeUntilExp < 5 * 60 * 1000) {
            console.log('⚠️ UserStore: Token expiring soon, forcing refresh before data sync');
            await user.getIdToken(true);
            console.log('✅ UserStore: Token force-refreshed successfully');
          }
        } catch (tokenErr) {
          console.error('❌ UserStore: Error checking token:', tokenErr);
        }
        
        await syncWithFirebase(user.uid);
      } else {
        console.log('🔑 UserStore: Auth state changed - user logged out');
      }
    });

    return () => unsubscribe();
  }, [syncWithFirebase]);

  return { userData: user, loading: isLoading, error, refreshUserData };
} 