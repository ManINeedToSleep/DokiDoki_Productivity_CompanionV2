"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/firebase/achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  duration?: number; // in milliseconds
  onClose?: () => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'top-center';
}

export default function AchievementNotification({
  achievement,
  duration = 7000,
  onClose,
  position = 'top-center'
}: AchievementNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // Show details after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDetails(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for exit animation
    }
  };

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed ${getPositionStyles()} z-50 w-80`}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707.707-.707A1 1 0 0116 2h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-.707-.293L15 6.414l-.707.707A1 1 0 0113 8h-3a1 1 0 01-1-1V4a1 1 0 011-1h3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white font-[Riffic]">Achievement Unlocked!</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Close notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white px-4 py-3"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 mr-3 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">{achievement.icon}</span>
                    </div>
                    <h4 className="text-lg font-bold text-pink-600">{achievement.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{achievement.description}</p>
                  
                  {achievement.reward && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Reward: {achievement.reward.description}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="bg-pink-700 h-1">
              <motion.div 
                className="bg-pink-400 h-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 