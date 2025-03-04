"use client";

import { motion } from 'framer-motion';
import { FaMedal, FaArrowRight } from 'react-icons/fa';
import { UserDocument } from '@/lib/firebase/user';
import { Achievement } from '@/lib/firebase/achievements';
import { useRouter } from 'next/navigation';
import { CompanionId } from '@/lib/firebase/companion';

// Extended Achievement type that includes the unlocked property
interface DisplayAchievement extends Achievement {
  unlocked: boolean;
}

interface AchievementsProps {
  userData: UserDocument | null;
}

export default function Achievements({ userData }: AchievementsProps) {
  const router = useRouter();
  
  if (!userData) return null;
  
  const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
  
  // Get character-specific colors
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2'
        };
      case 'natsuki':
        return { 
          primary: '#FF8DA1',
          secondary: '#FFF0F0',
          text: '#D14D61',
          heading: '#FF8DA1'
        };
      case 'yuri':
        return { 
          primary: '#A49EFF',
          secondary: '#F0F0FF',
          text: '#6A61E0',
          heading: '#A49EFF'
        };
      case 'monika':
        return { 
          primary: '#85CD9E',
          secondary: '#F0FFF5',
          text: '#4A9B68',
          heading: '#85CD9E'
        };
      default:
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2'
        };
    }
  };
  
  const colors = getCharacterColors(selectedCompanion);
  
  // For demo purposes, create some sample achievements
  // In a real app, these would come from userData.achievements
  const recentAchievements: DisplayAchievement[] = [
    {
      id: 'first_session',
      title: 'First Step',
      description: 'Complete your first focus session',
      icon: '⭐',
      type: 'focus',
      unlockedAt: null,
      unlocked: true,
      requirement: { type: 'minutes', value: 1 }
    },
    {
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day focus streak',
      icon: '📅',
      type: 'streak',
      unlockedAt: null,
      unlocked: true,
      requirement: { type: 'streak', value: 7 }
    },
    {
      id: 'dedication',
      title: 'Dedicated Student',
      description: 'Accumulate 10 hours of focus time',
      icon: '📚',
      type: 'focus',
      unlockedAt: null,
      unlocked: true,
      requirement: { type: 'minutes', value: 600 }
    }
  ];
  
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
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <FaMedal className="mx-auto text-gray-300 mb-2" size={24} />
          <p className="text-gray-700 text-sm font-[Halogen]">No achievements yet</p>
          <button 
            className="mt-2 text-xs hover:underline font-[Halogen]"
            style={{ color: colors.text }}
            onClick={() => router.push('/dashboard/achievements')}
          >
            View all achievements
          </button>
        </div>
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
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          badge: 'bg-pink-100 text-pink-600'
        };
      case 'natsuki':
        return { 
          primary: '#FF8DA1',
          secondary: '#FFF0F0',
          text: '#D14D61',
          badge: 'bg-red-100 text-red-600'
        };
      case 'yuri':
        return { 
          primary: '#A49EFF',
          secondary: '#F0F0FF',
          text: '#6A61E0',
          badge: 'bg-indigo-100 text-indigo-600'
        };
      case 'monika':
        return { 
          primary: '#85CD9E',
          secondary: '#F0FFF5',
          text: '#4A9B68',
          badge: 'bg-green-100 text-green-600'
        };
      default:
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          badge: 'bg-pink-100 text-pink-600'
        };
    }
  };
  
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