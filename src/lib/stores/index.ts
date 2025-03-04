// Export all stores
export * from './userStore';
export * from './companionStore';
export * from './goalsStore';
export * from './achievementsStore';
export * from './authStore';

// Export a combined hook for syncing all data
import { useEffect } from 'react';
import { useSyncUserData } from './userStore';
import { useSyncCompanionData } from './companionStore';
import { useSyncGoalsData } from './goalsStore';
import { useSyncAchievementsData } from './achievementsStore';
import { useAuthStateListener } from './authStore';

export function useSyncAllData() {
  // Use all the individual sync hooks
  useSyncUserData();
  useSyncCompanionData();
  useSyncGoalsData();
  useSyncAchievementsData();
  useAuthStateListener();
  
  // Additional logic for coordinating syncs if needed
  useEffect(() => {
    // Any additional setup or coordination between stores
    console.log('All data sync hooks initialized');
    
    return () => {
      // Cleanup if needed
    };
  }, []);
} 