import React from 'react';
import { motion } from 'framer-motion';
import { Goal } from '@/lib/firebase/goals';
import { FaCheck, FaTrash, FaEdit, FaTrophy } from 'react-icons/fa';
import Image from 'next/image';
import GoalTypeBadge from './GoalTypeBadge';
import { formatDate, isSystemGoal } from './GoalUtils';

interface GoalCardProps {
  goal: Goal;
  colors: {
    text: string;
    progress: string;
    secondary: string;
    primary?: string;
  };
  onComplete: (goalId: string) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  isCompanionGoal?: boolean;
  companionId?: string;
  isExpired?: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  colors,
  onComplete,
  onEdit,
  onDelete,
  isCompanionGoal = false,
  companionId,
  isExpired = false
}) => {
  const cardClasses = `bg-white rounded-xl shadow-md p-4 ${isExpired ? 'opacity-60' : ''} ${goal.completed ? 'opacity-75' : ''}`;
  
  return (
    <motion.div 
      key={goal.id}
      className={isCompanionGoal || (!isExpired && !goal.completed) ? `${cardClasses} border-l-4` : cardClasses}
      style={isCompanionGoal || (!isExpired && !goal.completed) ? { borderLeftColor: colors.primary } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isExpired ? 0.6 : goal.completed ? 0.75 : 1, y: 0 }}
      whileHover={!isExpired && !goal.completed ? { scale: 1.01 } : {}}
    >
      <div className="flex justify-between items-start">
        <div className={`${isCompanionGoal ? 'flex gap-3' : ''}`}>
          {isCompanionGoal && companionId && (
            <div className="w-8 h-8 relative" style={{ marginTop: '-4px' }}>
              <Image
                src={`/images/characters/sprites/${companionId}-Chibi.png`}
                alt={companionId}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <h3 
                className={`text-lg font-[Riffic] ${goal.completed ? 'line-through' : ''} ${isExpired ? 'text-red-500' : ''}`} 
                style={!isExpired && !goal.completed ? { color: colors.text } : {}}
              >
                {goal.title}
              </h3>
              {!goal.completed && <GoalTypeBadge type={goal.type} />}
            </div>
            <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
            
            <div className="flex items-center gap-4 mb-2">
              <div>
                <span className={`text-xs font-[Halogen] ${isExpired || goal.completed ? 'text-gray-500' : ''}`} 
                  style={!isExpired && !goal.completed ? { color: colors.text } : {}}>
                  Progress
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isExpired ? 'bg-red-300' : ''}`}
                      style={!isExpired ? { 
                        width: `${Math.min(100, ((goal.completed ? goal.targetMinutes : goal.currentMinutes) / goal.targetMinutes) * 100)}%`,
                        backgroundColor: goal.completed ? colors.progress : isExpired ? undefined : colors.progress
                      } : { 
                        width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className={`text-xs font-[Halogen] ${isExpired ? 'text-red-500' : ''}`} 
                    style={!isExpired && !goal.completed ? { color: colors.text } : {}}>
                    {goal.completed ? goal.targetMinutes : goal.currentMinutes}/{goal.targetMinutes} min
                  </span>
                </div>
              </div>
              
              {!goal.completed && (
                <div>
                  <span className={`text-xs font-[Halogen] ${isExpired ? 'text-gray-500' : ''}`} 
                    style={!isExpired ? { color: colors.text } : {}}>
                    {isExpired ? 'Expired' : 'Deadline'}
                  </span>
                  <div className={`text-xs font-[Halogen] flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`} 
                    style={!isExpired ? { color: colors.text } : {}}>
                    {formatDate(goal.deadline.toDate())}
                    {!isExpired && goal.type === 'daily' && <span className="text-yellow-500">· Today</span>}
                    {!isExpired && goal.type === 'weekly' && <span className="text-blue-500">· This Week</span>}
                    {!isExpired && goal.type === 'challenge' && <span className="text-purple-500">· Challenge</span>}
                    {!isExpired && goal.type === 'custom' && <span className="text-green-500">· Custom</span>}
                  </div>
                </div>
              )}
            </div>
            
            {goal.reward && !goal.completed && !isExpired && (
              <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                style={{ backgroundColor: colors.secondary, color: colors.text }}>
                <FaTrophy size={12} />
                <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
              </div>
            )}
          </div>
        </div>
        
        {!goal.completed && (
          <div className="flex gap-2">
            {!isExpired && (
              <button
                onClick={() => onComplete(goal.id)}
                className="p-2 rounded-full hover:bg-green-100 transition-colors"
                title="Mark as Complete"
                disabled={goal.currentMinutes < goal.targetMinutes}
                style={{ 
                  opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                  cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                }}
              >
                <FaCheck className="text-green-500" />
              </button>
            )}
            
            {!isSystemGoal(goal) && !isExpired && onEdit && (
              <button
                onClick={() => onEdit(goal)}
                className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                title="Edit Goal"
              >
                <FaEdit className="text-blue-500" />
              </button>
            )}
            
            {(!isSystemGoal(goal) || isExpired) && onDelete && (
              <button
                onClick={() => onDelete(goal.id)}
                className="p-2 rounded-full hover:bg-red-100 transition-colors"
                title="Delete Goal"
              >
                <FaTrash className="text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GoalCard; 