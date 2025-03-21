"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { useUserData } from '@/lib/stores/userStore';
import { CompanionId } from '@/lib/firebase/companion';
import { ChatMessageType, getChatHistory, MAX_DAILY_MESSAGES } from '@/lib/firebase/chat';
import ChatContainer from '@/components/Chat/ChatContainer';
import ChatStats from '@/components/Chat/ChatStats';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { FaHeart, FaComments, FaCalendarDay, FaClock } from 'react-icons/fa';

export default function ChatPage() {
  const { userData } = useUserData();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [companionId, setCompanionId] = useState<CompanionId | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Get character-specific colors
  const colors = getCharacterColors(companionId || 'sayori');
  const dotColor = getCharacterDotColor(companionId || 'sayori');

  // Load chat history and set selected companion
  useEffect(() => {
    const loadChatData = async () => {
      if (!auth.currentUser || !userData) {
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        // Set selected companion
        const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
        setCompanionId(selectedCompanion);

        // Load chat history
        const history = await getChatHistory(auth.currentUser.uid, selectedCompanion);
        setMessages(history);
        
        // If no messages, show welcome message
        setShowWelcome(history.length === 0);
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [userData]);

  // Get companion stats
  const getCompanionStats = () => {
    if (!userData || !companionId || !userData.companions[companionId]) return null;

    const companion = userData.companions[companionId];
    const level = Math.floor(companion.affinityLevel / 100) + 1;
    const progress = companion.affinityLevel % 100;

    return {
      level,
      progress,
      consecutiveDays: companion.stats.consecutiveDays,
      totalInteractions: companion.stats.totalInteractionTime
    };
  };

  const companionStats = getCompanionStats();
  
  if (!userData || !companionId || isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 overflow-hidden pt-[60px] flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ 
              borderColor: colors.secondary,
              borderTopColor: colors.primary 
            }}
          />
          <p className="text-gray-600 font-[Halogen]">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden pt-[60px]">
      {/* Background */}
      <PolkaDotBackground
        dotColor={dotColor}
        backgroundColor="white"
        dotSize={60}
        spacing={120}
      />

      {/* Main container */}
      <div className="h-full container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Chat section */}
          <div className="lg:col-span-2 h-full">
            <ChatContainer
              companionId={companionId}
              userData={userData}
              showWelcome={showWelcome}
            />
          </div>

          {/* Stats section */}
          <div className="lg:col-span-1 h-full overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {/* Chat stats card */}
            <ChatStats companionId={companionId} />

            {/* Companion stats card */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-[Riffic] mb-3" style={{ color: colors.heading }}>
                Companion Stats
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
                  <FaHeart 
                    className="w-5 h-5 mx-auto mb-1" 
                    style={{ color: colors.text }} 
                  />
                  <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                    {companionStats?.level || 1}
                  </div>
                  <div className="text-xs text-gray-500 font-[Halogen]">
                    Friendship Level
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
                  <FaCalendarDay 
                    className="w-5 h-5 mx-auto mb-1" 
                    style={{ color: colors.text }} 
                  />
                  <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                    {companionStats?.consecutiveDays || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-[Halogen]">
                    Day Streak
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
                  <FaComments 
                    className="w-5 h-5 mx-auto mb-1" 
                    style={{ color: colors.text }} 
                  />
                  <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                    {messages.length}
                  </div>
                  <div className="text-xs text-gray-500 font-[Halogen]">
                    Total Messages
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
                  <FaClock 
                    className="w-5 h-5 mx-auto mb-1" 
                    style={{ color: colors.text }} 
                  />
                  <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                    {Math.floor((companionStats?.totalInteractions || 0) / 60)}
                  </div>
                  <div className="text-xs text-gray-500 font-[Halogen]">
                    Hours Together
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Daily limit info */}
            <motion.div
              className="bg-white rounded-xl shadow-sm p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-lg font-[Riffic] mb-3" style={{ color: colors.heading }}>
                Chat Information
              </h2>
              <p className="text-sm font-[Halogen] text-gray-600">
                You can send up to {MAX_DAILY_MESSAGES} messages per day to your companion.
                Messages reset at midnight in your local time.
              </p>
              <p className="text-sm font-[Halogen] mt-2 text-gray-600">
                Building a strong relationship with your companion unlocks special
                achievements and rewards!
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
