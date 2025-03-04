"use client";

import { motion } from 'framer-motion';
import { FaClock, FaFire, FaCheckCircle } from 'react-icons/fa';
import { UserDocument } from '@/lib/firebase/user';
import { CompanionId } from '@/lib/firebase/companion';

interface QuickStatsProps {
  userData: UserDocument | null;
}

export default function QuickStats({ userData }: QuickStatsProps) {
  if (!userData) return null;
  
  const { focusStats } = userData;
  const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
  
  // Format time (convert seconds to hours and minutes)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
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
  
  const stats = [
    {
      label: "Today's Focus",
      value: formatTime(focusStats.todaysFocusTime),
      icon: <FaClock className="text-pink-500" size={20} />,
      color: selectedCompanion === 'sayori' ? 'bg-pink-100' :
             selectedCompanion === 'natsuki' ? 'bg-red-100' :
             selectedCompanion === 'yuri' ? 'bg-indigo-100' :
             'bg-green-100'
    },
    {
      label: "Weekly Streak",
      value: `${focusStats.weekStreak} days`,
      icon: <FaFire className="text-orange-500" size={20} />,
      color: 'bg-orange-100'
    },
    {
      label: "Completed Sessions",
      value: focusStats.completedSessions,
      icon: <FaCheckCircle className="text-green-500" size={20} />,
      color: 'bg-green-100'
    }
  ];
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h2 
        className="text-lg font-[Riffic] mb-3"
        style={{ color: colors.heading }}
      >
        Quick Stats
      </h2>
      
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            className={`${stat.color} rounded-lg p-3 flex flex-col items-center justify-center text-center`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + (index * 0.1) }}
          >
            <div className="mb-1">{stat.icon}</div>
            <div className="text-lg font-bold text-gray-800 font-[Halogen]">{stat.value}</div>
            <div className="text-xs text-gray-700 font-[Halogen]">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 