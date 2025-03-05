"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { Achievement } from '@/lib/firebase/achievements';
import { FaMedal, FaLock, FaGift } from 'react-icons/fa';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { ACHIEVEMENTS } from '@/lib/firebase/achievements';

// Extended Achievement type that includes the unlocked property
interface DisplayAchievement extends Omit<Achievement, 'unlockedAt'> {
  unlocked: boolean;
  unlockedAt: Date | null;
}

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
      const processed: DisplayAchievement[] = achievements.map(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        const unlockedTimestamp = userData?.achievements?.find(a => a.id === achievement.id)?.unlockedAt;
        
        return {
          ...achievement,
          unlocked: isUnlocked,
          unlockedAt: unlockedTimestamp ? unlockedTimestamp.toDate() : null
        };
      });
      
      setDisplayAchievements(processed);
    }
  }, [achievements, unlockedAchievements, userData]);
  
  // Get character-specific colors for polka dots
  const getCharacterDotColor = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return '#F5C0DF';
      case 'natsuki':
        return '#FFCCD3';
      case 'yuri':
        return '#D1CFFF';
      case 'monika':
        return '#C5E8D1';
      default:
        return '#F5C0DF';
    }
  };
  
  // Get character-specific colors
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2'
        };
      case 'natsuki':
        return { 
          primary: '#FF8DA1',
          secondary: '#FFF0F0',
          text: '#D14D61',
          heading: '#FF8DA1'
        };
      case 'yuri':
        return { 
          primary: '#A49EFF',
          secondary: '#F0F0FF',
          text: '#6A61E0',
          heading: '#A49EFF'
        };
      case 'monika':
        return { 
          primary: '#85CD9E',
          secondary: '#F0FFF5',
          text: '#4A9B68',
          heading: '#85CD9E'
        };
      default:
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2'
        };
    }
  };
  
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
  const totalAchievements = displayAchievements.length;
  const unlockedCount = displayAchievements.filter(a => a.unlocked).length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;
  
  const formatDate = (date?: Date) => {
    if (!date) return 'Not unlocked';
    
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
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
        <motion.div 
          className="bg-white rounded-xl shadow-md p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
                {unlockedCount}
              </div>
              <div className="text-sm font-[Halogen] text-gray-600">
                Unlocked
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
                {totalAchievements - unlockedCount}
              </div>
              <div className="text-sm font-[Halogen] text-gray-600">
                Locked
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
                {completionPercentage}%
              </div>
              <div className="text-sm font-[Halogen] text-gray-600">
                Completion
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${completionPercentage}%`,
                  backgroundColor: colors.primary
                }}
              ></div>
            </div>
          </div>
        </motion.div>
        
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: colors.primary }}>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${filter === 'all' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: filter === 'all' ? colors.primary : 'transparent' }}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${filter === 'unlocked' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: filter === 'unlocked' ? colors.primary : 'transparent' }}
              onClick={() => setFilter('unlocked')}
            >
              Unlocked
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${filter === 'locked' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: filter === 'locked' ? colors.primary : 'transparent' }}
              onClick={() => setFilter('locked')}
            >
              Locked
            </button>
          </div>
          
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: colors.primary }}>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: typeFilter === 'all' ? colors.primary : 'transparent' }}
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'focus' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: typeFilter === 'focus' ? colors.primary : 'transparent' }}
              onClick={() => setTypeFilter('focus')}
            >
              Focus
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'streak' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: typeFilter === 'streak' ? colors.primary : 'transparent' }}
              onClick={() => setTypeFilter('streak')}
            >
              Streak
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'companion' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: typeFilter === 'companion' ? colors.primary : 'transparent' }}
              onClick={() => setTypeFilter('companion')}
            >
              Companion
            </button>
            <button 
              className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'goal' ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: typeFilter === 'goal' ? colors.primary : 'transparent' }}
              onClick={() => setTypeFilter('goal')}
            >
              Goal
            </button>
          </div>
        </div>
        
        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
          {filteredAchievements.map((achievement) => (
            <motion.div 
              key={achievement.id}
              className={`bg-white rounded-xl shadow-md p-4 ${!achievement.unlocked ? 'opacity-75' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: achievement.unlocked ? 1 : 0.75, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}
                >
                  {achievement.unlocked ? (
                    <FaMedal className="text-yellow-500" size={24} />
                  ) : (
                    <FaLock className="text-gray-400" size={20} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 
                    className="text-lg font-[Riffic] mb-1"
                    style={{ color: colors.text }}
                  >
                    {achievement.title}
                  </h3>
                  
                  <p className="text-sm font-[Halogen] text-gray-600 mb-2">
                    {achievement.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span 
                      className="text-xs px-2 py-1 rounded-full font-[Halogen] capitalize"
                      style={{ 
                        backgroundColor: colors.secondary,
                        color: colors.text
                      }}
                    >
                      {achievement.type}
                    </span>
                    
                    <span 
                      className="text-xs px-2 py-1 rounded-full font-[Halogen] capitalize"
                      style={{ 
                        backgroundColor: achievement.unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: achievement.unlocked ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                      }}
                    >
                      {achievement.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    
                    {achievement.requirement && (
                      <span className="text-xs px-2 py-1 rounded-full font-[Halogen] bg-gray-100 text-gray-700">
                        {achievement.requirement.type}: {achievement.requirement.value}
                      </span>
                    )}
                  </div>
                  
                  {achievement.reward && (
                    <div className="flex items-center gap-2 text-xs font-[Halogen] text-gray-700">
                      <FaGift className="text-purple-500" />
                      <span>
                        Reward: {achievement.reward.type} - {achievement.reward.description}
                      </span>
                    </div>
                  )}
                  
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-2 text-xs font-[Halogen] text-gray-500">
                      Unlocked on {formatDate(achievement.unlockedAt)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {filteredAchievements.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-500 font-[Halogen]">No achievements found with the selected filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
