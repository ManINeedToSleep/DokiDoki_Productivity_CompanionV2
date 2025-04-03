"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import { useChatStore, useSyncChatData } from '@/lib/stores/chatStore';
import { getAllChatMessagesForDebugging, clearChatHistory } from '@/lib/firebase/chat';
import { auth } from '@/lib/firebase';
import { FaSync, FaWrench } from 'react-icons/fa';
import Image from 'next/image';
import { getCompanionChibiPath } from '@/components/Common/Paths/ImagePath';

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
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Create a ref to track loading state and prevent duplicate loads
  const isLoadingRef = useRef(false);
  
  // Track send request time to prevent duplicate sends
  const lastSendTimeRef = useRef(0);
  
  // Get chat store
  const { 
    messages, 
    addMessage, 
    isTyping,
    refreshChatData,
    isAuthReady,
    syncWithFirebase,
    clearMessages
  } = useChatStore();
  
  // Use sync hook
  useSyncChatData();

  // Get companion's name with proper capitalization
  const companionName = companionId.charAt(0).toUpperCase() + companionId.slice(1);
  
  // Load chat history when component mounts or auth becomes ready
  useEffect(() => {
    // Skip if no data or auth not ready
    if (!userData || !isAuthReady) return;
    
    // Verify the auth state matches the userData
    if (!auth.currentUser || auth.currentUser.uid !== userData.base.uid) {
      console.log(`⚠️ ChatContainer: Auth mismatch during initialization. userData: ${userData.base.uid}, auth: ${auth.currentUser?.uid || 'none'}`);
      
      // Return here but don't force a reload - allow the app's auth system to catch up naturally
      return;
    }
    
    // Use a stable reference for the diagnostic function by calling it from here
    const handleInitialLoad = async () => {
      // Check if we're already loading - prevents double loads
      if (isLoadingRef.current) {
        console.log('⚠️ ChatContainer: Already loading, skipping duplicate load');
        return;
      }
      
      // Set loading flag
      isLoadingRef.current = true;
      
      console.log('🔄 ChatContainer: Loading chat history...');
      
      try {
        // Force a full refresh for the current companion
        refreshChatData(userData.base.uid, companionId);
        
        // Also run the diagnostic to see what's in the database
        if (process.env.NODE_ENV !== 'production') {
          setTimeout(() => {
            console.log('🔧 ChatContainer: Running diagnostic for chat messages');
            if (userData && auth.currentUser && userData.base.uid === auth.currentUser.uid) {
              console.log(`🔧 ChatContainer: Running diagnostic for user ${userData.base.uid} with companion ${companionId}`);
              getAllChatMessagesForDebugging(userData.base.uid, companionId);
            } else {
              console.error('❌ ChatContainer: User mismatch or not authenticated, skipping diagnostic');
            }
          }, 1000);
        }
      } finally {
        // Reset loading flag after a short delay
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 2000);
      }
    };
    
    // Only run this once on mount
    handleInitialLoad();
    
    // Cleanup loading flag on unmount
    return () => {
      isLoadingRef.current = false;
    };
    
    // Use a more focused dependency array that won't cause unnecessary re-renders
  }, [userData, userData?.base.uid, companionId, isAuthReady, refreshChatData]);
  
  // Add automatic sync with Firebase every minute
  useEffect(() => {
    if (!userData || !isAuthReady) return;
    
    // Verify the auth state matches the userData
    if (!auth.currentUser || auth.currentUser.uid !== userData.base.uid) {
      console.log(`⚠️ ChatContainer: Auth mismatch during auto-sync setup. userData: ${userData.base.uid}, auth: ${auth.currentUser?.uid || 'none'}`);
      return; // Don't proceed with sync if there's a mismatch
    }
    
    // Track whether we've already done an initial sync
    let hasInitialSync = false;
    
    console.log('⏱️ ChatContainer: Setting up auto-sync with Firebase');
    
    // Function to run the sync safely
    const runSync = async () => {
      if (!userData) return;
      
      // Avoid syncing if we're already loading messages
      if (isLoadingRef.current) {
        console.log('⏱️ ChatContainer: Skipping auto-sync while loading messages');
        return;
      }
      
      if (!hasInitialSync) {
        console.log('⏱️ ChatContainer: Running initial sync');
        hasInitialSync = true;
        await syncWithFirebase(userData.base.uid, true);
      } else {
        console.log('🔄 ChatContainer: Running periodic sync');
        await syncWithFirebase(userData.base.uid);
      }
    };
    
    // Run initial sync with a small delay to avoid collision with the initial load
    const initialSyncTimeout = setTimeout(() => {
      runSync();
    }, 3000);
    
    // Set up periodic sync - increase from 1 minute to 5 minutes
    const intervalId = setInterval(() => {
      runSync();
    }, 5 * 60 * 1000); // Every 5 minutes instead of every minute
    
    return () => {
      console.log('⏱️ ChatContainer: Cleaning up auto-sync');
      clearTimeout(initialSyncTimeout);
      clearInterval(intervalId);
    };
  }, [userData, userData?.base.uid, isAuthReady, syncWithFirebase]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userData || !isAuthReady) return;
    
    // Prevent rapid duplicate sends (throttle to 2 seconds)
    const now = Date.now();
    if (now - lastSendTimeRef.current < 2000) {
      console.log('⚠️ ChatContainer: Preventing rapid duplicate send');
      return;
    }
    
    // Update send time
    lastSendTimeRef.current = now;
    
    // Send the message
    const messageToSend = newMessage.trim();
    setNewMessage('');
    
    try {
      await addMessage(userData.base.uid, companionId, messageToSend);
    } catch (error) {
      console.error('❌ ChatContainer: Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageToSend);
    }
  };

  // Manual sync handler with visual feedback
  const handleManualSync = async () => {
    if (!userData || !isAuthReady || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncWithFirebase(userData.base.uid, true);
    } catch (error) {
      console.error('Error syncing chat data:', error);
    } finally {
      // Short delay to prevent UI flicker
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };
  
  // Show loading state while auth is initializing
  if (!isAuthReady) {
    return (
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg h-[calc(100vh-8rem)] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-5"
            style={{ 
              borderColor: colors.secondary,
              borderTopColor: colors.primary 
            }}
          />
          <p className="text-gray-600 font-[Halogen]">Connecting to chat server...</p>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg h-[calc(100vh-8rem)] flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Image 
            src={getCompanionChibiPath(companionId)}
            alt={companionName}
            width={60}
            height={60}
            className="rounded-full border-4 mr-3 object-cover"
            style={{ borderColor: colors.primary }}
          />
          <h1 className="text-2xl font-[Riffic]" style={{ color: colors.heading }}>
            Chat with {companionName}
          </h1>
        </div>
        
        <div className="flex items-center">
          <motion.button
            onClick={handleManualSync}
            disabled={isSyncing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            title="Sync chat data"
          >
            <motion.div
              animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
              transition={isSyncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
              <FaSync size={16} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={messages[companionId] || []}
          companionId={companionId}
          isTyping={isTyping}
          showWelcome={showWelcome}
        />
      </div>

      <ChatInput
        value={newMessage}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        isLoading={isTyping}
        companionId={companionId}
      />
      
      {/* Debug buttons - only visible in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => {
              console.log('🔧 ChatContainer: Running diagnostic for chat messages');
              if (userData && auth.currentUser && userData.base.uid === auth.currentUser.uid) {
                console.log(`🔧 ChatContainer: Running diagnostic for user ${userData.base.uid} with companion ${companionId}`);
                getAllChatMessagesForDebugging(userData.base.uid, companionId);
              } else {
                console.error('❌ ChatContainer: User mismatch or not authenticated, skipping diagnostic');
              }
            }}
            className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300"
          >
            <FaWrench size={12} />
            <span>Diagnose Chat Issues</span>
          </button>
          
          <button 
            onClick={async () => {
              if (userData && auth.currentUser && userData.base.uid === auth.currentUser.uid) {
                try {
                  // Clear local chat messages for this companion
                  clearMessages(companionId);
                  
                  // Clear Firebase chat messages
                  await clearChatHistory(userData.base.uid, companionId);
                  
                  // Refresh data
                  await refreshChatData(userData.base.uid, companionId);
                  
                  console.log(`🧹 ChatContainer: Cleared chat history for ${userData.base.uid} with companion ${companionId}`);
                  alert("Chat history cleared successfully!");
                } catch (error) {
                  console.error('❌ ChatContainer: Error clearing chat history:', error);
                  alert("Error clearing chat history");
                }
              } else {
                console.error('❌ ChatContainer: User mismatch or not authenticated, cannot clear history');
                alert("Not authenticated, cannot clear history");
              }
            }}
            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-300"
          >
            <FaWrench size={12} />
            <span>Clear Chat History</span>
          </button>
        </div>
      )}
    </motion.div>
  );
} 