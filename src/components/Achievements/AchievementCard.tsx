import React from 'react';
import { motion } from 'framer-motion';
import { FaMedal, FaLock, FaGift } from 'react-icons/fa';
import { Achievement } from '@/lib/firebase/achievements';

export interface DisplayAchievement extends Omit<Achievement, 'unlockedAt'> {
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface AchievementCardProps {
  achievement: DisplayAchievement;
  colors: {
    text: string;
    secondary: string;
    primary: string;
  };
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  colors 
}) => {
  // Local formatDate function to avoid circular dependency
  const formatDate = (date?: Date | null) => {
    if (!date) return 'Not unlocked';
    
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-md p-4 ${!achievement.unlocked ? 'opacity-75' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: achievement.unlocked ? 1 : 0.75, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
          }`}
        >
          {achievement.unlocked ? (
            <FaMedal className="text-yellow-500" size={24} />
          ) : (
            <FaLock className="text-gray-400" size={20} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 
            className="text-lg font-[Riffic] mb-1"
            style={{ color: colors.text }}
          >
            {achievement.title}
          </h3>
          
          <p className="text-sm font-[Halogen] text-gray-600 mb-2">
            {achievement.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <span 
              className="text-xs px-2 py-1 rounded-full font-[Halogen] capitalize"
              style={{ 
                backgroundColor: colors.secondary,
                color: colors.text
              }}
            >
              {achievement.type}
            </span>
            
            <span 
              className="text-xs px-2 py-1 rounded-full font-[Halogen] capitalize"
              style={{ 
                backgroundColor: achievement.unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: achievement.unlocked ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
              }}
            >
              {achievement.unlocked ? 'Unlocked' : 'Locked'}
            </span>
            
            {achievement.requirement && (
              <span className="text-xs px-2 py-1 rounded-full font-[Halogen] bg-gray-100 text-gray-700">
                {achievement.requirement.type}: {achievement.requirement.value}
              </span>
            )}
          </div>
          
          {achievement.reward && (
            <div className="flex items-center gap-2 text-xs font-[Halogen] text-gray-700">
              <FaGift className="text-purple-500" />
              <span>
                Reward: {achievement.reward.type} - {achievement.reward.description}
              </span>
            </div>
          )}
          
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="mt-2 text-xs font-[Halogen] text-gray-500">
              Unlocked on {formatDate(achievement.unlockedAt)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementCard; 