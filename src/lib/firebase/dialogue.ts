type CompanionId = 'sayori' | 'yuri' | 'natsuki' | 'monika';
type Mood = 'happy' | 'neutral' | 'annoyed' | 'sad';

interface DialogueConditions {
  minAffinity: number;
  maxAffinity: number;
  mood: Mood;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  consecutiveDays?: number;
}

interface FocusStats {
  currentSessionTime: number;  // in minutes
  dailyFocusTime: number;     // in minutes
  breaksTaken: number;
}

interface DialogueContext {
  focusStats?: FocusStats;
  isBreakTime?: boolean;
  taskCompleted?: boolean;
}

interface DialogueEntry {
  text: string;
  conditions: DialogueConditions;
  context?: DialogueContext;
}

// Companion-specific dialogue entries
const companionDialogues: Record<CompanionId, DialogueEntry[]> = {
  sayori: [
    { text: "Another wonderful day to be productive together! ☀️", conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' } },
    { text: "I was starting to feel a bit lonely... but you're here now!", conditions: { minAffinity: 30, maxAffinity: 100, mood: 'sad' } },
    { text: "Ehehe~ You've been working so hard lately!", conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', consecutiveDays: 3 } },
    { text: "Yawn~ Maybe a short break wouldn't hurt...", conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral', timeOfDay: 'afternoon' } },
    { text: "I made you a little poem! It's about... pancakes! 🍪", conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' } },
    { text: "Are we best friends yet? No? Hmph!", conditions: { minAffinity: 80, maxAffinity: 100, mood: 'happy' } }
  ],
  yuri: [
    { text: "Shall we create a peaceful atmosphere for focus?", conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' } },
    { text: "I've been waiting... with my favorite tea blend.", conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' } },
    { text: "Your dedication is... quite admirable.", conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', consecutiveDays: 3 } },
    { text: "You know, long reading sessions pair well with deep focus...", conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral', timeOfDay: 'evening' } },
    { text: "Would you like to read a passage from my book with me?", conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' } },
    { text: "Sometimes... I get lost in my own thoughts. Thank you for being here.", conditions: { minAffinity: 80, maxAffinity: 100, mood: 'neutral' } }
  ],
  natsuki: [
    { text: "About time you showed up! Ready to crush some tasks?", conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' } },
    { text: "Hmph! Don't think I was waiting for you or anything...", conditions: { minAffinity: 30, maxAffinity: 100, mood: 'annoyed' } },
    { text: "Look at you being all consistent! I'm... proud of you!", conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', consecutiveDays: 3 } },
    { text: "I made cupcakes... No, you can't have one! (Okay, maybe just one.)", conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' } },
    { text: "You're not slacking, right? Because I'm watching!", conditions: { minAffinity: 40, maxAffinity: 100, mood: 'annoyed' } }
  ],
  monika: [
    { text: "Let's make today productive together~", conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' } },
    { text: "I was wondering when you'd come back...", conditions: { minAffinity: 30, maxAffinity: 100, mood: 'sad' } },
    { text: "Your consistency is truly impressive! Let's keep it up!", conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', consecutiveDays: 3 } },
    { text: "You know... I can see how hard you're working. I like that.", conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' } },
    { text: "Even the best of us need rest. Maybe you should take a break soon?", conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral' } },
    { text: "...You're not thinking of leaving me, are you?", conditions: { minAffinity: 90, maxAffinity: 100, mood: 'sad' } }
  ]
};

// Add context-aware dialogues
const contextDialogues: Record<CompanionId, DialogueEntry[]> = {
  sayori: [
    {
      text: "Wow! You've been focusing for so long! Let's take a small break~",
      conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
      context: { focusStats: { currentSessionTime: 45, dailyFocusTime: 0, breaksTaken: 0 } }
    },
    {
      text: "Break time is important too! Let's recharge together! ⚡",
      conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
      context: { isBreakTime: true }
    }
  ],
  yuri: [
    {
      text: "Your concentration is... impressive. Like losing yourself in a good book.",
      conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
      context: { focusStats: { currentSessionTime: 30, dailyFocusTime: 120, breaksTaken: 2 } }
    }
  ],
  natsuki: [
    {
      text: "Ha! Another task bites the dust! You're actually pretty good at this!",
      conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
      context: { taskCompleted: true }
    }
  ],
  monika: [
    {
      text: "I've noticed you work best in the mornings. Shall we make this our special time?",
      conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
      context: { focusStats: { currentSessionTime: 0, dailyFocusTime: 180, breaksTaken: 3 } }
    }
  ]
};

export const getCompanionDialogue = (
  companionId: CompanionId,
  mood: Mood,
  affinity: number,
  consecutiveDays: number,
  context?: DialogueContext
): string => {
  const timeOfDay = getTimeOfDay();
  
  // First check for context-specific dialogues
  if (context) {
    const contextMatch = contextDialogues[companionId].find(entry => {
      const conditions = entry.conditions;
      const contextMatch = entry.context && matchContext(context, entry.context);
      
      return (
        affinity >= conditions.minAffinity &&
        affinity <= conditions.maxAffinity &&
        conditions.mood === mood &&
        contextMatch
      );
    });

    if (contextMatch) return contextMatch.text;
  }

  // Fall back to regular dialogues if no context match
  const possibleDialogues = companionDialogues[companionId].filter(entry => {
    const conditions = entry.conditions;
    return (
      affinity >= conditions.minAffinity &&
      affinity <= conditions.maxAffinity &&
      conditions.mood === mood &&
      (!conditions.consecutiveDays || consecutiveDays >= conditions.consecutiveDays) &&
      (!conditions.timeOfDay || conditions.timeOfDay === timeOfDay)
    );
  });

  if (possibleDialogues.length === 0) {
    return "Hello!";
  }

  return possibleDialogues[Math.floor(Math.random() * possibleDialogues.length)].text;
};

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Helper function to match context conditions
function matchContext(current: DialogueContext, required: DialogueContext): boolean {
  if (required.isBreakTime !== undefined && required.isBreakTime !== current.isBreakTime) {
    return false;
  }
  
  if (required.taskCompleted !== undefined && required.taskCompleted !== current.taskCompleted) {
    return false;
  }
  
  if (required.focusStats && current.focusStats) {
    const req = required.focusStats;
    const cur = current.focusStats;
    
    return (
      (!req.currentSessionTime || cur.currentSessionTime >= req.currentSessionTime) &&
      (!req.dailyFocusTime || cur.dailyFocusTime >= req.dailyFocusTime) &&
      (!req.breaksTaken || cur.breaksTaken >= req.breaksTaken)
    );
  }
  
  return true;
} 