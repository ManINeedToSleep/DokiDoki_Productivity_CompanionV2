"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { auth } from '@/lib/firebase';
import { getRemainingMessages, MAX_DAILY_MESSAGES } from '@/lib/firebase/chat';
import { FaComments, FaCalendarDay, FaChartLine, FaCoins, FaHeart, FaFire } from 'react-icons/fa';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useChatStore } from '@/lib/stores/chatStore';

interface ChatStatsProps {
  companionId: CompanionId;
  className?: string;
}

interface TokenUsage {
  dailyTokens: number;
  lastResetDate: Date;
}

export default function ChatStats({ companionId, className = '' }: ChatStatsProps) {
  const [remainingMessages, setRemainingMessages] = useState(MAX_DAILY_MESSAGES);
  const [totalMessages, setTotalMessages] = useState(0);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [conversationScore, setConversationScore] = useState(0);
  const colors = getCharacterColors(companionId);
  const lastRefreshTime = useRef<number>(0);
  
  // Use the store hook instead of getState() to properly subscribe to state changes
  const messages = useChatStore(state => state.messages[companionId] || []);

  useEffect(() => {
    const loadChatStats = async () => {
      // Prevent refresh if last refresh was less than 10 seconds ago
      const now = Date.now();
      if (now - lastRefreshTime.current < 10000) {
        console.log('📊 ChatStats: Skipping refresh, last refresh was too recent');
        return;
      }
      
      lastRefreshTime.current = now;
      
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        console.log('📊 ChatStats: Loading chat stats for companion', companionId);
        
        // Get remaining messages for today
        const remaining = await getRemainingMessages(auth.currentUser.uid);
        console.log(`📊 ChatStats: User has ${remaining} messages remaining today`);
        setRemainingMessages(remaining);
        
        // Use the messages from the hook instead of direct store access
        const total = messages.length;
        console.log(`📊 ChatStats: User has ${total} total messages with ${companionId}`);
        setTotalMessages(total);

        // Get token usage
        const usageDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'stats', 'tokenUsage'));
        if (usageDoc.exists()) {
          const usage = usageDoc.data() as TokenUsage;
          console.log(`📊 ChatStats: User has used ${usage.dailyTokens} tokens today`);
          setTokenUsage(usage);
        } else {
          console.log('📊 ChatStats: No token usage data found');
        }

        // Get streak information
        try {
          const streakDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'stats', 'streaks'));
          if (streakDoc.exists()) {
            const streakData = streakDoc.data();
            if (streakData[companionId]) {
              setCurrentStreak(streakData[companionId].currentStreak || 0);
            }
          }
        } catch (err) {
          console.error('Error loading streak data:', err);
        }

        // Calculate a "conversation quality" score based on message length, response time, etc.
        if (messages.length > 0) {
          // This is a simplistic scoring that could be improved
          const averageMessageLength = messages.reduce((sum, msg) => 
            sum + msg.content.length, 0) / messages.length;
          
          // Look at recent conversation flow (last 10 messages if available)
          const recentMessages = messages.slice(-Math.min(10, messages.length));
          
          // Check for conversation flow - alternating messages is good
          let flowScore = 0;
          for (let i = 1; i < recentMessages.length; i++) {
            if (recentMessages[i].sender !== recentMessages[i-1].sender) {
              flowScore++;
            }
          }
          
          // Calculate a score out of 100
          const lengthScore = Math.min(100, averageMessageLength / 2);
          const normalizedFlowScore = recentMessages.length > 1 
            ? (flowScore / (recentMessages.length - 1)) * 100 
            : 0;
          
          const finalScore = Math.round((lengthScore * 0.6) + (normalizedFlowScore * 0.4));
          setConversationScore(finalScore);
        }
        
      } catch (error) {
        console.error("❌ ChatStats: Error loading chat stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadChatStats();
    
    // Refresh stats every 5 minutes instead of 30 seconds
    const intervalId = setInterval(loadChatStats, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [companionId, messages]);

  // Calculate percentage of messages used
  const usedMessages = MAX_DAILY_MESSAGES - remainingMessages;
  const percentUsed = Math.round((usedMessages / MAX_DAILY_MESSAGES) * 100);

  // Calculate token usage percentage
  const MAX_DAILY_TOKENS = 100000;
  const tokenUsagePercent = tokenUsage 
    ? Math.round((tokenUsage.dailyTokens / MAX_DAILY_TOKENS) * 100)
    : 0;

  // Get conversation quality description
  const getQualityDescription = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Great";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "New";
  };

  return (
    <motion.div
      className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-5 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
        Chat Stats
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div 
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ 
              borderColor: colors.secondary,
              borderTopColor: colors.primary 
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FaComments className="mr-2" style={{ color: colors.text }} />
              <span className="text-sm font-[Halogen] text-gray-700">Daily Messages</span>
            </div>
            <span className="font-[Halogen] text-gray-800 font-bold">
              {usedMessages}/{MAX_DAILY_MESSAGES}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                backgroundColor: colors.primary
              }}
            ></motion.div>
          </div>

          {/* Token usage */}
          {tokenUsage && (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <FaCoins className="mr-2" style={{ color: colors.text }} />
                  <span className="text-sm font-[Halogen] text-gray-700">Token Usage</span>
                </div>
                <span className="font-[Halogen] text-gray-800 font-bold">
                  {tokenUsage.dailyTokens.toLocaleString()}/{MAX_DAILY_TOKENS.toLocaleString()}
                </span>
              </div>
              
              {/* Token usage progress bar */}
              <div className="h-3 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tokenUsagePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors.primary
                  }}
                ></motion.div>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center bg-gray-50 rounded-lg p-3 flex-1 shadow-sm">
              <div className="flex justify-center mb-1">
                <FaCalendarDay style={{ color: colors.text }} />
              </div>
              <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                {remainingMessages}
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Remaining Today
              </div>
            </div>
            
            <div className="text-center bg-gray-50 rounded-lg p-3 flex-1 shadow-sm">
              <div className="flex justify-center mb-1">
                <FaChartLine style={{ color: colors.text }} />
              </div>
              <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                {totalMessages}
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Total Messages
              </div>
            </div>
          </div>

          {/* New stats section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center bg-gray-50 rounded-lg p-3 flex-1 shadow-sm">
              <div className="flex justify-center mb-1">
                <FaFire style={{ color: colors.text }} />
              </div>
              <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                {currentStreak}
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Day Streak
              </div>
            </div>
            
            <div className="text-center bg-gray-50 rounded-lg p-3 flex-1 shadow-sm">
              <div className="flex justify-center mb-1">
                <FaHeart style={{ color: colors.text }} />
              </div>
              <div className="text-lg font-bold font-[Halogen]" style={{ color: colors.text }}>
                {getQualityDescription(conversationScore)}
              </div>
              <div className="text-xs text-gray-600 font-[Halogen]">
                Conversation Quality
              </div>
            </div>
          </div>
          
          {remainingMessages < 10 && (
            <div 
              className="mt-4 text-xs font-[Halogen] p-2 bg-red-50 rounded-lg text-center"
              style={{ color: colors.text }}
            >
              {remainingMessages === 0 
                ? "You've reached your daily limit. Come back tomorrow!" 
                : `Running low on messages today (${remainingMessages} left)`}
            </div>
          )}

          {tokenUsage && tokenUsage.dailyTokens > MAX_DAILY_TOKENS * 0.8 && (
            <div 
              className="mt-4 text-xs font-[Halogen] p-2 bg-yellow-50 rounded-lg text-center"
              style={{ color: colors.text }}
            >
              {tokenUsage.dailyTokens >= MAX_DAILY_TOKENS
                ? "You've reached your daily token limit. Come back tomorrow!" 
                : `Running low on tokens today (${(MAX_DAILY_TOKENS - tokenUsage.dailyTokens).toLocaleString()} left)`}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
} 