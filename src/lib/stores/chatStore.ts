import { create } from 'zustand';
import { persist, PersistOptions, StorageValue } from 'zustand/middleware';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import { getCompanionResponse } from '@/lib/openai/chatService';
import { ResponseCategory } from '@/lib/openai/responseRules';
import { getUserDocument } from '@/lib/firebase/user';

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

interface ChatState {
  messages: Record<CompanionId, ChatMessage[]>;
  pendingUpdates: PendingChatUpdate[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  isTyping: boolean;
  
  // Actions
  setMessages: (companionId: CompanionId, messages: ChatMessage[]) => void;
  addMessage: (uid: string, companionId: CompanionId, content: string) => Promise<void>;
  getResponse: (uid: string, companionId: CompanionId, messageHistory: ChatMessage[]) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  syncWithFirebase: (uid: string, force?: boolean) => Promise<void>;
  refreshChatData: (uid: string, companionId: CompanionId) => Promise<void>;
}

type ChatStorePersist = Pick<ChatState, 'messages' | 'pendingUpdates' | 'lastSyncTime'>;

type SerializedTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type SerializedMessage = Omit<ChatMessage, 'timestamp'> & {
  timestamp: SerializedTimestamp;
};

type SerializedMessages = Record<CompanionId, SerializedMessage[]>;

// Custom storage with serialization
const storage = {
  getItem: (name: string): StorageValue<ChatStorePersist> | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    
    try {
      const parsed = JSON.parse(str);
      // Convert timestamps back to Firestore Timestamps
      if (parsed?.state?.messages) {
        const messages = parsed.state.messages as SerializedMessages;
        Object.values(messages).forEach(companionMessages => {
          companionMessages.forEach(msg => {
            if (msg.timestamp && typeof msg.timestamp.seconds === 'number') {
              msg.timestamp = new Timestamp(msg.timestamp.seconds, msg.timestamp.nanoseconds);
            }
          });
        });
      }
      return parsed as StorageValue<ChatStorePersist>;
    } catch {
      return null;
    }
  },
  
  setItem: (name: string, value: StorageValue<ChatStorePersist>): void => {
    try {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      const parsed = JSON.parse(strValue);
      // Convert Timestamps to serializable objects
      if (parsed?.state?.messages) {
        const messages = parsed.state.messages as Record<CompanionId, ChatMessage[]>;
        Object.values(messages).forEach(companionMessages => {
          companionMessages.forEach(msg => {
            if (msg.timestamp instanceof Timestamp) {
              (msg as unknown as SerializedMessage).timestamp = {
                seconds: msg.timestamp.seconds,
                nanoseconds: msg.timestamp.nanoseconds
              };
            }
          });
        });
      }
      localStorage.setItem(name, JSON.stringify(parsed));
    } catch {
      localStorage.setItem(name, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  
  removeItem: (name: string): void => localStorage.removeItem(name)
};

// Persist configuration
const persistConfig: PersistOptions<ChatState, ChatStorePersist> = {
  name: 'chat-storage',
  storage,
  partialize: (state) => ({
    messages: state.messages,
    pendingUpdates: state.pendingUpdates,
    lastSyncTime: state.lastSyncTime
  })
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {} as Record<CompanionId, ChatMessage[]>,
      pendingUpdates: [],
      isLoading: false,
      error: null,
      lastSyncTime: null,
      isTyping: false,
      
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
      
      addMessage: async (uid, companionId, content) => {
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
        
        // Get companion response
        const { getResponse } = get();
        await getResponse(uid, companionId, [...(get().messages[companionId] || []), userMessage]);
      },
      
      getResponse: async (uid: string, companionId: CompanionId, messageHistory: ChatMessage[]) => {
        set({ isTyping: true });
        
        try {
          // Get response from companion
          const userData = await getUserDocument(uid);
          if (!userData) {
            throw new Error('User data not found');
          }
          
          // Filter out any template-like responses from history
          const filteredHistory = messageHistory.filter(msg => {
            if (msg.sender === 'companion') {
              // Check for template patterns
              const isTemplate = msg.content.includes('Oh, ehehe~ Sorry for repeating myself') ||
                               msg.content.includes('[current time]') ||
                               msg.content.includes('Let me check the time for you');
              return !isTemplate;
            }
            return true;
          });
          
          const response = await getCompanionResponse(
            companionId,
            filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].content : '',
            filteredHistory,
            userData
          );
          
          // Add companion response
          set(state => {
            return {
              messages: {
                ...state.messages,
                [companionId]: [...(state.messages[companionId] || []), {
                  id: `companion_${Date.now()}`,
                  content: response,
                  sender: 'companion',
                  timestamp: Timestamp.now(),
                  companionId
                }]
              },
              isTyping: false
            };
          });
        } catch (error) {
          console.error('Error getting companion response:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error getting response',
            isTyping: false
          });
        }
      },
      
      syncWithFirebase: async (uid, force = false) => {
        const state = get();
        
        // Check if we need to sync
        const now = Date.now();
        if (!force && state.lastSyncTime && (now - state.lastSyncTime < 5 * 60 * 1000)) {
          return;
        }
        
        set({ lastSyncTime: now });
      },
      
      refreshChatData: async (uid, companionId) => {
        set({ isLoading: true });
        
        try {
          // Load initial messages (if needed)
          set(state => ({
            messages: {
              ...state.messages,
              [companionId]: state.messages[companionId] || []
            },
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error loading chat data',
            isLoading: false
          });
        }
      }
    }),
    persistConfig
  )
);

// Hook for automatic syncing
export function useSyncChatData() {
  const { messages, syncWithFirebase } = useChatStore();
  
  React.useEffect(() => {
    if (!messages) return;
    
    // Initial sync
    const uid = localStorage.getItem('userId');
    if (uid) {
      syncWithFirebase(uid);
      
      // Set up interval for periodic syncing
      const syncInterval = setInterval(() => {
        syncWithFirebase(uid);
      }, 5 * 60 * 1000); // Sync every 5 minutes
      
      // Sync on page unload
      const handleBeforeUnload = () => {
        syncWithFirebase(uid, true); // Force sync
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        clearInterval(syncInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [messages, syncWithFirebase]);
} 