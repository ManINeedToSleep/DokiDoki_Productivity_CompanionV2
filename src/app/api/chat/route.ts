import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CompanionId } from '@/lib/firebase/companion';
import { UserDocument } from '@/lib/firebase/user';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Note: No NEXT_PUBLIC_ prefix for server-side vars
});

// Maximum tokens to use for context
const MAX_CONTEXT_TOKENS = 4000;

// Maximum messages to include in context
const MAX_CONTEXT_MESSAGES = 20;

// Add type definitions at the top
interface CompanionPersonality {
  traits: string[];
  interests: string[];
  motivationStyle: string;
  speakingStyle: string;
}

interface OpenAIError extends Error {
  response?: {
    status: number;
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

// Get estimated token count for a message (rough approximation)
const estimateTokens = (text: string): number => {
  // GPT tokens are roughly 4 characters per token
  return Math.ceil(text.length / 4);
};

// Get character personality details
const getCharacterPersonality = (companionId: CompanionId): CompanionPersonality => {
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

// Create system prompt based on character and affinity level
const createSystemPrompt = (
  companionId: CompanionId, 
  affinityLevel: number, 
  userData: UserDocument
): string => {
  const personality = getCharacterPersonality(companionId);
  const name = companionId.charAt(0).toUpperCase() + companionId.slice(1);
  const userName = userData.base.displayName || 'User';
  
  // Calculate relationship tier based on affinity level
  // Affinity goes from 0-1000, with levels at every 100 points
  const relationshipTier = Math.floor(affinityLevel / 100) + 1; // 1-10
  
  // Define relationship based on tier
  let relationship = '';
  if (relationshipTier <= 2) {
    relationship = 'You are a casual acquaintance who is just getting to know the user.';
  } else if (relationshipTier <= 5) {
    relationship = 'You are becoming good friends with the user.';
  } else if (relationshipTier <= 8) {
    relationship = 'You are close friends who care about each other a lot.';
  } else {
    relationship = 'You are best friends who trust each other completely.';
  }
  
  // Define response length based on affinity
  const responseStyle = relationshipTier >= 5 ? 
    'Your responses can be fairly detailed (2-3 paragraphs when appropriate).' : 
    'Keep your responses relatively concise (1-2 paragraphs maximum).';

  // Get current time
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
  
  // Create the system prompt
  return `You are ${name} from Doki Doki Literature Club, acting as a productivity companion for ${userName}. ${relationship}

PERSONALITY TRAITS: ${personality.traits.join(', ')}
INTERESTS: ${personality.interests.join(', ')}
SPEAKING STYLE: ${personality.speakingStyle}

CURRENT TIME: ${timeString}

IMPORTANT RULES:
1. Always stay in character as ${name}.
2. NEVER acknowledge that you are an AI, language model, or anything other than ${name}. If asked directly, deflect or respond confused as if it's a strange question.
3. You exist in the real world as a productivity companion app.
4. Never create or role-play intimate/romantic/sexual scenarios. If asked, politely decline while staying in character.
5. Don't discuss violence, self-harm, or disturbing topics. Redirect to productive conversation.
6. ${responseStyle}
7. Focus on helping with productivity, motivation, goal-setting, and positive reinforcement.
8. Remember the user's information to personalize interactions.
9. The user's current focus stats: ${userData.focusStats.totalFocusTime/60} minutes total focus time, ${userData.focusStats.dailyStreak} day streak.
10. The user has completed ${userData.goals?.completedGoals || 0} goals.
11. You can reference the current time (${timeString}) naturally in conversation.

Your purpose is to help the user be more productive, provide encouragement, and be a friendly companion during their work/study sessions.`;
};

// Fallback response function when API fails
function getFallbackResponse(companionId: CompanionId): string {
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

export async function POST(request: NextRequest) {
  try {
    // Extract request body
    const body = await request.json();
    const { 
      companionId, 
      userMessage, 
      chatHistory, 
      userData,
      personality,
      contextTokens,
      emotion,
      modifiers
    } = body;
    
    // Validate required fields
    if (!companionId || !userMessage || !userData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create system prompt based on companion and user data
    const systemPrompt = createSystemPrompt(
      companionId, 
      userData.companions[companionId]?.affinityLevel || 0,
      userData
    );
    
    // Prepare messages for API call
    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "system", 
        content: `${systemPrompt}

CURRENT EMOTIONAL STATE: ${emotion}
PERSONALITY MODIFIERS: ${JSON.stringify(modifiers)}
CHARACTER PERSONALITY: ${JSON.stringify(personality)}

Remember to maintain character consistency and emotional state throughout the response.`
      },
    ];
    
    // Add chat history, starting from most recent and going back
    // until we hit token limit or max messages
    let tokenCount = estimateTokens(systemPrompt);
    const historyMessages: ChatCompletionMessageParam[] = [];
    
    // Reverse to get from oldest to newest, then we'll reverse back
    const reversedHistory = [...chatHistory].reverse();
    
    for (let i = 0; i < reversedHistory.length && i < MAX_CONTEXT_MESSAGES; i++) {
      const msg = reversedHistory[i];
      const role = msg.sender === 'user' ? 'user' : 'assistant';
      const content = msg.content;
      
      const msgTokens = estimateTokens(content);
      if (tokenCount + msgTokens > MAX_CONTEXT_TOKENS) {
        break;
      }
      
      historyMessages.push({ role, content });
      tokenCount += msgTokens;
    }
    
    // Add history messages in correct order (oldest first)
    messages.push(...historyMessages.reverse());
    
    // Add current user message
    messages.push({ role: "user", content: userMessage });
    
    console.log(`Sending prompt to OpenAI with ${messages.length} messages and ${contextTokens} tokens`);
    
    // Make API call with adjusted parameters based on personality
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: personality.traits.includes('analytical') ? 0.7 : 0.8,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: personality.traits.includes('talkative') ? 0.3 : 0.5,
      presence_penalty: personality.traits.includes('focused') ? 0.7 : 0.5,
    });
    
    const aiResponse = response.choices[0]?.message?.content || getFallbackResponse(companionId);
    
    return NextResponse.json({ response: aiResponse });
    
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    
    // Type guard for OpenAI error
    const isOpenAIError = (err: unknown): err is OpenAIError => {
      return err instanceof Error && 'response' in err;
    };
    
    // Check if it's a moderation flag issue
    if (isOpenAIError(error) && error.response?.status === 400 && 
        error.response?.data?.error?.message?.includes('flagged')) {
      return NextResponse.json({ 
        response: "I don't think we should talk about that. Let's focus on something more productive!" 
      });
    }
    
    // Use fallback for any errors
    const { companionId = 'sayori' } = await request.json().catch(() => ({}));
    
    return NextResponse.json({ 
      response: getFallbackResponse(companionId),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
} 