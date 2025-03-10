import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { 
  Goal,
  createGoal,
  createCompanionGoal,
  updateGoalProgress,
  completeGoal,
  removeGoal,
  updateGoal as updateGoalFirebase,
  refreshGoals,
  getCompanionGoals,
  assignRandomCompanionGoal
} from '@/lib/firebase/goals';
import { CompanionId } from '@/lib/firebase/companion';
import { useAchievementsStore } from './achievementsStore';
import { FocusSession } from '@/lib/firebase/user';

// Types for pending updates
interface PendingGoalCreate {
  type: 'createGoal';
  uid: string;
  goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed'>;
}

interface PendingCompanionGoalCreate {
  type: 'createCompanionGoal';
  uid: string;
  companionId: CompanionId;
  goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed' | 'companionId'>;
}

interface PendingGoalUpdate {
  type: 'updateGoalProgress';
  uid: string;
  goalId: string;
  minutes: number;
  session?: Partial<FocusSession>;
}

interface PendingGoalComplete {
  type: 'completeGoal';
  uid: string;
  goalId: string;
}

interface PendingGoalRemove {
  type: 'removeGoal';
  uid: string;
  goalId: string;
}

interface PendingGoalEdit {
  type: 'updateGoal';
  uid: string;
  goalId: string;
  updates: {
    title?: string;
    description?: string;
    targetMinutes?: number;
  };
}

type PendingGoalAction = 
  | PendingGoalCreate
  | PendingCompanionGoalCreate
  | PendingGoalUpdate
  | PendingGoalComplete
  | PendingGoalRemove
  | PendingGoalEdit;

interface GoalsState {
  goals: Goal[];
  pendingUpdates: PendingGoalAction[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  unlockedAchievement: string | null;
  recentlyUpdatedGoal: { goal: Goal, action: 'progress' | 'completed' } | null;
  isSyncing: boolean;
  
  // Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (uid: string, goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed'>) => void;
  addCompanionGoal: (uid: string, companionId: CompanionId, goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed' | 'companionId'>) => void;
  updateProgress: (uid: string, goalId: string, minutes: number, session?: Partial<FocusSession>) => void;
  markComplete: (uid: string, goalId: string) => void;
  deleteGoal: (uid: string, goalId: string) => void;
  editGoal: (uid: string, goalId: string, updates: { title?: string; description?: string; targetMinutes?: number; }) => void;
  assignRandom: (uid: string, companionId: CompanionId) => Promise<{goalId: string, title: string}>;
  getForCompanion: (uid: string, companionId: CompanionId) => Promise<Goal[]>;
  refreshAllGoals: (uid: string) => Promise<void>;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  clearUnlockedAchievement: () => void;
  clearRecentlyUpdatedGoal: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      pendingUpdates: [],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      unlockedAchievement: null,
      recentlyUpdatedGoal: null,
      isSyncing: false,
      
      setGoals: (goals) => set({ goals }),
      
      addGoal: (uid, goal) => {
        // Generate a temporary ID for the goal
        const tempId = `temp_goal_${Date.now()}`;
        
        // Create a new goal object with default values for the missing fields
        const newGoal: Goal = {
          ...goal,
          id: tempId,
          createdAt: Timestamp.now(),
          currentMinutes: 0,
          completed: false
        };
        
        // Update local state
        set((state) => ({
          goals: [...state.goals, newGoal],
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'createGoal',
              uid,
              goal
            }
          ]
        }));
      },
      
      addCompanionGoal: (uid, companionId, goal) => {
        // Generate a temporary ID for the goal
        const tempId = `temp_companion_goal_${Date.now()}`;
        
        // Create a new goal object with default values for the missing fields
        const newGoal: Goal = {
          ...goal,
          id: tempId,
          createdAt: Timestamp.now(),
          currentMinutes: 0,
          completed: false,
          companionId
        };
        
        // Update local state
        set((state) => ({
          goals: [...state.goals, newGoal],
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'createCompanionGoal',
              uid,
              companionId,
              goal
            }
          ]
        }));
      },
      
      updateProgress: (uid: string, goalId: string, minutes: number, session?: Partial<FocusSession>) => {
        console.log(`🎯 GoalStore: Updating progress for goal ${goalId} with ${minutes} minutes`);
        
        // Add the update to pending updates
        set(state => {
          const pendingUpdate: PendingGoalUpdate = {
            type: 'updateGoalProgress',
            uid,
            goalId,
            minutes,
            session
          };
          
          const updatedPendingUpdates = [...state.pendingUpdates, pendingUpdate];

          // Also find and update the goal in the local state for immediate feedback
          const updatedGoals = state.goals.map(goal => {
            if (goal.id === goalId) {
              const newCurrentMinutes = goal.currentMinutes + minutes;
              const completed = newCurrentMinutes >= goal.targetMinutes;
              
              console.log(`🎯 GoalStore: Goal "${goal.title}" progress: ${goal.currentMinutes} → ${newCurrentMinutes}/${goal.targetMinutes} minutes (${completed ? 'Completed!' : 'In progress'})`);
              
              const updatedGoal = {
                ...goal,
                currentMinutes: newCurrentMinutes,
                completed
              };
              
              // Set the recently updated goal
              setTimeout(() => {
                if (updatedGoal.completed) {
                  console.log(`🏆 GoalStore: Goal "${updatedGoal.title}" completed!`);
                  set({ recentlyUpdatedGoal: { goal: updatedGoal, action: 'completed' } });
                } else {
                  console.log(`📈 GoalStore: Updated goal "${updatedGoal.title}" progress notification`);
                  set({ recentlyUpdatedGoal: { goal: updatedGoal, action: 'progress' } });
                }
              }, 0);
              
              return updatedGoal;
            }
            return goal;
          });

          return {
            pendingUpdates: updatedPendingUpdates,
            goals: updatedGoals
          };
        });

        // Only try to sync if we're not already syncing
        const state = get();
        if (!state.isSyncing) {
          get().syncWithFirebase(uid);
        } else {
          console.log("🔄 GoalStore: Already syncing, queueing update for next sync");
        }
      },
      
      markComplete: (uid: string, goalId: string) => {
        // Add the update to pending updates
        set(state => {
          const pendingUpdate: PendingGoalComplete = {
            type: 'completeGoal',
            uid,
            goalId
          };
          
          const updatedPendingUpdates = [...state.pendingUpdates, pendingUpdate];

          // Also find and update the goal in the local state for immediate feedback
          const updatedGoals = state.goals.map(goal => {
            if (goal.id === goalId) {
              const updatedGoal = {
                ...goal,
                completed: true
              };
              
              // Set the recently updated goal
              setTimeout(() => {
                set({ recentlyUpdatedGoal: { goal: updatedGoal, action: 'completed' } });
              }, 0);
              
              return updatedGoal;
            }
            return goal;
          });

          return {
            pendingUpdates: updatedPendingUpdates,
            goals: updatedGoals
          };
        });
        
        // Connect with achievements store
        const goals = get().goals;
        const completedGoals = goals.filter(g => g.completed || g.id === goalId);
        const challengeGoals = completedGoals.filter(g => g.type === 'challenge');
        
        // Use the achievements store to check for unlocked achievements
        const achievementsStore = useAchievementsStore.getState();
        achievementsStore.checkGoals(uid, completedGoals, challengeGoals);

        // Try to sync immediately
        get().syncWithFirebase(uid);
      },
      
      deleteGoal: (uid, goalId) => {
        // Update local state
        set((state) => ({
          goals: state.goals.filter(goal => goal.id !== goalId),
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'removeGoal',
              uid,
              goalId
            }
          ]
        }));
      },
      
      editGoal: (uid, goalId, updates) => {
        // Update local state
        set((state) => {
          const updatedGoals = state.goals.map(goal => {
            if (goal.id === goalId) {
              return {
                ...goal,
                title: updates.title ?? goal.title,
                description: updates.description ?? goal.description,
                targetMinutes: updates.targetMinutes ?? goal.targetMinutes
              };
            }
            return goal;
          });
          
          return {
            goals: updatedGoals,
            pendingUpdates: [
              ...state.pendingUpdates,
              {
                type: 'updateGoal',
                uid,
                goalId,
                updates
              }
            ]
          };
        });
      },
      
      // These functions directly call Firebase as they're typically used
      // in response to user actions and need immediate feedback
      assignRandom: async (uid, companionId) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await assignRandomCompanionGoal(uid, companionId);
          
          // Refresh goals after assigning a new one
          const companionGoals = await getCompanionGoals(uid, companionId);
          
          // Update local state with the new goals
          set((state) => {
            // Remove existing companion goals for this companion
            const filteredGoals = state.goals.filter(goal => 
              goal.companionId !== companionId || 
              companionGoals.some(cg => cg.id === goal.id)
            );
            
            // Add the new companion goals
            const newGoals = [
              ...filteredGoals,
              ...companionGoals.filter(cg => 
                !filteredGoals.some(fg => fg.id === cg.id)
              )
            ];
            
            return {
              goals: newGoals,
              isLoading: false
            };
          });
          
          return result;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Error assigning random goal'
          });
          throw error;
        }
      },
      
      getForCompanion: async (uid, companionId) => {
        set({ isLoading: true, error: null });
        
        try {
          const companionGoals = await getCompanionGoals(uid, companionId);
          
          // Update local state with the companion goals
          set((state) => {
            // Remove existing companion goals for this companion
            const filteredGoals = state.goals.filter(goal => 
              goal.companionId !== companionId || 
              companionGoals.some(cg => cg.id === goal.id)
            ); 
            
            // Add the new companion goals
            const newGoals = [
              ...filteredGoals,
              ...companionGoals.filter(cg => 
                !filteredGoals.some(fg => fg.id === cg.id)
              )
            ];
            
            return {
              goals: newGoals,
              isLoading: false
            };
          });
          
          return companionGoals;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Error getting companion goals'
          });
          return [];
        }
      },
      
      refreshAllGoals: async (uid) => {
        set({ isLoading: true, error: null });
        
        try {
          await refreshGoals(uid);
          
          // After refreshing, we need to get the updated goals
          // This would typically be handled by your Firebase listeners
          // For now, we'll just mark that we need a refresh
          set({ 
            isLoading: false,
            lastSyncTime: null // Force a sync on next check
          });
          
          return;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Error refreshing goals'
          });
        }
      },
      
      syncWithFirebase: async (uid: string, force: boolean = false) => {
        const state = get();
        
        // Skip if we've synced recently and there are no pending updates, unless forced
        if (
          !force &&
          state.lastSyncTime &&
          Date.now() - state.lastSyncTime < 5000 && // 5 second throttle
          state.pendingUpdates.length === 0
        ) {
          return;
        }
        
        // Prevent syncing if already syncing
        if (state.isSyncing) {
          console.log("🔄 GoalsStore: Already syncing, skipping additional sync");
          return;
        }
        
        console.log("🔄 GoalsStore: Syncing with Firebase...");
        console.log(`🔄 GoalsStore: ${state.pendingUpdates.length} pending updates to process`);
        
        // Set loading and syncing flags
        set({ isLoading: true, isSyncing: true });
        
        try {
          // Make a copy of the pending updates to process
          const updatesToProcess = [...state.pendingUpdates];
          
          // Clear pending updates immediately to prevent re-processing
          set({ pendingUpdates: [] });
          
          // Process pending updates
          if (updatesToProcess.length > 0) {
            for (const update of updatesToProcess) {
              console.log(`🔄 GoalsStore: Processing update of type ${update.type}`);
              
              try {
                switch (update.type) {
                  case 'createGoal':
                    await createGoal(update.uid, update.goal);
                    break;
                    
                  case 'createCompanionGoal':
                    await createCompanionGoal(
                      update.uid, 
                      update.companionId, 
                      update.goal
                    );
                    break;
                    
                  case 'updateGoalProgress':
                    await updateGoalProgress(
                      update.uid, 
                      update.goalId, 
                      update.minutes,
                      update.session
                    );
                    break;
                    
                  case 'completeGoal':
                    await completeGoal(update.uid, update.goalId);
                    break;
                    
                  case 'removeGoal':
                    await removeGoal(update.uid, update.goalId);
                    break;
                    
                  case 'updateGoal':
                    await updateGoalFirebase(
                      update.uid, 
                      update.goalId, 
                      update.updates
                    );
                    break;
                }
              } catch (updateError) {
                console.error(`❌ GoalsStore: Error processing update ${update.type}:`, updateError);
                // Continue with other updates rather than failing everything
              }
            }
          }
          
          // Set last sync time and clear loading/syncing flags
          set({ 
            isLoading: false,
            isSyncing: false,
            lastSyncTime: Date.now()
          });
          
          console.log("✅ GoalsStore: Sync with Firebase complete");
          
          // Check if new updates were queued during processing and trigger another sync if needed
          const newState = get();
          if (newState.pendingUpdates.length > 0) {
            console.log(`🔄 GoalsStore: ${newState.pendingUpdates.length} updates were queued during sync, processing...`);
            // Small delay to allow state to settle
            setTimeout(() => {
              get().syncWithFirebase(uid, false);
            }, 50);
          }
        } catch (error) {
          console.error("❌ GoalsStore: Error syncing with Firebase:", error);
          set({ 
            isLoading: false,
            isSyncing: false,
            error: error instanceof Error ? error.message : 'Unknown error syncing with Firebase'
          });
        }
      },
      
      clearUnlockedAchievement: () => {
        set({ unlockedAchievement: null });
      },
      
      clearRecentlyUpdatedGoal: () => {
        set({ recentlyUpdatedGoal: null });
      }
    }),
    {
      name: 'goals-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        goals: state.goals,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Hook for automatic syncing
export function useSyncGoalsData() {
  const { goals, syncWithFirebase } = useGoalsStore();
  
  // Set up sync on component mount and cleanup on unmount
  React.useEffect(() => {
    if (goals.length === 0) return;
    
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
  }, [goals, syncWithFirebase]);
} 