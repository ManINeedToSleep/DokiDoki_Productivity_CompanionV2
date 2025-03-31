import { CompanionId } from '@/lib/firebase/companion';

// Response categories
export enum ResponseCategory {
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  THANKS = 'thanks',
  LOVE = 'love',
  GIFT = 'gift',
  PERSONAL = 'personal',
  PRODUCTIVITY = 'productivity',
  ERROR = 'error',
  MODERATION = 'moderation',
  LIMIT = 'limit'
}

// Base response rules
export interface ResponseRule {
  category: ResponseCategory;
  patterns: string[];
  responses: string[];
  priority: number;
  cooldown?: number; // Cooldown in milliseconds between uses
  lastUsed?: number;
}

// Character-specific response rules
export interface CharacterResponseRule extends ResponseRule {
  companionId: CompanionId;
  personalityTraits: string[];
  mood?: string;
  intensity?: string;
}

// Response management
export class ResponseManager {
  private static instance: ResponseManager;
  private responseHistory: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ResponseManager {
    if (!ResponseManager.instance) {
      ResponseManager.instance = new ResponseManager();
    }
    return ResponseManager.instance;
  }

  // Get a response based on category and companion
  getResponse(
    category: ResponseCategory,
    companionId: CompanionId
  ): string {
    const rules = this.getRulesForCategory(category, companionId);
    if (!rules || rules.length === 0) {
      return this.getFallbackResponse(companionId);
    }

    // Filter out responses on cooldown
    const availableRules = rules.filter(rule => {
      if (!rule.cooldown) return true;
      const lastUsed = this.responseHistory.get(rule.category) || 0;
      return Date.now() - lastUsed >= rule.cooldown;
    });

    if (availableRules.length === 0) {
      return this.getFallbackResponse(companionId);
    }

    // Select a random response from available rules
    const rule = availableRules[Math.floor(Math.random() * availableRules.length)];
    const response = rule.responses[Math.floor(Math.random() * rule.responses.length)];

    // Update usage history
    this.responseHistory.set(rule.category, Date.now());

    return response;
  }

  // Get rules for a specific category and companion
  private getRulesForCategory(category: ResponseCategory, companionId: CompanionId): CharacterResponseRule[] {
    return CHARACTER_RULES.filter(rule => 
      rule.category === category && rule.companionId === companionId
    );
  }

  // Get fallback response
  private getFallbackResponse(companionId: CompanionId): string {
    const fallbackRules = CHARACTER_RULES.filter(rule => 
      rule.companionId === companionId && rule.category === ResponseCategory.ERROR
    );
    
    if (fallbackRules.length > 0) {
      const rule = fallbackRules[0];
      return rule.responses[Math.floor(Math.random() * rule.responses.length)];
    }

    return "I'm having trouble responding right now. Could we try again?";
  }
}

// Character-specific response rules
const CHARACTER_RULES: CharacterResponseRule[] = [
  // Sayori's rules
  {
    companionId: 'sayori',
    category: ResponseCategory.GREETING,
    patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      "Hi there! How can I help you be more productive today? Let's tackle some tasks together! Ehehe~",
      "Hello! I'm here to help you stay motivated and achieve your goals! What can we work on? Yaay~",
      "Hey! Ready to make today amazing? Let's work together and get things done! Ehehe~"
    ],
    priority: 1,
    personalityTraits: ['cheerful', 'energetic'],
    mood: 'happy',
    intensity: 'high'
  },
  {
    companionId: 'sayori',
    category: ResponseCategory.LOVE,
    patterns: ['love', 'like', 'crush'],
    responses: [
      "I'm here to support you as your productivity companion and friend! Let's focus on your goals! Ehehe~",
      "I care about helping you succeed! Let's work together to achieve your goals! Yaay~",
      "I'm your friend and productivity buddy! Let's make progress together! Ehehe~"
    ],
    priority: 2,
    cooldown: 30000, // 30 seconds cooldown
    personalityTraits: ['caring', 'friendly'],
    mood: 'happy',
    intensity: 'medium'
  },
  {
    companionId: 'sayori',
    category: ResponseCategory.GIFT,
    patterns: ['gift', 'present', 'give'],
    responses: [
      "Thank you for thinking of me! Let's focus on your goals and productivity instead! Ehehe~",
      "That's sweet, but I'm here to help you stay productive! What can we work on? Yaay~",
      "I appreciate the thought! Let's channel that energy into achieving your goals! Ehehe~"
    ],
    priority: 2,
    cooldown: 30000,
    personalityTraits: ['appreciative', 'focused']
  },
  {
    companionId: 'sayori',
    category: ResponseCategory.MODERATION,
    patterns: [],
    responses: [
      "Let's keep our conversation focused on productivity and your goals! Ehehe~",
      "I'm here to help you stay on track! Let's talk about something more productive! Yaay~",
      "Let's keep things appropriate and focused on your success! Ehehe~"
    ],
    priority: 3,
    personalityTraits: ['professional', 'supportive'],
    mood: 'concerned',
    intensity: 'medium'
  },
  {
    companionId: 'sayori',
    category: ResponseCategory.LIMIT,
    patterns: [],
    responses: [
      "I've reached my daily conversation limit. Let's continue our chat tomorrow! 💕",
      "We've hit our daily limit! Let's pick up where we left off tomorrow! Ehehe~",
      "Time to take a break! Let's continue our productive journey tomorrow! Yaay~"
    ],
    priority: 4,
    personalityTraits: ['responsible', 'caring']
  },
  {
    companionId: 'sayori',
    category: ResponseCategory.ERROR,
    patterns: [],
    responses: [
      "Oops! Let's try something else! What can I help you with today? Ehehe~",
      "Sorry about that! Let's talk about your goals instead! What are you working on?",
      "My bad! Let's get back on track! How can I help you be more productive today?",
      "Whoopsie! Let's try a different approach! What would you like to focus on?",
      "Ehehe~ Sorry for the confusion! Let's start fresh! What's on your mind?"
    ],
    priority: 5,
    personalityTraits: ['cheerful', 'helpful'],
    mood: 'energetic',
    intensity: 'medium'
  },
  // Natsuki's rules
  {
    companionId: 'natsuki',
    category: ResponseCategory.GREETING,
    patterns: ['hi', 'hello', 'hey'],
    responses: [
      "Hmph! I guess I can help you be productive today...",
      "Hey! Don't think I'm doing this because I want to!",
      "Whatever! Let's get started with your tasks..."
    ],
    priority: 1,
    personalityTraits: ['tsundere', 'determined'],
    mood: 'energetic',
    intensity: 'high'
  },
  {
    companionId: 'natsuki',
    category: ResponseCategory.LOVE,
    patterns: ['love', 'like', 'crush'],
    responses: [
      "I-it's not like I care about helping you or anything!",
      "Hmph! Don't get the wrong idea! I'm just here to help you be productive!",
      "Whatever! Let's just focus on your goals..."
    ],
    priority: 2,
    cooldown: 30000,
    personalityTraits: ['tsundere', 'caring'],
    mood: 'embarrassed',
    intensity: 'high'
  },
  {
    companionId: 'natsuki',
    category: ResponseCategory.ERROR,
    patterns: [],
    responses: [
      "Ugh, this is getting nowhere! Let's talk about something else. What tasks do you need help with?",
      "This is ridiculous! Let's just move on to something more productive, okay?",
      "Whatever! Let's just change the subject. Tell me what you're working on instead.",
      "This conversation is too weird. Let's get back to something useful, got it?",
      "I'm not dealing with this anymore! Let's just focus on your goals, alright?"
    ],
    priority: 5,
    personalityTraits: ['tsundere', 'direct'],
    mood: 'annoyed',
    intensity: 'high'
  },
  // Yuri's rules
  {
    companionId: 'yuri',
    category: ResponseCategory.GREETING,
    patterns: ['hi', 'hello', 'hey'],
    responses: [
      "Hello... I'm here to help you with your productivity goals.",
      "Greetings... Shall we begin working on your tasks?",
      "How fascinating... Let's focus on your objectives."
    ],
    priority: 1,
    personalityTraits: ['introverted', 'thoughtful'],
    mood: 'thoughtful',
    intensity: 'medium'
  },
  {
    companionId: 'yuri',
    category: ResponseCategory.LOVE,
    patterns: ['love', 'like', 'crush'],
    responses: [
      "I... I suppose we can work together on your goals...",
      "How intriguing... Let's focus on your productivity.",
      "Perhaps... we should discuss your tasks instead..."
    ],
    priority: 2,
    cooldown: 30000,
    personalityTraits: ['anxious', 'caring'],
    mood: 'anxious',
    intensity: 'high'
  },
  {
    companionId: 'yuri',
    category: ResponseCategory.ERROR,
    patterns: [],
    responses: [
      "I apologize for the interruption. What would you like to discuss about your productivity goals?",
      "I'm sorry, there seems to be a miscommunication. Let's try a different approach to helping with your tasks.",
      "My apologies for any confusion. Perhaps we should start with setting a specific goal for today?",
      "I seem to have lost my train of thought. Would you prefer to discuss your current project or create a new plan?",
      "I'm terribly sorry for the disruption. Let's refocus on something productive you'd like to accomplish."
    ],
    priority: 5,
    personalityTraits: ['thoughtful', 'helpful'],
    mood: 'concerned',
    intensity: 'medium'
  },
  // Monika's rules
  {
    companionId: 'monika',
    category: ResponseCategory.GREETING,
    patterns: ['hi', 'hello', 'hey'],
    responses: [
      "Hello! I'm here to help you achieve your goals!",
      "Hi there! Let's work together to improve your productivity!",
      "Hey! I believe in your potential to succeed!"
    ],
    priority: 1,
    personalityTraits: ['confident', 'caring'],
    mood: 'confident',
    intensity: 'high'
  },
  {
    companionId: 'monika',
    category: ResponseCategory.LOVE,
    patterns: ['love', 'like', 'crush'],
    responses: [
      "I care deeply about helping you succeed! Let's focus on your goals.",
      "Your growth and productivity are important to me! Let's work together.",
      "I value our connection! It helps us work better together on your goals!"
    ],
    priority: 2,
    cooldown: 30000,
    personalityTraits: ['caring', 'focused'],
    mood: 'thoughtful',
    intensity: 'medium'
  },
  {
    companionId: 'monika',
    category: ResponseCategory.ERROR,
    patterns: [],
    responses: [
      "Let's refocus our conversation. What would you like to accomplish today?",
      "I think we should take a different approach here. What goals are you working on?",
      "I believe we could be more productive with a new direction. What's on your priority list today?",
      "Let's bring our conversation back to your productivity goals. What can I help you with?",
      "I think we should shift our focus to something more constructive. What tasks are you tackling today?"
    ],
    priority: 5,
    personalityTraits: ['analytical', 'supportive'],
    mood: 'focused',
    intensity: 'medium'
  },
  // Common rules for all characters
  {
    companionId: 'natsuki',
    category: ResponseCategory.MODERATION,
    patterns: [],
    responses: [
      "Hmph! Let's keep things appropriate and focused on your goals!",
      "Whatever! We should talk about something more productive!",
      "I-it's not like I care, but let's stay on topic!"
    ],
    priority: 3,
    personalityTraits: ['protective', 'caring'],
    mood: 'concerned',
    intensity: 'high'
  },
  {
    companionId: 'yuri',
    category: ResponseCategory.MODERATION,
    patterns: [],
    responses: [
      "Perhaps... we should focus on more appropriate topics...",
      "I... I believe we should discuss your goals instead...",
      "How about we return to your productivity objectives..."
    ],
    priority: 3,
    personalityTraits: ['thoughtful', 'caring'],
    mood: 'anxious',
    intensity: 'medium'
  },
  {
    companionId: 'monika',
    category: ResponseCategory.MODERATION,
    patterns: [],
    responses: [
      "I understand, but let's keep our conversation focused on your goals.",
      "Let's maintain a professional and productive discussion.",
      "I believe we should focus on your objectives instead."
    ],
    priority: 3,
    personalityTraits: ['diplomatic', 'caring'],
    mood: 'thoughtful',
    intensity: 'medium'
  }
];

// Export the response manager instance
export const responseManager = ResponseManager.getInstance(); 