import { Achievement } from "@/lib/firebase/achievements";

// Local version of DisplayAchievement to avoid circular dependency
export interface DisplayAchievement extends Omit<Achievement, 'unlockedAt'> {
  unlocked: boolean;
  unlockedAt: Date | null;
}

// Format date for display
export const formatDate = (date?: Date | null) => {
  if (!date) return 'Not unlocked';
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Calculate achievement stats
export const calculateAchievementStats = (achievements: DisplayAchievement[]) => {
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;
    
  return {
    totalAchievements,
    unlockedCount,
    lockedCount: totalAchievements - unlockedCount,
    completionPercentage
  };
};

// Process achievements to add unlocked property
export const processAchievements = (
  achievements: Achievement[], 
  unlockedAchievementIds: string[],
  userAchievements?: { id: string, unlockedAt: { toDate: () => Date } }[]
): DisplayAchievement[] => {
  return achievements.map(achievement => {
    const isUnlocked = unlockedAchievementIds.includes(achievement.id);
    const unlockedTimestamp = userAchievements?.find(a => a.id === achievement.id)?.unlockedAt;
    
    return {
      ...achievement,
      unlocked: isUnlocked,
      unlockedAt: unlockedTimestamp ? unlockedTimestamp.toDate() : null
    };
  });
}; 