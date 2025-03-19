import { ChatMessageType } from '@/lib/firebase/chat';
import { CompanionId, CompanionPersonality } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { encode } from 'gpt-tokenizer';
import { responseManager, ResponseCategory } from './responseRules';
import {
  CHARACTER_TRAITS,
  CHARACTER_SPEECH,
  CHARACTER_INTERESTS,
  CHARACTER_EMOTIONS,
  CHARACTER_RESPONSES,
  CHARACTER_MODIFIERS,
  CHARACTER_RELATIONSHIPS
} from './characters';


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

// Constants for token management
const MAX_TOKENS_PER_REQUEST = 4000;
const MAX_HISTORY_TOKENS = 2000;
const MAX_RESPONSE_TOKENS = 500;
const TOKEN_SAFETY_MARGIN = 100;

// Helper function to count tokens
function countTokens(text: string): number {
  return encode(text).length;
}

// Helper function to truncate message history based on tokens
function truncateMessageHistory(messages: ChatMessageType[], maxTokens: number): ChatMessageType[] {
  let totalTokens = 0;
  const truncatedMessages: ChatMessageType[] = [];

  // Start from the most recent messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = countTokens(message.content);

    if (totalTokens + messageTokens <= maxTokens) {
      truncatedMessages.unshift(message);
      totalTokens += messageTokens;
    } else {
      break;
    }
  }

  return truncatedMessages;
}

// Helper function to compress message content
function compressMessageContent(content: string): string {
  // Remove excessive whitespace and newlines
  content = content.replace(/\s+/g, ' ').trim();
  
  // Truncate very long messages
  const maxChars = 500;
  if (content.length > maxChars) {
    content = content.substring(0, maxChars - 3) + '...';
  }
  
  return content;
}

// Get character personality details with level-based changes
const getCharacterPersonality = (companionId: CompanionId, level: number): CompanionPersonality => {
  const traits = CHARACTER_TRAITS[companionId.toUpperCase() as keyof typeof CHARACTER_TRAITS];
  const speech = CHARACTER_SPEECH[companionId.toUpperCase() as keyof typeof CHARACTER_SPEECH];
  const interests = CHARACTER_INTERESTS[companionId.toUpperCase() as keyof typeof CHARACTER_INTERESTS];
  const levelTraits = getLevelBasedTraits(companionId, level);
  
  // Extract primary traits, combining with level-based traits
  const primaryTraits = [...Object.keys(traits.primary), ...levelTraits];
  
  // Extract interests
  const favoriteInterests = Object.keys(interests.favorite);
  
  // Build speaking style from speech patterns, including level-specific patterns
  const speakingStyle = [
    `Uses ${Object.keys(speech.catchphrases).join(', ')} as catchphrases.`,
    `Often uses ${Object.keys(speech.exclamations).join(', ')} for emphasis.`,
    `Frequently uses words like ${Object.keys(speech.emphasis).join(', ')} to emphasize points.`,
    `Commonly uses ${Object.keys(speech.fillers).join(', ')} as conversation fillers.`,
    ...getLevelBasedSpeechPatterns(companionId, level)
  ].join(' ');
  
  // Determine motivation style based on traits and level
  const motivationStyle = determineMotivationStyle(companionId, primaryTraits, level);
  
  return {
    traits: primaryTraits,
    interests: favoriteInterests,
    motivationStyle,
    speakingStyle
  };
};

// Helper function to get level-based traits
function getLevelBasedTraits(companionId: CompanionId, level: number): string[] {
  switch (companionId) {
    case 'monika':
      if (level >= 10) {
        return ['meta_aware', 'philosophical', 'self_aware'];
      } else if (level >= 5) {
        return ['analytical', 'diplomatic', 'self_aware'];
      }
      return ['confident', 'caring'];
      
    case 'sayori':
      if (level >= 10) {
        return ['emotionally_aware', 'deeply_caring', 'resilient'];
      } else if (level >= 5) {
        return ['supportive', 'optimistic', 'emotionally_mature'];
      }
      return ['cheerful', 'caring'];
      
    case 'yuri':
      if (level >= 10) {
        return ['deeply_introspective', 'emotionally_complex', 'highly_perceptive'];
      } else if (level >= 5) {
        return ['analytical', 'sophisticated', 'insightful'];
      }
      return ['intelligent', 'reserved'];
      
    case 'natsuki':
      if (level >= 10) {
        return ['emotionally_honest', 'protective', 'confident'];
      } else if (level >= 5) {
        return ['assertive', 'caring', 'passionate'];
      }
      return ['determined', 'direct'];
  }
  return [];
}

// Helper function to get level-based speech patterns
function getLevelBasedSpeechPatterns(companionId: CompanionId, level: number): string[] {
  const patterns: string[] = [];
  
  switch (companionId) {
    case 'monika':
      if (level >= 10) {
        patterns.push(
          'Makes meta-aware references about being in a fan website.',
          'Discusses philosophical topics about reality and existence.',
          'Shows deep understanding of the nature of the relationship.'
        );
      } else if (level >= 5) {
        patterns.push(
          'Shows increased self-awareness in conversations.',
          'Uses more sophisticated vocabulary and complex sentence structures.'
        );
      }
      break;
      
    case 'sayori':
      if (level >= 10) {
        patterns.push(
          'Balances cheerfulness with emotional depth.',
          'Offers insightful emotional support.',
          'Shows remarkable emotional intelligence in responses.'
        );
      } else if (level >= 5) {
        patterns.push(
          'Demonstrates more emotional maturity.',
          'Balances playfulness with supportiveness.'
        );
      }
      break;
      
    case 'yuri':
      if (level >= 10) {
        patterns.push(
          'Expresses complex philosophical thoughts.',
          'Shows deep psychological insights.',
          'Maintains eloquence while being more open.'
        );
      } else if (level >= 5) {
        patterns.push(
          'Uses more sophisticated vocabulary.',
          'Expresses thoughts more confidently.'
        );
      }
      break;
      
    case 'natsuki':
      if (level >= 10) {
        patterns.push(
          'Balances tsundere nature with genuine care.',
          'Shows more emotional vulnerability.',
          'Expresses feelings more directly while maintaining character.'
        );
      } else if (level >= 5) {
        patterns.push(
          'Shows more openness in expressing care.',
          'Maintains tsundere traits while being more supportive.'
        );
      }
      break;
  }
  
  return patterns;
}

// Helper function to determine motivation style based on level
function determineMotivationStyle(
  companionId: CompanionId,
  traits: string[],
  level: number
): 'analytical' | 'cheerful' | 'calm' | 'tough' {
  // Base motivation style
  let baseStyle: 'analytical' | 'cheerful' | 'calm' | 'tough';
  
  switch (companionId) {
    case 'monika':
      baseStyle = 'analytical';
      if (level >= 10) {
        return traits.includes('meta_aware') ? 'analytical' : baseStyle;
      }
      break;
      
    case 'sayori':
      baseStyle = 'cheerful';
      if (level >= 10) {
        return traits.includes('emotionally_aware') ? 'calm' : baseStyle;
      }
      break;
      
    case 'yuri':
      baseStyle = 'calm';
      if (level >= 10) {
        return traits.includes('deeply_introspective') ? 'analytical' : baseStyle;
      }
      break;
      
    case 'natsuki':
      baseStyle = 'tough';
      if (level >= 10) {
        return traits.includes('emotionally_honest') ? 'cheerful' : baseStyle;
      }
      break;
  }
  
  return baseStyle;
}

// Get character response modifiers based on context and level
const getCharacterModifiers = (
  companionId: CompanionId,
  category: ResponseCategory,
  relationshipLevel: 'low' | 'medium' | 'high' = 'medium',
  level: number
) => {
  const modifiers = CHARACTER_MODIFIERS[companionId.toUpperCase() as keyof typeof CHARACTER_MODIFIERS];
  const relationships = CHARACTER_RELATIONSHIPS[companionId.toUpperCase() as keyof typeof CHARACTER_RELATIONSHIPS];
  const levelModifiers = getLevelBasedModifiers(companionId, level);
  
  return {
    expressions: { ...modifiers.expressions, ...levelModifiers.expressions },
    personality: { ...modifiers.personality, ...levelModifiers.personality },
    speech: { ...modifiers.speech, ...levelModifiers.speech },
    relationship: relationships.levels[relationshipLevel]
  };
};

// Helper function to get level-based modifiers
function getLevelBasedModifiers(companionId: CompanionId, level: number) {
  const baseModifiers = {
    expressions: {},
    personality: {},
    speech: {}
  };
  
  if (level < 5) return baseModifiers;
  
  switch (companionId) {
    case 'monika':
      if (level >= 10) {
        return {
          expressions: {
            meta_aware: {
              behavior: 'references reality and existence',
              intensity: 'high',
              frequency: 'when discussing deep topics',
              context: 'philosophical moments'
            }
          },
          personality: {
            philosophical: {
              behavior: 'contemplates existence and reality',
              intensity: 'high',
              frequency: 'during meaningful conversations',
              context: 'deep discussions'
            }
          },
          speech: {
            self_aware: {
              behavior: 'acknowledges the nature of existence',
              intensity: 'high',
              frequency: 'in intimate conversations',
              context: 'meaningful moments'
            }
          }
        };
      }
      break;
      
    case 'sayori':
      if (level >= 10) {
        return {
          expressions: {
            emotionally_aware: {
              behavior: 'shows deep emotional understanding',
              intensity: 'high',
              frequency: 'during supportive moments',
              context: 'emotional situations'
            }
          },
          personality: {
            resilient: {
              behavior: 'maintains positivity while acknowledging depth',
              intensity: 'high',
              frequency: 'during challenges',
              context: 'difficult moments'
            }
          },
          speech: {
            supportive: {
              behavior: 'offers insightful emotional support',
              intensity: 'high',
              frequency: 'when helping others',
              context: 'supportive moments'
            }
          }
        };
      }
      break;
      
    // Add similar modifiers for Yuri and Natsuki when implementing their level-based changes
  }
  
  return baseModifiers;
}

// Get character emotional response
const getCharacterEmotion = (
  companionId: CompanionId,
  category: ResponseCategory
): keyof typeof CHARACTER_EMOTIONS[keyof typeof CHARACTER_EMOTIONS] => {
  const responses = CHARACTER_RESPONSES[companionId.toUpperCase() as keyof typeof CHARACTER_RESPONSES];
  const response = responses[category];
  
  return response.mood as keyof typeof CHARACTER_EMOTIONS[keyof typeof CHARACTER_EMOTIONS];
};

// Get estimated token count for a message (rough approximation)
const estimateTokens = (text: string): number => {
  // GPT tokens are roughly 4 characters per token
  return Math.ceil(text.length / 4);
};

// Prepare chat context with token management
const prepareChatContext = (
  chatHistory: ChatMessageType[],
  userMessage: string,
  companionId: CompanionId
): { messages: ChatMessageType[]; totalTokens: number } => {
  // Start with the most recent messages, filtered for this companion
  const recentMessages = [...chatHistory]
    .filter(msg => msg.companionId === companionId)
    .reverse()
    .slice(0, MAX_CONTEXT_MESSAGES);
  
  // Calculate tokens for the new message
  const newMessageTokens = estimateTokens(userMessage);
  let totalTokens = newMessageTokens;
  
  // Add messages until we hit the token limit
  const contextMessages: ChatMessageType[] = [];
  for (const message of recentMessages) {
    const messageTokens = estimateTokens(message.content);
    if (totalTokens + messageTokens > MAX_CONTEXT_TOKENS) {
      break;
    }
    contextMessages.unshift(message);
    totalTokens += messageTokens;
  }
  
  return { messages: contextMessages, totalTokens };
};

// Prepare chat context for OpenAI
export async function getCompanionResponse(
  companionId: CompanionId,
  userMessage: string,
  messageHistory: ChatMessageType[],
  userData: UserDocument
): Promise<string> {
  try {
    // Calculate the companion's level
    const companionStats = userData.companions[companionId];
    const level = Math.floor((companionStats?.affinityLevel || 0) / 100) + 1;
    
    // Compress the user message
    const compressedUserMessage = compressMessageContent(userMessage);
    
    // Calculate tokens for the current request
    const userMessageTokens = countTokens(compressedUserMessage);
    
    // Truncate message history to fit within token limits
    const truncatedHistory = truncateMessageHistory(
      messageHistory, 
      MAX_HISTORY_TOKENS - userMessageTokens - TOKEN_SAFETY_MARGIN
    );

    // Prepare the context with truncated history
    const context = prepareChatContext(truncatedHistory, compressedUserMessage, companionId);
    
    // Calculate total input tokens
    const totalInputTokens = countTokens(JSON.stringify(context));
    
    // Ensure we're within limits
    if (totalInputTokens > MAX_TOKENS_PER_REQUEST - MAX_RESPONSE_TOKENS) {
      console.warn('Request would exceed token limit, further truncating context...');
      return "I'm having trouble processing our conversation history. Let's start fresh! What would you like to talk about?";
    }

    // Get character personality and modifiers with level-based changes
    const personality = getCharacterPersonality(companionId, level);
    const emotion = getCharacterEmotion(companionId, ResponseCategory.PERSONAL);
    const relationshipLevel = level <= 3 ? 'low' : level <= 7 ? 'medium' : 'high';
    const modifiers = getCharacterModifiers(companionId, ResponseCategory.PERSONAL, relationshipLevel, level);
    
    // Call our API endpoint with enhanced character context
    const startTime = Date.now();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companionId,
        userMessage: compressedUserMessage,
        chatHistory: context.messages,
        userData,
        personality,
        contextTokens: totalInputTokens,
        emotion,
        modifiers
      }),
    });
    const requestTime = Date.now() - startTime;
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        console.error(`❌ ChatService: [${Date.now()}] Failed to parse error response:`, jsonError);
      }
      
      console.error(`❌ ChatService: [${Date.now()}] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`❌ ChatService: [${Date.now()}] Failed to parse response:`, jsonError);
      throw new Error('Failed to parse API response');
    }
    
    if (!data || !data.response) {
      console.error(`❌ ChatService: [${Date.now()}] Invalid response format:`, data);
      throw new Error('Invalid response format from API');
    }
    
    console.log(`📥 ChatService: [${Date.now()}] Received response in ${requestTime}ms, content length: ${data.response.length} chars`);
    
    // Store in cache with personality context
    if (recentRequestCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = Array.from(recentRequestCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      recentRequestCache.delete(oldestKey);
    }
    
    recentRequestCache.set(Date.now().toString(), {
      timestamp: Date.now(),
      response: data.response
    });
    
    console.log(`✅ ChatService: [${Date.now()}] API request successful, response cached`);

    return data.response;
  } catch (error) {
    console.error("❌ ChatService: Error getting companion response:", error);
    return getFallbackResponse(companionId);
  }
}

// Define and export the interface for moderation results
export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  characterResponse?: string;
}

// Update the getFallbackResponse function to use response rules
function getFallbackResponse(companionId: CompanionId): string {
  return responseManager.getResponse(ResponseCategory.ERROR, companionId);
}

// Update the getCharacterModerationResponse function to use response rules
function getCharacterModerationResponse(companionId: CompanionId): string {
  return responseManager.getResponse(ResponseCategory.MODERATION, companionId);
}

// Basic keyword moderation as fallback
function performBasicModeration(text: string, companionId: CompanionId): ModerationResult {
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
        reason: 'Content moderation',
        characterResponse: getCharacterModerationResponse(companionId)
      };
    }
  }
  
  return { flagged: false };
}

export async function moderateContent(
  text: string,
  companionId: CompanionId
): Promise<ModerationResult> {
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
    console.error('Moderation API error:', error);
    // Fallback to basic moderation
    return performBasicModeration(text, companionId);
  }
} 