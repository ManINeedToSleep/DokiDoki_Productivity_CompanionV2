"use client";

import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { UserDocument } from '@/lib/firebase/user';
import { Achievement, ACHIEVEMENTS } from '@/lib/firebase/achievements';
import { useRouter } from 'next/navigation';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

// Extended Achievement type that includes the unlocked property
interface DisplayAchievement extends Achievement {
  unlocked: boolean;
}

interface AchievementsProps {
  userData: UserDocument | null;
}

// Helper function to get the achievement definition by ID
function getAchievementById(id: string): Achievement | undefined {
  // Check each category for the achievement
  for (const category of Object.keys(ACHIEVEMENTS)) {
    const categoryAchievements = ACHIEVEMENTS[category as keyof typeof ACHIEVEMENTS];
    
    // Check if this ID exists in this category
    for (const achievementId of Object.keys(categoryAchievements)) {
      if (achievementId === id) {
        return categoryAchievements[achievementId as keyof typeof categoryAchievements];
      }
    }
  }
  
  return undefined;
}

export default function Achievements({ userData }: AchievementsProps) {
  const router = useRouter();
  
  if (!userData) return null;
  
  const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
  
  // Get character-specific colors
  const colors = getCharacterColors(selectedCompanion);
  
  // Get the user's achievements and sort them by unlock date (newest first)
  const userAchievements = userData.achievements || [];
  
  // Create display achievements with data from ACHIEVEMENTS definitions
  const recentAchievements: DisplayAchievement[] = userAchievements
    // Sort by unlocked date (newest first)
    .sort((a, b) => {
      if (!a.unlockedAt) return 1;
      if (!b.unlockedAt) return -1;
      return b.unlockedAt.toMillis() - a.unlockedAt.toMillis();
    })
    // Take the most recent 3
    .slice(0, 3)
    // Map to DisplayAchievement format
    .map(achievement => {
      // Find the achievement definition from the global ACHIEVEMENTS object
      const achievementDef = getAchievementById(achievement.id);
      
      if (!achievementDef) {
        // If the achievement definition is not found, create a placeholder
        return {
          id: achievement.id,
          title: 'Achievement',
          description: 'An achievement you unlocked',
          icon: '🏆',
          type: 'hidden',
          unlockedAt: achievement.unlockedAt,
          unlocked: true,
          requirement: { type: 'special', value: 0 }
        };
      }
      
      // Return a DisplayAchievement that combines the user's achievement data with the definition
      return {
        ...achievementDef,
        unlockedAt: achievement.unlockedAt,
        unlocked: true
      };
    });

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 
          className="text-lg font-[Riffic]"
          style={{ color: colors.heading }}
        >
          Recent Achievements
        </h2>
        <motion.button 
          className="text-xs flex items-center gap-1 font-[Halogen]"
          style={{ color: colors.text }}
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push('/dashboard/achievements')}
        >
          View All <FaArrowRight size={10} />
        </motion.button>
      </div>
      
      {recentAchievements.length > 0 ? (
        <div className="space-y-3">
          {recentAchievements.map((achievement, index) => (
            <AchievementItem 
              key={achievement.id} 
              achievement={achievement} 
              index={index}
              companionId={selectedCompanion}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-6">
          You haven&apos;t unlocked any achievements yet. 
          Complete focus sessions and goals to earn achievements!
        </p>
      )}
    </motion.div>
  );
}

interface AchievementItemProps {
  achievement: DisplayAchievement;
  index: number;
  companionId: CompanionId;
}

function AchievementItem({ achievement, index, companionId }: AchievementItemProps) {
  // Get character-specific colors
  const colors = getCharacterColors(companionId);
  
  // Format unlocked date
  const unlockedDate = achievement.unlockedAt?.toDate();
  const formattedDate = unlockedDate 
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(unlockedDate)
    : 'Today'; // Default to "Today" if no date is available
  
  return (
    <motion.div 
      className="bg-gray-50 rounded-lg p-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + (index * 0.1) }}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-sm text-gray-800 font-[Halogen]">{achievement.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-[Halogen] ${colors.badge}`}>
          {achievement.type}
        </span>
      </div>
      
      <p className="text-xs text-gray-700 mb-2 font-[Halogen]">{achievement.description}</p>
      
      <div className="text-xs text-gray-700 font-[Halogen]">
        Unlocked on {formattedDate}
      </div>
    </motion.div>
  );
} 