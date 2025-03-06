import React from 'react';
import { FaSun, FaCalendarWeek, FaStar, FaUser } from 'react-icons/fa';

type GoalType = 'daily' | 'weekly' | 'challenge' | 'custom';

interface GoalTypeBadgeProps {
  type: GoalType;
}

const GoalTypeBadge: React.FC<GoalTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'daily':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-yellow-100 text-yellow-800">
          <FaSun size={10} />
          Daily
        </span>
      );
    case 'weekly':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-blue-100 text-blue-800">
          <FaCalendarWeek size={10} />
          Weekly
        </span>
      );
    case 'challenge':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-purple-100 text-purple-800">
          <FaStar size={10} />
          Challenge
        </span>
      );
    case 'custom':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-green-100 text-green-800">
          <FaUser size={10} />
          Custom
        </span>
      );
  }
};

export default GoalTypeBadge; 