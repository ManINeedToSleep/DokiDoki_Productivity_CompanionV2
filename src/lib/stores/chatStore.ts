import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import { getCompanionResponse } from '@/lib/openai/chatService';
import { ResponseCategory } from '@/lib/openai/responseRules';
import { getUserDocument } from '@/lib/firebase/user';
import { auth } from '@/lib/firebase';
import { getChatHistory, addChatMessage } from '@/lib/firebase/chat';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'companion';
  timestamp: Timestamp;
  companionId: CompanionId;
  category?: ResponseCategory;
  isTyping?: boolean;
}

interface PendingChatUpdate {
  type: 'addMessage' | 'getResponse';
  uid: string;
  companionId: CompanionId;
  data: {
    content?: string;
    messageHistory?: ChatMessage[];
  };
}

// Define the persisted state type
interface PersistedState {
  messages: Record<CompanionId, ChatMessage[]>;
  pendingUpdates: PendingChatUpdate[];
  lastSyncTime: number | null;
  currentUserId: string | null;
}

interface ChatState extends PersistedState {
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  isAuthReady: boolean;
  
  // Actions
  setMessages: (companionId: CompanionId, messages: ChatMessage[]) => void;
  addMessage: (uid: string, companionId: CompanionId, content: string) => Promise<void>;
  getResponse: (uid: string, companionId: CompanionId, messageHistory: ChatMessage[]) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  refreshChatData: (uid: string, companionId: CompanionId) => Promise<void>;
  loadUserChatHistory: (uid: string) => Promise<void>;
  clearLocalState: () => void;
  setAuthReady: (ready: boolean) => void;
}

// Initialize empty message record with all companions
const initializeEmptyMessages = (): Record<CompanionId, ChatMessage[]> => ({
  sayori: [],
  natsuki: [],
  yuri: [],
  monika: []
});

// Custom storage implementation
const customStorage = createJSONStorage<PersistedState>(() => ({
  getItem: (name): string | null => {
    const stored = localStorage.getItem(name);
    if (!stored || !auth.currentUser) return null;
    
    try {
      const parsed = JSON.parse(stored);
      // Verify the stored data belongs to current user
      if (parsed?.state?.currentUserId !== auth.currentUser.uid) {
        console.log(`⚠️ ChatStore: User ID mismatch in storage. Stored: ${parsed?.state?.currentUserId}, Current: ${auth.currentUser.uid}`);
        localStorage.removeItem(name); // Remove mismatched data
        return null;
      }
      return stored;
    } catch {
      return null;
    }
  },
  setItem: (name, value): void => {
    // Only persist if we have an authenticated user
    if (auth.currentUser) {
      localStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name): void => localStorage.removeItem(name)
}));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Persisted state
      messages: initializeEmptyMessages(),
      pendingUpdates: [],
      lastSyncTime: null,
      currentUserId: null,
      
      // Non-persisted state
      isLoading: false,
      error: null,
      isTyping: false,
      isAuthReady: false,
      
      setAuthReady: (ready) => set({ isAuthReady: ready }),
      
      setMessages: (companionId, messages) => set(state => ({
        messages: {
          ...state.messages,
          [companionId]: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Timestamp 
              ? msg.timestamp 
              : Timestamp.fromDate(new Date(msg.timestamp))
          }))
        }
      })),
      
      setTyping: (isTyping) => set({ isTyping }),
      
      loadUserChatHistory: async (uid: string) => {
        try {
          set({ isLoading: true });
          
          // If user hasn't changed, just sync instead of full reload
          if (get().currentUserId === uid) {
            console.log(`🔄 ChatStore: Same user ${uid}, syncing instead of reloading`);
            await get().syncWithFirebase(uid, true);
            set({ isLoading: false });
            return;
          }
          
          console.log(`🔄 ChatStore: Loading chat history for new user ${uid}`);
          
          // Clear existing messages when user changes
          set({ messages: initializeEmptyMessages() });
          
          // Get user data to check selected companion
          const userData = await getUserDocument(uid);
          if (!userData) {
            throw new Error('User data not found');
          }
          
          // Get selected companion
          const selectedCompanion = userData.settings.selectedCompanion || 'sayori';
          console.log(`👤 ChatStore: User's selected companion is ${selectedCompanion}`);
          
          // Load chat history for all companions
          const companions: CompanionId[] = ['sayori', 'natsuki', 'yuri', 'monika'];
          const allMessages = initializeEmptyMessages();
          
          // Load selected companion first
          console.log(`📥 ChatStore: Loading ${selectedCompanion}'s chat history first`);
          const selectedHistory = await getChatHistory(uid, selectedCompanion);
          allMessages[selectedCompanion] = selectedHistory;
          
          // Load other companions in background
          const otherCompanions = companions.filter(c => c !== selectedCompanion);
          const loadPromises = otherCompanions.map(async companionId => {
            console.log(`📥 ChatStore: Loading ${companionId}'s chat history`);
            const history = await getChatHistory(uid, companionId);
            allMessages[companionId] = history;
          });
          
          await Promise.all(loadPromises);
          
          set({ 
            messages: allMessages,
            currentUserId: uid,
            lastSyncTime: Date.now()
          });
          
          console.log('✅ ChatStore: Successfully loaded all chat histories');
        } catch (error) {
          console.error('❌ ChatStore: Failed to load chat history:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load chat history' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearLocalState: () => {
        console.log('🧹 ChatStore: Clearing local state');
        set({
          messages: initializeEmptyMessages(),
          pendingUpdates: [],
          lastSyncTime: null,
          isTyping: false,
          error: null,
          currentUserId: null
        });
      },
      
      addMessage: async (uid, companionId, content) => {
        // Verify auth state
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
          console.error('❌ ChatStore: Auth state mismatch, cannot add message');
          return;
        }
        
        // Add user message
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          content,
          sender: 'user',
          timestamp: Timestamp.now(),
          companionId
        };
        
        set(state => ({
          messages: {
            ...state.messages,
            [companionId]: [...(state.messages[companionId] || []), userMessage]
          },
          pendingUpdates: [
            ...state.pendingUpdates,
            {
              type: 'addMessage',
              uid,
              companionId,
              data: { content }
            }
          ]
        }));
        
        try {
          // Save message to Firestore
          console.log('💾 ChatStore: Saving user message to Firestore');
          await addChatMessage(uid, companionId, userMessage);
        } catch (error) {
          console.error('❌ ChatStore: Error saving message to Firestore:', error);
        }
        
        // Get companion response
        const { getResponse } = get();
        await getResponse(uid, companionId, [...(get().messages[companionId] || []), userMessage]);
      },
      
      getResponse: async (uid: string, companionId: CompanionId, messageHistory: ChatMessage[]) => {
        // Verify auth state
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
          console.error('❌ ChatStore: Auth state mismatch, cannot get response');
          return;
        }
        
        // Check if we're already processing a response to prevent duplicates
        if (get().isTyping) {
          console.log('⚠️ ChatStore: Already processing a response, preventing duplicate');
          return;
        }
        
        set({ isTyping: true });
        
        try {
          const userData = await getUserDocument(uid);
          if (!userData) {
            throw new Error('User data not found');
          }
          
          // Filter out template responses
          const filteredHistory = messageHistory.filter(msg => {
            if (msg.sender === 'companion') {
              const isTemplate = msg.content.includes('Oh, ehehe~ Sorry for repeating myself');
              return !isTemplate;
            }
            return true;
          });
          
          // Make sure we have a valid user message to respond to
          const lastMessage = filteredHistory[filteredHistory.length - 1];
          if (!lastMessage || lastMessage.sender !== 'user') {
            console.log('⚠️ ChatStore: No valid user message to respond to');
            set({ isTyping: false });
            return;
          }
          
          // Get current timestamp to ensure we don't process this user message twice
          const requestTime = Date.now();
          const messageId = `response_to_${lastMessage.id}_${requestTime}`;
          
          // Get the AI response
          const response = await getCompanionResponse(
            companionId,
            lastMessage.content,
            filteredHistory,
            userData
          );
          
          // Create companion message with the unique ID
          const companionMessage: ChatMessage = {
            id: messageId,
            content: response,
            sender: 'companion',
            timestamp: Timestamp.now(),
            companionId
          };
          
          // Update local state - check if we've been interrupted
          if (!get().isTyping) {
            console.log('⚠️ ChatStore: Response was interrupted, not updating state');
            return;
          }
          
          // Update local state with the response
          set(state => ({
            messages: {
              ...state.messages,
              [companionId]: [...(state.messages[companionId] || []), companionMessage]
            },
            isTyping: false
          }));
          
          try {
            // Save companion message to Firestore
            console.log('💾 ChatStore: Saving companion response to Firestore');
            await addChatMessage(uid, companionId, companionMessage);
          } catch (error) {
            console.error('❌ ChatStore: Error saving companion response to Firestore:', error);
          }
        } catch (error) {
          console.error('❌ ChatStore: Error getting companion response:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error getting response',
            isTyping: false
          });
        }
      },
      
      syncWithFirebase: async (uid, force = false) => {
        // Verify auth state
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
          console.log('❌ ChatStore: Auth state mismatch, clearing local state');
          get().clearLocalState();
          return;
        }
        
        const state = get();
        
        // Check if we need to sync - increase from 1 minute to 3 minutes
        const now = Date.now();
        if (!force && state.lastSyncTime && (now - state.lastSyncTime < 3 * 60 * 1000)) {
          console.log(`🔄 ChatStore: Skipping sync, last sync was ${Math.floor((now - state.lastSyncTime) / 1000)} seconds ago`);
          return;
        }
        
        try {
          console.log('🔄 ChatStore: Syncing with Firebase...');
          // Load fresh chat history for all companions
          const companions: CompanionId[] = ['sayori', 'natsuki', 'yuri', 'monika'];
          const allMessages = {...state.messages}; // Start with existing messages
          
          for (const companionId of companions) {
            const history = await getChatHistory(uid, companionId);
            
            if (history.length > 0) {
              console.log(`📥 ChatStore: Received ${history.length} messages for ${companionId}`);
              
              // Create a map of existing message IDs for faster lookup
              const existingMsgIds = new Set(
                (state.messages[companionId] || []).map(msg => msg.id)
              );
              
              // Only add messages that we don't already have locally
              const newMessages = history.filter(msg => !existingMsgIds.has(msg.id));
              
              if (newMessages.length > 0) {
                console.log(`📥 ChatStore: Adding ${newMessages.length} new messages for ${companionId}`);
                allMessages[companionId] = [
                  ...(state.messages[companionId] || []),
                  ...newMessages
                ].sort((a, b) => 
                  a.timestamp.toMillis() - b.timestamp.toMillis()
                );
              }
            }
          }
          
          set({ 
            messages: allMessages,
            lastSyncTime: now
          });
          
          console.log('✅ ChatStore: Successfully synced with Firebase');
        } catch (error) {
          console.error('❌ ChatStore: Error syncing with Firebase:', error);
        }
      },
      
      refreshChatData: async (uid, companionId) => {
        // Wait for auth to be ready
        if (!get().isAuthReady) {
          console.log('⏳ ChatStore: Waiting for auth to be ready...');
          return;
        }
        
        // Verify auth state
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
          console.log('❌ ChatStore: Auth state mismatch, cannot refresh chat data');
          return;
        }
        
        // Prevent recursive calls by checking if already loading
        // This is critical to prevent infinite loops
        const currentState = get();
        if (currentState.isLoading) {
          console.log('⚠️ ChatStore: Already loading, skipping redundant refresh');
          return;
        }
        
        set({ isLoading: true });
        
        try {
          console.log(`📥 ChatStore: Refreshing chat data for companion ${companionId}`);
          const history = await getChatHistory(uid, companionId);
          
          // Use a stable setter that won't trigger unnecessary renders
          set(state => ({
            messages: {
              ...state.messages,
              [companionId]: history
            },
            isLoading: false,
            // Update lastSyncTime to prevent immediate syncs after refresh
            lastSyncTime: Date.now()
          }));
          
          console.log(`✅ ChatStore: Successfully refreshed chat data for ${companionId}`);
        } catch (error) {
          console.error(`❌ ChatStore: Error refreshing chat data for ${companionId}:`, error);
          set({ 
            error: error instanceof Error ? error.message : 'Error loading chat data',
            isLoading: false
          });
        }
      }
    }),
    {
      name: 'chat-storage',
      storage: customStorage,
      partialize: (state): PersistedState => ({
        messages: state.messages,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime,
        currentUserId: state.currentUserId
      })
    }
  )
);

// Modify the sync hook to handle auth initialization
export function useSyncChatData() {
  const { loadUserChatHistory, clearLocalState, syncWithFirebase, setAuthReady } = useChatStore();
  
  React.useEffect(() => {
    let mounted = true;
    let previousUser: string | null = null;
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!mounted) return;
      
      // Set auth as ready
      setAuthReady(true);
      
      if (user) {
        // Check if this is a different user than before
        if (previousUser && previousUser !== user.uid) {
          console.log(`🔑 ChatStore: User changed from ${previousUser} to ${user.uid}, clearing chat storage`);
          // Clear chat-related localStorage items for the previous user
          clearLocalState();
        }
        
        previousUser = user.uid;
        console.log(`🔑 ChatStore: User ${user.uid} logged in, loading chat history`);
        await loadUserChatHistory(user.uid);
        syncWithFirebase(user.uid);
      } else {
        console.log('🔑 ChatStore: User logged out, clearing local state');
        previousUser = null;
        clearLocalState();
      }
    });
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadUserChatHistory, clearLocalState, syncWithFirebase, setAuthReady]);
} 