import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { 
  CompanionData, 
  CompanionId, 
  CompanionMood,
  DialogueEvent,
  CompanionUnlockable,
  getCompanionData,
  updateCompanionAfterSession,
  refreshCompanionMood,
  checkForDialogueEvents,
  getCompanionGreeting,
  getSessionStartMessage,
  getSessionCompleteMessage,
  giveGiftToCompanion,
  checkForUnlocks,
  getInactivityReminder,
  updateCompanionAfterGoalComplete,
  getAllCompanionsData
} from '@/lib/firebase/companion';

interface PendingCompanionUpdate {
  type: 'updateAfterSession' | 'updateAfterGoal' | 'giveGift';
  uid: string;
  companionId: CompanionId;
  data: {
    sessionDuration?: number;
    sessionCompleted?: boolean;
    isCompanionGoal?: boolean;
    giftId?: string;
  };
}

interface CompanionState {
  companions: Record<CompanionId, CompanionData> | null;
  pendingUpdates: PendingCompanionUpdate[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  
  // Actions
  setCompanions: (companions: Record<CompanionId, CompanionData> | null) => void;
  updateAfterSession: (
    uid: string, 
    companionId: CompanionId, 
    sessionDuration: number, 
    sessionCompleted: boolean
  ) => void;
  updateAfterGoalComplete: (
    uid: string, 
    companionId: CompanionId, 
    isCompanionGoal?: boolean
  ) => void;
  giveGift: (
    uid: string, 
    companionId: CompanionId, 
    giftId: string
  ) => void;
  refreshMood: (uid: string, companionId: CompanionId) => Promise<CompanionMood>;
  checkDialogueEvents: (uid: string, companionId: CompanionId) => Promise<DialogueEvent | null>;
  getGreeting: (uid: string, companionId: CompanionId) => Promise<string>;
  getSessionStart: (uid: string, companionId: CompanionId) => Promise<string>;
  getSessionComplete: (uid: string, companionId: CompanionId) => Promise<string>;
  checkUnlocks: (uid: string, companionId: CompanionId) => Promise<CompanionUnlockable[]>;
  getReminder: (uid: string, companionId: CompanionId) => Promise<string | null>;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  refreshCompanionData: (uid: string, companionId?: CompanionId) => Promise<void>;
}

export const useCompanionStore = create<CompanionState>()(
  persist(
    (set, get) => ({
      companions: null,
      pendingUpdates: [],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      
      setCompanions: (companions) => set({ companions }),
      
      updateAfterSession: (uid, companionId, sessionDuration, sessionCompleted) => {
        set((state) => {
          if (!state.companions || !state.companions[companionId]) return state;
          
          const companion = state.companions[companionId];
          
          // Update local state
          const updatedCompanion = {
            ...companion,
            stats: {
              ...companion.stats,
              totalInteractionTime: companion.stats.totalInteractionTime + sessionDuration,
              sessionsCompleted: sessionCompleted 
                ? companion.stats.sessionsCompleted + 1 
                : companion.stats.sessionsCompleted,
            },
            lastInteraction: Timestamp.now()
          };
          
          return {
            companions: {
              ...state.companions,
              [companionId]: updatedCompanion
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              {
                type: 'updateAfterSession',
                uid,
                companionId,
                data: {
                  sessionDuration,
                  sessionCompleted
                }
              }
            ]
          };
        });
      },
      
      updateAfterGoalComplete: (uid, companionId, isCompanionGoal = false) => {
        set((state) => {
          if (!state.companions || !state.companions[companionId]) return state;
          
          const companion = state.companions[companionId];
          
          // Update local state
          const updatedCompanion = {
            ...companion,
            stats: {
              ...companion.stats,
              goalsCompleted: companion.stats.goalsCompleted + 1
            },
            lastInteraction: Timestamp.now()
          };
          
          return {
            companions: {
              ...state.companions,
              [companionId]: updatedCompanion
            },
            pendingUpdates: [
              ...state.pendingUpdates,
              {
                type: 'updateAfterGoal',
                uid,
                companionId,
                data: {
                  isCompanionGoal
                }
              }
            ]
          };
        });
      },
      
      giveGift: (uid, companionId, giftId) => {
        set((state) => {
          if (!state.companions || !state.companions[companionId]) return state;
          
          // For gifts, we'll just queue the update but not change local state
          // since the gift effects are calculated on the server
          return {
            pendingUpdates: [
              ...state.pendingUpdates,
              {
                type: 'giveGift',
                uid,
                companionId,
                data: {
                  giftId
                }
              }
            ]
          };
        });
      },
      
      // These functions directly call Firebase as they're typically used
      // in response to user actions and need immediate feedback
      refreshMood: async (uid, companionId) => {
        try {
          const mood = await refreshCompanionMood(uid, companionId);
          
          // Update local state with the new mood
          set((state) => {
            if (!state.companions || !state.companions[companionId]) return state;
            
            return {
              companions: {
                ...state.companions,
                [companionId]: {
                  ...state.companions[companionId],
                  mood
                }
              }
            };
          });
          
          return mood;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error refreshing mood'
          });
          return 'neutral' as CompanionMood; // Default fallback
        }
      },
      
      checkDialogueEvents: async (uid, companionId) => {
        try {
          return await checkForDialogueEvents(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error checking dialogue events'
          });
          return null;
        }
      },
      
      getGreeting: async (uid, companionId) => {
        try {
          return await getCompanionGreeting(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error getting greeting'
          });
          return "Hello!"; // Default fallback
        }
      },
      
      getSessionStart: async (uid, companionId) => {
        try {
          return await getSessionStartMessage(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error getting session start message'
          });
          return "Let's focus!"; // Default fallback
        }
      },
      
      getSessionComplete: async (uid, companionId) => {
        try {
          return await getSessionCompleteMessage(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error getting session complete message'
          });
          return "Great job!"; // Default fallback
        }
      },
      
      checkUnlocks: async (uid, companionId) => {
        try {
          return await checkForUnlocks(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error checking unlocks'
          });
          return [];
        }
      },
      
      getReminder: async (uid, companionId) => {
        try {
          return await getInactivityReminder(uid, companionId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error getting reminder'
          });
          return null;
        }
      },
      
      syncWithFirebase: async (uid, force = false) => {
        const state = get();
        
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
              case 'updateAfterSession':
                if (update.data.sessionDuration !== undefined && update.data.sessionCompleted !== undefined) {
                  await updateCompanionAfterSession(
                    update.uid,
                    update.companionId,
                    update.data.sessionDuration,
                    update.data.sessionCompleted
                  );
                }
                break;
                
              case 'updateAfterGoal':
                await updateCompanionAfterGoalComplete(
                  update.uid,
                  update.companionId,
                  update.data.isCompanionGoal
                );
                break;
                
              case 'giveGift':
                if (update.data.giftId) {
                  await giveGiftToCompanion(
                    update.uid,
                    update.companionId,
                    update.data.giftId
                  );
                }
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
      
      refreshCompanionData: async (uid, companionId) => {
        set({ isLoading: true, error: null });
        
        try {
          if (companionId) {
            // Refresh a single companion
            const companionData = await getCompanionData(uid, companionId);
            
            if (companionData) {
              set((state) => {
                const updatedCompanions = state.companions ? {
                  ...state.companions,
                  [companionId]: companionData
                } : { [companionId]: companionData } as Record<CompanionId, CompanionData>;
                
                return {
                  companions: updatedCompanions,
                  isLoading: false
                };
              });
            } else {
              set({ 
                isLoading: false,
                error: 'Companion data not found'
              });
            }
          } else {
            // Refresh all companions
            const allCompanions = await getAllCompanionsData(uid);
            
            set({ 
              companions: allCompanions,
              isLoading: false
            });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Unknown error refreshing companion data'
          });
        }
      }
    }),
    {
      name: 'companion-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        companions: state.companions,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Hook for automatic syncing
export function useSyncCompanionData() {
  const { companions, syncWithFirebase } = useCompanionStore();
  
  // Set up sync on component mount and cleanup on unmount
  React.useEffect(() => {
    if (!companions) return;
    
    // Get the first companion's uid (they all have the same uid)
    const firstCompanion = Object.values(companions)[0];
    if (!firstCompanion) return;
    
    // Extract uid from the companion data structure
    // This assumes the uid is stored somewhere in the companion data
    // Adjust as needed based on your actual data structure
    const uid = firstCompanion.id.split('_')[0]; // Assuming format like "uid_companionId"
    
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
  }, [companions, syncWithFirebase]);
} 