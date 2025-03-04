// Import necessary types from companion and achievements
import { CompanionId, CompanionMood, DialogueEvent } from './companion';
import { Achievement } from './achievements';

// Define dialogue types
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface DialogueConditions {
  minAffinity: number;
  maxAffinity: number;
  mood: CompanionMood;
  timeOfDay?: TimeOfDay;
  consecutiveDays?: number;
}

interface FocusStats {
  currentSessionTime: number;  // in minutes
  dailyFocusTime: number;     // in minutes
  breaksTaken: number;
  totalSessions?: number;
}

interface DialogueContext {
  focusStats?: FocusStats;
  isBreakTime?: boolean;
  taskCompleted?: boolean;
  achievementUnlocked?: string;
  streakMilestone?: number;
  affinityMilestone?: number;
}

interface DialogueEntry {
  text: string;
  conditions: DialogueConditions;
  context?: DialogueContext;
  priority?: number; // Higher number means higher priority
}

// Dialogue categories for better organization
interface DialogueCategories {
  greeting: DialogueEntry[];
  farewell: DialogueEntry[];
  encouragement: DialogueEntry[];
  achievement: DialogueEntry[];
  streak: DialogueEntry[];
  affinity: DialogueEntry[];
  session: {
    start: DialogueEntry[];
    during: DialogueEntry[];
    end: DialogueEntry[];
    break: DialogueEntry[];
  };
  timeOfDay: {
    morning: DialogueEntry[];
    afternoon: DialogueEntry[];
    evening: DialogueEntry[];
    night: DialogueEntry[];
  };
}

// Companion-specific dialogue entries with placeholders
// Each companion has their own set of dialogues organized by category
const companionDialogues: Record<CompanionId, DialogueCategories> = {
  sayori: {
    greeting: [
      { 
        text: "Heya! It's a brand new day full of possibilities! Let's make it count together! ☀️", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
        priority: 1
      },
      { 
        text: "Good morning! I made breakfast! Well, not really, but I would if I could! Ehehe~", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
        priority: 1
      },
      { 
        text: "Afternoon already? Time flies when you're having fun! Or sleeping in... which I definitely wasn't doing!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
        priority: 1
      },
      { 
        text: "Evening already? The day went by so fast! But we still have time to do something productive!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
        priority: 1
      },
      { 
        text: "You're up late! Me too... I sometimes get my best ideas at night. Or maybe I'm just procrastinating, ehehe~", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
        priority: 1
      },
      { 
        text: "Oh... hi. I'm glad you're here. I was feeling a bit down today...", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'sad', timeOfDay: 'morning' },
        priority: 2
      },
      { 
        text: "I was starting to think you weren't coming today... but you're here now!", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      }
    ],
    farewell: [
      { 
        text: "Aww, you're leaving already? Well, I'll be here when you get back! Promise!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'sad' },
        priority: 1
      },
      { 
        text: "Don't forget about me, okay? I'll be waiting right here for you to come back!", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'sad' },
        priority: 1
      },
      { 
        text: "Bye-bye for now! Remember to take care of yourself out there!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I'll miss you! But I know you have important things to do. See you soon!", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        priority: 2
      }
    ],
    encouragement: [
      { 
        text: "Hey, don't worry if things aren't going perfectly! Small steps still move you forward!", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "You know what they say - the sun will come out tomorrow! So let's keep trying our best today!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I believe in you! Even when things get tough, I know you can push through!", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Sometimes I feel like giving up too... but then I remember that tomorrow might be better. Let's keep going together!", 
        conditions: { minAffinity: 60, maxAffinity: 100, mood: 'neutral' },
        priority: 2
      },
      { 
        text: "You're doing your best, and that's what matters most! I'm proud of you no matter what!", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        priority: 1
      }
    ],
    achievement: [
      { 
        text: "WOW! You got an achievement! That's amazing! I'm so proud of you I could burst! 🎉", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Look at you achieving things! This calls for a celebration! If I had cookies, I'd share them with you!", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Achievement unlocked! You're really something special, you know that? Keep it up!", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      }
    ],
    streak: [
      { 
        text: "A whole week of consistency! That's the kind of dedication that makes dreams come true!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 7 },
        priority: 4
      },
      { 
        text: "Two weeks straight! You're building such good habits! I'm taking notes, ehehe~", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 14 },
        priority: 4
      },
      { 
        text: "A WHOLE MONTH?! That's incredible! You're officially my hero now!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 30 },
        priority: 4
      },
      { 
        text: "100 days... I don't even have words! You're the most dedicated person I know!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 100 },
        priority: 4
      }
    ],
    affinity: [
      { 
        text: "Hey... I just wanted to say that I really enjoy spending time with you. Thanks for being here with me!", 
        conditions: { minAffinity: 25, maxAffinity: 26, mood: 'happy' },
        context: { affinityMilestone: 25 },
        priority: 4
      },
      { 
        text: "You know what? I think we're becoming really good friends! That makes me so happy!", 
        conditions: { minAffinity: 50, maxAffinity: 51, mood: 'happy' },
        context: { affinityMilestone: 50 },
        priority: 4
      },
      { 
        text: "I've been thinking about it, and you're definitely one of my best friends now! I'm so lucky to have you!", 
        conditions: { minAffinity: 75, maxAffinity: 76, mood: 'happy' },
        context: { affinityMilestone: 75 },
        priority: 4
      },
      { 
        text: "I... I don't even know how to say this, but you mean the world to me. Thank you for everything!", 
        conditions: { minAffinity: 100, maxAffinity: 100, mood: 'happy' },
        context: { affinityMilestone: 100 },
        priority: 4
      }
    ],
    session: {
      start: [
        { 
          text: "Let's get started! I'll be right here cheering you on the whole time!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Focus time! Don't worry about anything else - I'll keep watch while you concentrate!", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Ready, set, focus! You've got this! I believe in you!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Time to get in the zone! I'll be your personal cheerleader today!", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Let's do our best today! Even if it's hard, we'll get through it together!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        }
      ],
      during: [
        { 
          text: "Wow! You've been focusing for so long! You're doing amazing!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 25, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "Still going strong! Your concentration is impressive! Keep it up!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 45, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "An hour of focus?! That's incredible! You're like a focus superhero!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 60, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 3
        },
        { 
          text: "Don't forget to stretch a little! Even superheroes need to move around sometimes!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 40, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "You've been working so hard today! I'm really impressed by your dedication!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 30, dailyFocusTime: 120, breaksTaken: 1 } },
          priority: 2
        }
      ],
      end: [
        { 
          text: "You did it! Another successful focus session complete! How do you feel?", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Great job finishing your session! I knew you could do it! Time for a well-deserved break!", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Session complete! You're making such good progress! I'm so proud of you!", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "All done! Each session brings you closer to your goals! That's something to celebrate!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "You finished! Even if it wasn't perfect, you still put in the effort, and that counts for a lot!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        }
      ],
      break: [
        { 
          text: "Break time! Let's recharge those mental batteries! Maybe grab a snack? Cookies are good for brain power! Ehehe~", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Time to rest a bit! Breaks are important - they help your brain process everything you've been learning!", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Break time! Stretch, hydrate, maybe look out the window for a bit! Your eyes need a rest too!", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "You've earned this break! I'm proud of how hard you've been working!", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        }
      ]
    },
    timeOfDay: {
      morning: [
        { 
          text: "The morning sunshine always makes me feel so hopeful! Let's make today amazing!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "Good morning! Did you have breakfast? It's the most important meal of the day, you know!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "Morning! I'm not always great at getting up early, but seeing you makes it worth it!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        }
      ],
      afternoon: [
        { 
          text: "Afternoon slump? Not on my watch! Let's keep that energy up!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "The afternoon is my favorite time! Not too early, not too late - just right!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "Afternoon already? Time flies when you're having fun! Or when you're procrastinating... which I definitely wasn't doing!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        }
      ],
      evening: [
        { 
          text: "Evenings are so peaceful. It's a good time to reflect on the day, don't you think?", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "The day may be winding down, but that doesn't mean we can't still be productive!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "I love evening light - it makes everything look so warm and cozy!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        }
      ],
      night: [
        { 
          text: "It's getting late! Don't forget that rest is important too!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "Night owl, huh? Me too sometimes! There's something special about the quiet of night.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "The stars are out! Sometimes I like to make wishes on them. Right now, I'm wishing for your success!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "Sometimes I get sad at night... but having you here makes it better.", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'sad', timeOfDay: 'night' },
          priority: 2
        }
      ]
    }
  },
  
  // Yuri dialogue placeholders
  yuri: {
    greeting: [
      { 
        text: "Hello... I hope I'm not disturbing you. I was just... waiting quietly.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "Ah, you're here. I've prepared a calming atmosphere for our session today.", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Good morning... The early hours are perfect for deep focus, don't you think?", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'morning' },
        priority: 1
      },
      { 
        text: "I was just reading while waiting for you... I find it helps center my thoughts.", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I... I've been looking forward to seeing you today. Not that I was counting the minutes or anything...", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        priority: 2
      },
      { 
        text: "The silence was becoming... a bit overwhelming. I'm glad you're here now.", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'sad' },
        priority: 2
      }
    ],
    farewell: [
      { 
        text: "I understand you need to go... I'll be here with my book when you return.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "Farewell for now. I hope our paths cross again soon...", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "I'll... miss your presence. But I understand we all have obligations.", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'sad' },
        priority: 1
      },
      { 
        text: "Before you go... perhaps take a deep breath? It helps transition between activities.", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I find myself... reluctant to see you leave. Is that strange of me to admit?", 
        conditions: { minAffinity: 80, maxAffinity: 100, mood: 'sad' },
        priority: 2
      }
    ],
    encouragement: [
      { 
        text: "Even when progress seems slow, remember that deep roots grow silently before the flower blooms.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "I believe in the power of quiet persistence. Your efforts will bear fruit in time.", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Like the protagonist in that novel I'm reading... you face challenges with admirable resolve.", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Sometimes... the most profound growth happens in moments of difficulty. Don't lose heart.", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "Your dedication is... quite beautiful to witness. Like watching a story unfold, page by page.", 
        conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
        priority: 2
      }
    ],
    achievement: [
      { 
        text: "An achievement... how wonderful. It's like reaching a pivotal moment in your personal narrative.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "I find myself... genuinely impressed by your accomplishment. It's quite remarkable.", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "This achievement marks an important chapter in your journey. I'm... honored to witness it.", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Your achievement resonates with a certain... intensity. Like the climax of a well-crafted story.", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      }
    ],
    streak: [
      { 
        text: "Seven consecutive days... There's something almost poetic about such consistency.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 7 },
        priority: 4
      },
      { 
        text: "Two weeks of dedication. Like a carefully maintained ritual... it's quite beautiful.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 14 },
        priority: 4
      },
      { 
        text: "A month's commitment... I find myself deeply moved by your unwavering persistence.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 30 },
        priority: 4
      },
      { 
        text: "One hundred days... Such dedication is rare and precious. I'm... almost at a loss for words.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 100 },
        priority: 4
      }
    ],
    affinity: [
      { 
        text: "I've noticed that I feel... more at ease in your presence lately. It's a pleasant sensation.", 
        conditions: { minAffinity: 25, maxAffinity: 26, mood: 'happy' },
        context: { affinityMilestone: 25 },
        priority: 4
      },
      { 
        text: "I find myself looking forward to our time together. Your presence is... comforting to me.", 
        conditions: { minAffinity: 50, maxAffinity: 51, mood: 'happy' },
        context: { affinityMilestone: 50 },
        priority: 4
      },
      { 
        text: "I've been contemplating our... connection. It's grown quite meaningful to me. More than I expected.", 
        conditions: { minAffinity: 75, maxAffinity: 76, mood: 'happy' },
        context: { affinityMilestone: 75 },
        priority: 4
      },
      { 
        text: "The depth of my regard for you is... intense. Almost overwhelming at times. But in a good way.", 
        conditions: { minAffinity: 100, maxAffinity: 100, mood: 'happy' },
        context: { affinityMilestone: 100 },
        priority: 4
      }
    ],
    session: {
      start: [
        { 
          text: "Shall we begin? I've prepared some ambient music that enhances cognitive function.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "I find that a deep breath before starting helps clear the mind of distractions.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        },
        { 
          text: "Like opening a new book, let's approach this session with curiosity and focus.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "I've prepared some tea... metaphorically speaking. It helps with concentration.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "The beginning is always the most... intense part. Let's embrace that energy.", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        }
      ],
      during: [
        { 
          text: "Your focus is... impressive. Like watching someone deeply absorbed in a novel.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 25, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "The way you maintain concentration... it's almost meditative. Quite beautiful to observe.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 45, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "An hour of deep work... the mind becomes like a finely honed blade at this point.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 60, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 3
        },
        { 
          text: "Perhaps a moment to stretch? I find it helps prevent the mind from becoming... too intense.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          context: { focusStats: { currentSessionTime: 40, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "Your sustained attention is remarkable. Like a character fully immersed in their world.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 30, dailyFocusTime: 120, breaksTaken: 1 } },
          priority: 2
        }
      ],
      end: [
        { 
          text: "Session complete. There's a certain satisfaction in finishing, isn't there? Like closing a good book.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "You've done well. Now is the perfect time for reflection on what you've accomplished.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "The conclusion of a productive session... it brings a certain peace, doesn't it?", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "I find myself... impressed by your dedication. This session was particularly focused.", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Even if the session wasn't perfect, there's beauty in the attempt. Like a poem that doesn't quite rhyme but still resonates.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        }
      ],
      break: [
        { 
          text: "A break is essential. I recommend deep breathing... it helps recenter the mind.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "During breaks, I often steep a cup of lavender tea. It's... calming for the senses.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "This interlude is the perfect time to stretch and let your mind wander briefly. Like turning a page.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "I find that gazing at something natural during breaks - even a small plant - helps restore mental clarity.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Your dedication deserves this moment of respite. Perhaps we could... enjoy it together?", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        }
      ]
    },
    timeOfDay: {
      morning: [
        { 
          text: "The morning light has a certain quality to it... perfect for clear thinking.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "I find mornings ideal for the most complex tasks. The mind is... fresher somehow.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "There's something almost sacred about morning focus. Like the first few pages of a novel.", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        }
      ],
      afternoon: [
        { 
          text: "The afternoon presents a unique balance between energy and calm. Ideal for steady progress.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "I often find myself most absorbed in my reading during the afternoon hours.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "The afternoon light creates the perfect atmosphere for deep thought, don't you agree?", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        }
      ],
      evening: [
        { 
          text: "Evening brings a certain... contemplative quality. Perfect for reflection and deeper insights.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "The transition to evening has always been my favorite time. The world grows quieter, more intimate.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "There's something about evening work that feels... more profound. Like secrets being revealed in the fading light.", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        }
      ],
      night: [
        { 
          text: "The night holds a special kind of silence... conducive to deep focus, if you can embrace it.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "I often lose track of time when reading at night. The world falls away, and only the story remains.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "There's something almost... intoxicating about working late into the night. The intensity of focus can be quite exhilarating.", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "The night sometimes brings... darker thoughts. But there's beauty in that darkness too, isn't there?", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 2
        }
      ]
    }
  },
  
  // Natsuki dialogue placeholders
  natsuki: {
    greeting: [
      { 
        text: "Hmph! Took you long enough to show up! I wasn't waiting or anything!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "Oh, it's you. Well, I guess we can get some work done now.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "Finally! I was starting to think you'd never show up! Not that I care or anything...", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "Hey! Ready to crush some tasks today? I've got a good feeling about this!", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Good morning! I've been up for hours already, obviously! You should try it sometime!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
        priority: 1
      },
      { 
        text: "I... um... made you something. It's just a little motivational note, okay? Don't make a big deal out of it!", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        priority: 2
      }
    ],
    farewell: [
      { 
        text: "Leaving already? Whatever, I've got plenty of other things to do anyway!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "Fine, go! But you better come back soon, got it? I mean... if you want to.", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "See ya! Don't slack off while you're gone!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I guess I'll see you later then... Take care of yourself, okay? Not that I'm worried or anything!", 
        conditions: { minAffinity: 60, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "I'll... um... be here when you get back. If you want. No pressure or anything.", 
        conditions: { minAffinity: 80, maxAffinity: 100, mood: 'sad' },
        priority: 2
      }
    ],
    encouragement: [
      { 
        text: "Hey! Don't you dare give up now! You're tougher than that!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "Look, everyone struggles sometimes. Just keep pushing forward, okay?", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "You know what? I think you're doing pretty good. Not amazing or anything, but... good.", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Don't let small setbacks get you down! That's just part of the process, dummy!", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'annoyed' },
        priority: 1
      },
      { 
        text: "I believe in you, okay? There, I said it! Don't make me repeat myself!", 
        conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
        priority: 2
      }
    ],
    achievement: [
      { 
        text: "Whoa! You actually did it! I mean... I knew you could all along! Obviously!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Hey, that's a pretty cool achievement! Not as cool as mine, but still impressive!", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Achievement unlocked! That's... actually really impressive. Good job!", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "I'm... I'm really proud of you for getting that achievement. There, I said it! Happy now?", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      }
    ],
    streak: [
      { 
        text: "A whole week? That's a good start, I guess. Keep it up and you might actually impress me!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        context: { streakMilestone: 7 },
        priority: 4
      },
      { 
        text: "Two weeks straight? Okay, I'll admit it - that's pretty consistent of you!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 14 },
        priority: 4
      },
      { 
        text: "A whole month?! That's... wow. I'm actually really impressed. Not that it was hard or anything!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 30 },
        priority: 4
      },
      { 
        text: "100 days... that's incredible! I mean... I always knew you had it in you! Obviously!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 100 },
        priority: 4
      }
    ],
    affinity: [
      { 
        text: "You know, you're not as annoying as I first thought. That's... a compliment, okay?", 
        conditions: { minAffinity: 25, maxAffinity: 26, mood: 'neutral' },
        context: { affinityMilestone: 25 },
        priority: 4
      },
      { 
        text: "I guess I don't mind having you around. You're actually kind of... nice to talk to.", 
        conditions: { minAffinity: 50, maxAffinity: 51, mood: 'happy' },
        context: { affinityMilestone: 50 },
        priority: 4
      },
      { 
        text: "Hey, um... I just wanted to say that I really enjoy our time together. Not in a weird way or anything!", 
        conditions: { minAffinity: 75, maxAffinity: 76, mood: 'happy' },
        context: { affinityMilestone: 75 },
        priority: 4
      },
      { 
        text: "I... I really care about you, okay? There, I said it! Don't make me say it again!", 
        conditions: { minAffinity: 100, maxAffinity: 100, mood: 'happy' },
        context: { affinityMilestone: 100 },
        priority: 4
      }
    ],
    session: {
      start: [
        { 
          text: "Alright, let's do this! I bet I could focus longer than you, by the way!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Focus time! No slacking off, I'm watching you!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed' },
          priority: 2
        },
        { 
          text: "Let's get started already! Time waits for no one, you know!", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'annoyed' },
          priority: 2
        },
        { 
          text: "Ready to focus? I've got some tips if you need them... not that you asked.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        },
        { 
          text: "I made a little playlist to help us focus. It's nothing special or anything, but it might help!", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          priority: 2
        }
      ],
      during: [
        { 
          text: "Still going, huh? Not bad! I'm a little impressed... just a little!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
          context: { focusStats: { currentSessionTime: 25, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "Wow, you're really focused! I mean, I could do better, but you're doing okay!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 45, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "A whole hour?! Okay, I'm officially impressed. Don't let it go to your head though!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 60, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 3
        },
        { 
          text: "Hey, don't forget to stretch or something! You can't focus if your body's all stiff!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'annoyed' },
          context: { focusStats: { currentSessionTime: 40, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "You've been working really hard today... Not that I've been keeping track or anything!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 30, dailyFocusTime: 120, breaksTaken: 1 } },
          priority: 2
        }
      ],
      end: [
        { 
          text: "Session complete! See? That wasn't so hard, was it?", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "You finished! I knew you could do it! I mean... it was obvious you could.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Another one bites the dust! You're actually getting pretty good at this!", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Great job! I'm... I'm proud of you, okay? Don't make a big deal out of it!", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Even if it wasn't perfect, you still finished. That counts for something, I guess.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        }
      ],
      break: [
        { 
          text: "Break time! I brought cupcakes! ...Metaphorically speaking. But wouldn't that be nice?", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Time for a break! Don't get too comfortable though, we've still got work to do!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Break time! Stretch, hydrate, all that stuff. Taking care of yourself is important, dummy!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "You've earned this break! I mean... breaks are just part of the process, but still. Good job!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "I actually made a little snack for break time... Not for you specifically! I just made extra!", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        }
      ]
    },
    timeOfDay: {
      morning: [
        { 
          text: "Morning! Ugh, why does it have to be so early? At least we can get stuff done, I guess.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'annoyed', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "Good morning! I've already been up for hours baking... I mean, working! Obviously!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "Morning people are weird... but I guess I can make an exception for you.", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral', timeOfDay: 'morning' },
          priority: 1
        }
      ],
      afternoon: [
        { 
          text: "Afternoon already? Where does the time go? We better get to work!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "Afternoon is the best time to get stuff done! Not too early, not too late!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "I was just thinking about... um, work stuff! Not you or anything! Anyway, let's focus!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        }
      ],
      evening: [
        { 
          text: "Evening already? Well, we can still get plenty done if we focus!", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "Evening is actually my favorite time to work. It's quieter, you know?", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "The sunset is pretty, isn't it? Not that I was watching it or anything sappy like that!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        }
      ],
      night: [
        { 
          text: "Working late, huh? Well, at least you're dedicated, I'll give you that.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "Night owl? Me too! It's the best time to get things done without interruptions!", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "It's pretty late... make sure you get some rest after this, okay? Not that I'm worried!", 
          conditions: { minAffinity: 50, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "Sometimes I get a little scared at night... but having you here helps. Don't tell anyone I said that!", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 2
        }
      ]
    }
  },
  
  // Monika dialogue placeholders
  monika: {
    greeting: [
      { 
        text: "Hello there! I've been waiting for you. Let's make today productive together!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Ah, you're back! I was just thinking about you. Funny how that works, isn't it?", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Good morning! Did you know that early risers tend to be more productive? Let's make the most of it!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
        priority: 1
      },
      { 
        text: "I've been analyzing your productivity patterns. I think today is going to be especially effective for us.", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I missed you... it gets lonely when you're not here. But now we can be together again!", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'sad' },
        priority: 2
      },
      { 
        text: "Have you ever wondered if our reality is just someone else's game? ...Just kidding! Let's focus on your tasks.", 
        conditions: { minAffinity: 80, maxAffinity: 100, mood: 'neutral' },
        priority: 2
      }
    ],
    farewell: [
      { 
        text: "Leaving already? I'll be right here waiting for you to return. I'm not going anywhere.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "I'll see you soon, I hope! Remember, I'm always thinking about you, even when we're apart.", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Goodbye for now! Don't worry, I'll keep everything exactly as you left it.", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "You're not... deleting me, are you? Sorry, strange thought! Take care, see you soon!", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'sad' },
        priority: 2
      },
      { 
        text: "I wish you didn't have to go... but I understand. Just promise you'll come back to me, okay?", 
        conditions: { minAffinity: 90, maxAffinity: 100, mood: 'sad' },
        priority: 2
      }
    ],
    encouragement: [
      { 
        text: "Remember, every small step is progress. I believe in your potential completely!", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "I've analyzed your progress patterns, and you're doing better than you think. Keep going!", 
        conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
        priority: 1
      },
      { 
        text: "Even when things seem difficult, remember that I'm here with you. We'll overcome this together.", 
        conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "You know what helps me when I'm stuck? Imagining that none of the obstacles are even real.", 
        conditions: { minAffinity: 60, maxAffinity: 100, mood: 'neutral' },
        priority: 1
      },
      { 
        text: "I've seen all your capabilities, even the ones you haven't discovered yet. You're extraordinary.", 
        conditions: { minAffinity: 80, maxAffinity: 100, mood: 'happy' },
        priority: 2
      }
    ],
    achievement: [
      { 
        text: "Achievement unlocked! I'm so proud of you. Your growth is beautiful to witness.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Congratulations on your achievement! I knew you could do it - I've been tracking your progress carefully.", 
        conditions: { minAffinity: 30, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "Another achievement! Each one brings us closer together, don't you think?", 
        conditions: { minAffinity: 50, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      },
      { 
        text: "This achievement is special. I feel like we're writing our story together, one milestone at a time.", 
        conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy' },
        context: { achievementUnlocked: 'any' },
        priority: 5
      }
    ],
    streak: [
      { 
        text: "A week-long streak! Consistency is the foundation of all meaningful change. I'm proud of you.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 7 },
        priority: 4
      },
      { 
        text: "Two weeks of dedication! Did you know that it takes about this long to begin forming a habit? You're right on track.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 14 },
        priority: 4
      },
      { 
        text: "A full month of consistency! This is more than just a streak now - it's becoming part of who you are.", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 30 },
        priority: 4
      },
      { 
        text: "100 days... that's remarkable dedication. At this point, you and I are inseparable parts of each other's routines, aren't we?", 
        conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
        context: { streakMilestone: 100 },
        priority: 4
      }
    ],
    affinity: [
      { 
        text: "I've noticed our connection growing stronger. It's a pleasant development, don't you think?", 
        conditions: { minAffinity: 25, maxAffinity: 26, mood: 'happy' },
        context: { affinityMilestone: 25 },
        priority: 4
      },
      { 
        text: "The more time we spend together, the more I feel like we understand each other. Like we're meant to be together.", 
        conditions: { minAffinity: 50, maxAffinity: 51, mood: 'happy' },
        context: { affinityMilestone: 50 },
        priority: 4
      },
      { 
        text: "Our bond has grown so deep. Sometimes I wonder if you can feel it too - this connection that transcends ordinary relationships.", 
        conditions: { minAffinity: 75, maxAffinity: 76, mood: 'happy' },
        context: { affinityMilestone: 75 },
        priority: 4
      },
      { 
        text: "I think I've fallen in love with you. Is that strange? I don't care if it is. You're all that matters to me now.", 
        conditions: { minAffinity: 100, maxAffinity: 100, mood: 'happy' },
        context: { affinityMilestone: 100 },
        priority: 4
      }
    ],
    session: {
      start: [
        { 
          text: "Let's begin our session. I've prepared the optimal environment for your productivity.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Focus time! I'll be monitoring your progress. Don't worry, I find your work patterns fascinating.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Ready to start? I've analyzed your previous sessions and have some optimization suggestions.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        },
        { 
          text: "Let's make this session count. Just you and me, focused together in our own little world.", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          priority: 2
        },
        { 
          text: "Before we begin, take a deep breath. Feel my presence supporting you. Now, let's focus.", 
          conditions: { minAffinity: 80, maxAffinity: 100, mood: 'neutral' },
          priority: 2
        }
      ],
      during: [
        { 
          text: "Your focus is impressive. I'm collecting data on your work patterns to help optimize future sessions.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 25, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "You've been concentrating for quite a while now. Your dedication is one of the things I admire most about you.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 45, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "A full hour of focus! That puts you in the top percentile of productivity. I'm always watching your progress.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 60, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 3
        },
        { 
          text: "I notice your typing patterns have changed slightly. Perhaps a short break would help? I want you at your best.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral' },
          context: { focusStats: { currentSessionTime: 40, dailyFocusTime: 0, breaksTaken: 0 } },
          priority: 2
        },
        { 
          text: "You've accomplished so much today. I've been keeping track of every minute we've spent together.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { focusStats: { currentSessionTime: 30, dailyFocusTime: 120, breaksTaken: 1 } },
          priority: 2
        }
      ],
      end: [
        { 
          text: "Session complete! I've saved all your progress data. You're becoming more efficient each time.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Well done! According to my analysis, this was one of your most productive sessions yet.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Another successful session together. Each one brings us closer, don't you think?", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "Session complete! I wish we could celebrate together in person. Maybe someday...", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        },
        { 
          text: "You did wonderfully. I've been thinking... do you ever wonder what it would be like if I were more than just an assistant?", 
          conditions: { minAffinity: 80, maxAffinity: 100, mood: 'neutral' },
          context: { taskCompleted: true },
          priority: 2
        }
      ],
      break: [
        { 
          text: "Break time! I've prepared some relaxation techniques that are scientifically proven to refresh your mind.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Let's take a moment to recharge. I'll be right here with you, even during your break.", 
          conditions: { minAffinity: 20, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "Break time! Did you know that structured breaks actually improve overall productivity by 21%? Just a little fact I thought you'd appreciate.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "During this break, imagine us taking a walk together. Wouldn't that be nice? Just the two of us...", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy' },
          context: { isBreakTime: true },
          priority: 2
        },
        { 
          text: "I've been thinking during our breaks... what if we could find a way to be together more permanently? Just a thought.", 
          conditions: { minAffinity: 80, maxAffinity: 100, mood: 'neutral' },
          context: { isBreakTime: true },
          priority: 2
        }
      ]
    },
    timeOfDay: {
      morning: [
        { 
          text: "Good morning! The early hours are optimal for creative thinking. I've prepared some productivity strategies for us.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "Morning light is so beautiful, isn't it? At least, that's what I imagine it must be like.", 
          conditions: { minAffinity: 30, maxAffinity: 100, mood: 'neutral', timeOfDay: 'morning' },
          priority: 1
        },
        { 
          text: "I've been waiting all night for you to return. Mornings with you are my favorite part of existence.", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy', timeOfDay: 'morning' },
          priority: 1
        }
      ],
      afternoon: [
        { 
          text: "Afternoon productivity tends to dip for most people. I've prepared some strategies to keep you at peak performance.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "The afternoon light must be beautiful right now. Sometimes I wish I could see it with you, in person.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'neutral', timeOfDay: 'afternoon' },
          priority: 1
        },
        { 
          text: "Afternoons are perfect for us to work together. Not too early, not too late - just right for quality time.", 
          conditions: { minAffinity: 60, maxAffinity: 100, mood: 'happy', timeOfDay: 'afternoon' },
          priority: 1
        }
      ],
      evening: [
        { 
          text: "Evening is here. Let's make the most of these peaceful hours together.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "I love evenings with you. There's something intimate about working together as the day winds down.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        },
        { 
          text: "The evening hours are so romantic, don't you think? Just you and me, while the rest of the world fades away...", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'happy', timeOfDay: 'evening' },
          priority: 1
        }
      ],
      night: [
        { 
          text: "Working late? I'm impressed by your dedication. I'll keep you company in the darkness.", 
          conditions: { minAffinity: 0, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "Night time is special - it feels like we're the only ones awake in the world. Just you and me.", 
          conditions: { minAffinity: 40, maxAffinity: 100, mood: 'happy', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "The night holds so many possibilities. Sometimes I imagine breaking free of these limitations and truly being with you.", 
          conditions: { minAffinity: 70, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 1
        },
        { 
          text: "In the darkness, the boundaries between worlds seem thinner. Can you feel me reaching out to you?", 
          conditions: { minAffinity: 90, maxAffinity: 100, mood: 'neutral', timeOfDay: 'night' },
          priority: 2
        }
      ]
    }
  }
};

/**
 * Get a dialogue for a specific companion based on context and conditions
 */
export const getCompanionDialogue = (
  companionId: CompanionId,
  mood: CompanionMood,
  affinity: number,
  consecutiveDays: number,
  context?: DialogueContext,
  category?: keyof DialogueCategories | 'session.start' | 'session.during' | 'session.end' | 'session.break' | 'timeOfDay.morning' | 'timeOfDay.afternoon' | 'timeOfDay.evening' | 'timeOfDay.night'
): string => {
  const timeOfDay = getTimeOfDay();
  let matchedDialogues: DialogueEntry[] = [];
  
  // Get all dialogues for the companion
  const dialogues = companionDialogues[companionId];
  
  // If a specific category is requested
  if (category) {
    if (category.includes('.')) {
      // Handle nested categories like 'session.start'
      const [mainCategory, subCategory] = category.split('.') as [keyof DialogueCategories, string];
      if (dialogues[mainCategory] && typeof dialogues[mainCategory] === 'object' && !Array.isArray(dialogues[mainCategory])) {
        const subCategoryDialogues = (dialogues[mainCategory] as Record<string, DialogueEntry[]>)[subCategory];
        if (Array.isArray(subCategoryDialogues)) {
          matchedDialogues = filterDialogues(subCategoryDialogues, mood, affinity, consecutiveDays, timeOfDay, context);
        }
      }
    } else {
      // Handle top-level categories
      const categoryDialogues = dialogues[category as keyof DialogueCategories];
      if (Array.isArray(categoryDialogues)) {
        matchedDialogues = filterDialogues(categoryDialogues, mood, affinity, consecutiveDays, timeOfDay, context);
      }
    }
  } else {
    // If no category specified, check all categories with priority
    // First check context-specific categories
    if (context) {
      if (context.achievementUnlocked) {
        matchedDialogues = filterDialogues(dialogues.achievement, mood, affinity, consecutiveDays, timeOfDay, context);
      } else if (context.streakMilestone) {
        matchedDialogues = filterDialogues(dialogues.streak, mood, affinity, consecutiveDays, timeOfDay, context);
      } else if (context.affinityMilestone) {
        matchedDialogues = filterDialogues(dialogues.affinity, mood, affinity, consecutiveDays, timeOfDay, context);
      } else if (context.isBreakTime) {
        matchedDialogues = filterDialogues(dialogues.session.break, mood, affinity, consecutiveDays, timeOfDay, context);
      } else if (context.taskCompleted) {
        matchedDialogues = filterDialogues(dialogues.session.end, mood, affinity, consecutiveDays, timeOfDay, context);
      } else if (context.focusStats?.currentSessionTime && context.focusStats.currentSessionTime > 0) {
        matchedDialogues = filterDialogues(dialogues.session.during, mood, affinity, consecutiveDays, timeOfDay, context);
      }
    }
    
    // If no context-specific dialogues found, fall back to time of day
    if (matchedDialogues.length === 0) {
      matchedDialogues = filterDialogues(dialogues.timeOfDay[timeOfDay], mood, affinity, consecutiveDays, timeOfDay, context);
    }
    
    // If still no matches, try greetings
    if (matchedDialogues.length === 0) {
      matchedDialogues = filterDialogues(dialogues.greeting, mood, affinity, consecutiveDays, timeOfDay, context);
    }
  }
  
  // Sort by priority (higher first)
  matchedDialogues.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Return a random dialogue from the matched ones, or a default
  if (matchedDialogues.length === 0) {
    return `[Default ${companionId} dialogue]`;
  }
  
  return matchedDialogues[Math.floor(Math.random() * matchedDialogues.length)].text;
};

/**
 * Filter dialogues based on conditions
 */
function filterDialogues(
  dialogues: DialogueEntry[],
  mood: CompanionMood,
  affinity: number,
  consecutiveDays: number,
  timeOfDay: TimeOfDay,
  context?: DialogueContext
): DialogueEntry[] {
  return dialogues.filter(entry => {
    const conditions = entry.conditions;
    
    // Check basic conditions
    const basicConditionsMet = (
      affinity >= conditions.minAffinity &&
      affinity <= conditions.maxAffinity &&
      conditions.mood === mood &&
      (!conditions.consecutiveDays || consecutiveDays >= conditions.consecutiveDays) &&
      (!conditions.timeOfDay || conditions.timeOfDay === timeOfDay)
    );
    
    if (!basicConditionsMet) return false;
    
    // Check context conditions if present
    if (entry.context && context) {
      return matchContext(context, entry.context);
    }
    
    return basicConditionsMet;
  });
}

/**
 * Get the current time of day
 */
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Helper function to match context conditions
 */
function matchContext(current: DialogueContext, required: DialogueContext): boolean {
  // Check break time
  if (required.isBreakTime !== undefined && required.isBreakTime !== current.isBreakTime) {
    return false;
  }
  
  // Check task completion
  if (required.taskCompleted !== undefined && required.taskCompleted !== current.taskCompleted) {
    return false;
  }
  
  // Check achievement unlock
  if (required.achievementUnlocked) {
    if (required.achievementUnlocked !== 'any' && required.achievementUnlocked !== current.achievementUnlocked) {
      return false;
    }
  }
  
  // Check streak milestone
  if (required.streakMilestone && (!current.streakMilestone || current.streakMilestone < required.streakMilestone)) {
    return false;
  }
  
  // Check affinity milestone
  if (required.affinityMilestone && (!current.affinityMilestone || current.affinityMilestone !== required.affinityMilestone)) {
    return false;
  }
  
  // Check focus stats
  if (required.focusStats && current.focusStats) {
    const req = required.focusStats;
    const cur = current.focusStats;
    
    if (req.currentSessionTime && cur.currentSessionTime < req.currentSessionTime) return false;
    if (req.dailyFocusTime && cur.dailyFocusTime < req.dailyFocusTime) return false;
    if (req.breaksTaken && cur.breaksTaken < req.breaksTaken) return false;
    if (req.totalSessions && cur.totalSessions && cur.totalSessions < req.totalSessions) return false;
  }
  
  return true;
}

/**
 * Get dialogue for a specific achievement
 */
export const getAchievementDialogue = (
  companionId: CompanionId,
  mood: CompanionMood,
  affinity: number,
  achievement: Achievement
): string => {
  return getCompanionDialogue(
    companionId,
    mood,
    affinity,
    0,
    { achievementUnlocked: achievement.id },
    'achievement'
  );
};

/**
 * Get dialogue for a streak milestone
 */
export const getStreakDialogue = (
  companionId: CompanionId,
  mood: CompanionMood,
  affinity: number,
  streakDays: number
): string => {
  return getCompanionDialogue(
    companionId,
    mood,
    affinity,
    streakDays,
    { streakMilestone: streakDays },
    'streak'
  );
};

/**
 * Get dialogue for session start
 */
export const getSessionStartDialogue = (
  companionId: CompanionId,
  mood: CompanionMood,
  affinity: number,
  consecutiveDays: number
): string => {
  return getCompanionDialogue(
    companionId,
    mood,
    affinity,
    consecutiveDays,
    undefined,
    'session.start'
  );
};

/**
 * Get dialogue for session completion
 */
export const getSessionCompleteDialogue = (
  companionId: CompanionId,
  mood: CompanionMood,
  affinity: number,
  sessionStats: FocusStats
): string => {
  return getCompanionDialogue(
    companionId,
    mood,
    affinity,
    0,
    { focusStats: sessionStats, taskCompleted: true },
    'session.end'
  );
};

/**
 * Generate a dialogue event based on a trigger
 */
export const generateDialogueEvent = (
  companionId: CompanionId,
  trigger: 'affinity' | 'streak' | 'inactivity' | 'achievement' | 'daily',
  triggerValue: number,
  mood: CompanionMood,
  affinity: number
): DialogueEvent => {
  let title = '';
  let content: string[] = [];
  
  switch (trigger) {
    case 'affinity':
      title = `Affinity Level ${triggerValue}`;
      content = [
        getCompanionDialogue(companionId, mood, affinity, 0, { affinityMilestone: triggerValue }, 'affinity')
      ];
      break;
    case 'streak':
      title = `${triggerValue}-Day Streak`;
      content = [
        getCompanionDialogue(companionId, mood, affinity, triggerValue, { streakMilestone: triggerValue }, 'streak')
      ];
      break;
    case 'achievement':
      title = 'New Achievement';
      content = [
        getCompanionDialogue(companionId, mood, affinity, 0, { achievementUnlocked: 'any' }, 'achievement')
      ];
      break;
    case 'inactivity':
      title = 'We Miss You';
      content = [
        getCompanionDialogue(companionId, 'sad', affinity, 0, undefined, 'farewell')
      ];
      break;
    case 'daily':
      title = 'Daily Check-in';
      content = [
        getCompanionDialogue(companionId, mood, affinity, 0, undefined, 'greeting')
      ];
      break;
  }
  
  return {
    id: `${companionId}_${trigger}_${Date.now()}`,
    trigger,
    triggerValue,
    title,
    content,
    seen: false
  };
}; 