"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getSceneBackgroundPath } from '@/components/Common/Paths/ImagePath';

interface SceneBackgroundProps {
  backgroundId: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  children?: React.ReactNode;
}

const SceneBackground: React.FC<SceneBackgroundProps> = ({
  backgroundId = 'classroom',
  timeOfDay = 'afternoon',
  children
}) => {
  // Get the background path using the helper function
  const backgroundPath = getSceneBackgroundPath(backgroundId);
  
  // Apply time of day modifications (brightness/overlay filters)
  const getTimeOfDayStyles = () => {
    switch(timeOfDay) {
      case 'morning':
        return { 
          filter: 'brightness(1.1) saturate(1.1)',
          overlay: 'bg-yellow-500/10'
        };
      case 'afternoon':
        return { 
          filter: 'brightness(1) saturate(1)',
          overlay: 'bg-transparent'
        };
      case 'evening':
        return { 
          filter: 'brightness(0.9) saturate(0.9)',
          overlay: 'bg-orange-500/20'
        };
      case 'night':
        return { 
          filter: 'brightness(0.7) saturate(0.8)',
          overlay: 'bg-blue-900/30'
        };
      default:
        return { 
          filter: 'brightness(1) saturate(1)',
          overlay: 'bg-transparent'
        };
    }
  };
  
  const timeStyles = getTimeOfDayStyles();
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full h-full" style={{ filter: timeStyles.filter }}>
          <Image 
            src={backgroundPath}
            alt={`${backgroundId} background`}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        
        {/* Time of day overlay */}
        <div className={`absolute inset-0 ${timeStyles.overlay}`} />
      </motion.div>
      
      {/* Children (character, dialogue, etc.) */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default SceneBackground; 