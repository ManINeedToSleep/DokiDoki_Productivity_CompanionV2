import React from 'react';
import { Goal } from '@/lib/firebase/goals';
import GoalCard from './GoalCard';

interface GoalSectionProps {
  title: string;
  goals: Goal[];
  emptyMessage: string;
  colors: {
    heading: string;
    text: string;
    secondary: string;
    primary: string;
    progress: string;
  };
  onComplete: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  isCompanionSection?: boolean;
  companionId?: string;
  isExpired?: boolean;
}

const GoalSection: React.FC<GoalSectionProps> = ({
  title,
  goals,
  emptyMessage,
  colors,
  onComplete,
  onEdit,
  onDelete,
  isCompanionSection = false,
  companionId,
  isExpired = false
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
        {title}
      </h2>
      
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 font-[Halogen]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              colors={colors}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isCompanionGoal={isCompanionSection}
              companionId={companionId}
              isExpired={isExpired}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalSection; 