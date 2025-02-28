"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { ACHIEVEMENTS } from "@/lib/firebase/achievements";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import Navbar from "@/components/Common/Navbar/Navbar";

type AchievementCategory = 'all' | 'focus' | 'companion' | 'goal' | 'hidden';

export default function AchievementsPage() {
  const { userData } = useUserData();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');

  if (!userData) return null;

  const unlockedAchievements = new Set(userData.achievements?.map(a => a.id) || []);
  const totalAchievements = Object.values(ACHIEVEMENTS)
    .flatMap(category => Object.values(category)).length;

  const categories: { id: AchievementCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'focus', label: 'Focus', icon: '⏱️' },
    { id: 'companion', label: 'Companion', icon: '💝' },
    { id: 'goal', label: 'Goals', icon: '📝' },
    { id: 'hidden', label: 'Hidden', icon: '🔍' },
  ];

  const filteredAchievements = Object.entries(ACHIEVEMENTS)
    .flatMap(([category, achievements]) => 
      Object.values(achievements)
        .filter(achievement => 
          selectedCategory === 'all' || achievement.type === selectedCategory
        )
        .map(achievement => ({
          ...achievement,
          isUnlocked: unlockedAchievements.has(achievement.id),
          category
        }))
    );

  return (
    <div className="min-h-screen relative">
      <PolkaDotBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="pt-24 px-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
          <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-[Riffic] text-pink-700">Achievements</h1>
              <div className="text-pink-700 font-[Halogen]">
                {unlockedAchievements.size} / {totalAchievements}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedAchievements.size / totalAchievements) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap
                    ${selectedCategory === category.id 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/50 text-pink-700 hover:bg-pink-100'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{category.icon}</span>
                  <span className="font-[Halogen]">{category.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DashboardCard>
                    <div className={`space-y-2 ${!achievement.isUnlocked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-[Halogen] text-pink-800">{achievement.title}</h3>
                          <p className="text-sm text-pink-600">{achievement.description}</p>
                        </div>
                      </div>
                      {achievement.isUnlocked && (
                        <div className="flex justify-end">
                          <span className="text-xs text-pink-400">✓ Unlocked</span>
                        </div>
                      )}
                    </div>
                  </DashboardCard>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
