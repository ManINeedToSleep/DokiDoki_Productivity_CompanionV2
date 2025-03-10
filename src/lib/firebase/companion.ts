import { db, Timestamp } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion, setDoc, FieldValue } from 'firebase/firestore';
import { getUserDocument, updateCompanionMood, updateCompanionStats } from './user';

// Companion types
export type CompanionId = 'sayori' | 'yuri' | 'natsuki' | 'monika';
export type CompanionMood = 'happy' | 'neutral' | 'annoyed' | 'sad';

// Companion personality traits that influence their messages and reactions
export interface CompanionPersonality {
  traits: string[];
  interests: string[];
  motivationStyle: 'cheerful' | 'calm' | 'tough' | 'analytical';
  speakingStyle: string;
}

// Unlockable content for companions
export interface CompanionUnlockable {
  id: string;
  name: string;
  type: 'sprite' | 'background' | 'gift' | 'dialogue';
  description: string;
  requiredAffinity: number;
  unlocked: boolean;
  imageUrl?: string;
}

// Companion dialogue events
export interface DialogueEvent {
  id: string;
  trigger: 'affinity' | 'streak' | 'inactivity' | 'achievement' | 'daily';
  triggerValue?: number; // e.g., affinity level or streak days
  title: string;
  content: string[];
  seen: boolean;
}

// Extended companion data structure
export interface CompanionData {
  id: CompanionId;
  name: string;
  personality: CompanionPersonality;
  unlockables: CompanionUnlockable[];
  dialogueEvents: DialogueEvent[];
  stats: {
    totalInteractionTime: number;
    consecutiveDays: number;
    lastDailyInteraction: Timestamp;
    sessionsCompleted: number;
    goalsCompleted: number;
    giftsReceived: string[];
  };
  affinityLevel: number;
  mood: CompanionMood;
  lastInteraction: Timestamp;
}

// Companion personalities
const COMPANION_PERSONALITIES: Record<CompanionId, CompanionPersonality> = {
  sayori: {
    traits: ['cheerful', 'optimistic', 'caring', 'energetic'],
    interests: ['baking', 'helping others', 'cute things', 'friendship'],
    motivationStyle: 'cheerful',
    speakingStyle: 'Enthusiastic and encouraging, uses lots of exclamations!'
  },
  yuri: {
    traits: ['intelligent', 'thoughtful', 'reserved', 'detail-oriented'],
    interests: ['literature', 'tea', 'horror', 'philosophy'],
    motivationStyle: 'calm',
    speakingStyle: 'Eloquent and thoughtful, uses sophisticated vocabulary and metaphors.'
  },
  natsuki: {
    traits: ['determined', 'direct', 'passionate', 'resilient'],
    interests: ['manga', 'baking', 'cute things', 'proving herself'],
    motivationStyle: 'tough',
    speakingStyle: 'Blunt and straightforward, occasionally tsundere with tough love.'
  },
  monika: {
    traits: ['ambitious', 'confident', 'organized', 'perfectionist'],
    interests: ['piano', 'literature', 'self-improvement', 'leadership'],
    motivationStyle: 'analytical',
    speakingStyle: 'Articulate and motivational, focuses on strategy and improvement.'
  }
};

// Default unlockables for each companion
const getDefaultUnlockables = (companionId: CompanionId): CompanionUnlockable[] => {
  const baseUnlockables: CompanionUnlockable[] = [
    {
      id: `${companionId}_casual`,
      name: 'Casual Outfit',
      type: 'sprite',
      description: `${companionId.charAt(0).toUpperCase() + companionId.slice(1)}'s casual weekend outfit`,
      requiredAffinity: 20,
      unlocked: false,
      imageUrl: `/images/companions/${companionId}/casual.png`
    },
    {
      id: `${companionId}_special`,
      name: 'Special Outfit',
      type: 'sprite',
      description: 'A special outfit for special occasions',
      requiredAffinity: 50,
      unlocked: false,
      imageUrl: `/images/companions/${companionId}/special.png`
    },
    {
      id: `${companionId}_bg_classroom`,
      name: 'Classroom',
      type: 'background',
      description: 'Study together in the literature club classroom',
      requiredAffinity: 15,
      unlocked: false,
      imageUrl: '/images/backgrounds/classroom.png'
    },
    {
      id: `${companionId}_bg_library`,
      name: 'Library',
      type: 'background',
      description: 'A quiet library for focused study sessions',
      requiredAffinity: 30,
      unlocked: false,
      imageUrl: '/images/backgrounds/library.png'
    },
    {
      id: `${companionId}_gift_cupcake`,
      name: 'Cupcake',
      type: 'gift',
      description: 'A sweet treat to brighten their day',
      requiredAffinity: 10,
      unlocked: true,
      imageUrl: '/images/gifts/cupcake.png'
    },
    {
      id: `${companionId}_gift_book`,
      name: 'Poetry Book',
      type: 'gift',
      description: 'A thoughtful gift for your companion',
      requiredAffinity: 25,
      unlocked: false,
      imageUrl: '/images/gifts/book.png'
    }
  ];
  
  // Add companion-specific unlockables
  switch (companionId) {
    case 'sayori':
      return [
        ...baseUnlockables,
        {
          id: 'sayori_gift_plushie',
          name: 'Cow Plushie',
          type: 'gift',
          description: 'A cute plushie that Sayori would love',
          requiredAffinity: 40,
          unlocked: false,
          imageUrl: '/images/gifts/cow_plushie.png'
        }
      ];
    case 'yuri':
      return [
        ...baseUnlockables,
        {
          id: 'yuri_gift_tea',
          name: 'Jasmine Tea Set',
          type: 'gift',
          description: 'A sophisticated tea set for Yuri',
          requiredAffinity: 40,
          unlocked: false,
          imageUrl: '/images/gifts/tea_set.png'
        }
      ];
    case 'natsuki':
      return [
        ...baseUnlockables,
        {
          id: 'natsuki_gift_manga',
          name: 'Manga Collection',
          type: 'gift',
          description: 'The latest volume of Natsuki\'s favorite manga',
          requiredAffinity: 40,
          unlocked: false,
          imageUrl: '/images/gifts/manga.png'
        }
      ];
    case 'monika':
      return [
        ...baseUnlockables,
        {
          id: 'monika_gift_pen',
          name: 'Fountain Pen',
          type: 'gift',
          description: 'An elegant pen for writing poetry',
          requiredAffinity: 40,
          unlocked: false,
          imageUrl: '/images/gifts/fountain_pen.png'
        }
      ];
  }
};

// Default dialogue events for each companion
const getDefaultDialogueEvents = (companionId: CompanionId): DialogueEvent[] => {
  const baseEvents: DialogueEvent[] = [
    {
      id: `${companionId}_welcome`,
      trigger: 'affinity',
      triggerValue: 0,
      title: 'First Meeting',
      content: [
        `Hi there! I'm ${companionId.charAt(0).toUpperCase() + companionId.slice(1)}. I'm excited to help you stay productive!`,
        "Let's work hard together, okay?"
      ],
      seen: false
    },
    {
      id: `${companionId}_affinity_10`,
      trigger: 'affinity',
      triggerValue: 10,
      title: 'Getting to Know You',
      content: [
        "I've really enjoyed our time together so far.",
        "I think we're going to make a great team!"
      ],
      seen: false
    },
    {
      id: `${companionId}_streak_7`,
      trigger: 'streak',
      triggerValue: 7,
      title: 'One Week Streak',
      content: [
        "Wow, you've been consistent for a whole week!",
        "That's really impressive. Keep it up!"
      ],
      seen: false
    }
  ];
  
  // Add companion-specific dialogue events
  switch (companionId) {
    case 'sayori':
      return [
        ...baseEvents,
        {
          id: 'sayori_inactivity',
          trigger: 'inactivity',
          triggerValue: 3,
          title: 'Missing You',
          content: [
            "Heyyy, where have you been? I've missed seeing you!",
            "Don't worry though, I'm just happy you're back now!"
          ],
          seen: false
        }
      ];
    case 'yuri':
      return [
        ...baseEvents,
        {
          id: 'yuri_achievement',
          trigger: 'achievement',
          title: 'Thoughtful Analysis',
          content: [
            "I've been reflecting on your progress...",
            "The way you've been developing your habits shows real dedication. It's... quite admirable."
          ],
          seen: false
        }
      ];
    case 'natsuki':
      return [
        ...baseEvents,
        {
          id: 'natsuki_daily',
          trigger: 'daily',
          title: 'Morning Motivation',
          content: [
            "Don't expect me to be impressed just because you showed up today!",
            "...but I guess it's good that you're here. Let's make today count, okay?"
          ],
          seen: false
        }
      ];
    case 'monika':
      return [
        ...baseEvents,
        {
          id: 'monika_affinity_25',
          trigger: 'affinity',
          triggerValue: 25,
          title: 'Special Connection',
          content: [
            "I've noticed something special about our connection.",
            "The way you approach your goals is fascinating. I feel like I understand you better now."
          ],
          seen: false
        }
      ];
  }
};

// Initialize a companion's data
export const initializeCompanionData = async (
  uid: string,
  companionId: CompanionId
): Promise<void> => {
  const companionRef = doc(db, `users/${uid}/companions`, companionId);
  const companionSnap = await getDoc(companionRef);
  
  if (!companionSnap.exists()) {
    const now = Timestamp.now();
    const newCompanion: CompanionData = {
      id: companionId,
      name: companionId.charAt(0).toUpperCase() + companionId.slice(1),
      personality: COMPANION_PERSONALITIES[companionId],
      unlockables: getDefaultUnlockables(companionId),
      dialogueEvents: getDefaultDialogueEvents(companionId),
      stats: {
        totalInteractionTime: 0,
        consecutiveDays: 0,
        lastDailyInteraction: now,
        sessionsCompleted: 0,
        goalsCompleted: 0,
        giftsReceived: []
      },
      affinityLevel: 0,
      mood: 'neutral',
      lastInteraction: now
    };
    
    await setDoc(companionRef, newCompanion);
  }
};

// Get a companion's detailed data
export const getCompanionData = async (
  uid: string,
  companionId: CompanionId
): Promise<CompanionData | null> => {
  const companionRef = doc(db, `users/${uid}/companions`, companionId);
  const companionSnap = await getDoc(companionRef);
  
  if (companionSnap.exists()) {
    return companionSnap.data() as CompanionData;
  }
  
  // If detailed data doesn't exist yet, initialize it from basic user data
  const userData = await getUserDocument(uid);
  if (userData && userData.companions[companionId]) {
    await initializeCompanionData(uid, companionId);
    return getCompanionData(uid, companionId);
  }
  
  return null;
};

// Update companion after a focus session
export const updateCompanionAfterSession = async (
  uid: string,
  companionId: CompanionId,
  sessionDuration: number, // in seconds
  sessionCompleted: boolean
): Promise<void> => {
  console.log(`🔍 updateCompanionAfterSession called: companion=${companionId}, duration=${sessionDuration}s, completed=${sessionCompleted}`);
  
  // First update the basic stats in the user document
  console.log(`📊 Updating basic companion stats in user document`);
  await updateCompanionStats(uid, companionId, sessionDuration);
  
  // Then update the detailed companion data
  console.log(`🔍 Fetching detailed companion data for ${companionId}`);
  const companionRef = doc(db, `users/${uid}/companions`, companionId);
  const companionData = await getCompanionData(uid, companionId);
  
  if (!companionData) {
    console.log(`⚠️ No companion data found for ${companionId}, initializing`);
    await initializeCompanionData(uid, companionId);
    return updateCompanionAfterSession(uid, companionId, sessionDuration, sessionCompleted);
  }
  
  console.log(`📊 Current companion stats:`, {
    affinityLevel: companionData.affinityLevel,
    mood: companionData.mood,
    sessionsCompleted: companionData.stats.sessionsCompleted,
    totalInteractionTime: companionData.stats.totalInteractionTime
  });
  
  // Calculate affinity increase based on session duration and completion
  const affinityIncrease = sessionCompleted 
    ? Math.floor(sessionDuration / 60) // 1 point per minute if completed
    : Math.floor(sessionDuration / 120); // 1 point per 2 minutes if not completed
  
  console.log(`❤️ Calculated affinity increase: ${affinityIncrease} points (${sessionDuration} seconds, completed: ${sessionCompleted})`);
  
  const updates: { [key: string]: FieldValue | Timestamp | number } = {
    'lastInteraction': Timestamp.now(),
    'affinityLevel': Math.min(100, companionData.affinityLevel + affinityIncrease)
  };
  
  if (sessionCompleted) {
    updates['stats.sessionsCompleted'] = increment(1);
  }
  
  console.log(`💾 Updating companion data:`, {
    newAffinityLevel: Math.min(100, companionData.affinityLevel + affinityIncrease),
    incrementSessionsCompleted: sessionCompleted
  });
  
  await updateDoc(companionRef, updates);
  console.log(`✅ Companion data updated successfully`);
  
  // Check for and trigger any new dialogue events
  console.log(`🔍 Checking for new dialogue events`);
  await checkForDialogueEvents(uid, companionId);
};

// Update companion mood based on user activity
export const refreshCompanionMood = async (
  uid: string,
  companionId: CompanionId
): Promise<CompanionMood> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return 'neutral';
  
  const lastInteraction = companionData.lastInteraction.toDate();
  const today = new Date();
  const daysSinceLastInteraction = Math.floor(
    (today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let newMood: CompanionMood = 'neutral';
  
  if (daysSinceLastInteraction > 7) {
    newMood = 'sad';
  } else if (daysSinceLastInteraction > 3) {
    newMood = 'annoyed';
  } else if (daysSinceLastInteraction === 0) {
    // If they've used the app today and have a streak, they're happy
    if (companionData.stats.consecutiveDays > 2) {
      newMood = 'happy';
    }
  }
  
  // Update the mood in both places
  await updateCompanionMood(uid, companionId);
  await updateDoc(doc(db, `users/${uid}/companions`, companionId), {
    mood: newMood
  });
  
  return newMood;
};

// Check for and trigger dialogue events
export const checkForDialogueEvents = async (
  uid: string,
  companionId: CompanionId
): Promise<DialogueEvent | null> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return null;
  
  // Check for affinity-based events
  const affinityEvents = companionData.dialogueEvents.filter(
    event => event.trigger === 'affinity' && 
            event.triggerValue !== undefined && 
            event.triggerValue <= companionData.affinityLevel &&
            !event.seen
  );
  
  // Check for streak-based events
  const streakEvents = companionData.dialogueEvents.filter(
    event => event.trigger === 'streak' && 
            event.triggerValue !== undefined && 
            event.triggerValue <= companionData.stats.consecutiveDays &&
            !event.seen
  );
  
  // Combine and sort by trigger value (highest first for affinity, streak)
  const eligibleEvents = [...affinityEvents, ...streakEvents].sort((a, b) => {
    if (a.triggerValue === undefined || b.triggerValue === undefined) return 0;
    return b.triggerValue - a.triggerValue;
  });
  
  // Get the first eligible event
  const eventToTrigger = eligibleEvents[0];
  
  if (eventToTrigger) {
    // Mark the event as seen
    await updateDoc(doc(db, `users/${uid}/companions`, companionId), {
      dialogueEvents: companionData.dialogueEvents.map(event => 
        event.id === eventToTrigger.id ? { ...event, seen: true } : event
      )
    });
    
    return eventToTrigger;
  }
  
  return null;
};

// Get a greeting message based on time of day and companion
export const getCompanionGreeting = async (
  uid: string,
  companionId: CompanionId
): Promise<string> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return "Hello there!";
  
  const hour = new Date().getHours();
  let timeOfDay = "day";
  
  if (hour < 12) timeOfDay = "morning";
  else if (hour < 18) timeOfDay = "afternoon";
  else timeOfDay = "evening";
  
  // Personalized greetings based on companion personality
  switch (companionId) {
    case 'sayori':
      return hour < 10 
        ? "Good morning! I'm still a bit sleepy, but ready to help you be productive!" 
        : `Good ${timeOfDay}! Let's make today super productive together!`;
    case 'yuri':
      return `Good ${timeOfDay}. I hope you're finding some peace amidst your busy schedule.`;
    case 'natsuki':
      return hour < 10 
        ? "Morning... *yawn* Don't expect me to be all peppy this early!" 
        : `Hey there! Ready to get some work done this ${timeOfDay}?`;
    case 'monika':
      return `Good ${timeOfDay}! I've been waiting for you. Let's make the most of our time together.`;
    default:
      return `Good ${timeOfDay}! Ready to focus?`;
  }
};

// Get encouragement message when starting a session
export const getSessionStartMessage = async (
  uid: string,
  companionId: CompanionId
): Promise<string> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return "You can do this!";
  
  // Messages based on companion personality
  switch (companionId) {
    case 'sayori':
      return "Yay! Let's do our best together! I believe in you!";
    case 'yuri':
      return "Take a deep breath... focus your mind... I'll be here with you.";
    case 'natsuki':
      return "Alright, let's show everyone what you're made of! No slacking!";
    case 'monika':
      return "I've prepared everything for a productive session. Let's make every minute count!";
    default:
      return "Let's focus and do our best!";
  }
};

// Get message for completing a session
export const getSessionCompleteMessage = async (
  uid: string,
  companionId: CompanionId
): Promise<string> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return "Great job!";
  
  // Messages based on companion personality
  switch (companionId) {
    case 'sayori':
      return "Woohoo! You did it! I'm so proud of you!";
    case 'yuri':
      return "Excellent work. The way you maintained focus was... impressive.";
    case 'natsuki':
      return "Not bad at all! See what happens when you actually try?";
    case 'monika':
      return "Perfect execution! Your dedication is truly inspiring.";
    default:
      return "Session complete! Well done!";
  }
};

// Give a gift to a companion
export const giveGiftToCompanion = async (
  uid: string,
  companionId: CompanionId,
  giftId: string
): Promise<{ success: boolean; message: string; affinityIncrease: number }> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) {
    return { success: false, message: "Companion not found", affinityIncrease: 0 };
  }
  
  // Find the gift in unlockables
  const gift = companionData.unlockables.find(item => item.id === giftId && item.type === 'gift');
  
  if (!gift) {
    return { success: false, message: "Gift not found", affinityIncrease: 0 };
  }
  
  if (!gift.unlocked) {
    return { success: false, message: "You haven't unlocked this gift yet", affinityIncrease: 0 };
  }
  
  // Check if gift was already given recently
  if (companionData.stats.giftsReceived.includes(giftId)) {
    return { success: true, message: "Thank you for the gift again!", affinityIncrease: 1 };
  }
  
  // Calculate affinity increase based on gift
  const affinityIncrease = Math.floor(gift.requiredAffinity / 5);
  
  // Update companion data
  await updateDoc(doc(db, `users/${uid}/companions`, companionId), {
    'affinityLevel': Math.min(100, companionData.affinityLevel + affinityIncrease),
    'stats.giftsReceived': arrayUnion(giftId)
  });
  
  // Return personalized response
  let message = "Thank you for the gift!";
  switch (companionId) {
    case 'sayori':
      message = `Waaaah! A ${gift.name}?! For me?! Thank you so much!!`;
      break;
    case 'yuri':
      message = `Oh my... a ${gift.name}. That's very thoughtful of you. I'll treasure it.`;
      break;
    case 'natsuki':
      message = `A ${gift.name}? I mean, it's not like I wanted one or anything... but thanks.`;
      break;
    case 'monika':
      message = `A ${gift.name}! How did you know? You really do pay attention to the details.`;
      break;
  }
  
  return { success: true, message, affinityIncrease };
};

// Check and unlock new companion content based on affinity
export const checkForUnlocks = async (
  uid: string,
  companionId: CompanionId
): Promise<CompanionUnlockable[]> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return [];
  
  const newUnlocks: CompanionUnlockable[] = [];
  let hasUpdates = false;
  
  const updatedUnlockables = companionData.unlockables.map(item => {
    if (!item.unlocked && item.requiredAffinity <= companionData.affinityLevel) {
      hasUpdates = true;
      newUnlocks.push(item);
      return { ...item, unlocked: true };
    }
    return item;
  });
  
  if (hasUpdates) {
    await updateDoc(doc(db, `users/${uid}/companions`, companionId), {
      unlockables: updatedUnlockables
    });
  }
  
  return newUnlocks;
};

// Get a reminder message if user has been inactive
export const getInactivityReminder = async (
  uid: string,
  companionId: CompanionId
): Promise<string | null> => {
  const companionData = await getCompanionData(uid, companionId);
  if (!companionData) return null;
  
  const lastInteraction = companionData.lastInteraction.toDate();
  const today = new Date();
  const daysSinceLastInteraction = Math.floor(
    (today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastInteraction < 2) return null;
  
  // Personalized reminder based on companion
  switch (companionId) {
    case 'sayori':
      return "Heyyy! I haven't seen you in a while! I miss our productive time together!";
    case 'yuri':
      return "I've noticed your absence lately... I hope everything is alright. Perhaps we could resume our focus sessions soon?";
    case 'natsuki':
      return `${daysSinceLastInteraction} days without showing up? You better have a good excuse!`;
    case 'monika':
      return "I've been keeping track, and it's been a while since our last session. Your goals are still waiting for you!";
    default:
      return "It's been a while since your last focus session. Ready to get back to it?";
  }
};

// Update companion after goal completion
export const updateCompanionAfterGoalComplete = async (
  uid: string,
  companionId: CompanionId,
  isCompanionGoal: boolean = false
): Promise<void> => {
  const companionRef = doc(db, `users/${uid}/companions`, companionId);
  
  // Affinity boost is higher if it was a companion-assigned goal
  const affinityIncrease = isCompanionGoal ? 5 : 2;
  
  await updateDoc(companionRef, {
    'stats.goalsCompleted': increment(1),
    'affinityLevel': increment(affinityIncrease),
    'lastInteraction': Timestamp.now()
  });
  
  // Check for unlocks and dialogue events
  await checkForUnlocks(uid, companionId);
  await checkForDialogueEvents(uid, companionId);
};

// Get all companions data for a user
export const getAllCompanionsData = async (
  uid: string
): Promise<Record<CompanionId, CompanionData>> => {
  const companions: Record<CompanionId, CompanionData> = {} as Record<CompanionId, CompanionData>;
  const companionIds: CompanionId[] = ['sayori', 'yuri', 'natsuki', 'monika'];
  
  for (const id of companionIds) {
    const data = await getCompanionData(uid, id);
    if (data) {
      companions[id] = data;
    } else {
      await initializeCompanionData(uid, id);
      const newData = await getCompanionData(uid, id);
      if (newData) companions[id] = newData;
    }
  }
  
  return companions;
}; 