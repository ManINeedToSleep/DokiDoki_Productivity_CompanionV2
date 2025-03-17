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
  serverTimestamp
} from 'firebase/firestore';
import { updateUserLastActive } from './user';

export interface ChatMessageType {
  id: string;
  sender: 'user' | 'companion';
  content: string;
  timestamp: Timestamp;
  companionId: CompanionId;
}

// Maximum number of messages to retrieve
const MAX_CHAT_HISTORY = 50;

/**
 * Add a new chat message to the database
 */
export const addChatMessage = async (
  userId: string,
  companionId: CompanionId,
  message: ChatMessageType
): Promise<void> => {
  try {
    // Update user's last active timestamp
    await updateUserLastActive(userId);
    
    // Add message to the chat collection
    const chatCollection = collection(db, 'users', userId, 'chats');
    await addDoc(chatCollection, {
      sender: message.sender,
      content: message.content,
      timestamp: serverTimestamp(),
      companionId: companionId,
    });
    
  } catch (error) {
    console.error('Error adding chat message:', error);
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
    const chatCollection = collection(db, 'users', userId, 'chats');
    const q = query(
      chatCollection,
      where('companionId', '==', companionId),
      orderBy('timestamp', 'desc'),
      limit(MAX_CHAT_HISTORY)
    );
    
    const querySnapshot = await getDocs(q);
    const messages: ChatMessageType[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        content: data.content,
        timestamp: data.timestamp,
        companionId: data.companionId,
      });
    });
    
    // Return messages in chronological order
    return messages.reverse();
    
  } catch (error) {
    console.error('Error getting chat history:', error);
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