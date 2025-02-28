import { db, Timestamp } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { Goal } from './goals';

export interface UserDocument {
  base: {
    uid: string;
    email: string;
    displayName: string;
    createdAt: Timestamp;
    lastLogin: Timestamp;
  };
  settings: {
    selectedCompanion: 'sayori' | 'yuri' | 'natsuki' | 'monika' | null;
    timerSettings: {
      workDuration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
    };
  };
  companions: {
    [companionId: string]: {
      affinityLevel: number;
      lastInteraction: Timestamp;
      mood: 'happy' | 'neutral' | 'annoyed' | 'sad';
      stats: {
        totalInteractionTime: number;
        consecutiveDays: number;
        lastDailyInteraction: Timestamp;
      };
    };
  };
  focusStats: {
    totalFocusTime: number;
    todaysFocusTime: number;
    weeklyFocusTime: number;
    weekStreak: number;
    longestStreak: number;
    averageFocusPerDay: number;
    taskCompletionRate: number;
  };
  goals: {
    dailyGoal: number;
    companionAssignedGoal: string;
    list: Goal[];
    lastUpdated: Timestamp;
  };
  achievements: {
    id: string;
    unlockedAt: Timestamp;
  }[];
  version: number;
}

export const createUserDocument = async (
  uid: string, 
  email: string,
  selectedCompanion: 'sayori' | 'yuri' | 'natsuki' | 'monika' = 'sayori' // Default to sayori if not provided
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const now = Timestamp.now();
    const defaultCompanionStats = {
      affinityLevel: 0,
      lastInteraction: now,
      mood: 'neutral' as const,
      stats: {
        totalInteractionTime: 0,
        consecutiveDays: 0,
        lastDailyInteraction: now,
      },
    };

    const newUser: UserDocument = {
      base: {
        uid,
        email,
        displayName: email.split('@')[0],
        createdAt: now,
        lastLogin: now,
      },
      settings: {
        selectedCompanion, // Use the selected companion
        timerSettings: {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
        },
      },
      companions: {
        sayori: { ...defaultCompanionStats, lastInteraction: now, stats: { ...defaultCompanionStats.stats, lastDailyInteraction: now } },
        yuri: { ...defaultCompanionStats, lastInteraction: now, stats: { ...defaultCompanionStats.stats, lastDailyInteraction: now } },
        natsuki: { ...defaultCompanionStats, lastInteraction: now, stats: { ...defaultCompanionStats.stats, lastDailyInteraction: now } },
        monika: { ...defaultCompanionStats, lastInteraction: now, stats: { ...defaultCompanionStats.stats, lastDailyInteraction: now } },
      },
      focusStats: {
        totalFocusTime: 0,
        todaysFocusTime: 0,
        weeklyFocusTime: 0,
        weekStreak: 0,
        longestStreak: 0,
        averageFocusPerDay: 0,
        taskCompletionRate: 0,
      },
      goals: {
        dailyGoal: 25, // Default 25 minutes
        companionAssignedGoal: "Complete your first focus session!",
        list: [],
        lastUpdated: now,
      },
      achievements: [],
      version: 1,
    };

    await setDoc(userRef, newUser);
  }
};

export const getUserDocument = async (uid: string): Promise<UserDocument | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserDocument;
    return {
      ...userData,
      base: {
        ...userData.base,
        createdAt: userData.base.createdAt,
        lastLogin: userData.base.lastLogin,
      },
      companions: Object.keys(userData.companions).reduce((acc, companionId) => {
        acc[companionId] = {
          ...userData.companions[companionId],
          lastInteraction: userData.companions[companionId].lastInteraction,
          stats: {
            ...userData.companions[companionId].stats,
            lastDailyInteraction: userData.companions[companionId].stats.lastDailyInteraction,
          },
        };
        return acc;
      }, {} as UserDocument["companions"]),
      settings: userData.settings,
      focusStats: userData.focusStats,
      goals: userData.goals,
      achievements: userData.achievements,
      version: userData.version
    };
  }

  return null;
};

export const updateUserLastLogin = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'base.lastLogin': Timestamp.now(),
  });
};

export const updateSelectedCompanion = async (uid: string, companionId: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'settings.selectedCompanion': companionId,
    [`companions.${companionId}.lastInteraction`]: Timestamp.now(),
  });
};

export const updateTimerSettings = async (
  uid: string,
  settings: UserDocument['settings']['timerSettings']
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'settings.timerSettings': settings,
  });
};

export const updateCompanionMood = async (
  uid: string,
  companionId: 'sayori' | 'yuri' | 'natsuki' | 'monika'
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data() as UserDocument;
  const lastInteraction = userData.companions[companionId].lastInteraction.toDate();
  const today = new Date();
  const daysSinceLastInteraction = Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

  let newMood: UserDocument['companions'][string]['mood'] = 'neutral';
  if (daysSinceLastInteraction > 7) newMood = 'sad';
  else if (daysSinceLastInteraction > 3) newMood = 'annoyed';
  else if (daysSinceLastInteraction === 0) newMood = 'happy';

  await updateDoc(userRef, {
    [`companions.${companionId}.mood`]: newMood,
  });
};

export const updateCompanionStats = async (
  uid: string,
  companionId: 'sayori' | 'yuri' | 'natsuki' | 'monika',
  interactionTime: number
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data() as UserDocument;
  const companion = userData.companions[companionId];
  const lastInteraction = companion.stats.lastDailyInteraction.toDate();
  const today = new Date();

  const isNewDay =
    lastInteraction.getDate() !== today.getDate() ||
    lastInteraction.getMonth() !== today.getMonth() ||
    lastInteraction.getFullYear() !== today.getFullYear();

  const consecutiveDays = isNewDay ? companion.stats.consecutiveDays + 1 : companion.stats.consecutiveDays;

  await updateDoc(userRef, {
    [`companions.${companionId}.stats.totalInteractionTime`]: increment(interactionTime),
    [`companions.${companionId}.stats.consecutiveDays`]: consecutiveDays,
    [`companions.${companionId}.stats.lastDailyInteraction`]: Timestamp.now(),
    [`companions.${companionId}.lastInteraction`]: Timestamp.now(),
  });

  await updateCompanionAffinity(uid, companionId, interactionTime);
};

export const updateCompanionAffinity = async (
  uid: string,
  companionId: 'sayori' | 'yuri' | 'natsuki' | 'monika',
  interactionTime: number
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data() as UserDocument;
  const currentAffinity = userData.companions[companionId].affinityLevel;

  const affinityIncrease = Math.floor(interactionTime / 30);
  const newAffinity = Math.min(100, currentAffinity + affinityIncrease);

  await updateDoc(userRef, {
    [`companions.${companionId}.affinityLevel`]: newAffinity,
  });
};
