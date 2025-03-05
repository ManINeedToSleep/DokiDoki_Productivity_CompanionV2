import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
import { 
  Achievement,
  unlockAchievement,
  applyAchievementReward,
  checkFocusAchievements,
  checkStreakAchievements,
  checkCompanionAchievements,
  checkGoalAchievements,
  checkTimeBasedAchievements,
  checkAllAchievements,
  checkSessionAchievements
} from '@/lib/firebase/achievements';
import { CompanionId } from '@/lib/firebase/companion';
import { Goal } from '@/lib/firebase/goals';
import { useAuthStore } from '@/lib/stores/authStore';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for pending achievement checks
interface PendingAchievementCheck {
  type: 'checkAchievements';
  uid: string;
  checkType: 'focus' | 'streak' | 'companion' | 'goal' | 'time' | 'all' | 'session';
  data: {
    totalMinutes?: number;
    sessionMinutes?: number;
    totalSessions?: number;
    currentStreak?: number;
    companionId?: CompanionId;
    affinityLevel?: number;
    allCompanionsData?: Record<CompanionId, { affinityLevel: number }>;
    completedGoals?: Goal[];
    challengeGoals?: Goal[];
    sessionStartTime?: Date;
    stats?: {
      totalFocusTime: number;
      weekStreak: number;
      longestStreak: number;
      completedGoals: number;
      totalSessions: number;
      challengeGoalsCompleted: number;
    };
  };
}

interface PendingAchievementUnlock {
  type: 'unlockAchievement';
  uid: string;
  achievementId: string;
}

interface PendingRewardApply {
  type: 'applyReward';
  uid: string;
  achievementId: string;
}

type PendingAchievementAction = 
  | PendingAchievementCheck
  | PendingAchievementUnlock
  | PendingRewardApply;

interface AchievementsState {
  achievements: Achievement[];
  unlockedAchievements: string[]; // IDs of unlocked achievements
  pendingUpdates: PendingAchievementAction[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  
  // Actions
  setAchievements: (achievements: Achievement[]) => void;
  setUnlockedAchievements: (achievementIds: string[]) => void;
  resetStore: () => void;
  checkFocus: (uid: string, totalMinutes: number, sessionMinutes: number, totalSessions: number) => void;
  checkStreak: (uid: string, currentStreak: number) => void;
  checkCompanion: (
    uid: string, 
    companionId: CompanionId, 
    affinityLevel: number, 
    allCompanionsData?: Record<CompanionId, { affinityLevel: number }>
  ) => void;
  checkGoals: (uid: string, completedGoals: Goal[], challengeGoals: Goal[]) => void;
  checkTimeBased: (uid: string, sessionStartTime: Date, sessionMinutes: number) => void;
  checkAll: (uid: string, stats: {
    totalFocusTime: number;
    weekStreak: number;
    longestStreak: number;
    completedGoals: number;
    totalSessions: number;
    challengeGoalsCompleted: number;
  }) => void;
  checkSession: (uid: string, sessionSeconds: number, sessionStartTime: Date) => void;
  unlockAchievement: (uid: string, achievementId: string) => void;
  applyReward: (uid: string, achievementId: string) => void;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [],
      unlockedAchievements: [],
      pendingUpdates: [],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      
      setAchievements: (achievements) => set({ achievements }),
      
      setUnlockedAchievements: (achievementIds) => set({ unlockedAchievements: achievementIds }),
      
      resetStore: () => set({
        achievements: [],
        unlockedAchievements: [],
        pendingUpdates: [],
        isLoading: false,
        error: null,
        lastSyncTime: null
      }),
      
      checkFocus: (uid, totalMinutes, sessionMinutes, totalSessions) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'focus',
              data: {
                totalMinutes,
                sessionMinutes,
                totalSessions
              }
            }
          ]
        }));
      },
      
      checkStreak: (uid, currentStreak) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'streak',
              data: {
                currentStreak
              }
            }
          ]
        }));
      },
      
      checkCompanion: (uid, companionId, affinityLevel, allCompanionsData) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'companion',
              data: {
                companionId,
                affinityLevel,
                allCompanionsData
              }
            }
          ]
        }));
      },
      
      checkGoals: (uid, completedGoals, challengeGoals) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'goal',
              data: {
                completedGoals,
                challengeGoals
              }
            }
          ]
        }));
      },
      
      checkTimeBased: (uid, sessionStartTime, sessionMinutes) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'time',
              data: {
                sessionStartTime,
                sessionMinutes
              }
            }
          ]
        }));
      },
      
      checkAll: (uid, stats) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'all',
              data: {
                stats
              }
            }
          ]
        }));
      },
      
      checkSession: (uid, sessionSeconds, sessionStartTime) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'session',
              data: {
                sessionMinutes: sessionSeconds / 60,
                sessionStartTime
              }
            }
          ]
        }));
      },
      
      unlockAchievement: (uid, achievementId) => {
        // Update local state to show achievement as unlocked
        set((state) => {
          if (state.unlockedAchievements.includes(achievementId)) {
            return state; // Already unlocked
          }
          
          return {
            unlockedAchievements: [...state.unlockedAchievements, achievementId],
            pendingUpdates: [
              ...state.pendingUpdates,
              {
                type: 'unlockAchievement',
                uid,
                achievementId
              }
            ]
          };
        });
      },
      
      applyReward: (uid, achievementId) => {
        set((state) => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'applyReward',
              uid,
              achievementId
            }
          ]
        }));
      },
      
      syncWithFirebase: async (uid, force = false) => {
        const state = get();
        
        // Check if we need to sync (if not forced)
        const now = Date.now();
        if (!force && state.lastSyncTime && (now - state.lastSyncTime < 5 * 60 * 1000)) {
          // Less than 5 minutes since last sync and not forced
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // First, fetch the user's achievement data from Firebase
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData?.achievements && Array.isArray(userData.achievements)) {
              // Extract unlocked achievement IDs from Firebase data
              const unlockedFromFirebase = userData.achievements.map((a: any) => a.id);
              
              // Update the unlocked achievements in the store
              set({ unlockedAchievements: unlockedFromFirebase });
              
              console.log('Synced achievements from Firebase:', unlockedFromFirebase.length);
            }
          }
          
          // Process all pending updates
          if (state.pendingUpdates.length > 0) {
            console.log(`Processing ${state.pendingUpdates.length} pending achievement updates`);
            const updates = [...state.pendingUpdates];
            
            for (const update of updates) {
              switch (update.type) {
                case 'checkAchievements':
                  switch (update.checkType) {
                    case 'focus':
                      if (update.data.totalMinutes !== undefined && 
                          update.data.sessionMinutes !== undefined && 
                          update.data.totalSessions !== undefined) {
                        await checkFocusAchievements(
                          update.uid,
                          update.data.totalMinutes,
                          update.data.sessionMinutes,
                          update.data.totalSessions
                        );
                      }
                      break;
                      
                    case 'streak':
                      if (update.data.currentStreak !== undefined) {
                        await checkStreakAchievements(
                          update.uid,
                          update.data.currentStreak
                        );
                      }
                      break;
                      
                    case 'companion':
                      if (update.data.companionId !== undefined && 
                          update.data.affinityLevel !== undefined) {
                        await checkCompanionAchievements(
                          update.uid,
                          update.data.companionId,
                          update.data.affinityLevel,
                          update.data.allCompanionsData
                        );
                      }
                      break;
                      
                    case 'goal':
                      if (update.data.completedGoals !== undefined && 
                          update.data.challengeGoals !== undefined) {
                        await checkGoalAchievements(
                          update.uid,
                          update.data.completedGoals,
                          update.data.challengeGoals
                        );
                      }
                      break;
                      
                    case 'time':
                      if (update.data.sessionStartTime !== undefined && 
                          update.data.sessionMinutes !== undefined) {
                        await checkTimeBasedAchievements(
                          update.uid,
                          update.data.sessionStartTime,
                          update.data.sessionMinutes
                        );
                      }
                      break;
                      
                    case 'all':
                      if (update.data.stats !== undefined) {
                        await checkAllAchievements(
                          update.uid,
                          update.data.stats
                        );
                      }
                      break;
                      
                    case 'session':
                      if (update.data.sessionMinutes !== undefined && 
                          update.data.sessionStartTime !== undefined) {
                        await checkSessionAchievements(
                          update.uid,
                          update.data.sessionMinutes * 60, // Convert back to seconds
                          update.data.sessionStartTime
                        );
                      }
                      break;
                  }
                  break;
                  
                case 'unlockAchievement':
                  await unlockAchievement(update.uid, update.achievementId);
                  break;
                  
                case 'applyReward':
                  await applyAchievementReward(update.uid, update.achievementId);
                  break;
              }
            }
            
            // Clear the processed updates
            set({ pendingUpdates: [] });
          }
          
          set({ lastSyncTime: now, isLoading: false });
        } catch (error) {
          console.error('Error syncing with Firebase:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      }
    }),
    {
      name: 'achievements-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        achievements: state.achievements,
        unlockedAchievements: state.unlockedAchievements,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Hook for automatic syncing
export function useSyncAchievementsData() {
  const { syncWithFirebase } = useAchievementsStore();
  const { user } = useAuthStore();
  
  // Set up sync on component mount and cleanup on unmount
  React.useEffect(() => {
    // We need a uid to sync with Firebase
    if (!user || !user.uid) return;
    
    const uid = user.uid;
    
    // Initial sync
    syncWithFirebase(uid);
    
    // Set up interval for periodic syncing
    const syncInterval = setInterval(() => {
      syncWithFirebase(uid);
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    // Sync on page unload
    const handleBeforeUnload = () => {
      syncWithFirebase(uid, true); // Force sync
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncWithFirebase, user]);
} 