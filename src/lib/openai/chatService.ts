import { Timestamp } from 'firebase/firestore';
import { ChatMessageType } from '@/lib/firebase/chat';
import { CompanionId, CompanionPersonality } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';

// Maximum tokens to use for context
const MAX_CONTEXT_TOKENS = 4000;

// Maximum messages to include in context
const MAX_CONTEXT_MESSAGES = 20;

// API request deduplication cache
const recentRequestCache = new Map<string, {
  timestamp: number;
  response: string;
}>();
const MAX_CACHE_ENTRIES = 50;
const REQUEST_CACHE_TTL = 5000; // 5 seconds

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentRequestCache.entries()) {
    if (now - value.timestamp > REQUEST_CACHE_TTL) {
      recentRequestCache.delete(key);
    }
  }
}, 30000); // Check every 30 seconds

// Get character personality details
const getCharacterPersonality = (companionId: CompanionId): CompanionPersonality => {
  // These match the definitions in companion.ts
  const personalities: Record<CompanionId, CompanionPersonality> = {
    sayori: {
      traits: ['cheerful', 'energetic', 'caring', 'optimistic', 'scatterbrained'],
      interests: ['poetry', 'friends', 'food', 'sunny days', 'helping others'],
      motivationStyle: 'cheerful',
      speakingStyle: 'Uses lots of exclamation marks! Talks with enthusiasm and energy. Often uses words like "Ehehe~" or "Yaay!" when excited. Very supportive and encouraging. Occasionally forgets things or gets confused, but always means well.'
    },
    natsuki: {
      traits: ['tsundere', 'defensive', 'passionate', 'honest', 'proud'],
      interests: ['manga', 'baking', 'cute things', 'asserting independence'],
      motivationStyle: 'tough',
      speakingStyle: 'Blunt and sometimes harsh. Uses phrases like "Hmph!" or "It\'s not like I..." Easily flustered and quick to get defensive. Speaks with attitude but cares deeply. Adds "~" to words when excited about something she likes.'
    },
    yuri: {
      traits: ['intelligent', 'mysterious', 'elegant', 'anxious', 'passionate'],
      interests: ['literature', 'horror', 'tea', 'collecting knives', 'quiet activities'],
      motivationStyle: 'calm',
      speakingStyle: 'Speaks formally with rich vocabulary. Often hesitant, using "..." when nervous. Articulate about complex topics but struggles with social interaction. Sometimes gets lost in thought or overly excited about interests.'
    },
    monika: {
      traits: ['confident', 'intelligent', 'ambitious', 'athletic', 'leader'],
      interests: ['piano', 'writing', 'self-improvement', 'philosophy', 'technology'],
      motivationStyle: 'analytical',
      speakingStyle: 'Articulate and well-spoken. Uses phrases like "Ahaha~" when amused. Speaks directly and confidently. Makes literary references. Insightful about productivity and improvement. Encourages balanced approach to work and life.'
    }
  };
  
  return personalities[companionId] || personalities['sayori'];
};

// Get estimated token count for a message (rough approximation)
const estimateTokens = (text: string): number => {
  // GPT tokens are roughly 4 characters per token
  return Math.ceil(text.length / 4);
};

// Prepare chat context for OpenAI
export const getCompanionResponse = async (
  companionId: CompanionId,
  userMessage: string,
  chatHistory: ChatMessageType[],
  userData: UserDocument
): Promise<string> => {
  try {
    // Create a unique request ID for tracing
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Generate a cache key based on the request data
    // Using recent messages and the current message to detect duplicates
    const lastMessages = chatHistory.slice(-3).map(m => m.content.substring(0, 50)).join('');
    const requestKey = `${companionId}-${userMessage.substring(0, 50)}-${lastMessages}`;
    console.log(`🔑 ChatService: [${requestId}] Generated request key: ${requestKey.substring(0, 30)}...`);
    
    // Check cache for recent identical requests
    const cachedResponse = recentRequestCache.get(requestKey);
    if (cachedResponse) {
      console.log(`🔄 ChatService: [${requestId}] Using cached response for duplicate request (${Date.now() - cachedResponse.timestamp}ms old)`);
      return cachedResponse.response;
    }
    
    console.log(`📤 ChatService: [${requestId}] Sending new request to API with ${chatHistory.length} history messages`);
    
    // Call our API endpoint instead of OpenAI directly
    const startTime = Date.now();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companionId,
        userMessage,
        chatHistory,
        userData
      }),
    });
    const requestTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ ChatService: [${requestId}] API Error:`, errorData);
      throw new Error(errorData.error || "Failed to get response from API");
    }
    
    const data = await response.json();
    console.log(`📥 ChatService: [${requestId}] Received response in ${requestTime}ms, content length: ${data.response.length} chars`);
    
    // Store in cache
    if (recentRequestCache.size >= MAX_CACHE_ENTRIES) {
      // Remove oldest entry if cache is full
      const oldestKey = Array.from(recentRequestCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      recentRequestCache.delete(oldestKey);
    }
    
    recentRequestCache.set(requestKey, {
      timestamp: Date.now(),
      response: data.response
    });
    
    console.log(`✅ ChatService: [${requestId}] API request successful, response cached`);
    return data.response;
    
  } catch (error: any) {
    console.error("❌ ChatService: Error getting companion response:", error);
    return getFallbackResponse(companionId, userMessage);
  }
};

// Content moderation function
export const moderateContent = async (text: string): Promise<{
  flagged: boolean;
  reason?: string;
}> => {
  try {
    // Call our moderation API endpoint
    const response = await fetch('/api/moderation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error("Moderation API request failed");
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error with moderation API:", error);
    // Fallback to basic moderation
    return performBasicModeration(text);
  }
};

// Basic keyword moderation as fallback
function performBasicModeration(text: string): { flagged: boolean; reason?: string } {
  // Simple list of problematic terms to check
  const keywords = [
    // NSFW terms
    'nsfw', 'sexual', 'nude', 'naked', 'porn', 
    // Self-harm terms
    'suicide', 'kill myself', 'hurt myself',
    // Violence terms
    'murder', 'attack', 'weapon',
    // Out of character terms
    'ai', 'language model', 'openai', 'gpt', 'assistant',
  ];
  
  const lowercaseText = text.toLowerCase();
  
  for (const keyword of keywords) {
    if (lowercaseText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Content contains prohibited keywords`
      };
    }
  }
  
  return { flagged: false };
}

// Fallback response function when API fails
function getFallbackResponse(companionId: CompanionId, userMessage: string): string {
  // This is similar to the placeholder responses from the original code
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
} 