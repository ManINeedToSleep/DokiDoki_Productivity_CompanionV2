"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import { motion } from 'framer-motion';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

// Import our statistics components
import StatMetric from '@/components/Statistics/StatMetric';
import ActivityCalendar from '@/components/Statistics/ActivityCalendar';
import FocusTrendChart from '@/components/Statistics/FocusTrendChart';
import GoalProgressChart from '@/components/Statistics/GoalProgressChart';
import CompanionStats from '@/components/Statistics/CompanionStats';
import RecentSessions from '@/components/Statistics/RecentSessions';

// Import icons
import {
  FaClock, FaCalendarCheck, FaChartLine, FaCheckCircle, FaFire, 
  FaPause, FaRegClock, FaTrophy
} from 'react-icons/fa';

export default function StatsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  // Fetch user data
  useEffect(() => {
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
    } else if (!isLoading) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);
  
  // Helper function to format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading your stats...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Calculate session completion rate
  const totalSessions = userData?.focusStats?.totalSessions || 0;
  const completedSessions = userData?.focusStats?.completedSessions || 0;
  const sessionCompletionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      
      <main className="container mx-auto px-4 py-6 max-h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.text }}
        >
          Your Stats & Analytics
        </motion.h1>
        
        {/* Time Range Selector */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/80 rounded-lg shadow-sm border-2 border-gray-100">
            <button 
              className={`px-4 py-2 rounded-l-lg font-[Halogen] text-sm ${timeRange === 'week' ? 'bg-gray-100' : ''}`}
              onClick={() => setTimeRange('week')}
              style={{ color: colors.text }}
            >
              Week
            </button>
            <button 
              className={`px-4 py-2 font-[Halogen] text-sm ${timeRange === 'month' ? 'bg-gray-100' : ''}`}
              onClick={() => setTimeRange('month')}
              style={{ color: colors.text }}
            >
              Month
            </button>
            <button 
              className={`px-4 py-2 rounded-r-lg font-[Halogen] text-sm ${timeRange === 'year' ? 'bg-gray-100' : ''}`}
              onClick={() => setTimeRange('year')}
              style={{ color: colors.text }}
            >
              Year
            </button>
          </div>
        </div>
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatMetric
            title="Total Focus Time"
            value={formatTime(userData?.focusStats?.totalFocusTime || 0)}
            icon={<FaClock size={24} />}
            description="Your lifetime focus sessions"
            companionId={selectedCompanion}
            index={0}
          />
          <StatMetric
            title="Today's Focus"
            value={formatTime(userData?.focusStats?.todaysFocusTime || 0)}
            icon={<FaCalendarCheck size={24} />}
            description="Focus time tracked today"
            companionId={selectedCompanion}
            index={1}
          />
          <StatMetric
            title="This Week"
            value={formatTime(userData?.focusStats?.weeklyFocusTime || 0)}
            icon={<FaChartLine size={24} />}
            description="Focus time this week"
            companionId={selectedCompanion}
            index={2}
          />
          <StatMetric
            title="Avg. Session Length"
            value={formatTime(userData?.focusStats?.averageSessionDuration || 0)}
            icon={<FaRegClock size={24} />}
            description="Average length of your focus sessions"
            companionId={selectedCompanion}
            index={3}
          />
        </div>
        
        {/* Activity Calendar */}
        <div className="mb-6">
          <ActivityCalendar
            title="Activity Calendar"
            companionId={selectedCompanion}
            recentSessions={userData?.recentSessions || []}
            months={3}
          />
        </div>
        
        {/* Focus Time Chart & Goal Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FocusTrendChart
            title="Focus Time Trend"
            companionId={selectedCompanion}
            recentSessions={userData?.recentSessions || []}
            timeRange={timeRange}
            chartType="line"
            showSessions={true}
          />
          
          <GoalProgressChart
            title="Goal Progress"
            companionId={selectedCompanion}
            goals={userData?.goals?.list || []}
            chartType="bar"
          />
        </div>
        
        {/* Companion Stats */}
        <div className="mb-6">
          <CompanionStats
            title={`${selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)} Relationship`}
            companionId={selectedCompanion}
            userData={userData}
            chartType="radar"
          />
        </div>
        
        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatMetric
            title="Sessions Completed"
            value={completedSessions}
            icon={<FaCheckCircle size={24} />}
            description="Total completed focus sessions"
            companionId={selectedCompanion}
            index={0}
          />
          <StatMetric
            title="Daily Streak"
            value={`${userData?.focusStats?.dailyStreak || 0} days`}
            icon={<FaFire size={24} />}
            description="Current consecutive days active"
            companionId={selectedCompanion}
            index={1}
          />
          <StatMetric
            title="Breaks Taken"
            value={userData?.focusStats?.totalBreaks || 0}
            icon={<FaPause size={24} />}
            description="Total breaks during focus sessions"
            companionId={selectedCompanion}
            index={2}
          />
          <StatMetric
            title="Completion Rate"
            value={`${sessionCompletionRate}%`}
            icon={<FaTrophy size={24} />}
            description="Percentage of sessions completed"
            companionId={selectedCompanion}
            index={3}
          />
        </div>
        
        {/* Recent Sessions */}
        <div className="mb-6">
          <RecentSessions
            title="Recent Sessions"
            companionId={selectedCompanion}
            recentSessions={userData?.recentSessions || []}
            limit={5}
          />
        </div>
      </main>
    </div>
  );
}