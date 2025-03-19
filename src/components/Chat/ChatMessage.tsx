"use client";

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

      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };
  
  return (
    <div className={`mb-2 flex ${isCompanion ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] rounded-lg p-2.5 shadow-sm border-l-4 ${
          isCompanion 
            ? `${font}`
            : 'bg-gray-100 text-gray-800'
        }`}
        style={{ 
          borderColor: isCompanion ? colors.primary : 'transparent',
          backgroundColor: isCompanion ? colors.secondary : undefined,
          color: isCompanion ? colors.text : undefined
        }}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        <div 
          className={`text-[10px] mt-1 text-right ${
            isCompanion ? 'text-opacity-75' : 'text-gray-500'
          }`} 
          style={{ color: isCompanion ? colors.text : undefined }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
} 