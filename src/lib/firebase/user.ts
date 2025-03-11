import { db, Timestamp } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment, FieldValue } from 'firebase/firestore';
import type { Goal } from './goals';
import { CompanionId, CompanionMood } from './companion';

export interface FocusSession {
  id: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number; // in seconds
  completed: boolean;
  companionId: CompanionId;
  breaks: {
    count: number;
    totalDuration: number; // in seconds
  };
  tags?: string[];
}

export interface UserStats {
  totalFocusTime: number; // in seconds
  todaysFocusTime: number; // in seconds
  weeklyFocusTime: number; // in seconds
  totalSessions: number;
  completedSessions: number;
  weekStreak: number;
  longestStreak: number;
  averageFocusPerDay: number; // in seconds
  taskCompletionRate: number; // percentage
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  lastSessionDate: Timestamp;
  dailyStreak: number;
  totalBreaks: number;
  averageSessionDuration: number; // in seconds
}

export interface UserDocument {
  base: {
    uid: string;
    email: string;
    displayName: string;
    createdAt: Timestamp;
    lastLogin: Timestamp;
    lastActive: Timestamp;
  };
  settings: {
    selectedCompanion: CompanionId | null;
    timerSettings: {
      workDuration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
      longBreakInterval: number;
      autoStartBreaks: boolean;
      autoStartPomodoros: boolean;
      notifications: boolean;
    };
    theme: {
      darkMode: boolean;
      accentColor: string;
      backgroundId: string;
    };
  };
  companions: {
    [companionId: string]: {
      affinityLevel: number;
      lastInteraction: Timestamp;
      mood: CompanionMood;
      stats: {
        totalInteractionTime: number; // in seconds
        consecutiveDays: number;
        lastDailyInteraction: Timestamp;
        sessionsCompleted: number;
        goalsCompleted: number;
        giftsReceived: string[];
      };  
    };
  };
  focusStats: UserStats;
  recentSessions: FocusSession[];
  goals: {
    dailyGoal: number; // in minutes
    weeklyGoal: number; // in minutes
    companionAssignedGoal: string;
    list: Goal[];
    lastUpdated: Timestamp;
    completedGoals: number;
    challengeGoalsCompleted: number;
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
  selectedCompanion: CompanionId = 'sayori' // Default to sayori if not provided
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const now = Timestamp.now();
    const defaultCompanionStats = {
      affinityLevel: 0,
      lastInteraction: now,
      mood: 'neutral' as CompanionMood,
      stats: {
        totalInteractionTime: 0,
        consecutiveDays: 0,
        lastDailyInteraction: now,
        sessionsCompleted: 0,
        goalsCompleted: 0,
        giftsReceived: [],
      },
    };

    const newUser: UserDocument = {
      base: {
        uid,
        email,
        displayName: email.split('@')[0],
        createdAt: now,
        lastLogin: now,
        lastActive: now,
      },
      settings: {
        selectedCompanion, // Use the selected companion
        timerSettings: {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          notifications: true,
        },
        theme: {
          darkMode: true,
          accentColor: '#FF80AB', // Default pink accent
          backgroundId: 'default',
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
        totalSessions: 0,
        completedSessions: 0,
        weekStreak: 0,
        longestStreak: 0,
        averageFocusPerDay: 0,
        taskCompletionRate: 0,
        lastSessionDate: now,
        dailyStreak: 0,
        totalBreaks: 0,
        averageSessionDuration: 0,
      },
      recentSessions: [],
      goals: {
        dailyGoal: 25, // Default 25 minutes
        weeklyGoal: 150, // Default 2.5 hours per week
        companionAssignedGoal: "Complete your first focus session!",
        list: [],
        lastUpdated: now,
        completedGoals: 0,
        challengeGoalsCompleted: 0,
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
    
    // Handle potential missing fields in older user documents
    const updatedUserData = {
      ...userData,
      base: {
        ...userData.base,
        createdAt: userData.base.createdAt,
        lastLogin: userData.base.lastLogin,
        lastActive: userData.base.lastActive || userData.base.lastLogin,
      },
      companions: Object.keys(userData.companions).reduce((acc, companionId) => {
        acc[companionId] = {
          ...userData.companions[companionId],
          lastInteraction: userData.companions[companionId].lastInteraction,
          stats: {
            ...userData.companions[companionId].stats,
            lastDailyInteraction: userData.companions[companionId].stats.lastDailyInteraction,
            sessionsCompleted: userData.companions[companionId].stats.sessionsCompleted || 0,
            goalsCompleted: userData.companions[companionId].stats.goalsCompleted || 0,
            giftsReceived: userData.companions[companionId].stats.giftsReceived || [],
          },
        };
        return acc;
      }, {} as UserDocument["companions"]),
      settings: {
        ...userData.settings,
        timerSettings: {
          ...userData.settings.timerSettings,
          longBreakInterval: userData.settings.timerSettings.longBreakInterval || 4,
          autoStartBreaks: userData.settings.timerSettings.autoStartBreaks || false,
          autoStartPomodoros: userData.settings.timerSettings.autoStartPomodoros || false,
          notifications: userData.settings.timerSettings.notifications !== false, // Default to true
        },
        theme: userData.settings.theme || {
          darkMode: true,
          accentColor: '#FF80AB',
          backgroundId: 'default',
        },
      },
      focusStats: {
        ...userData.focusStats,
        totalSessions: userData.focusStats.totalSessions || 0,
        completedSessions: userData.focusStats.completedSessions || 0,
        lastSessionDate: userData.focusStats.lastSessionDate || userData.base.lastLogin,
        dailyStreak: userData.focusStats.dailyStreak || 0,
        totalBreaks: userData.focusStats.totalBreaks || 0,
        averageSessionDuration: userData.focusStats.averageSessionDuration || 0,
      },
      recentSessions: userData.recentSessions || [],
      goals: {
        ...userData.goals,
        weeklyGoal: userData.goals.weeklyGoal || 150,
        completedGoals: userData.goals.completedGoals || 0,
        challengeGoalsCompleted: userData.goals.challengeGoalsCompleted || 0,
      },
      version: userData.version || 1
    };
    
    // Check if it's a new day and reset todaysFocusTime if needed
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get the date from lastSessionDate
    const lastSessionDate = updatedUserData.focusStats.lastSessionDate?.toDate();
    
    if (lastSessionDate) {
      const lastSessionDay = new Date(
        lastSessionDate.getFullYear(), 
        lastSessionDate.getMonth(), 
        lastSessionDate.getDate()
      );
      
      // If the last session was on a different day than today, reset todaysFocusTime
      const isNewDay = today.getTime() !== lastSessionDay.getTime();
      
      if (isNewDay && updatedUserData.focusStats.todaysFocusTime > 0) {
        console.log(`📅 New day detected on data fetch. Resetting today's focus time from ${updatedUserData.focusStats.todaysFocusTime}s to 0s`);
        
        // Reset todaysFocusTime in the returned data
        updatedUserData.focusStats.todaysFocusTime = 0;
        
        // Also update the value in Firebase
        try {
          await updateDoc(userRef, {
            'focusStats.todaysFocusTime': 0
          });
          console.log("✅ Reset today's focus time in Firebase");
        } catch (error) {
          console.error("❌ Error resetting today's focus time:", error);
        }
      }
    }
    
    return updatedUserData;
  }

  return null;
};

export const updateUserLastLogin = async (uid: string): Promise<void> => {
  const now = Timestamp.now();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'base.lastLogin': now,
    'base.lastActive': now,
  });
};

export const updateUserLastActive = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'base.lastActive': Timestamp.now(),
  });
};

export const updateSelectedCompanion = async (uid: string, companionId: CompanionId): Promise<void> => {
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

export const updateThemeSettings = async (
  uid: string,
  theme: UserDocument['settings']['theme']
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'settings.theme': theme,
  });
};

export const updateCompanionMood = async (
  uid: string,
  companionId: CompanionId
): Promise<CompanionMood> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return 'neutral';

  const userData = userSnap.data() as UserDocument;
  const lastInteraction = userData.companions[companionId].lastInteraction.toDate();
  const today = new Date();
  const daysSinceLastInteraction = Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

  let newMood: CompanionMood = 'neutral';
  if (daysSinceLastInteraction > 7) newMood = 'sad';
  else if (daysSinceLastInteraction > 3) newMood = 'annoyed';
  else if (daysSinceLastInteraction === 0) newMood = 'happy';

  await updateDoc(userRef, {
    [`companions.${companionId}.mood`]: newMood,
  });
  
  return newMood;
};

export const updateCompanionStats = async (
  uid: string,
  companionId: CompanionId,
  interactionTime: number
): Promise<void> => {
  console.log(`📊 updateCompanionStats: Updating stats for ${companionId} with ${interactionTime} seconds of interaction`);
  
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error(`❌ User ${uid} document not found`);
    return;
  }

  const userData = userSnap.data() as UserDocument;
  const companion = userData.companions[companionId];
  
  if (!companion) {
    console.error(`❌ Companion ${companionId} not found in user data`);
    return;
  }
  
  console.log(`📊 Current companion stats:`, {
    totalInteractionTime: companion.stats.totalInteractionTime,
    consecutiveDays: companion.stats.consecutiveDays,
    lastDailyInteraction: companion.stats.lastDailyInteraction.toDate()
  });
  
  const lastInteraction = companion.stats.lastDailyInteraction.toDate();
  const today = new Date();

  const isNewDay =
    lastInteraction.getDate() !== today.getDate() ||
    lastInteraction.getMonth() !== today.getMonth() ||
    lastInteraction.getFullYear() !== today.getFullYear();

  const consecutiveDays = isNewDay ? companion.stats.consecutiveDays + 1 : companion.stats.consecutiveDays;
  
  console.log(`📊 Day status: isNewDay=${isNewDay}, currentConsecutiveDays=${companion.stats.consecutiveDays}, newConsecutiveDays=${consecutiveDays}`);

  console.log(`💾 Updating companion stats in user document`);
  await updateDoc(userRef, {
    [`companions.${companionId}.stats.totalInteractionTime`]: increment(interactionTime),
    [`companions.${companionId}.stats.consecutiveDays`]: consecutiveDays,
    [`companions.${companionId}.stats.lastDailyInteraction`]: Timestamp.now(),
    [`companions.${companionId}.lastInteraction`]: Timestamp.now(),
  });

  console.log(`✅ Companion stats updated successfully`);
  console.log(`🔄 Updating companion affinity next...`);
  await updateCompanionAffinity(uid, companionId, interactionTime);
};

export const updateCompanionAffinity = async (
  uid: string,
  companionId: CompanionId,
  interactionTime: number
): Promise<void> => {
  console.log(`❤️ updateCompanionAffinity: Calculating affinity change for ${companionId} with ${interactionTime} seconds of interaction`);
  
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error(`❌ User ${uid} document not found`);
    return;
  }

  const userData = userSnap.data() as UserDocument;
  const companion = userData.companions[companionId];
  
  if (!companion) {
    console.error(`❌ Companion ${companionId} not found in user data`);
    return;
  }

  // Calculate affinity increase - base value is 1 point per minute of interaction
  const baseAffinityIncrease = Math.ceil(interactionTime / 60);
  
  // Apply streak bonus - if streak is 3+ days, give bonus affinity
  const streakBonus = companion.stats.consecutiveDays >= 3 ? Math.floor(companion.stats.consecutiveDays / 3) : 0;
  
  // Total increase
  const totalAffinityIncrease = baseAffinityIncrease + streakBonus;
  
  // Cap at maximum of 1000 (10 levels with 100 points each)
  const currentAffinity = companion.affinityLevel;
  const newAffinity = Math.min(1000, currentAffinity + totalAffinityIncrease);
  
  console.log(`❤️ Affinity calculation:`, {
    baseIncrease: baseAffinityIncrease,
    streakBonus: streakBonus,
    totalIncrease: totalAffinityIncrease,
    currentAffinity: currentAffinity,
    newAffinity: newAffinity,
    level: Math.floor(newAffinity / 100) + 1
  });

  // Only update if there's an actual change
  if (newAffinity > currentAffinity) {
    console.log(`💾 Updating affinity from ${currentAffinity} to ${newAffinity}`);
    await updateDoc(userRef, {
      [`companions.${companionId}.affinityLevel`]: newAffinity
    });
    console.log(`✅ Affinity updated successfully`);
  } else {
    console.log(`ℹ️ No affinity change needed`);
  }
};

/**
 * Record a completed focus session
 */
export const recordFocusSession = async (
  uid: string,
  session: Omit<FocusSession, 'id'>
): Promise<void> => {
  console.log("💾 Firebase: Recording focus session", session);
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    console.error("❌ Firebase: User document not found");
    return;
  }
  
  const userData = userSnap.data() as UserDocument;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Handle initial case - if no lastSessionDate or it's the default init value
  let isFirstSession = false;
  const lastSessionDate = userData.focusStats.lastSessionDate?.toDate();
  
  if (!lastSessionDate || (
    // Check if it's the init date (same as user creation time or has 0 stats)
    userData.focusStats.totalSessions === 0 && 
    userData.focusStats.totalFocusTime === 0)
  ) {
    isFirstSession = true;
    console.log(`📊 Firebase: First session ever detected!`);
  }
  
  const lastSessionDay = lastSessionDate ? 
    new Date(lastSessionDate.getFullYear(), lastSessionDate.getMonth(), lastSessionDate.getDate()) :
    new Date(today);
  
  // Check if this is a new day
  const isNewDay = today.getTime() !== lastSessionDay.getTime();
  console.log(`📆 Firebase: Checking day status - Today: ${today.toISOString().split('T')[0]}, Last Session: ${lastSessionDay.toISOString().split('T')[0]}, Is New Day: ${isNewDay}`);
  
  // Calculate daily streak
  let dailyStreak = userData.focusStats.dailyStreak;
  
  if (isFirstSession) {
    // First ever session - start the streak at 1
    dailyStreak = 1;
    console.log(`🎯 Firebase: First session ever - Setting daily streak to 1`);
  } else if (isNewDay) {
    // If the last session was yesterday, increment streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (lastSessionDay.getTime() === yesterdayDate.getTime()) {
      dailyStreak += 1;
      console.log(`🎯 Firebase: Incremented daily streak to ${dailyStreak}`);
    } else {
      // If there was a gap, reset streak
      dailyStreak = 1;
      console.log(`🎯 Firebase: Reset daily streak to 1 (gap in days)`);
    }
  } else if (dailyStreak === 0) {
    // Special case: if streak is 0 but we have sessions, set it to 1
    dailyStreak = 1;
    console.log(`🎯 Firebase: Fixing daily streak - was 0, setting to 1`);
  }
  
  // Reset today's focus time if it's a new day
  const todaysFocusTime = isNewDay ? session.duration : userData.focusStats.todaysFocusTime + session.duration;
  console.log(`⏱️ Firebase: Today's focus time - Old: ${userData.focusStats.todaysFocusTime}s, Updated: ${todaysFocusTime}s`);
  
  // Calculate weekly focus time
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  let weeklyFocusTime = userData.focusStats.weeklyFocusTime;
  const lastSessionWeek = new Date(lastSessionDay);
  lastSessionWeek.setDate(lastSessionDay.getDate() - lastSessionDay.getDay());
  
  // Reset weekly focus time if it's a new week
  if (startOfWeek.getTime() !== lastSessionWeek.getTime()) {
    weeklyFocusTime = session.duration;
    console.log(`📅 Firebase: Reset weekly focus time (new week)`);
  } else {
    weeklyFocusTime += session.duration;
    console.log(`📅 Firebase: Updated weekly focus time to ${weeklyFocusTime}s`);
  }
  
  // Calculate average session duration
  const totalSessions = userData.focusStats.totalSessions + 1;
  const totalFocusTime = userData.focusStats.totalFocusTime + session.duration;
  const averageSessionDuration = Math.round(totalFocusTime / totalSessions);
  
  console.log(`📊 Firebase: Updated stats - Total Time: ${totalFocusTime}s, Total Sessions: ${totalSessions}, Avg Duration: ${averageSessionDuration}s`);
  
  // Calculate task completion rate
  const completedSessions = session.completed 
    ? userData.focusStats.completedSessions + 1 
    : userData.focusStats.completedSessions;
  const taskCompletionRate = Math.round((completedSessions / totalSessions) * 100);
  
  // Create session record
  const newSession: FocusSession = {
    ...session,
    id: `session_${Date.now()}`,
  };
  
  // Keep only the 10 most recent sessions
  const recentSessions = [newSession, ...userData.recentSessions].slice(0, 10);
  
  console.log("💾 Firebase: Updating user document with new stats and session data");
  console.log(`🛑 Firebase: Session breaks: ${session.breaks.count}, Current total breaks: ${userData.focusStats.totalBreaks}, New total: ${userData.focusStats.totalBreaks + session.breaks.count}`);
  
  // Update user stats
  try {
    await updateDoc(userRef, {
      'focusStats.totalFocusTime': totalFocusTime,
      'focusStats.todaysFocusTime': todaysFocusTime,
      'focusStats.weeklyFocusTime': weeklyFocusTime,
      'focusStats.totalSessions': totalSessions,
      'focusStats.completedSessions': completedSessions,
      'focusStats.taskCompletionRate': taskCompletionRate,
      'focusStats.lastSessionDate': session.endTime,
      'focusStats.dailyStreak': dailyStreak,
      'focusStats.longestStreak': Math.max(dailyStreak, userData.focusStats.longestStreak),
      'focusStats.totalBreaks': userData.focusStats.totalBreaks + session.breaks.count,
      'focusStats.averageSessionDuration': averageSessionDuration,
      'recentSessions': recentSessions,
      [`companions.${session.companionId}.stats.sessionsCompleted`]: increment(session.completed ? 1 : 0),
      [`companions.${session.companionId}.stats.totalInteractionTime`]: increment(session.duration),
      [`companions.${session.companionId}.lastInteraction`]: session.endTime,
    });
    console.log("✅ Firebase: Successfully updated user document with session data");
  } catch (error) {
    console.error("❌ Firebase: Error updating user document:", error);
  }
  
  // Update companion mood (still needed) and affinity
  try {
    // Update mood
    await updateCompanionMood(uid, session.companionId);
    // Update affinity directly (skip updateCompanionStats which would double count)
    await updateCompanionAffinity(uid, session.companionId, session.duration);
    console.log(`✅ Firebase: Successfully updated companion mood and affinity for ${session.companionId}`);
  } catch (error) {
    console.error("❌ Firebase: Error updating companion mood and affinity:", error);
  }
};

/**
 * Get user's focus statistics
 */
export const getUserStats = async (uid: string): Promise<UserStats | null> => {
  const userDoc = await getUserDocument(uid);
  if (!userDoc) return null;
  
  return userDoc.focusStats;
};

/**
 * Update user's daily and weekly goals
 */
export const updateFocusGoals = async (
  uid: string, 
  dailyGoal?: number,
  weeklyGoal?: number
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const updates: Record<string, number> = {};
  
  if (dailyGoal !== undefined) {
    updates['goals.dailyGoal'] = dailyGoal;
  }
  
  if (weeklyGoal !== undefined) {
    updates['goals.weeklyGoal'] = weeklyGoal;
  }
  
  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
  }
};

/**
 * Increment completed goals counter
 */
export const incrementCompletedGoals = async (
  uid: string,
  isChallenge: boolean = false
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  const updates: Record<string, FieldValue> = {
    'goals.completedGoals': increment(1)
  };
  
  if (isChallenge) {
    updates['goals.challengeGoalsCompleted'] = increment(1);
  }
  
  await updateDoc(userRef, updates);
};
