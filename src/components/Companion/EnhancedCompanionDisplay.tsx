"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanionId, CompanionMood } from '@/lib/firebase/companion';
import { getCompanionImagePath } from '@/components/Common/Paths/ImagePath';

interface EnhancedCompanionDisplayProps {
  companionId: CompanionId;
  mood?: CompanionMood;
  position?: 'center' | 'left' | 'right';
  size?: 'normal' | 'large';
  animate?: boolean;
  className?: string;
}

const EnhancedCompanionDisplay: React.FC<EnhancedCompanionDisplayProps> = ({
  companionId,
  position = 'center',
  size = 'normal',
  animate = false,
  className = ''
}) => {
  const [imageSrc, setImageSrc] = useState('');
  
  // Get character image path
  useEffect(() => {
    const path = getCompanionImagePath(companionId);
    setImageSrc(path);
  }, [companionId]);
  
  // Calculate position class based on position prop
  const getPositionClass = () => {
    switch (position) {
      case 'left':
        return 'left-10';
      case 'right':
        return 'right-10';
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };
  
  // Calculate size based on size prop
  const getSize = () => {
    return size === 'large' ? { width: 600, height: 800 } : { width: 500, height: 700 };
  };
  
  // No idle animation by default
  const idleAnimation = animate ? {
    y: [0, -5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};
  
  const dimensions = getSize();
  const positionClass = getPositionClass();
  
  return (
    <AnimatePresence>
      <motion.div
        className={`absolute bottom-0 ${positionClass} ${className}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          ...idleAnimation
        }}
        exit={{ opacity: 0, y: 50 }}
      >
        {imageSrc && (
          <div 
            style={{ 
              width: dimensions.width, 
              height: dimensions.height, 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Image
              src={imageSrc}
              alt={`${companionId} character`}
              fill
              priority
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center top'
              }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedCompanionDisplay; 