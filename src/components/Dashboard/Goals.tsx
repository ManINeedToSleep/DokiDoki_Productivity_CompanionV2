"use client";

import { motion } from 'framer-motion';
import { FaTrophy, FaArrowRight } from 'react-icons/fa';
import { UserDocument } from '@/lib/firebase/user';
import { Goal } from '@/lib/firebase/goals';
import { useRouter } from 'next/navigation';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface GoalsProps {
  userData: UserDocument | null;
}

export default function Goals({ userData }: GoalsProps) {
  const router = useRouter();
  
  if (!userData) return null;
  
  const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
  
  // Get character-specific colors
  const colors = getCharacterColors(selectedCompanion);
  
  // Get active goals (not completed and not expired)
  const activeGoals = userData.goals?.list?.filter(goal => 
    !goal.completed && new Date(goal.deadline.toDate()) > new Date()
  ) || [];
  
  // Sort by deadline (closest first)
  activeGoals.sort((a, b) => 
    a.deadline.toDate().getTime() - b.deadline.toDate().getTime()
  );
  
  // Take only the first 3
  const displayGoals = activeGoals.slice(0, 3);
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 
          className="text-lg font-[Riffic]"
          style={{ color: colors.heading }}
        >
          Current Goals
        </h2>
        <motion.button 
          className="text-xs flex items-center gap-1 font-[Halogen]"
          style={{ color: colors.text }}
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push('/dashboard/goals')}
        >
          View All <FaArrowRight size={10} />
        </motion.button>
      </div>
      
      {displayGoals.length > 0 ? (
        <div className="space-y-3">
          {displayGoals.map((goal, index) => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              index={index} 
              companionId={selectedCompanion}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <FaTrophy className="mx-auto text-gray-300 mb-2" size={24} />
          <p className="text-gray-700 text-sm font-[Halogen]">No active goals</p>
          <button 
            className="mt-2 text-xs hover:underline font-[Halogen]"
            style={{ color: colors.text }}
            onClick={() => router.push('/dashboard/goals')}
          >
            Create a new goal
          </button>
        </div>
      )}
    </motion.div>
  );
}

interface GoalItemProps {
  goal: Goal;
  index: number;
  companionId: CompanionId;
}

function GoalItem({ goal, index, companionId }: GoalItemProps) {
  // Get character-specific colors
  const colors = getCharacterColors(companionId);
  
  // Calculate progress percentage
  const progress = Math.min(100, Math.round((goal.currentMinutes / goal.targetMinutes) * 100));
  
  // Format deadline
  const deadline = goal.deadline.toDate();
  const formattedDeadline = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(deadline);
  
  // Calculate days remaining
  const today = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <motion.div 
      className="bg-gray-50 rounded-lg p-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + (index * 0.1) }}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-medium text-sm text-gray-800 font-[Halogen]">{goal.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-[Halogen] ${colors.badge}`}>
          {goal.type}
        </span>
      </div>
      
      <div className="text-xs text-gray-700 mb-2 font-[Halogen]">
        Due {formattedDeadline} ({daysRemaining} days left)
      </div>
      
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: colors.progress
          }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-1 text-xs text-gray-700 font-[Halogen]">
        <span>{goal.currentMinutes} mins</span>
        <span>{goal.targetMinutes} mins</span>
      </div>
    </motion.div>
  );
} 