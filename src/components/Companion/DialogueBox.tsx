"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface DialogueBoxProps {
  text: string;
  speakerName: string;
  companionId: CompanionId;
  typingSpeed?: number; // ms per character
  onComplete?: () => void;
  isVisible?: boolean;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  text,
  speakerName,
  companionId,
  typingSpeed = 30,
  onComplete,
  isVisible = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const textRef = useRef(text);
  const colors = getCharacterColors(companionId);
  
  // Handle text change - reset the animation
  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      setDisplayedText('');
      setIsComplete(false);
      setIsTyping(true);
    }
  }, [text]);
  
  // Typewriter effect
  useEffect(() => {
    if (!isVisible || !isTyping) return;
    
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.substring(0, displayedText.length + 1));
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  }, [displayedText, text, typingSpeed, isTyping, onComplete, isVisible]);
  
  // Complete text immediately if clicked during typing
  const handleClick = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-4xl mx-auto relative"
        >
          <div 
            className="bg-white/90 backdrop-blur-sm border-2 rounded-lg p-5 shadow-lg"
            style={{ borderColor: colors.primary }}
            onClick={handleClick}
          >
            {/* Speaker name */}
            <div 
              className="absolute -top-4 left-5 px-3 py-1 rounded-md font-[Riffic]"
              style={{ backgroundColor: colors.primary, color: 'white' }}
            >
              {speakerName}
            </div>
            
            {/* Dialogue text */}
            <p className="font-[Halogen] text-lg mt-2">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
            
            {/* Continue indicator */}
            {isComplete && (
              <div className="text-right mt-2">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="inline-block"
                  style={{ color: colors.text }}
                >
                  ▼
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DialogueBox; 