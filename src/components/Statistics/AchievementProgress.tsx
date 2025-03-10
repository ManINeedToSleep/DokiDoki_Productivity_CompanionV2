"use client";

import { useMemo } from 'react';
import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { UserDocument } from '@/lib/firebase/user';
import { Achievement } from '@/lib/firebase/achievements';
import { Timestamp } from '@/lib/firebase';

interface AchievementProgressProps {
  title?: string;
  companionId?: CompanionId;
  userData?: UserDocument | null;
  achievements?: Achievement[];
  className?: string;
  limit?: number;
}

export default function AchievementProgress({
  title = "Achievement Progress",
  companionId = 'sayori',
  userData = null,
  achievements = [],
  className = '',
  limit = 5
}: AchievementProgressProps) {
  const colors = getCharacterColors(companionId);
  
  // Get unlocked achievements and calculate progress
  const { 
    unlockedCount, 
    totalCount, 
    recentAchievements,
    progressByType
  } = useMemo(() => {
    // If we don't have user data or achievements, return empty data
    if (!userData || !userData.achievements || !achievements || achievements.length === 0) {
      return {
        unlockedCount: 0,
        totalCount: 0,
        recentAchievements: [],
        progressByType: [
          { type: 'Focus', unlocked: 0, total: 0 },
          { type: 'Companion', unlocked: 0, total: 0 },
          { type: 'Goal', unlocked: 0, total: 0 },
          { type: 'Streak', unlocked: 0, total: 0 },
          { type: 'Hidden', unlocked: 0, total: 0 }
        ]
      };
    }
    
    // Get total counts
    const unlocked = userData.achievements.map(a => a.id);
    const unlockedCount = unlocked.length;
    const totalCount = achievements.length;
    
    // Map achievement types to display names
    const typeDisplayMap: Record<string, string> = {
      'focus': 'Focus',
      'companion': 'Companion',
      'goal': 'Goal',
      'hidden': 'Hidden',
      'streak': 'Streak'
    };
    
    // Calculate progress by type
    const typeProgress: Record<string, { unlocked: number, total: number }> = {};
    
    // Initialize counters for each type
    for (const type of ['focus', 'companion', 'goal', 'hidden', 'streak']) {
      typeProgress[type] = { unlocked: 0, total: 0 };
    }
    
    // Count total achievements by type
    achievements.forEach(achievement => {
      const type = achievement.type;
      if (typeProgress[type]) {
        typeProgress[type].total += 1;
        if (unlocked.includes(achievement.id)) {
          typeProgress[type].unlocked += 1;
        }
      }
    });
    
    // Format for display
    const progressByType = Object.entries(typeProgress).map(([type, progress]) => ({
      type: typeDisplayMap[type] || type,
      unlocked: progress.unlocked,
      total: progress.total
    }));
    
    // Get recently unlocked achievements
    const unlockedAchievements = userData.achievements
      .map(a => {
        const achievementData = achievements.find(ach => ach.id === a.id);
        if (achievementData) {
          return {
            ...achievementData,
            unlockedAt: a.unlockedAt
          };
        }
        return null;
      })
      .filter(a => a !== null) as Achievement[];
    
    // Sort by unlock date (recent first) and limit
    const recentAchievements = unlockedAchievements
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return b.unlockedAt.toMillis() - a.unlockedAt.toMillis();
      })
      .slice(0, limit);
    
    return {
      unlockedCount,
      totalCount,
      recentAchievements,
      progressByType
    };
  }, [userData, achievements, limit]);
  
  // Calculate completion percentage
  const completionPercentage = totalCount > 0 
    ? Math.round((unlockedCount / totalCount) * 100) 
    : 0;
  
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <StatsCard
      title={title}
      companionId={companionId}
      className={className}
    >
      <div className="mb-4">
        {/* Achievement Progress Bar */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-[Halogen]" style={{ color: colors.text }}>
            {`${unlockedCount} / ${totalCount} Achievements`}
          </span>
          <span className="text-sm font-[Halogen]" style={{ color: colors.text }}>
            {`${completionPercentage}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ 
              width: `${completionPercentage}%`,
              backgroundColor: colors.primary
            }}
          ></div>
        </div>
      </div>
      
      {/* Progress by Type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {progressByType.map((progress) => (
          <div key={progress.type} className="text-center">
            <div className="text-xs text-gray-600 mb-1">{progress.type}</div>
            <div className="text-xs font-bold mb-1" style={{ color: colors.text }}>
              {`${progress.unlocked}/${progress.total}`}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full" 
                style={{ 
                  width: `${progress.total > 0 ? (progress.unlocked / progress.total) * 100 : 0}%`,
                  backgroundColor: colors.primary
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Achievements */}
      {recentAchievements.length > 0 ? (
        <div>
          <h4 className="text-sm font-[Halogen] mb-2" style={{ color: colors.heading }}>
            Recently Unlocked
          </h4>
          <div className="space-y-2">
            {recentAchievements.map(achievement => (
              <div 
                key={achievement.id} 
                className="flex items-center p-2 rounded-md bg-gray-50 border border-gray-100"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                  <span className="text-lg">{achievement.icon}</span>
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-[Halogen]" style={{ color: colors.text }}>
                    {achievement.title}
                  </div>
                  <div className="text-xs text-gray-600">
                    {achievement.description}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(achievement.unlockedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-600 py-4">
          No achievements unlocked yet. Keep up the good work!
        </div>
      )}
    </StatsCard>
  );
} 