"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CompanionId } from '@/lib/firebase/companion';

interface DialogueNotificationProps {
  companionId: CompanionId;
  message: string;
  duration?: number; // in milliseconds
  onClose?: () => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' | 'bottom-center';
}

export default function DialogueNotification({
  companionId,
  message,
  duration = 5000,
  onClose,
  position = 'bottom-right'
}: DialogueNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [typing, setTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get character name and color based on companionId
  const getCharacterInfo = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { name: 'Sayori', color: '#FF9ED2', fontFamily: 's1' };
      case 'natsuki':
        return { name: 'Natsuki', color: '#FF8DA1', fontFamily: 'n1' };
      case 'yuri':
        return { name: 'Yuri', color: '#A49EFF', fontFamily: 'y1' };
      case 'monika':
        return { name: 'Monika', color: '#85CD9E', fontFamily: 'm1' };
      default:
        return { name: 'Unknown', color: '#FFFFFF', fontFamily: 'Arial' };
    }
  };

  const characterInfo = getCharacterInfo(companionId);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for exit animation
    }
  }, [onClose]);

  // Typing effect
  useEffect(() => {
    if (currentIndex < message.length) {
      const typingSpeed = 30; // ms per character
      const timer = setTimeout(() => {
        setDisplayedText(message.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timer);
    } else {
      setTyping(false);
      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, message, duration, handleClose]);

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
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed ${getPositionStyles()} z-50 max-w-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border-2" style={{ borderColor: characterInfo.color }}>
            {/* Character name */}
            <div className="px-4 py-2" style={{ backgroundColor: characterInfo.color }}>
              <h3 className="text-lg font-bold text-white">{characterInfo.name}</h3>
            </div>
            
            {/* Message content */}
            <div className="p-4 flex items-start">
              <div className="w-12 h-12 relative mr-3 flex-shrink-0">
                <Image
                  src={`/images/characters/sprites/${companionId}-Chibi.png`}
                  alt={characterInfo.name}
                  width={48}
                  height={48}
                  className="object-contain z-10 relative"
                />
              </div>
              <p 
                className={`text-white ${
                  companionId === 'natsuki' 
                    ? 'text-sm' 
                    : 'text-base'
                }`}
                style={{ fontFamily: characterInfo.fontFamily }}
              >
                {displayedText}
                {typing && <span className="animate-pulse">|</span>}
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Close notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
