"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import { motion } from 'framer-motion';
import DashboardCard from '@/components/Common/Card/DashboardCard';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { FaClock, FaCalendarCheck, FaChartLine, FaCheckCircle, FaFire, FaPause, FaLightbulb, FaTrophy } from 'react-icons/fa';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

export default function StatsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  
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
  
  // Prepare data for weekly focus chart
  const weeklyFocusData = [
    { name: 'Mon', minutes: Math.random() * 120 },
    { name: 'Tue', minutes: Math.random() * 120 },
    { name: 'Wed', minutes: Math.random() * 120 },
    { name: 'Thu', minutes: Math.random() * 120 },
    { name: 'Fri', minutes: Math.random() * 120 },
    { name: 'Sat', minutes: Math.random() * 120 },
    { name: 'Sun', minutes: Math.random() * 120 },
  ];
  
  // Prepare data for productivity distribution
  const productivityDistribution = [
    { name: 'Focus Time', value: userData?.focusStats?.totalFocusTime || 0 },
    { name: 'Break Time', value: (userData?.focusStats?.totalBreaks || 0) * 5 * 60 }, // Estimate break time
  ];
  
  // Prepare stats
  const stats = [
    {
      title: "Total Focus Time",
      value: formatTime(userData?.focusStats?.totalFocusTime || 0),
      icon: <FaClock size={24} style={{ color: colors.text }} />,
      description: "Your lifetime focus sessions"
    },
    {
      title: "Today's Focus",
      value: formatTime(userData?.focusStats?.todaysFocusTime || 0),
      icon: <FaCalendarCheck size={24} style={{ color: colors.text }} />,
      description: "Focus time tracked today"
    },
    {
      title: "This Week",
      value: formatTime(userData?.focusStats?.weeklyFocusTime || 0),
      icon: <FaChartLine size={24} style={{ color: colors.text }} />,
      description: "Focus time this week"
    },
    {
      title: "Sessions Completed",
      value: userData?.focusStats?.completedSessions || 0,
      icon: <FaCheckCircle size={24} style={{ color: colors.text }} />,
      description: "Total completed focus sessions"
    },
    {
      title: "Daily Streak",
      value: `${userData?.focusStats?.dailyStreak || 0} days`,
      icon: <FaFire size={24} style={{ color: colors.text }} />,
      description: "Current consecutive days active"
    },
    {
      title: "Weekly Streak",
      value: `${userData?.focusStats?.weekStreak || 0} weeks`,
      icon: <FaTrophy size={24} style={{ color: colors.text }} />,
      description: "Consecutive weeks active"
    },
    {
      title: "Breaks Taken",
      value: userData?.focusStats?.totalBreaks || 0,
      icon: <FaPause size={24} style={{ color: colors.text }} />,
      description: "Total breaks during focus sessions"
    },
    {
      title: "Avg. Session Length",
      value: formatTime(userData?.focusStats?.averageSessionDuration || 0),
      icon: <FaLightbulb size={24} style={{ color: colors.text }} />,
      description: "Average length of your focus sessions"
    }
  ];
  
  // Prepare streak data
  const goalCompletionRate = userData?.focusStats?.taskCompletionRate || 0;
  
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
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.slice(0, 4).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <DashboardCard>
                <div className="flex items-center mb-2">
                  {stat.icon}
                  <h3 className="text-sm font-[Halogen] ml-2" style={{ color: colors.heading }}>
                    {stat.title}
                  </h3>
                </div>
                <div className="text-2xl font-bold font-[Halogen]" style={{ color: colors.text }}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  {stat.description}
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
        
        {/* Focus Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <DashboardCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-[Riffic]" style={{ color: colors.heading }}>
                Focus Time Overview (fake data)
              </h3>
              <div className="flex bg-slate-800 rounded-md">
                <button 
                  className={`px-3 py-1 text-xs rounded-md ${timeRange === 'week' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setTimeRange('week')}
                >
                  Week
                </button>
                <button 
                  className={`px-3 py-1 text-xs rounded-md ${timeRange === 'month' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setTimeRange('month')}
                >
                  Month
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyFocusData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value) => [`${value} minutes`, 'Focus Time']}
                    contentStyle={{ 
                      backgroundColor: colors.secondary,
                      borderColor: colors.primary
                    }}
                  />
                  <Bar dataKey="minutes" fill={colors.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Goal Completion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <DashboardCard>
              <h3 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
                Goal Completion Rate
              </h3>
              <div className="flex items-center justify-center h-48">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-3xl font-bold font-[Halogen]" style={{ color: colors.text }}>
                      {Math.round(goalCompletionRate)}%
                    </div>
                    <div className="text-xs text-gray-700">Completion Rate</div>
                    <div className="text-sm font-[Halogen] mt-2" style={{ color: colors.text }}>
                      {userData?.goals?.completedGoals || 0} Goals
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: goalCompletionRate },
                          { name: 'Remaining', value: 100 - goalCompletionRate }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill={colors.primary} />
                        <Cell fill="#f3f4f6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-center text-sm text-gray-700 mt-2">
                You've completed {userData?.goals?.completedGoals || 0} of your goals
              </div>
            </DashboardCard>
          </motion.div>
          
          {/* Productivity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <DashboardCard>
              <h3 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
                Productivity Distribution
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productivityDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill={colors.primary} />
                      <Cell fill="#94a3b8" />
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatTime(value as number), 'Time']}
                      contentStyle={{ 
                        backgroundColor: colors.secondary,
                        borderColor: colors.primary
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DashboardCard>
          </motion.div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.slice(4).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + (0.1 * index) }}
            >
              <DashboardCard>
                <div className="flex items-center mb-2">
                  {stat.icon}
                  <h3 className="text-sm font-[Halogen] ml-2" style={{ color: colors.heading }}>
                    {stat.title}
                  </h3>
                </div>
                <div className="text-2xl font-bold font-[Halogen]" style={{ color: colors.text }}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  {stat.description}
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
        
        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8"
        >
          <DashboardCard>
            <h3 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
              Recent Sessions
            </h3>
            {userData?.recentSessions && userData.recentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-[Halogen] text-gray-800">Date</th>
                      <th className="text-left py-2 text-sm font-[Halogen] text-gray-800">Duration</th>
                      <th className="text-left py-2 text-sm font-[Halogen] text-gray-800">Companion</th>
                      <th className="text-left py-2 text-sm font-[Halogen] text-gray-800">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.recentSessions.slice(0, 5).map((session) => (
                      <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">
                          {session.startTime.toDate().toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm text-gray-900">
                          {formatTime(session.duration)}
                        </td>
                        <td className="py-3 text-sm text-gray-900">
                          <span className="capitalize">
                            {session.companionId}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs ${
                              session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {session.completed ? 'Completed' : 'Interrupted'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-900">
                No recent sessions found. Start a focus session to track your progress!
              </div>
            )}
          </DashboardCard>
        </motion.div>
      </main>
    </div>
  );
}
