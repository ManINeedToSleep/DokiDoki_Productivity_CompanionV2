"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { auth } from '@/lib/firebase';
import { getRemainingMessages, MAX_DAILY_MESSAGES } from '@/lib/firebase/chat';
import { FaComments, FaCalendarDay, FaChartLine } from 'react-icons/fa';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface ChatStatsProps {
  companionId: CompanionId;
  className?: string;
}

export default function ChatStats({ companionId, className = '' }: ChatStatsProps) {
  const [remainingMessages, setRemainingMessages] = useState(MAX_DAILY_MESSAGES);
  const [loading, setLoading] = useState(true);
  const colors = getCharacterColors(companionId);

  useEffect(() => {
    const loadChatStats = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        const remaining = await getRemainingMessages(auth.currentUser.uid);
        setRemainingMessages(remaining);
      } catch (error) {
        console.error("Error loading chat stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatStats();
  }, []);

  // Calculate percentage of messages used
  const usedMessages = MAX_DAILY_MESSAGES - remainingMessages;
  const percentUsed = Math.round((usedMessages / MAX_DAILY_MESSAGES) * 100);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-[Riffic] mb-3" style={{ color: colors.heading }}>
        Chat Stats
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FaComments className="mr-2 text-gray-500" />
              <span className="text-sm font-[Halogen] text-gray-700">Daily Messages</span>
            </div>
            <span className="font-[Halogen] text-gray-800 font-bold">
              {usedMessages}/{MAX_DAILY_MESSAGES}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-gray-200 rounded-full mb-4">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percentUsed}%`,
                backgroundColor: colors.primary
              }}
            ></div>
          </div>
          
          <div className="flex justify-between">
            <div className="text-center bg-gray-100 rounded-lg p-2 flex-1 mr-2">
              <div className="flex justify-center mb-1">
                <FaCalendarDay className="text-gray-500" />
              </div>
              <div className="text-lg font-bold text-gray-800 font-[Halogen]">
                {remainingMessages}
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Remaining Today
              </div>
            </div>
            
            <div className="text-center bg-gray-100 rounded-lg p-2 flex-1">
              <div className="flex justify-center mb-1">
                <FaChartLine className="text-gray-500" />
              </div>
              <div className="text-lg font-bold text-gray-800 font-[Halogen]">
                {percentUsed}%
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Used
              </div>
            </div>
          </div>
          
          {remainingMessages < 10 && (
            <div className="mt-4 text-amber-600 text-xs font-[Halogen] text-center">
              {remainingMessages === 0 
                ? "You've reached your daily limit. Come back tomorrow!" 
                : `Running low on messages today (${remainingMessages} left)`}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
} 