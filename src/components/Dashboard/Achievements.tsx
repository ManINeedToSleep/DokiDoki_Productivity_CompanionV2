"use client";

import { motion } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import type { UserDocument } from "@/lib/firebase/user";
import { ACHIEVEMENTS } from "@/lib/firebase/achievements";

interface AchievementItemProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  index: number;
}

const AchievementItem = ({ title, description, icon, isUnlocked, index }: AchievementItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-white/50 p-4 rounded-lg ${!isUnlocked ? 'opacity-50' : ''}`}
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-[Halogen] text-pink-800">{title}</h3>
        <p className="text-sm text-pink-600">{description}</p>
      </div>
    </div>
  </motion.div>
);

interface AchievementsProps {
  userData: UserDocument | null;
}

export default function Achievements({ userData }: AchievementsProps) {
  if (!userData) return null;

  const unlockedAchievements = new Set(userData.achievements?.map(a => a.id) || []);
  const recentAchievements = Object.values(ACHIEVEMENTS)
    .flatMap(category => Object.values(category))
    .map((achievement, index) => ({
      ...achievement,
      isUnlocked: unlockedAchievements.has(achievement.id),
      index
    }))
    .slice(0, 4); // Show only 4 most recent achievements

  const totalAchievements = Object.values(ACHIEVEMENTS)
    .flatMap(category => Object.values(category)).length;

  return (
    <DashboardCard>
      <h2 className="text-2xl font-[Riffic] text-pink-700 mb-4">Achievements</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-pink-700 font-[Halogen]">Progress</span>
          <span className="text-pink-900 font-[Halogen]">
            {unlockedAchievements.size} / {totalAchievements}
          </span>
        </div>

        <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedAchievements.size / totalAchievements) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="space-y-3 mt-4">
          {recentAchievements.map((achievement) => (
            <AchievementItem
              key={achievement.id}
              {...achievement}
            />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
