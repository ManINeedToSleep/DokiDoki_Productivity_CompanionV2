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
  
  // Get achievements store
  const { 
    achievements, 
    unlockedAchievements,
    syncWithFirebase,
    setAchievements
  } = useAchievementsStore();
  
  // Initialize achievements if they're not already loaded
  useEffect(() => {
    if (achievements.length === 0) {
      // Convert the ACHIEVEMENTS object to an array
      const achievementsArray = Object.values(ACHIEVEMENTS).flatMap(category => 
        Object.values(category)
      ) as Achievement[];
      
      setAchievements(achievementsArray);
    }
  }, [achievements.length, setAchievements]);
  
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
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchUserData();
    }
  }, [user, isLoading, router]);
  
  // Sync with Firebase every 3 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        syncWithFirebase(user.uid);
      }, 3 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, syncWithFirebase]);
  
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
  
  // Calculate stats
  const stats = calculateAchievementStats(displayAchievements);
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center md:text-left"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.text }}
        >
          Your Achievements
        </motion.h1>
        
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
