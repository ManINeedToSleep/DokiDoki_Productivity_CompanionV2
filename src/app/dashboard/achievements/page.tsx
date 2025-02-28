"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { ACHIEVEMENTS } from "@/lib/firebase/achievements";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import Navbar from "@/components/Common/Navbar/Navbar";
import AchievementCard from "@/components/Common/Card/AchievementCard";
import AchievementItemCard from "@/components/Common/Card/AchievementItemCard";

type AchievementCategory = 'all' | 'focus' | 'companion' | 'goals' | 'hidden';

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
    { id: 'goals', label: 'Goals', icon: '📝' },
    { id: 'hidden', label: 'Hidden', icon: '🔍' },
  ];

  const filteredAchievements = Object.entries(ACHIEVEMENTS)
    .flatMap(([category, achievements]) => 
      Object.values(achievements).map(achievement => {
        const userAchievement = userData.achievements?.find(a => a.id === achievement.id);
        return {
          ...achievement,
          category,
          isUnlocked: unlockedAchievements.has(achievement.id),
          unlockedAt: userAchievement?.unlockedAt || null
        };
      })
    )
    .filter(achievement => 
      selectedCategory === 'all' || achievement.category === selectedCategory
    );

  return (
    <div className="min-h-screen relative">
      <PolkaDotBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="pt-24 px-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
          <AchievementCard>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-[Riffic] text-pink-700">Achievements</h1>
                <div className="text-pink-900 font-[Halogen]">
                  {unlockedAchievements.size} / {totalAchievements}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedAchievements.size / totalAchievements) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full border-2 font-[Halogen] flex items-center gap-2
                      ${selectedCategory === category.id 
                        ? 'border-pink-500 bg-pink-500 text-white' 
                        : 'border-pink-300 text-pink-700 hover:bg-pink-50'
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{category.icon}</span>
                    {category.label}
                  </motion.button>
                ))}
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AchievementItemCard isLocked={!achievement.isUnlocked}>
                      <div className="flex items-start gap-4 relative">
                        {achievement.isUnlocked && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`text-3xl p-3 rounded-lg ${achievement.isUnlocked ? 'bg-pink-100' : 'bg-gray-50'}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-[Halogen] text-pink-800">{achievement.title}</h3>
                          <p className="text-sm text-pink-600 mt-1">{achievement.description}</p>
                          <div className="mt-2 text-xs font-[Halogen] flex items-center justify-between">
                            {achievement.isUnlocked ? (
                              <>
                                <span className="text-green-600">✓ Unlocked</span>
                                {achievement.unlockedAt && (
                                  <span className="text-pink-400">
                                    {achievement.unlockedAt.toDate().toLocaleDateString()}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-pink-400">🔒</span>
                                <span className="text-pink-400">
                                  {achievement.requirement.type === 'minutes' && 
                                    `Focus for ${achievement.requirement.value} minutes`}
                                  {achievement.requirement.type === 'streak' && 
                                    `Maintain a ${achievement.requirement.value} day streak`}
                                  {achievement.requirement.type === 'goals' && 
                                    `Complete ${achievement.requirement.value} goals`}
                                  {achievement.requirement.type === 'affinity' && 
                                    `Reach level ${achievement.requirement.value}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AchievementItemCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </AchievementCard>
        </main>
      </div>
    </div>
  );
}
