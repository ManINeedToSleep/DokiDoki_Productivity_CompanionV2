import { db, Timestamp } from '@/lib/firebase';
import { CompanionId } from '@/lib/firebase/companion';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit, 
  doc, 
  updateDoc, 
  getDoc,
  increment,
  setDoc
} from 'firebase/firestore';
import { updateUserLastActive } from './user';
import { auth } from '@/lib/firebase';
import { encode } from 'gpt-tokenizer';

// Add a simple in-memory cache to prevent duplicate message processing
// This is a basic solution - in a production app you might use a more robust solution
const recentMessageIds = new Set<string>();
const recentMessageTimes = new Map<string, number>();
const MAX_CACHE_SIZE = 100;
const MIN_TIME_BETWEEN_DUPLICATES = 1500; // 1.5 seconds - slightly less strict

// Add a simple content-based cache to catch duplicate content regardless of ID
const recentMessageContents = new Map<string, number>();
const MAX_CONTENT_CACHE_SIZE = 20;

export interface ChatMessageType {
  id: string;
  sender: 'user' | 'companion';
  content: string;
  timestamp: Timestamp;
  companionId: CompanionId;
}

export interface ChatUsage {
  dailyMessageCount: number;
  lastMessageDate: Timestamp;
}

// Maximum number of messages to retrieve
const MAX_CHAT_HISTORY = 50;

// Maximum messages per day
export const MAX_DAILY_MESSAGES = 50;

// Constants for token management
const MAX_DAILY_TOKENS = 20000; // Per user daily limit

interface TokenUsage {
  dailyTokens: number;
  lastResetDate: Date;
}

// Helper function to count tokens
function countTokens(text: string): number {
  return encode(text).length;
}

// Function to check and update token usage
async function checkTokenUsage(userId: string): Promise<boolean> {
  try {
    const usageRef = doc(db, 'users', userId, 'stats', 'tokenUsage');
    const usageDoc = await getDoc(usageRef);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Initialize token usage if it doesn't exist
    if (!usageDoc.exists()) {
      await setDoc(usageRef, {
        dailyTokens: 0,
        lastResetDate: today
      });
      return true;
    }
    
    const usage = usageDoc.data() as TokenUsage;
    const lastReset = new Date(usage.lastResetDate);
    
    // Reset daily tokens if it's a new day
    if (lastReset.getTime() < today.getTime()) {
      await setDoc(usageRef, {
        dailyTokens: 0,
        lastResetDate: today
      });
      return true;
    }
    
    // Check if user has exceeded daily token limit
    if (usage.dailyTokens >= MAX_DAILY_TOKENS) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token usage:', error);
    // If we can't check token usage, allow the request to proceed
    return true;
  }
}

// Function to update token usage
async function updateTokenUsage(userId: string, tokens: number): Promise<void> {
  try {
    const usageRef = doc(db, 'users', userId, 'stats', 'tokenUsage');
    await updateDoc(usageRef, {
      dailyTokens: increment(tokens)
    });
  } catch (error) {
    console.error('Error updating token usage:', error);
    // Don't throw the error, just log it
  }
}

/**
 * Add a new chat message to the database
 */
export const addChatMessage = async (
  userId: string,
  companionId: CompanionId,
  message: ChatMessageType
): Promise<void> => {
  try {
    console.log(`📝 Chat.ts: Adding new chat message for user ${userId} with companion ${companionId}`);
    console.log(`📝 Chat.ts: Message content: "${message.content.substring(0, 30)}..."`);
    console.log(`📝 Chat.ts: Message ID: ${message.id}, Sender: ${message.sender}`);
    
    // Get message prefix for more precise matching (first 20 chars of ID)
    const messageIdPrefix = message.id.substring(0, 20);
    const now = Date.now();
    
    // Check if this message ID has been processed recently (deduplication)
    if (recentMessageIds.has(message.id)) {
      console.log(`🔄 Chat.ts: Skipping exact duplicate message with ID ${message.id}`);
      return;
    }
    
    // Generate a content-based key for companion messages (more lenient for AI responses)
    if (message.sender === 'companion') {
      // For companion messages, use a content hash to detect duplicates
      const contentKey = `${userId}_${companionId}_${message.content.substring(0, 40)}`;
      
      if (recentMessageContents.has(contentKey)) {
        const lastTime = recentMessageContents.get(contentKey) || 0;
        if (now - lastTime < 10000) { // 10 seconds for content-based deduplication
          console.log(`🔄 Chat.ts: Skipping duplicate companion message based on content similarity`);
          return;
        }
      }
      
      // Add to content cache
      recentMessageContents.set(contentKey, now);
      
      // Trim content cache if needed
      if (recentMessageContents.size > MAX_CONTENT_CACHE_SIZE) {
        const oldestKey = Array.from(recentMessageContents.entries())
          .sort((a, b) => a[1] - b[1])[0][0];
        recentMessageContents.delete(oldestKey);
      }
    } else {
      // Check if a similar message ID was processed very recently (for user messages)
      // This catches cases where a slightly different ID is generated in rapid succession
      for (const existingId of recentMessageIds) {
        // If the ID prefix matches and the message was processed within the timeout period
        if (existingId.startsWith(messageIdPrefix.substring(0, 15))) {
          const lastTime = recentMessageTimes.get(existingId) || 0;
          if (now - lastTime < MIN_TIME_BETWEEN_DUPLICATES) {
            console.log(`🔄 Chat.ts: Skipping probable duplicate message. 
              - Existing ID: ${existingId.substring(0, 20)}... 
              - New ID: ${message.id.substring(0, 20)}...
              - Time difference: ${now - lastTime}ms`);
            return;
          }
        }
      }
    }
    
    // Add to recent messages cache
    recentMessageIds.add(message.id);
    recentMessageTimes.set(message.id, now);
    
    // Trim cache if it gets too large
    if (recentMessageIds.size > MAX_CACHE_SIZE) {
      // Get oldest 20 items to remove
      const idsToRemove = Array.from(recentMessageTimes.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 20)
        .map(entry => entry[0]);
      
      idsToRemove.forEach(id => {
        recentMessageIds.delete(id);
        recentMessageTimes.delete(id);
      });
    }
    
    // Log current auth state
    if (auth.currentUser) {
      console.log(`🔑 Chat.ts: Current auth user when adding message: ${auth.currentUser.uid}`);
      
      // Check if user IDs match
      if (auth.currentUser.uid !== userId) {
        console.warn(`⚠️ Chat.ts: Auth user ID (${auth.currentUser.uid}) doesn't match requested user ID (${userId})`);
      }
      
      try {
        // Check token expiration
        const tokenResult = await auth.currentUser.getIdTokenResult();
        const expTime = new Date(tokenResult.expirationTime);
        const timeUntilExp = expTime.getTime() - Date.now();
        console.log(`🔑 Chat.ts: Token expires in ${Math.round(timeUntilExp/60000)} minutes when adding message`);
        
        // Force refresh token if it's close to expiring (less than 5 minutes)
        if (timeUntilExp < 5 * 60 * 1000) {
          console.log('⚠️ Chat.ts: Token expiring soon, forcing refresh before adding message');
          await auth.currentUser.getIdToken(true);
          console.log('✅ Chat.ts: Token force-refreshed successfully before adding message');
        }
      } catch (e) {
        console.error('❌ Chat.ts: Error checking token expiration when adding message:', e);
      }
    } else {
      console.warn('⚠️ Chat.ts: No authenticated user found when adding chat message!');
    }
    
    // First check and update usage limits
    console.log('📊 Chat.ts: Checking message usage limits');
    const canSendMessage = await checkAndUpdateUsage(userId);
    
    if (!canSendMessage) {
      console.log('⛔ Chat.ts: Daily message limit reached');
      throw new Error('Daily message limit reached. Try again tomorrow!');
    }
    
    // Update user's last active timestamp
    console.log('⏱️ Chat.ts: Updating user last active time');
    await updateUserLastActive(userId);
    
    // Check token usage
    console.log('📊 Chat.ts: Checking token usage');
    const canUseTokens = await checkTokenUsage(userId);
    if (!canUseTokens) {
      throw new Error('Daily token limit reached');
    }
    
    // Add message to the chat collection
    console.log('💾 Chat.ts: About to add message to Firestore');
    const chatCollection = collection(db, 'users', userId, 'chats');
    const docRef = await addDoc(chatCollection, {
      sender: message.sender,
      content: message.content,
      timestamp: message.timestamp,
      companionId: companionId,
      deleted: false
    });
    
    console.log(`✅ Chat.ts: Message added successfully with document ID: ${docRef.id}`);
    
    // Update token usage
    const messageTokens = countTokens(message.content);
    await updateTokenUsage(userId, messageTokens);
    
    // After successful save, run diagnostic to verify it was saved
    console.log('🔍 Chat.ts: Verifying message was saved by running diagnostic');
    setTimeout(() => {
      getAllChatMessagesForDebugging(userId, companionId).catch(err => {
        console.error('❌ Chat.ts: Error running post-save diagnostic:', err);
      });
    }, 500); // Small delay to ensure Firestore has time to update
    
  } catch (error) {
    console.error('❌ Chat.ts: Error adding chat message:', error);
    
    // Log specific error details for Firestore permission issues
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        console.error(`🔒 Chat.ts: Permission denied error details when adding message: 
          - User ID: ${userId}
          - Companion ID: ${companionId}
          - Error message: ${error.message}
          - Is Auth Current User set: ${!!auth.currentUser}
          - Auth UID: ${auth.currentUser?.uid}
        `);
      }
    }
    
    throw error;
  }
};

/**
 * Get chat history for a specific user and companion
 */
export const getChatHistory = async (
  userId: string,
  companionId: CompanionId
): Promise<ChatMessageType[]> => {
  try {
    console.log(`📝 Chat.ts: Fetching chat history for user ${userId} with companion ${companionId}`);
    
    // Log current auth state
    if (auth.currentUser) {
      console.log(`🔑 Chat.ts: Current auth user: ${auth.currentUser.uid}`);
      
      try {
        // Check token expiration
        const tokenResult = await auth.currentUser.getIdTokenResult();
        const expTime = new Date(tokenResult.expirationTime);
        const timeUntilExp = expTime.getTime() - Date.now();
        console.log(`🔑 Chat.ts: Token expires in ${Math.round(timeUntilExp/60000)} minutes`);
        
        // Force refresh token if it's close to expiring
        if (timeUntilExp < 5 * 60 * 1000) {
          await auth.currentUser.getIdToken(true);
        }
      } catch (e) {
        console.error('❌ Chat.ts: Error checking token expiration:', e);
      }
    }
    
    const chatCollection = collection(db, 'users', userId, 'chats');
    console.log(`🔍 Chat.ts: Query path - users/${userId}/chats`);
    
    // Check if collection exists first
    try {
      // Get at least one document to check if collection exists
      const checkQuery = query(
        chatCollection,
        limit(1)
      );
      
      const checkSnapshot = await getDocs(checkQuery);
      if (checkSnapshot.empty) {
        console.log(`⚠️ Chat.ts: No messages found for user ${userId} in chats collection`);
      } else {
        console.log(`✅ Chat.ts: Chats collection exists for user ${userId}`);
      }
    } catch (e) {
      console.error('❌ Chat.ts: Error checking chats collection:', e);
    }
    
    // First, build a query that gets messages for this companion
    const baseQuery = query(
      chatCollection,
      where('companionId', '==', companionId),
      orderBy('timestamp', 'desc'),
      limit(MAX_CHAT_HISTORY)
    );
    
    console.log(`🔍 Chat.ts: Executing query for companion ${companionId}`);
    const querySnapshot = await getDocs(baseQuery);
    console.log(`✅ Chat.ts: Query executed successfully, got ${querySnapshot.size} documents`);
    
    const messages: ChatMessageType[] = [];
    
    // Process results, filtering out any explicitly deleted messages
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Skip messages that are explicitly marked as deleted
      if (data.deleted === true) {
        console.log(`🔍 Chat.ts: Skipping deleted message ${doc.id}`);
        return;
      }
      
      console.log(`🔍 Chat.ts: Processing message ${doc.id}, sender: ${data.sender}`);
      messages.push({
        id: doc.id,
        sender: data.sender,
        content: data.content,
        timestamp: data.timestamp,
        companionId: data.companionId,
      });
    });
    
    console.log(`✅ Chat.ts: Returning ${messages.length} messages after filtering`);
    // Return messages in chronological order
    return messages.reverse();
    
  } catch (error) {
    console.error('❌ Chat.ts: Error getting chat history:', error);
    return [];
  }
};

/**
 * Clear chat history for a specific user and companion
 */
export const clearChatHistory = async (
  userId: string,
  companionId: CompanionId
): Promise<void> => {
  try {
    const chatCollection = collection(db, 'users', userId, 'chats');
    const q = query(
      chatCollection,
      where('companionId', '==', companionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Delete each document
    const deletePromises = querySnapshot.docs.map(async (document) => {
      await updateDoc(doc(db, 'users', userId, 'chats', document.id), {
        deleted: true
      });
    });
    
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};

// Get current chat usage
export const getChatUsage = async (
  userId: string
): Promise<ChatUsage> => {
  try {
    const usageRef = doc(db, `users/${userId}/settings/chatUsage`);
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      return usageSnap.data() as ChatUsage;
    } else {
      // Create default usage document if it doesn't exist
      const defaultUsage: ChatUsage = {
        dailyMessageCount: 0,
        lastMessageDate: Timestamp.now()
      };
      
      await setDoc(usageRef, defaultUsage);
      return defaultUsage;
    }
  } catch (error) {
    console.error('Error getting chat usage:', error);
    // Return default if we can't access the document
    return {
      dailyMessageCount: 0,
      lastMessageDate: Timestamp.now()
    };
  }
};

// Check if user has reached daily limit and update usage count
export const checkAndUpdateUsage = async (
  userId: string
): Promise<boolean> => {
  try {
    const usageRef = doc(db, `users/${userId}/settings/chatUsage`);
    const usageSnap = await getDoc(usageRef);
    
    const now = Timestamp.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (usageSnap.exists()) {
      const usage = usageSnap.data() as ChatUsage;
      const lastDate = usage.lastMessageDate.toDate();
      const lastDay = new Date(lastDate);
      lastDay.setHours(0, 0, 0, 0);
      
      // Check if it's a new day
      if (today.getTime() !== lastDay.getTime()) {
        // Reset for new day
        await setDoc(usageRef, {
          dailyMessageCount: 1,
          lastMessageDate: now
        });
        return true;
      } else {
        // Same day, check against limit
        if (usage.dailyMessageCount >= MAX_DAILY_MESSAGES) {
          return false;
        }
        
        // Increment counter
        await updateDoc(usageRef, {
          dailyMessageCount: increment(1),
          lastMessageDate: now
        });
        return true;
      }
    } else {
      // Create new usage document
      await setDoc(usageRef, {
        dailyMessageCount: 1,
        lastMessageDate: now
      });
      return true;
    }
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return true;
  }
};

// Get remaining messages for today
export const getRemainingMessages = async (
  userId: string
): Promise<number> => {
  try {
    console.log(`📊 Chat.ts: Checking remaining messages for user ${userId}`);
    
    // Log current auth state
    if (auth.currentUser) {
      console.log(`🔑 Chat.ts: Current auth user when checking messages: ${auth.currentUser.uid}`);
      
      // Check if user IDs match
      if (auth.currentUser.uid !== userId) {
        console.warn(`⚠️ Chat.ts: Auth user ID (${auth.currentUser.uid}) doesn't match requested user ID (${userId})`);
      }
    } else {
      console.warn('⚠️ Chat.ts: No authenticated user found when checking remaining messages');
    }
    
    console.log('📊 Chat.ts: Getting current chat usage');
    const usage = await getChatUsage(userId);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const lastDate = usage.lastMessageDate.toDate();
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    
    console.log(`📊 Chat.ts: Daily message count: ${usage.dailyMessageCount}, last message date: ${lastDate.toLocaleString()}`);
    
    // If it's a new day, they have all messages available
    if (today.getTime() !== lastDay.getTime()) {
      console.log('📊 Chat.ts: New day detected, resetting message count');
      return MAX_DAILY_MESSAGES;
    }
    
    // Calculate remaining
    const remaining = Math.max(0, MAX_DAILY_MESSAGES - usage.dailyMessageCount);
    console.log(`📊 Chat.ts: User has ${remaining} messages remaining today`);
    return remaining;
  } catch (error) {
    console.error('❌ Chat.ts: Error getting remaining messages:', error);
    
    // Log specific error details for Firestore permission issues
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        console.error(`🔒 Chat.ts: Permission denied error details when checking remaining messages: 
          - User ID: ${userId}
          - Error message: ${error.message}
          - Is Auth Current User set: ${!!auth.currentUser}
          - Auth UID: ${auth.currentUser?.uid}
        `);
      }
    }
    
    return MAX_DAILY_MESSAGES; // Default to full amount if we can't check
  }
};

/**
 * Diagnostic function to get ALL chat messages regardless of filters
 * This is for debugging purposes only
 */
export const getAllChatMessagesForDebugging = async (
  userId: string,
  companionId: CompanionId
): Promise<void> => {
  try {
    console.log(`🔍 DIAGNOSTIC: Fetching ALL chat messages for user ${userId} with companion ${companionId}`);
    
    const chatCollection = collection(db, 'users', userId, 'chats');
    console.log(`🔍 DIAGNOSTIC: Query path - users/${userId}/chats`);
    
    // Simple query with no filtering
    const q = query(
      chatCollection,
      where('companionId', '==', companionId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`🔍 DIAGNOSTIC: Found ${querySnapshot.size} total documents`);
    
    // Log all documents and their data
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`🔍 DIAGNOSTIC: Document ${doc.id}:`, data);
      console.log(`🔍 DIAGNOSTIC: Timestamp:`, data.timestamp?.toDate());
      console.log(`🔍 DIAGNOSTIC: Deleted field:`, data.deleted === undefined ? 'MISSING' : data.deleted);
      console.log('----------------------------------------');
    });
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Error getting all chat messages:', error);
  }
};
