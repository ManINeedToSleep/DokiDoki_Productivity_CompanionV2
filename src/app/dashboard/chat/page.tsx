"use client";

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';
import { auth, Timestamp } from '@/lib/firebase';
import CompanionDisplay from '@/components/Common/CompanionDisplay/CompanionDisplay';
import { CompanionId, CompanionMood, getCompanionData, getCompanionGreeting } from '@/lib/firebase/companion';
import { updateUserLastActive } from '@/lib/firebase/user';
import { 
  addChatMessage, 
  getChatHistory, 
  ChatMessageType, 
  getRemainingMessages,
  MAX_DAILY_MESSAGES 
} from '@/lib/firebase/chat';
import { getCompanionResponse, moderateContent } from '@/lib/openai/chatService';
import Button from '@/components/Common/Button/Button';
import { getCharacterColors, getCharacterDotColor } from '@/components/Common/CharacterColor/CharacterColor';
import PolkadotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import ProtectedRoute from '@/components/Common/Auth/ProtectedRoute';
import { useSyncAllData } from '@/lib/stores';
import { FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

// Add styles for scrollbar hiding
const scrollbarHidingStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

function capitalizeFirstLetter(string: string | undefined): string {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function ChatPage() {
  // Initialize all data syncing
  useSyncAllData();

  const { userData, loading: userLoading, refreshUserData } = useUserData();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const [lastRequestTimestamp, setLastRequestTimestamp] = useState<number>(0);
  const [processingRequest, setProcessingRequest] = useState<boolean>(false);
  const [companionMood, setCompanionMood] = useState<CompanionMood>('happy');
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(MAX_DAILY_MESSAGES);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRequestRef = useRef<string | null>(null);
  const activeRequestFlagRef = useRef<boolean>(false);
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  // Get the current companion's color scheme
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Define a stable cleanup function at component level
  const cleanupRequest = (messageId: string) => {
    console.log(`🧹 ChatPage: Cleaning up request ${messageId.substring(0, 15)}`);
    
    // Only reset the processing state if this is still the current request
    if (currentRequestRef.current === messageId) {
      activeRequestFlagRef.current = false;
      setProcessingRequest(false);
      currentRequestRef.current = null;
    }
  };
  
  // Handle global window events to clean up requests on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log(`🧹 ChatPage: Cleaning up all requests due to page unload`);
      activeRequestFlagRef.current = false;
      setProcessingRequest(false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Load chat history and set greeting
  useEffect(() => {
    const loadChat = async () => {
      // Add a reference flag to prevent duplicate loading
      let isMounted = true;
      
      if (!auth.currentUser) {
        console.log('🚫 ChatPage: No authenticated user found');
        return;
      }
      
      console.log(`🔑 ChatPage: Current auth state - User: ${auth.currentUser.uid}, Token refreshed: ${auth.currentUser.refreshToken ? 'Yes' : 'No'}`);
      
      // Get current token expiration time to check if it's valid
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult();
        const expTime = new Date(tokenResult.expirationTime);
        const timeUntilExp = expTime.getTime() - Date.now();
        console.log(`🔑 ChatPage: Token expires in ${Math.round(timeUntilExp/60000)} minutes (${expTime.toLocaleString()})`);
        
        // Force refresh token if it's close to expiring (less than 5 minutes)
        if (timeUntilExp < 5 * 60 * 1000) {
          console.log('⚠️ ChatPage: Token expiring soon, forcing refresh before data load');
          await auth.currentUser.getIdToken(true);
          console.log('✅ ChatPage: Token force-refreshed successfully');
        }
      } catch (tokenErr) {
        console.error('❌ ChatPage: Error checking token:', tokenErr);
      }
      
      // Prevent infinite loops by limiting refresh attempts
      if (refreshAttempts > 3) {
        console.log('🔄 ChatPage: Max refresh attempts reached, activating local mode');
        setIsLocalMode(true);
        setIsLoadingData(false);
        
        // Set up a local greeting message
        const localGreeting = `Hi there! I'm ${capitalizeFirstLetter(selectedCompanion)}. We're currently in local mode because there was a problem connecting to the chat database. You can still chat with me, but your messages won't be saved to the cloud.`;
        const greetingMessage: ChatMessageType = {
          id: Date.now().toString(),
          sender: 'companion',
          content: localGreeting,
          timestamp: Timestamp.now(),
          companionId: selectedCompanion
        };
        
        setMessages([greetingMessage]);
        setSpeechText(localGreeting);
        setShowSpeech(true);
        
        return;
      }
      
      setIsLoadingData(true);
      setErrorMessage(null);
      
      try {
        console.log(`📥 ChatPage: Loading chat for user: ${auth.currentUser.uid} and companion: ${selectedCompanion}`);
        
        // Guard to prevent state updates if component unmounted
        if (!isMounted) return;
        
        // Update user's last active time
        console.log(`⏱️ ChatPage: Updating user last active time`);
        await updateUserLastActive(auth.currentUser.uid);
        
        // Check remaining messages
        console.log(`📊 ChatPage: Checking remaining messages`);
        const remaining = await getRemainingMessages(auth.currentUser.uid);
        console.log(`📊 ChatPage: User has ${remaining} messages remaining today`);
        if (isMounted) setRemainingMessages(remaining);
        
        // Fetch chat history
        console.log(`💬 ChatPage: Fetching chat history`);
        const history = await getChatHistory(auth.currentUser.uid, selectedCompanion);
        console.log(`💬 ChatPage: Retrieved ${history.length} messages`);
        if (isMounted) setMessages(history);
        
        // Get companion's greeting if there are no messages
        if (history.length === 0) {
          console.log('💬 ChatPage: No messages found, fetching companion greeting');
          const greeting = await getCompanionGreeting(auth.currentUser.uid, selectedCompanion);
          console.log(`💬 ChatPage: Received greeting: "${greeting.substring(0, 20)}..."`);
          
          // Check if component is still mounted
          if (!isMounted) return;
          
          const greetingMessage: ChatMessageType = {
            id: Date.now().toString(),
            sender: 'companion',
            content: greeting,
            timestamp: Timestamp.now(),
            companionId: selectedCompanion
          };
          
          setMessages([greetingMessage]);
          
          // Show greeting in speech bubble
          setSpeechText(greeting);
          setShowSpeech(true);
        }
        
        // Get companion mood
        if (auth.currentUser && isMounted) {
          console.log(`😊 ChatPage: Fetching companion mood data`);
          const companionData = await getCompanionData(auth.currentUser.uid, selectedCompanion);
          if (companionData && isMounted) {
            console.log(`😊 ChatPage: Companion mood is ${companionData.mood}`);
            setCompanionMood(companionData.mood);
          } else if (isMounted) {
            console.log(`❓ ChatPage: No companion data found`);
          }
        }
        console.log(`✅ ChatPage: Chat data loaded successfully`);
      } catch (error: unknown) {
        if (!isMounted) return;
        
        console.error("❌ ChatPage: Error loading chat:", error);
        const errorMsg = error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
          
        setErrorMessage(`Error: ${errorMsg}`);
        
        // If there's a permission error, switch to local mode immediately instead of retrying
        if (error instanceof Error && errorMsg.includes('permission')) {
          console.log('🔒 ChatPage: Permissions error detected, switching to local mode');
          setIsLocalMode(true);
          
          // Set up a local greeting message
          const localGreeting = `Hi there! I'm ${capitalizeFirstLetter(selectedCompanion)}. We're currently in local mode because there was a problem connecting to the chat database. You can still chat with me, but your messages won't be saved to the cloud.`;
          const greetingMessage: ChatMessageType = {
            id: Date.now().toString(),
            sender: 'companion',
            content: localGreeting,
            timestamp: Timestamp.now(),
            companionId: selectedCompanion
          };
          
          setMessages([greetingMessage]);
          setSpeechText(localGreeting);
          setShowSpeech(true);
          
          // Display a more helpful error message
          setErrorMessage(`Firebase permissions error: This could be due to missing security rules. 
          The app will run in local mode so you can still chat, but messages won't be saved.
          Error details: ${errorMsg}`);
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
      
      // Cleanup function sets isMounted to false when the component unmounts
      return () => {
        isMounted = false;
      };
    };
    
    if (!userLoading && auth.currentUser && !isLocalMode) {
      console.log('🔄 ChatPage: Conditions met for loading chat data, calling loadChat()');
      loadChat();
    } else {
      console.log(`🔍 ChatPage: Not loading chat - userLoading: ${userLoading}, auth.currentUser: ${!!auth.currentUser}, isLocalMode: ${isLocalMode}`);
    }
  }, [userLoading, selectedCompanion, refreshAttempts, isLocalMode]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isCompanionTyping) return;
    
    // Strong deduplication check - prevent rapid submissions and duplicate calls
    const now = Date.now();
    if (now - lastRequestTimestamp < 2000 || processingRequest) {
      console.log('🛑 ChatPage: Preventing duplicate submission - too soon after last request or already processing');
      return;
    }
    
    try {
      // Update request state
      setLastRequestTimestamp(now);
      setProcessingRequest(true);
      
      // Set this request as active
      activeRequestFlagRef.current = true;
      
      // Generate a unique message ID
      const messageId = `msg_${now}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`📝 ChatPage: Sending message with ID ${messageId.substring(0, 15)}...`);
      
      // Store this request ID in the ref
      currentRequestRef.current = messageId;
      
      // Check if this is a duplicate submission (can happen with double renders)
      if (lastSentMessageId && messageId.substring(0, 15) === lastSentMessageId.substring(0, 15)) {
        console.log('🛑 ChatPage: Preventing duplicate message submission based on ID similarity');
        setProcessingRequest(false);
        return;
      }
      
      // Update the last sent message ID
      setLastSentMessageId(messageId);
      
      // Before starting a new request, cancel any previous ones
      if (currentRequestRef.current && currentRequestRef.current !== messageId) {
        console.log(`🚫 ChatPage: Cancelling previous request ${currentRequestRef.current.substring(0, 15)}`);
      }
  
      setErrorMessage(null);
      setModerationWarning(null);
      
      // Check for message limits
      if (remainingMessages <= 0 && !isLocalMode) {
        setErrorMessage(`You've reached your daily message limit (${MAX_DAILY_MESSAGES}). Please try again tomorrow.`);
        cleanupRequest(messageId);
        return;
      }
      
      // Content moderation check
      try {
        const moderationResult = await moderateContent(input);
        if (moderationResult.flagged) {
          setModerationWarning(moderationResult.reason || 'Your message contains prohibited content.');
          cleanupRequest(messageId);
          return;
        }
      } catch (error) {
        console.error("Moderation error:", error);
        // Continue without moderation if the API fails
      }
      
      // Create user message
      const userMessage: ChatMessageType = {
        id: messageId,
        sender: 'user',
        content: input,
        timestamp: Timestamp.now(),
        companionId: selectedCompanion
      };
      
      // Create a local copy of the input before clearing it
      const userInput = input.trim();
      
      // Update local state
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Update remaining messages counter
      if (!isLocalMode) {
        setRemainingMessages(prev => Math.max(0, prev - 1));
      }
      
      // Simulate companion typing
      setIsCompanionTyping(true);
      
      // Try to save the message to the database
      if (!isLocalMode && auth.currentUser) {
        try {
          // Add to database
          await addChatMessage(auth.currentUser.uid, selectedCompanion, userMessage);
        } catch (error: unknown) {
          console.error("Error sending message:", error);
          const errorMsg = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
            
          if (errorMsg.includes('limit reached')) {
            setErrorMessage(`You've reached your daily message limit. Please try again tomorrow.`);
            setRemainingMessages(0);
          } else {
            setErrorMessage(`Error saving message: ${errorMsg}`);
            // If we encounter an error when sending, switch to local mode
            setIsLocalMode(true);
          }
        }
      }
      
      // Get AI response - pass current messages for context
      let aiResponse = '';
      
      // Make a local copy of messages to prevent any race condition
      const currentMessages = [...messages];
      
      console.log(`🤖 ChatPage: Getting AI response for message "${userInput.substring(0, 20)}..." with request ID ${messageId}`);
      
      if (userData) {
        console.log('🤖 ChatPage: Getting AI response with context of', currentMessages.length, 'messages');
        // Get AI response with full context
        aiResponse = await getCompanionResponse(
          selectedCompanion,
          userInput,
          currentMessages,
          userData
        );
      } else {
        // Fallback without user data
        aiResponse = "I'm having trouble remembering some things right now. Could we try again in a moment?";
      }
      
      // Check if this request is still active (not superseded by a new one or cancelled)
      if (!activeRequestFlagRef.current || currentRequestRef.current !== messageId) {
        console.log(`🛑 ChatPage: Request ${messageId.substring(0, 15)} was cancelled or superseded while waiting for AI response, dropping result`);
        return;
      }
      
      console.log(`✅ ChatPage: Request ${messageId.substring(0, 15)} is still active, proceeding with response`);
      
      // Generate a unique ID for the companion message
      const companionMessageId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create companion message
      const companionMessage: ChatMessageType = {
        id: companionMessageId,
        sender: 'companion',
        content: aiResponse,
        timestamp: Timestamp.now(),
        companionId: selectedCompanion
      };
      
      console.log(`💬 ChatPage: Received AI response for request ${messageId}, updating UI with message ID ${companionMessageId.substring(0, 15)}`);
      
      // Final check before updating UI - make sure this request is still relevant
      if (!activeRequestFlagRef.current || currentRequestRef.current !== messageId) {
        console.log(`🛑 ChatPage: Request ${messageId.substring(0, 15)} was cancelled after receiving response, dropping update`);
        return;
      }
      
      // Update UI
      setMessages(prev => [...prev, companionMessage]);
      setSpeechText(aiResponse);
      setShowSpeech(true);
      
      // Try to save companion message to Firebase if not in local mode
      if (!isLocalMode && auth.currentUser) {
        try {
          console.log(`💾 ChatPage: Saving companion message to Firebase`);
          await addChatMessage(auth.currentUser.uid, selectedCompanion, companionMessage);
          console.log(`✅ ChatPage: Companion message saved successfully`);
        } catch (error) {
          console.error("Error saving companion message:", error);
          setIsLocalMode(true);
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Only show error message if this request is still active
      if (activeRequestFlagRef.current && currentRequestRef.current) {
        const messageId = currentRequestRef.current;
        console.log(`⚠️ ChatPage: Error for active request ${messageId.substring(0, 15)}, showing fallback message`);
        
        // Fallback message in case of error
        const errorResponse: ChatMessageType = {
          id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          sender: 'companion',
          content: "Sorry, I'm having trouble thinking right now. Could we try again?",
          timestamp: Timestamp.now(),
          companionId: selectedCompanion
        };
        
        setMessages(prev => [...prev, errorResponse]);
        setSpeechText(errorResponse.content);
        setShowSpeech(true);
      } else {
        console.log(`⚠️ ChatPage: Error for inactive request, ignoring`);
      }
    } finally {
      setIsCompanionTyping(false);
      
      // Only clean up if this is still the active request
      if (activeRequestFlagRef.current && currentRequestRef.current) {
        console.log(`✅ ChatPage: Finalizing request ${currentRequestRef.current.substring(0, 15)}`);
        cleanupRequest(currentRequestRef.current);
      } else {
        console.log(`⏭️ ChatPage: Skipping cleanup for inactive request`);
      }
    }
  };
  
  // Reset error state and refresh data
  const handleRetry = () => {
    setErrorMessage(null);
    setRefreshAttempts(0);
    setIsLocalMode(false);
    refreshUserData();
  };
  
  const handleSpeechEnd = () => {
    setShowSpeech(false);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  if (userLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkadotBackground dotColor={dotColor} />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading your chat...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ProtectedRoute>
      {/* Add style tag for scrollbar hiding */}
      <style jsx global>{scrollbarHidingStyles}</style>
      
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow overflow-hidden relative">
          <PolkadotBackground 
            dotColor={dotColor}
            backgroundColor="white"
            dotSize={20}
            spacing={100}
          />
          
          <div className="container mx-auto px-4 py-6 flex h-[calc(100vh-4rem)] relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full">
              {/* Chat Section - 2/3 width */}
              <div className="md:col-span-2 flex flex-col h-full">
                <motion.div 
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg h-full flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <motion.h1 
                      className="text-2xl font-[Riffic]"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ color: colors.primary }}
                    >
                      Chat with {capitalizeFirstLetter(selectedCompanion)}
                      {isLocalMode && <span className="text-sm text-amber-600 ml-2">(Local Mode)</span>}
                    </motion.h1>
                    
                    {/* Message counter */}
                    <div className="text-sm font-[Halogen] px-3 py-1 rounded-full bg-gray-100">
                      <span style={{ color: colors.text }}>
                        {remainingMessages}/{MAX_DAILY_MESSAGES} messages left today
                      </span>
                    </div>
                  </div>
                  
                  {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      <p>{errorMessage}</p>
                      <button 
                        onClick={handleRetry}
                        className="underline text-sm mt-1 hover:text-red-800"
                      >
                        Try again
                      </button>
                      <p className="text-sm mt-2">
                        Note: Firebase may need security rules for the &apos;chats&apos; subcollection. Please update your Firestore rules to include permissions for the path /users/&#123;userId&#125;/chats/&#123;chatId&#125;.
                      </p>
                    </div>
                  )}
                  
                  {moderationWarning && (
                    <motion.div 
                      className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-4 flex items-start gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <FaExclamationTriangle className="flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold">Moderation Warning</p>
                        <p>{moderationWarning}</p>
                        <button 
                          onClick={() => setModerationWarning(null)}
                          className="underline text-sm mt-1 hover:text-amber-800"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Messages Container - Make it take the remaining height */}
                  <div className="flex-grow overflow-y-auto hide-scrollbar mb-4 p-4 border border-gray-100 rounded-lg">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div 
                            className="max-w-[80%] p-4 rounded-lg shadow-sm"
                            style={{ 
                              backgroundColor: message.sender === 'user' ? colors.primary : 'white',
                              borderLeft: message.sender === 'companion' ? `4px solid ${colors.primary}` : undefined,
                              color: message.sender === 'user' ? 'white' : colors.text
                            }}
                          >
                            <p className="font-['Halogen']">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.sender === 'user' ? 'opacity-70' : 'opacity-50'}`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {isCompanionTyping && (
                        <motion.div
                          key="typing-indicator"
                          className="flex justify-start mb-4"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                        >
                          <div 
                            className="bg-white p-4 rounded-lg shadow-sm" 
                            style={{ 
                              borderLeft: `4px solid ${colors.primary}`,
                              color: colors.text
                            }}
                          >
                            <p className="font-['Halogen']">typing...</p>
                          </div>
                        </motion.div>
                      )}
                      <div key="messages-end" ref={messagesEndRef} />
                    </AnimatePresence>
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                      className="flex-1 p-3 rounded-lg bg-white border focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: colors.primary,
                        color: colors.text
                      }}
                      placeholder={`Chat with ${capitalizeFirstLetter(selectedCompanion)}...`}
                      disabled={isCompanionTyping}
                    />
                    <Button
                      label="Send"
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isCompanionTyping || remainingMessages <= 0}
                      companionId={selectedCompanion}
                      className="px-4 py-2"
                    />
                  </form>
                </motion.div>
              </div>

              {/* Companion Section - 1/3 width */}
              <div className="h-full hidden md:block">
                <div className="h-full">
                  <CompanionDisplay
                    characterId={selectedCompanion}
                    mood={companionMood}
                    showSpeechBubble={showSpeech}
                    speechText={speechText}
                    onSpeechEnd={handleSpeechEnd}
                    disableAnimation={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
