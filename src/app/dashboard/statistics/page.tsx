"use client";

import { motion } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import { useUserData } from "@/hooks/useUserData";
import { formatTime } from "@/lib/utils/timeFormat";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import Navbar from "@/components/Common/Navbar/Navbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatisticsPage() {
  const { userData } = useUserData();
  const stats = userData?.focusStats;

  if (!stats) return null;

  const statCards = [
    {
      title: "Focus Time Overview",
      items: [
        { label: "Today's Focus Time", value: formatTime(stats.todaysFocusTime || 0) },
        { label: "Weekly Focus Time", value: formatTime(stats.weeklyFocusTime || 0) },
        { label: "Total Focus Time", value: formatTime(stats.totalFocusTime || 0) },
      ]
    },
    {
      title: "Achievements",
      items: [
        { label: "Current Streak", value: `${stats.weekStreak || 0} weeks` },
        { label: "Longest Streak", value: `${stats.longestStreak || 0} days` },
        { label: "Average Daily Focus", value: formatTime(stats.averageFocusPerDay || 0) },
      ]
    }
  ];

  // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Reorder days to start from current day
  const orderedDays = [
    ...daysOfWeek.slice(today),
    ...daysOfWeek.slice(0, today)
  ];

  // Calculate daily average for more realistic distribution
  const dailyAverage = Math.floor((stats.weeklyFocusTime || 0) / 60 / 7);
  
  // Create weekly data with some variation
  const weeklyData = orderedDays.map(day => ({
    day,
    minutes: Math.max(0, Math.floor(dailyAverage * (1 + (Math.random() * 0.4 - 0.2))))
  }));

  return (
    <div className="min-h-screen relative">
      <PolkaDotBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="pt-24 px-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
          <div className="space-y-6 pb-6">
            <h1 className="text-3xl font-[Riffic] text-pink-700">Statistics</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {statCards.map((card) => (
                <DashboardCard key={card.title}>
                  <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">{card.title}</h2>
                  <div className="space-y-4">
                    {card.items.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/50 p-4 rounded-lg"
                      >
                        <p className="text-pink-700 text-sm">{item.label}</p>
                        <p className="text-pink-900 font-[Halogen] text-lg">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </DashboardCard>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
              <DashboardCard>
                <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">Weekly Focus Distribution (not working completely)</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis 
                        dataKey="day" 
                        stroke="#EC4899"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#EC4899"
                        fontSize={12}
                        tickLine={false}
                        label={{ 
                          value: 'Minutes', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: '#EC4899' }
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '2px solid #FFB6C1',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#EC4899' }}
                        formatter={(value: number) => [`${value} minutes`, 'Focus Time']}
                      />
                      <Bar 
                        dataKey="minutes" 
                        fill="#FFB6C1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
