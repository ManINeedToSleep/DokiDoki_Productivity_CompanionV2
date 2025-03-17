"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CompanionId, CompanionMood } from '@/lib/firebase/companion';
import { imagePaths } from '@/components/Common/Paths/ImagePath';

interface CompanionDisplayProps {
  characterId: CompanionId;
  mood?: CompanionMood;
  showSpeechBubble?: boolean;
  speechText?: string;
  onSpeechEnd?: () => void;
  disableAnimation?: boolean;
}

export default function CompanionDisplay({
  characterId,
  mood = 'happy',
  showSpeechBubble = false,
  speechText = '',
  onSpeechEnd,
  disableAnimation = false
}: CompanionDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Character-specific styling
  const getCharacterColor = (id: CompanionId): string => {
    switch (id) {
      case 'sayori': return '#FF9ED2';
      case 'natsuki': return '#FF8DA1';
      case 'yuri': return '#A49EFF';
      case 'monika': return '#85CD9E';
      default: return '#FF9ED2';
    }
  };
  
  // Character-specific font
  const getCharacterFont = (id: CompanionId): string => {
    switch (id) {
      case 'sayori': return 'font-[Halogen]';
      case 'natsuki': return 'font-[RifficFree-Bold]';
      case 'yuri': return 'font-[Halogen]';
      case 'monika': return 'font-[Halogen]';
      default: return 'font-[Halogen]';
    }
  };
  
  // Typing effect for speech bubble
  useEffect(() => {
    if (showSpeechBubble && speechText) {
      setIsTyping(true);
      setDisplayedText('');
      
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < speechText.length) {
          setDisplayedText(prev => prev + speechText.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          
          // Call onSpeechEnd after a delay
          if (onSpeechEnd) {
            setTimeout(onSpeechEnd, 2000);
          }
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }
  }, [showSpeechBubble, speechText, onSpeechEnd]);
  
  // Random idle animations
  const [idleAnimation, setIdleAnimation] = useState(0);
  
  useEffect(() => {
    // Skip animation if disabled
    if (disableAnimation) return;
    
    const interval = setInterval(() => {
      // Random number between 0 and 3
      const randomAnim = Math.floor(Math.random() * 4);
      setIdleAnimation(randomAnim);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [disableAnimation]);
  
  // Get animation based on current idle state
  const getIdleAnimation = () => {
    // Return empty object if animations are disabled
    if (disableAnimation) return {};
    
    switch (idleAnimation) {
      case 0:
        return { y: [0, -10, 0], transition: { duration: 2, ease: "easeInOut" } };
      case 1:
        return { rotate: [0, -5, 0], transition: { duration: 2, ease: "easeInOut" } };
      case 2:
        return { scale: [1, 1.05, 1], transition: { duration: 2, ease: "easeInOut" } };
      case 3:
        return { x: [0, 10, 0], transition: { duration: 2, ease: "easeInOut" } };
      default:
        return { y: [0, -10, 0], transition: { duration: 2, ease: "easeInOut" } };
    }
  };
  
  // Get character sprite path based on mood
  const getCharacterSpritePath = () => {
    // Check if characterId is valid
    const validCharacterId = characterId && imagePaths.characterMoods[characterId] 
      ? characterId 
      : 'sayori'; // Default to sayori if characterId is invalid
    
    // Use a default mood if mood is undefined
    const currentMood = mood || 'happy';
    
    // Return the path, with fallbacks at each level
    return imagePaths.characterMoods[validCharacterId]?.[currentMood] || 
           imagePaths.characterMoods[validCharacterId]?.['happy'] || 
           imagePaths.characterSprites.sayori; // Ultimate fallback
  };
  
  return (
    <div className="relative h-full flex flex-col items-center justify-center">
      {/* Speech bubble */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10 max-w-xs"
          >
            <div 
              className="bg-white rounded-2xl p-4 shadow-lg"
              style={{ borderColor: getCharacterColor(characterId) }}
            >
              <p className={`text-gray-800 ${getCharacterFont(characterId)}`}>
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
              
              {/* Triangle pointer */}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white"
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Character image */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        initial={disableAnimation ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          ...(disableAnimation ? {} : getIdleAnimation())
        }}
        transition={{ duration: disableAnimation ? 0 : 0.5 }}
      >
        <Image
          src={getCharacterSpritePath()}
          alt={`${characterId} character with ${mood || 'happy'} expression`}
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
}
