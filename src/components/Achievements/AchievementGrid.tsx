import React from 'react';
import AchievementCard, { DisplayAchievement } from './AchievementCard';

interface AchievementGridProps {
  achievements: DisplayAchievement[];
  colors: {
    text: string;
    secondary: string;
    primary: string;
  };
}

const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  colors
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
        {achievements.map((achievement) => (
          <AchievementCard 
            key={achievement.id}
            achievement={achievement}
            colors={colors}
          />
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 font-[Halogen]">No achievements found with the selected filters.</p>
        </div>
      )}
    </>
  );
};

export default AchievementGrid; 