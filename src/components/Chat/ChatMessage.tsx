"use client";

import { CompanionId } from '@/lib/firebase/companion';
import { Timestamp } from '@/lib/firebase';

export interface ChatMessageType {
  id: string;
  sender: 'user' | 'companion';
  content: string;
  timestamp: Timestamp;
  companionId: CompanionId;
}

interface ChatMessageProps {
  message: ChatMessageType;
  companionId: CompanionId;
}

export default function ChatMessage({ message, companionId }: ChatMessageProps) {
  const getCharacterColor = (id: CompanionId): string => {
    switch (id) {
      case 'sayori': return '#FF9ED2';
      case 'natsuki': return '#FF8DA1';
      case 'yuri': return '#A49EFF';
      case 'monika': return '#85CD9E';
      default: return '#FF9ED2';
    }
  };
  
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
  const color = getCharacterColor(companionId);
  const font = getCharacterFont(companionId);
  
  // Format timestamp
  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  return (
    <div className={`mb-4 flex ${isCompanion ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
          isCompanion 
            ? `bg-white border-l-4 ${font}`
            : 'bg-gray-100 text-gray-800'
        }`}
        style={{ 
          borderColor: isCompanion ? color : undefined,
        }}
      >
        <div className="text-sm md:text-base">{message.content}</div>
        <div className="text-xs text-gray-500 mt-1 text-right">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
} 