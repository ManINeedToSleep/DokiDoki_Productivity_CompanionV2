"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { Timestamp } from 'firebase/firestore';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { ChatMessage as ChatMessageType } from '@/lib/stores/chatStore';

interface ChatMessageProps {
  message: ChatMessageType;
  companionId: CompanionId;
}

export default function ChatMessage({ message, companionId }: ChatMessageProps) {
  const colors = getCharacterColors(companionId);
  const [showTime, setShowTime] = useState(false);
  
  const getCharacterFont = (id: CompanionId): string => {
    switch (id) {
      case 'sayori': return 'font-[Halogen]';
      case 'natsuki': return 'font-[RifficFree-Bold]';
      case 'yuri': return 'font-[Halogen]';
      case 'monika': return 'font-[Halogen]';
      default: return 'font-[Halogen]';
    }
  };
  
  const isCompanion = message.sender === 'companion';
  const font = getCharacterFont(companionId);
  
  // Format timestamp
  const formatTime = (timestamp: Timestamp | null) => {
    try {
      if (!timestamp) {
        return '';
      }

      // Ensure we have a valid Timestamp object
      const validTimestamp = timestamp instanceof Timestamp 
        ? timestamp 
        : Timestamp.fromDate(new Date(timestamp));

      // Get the date object
      const date = validTimestamp.toDate();

      // Validate the date
      if (isNaN(date.getTime())) {
        console.error('Invalid date from timestamp:', timestamp);
        return '';
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if it's today, yesterday, or another day
      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();
      
      let prefix = '';
      if (isToday) {
        prefix = 'Today, ';
      } else if (isYesterday) {
        prefix = 'Yesterday, ';
      } else {
        // Format date as MM/DD
        prefix = `${date.getMonth() + 1}/${date.getDate()}, `;
      }
      
      return prefix + new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  // Calculate max width based on message sender
  const maxWidthClass = isCompanion ? 'max-w-[85%]' : 'max-w-[75%]';

  // Get bubble styling depending on type
  const getBubbleStyle = () => {
    if (isCompanion) {
      return {
        backgroundColor: colors.secondary,
        borderColor: colors.primary,
        color: colors.text,
        borderWidth: '2px',
        borderLeftWidth: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      };
    } else {
      return {
        backgroundColor: 'rgb(243, 244, 246)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        borderColor: 'rgb(229, 231, 235)',
        borderWidth: '1px'
      };
    }
  };

  // Animation settings
  const animationVariants = {
    hidden: {
      opacity: 0,
      x: isCompanion ? -20 : 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <div className={`my-3 flex ${isCompanion ? 'justify-start' : 'justify-end'}`}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={animationVariants}
        className={`${maxWidthClass} rounded-2xl p-3 shadow-sm border ${
          isCompanion 
            ? `${font}`
            : 'text-gray-800'
        }`}
        style={getBubbleStyle()}
        onClick={() => setShowTime(!showTime)}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        
        <motion.div 
          className={`text-[10px] mt-1.5 text-right ${
            isCompanion ? 'text-opacity-70' : 'text-gray-500'
          }`} 
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: showTime ? 1 : 0.6, 
            height: 'auto',
            transition: { duration: 0.2 }
          }}
          style={{ color: isCompanion ? colors.text : undefined }}
        >
          {formatTime(message.timestamp)}
        </motion.div>
      </motion.div>
    </div>
  );
} 