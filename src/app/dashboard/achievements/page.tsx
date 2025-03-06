"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion } from 'framer-motion';
import { Achievement } from '@/lib/firebase/achievements';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { ACHIEVEMENTS } from '@/lib/firebase/achievements';
import { 
  DisplayAchievement,
  AchievementStats, 
  AchievementFilter, 
  AchievementGrid,
  processAchievements,
  calculateAchievementStats
} from '@/components/Achievements';

export default function AchievementsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [displayAchievements, setDisplayAchievements] = useState<DisplayAchievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'focus' | 'streak' | 'companion' | 'goal' | 'hidden'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get achievements store
  const { 
    achievements, 
    unlockedAchievements,
    syncWithFirebase,
    setAchievements,
    resetStore,
    checkAll
  } = useAchievementsStore();
  
  // Force refresh function to ensure all achievements are loaded
  const forceRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      // Force sync achievements with Firebase
      await syncWithFirebase(user.uid, true);
      
      // Refetch user data
      const updatedUserData = await getUserDocument(user.uid);
      setUserData(updatedUserData);
      
      // Show success message
      alert('Achievements refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      alert('Error refreshing achievements. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Initialize achievements if they're not already loaded
  useEffect(() => {
    // Debug: Log all available achievement categories
    console.log('Available achievement categories:', Object.keys(ACHIEVEMENTS));
    
    // Debug: Log the raw ACHIEVEMENTS object
    console.log('Raw ACHIEVEMENTS object:', ACHIEVEMENTS);
    
    // Reset store to clear persistence if we only have some achievement types
    const achievementTypes = achievements.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Achievement counts by type:', achievementTypes);
    
    // Check if we're missing achievement types or have too few achievements
    const hasAllTypes = 
      (achievementTypes['focus'] || 0) > 0 && 
      (achievementTypes['streak'] || 0) > 0 && 
      (achievementTypes['companion'] || 0) > 0 && 
      (achievementTypes['goal'] || 0) > 0 &&
      (achievementTypes['hidden'] || 0) > 0;
      
    if (achievements.length < 10 || !hasAllTypes) {
      // We're missing some achievement types, reset the store
      console.log('Missing achievement types, resetting store');
      resetStore();
      
      // Convert the ACHIEVEMENTS object to an array
      const achievementsArray: Achievement[] = [];
      
      // Properly extract ALL achievements from each category
      Object.entries(ACHIEVEMENTS).forEach(([category, achievementsInCategory]) => {
        console.log(`Processing category: ${category} with:`, 
          typeof achievementsInCategory === 'object' ? 
          Object.keys(achievementsInCategory || {}).length + ' items' : 
          achievementsInCategory);
          
        if (typeof achievementsInCategory === 'object' && achievementsInCategory !== null) {
          Object.values(achievementsInCategory).forEach(achievement => {
            if (achievement && typeof achievement === 'object' && 'id' in achievement && 'type' in achievement) {
              achievementsArray.push(achievement as Achievement);
            }
          });
        }
      });
      
      console.log('All achievements loaded:', achievementsArray.length);
      console.log('Achievement types distribution:', 
        achievementsArray.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      
      if (achievementsArray.length > 0) {
        setAchievements(achievementsArray);
      } else {
        console.error('Failed to load achievements from ACHIEVEMENTS object');
      }
    }
  }, [achievements, resetStore, setAchievements]);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchUserData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getUserDocument(user.uid);
          setUserData(data);
          
          // Explicitly sync with Firebase
          syncWithFirebase(user.uid, true);
          
          // Check all achievements when user data is loaded
          if (data) {
            checkAll(user.uid, {
              totalFocusTime: data.focusStats?.totalFocusTime || 0,
              weekStreak: data.focusStats?.weekStreak || 0,
              longestStreak: data.focusStats?.longestStreak || 0,
              completedGoals: data.goals?.completedGoals || 0,
              totalSessions: data.focusStats?.totalSessions || 0,
              challengeGoalsCompleted: data.goals?.challengeGoalsCompleted || 0
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchUserData();
    }
  }, [user, isLoading, router, checkAll, syncWithFirebase]);
  
  // Process achievements data
  useEffect(() => {
    if (achievements && unlockedAchievements) {
      const processed = processAchievements(
        achievements,
        unlockedAchievements,
        userData?.achievements
      );
      
      setDisplayAchievements(processed);
    }
  }, [achievements, unlockedAchievements, userData]);
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading your achievements...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Filter achievements
  const filteredAchievements = displayAchievements.filter(achievement => {
    // Filter by unlock status
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && achievement.type !== typeFilter) return false;
    
    return true;
  });
  
  console.log('Filtered achievements:', filteredAchievements);
  console.log('Filter:', filter, 'Type filter:', typeFilter);
  
  // Calculate stats
  const stats = calculateAchievementStats(displayAchievements);
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <motion.h1 
            className="text-2xl font-[Riffic] text-center md:text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: colors.text }}
          >
            Your Achievements
          </motion.h1>
          
          <div className="flex gap-2">
            <motion.button
              className="text-xs flex items-center gap-1 px-3 py-1 rounded-full font-[Halogen] bg-white shadow-sm"
              style={{ color: colors.text }}
              whileHover={{ scale: 1.05 }}
              onClick={forceRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : '🔄 Refresh Achievements'}
            </motion.button>
            
            <motion.button
              className="text-xs flex items-center gap-1 px-3 py-1 rounded-full font-[Halogen] bg-white shadow-sm"
              style={{ color: colors.text }}
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push('/dashboard/achievements/cleanup')}
            >
              🧹 Cleanup Duplicates
            </motion.button>
            
            <motion.button
              className="text-xs flex items-center gap-1 px-3 py-1 rounded-full font-[Halogen] bg-white shadow-sm"
              style={{ color: colors.text }}
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push('/dashboard/achievements/debug')}
            >
              🔧 Debug
            </motion.button>
          </div>
        </div>
        
        {/* Stats Card */}
        <AchievementStats
          unlockedCount={stats.unlockedCount}
          lockedCount={stats.lockedCount}
          completionPercentage={stats.completionPercentage}
          colors={colors}
        />
        
        {/* Filters */}
        <AchievementFilter
          statusFilter={filter}
          typeFilter={typeFilter}
          onStatusFilterChange={setFilter}
          onTypeFilterChange={setTypeFilter}
          colors={colors}
        />
        
        {/* Achievements Grid */}
        <AchievementGrid
          achievements={filteredAchievements}
          colors={colors}
        />
      </main>
    </div>
  );
}
