"use client";

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';
import { auth, Timestamp } from '@/lib/firebase';
import CompanionDisplay from '@/components/Common/CompanionDisplay/CompanionDisplay';
import { CompanionId, CompanionMood, getCompanionData, getCompanionGreeting } from '@/lib/firebase/companion';
import { updateUserLastActive } from '@/lib/firebase/user';
import { addChatMessage, getChatHistory, ChatMessageType } from '@/lib/firebase/chat';
import Button from '@/components/Common/Button/Button';
import { getCharacterColors, getCharacterDotColor } from '@/components/Common/CharacterColor/CharacterColor';
import PolkadotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import ProtectedRoute from '@/components/Common/Auth/ProtectedRoute';
import { useSyncAllData } from '@/lib/stores';

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
  const [companionMood, setCompanionMood] = useState<CompanionMood>('happy');
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [showSpeech, setShowSpeech] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  // Get the current companion's color scheme
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Load chat history and set greeting
  useEffect(() => {
    const loadChat = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user found');
        return;
      }
      
      // Prevent infinite loops by limiting refresh attempts
      if (refreshAttempts > 3) {
        console.log('Max refresh attempts reached, activating local mode');
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
        console.log(`Loading chat for user: ${auth.currentUser.uid} and companion: ${selectedCompanion}`);
        
        // Update user's last active time
        await updateUserLastActive(auth.currentUser.uid);
        
        // Fetch chat history
        const history = await getChatHistory(auth.currentUser.uid, selectedCompanion);
        console.log(`Retrieved ${history.length} messages`);
        setMessages(history);
        
        // Get companion's greeting if there are no messages
        if (history.length === 0) {
          console.log('No messages found, fetching companion greeting');
          const greeting = await getCompanionGreeting(auth.currentUser.uid, selectedCompanion);
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
        if (auth.currentUser) {
          const companionData = await getCompanionData(auth.currentUser.uid, selectedCompanion);
          if (companionData) {
            setCompanionMood(companionData.mood);
          }
        }
      } catch (error: unknown) {
        console.error("Error loading chat:", error);
        const errorMsg = error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
          
        setErrorMessage(`Error: ${errorMsg}`);
        
        // If there's a permission error, try refreshing user data once
        if (error instanceof Error && errorMsg.includes('permission')) {
          console.log('Permissions error detected, refreshing user data');
          setRefreshAttempts(prev => prev + 1);
          
          if (refreshAttempts <= 2) {
            refreshUserData();
          } else {
            setErrorMessage(`Firebase permissions error: This could be due to missing security rules. 
            Try adding rules for the 'chats' subcollection. Error details: ${errorMsg}`);
          }
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (!userLoading && auth.currentUser && !isLocalMode) {
      loadChat();
    }
  }, [userLoading, selectedCompanion, refreshUserData, refreshAttempts, isLocalMode]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isCompanionTyping) return;
    
    setErrorMessage(null);
    
    // Create user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: Timestamp.now(),
      companionId: selectedCompanion
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate companion typing
    setIsCompanionTyping(true);
    
    if (!isLocalMode && auth.currentUser) {
      try {
        // Add to database
        await addChatMessage(auth.currentUser.uid, selectedCompanion, userMessage);
      } catch (error: unknown) {
        console.error("Error sending message:", error);
        const errorMsg = error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
          
        setErrorMessage(`Error saving message: ${errorMsg}`);
        // If we encounter an error when sending, switch to local mode
        setIsLocalMode(true);
      }
    }
    
    // Get companion response (this would be replaced with your actual AI integration)
    // Simulate typing delay (2-4 seconds)
    const typingDelay = 2000 + Math.random() * 2000;
    
    setTimeout(async () => {
      // This is a placeholder for your actual AI response
      const aiResponse = await getCompanionResponse(input, selectedCompanion);
      
      const companionMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        sender: 'companion',
        content: aiResponse,
        timestamp: Timestamp.now(),
        companionId: selectedCompanion
      };
      
      setMessages(prev => [...prev, companionMessage]);
      
      // Show response in speech bubble
      setSpeechText(aiResponse);
      setShowSpeech(true);
      
      // Try to save to Firebase if not in local mode
      if (!isLocalMode && auth.currentUser) {
        try {
          await addChatMessage(auth.currentUser.uid, selectedCompanion, companionMessage);
        } catch (error) {
          console.error("Error saving companion message:", error);
          setIsLocalMode(true);
        }
      }
      
      setIsCompanionTyping(false);
    }, typingDelay);
  };
  
  // Reset error state and refresh data
  const handleRetry = () => {
    setErrorMessage(null);
    setRefreshAttempts(0);
    setIsLocalMode(false);
    refreshUserData();
  };
  
  // Temporary function to generate companion responses
  // This would be replaced with your actual AI integration
  const getCompanionResponse = async (userMessage: string, companionId: CompanionId): Promise<string> => {
    // This is a placeholder - you would integrate with a real AI service here
    const responses: Record<CompanionId, string[]> = {
      sayori: [
        "That sounds fun! Let's do our best together!",
        "I'm here to help you stay motivated! You can do it!",
        "Don't worry, we'll get through this together!",
        "That's interesting! Tell me more about it!"
      ],
      natsuki: [
        "Well, I guess that's fine... if that's what you want to do.",
        "Don't get the wrong idea! I'm just helping because I want to.",
        "Hmph, I suppose I can help you with that.",
        "That's actually pretty cool. Not that I'm impressed or anything!"
      ],
      yuri: [
        "I find that perspective quite fascinating...",
        "Perhaps we could explore that topic in more depth?",
        "I'd be happy to assist you with that endeavor.",
        "I've read about something similar. Let me share what I know."
      ],
      monika: [
        "I think we should approach this systematically.",
        "Let's set up a plan to achieve your goals efficiently.",
        "I've been analyzing your work patterns, and I have some suggestions.",
        "Remember, I'm always here to help you improve!"
      ]
    };
    
    // Get random response for the selected companion
    const companionResponses = responses[companionId] || responses.sayori;
    const randomIndex = Math.floor(Math.random() * companionResponses.length);
    
    return companionResponses[randomIndex];
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
          
          <div className="container mx-auto px-4 py-6 flex h-full relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full">
              {/* Chat Section - 2/3 width */}
              <div className="md:col-span-2">
                <motion.div 
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg h-full flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.h1 
                    className="text-2xl font-[Riffic] mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ color: colors.primary }}
                  >
                    Chat with {capitalizeFirstLetter(selectedCompanion)}
                    {isLocalMode && <span className="text-sm text-amber-600 ml-2">(Local Mode)</span>}
                  </motion.h1>
                  
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

                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto hide-scrollbar mb-4 p-4">
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
                      disabled={!input.trim() || isCompanionTyping}
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
