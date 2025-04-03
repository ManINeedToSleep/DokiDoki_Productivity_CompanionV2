"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '@/lib/firebase/goals';
import { CompanionId } from '@/lib/firebase/companion';
import Image from 'next/image';

type GoalAction = 'completed' | 'added' | 'updated' | 'removed' | 'progress';

interface GoalNotificationProps {
  goal: Goal;
  action: GoalAction;
  companionId?: CompanionId;
  progress?: number; // percentage for progress updates
  duration?: number; // in milliseconds
  onClose?: () => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export default function GoalNotification({
  goal,
  action,
  companionId,
  progress,
  duration = 5000,
  onClose,
  position = 'top-right'
}: GoalNotificationProps) {
  const [visible, setVisible] = useState(true);

  // Wrap handleClose in useCallback to avoid recreating it on every render
  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for exit animation
    }
  }, [onClose]);

  // Auto-close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

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
      default:
        return 'top-4 right-4';
    }
  };

  // Action-specific styles and content
  const getActionInfo = () => {
    switch (action) {
      case 'completed':
        return {
          title: 'Goal Completed!',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          color: 'bg-green-500',
          message: `You've completed "${goal.title}"!`
        };
      case 'added':
        return {
          title: 'Goal Added',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          ),
          color: 'bg-blue-500',
          message: `New goal added: "${goal.title}"`
        };
      case 'updated':
        return {
          title: 'Goal Updated',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          ),
          color: 'bg-yellow-500',
          message: `Goal "${goal.title}" has been updated`
        };
      case 'removed':
        return {
          title: 'Goal Removed',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          color: 'bg-red-500',
          message: `Goal "${goal.title}" has been removed`
        };
      case 'progress':
        return {
          title: 'Goal Progress',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          color: 'bg-indigo-500',
          message: `Progress update for "${goal.title}": ${progress}%`
        };
      default:
        return {
          title: 'Goal Update',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          color: 'bg-gray-500',
          message: `Update for goal "${goal.title}"`
        };
    }
  };

  const actionInfo = getActionInfo();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed ${getPositionStyles()} z-50 w-72`}
          initial={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className={`px-4 py-3 flex items-center justify-between ${actionInfo.color} text-white`}>
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  {actionInfo.icon}
                </div>
                <h3 className="text-sm font-bold">{actionInfo.title}</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-700">{actionInfo.message}</p>
              
              {action === 'progress' && progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(goal.currentMinutes)} / {goal.targetMinutes} minutes</p>
                </div>
              )}
              
              {companionId && (
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center">
                  <div className="w-6 h-6 relative mr-2">
                    <Image
                      src={`/images/characters/sprites/${companionId}-Chibi.png`}
                      alt={companionId}
                      className="w-full h-full object-contain"
                      width={24}
                      height={24}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {action === 'completed' ? 'Great job!' : 'Keep going!'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-200 h-1">
              <motion.div 
                className={`h-full ${actionInfo.color}`}
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