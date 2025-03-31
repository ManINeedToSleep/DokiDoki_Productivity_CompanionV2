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

  // Get companion's name with proper capitalization
  const companionName = companionId.charAt(0).toUpperCase() + companionId.slice(1);

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
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center py-4 px-6 backdrop-blur-sm bg-white/20 rounded-xl shadow-sm border border-white/10 mb-8"
              >
                <Image
                  src={getCompanionChibiPath(companionId)}
                  alt={companionId}
                  width={96}
                  height={96}
                  className="mx-auto mb-3 object-contain w-auto h-auto drop-shadow-md"
                  priority
                />
                <h3 className="text-lg font-[Riffic] mb-2" style={{ color: colors.heading }}>
                  Welcome to Chat with {companionName}!
                </h3>
                <p className="text-gray-600 font-[Halogen] text-sm">
                  Start a conversation and build your friendship! {companionName} is excited to talk with you.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          {deduplicatedMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index === deduplicatedMessages.length - 1 ? 0.1 : 0 
              }}
            >
              <ChatMessage
                message={message}
                companionId={companionId}
              />
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center text-gray-500 font-[Halogen] text-sm max-w-[80%] rounded-lg p-2.5 shadow-sm border-l-4"
              style={{ 
                borderColor: colors.primary,
                backgroundColor: colors.secondary,
                color: colors.text
              }}
            >
              <div className="flex gap-1 items-center">
                <Image
                  src={getCompanionChibiPath(companionId)}
                  alt={companionId}
                  width={24}
                  height={24}
                  className="mr-2 object-contain"
                />
                <span>{companionName} is typing</span>
                <span className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.5, 1] }}
                    className="text-sm"
                  >•</motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.5, 1], delay: 0.4 }}
                    className="text-sm"
                  >•</motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", times: [0, 0.5, 1], delay: 0.8 }}
                    className="text-sm"
                  >•</motion.span>
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>
    </div>
  );
} 