"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import Image from 'next/image';

interface ReminderNotificationProps {
  title: string;
  message: string;
  companionId?: CompanionId;
  type?: 'inactivity' | 'streak' | 'goal' | 'session' | 'general';
  duration?: number; // in milliseconds
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'center';
}

export default function ReminderNotification({
  title,
  message,
  companionId,
  type = 'general',
  duration = 0, // 0 means it won't auto-close
  onClose,
  onAction,
  actionLabel = 'Start Session',
  position = 'center'
}: ReminderNotificationProps) {
  const [visible, setVisible] = useState(true);

  // Wrap handleClose in useCallback to avoid recreating it on every render
  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for exit animation
    }
  }, [onClose]);

  // Auto-close after duration if duration > 0
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
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
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  // Type-specific styles
  const getTypeInfo = () => {
    switch (type) {
      case 'inactivity':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'bg-yellow-500',
          borderColor: 'border-yellow-400'
        };
      case 'streak':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          color: 'bg-orange-500',
          borderColor: 'border-orange-400'
        };
      case 'goal':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          color: 'bg-blue-500',
          borderColor: 'border-blue-400'
        };
      case 'session':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          ),
          color: 'bg-green-500',
          borderColor: 'border-green-400'
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'bg-pink-500',
          borderColor: 'border-pink-400'
        };
    }
  };

  const typeInfo = getTypeInfo();

  // Get character color based on companionId
  const getCharacterColor = (id?: CompanionId) => {
    if (!id) return '';
    
    switch (id) {
      case 'sayori':
        return 'border-[#FF9ED2]';
      case 'natsuki':
        return 'border-[#FF8DA1]';
      case 'yuri':
        return 'border-[#A49EFF]';
      case 'monika':
        return 'border-[#85CD9E]';
      default:
        return '';
    }
  };

  const characterBorder = getCharacterColor(companionId);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed ${getPositionStyles()} z-50 max-w-md w-full`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${characterBorder || typeInfo.borderColor}`}
          >
            <div className={`px-4 py-3 flex items-center justify-between ${typeInfo.color} text-white`}>
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  {typeInfo.icon}
                </div>
                <h3 className="text-lg font-bold font-[Riffic]">{title}</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {companionId && (
                <div className="flex items-start mb-3">
                  <div className="w-12 h-12 relative mr-3 flex-shrink-0">
                    <Image
                      src={`/images/characters/sprites/${companionId}-Chibi.png`}
                      alt={companionId}
                      className="w-full h-full object-contain"
                      width={48}
                      height={48}
                    />
                  </div>
                  <p className="text-sm text-gray-700">{message}</p>
                </div>
              )}
              
              {!companionId && (
                <p className="text-sm text-gray-700 mb-3">{message}</p>
              )}
              
              {onAction && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAction}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${typeInfo.color} hover:opacity-90 transition-opacity`}
                  >
                    {actionLabel}
                  </button>
                </div>
              )}
            </div>
            
            {duration > 0 && (
              <div className="bg-gray-200 h-1">
                <motion.div 
                  className={`h-full ${typeInfo.color}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 