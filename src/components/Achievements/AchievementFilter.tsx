import React from 'react';

type AchievementStatusFilter = 'all' | 'unlocked' | 'locked';
type AchievementTypeFilter = 'all' | 'focus' | 'streak' | 'companion' | 'goal' | 'hidden';

interface AchievementFilterProps {
  statusFilter: AchievementStatusFilter;
  typeFilter: AchievementTypeFilter;
  onStatusFilterChange: (filter: AchievementStatusFilter) => void;
  onTypeFilterChange: (filter: AchievementTypeFilter) => void;
  colors: {
    primary: string;
  };
}

const AchievementFilter: React.FC<AchievementFilterProps> = ({
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  colors
}) => {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {/* Status Filter */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: colors.primary }}>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${statusFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: statusFilter === 'all' ? colors.primary : 'transparent' }}
          onClick={() => onStatusFilterChange('all')}
        >
          All
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${statusFilter === 'unlocked' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: statusFilter === 'unlocked' ? colors.primary : 'transparent' }}
          onClick={() => onStatusFilterChange('unlocked')}
        >
          Unlocked
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${statusFilter === 'locked' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: statusFilter === 'locked' ? colors.primary : 'transparent' }}
          onClick={() => onStatusFilterChange('locked')}
        >
          Locked
        </button>
      </div>
      
      {/* Type Filter */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: colors.primary }}>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: typeFilter === 'all' ? colors.primary : 'transparent' }}
          onClick={() => onTypeFilterChange('all')}
        >
          All Types
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'focus' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: typeFilter === 'focus' ? colors.primary : 'transparent' }}
          onClick={() => onTypeFilterChange('focus')}
        >
          Focus
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'streak' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: typeFilter === 'streak' ? colors.primary : 'transparent' }}
          onClick={() => onTypeFilterChange('streak')}
        >
          Streak
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'companion' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: typeFilter === 'companion' ? colors.primary : 'transparent' }}
          onClick={() => onTypeFilterChange('companion')}
        >
          Companion
        </button>
        <button 
          className={`px-3 py-1 text-sm font-[Halogen] ${typeFilter === 'goal' ? 'text-white' : 'text-gray-700'}`}
          style={{ backgroundColor: typeFilter === 'goal' ? colors.primary : 'transparent' }}
          onClick={() => onTypeFilterChange('goal')}
        >
          Goal
        </button>
      </div>
    </div>
  );
};

export default AchievementFilter; 