"use client";

import { motion } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import { formatTime } from "@/lib/utils/timeFormat";
import type { UserDocument } from "@/lib/firebase/user";

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
  index: number;
}

const StatItem = ({ label, value, icon, index }: StatItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white/50 p-3 rounded-lg flex items-center gap-3"
  >
    <span className="text-xl text-pink-500">{icon}</span>
    <div className="flex-1">
      <p className="text-pink-700 text-sm">{label}</p>
      <p className="text-pink-900 font-[Halogen]">{value}</p>
    </div>
  </motion.div>
);

interface QuickStatsProps {
  userData: UserDocument | null;
}

export default function QuickStats({ userData }: QuickStatsProps) {
  if (!userData?.focusStats) return null;

  const stats = userData.focusStats;
  const todaysTotalSeconds = stats.todaysFocusTime || 0;
  
  const statItems: StatItemProps[] = [
    {
      label: "Today's Focus Time",
      value: formatTime(todaysTotalSeconds),
      icon: "⏱️",
      index: 0
    },
    {
      label: "Total Focus Time",
      value: formatTime(stats.totalFocusTime || 0),
      icon: "⭐",
      index: 1
    },
    {
      label: "Current Streak",
      value: `${stats.weekStreak || 0} weeks`,
      icon: "🔥",
      index: 2
    },
    {
      label: "Longest Streak",
      value: `${stats.longestStreak || 0} days`,
      icon: "🏆",
      index: 3
    }
  ];

  const dailyProgressMinutes = Math.floor((stats.todaysFocusTime || 0) / 60);
  const dailyGoalMinutes = userData.goals?.dailyGoal || 25;
  const dailyProgressPercentage = Math.round((dailyProgressMinutes / dailyGoalMinutes) * 100);

  return (
    <DashboardCard>
      <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">Quick Stats</h2>
      <div className="space-y-3">
        {statItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <h3 className="text-lg font-[Riffic] text-pink-700 mb-2">Daily Goal Progress</h3>
          <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-pink-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(dailyProgressPercentage, 100)}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-pink-600 mt-2 font-[Halogen]">
            {dailyProgressPercentage}% of daily goal completed
          </p>
        </motion.div>
      </div>
    </DashboardCard>
  );
}
