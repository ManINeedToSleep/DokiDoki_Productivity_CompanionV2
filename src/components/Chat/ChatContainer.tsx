"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import { useChatStore, useSyncChatData } from '@/lib/stores/chatStore';

interface ChatContainerProps {
  companionId: CompanionId;
  userData: UserDocument | null;
  showWelcome?: boolean;
}

export default function ChatContainer({
  companionId,
  userData,
  showWelcome = false
}: ChatContainerProps) {
  const colors = getCharacterColors(companionId);
  const [newMessage, setNewMessage] = useState('');
  
  // Get chat store
  const { 
    messages, 
    addMessage, 
    isTyping,
    refreshChatData 
  } = useChatStore();
  
  // Use sync hook
  useSyncChatData();
  
  // Load chat history when component mounts
  useEffect(() => {
    if (userData) {
      refreshChatData(userData.base.uid, companionId);
    }
  }, [userData, companionId, refreshChatData]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userData) return;
    
    await addMessage(userData.base.uid, companionId, newMessage);
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };
  
  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg h-[calc(100vh-8rem)] flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-[Riffic] mb-8" style={{ color: colors.heading }}>
        Chat with {companionId.charAt(0).toUpperCase() + companionId.slice(1)}
      </h1>

      <ChatMessages
        messages={messages[companionId] || []}
        companionId={companionId}
        isTyping={isTyping}
        showWelcome={showWelcome}
      />

      <ChatInput
        value={newMessage}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        isLoading={isTyping}
        companionId={companionId}
      />
    </motion.div>
  );
} 