import React from 'react';
import { motion } from 'framer-motion';

interface AchievementStatsProps {
  unlockedCount: number;
  lockedCount: number;
  completionPercentage: number;
  colors: {
    text: string;
    primary: string;
  };
}

const AchievementStats: React.FC<AchievementStatsProps> = ({
  unlockedCount,
  lockedCount,
  completionPercentage,
  colors
}) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-4 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
            {unlockedCount}
          </div>
          <div className="text-sm font-[Halogen] text-gray-600">
            Unlocked
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
            {lockedCount}
          </div>
          <div className="text-sm font-[Halogen] text-gray-600">
            Locked
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-[Riffic]" style={{ color: colors.text }}>
            {completionPercentage}%
          </div>
          <div className="text-sm font-[Halogen] text-gray-600">
            Completion
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ 
              width: `${completionPercentage}%`,
              backgroundColor: colors.primary
            }}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementStats; 