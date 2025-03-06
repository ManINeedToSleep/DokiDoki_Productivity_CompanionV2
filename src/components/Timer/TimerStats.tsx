import React from 'react';
import { motion } from 'framer-motion';
import { TimerStatsProps } from './types';
import { formatTime } from './TimerUtils';

const TimerStats: React.FC<TimerStatsProps> = ({
  totalTimeWorked,
  completedSessions,
  colors
}) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading || colors.text }}>
        Current Session Stats
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-[Halogen] text-gray-600 mb-1">
            Time Focused
          </div>
          <div className="text-xl font-[Riffic]" style={{ color: colors.text }}>
            {formatTime(totalTimeWorked)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-[Halogen] text-gray-600 mb-1">
            Sessions Completed
          </div>
          <div className="text-xl font-[Riffic]" style={{ color: colors.text }}>
            {completedSessions}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TimerStats; 