"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';
import DashboardCard from "@/components/Common/Card/DashboardCard";
import CompanionDisplay from '@/components/Common/CompanionDisplay/CompanionDisplay';
import Button from '@/components/Common/Button/Button';
import Navbar from '@/components/Common/Navbar/Navbar';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';

interface Message {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

const companionColors = {
  monika: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    userBg: 'bg-emerald-500'
  },
  yuri: {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    userBg: 'bg-purple-500'
  },
  natsuki: {
    bg: 'bg-pink-100',
    text: 'text-pink-900',
    userBg: 'bg-pink-500'
  },
  sayori: {
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    userBg: 'bg-sky-500'
  }
} as const;

export default function ChatPage() {
  const { userData } = useUserData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateCompanionTyping = async (text: string) => {
    setIsCompanionTyping(true);
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    setIsCompanionTyping(false);
    return {
      id: Date.now().toString(),
      sender: 'companion' as const,
      text,
      timestamp: new Date()
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    const companionResponse = await simulateCompanionTyping(
      `Hey there! I'm ${userData?.settings?.selectedCompanion}. I'm still learning how to chat, but I'll be fully functional soon!`
    );
    setMessages(prev => [...prev, companionResponse]);
  };

  const currentColors = companionColors[userData?.settings?.selectedCompanion as keyof typeof companionColors] || companionColors.sayori;

  return (
    <div className="min-h-screen relative">
      <PolkaDotBackground />
      <div className="relative z-10 h-full">
        <Navbar />
        <div className="flex min-h-screen pt-16">
          {/* Companion Section */}
          <div className="w-1/3 fixed left-0 top-16 bottom-0 flex items-center justify-center">
            <div className="h-[80vh] w-full relative">
              <CompanionDisplay 
                characterId={userData?.settings?.selectedCompanion || 'sayori'}
              />
            </div>
          </div>

          {/* Chat Section */}
          <main className="w-2/3 ml-[33.333%] px-6 py-8">
            <DashboardCard>
              <div className="h-[calc(100vh-10rem)] flex flex-col">
                <h1 className="text-2xl font-[Riffic] text-pink-700 mb-4">
                  Chat with {userData?.settings?.selectedCompanion}
                </h1>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto mb-4 p-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <div className={`max-w-[70%] p-4 rounded-lg ${
                          message.sender === 'user' 
                            ? `${currentColors.userBg} text-white` 
                            : `${currentColors.bg} ${currentColors.text}`
                        }`}>
                          <p className="font-[Halogen]">{message.text}</p>
                          <p className={`text-xs mt-2 ${
                            message.sender === 'user' 
                              ? 'opacity-70' 
                              : `${currentColors.text} opacity-50`
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isCompanionTyping && (
                      <motion.div
                        key="typing"
                        className="flex justify-start mb-4"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                      >
                        <div className={`${currentColors.bg} ${currentColors.text} p-4 rounded-lg`}>
                          <p className="font-[Halogen]">typing...</p>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 p-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-3 rounded-lg bg-white/50 border border-pink-200 
                      focus:border-pink-400 focus:outline-none font-[Halogen] 
                      text-pink-900 placeholder:text-pink-300"
                    placeholder="Type your message..."
                  />
                  <Button
                    label="Send"
                    disabled={!newMessage.trim() || isCompanionTyping}
                  />
                </form>
              </div>
            </DashboardCard>
          </main>
        </div>
      </div>
    </div>
  );
}
