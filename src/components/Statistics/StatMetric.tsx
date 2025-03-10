"use client";

import { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface StatMetricProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  companionId?: CompanionId;
  index?: number; // For staggered animations
  trend?: {
    value: number; // Percentage increase/decrease
    isPositive: boolean;
  };
}

export default function StatMetric({
  title,
  value,
  icon,
  description,
  companionId = 'sayori',
  index = 0,
  trend
}: StatMetricProps) {
  const colors = getCharacterColors(companionId);
  
  useEffect(() => {
    console.log(`📊 StatMetric: Displaying "${title}" with value:`, value);
  }, [title, value]);
  
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border-2"
      style={{ borderColor: colors.secondary }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center mb-2">
        <div style={{ color: colors.text }}>
          {icon}
        </div>
        <h3 className="text-sm font-[Halogen] ml-2" style={{ color: colors.heading }}>
          {title}
        </h3>
      </div>
      
      <div className="flex items-end">
        <div className="text-2xl font-bold font-[Halogen]" style={{ color: colors.text }}>
          {value}
        </div>
        
        {trend && (
          <div className={`ml-2 text-xs flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      {description && (
        <div className="text-xs text-gray-700 mt-1">
          {description}
        </div>
      )}
    </motion.div>
  );
} 