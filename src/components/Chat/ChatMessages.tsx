"use client";

import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CompanionId } from '@/lib/firebase/companion';
import { getCompanionChibiPath } from '@/components/Common/Paths/ImagePath';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/lib/stores/chatStore';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  companionId: CompanionId;
  showWelcome: boolean;
  isTyping?: boolean;
}

export default function ChatMessages({ 
  messages, 
  companionId, 
  showWelcome,
  isTyping = false 
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const colors = getCharacterColors(companionId);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Deduplicate messages to prevent visual duplicates
  const deduplicatedMessages = useMemo(() => {
    const uniqueMessages = new Map<string, ChatMessageType>();
    
    // Process in reverse to keep most recent version of duplicates
    [...messages].reverse().forEach(message => {
      // For messages with the same ID, keep the most recent one
      if (!uniqueMessages.has(message.id)) {
        uniqueMessages.set(message.id, message);
      }
    });
    
    // Convert back to array and ensure chronological order
    return Array.from(uniqueMessages.values())
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col min-h-full p-4">
        <div className="flex-1">
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-2"
              >
                <Image
                  src={getCompanionChibiPath(companionId)}
                  alt={companionId}
                  width={72}
                  height={72}
                  className="mx-auto mb-2 object-contain w-auto h-auto"
                  priority
                />
                <h3 className="text-lg font-[Riffic] mb-1" style={{ color: colors.heading }}>
                  Welcome to Chat!
                </h3>
                <p className="text-gray-600 font-[Halogen] text-sm">
                  Start a conversation with {companionId} and build your friendship!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          {deduplicatedMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              companionId={companionId}
            />
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 font-[Halogen] text-sm"
            >
              {companionId} is typing...
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>
    </div>
  );
} 