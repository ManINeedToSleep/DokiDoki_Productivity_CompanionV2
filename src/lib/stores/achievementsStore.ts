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
import { doc, getDoc } from 'firebase/firestore';
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
  recentlyUnlockedAchievement: Achievement | null;
  
  // Actions
  setAchievements: (achievements: Achievement[]) => void;
  setUnlockedAchievements: (achievementIds: string[]) => void;
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
  checkSession: (uid: string, sessionMinutes: number, sessionStartTime: Date) => void;
  unlockAchievement: (uid: string, achievementId: string) => void;
  applyReward: (uid: string, achievementId: string) => void;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  clearRecentlyUnlockedAchievement: () => void;
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
      recentlyUnlockedAchievement: null,
      
      setAchievements: (achievements) => set({ achievements }),
      
      setUnlockedAchievements: (achievementIds) => set({ unlockedAchievements: achievementIds }),
      
      checkFocus: (uid, totalMinutes, sessionMinutes, totalSessions) => {
        console.log(`🏆 AchievementsStore: Checking focus achievements - Total: ${totalMinutes} min, Session: ${sessionMinutes} min, Sessions: ${totalSessions}`);
        
        // Add to pending updates
        set(state => ({
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
        
        // Sync with Firebase
        get().syncWithFirebase(uid);
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
      
      checkSession: (uid, sessionMinutes, sessionStartTime) => {
        console.log(`🏆 AchievementsStore: Checking session achievements - Duration: ${sessionMinutes} min, Start: ${sessionStartTime}`);
        
        // Add to pending updates
        set(state => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'checkAchievements',
              uid,
              checkType: 'session',
              data: {
                sessionMinutes,
                sessionStartTime
              }
            }
          ]
        }));
        
        // Sync with Firebase
        get().syncWithFirebase(uid);
      },
      
      unlockAchievement: (uid, achievementId) => {
        // Check if achievement is already unlocked
        const { unlockedAchievements, achievements } = get();
        if (unlockedAchievements.includes(achievementId)) {
          return;
        }
        
        // Find the achievement to show it in UI
        const achievementToUnlock = achievements.find(a => a.id === achievementId);
        if (achievementToUnlock) {
          console.log(`🏆 AchievementsStore: Unlocked achievement "${achievementToUnlock.title}"`);
          set({ recentlyUnlockedAchievement: achievementToUnlock });
        }
        
        // Add to pending updates
        set(state => ({
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'unlockAchievement',
              uid,
              achievementId
            }
          ],
          unlockedAchievements: [...state.unlockedAchievements, achievementId]
        }));
        
        // Sync with Firebase
        get().syncWithFirebase(uid);
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
          console.log(`🏆 AchievementsStore: Skipping sync, last sync was ${(now - state.lastSyncTime) / 1000} seconds ago`);
          return;
        }
        
        console.log(`🔄 AchievementsStore: Syncing with Firebase (force=${force})`);
        
        // Load achievements from Firebase
        const userAchievements = await loadAchievementsFromFirebase(uid);
        if (userAchievements.length > 0) {
          const unlockedIds = userAchievements.map((a: { id: string }) => a.id);
          console.log(`🏆 Setting ${unlockedIds.length} unlocked achievements in store`);
          set({ unlockedAchievements: unlockedIds });
        } else {
          console.log(`ℹ️ No achievements found in Firebase, keeping current state`);
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
                      console.log(`🏆 AchievementsStore: Processing session achievement check - Using ${update.data.sessionMinutes} minutes`);
                      await checkSessionAchievements(
                        update.uid,
                        update.data.sessionMinutes,
                        update.data.sessionStartTime
                      );
                    }
                    break;
                }
                break;
                
              case 'unlockAchievement':
                await unlockAchievement(
                  update.uid,
                  update.achievementId
                );
                break;
                
              case 'applyReward':
                await applyAchievementReward(
                  update.uid,
                  update.achievementId
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
      
      clearRecentlyUnlockedAchievement: () => {
        set({ recentlyUnlockedAchievement: null });
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
  
  // Set up sync on component mount and cleanup on unmount
  React.useEffect(() => {
    // We need a uid to sync with Firebase
    // This would typically come from your auth context
    // For now, we'll assume it's available in the component using this hook
    const uid = localStorage.getItem('userId');
    if (!uid) return;
    
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
  }, [syncWithFirebase]);
}

// Add a new function to load achievements from Firebase
const loadAchievementsFromFirebase = async (uid: string) => {
  console.log(`🏆 Loading achievements from Firebase for user ${uid}`);
  
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`⚠️ Cannot load achievements: User document does not exist`);
      return [];
    }
    
    const userData = userDoc.data();
    const achievements = userData.achievements || [];
    
    // Log more detailed information about loaded achievements
    console.log(`✅ Loaded ${achievements.length} achievements from Firebase`);
    if (achievements.length > 0) {
      console.log(`🏆 Unlocked achievements:`, achievements.map((a: { id: string }) => a.id));
      
      // Log each achievement with its details
      achievements.forEach((achievement: { id: string, unlockedAt: { seconds: number, nanoseconds: number } }) => {
        console.log(`  - ${achievement.id} (unlocked at: ${achievement.unlockedAt ? new Date(achievement.unlockedAt.seconds * 1000).toLocaleString() : 'unknown'})`);
      });
    } else {
      console.log(`ℹ️ No achievements found in Firebase`);
    }
    
    return achievements;
  } catch (error) {
    console.error(`❌ Error loading achievements from Firebase:`, error);
    return [];
  }
}; 