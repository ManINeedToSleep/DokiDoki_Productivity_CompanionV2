import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, collection, getDocs } from 'firebase/firestore';
import type { Goal } from './goals';
import type { CompanionId } from './companion';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp | null;
  type: 'focus' | 'companion' | 'goal' | 'hidden' | 'streak';
  requirement: {
    type: 'minutes' | 'streak' | 'goals' | 'affinity' | 'sessions' | 'special';
    value: number;
  };
  reward?: {
    type: 'background' | 'sprite' | 'gift' | 'feature';
    id: string;
    description: string;
  };
}

// Achievement definitions
export const ACHIEVEMENTS = {
  // Focus-based achievements
  focus: {
    first_session: {
      id: 'first_session',
      title: 'First Step',
      description: 'Complete your first focus session',
      icon: '⭐',
      type: 'focus',
      requirement: { type: 'minutes', value: 1 },
      reward: {
        type: 'feature',
        id: 'daily_quote',
        description: 'Unlocks daily motivational quotes from your companion'
      }
    },
    dedication: {
      id: 'dedication',
      title: 'Dedicated Student',
      description: 'Accumulate 10 hours of focus time',
      icon: '📚',
      type: 'focus',
      requirement: { type: 'minutes', value: 600 },
      reward: {
        type: 'background',
        id: 'sunset_bg',
        description: 'Unlocks the peaceful sunset background'
      }
    },
    master: {
      id: 'master',
      title: 'Focus Master',
      description: 'Complete a 50-minute session without breaks',
      icon: '🎯',
      type: 'focus',
      requirement: { type: 'minutes', value: 50 },
      reward: {
        type: 'feature',
        id: 'custom_timer',
        description: 'Unlocks custom timer settings'
      }
    },
    centurion: {
      id: 'centurion',
      title: 'Centurion',
      description: 'Complete 100 focus sessions',
      icon: '💯',
      type: 'focus',
      requirement: { type: 'sessions', value: 100 },
      reward: {
        type: 'background',
        id: 'galaxy_bg',
        description: 'Unlocks the cosmic galaxy background'
      }
    },
    marathon: {
      id: 'marathon',
      title: 'Focus Marathon',
      description: 'Complete a 2-hour focus session',
      icon: '🏃',
      type: 'focus',
      requirement: { type: 'minutes', value: 120 },
      reward: {
        type: 'gift',
        id: 'golden_trophy',
        description: 'A special trophy gift for your companion'
      }
    }
  },

  // Streak-based achievements
  streak: {
    weekly_warrior: {
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day focus streak',
      icon: '📅',
      type: 'streak',
      requirement: { type: 'streak', value: 7 },
      reward: {
        type: 'feature',
        id: 'streak_calendar',
        description: 'Unlocks a visual streak calendar'
      }
    },
    monthly_master: {
      id: 'monthly_master',
      title: 'Monthly Master',
      description: 'Maintain a 30-day focus streak',
      icon: '🗓️',
      type: 'streak',
      requirement: { type: 'streak', value: 30 },
      reward: {
        type: 'sprite',
        id: 'special_outfit',
        description: 'Unlocks a special outfit for your companion'
      }
    },
    legendary: {
      id: 'legendary',
      title: 'Legendary Dedication',
      description: 'Maintain a 100-day focus streak',
      icon: '👑',
      type: 'streak',
      requirement: { type: 'streak', value: 100 },
      reward: {
        type: 'feature',
        id: 'custom_themes',
        description: 'Unlocks the ability to customize app themes'
      }
    }
  },

  // Companion-based achievements
  companion: {
    sayori_friend: {
      id: 'sayori_friend',
      title: 'Sayori\'s Friend',
      description: 'Reach affinity Level 1 with Sayori',
      icon: '💕',
      type: 'companion',
      requirement: { type: 'affinity', value: 1 },
      reward: {
        type: 'sprite',
        id: 'sayori_casual',
        description: 'Unlocks Sayori\'s casual outfit'
      }
    },
    sayori_bestie: {
      id: 'sayori_bestie',
      title: 'Sayori\'s Best Friend',
      description: 'Reach affinity Level 5 with Sayori',
      icon: '💖',
      type: 'companion',
      requirement: { type: 'affinity', value: 5 },
      reward: {
        type: 'sprite',
        id: 'sayori_special',
        description: 'Unlocks Sayori\'s special outfit'
      }
    },
    natsuki_friend: {
      id: 'natsuki_friend',
      title: 'Natsuki\'s Friend',
      description: 'Reach affinity Level 1 with Natsuki',
      icon: '💝',
      type: 'companion',
      requirement: { type: 'affinity', value: 1 },
      reward: {
        type: 'sprite',
        id: 'natsuki_casual',
        description: 'Unlocks Natsuki\'s casual outfit'
      }
    },
    natsuki_bestie: {
      id: 'natsuki_bestie',
      title: 'Natsuki\'s Best Friend',
      description: 'Reach affinity Level 5 with Natsuki',
      icon: '💘',
      type: 'companion',
      requirement: { type: 'affinity', value: 5 },
      reward: {
        type: 'sprite',
        id: 'natsuki_special',
        description: 'Unlocks Natsuki\'s special outfit'
      }
    },
    yuri_friend: {
      id: 'yuri_friend',
      title: 'Yuri\'s Friend',
      description: 'Reach affinity Level 1 with Yuri',
      icon: '💜',
      type: 'companion',
      requirement: { type: 'affinity', value: 1 },
      reward: {
        type: 'sprite',
        id: 'yuri_casual',
        description: 'Unlocks Yuri\'s casual outfit'
      }
    },
    yuri_bestie: {
      id: 'yuri_bestie',
      title: 'Yuri\'s Best Friend',
      description: 'Reach affinity Level 5 with Yuri',
      icon: '💟',
      type: 'companion',
      requirement: { type: 'affinity', value: 5 },
      reward: {
        type: 'sprite',
        id: 'yuri_special',
        description: 'Unlocks Yuri\'s special outfit'
      }
    },
    monika_friend: {
      id: 'monika_friend',
      title: 'Monika\'s Friend',
      description: 'Reach affinity Level 1 with Monika',
      icon: '💚',
      type: 'companion',
      requirement: { type: 'affinity', value: 1 },
      reward: {
        type: 'sprite',
        id: 'monika_casual',
        description: 'Unlocks Monika\'s casual outfit'
      }
    },
    monika_bestie: {
      id: 'monika_bestie',
      title: 'Monika\'s Best Friend',
      description: 'Reach affinity Level 5 with Monika',
      icon: '💞',
      type: 'companion',
      requirement: { type: 'affinity', value: 5 },
      reward: {
        type: 'sprite',
        id: 'monika_special',
        description: 'Unlocks Monika\'s special outfit'
      }
    },
    just_monika: {
      id: 'just_monika',
      title: 'Just Monika',
      description: 'Reach maximum affinity Level 10 with Monika',
      icon: '🌟',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 },
      reward: {
        type: 'sprite',
        id: 'monika_special',
        description: 'Unlocks Monika\'s special outfit'
      }
    },
    companion_collector: {
      id: 'companion_collector',
      title: 'Friend to All',
      description: 'Reach at least affinity Level 1 with all companions',
      icon: '🌟',
      type: 'companion',
      requirement: { type: 'special', value: 0 },
      reward: {
        type: 'background',
        id: 'club_room',
        description: 'Unlocks the Literature Club room background'
      }
    }
  },

  // Goal-based achievements
  goals: {
    your_first_goal: {
      id: 'your_first_goal',
      title: 'Your First Goal',
      description: 'Complete your first study goal',
      icon: '📝',
      type: 'goal',
      requirement: { type: 'goals', value: 1 },
      reward: {
        type: 'feature',
        id: 'goal_templates',
        description: 'Unlocks goal templates for quick creation'
      }
    },
    achiever: {
      id: 'achiever',
      title: 'Achiever',
      description: 'Complete 5 study goals',
      icon: '🏆',
      type: 'goal',
      requirement: { type: 'goals', value: 5 },
      reward: {
        type: 'gift',
        id: 'achievement_medal',
        description: 'A special medal gift for your companion'
      }
    },
    overachiever: {
      id: 'overachiever',
      title: 'Overachiever',
      description: 'Complete 25 study goals',
      icon: '🏅',
      type: 'goal',
      requirement: { type: 'goals', value: 25 },
      reward: {
        type: 'feature',
        id: 'advanced_stats',
        description: 'Unlocks advanced goal statistics and insights'
      }
    },
    challenge_master: {
      id: 'challenge_master',
      title: 'Challenge Master',
      description: 'Complete 10 challenge-type goals',
      icon: '🎮',
      type: 'goal',
      requirement: { type: 'special', value: 10 },
      reward: {
        type: 'feature',
        id: 'custom_challenges',
        description: 'Unlocks the ability to create custom challenges'
      }
    }
  },

  // Hidden achievements
  hidden: {
    night_owl: {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Study for 2 hours after midnight',
      icon: '🦉',
      type: 'hidden',
      requirement: { type: 'minutes', value: 120 },
      reward: {
        type: 'background',
        id: 'night_sky',
        description: 'Unlocks the starry night sky background'
      }
    },
    early_bird: {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Start a session before 7 AM',
      icon: '🌅',
      type: 'hidden',
      requirement: { type: 'minutes', value: 1 },
      reward: {
        type: 'background',
        id: 'sunrise',
        description: 'Unlocks the beautiful sunrise background'
      }
    },
    weekend_warrior: {
      id: 'weekend_warrior',
      title: 'Weekend Warrior',
      description: 'Complete 4 hours of focus time on a weekend',
      icon: '🏋️',
      type: 'hidden',
      requirement: { type: 'minutes', value: 240 },
      reward: {
        type: 'gift',
        id: 'weekend_badge',
        description: 'A special weekend warrior badge for your companion'
      }
    },
    holiday_hero: {
      id: 'holiday_hero',
      title: 'Holiday Hero',
      description: 'Study on a major holiday',
      icon: '🎄',
      type: 'hidden',
      requirement: { type: 'special', value: 0 },
      reward: {
        type: 'sprite',
        id: 'holiday_outfit',
        description: 'Unlocks a holiday-themed outfit for your companion'
      }
    },
    poetry_lover: {
      id: 'poetry_lover',
      title: 'Poetry Lover',
      description: 'Write a poem for your companion',
      icon: '📜',
      type: 'hidden',
      requirement: { type: 'special', value: 0 },
      reward: {
        type: 'feature',
        id: 'poem_sharing',
        description: 'Unlocks the ability to share poems with your companion'
      }
    },
    monika_secret: {
      id: 'monika_secret',
      title: '???',
      description: 'Discovered by those who truly understand',
      icon: '👁️',
      type: 'hidden',
      requirement: { type: 'special', value: 0 },
      reward: {
        type: 'feature',
        id: 'special_dialogue',
        description: 'Unlocks special dialogue options with Monika'
      }
    }
  }
};

// Helper function to get achievement details by ID
const getAchievementById = (achievementId: string): Achievement | undefined => {
  // Search through all categories in the ACHIEVEMENTS object
  for (const category in ACHIEVEMENTS) {
    if (Object.prototype.hasOwnProperty.call(ACHIEVEMENTS, category)) {
      const achievements = ACHIEVEMENTS[category as keyof typeof ACHIEVEMENTS];
      
      // Search through all achievements in this category
      for (const id in achievements) {
        if (Object.prototype.hasOwnProperty.call(achievements, id) && id === achievementId) {
          return achievements[id as keyof typeof achievements] as unknown as Achievement;
        }
      }
    }
  }
  
  return undefined;
};

// Achievement unlock functions
export const unlockAchievement = async (
  uid: string,
  achievementId: string
): Promise<void> => {
  console.log(`🏆 Checking to unlock achievement: ${achievementId}`);
  
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`⚠️ Cannot unlock achievement: User document does not exist`);
      return;
    }
    
    // Check if achievement is already unlocked to prevent duplicates
    const userData = userDoc.data();
    const existingAchievements = userData.achievements || [];
    const alreadyUnlocked = existingAchievements.some((a: { id: string }) => a.id === achievementId);
    
    if (alreadyUnlocked) {
      console.log(`ℹ️ Achievement "${achievementId}" is already unlocked, skipping`);
      return;
    }
    
    // Only proceed if not already unlocked
    console.log(`🎉 Unlocking new achievement: "${achievementId}"`);
    
    // Get the current timestamp
    const timestamp = Timestamp.now();
    
    // Update the user document with the new achievement
    await updateDoc(userRef, {
      achievements: arrayUnion({
        id: achievementId,
        unlockedAt: timestamp
      })
    });
    
    console.log(`✅ Successfully unlocked achievement: "${achievementId}"`);
    
    // Get achievement details
    const achievement = getAchievementById(achievementId);
    
    if (!achievement) {
      console.log(`⚠️ Could not find details for achievement: ${achievementId}`);
      return;
    }
    
    // Apply rewards if applicable
    await applyAchievementReward(uid, achievementId);
  } catch (error) {
    console.error(`❌ Error unlocking achievement "${achievementId}":`, error);
  }
};

// Apply the reward for an achievement
export const applyAchievementReward = async (
  uid: string,
  achievementId: string
): Promise<void> => {
  // Find the achievement in our definitions
  let achievement: Achievement | undefined;
  
  for (const category in ACHIEVEMENTS) {
    const categoryAchievements = ACHIEVEMENTS[category as keyof typeof ACHIEVEMENTS];
    if (achievementId in categoryAchievements) {
      achievement = categoryAchievements[achievementId as keyof typeof categoryAchievements] as Achievement;
      break;
    }
  }
  
  if (!achievement || !achievement.reward) return;
  
  const reward = achievement.reward;
  
  // Apply the reward based on type
  switch (reward.type) {
    case 'background':
    case 'sprite':
    case 'gift':
      // Unlock the item in the user's inventory
      await updateDoc(doc(db, 'users', uid), {
        [`inventory.${reward.type}s`]: arrayUnion(reward.id)
      });
      break;
      
    case 'feature':
      // Enable the feature for the user
      await updateDoc(doc(db, 'users', uid), {
        [`features.${reward.id}`]: true
      });
      break;
  }
};

// Check for achievement completion based on different criteria
export const checkFocusAchievements = async (
  uid: string,
  totalMinutes: number,
  sessionMinutes: number,
  totalSessions: number
): Promise<void> => {
  console.log(`🏆 Detailed focus achievement check:
  - Total focus time: ${totalMinutes} minutes
  - Current session: ${sessionMinutes} minutes
  - Total sessions: ${totalSessions} sessions`);
  
  // Basic focus achievements
  if (sessionMinutes >= 1) {
    console.log(`🏆 "First Step" criteria met (${sessionMinutes} ≥ 1 min)`);
    await unlockAchievement(uid, 'first_session');
  }
  
  if (sessionMinutes >= ACHIEVEMENTS.focus.master.requirement.value) {
    console.log(`🏆 "Focus Master" criteria met (${sessionMinutes} ≥ ${ACHIEVEMENTS.focus.master.requirement.value} min)`);
    await unlockAchievement(uid, 'master');
  }
  
  if (sessionMinutes >= ACHIEVEMENTS.focus.marathon.requirement.value) {
    console.log(`🏆 "Focus Marathon" criteria met (${sessionMinutes} ≥ ${ACHIEVEMENTS.focus.marathon.requirement.value} min)`);
    await unlockAchievement(uid, 'marathon');
  }
  
  if (totalMinutes >= ACHIEVEMENTS.focus.dedication.requirement.value) {
    console.log(`🏆 "Dedicated Student" criteria met (${totalMinutes} ≥ ${ACHIEVEMENTS.focus.dedication.requirement.value} min)`);
    await unlockAchievement(uid, 'dedication');
  }
  
  if (totalSessions >= ACHIEVEMENTS.focus.centurion.requirement.value) {
    console.log(`🏆 "Centurion" criteria met (${totalSessions} ≥ ${ACHIEVEMENTS.focus.centurion.requirement.value} sessions)`);
    await unlockAchievement(uid, 'centurion');
  }
};

export const checkStreakAchievements = async (
  uid: string,
  currentStreak: number
): Promise<void> => {
  if (currentStreak >= ACHIEVEMENTS.streak.weekly_warrior.requirement.value) {
    await unlockAchievement(uid, 'weekly_warrior');
  }
  
  if (currentStreak >= ACHIEVEMENTS.streak.monthly_master.requirement.value) {
    await unlockAchievement(uid, 'monthly_master');
  }
  
  if (currentStreak >= ACHIEVEMENTS.streak.legendary.requirement.value) {
    await unlockAchievement(uid, 'legendary');
  }
};

export const checkCompanionAchievements = async (
  uid: string,
  companionId: CompanionId,
  affinityLevel: number,
  allCompanionsData?: Record<CompanionId, { affinityLevel: number }>
): Promise<void> => {
  // Calculate the companion level from affinity points
  const companionLevel = Math.min(10, Math.floor(affinityLevel / 100) + 1);
  console.log(`Checking achievements for ${companionId} with affinity ${affinityLevel} (Level ${companionLevel})`);
  
  // Friend level achievement - Level 1 (0-99 affinity points)
  const friendAchievementId = `${companionId}_friend`;
  if (companionLevel >= 1) {
    await unlockAchievement(uid, friendAchievementId);
  }
  
  // Best friend level achievement - Level 5 (400-499 affinity points)
  const bestieAchievementId = `${companionId}_bestie`;
  if (companionLevel >= 5) {
    await unlockAchievement(uid, bestieAchievementId);
  }
  
  // Check for "Friend to All" achievement if we have data for all companions
  if (allCompanionsData) {
    const allCompanions: CompanionId[] = ['sayori', 'natsuki', 'yuri', 'monika'];
    const allAtLeastLevel1 = allCompanions.every(id => {
      if (!allCompanionsData[id]) return false;
      const level = Math.min(10, Math.floor(allCompanionsData[id].affinityLevel / 100) + 1);
      return level >= 1;
    });
    
    if (allAtLeastLevel1) {
      await unlockAchievement(uid, 'companion_collector');
    }
  }
  
  // Special achievement for Monika at max level
  // This uses the companion achievement 'just_monika', not the hidden 'monika_secret'
  if (companionId === 'monika' && companionLevel >= 10) {
    await unlockAchievement(uid, 'just_monika');
  }
};

export const checkGoalAchievements = async (
  uid: string,
  completedGoals: Goal[],
  challengeGoals: Goal[]
): Promise<void> => {
  // First check if the user document already has achieved these
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const existingAchievements = userData.achievements || [];
    
    // Only check for the first goal achievement if not already unlocked
    const firstGoalUnlocked = existingAchievements.some((a: { id: string }) => a.id === 'your_first_goal');
    if (!firstGoalUnlocked && completedGoals.length >= 1) {
      await unlockAchievement(uid, 'your_first_goal');
    } else if (firstGoalUnlocked) {
      // If already unlocked in the past, but we don't have completed goals now,
      // re-unlock to make sure it stays unlocked (this shouldn't add duplicates)
      await unlockAchievement(uid, 'your_first_goal');
    }
    
    // For other achievements, we still check the current state
    if (completedGoals.length >= ACHIEVEMENTS.goals.achiever.requirement.value) {
      await unlockAchievement(uid, 'achiever');
    }
    
    if (completedGoals.length >= ACHIEVEMENTS.goals.overachiever.requirement.value) {
      await unlockAchievement(uid, 'overachiever');
    }
    
    // Check for challenge master achievement
    if (challengeGoals.length >= ACHIEVEMENTS.goals.challenge_master.requirement.value) {
      await unlockAchievement(uid, 'challenge_master');
    }
  }
};

// Special time-based achievement checks
export const checkTimeBasedAchievements = async (
  uid: string,
  sessionStartTime: Date,
  sessionMinutes: number
): Promise<void> => {
  const currentHour = sessionStartTime.getHours();
  
  // Check for early bird achievement (before 7 AM)
  if (currentHour < 7) {
    console.log(`🏆 "Early Bird" criteria met (session started at ${currentHour}:00)`);
    await unlockAchievement(uid, 'early_bird');
  }
  
  // Check for night owl achievement (after midnight, at least 2 hours)
  if (currentHour >= 0 && currentHour < 5 && sessionMinutes >= 120) {
    console.log(`🏆 "Night Owl" criteria met (session at ${currentHour}:00 for ${sessionMinutes} minutes)`);
    await unlockAchievement(uid, 'night_owl');
  }
  
  // Check if it's a weekend
  const dayOfWeek = sessionStartTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
  
  if (isWeekend && sessionMinutes >= 240) {
    console.log(`🏆 "Weekend Warrior" criteria met (${sessionMinutes} minutes on a weekend)`);
    await unlockAchievement(uid, 'weekend_warrior');
  }
  
  // Check if it's a holiday
  if (checkIfHoliday(sessionStartTime)) {
    console.log(`🏆 "Holiday Hero" criteria met (session on a holiday)`);
    await unlockAchievement(uid, 'holiday_hero');
  }
  
  // Special hidden Monika achievement - renamed from just_monika to monika_secret
  const specialDate = new Date();
  const isSpecialDay = specialDate.getDate() === 22 && specialDate.getMonth() === 8; // September 22
  
  if (isSpecialDay) {
    console.log('🏆 Special hidden achievement criteria met');
    await unlockAchievement(uid, 'monika_secret');
  }
};

// Helper function to check if a date is a major holiday
const checkIfHoliday = (date: Date): boolean => {
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31
  
  // Check for major US/international holidays
  // New Year's Day
  if (month === 0 && day === 1) return true;
  
  // Valentine's Day
  if (month === 1 && day === 14) return true;
  
  // St. Patrick's Day
  if (month === 2 && day === 17) return true;
  
  // Easter (approximate - would need more complex calculation for exact)
  if (month === 3 && day >= 22 && day <= 25) return true;
  
  // Independence Day (US)
  if (month === 6 && day === 4) return true;
  
  // Halloween
  if (month === 9 && day === 31) return true;
  
  // Thanksgiving (US, approximate)
  if (month === 10 && day >= 22 && day <= 28) return true;
  
  // Christmas Eve/Day
  if (month === 11 && (day === 24 || day === 25)) return true;
  
  // New Year's Eve
  if (month === 11 && day === 31) return true;
  
  return false;
};

interface AchievementStats {
  totalFocusTime: number;
  weekStreak: number;
  longestStreak: number;
  completedGoals: number;
  totalSessions: number;
  challengeGoalsCompleted: number;
}

export const checkAllAchievements = async (uid: string, stats: AchievementStats) => {
  // Focus time achievements
  await checkFocusAchievements(
    uid, 
    Math.floor(stats.totalFocusTime / 60), // Convert seconds to minutes
    0, // Not checking session minutes here
    stats.totalSessions
  );
  
  // Streak achievements
  await checkStreakAchievements(uid, stats.weekStreak);
  
  // Goal achievements
  const mockCompletedGoals = Array(stats.completedGoals).fill({} as Goal);
  const mockChallengeGoals = Array(stats.challengeGoalsCompleted).fill({} as Goal);
  await checkGoalAchievements(uid, mockCompletedGoals, mockChallengeGoals);
  
  // Time-based achievements are checked separately during sessions
};

// Add a new check for uninterrupted sessions in TimerProvider
export const checkSessionAchievements = async (
  uid: string, 
  sessionMinutes: number,
  sessionStartTime: Date
) => {
  console.log(`🏆 Checking session achievements with ${sessionMinutes} minutes at ${sessionStartTime}`);
  
  try {
    // Get user stats first to have accurate counts
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User document not found for ${uid}`);
      return;
    }
    
    const userData = userDoc.data();
    const stats = userData.stats || {};
    const totalFocusTime = Math.floor((stats.totalFocusTime || 0) / 60); // Convert seconds to minutes
    const totalSessions = stats.totalSessions || 0;
    
    console.log(`🏆 Detailed session achievement check:
Total focus time: ${totalFocusTime} minutes
Current session: ${sessionMinutes} minutes
Total sessions: ${totalSessions} sessions`);
    
    // Check if goals were completed in this session
    const goalsRef = collection(db, "users", uid, "goals");
    const goalsSnapshot = await getDocs(goalsRef);
    const completedGoals = goalsSnapshot.docs
      .map(doc => doc.data() as Goal)
      .filter(goal => 
        goal.completed && 
        goal.currentMinutes >= goal.targetMinutes
      );
    
    // First Goal achievement
    if (completedGoals.length > 0) {
      await unlockAchievement(uid, 'your_first_goal');
    }
    
    // Then check focus achievements with the correctly loaded stats
    await checkFocusAchievements(uid, totalFocusTime, sessionMinutes, totalSessions);
    
    // Check time-based achievements
    console.log(`🏆 Checking time-based achievements with ${sessionMinutes} minutes at hour ${sessionStartTime.getHours()}`);
    await checkTimeBasedAchievements(uid, sessionStartTime, sessionMinutes);
  } catch (error) {
    console.error("Error checking session achievements:", error);
  }
};

// Utility function to clean up duplicate achievements
export const cleanupDuplicateAchievements = async (uid: string): Promise<void> => {
  console.log(`🧹 Cleaning up duplicate achievements for user ${uid}`);
  
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`⚠️ Cannot clean up: User document does not exist`);
      return;
    }
    
    const userData = userDoc.data();
    const achievements = userData.achievements || [];
    
    // Track ids we've seen
    const seenIds = new Set<string>();
    const uniqueAchievements = [];
    
    // Only keep the first occurrence of each achievement id
    for (const achievement of achievements) {
      if (!seenIds.has(achievement.id)) {
        seenIds.add(achievement.id);
        uniqueAchievements.push(achievement);
      }
    }
    
    // Only update if we found duplicates
    if (uniqueAchievements.length < achievements.length) {
      console.log(`🧹 Removing ${achievements.length - uniqueAchievements.length} duplicate achievements`);
      
      await updateDoc(userRef, {
        achievements: uniqueAchievements
      });
      
      console.log(`✅ Successfully cleaned up duplicate achievements`);
    } else {
      console.log(`✅ No duplicate achievements found`);
    }
  } catch (error) {
    console.error("Error cleaning up duplicate achievements:", error);
  }
};

// Debug utility to help diagnose achievement issues
export const debugAchievementState = async (uid: string): Promise<void> => {
  console.log(`🔍 Debugging achievement state for user: ${uid}`);
  
  try {
    // 1. Check Firebase user document
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`⚠️ User document does not exist in Firebase!`);
      return;
    }
    
    // 2. Get achievements from user document
    const userData = userDoc.data();
    const firebaseAchievements = userData.achievements || [];
    
    console.log(`📊 Found ${firebaseAchievements.length} achievements in Firebase:`);
    firebaseAchievements.forEach((achievement: { id: string, unlockedAt: { seconds: number, nanoseconds: number } }, index: number) => {
      const unlockTime = achievement.unlockedAt 
        ? new Date(achievement.unlockedAt.seconds * 1000).toLocaleString()
        : 'unknown';
        
      console.log(`  ${index + 1}. ID: "${achievement.id}", Unlocked: ${unlockTime}`);
    });
    
    // 3. Check for duplicates
    const achievementIds = firebaseAchievements.map((a: { id: string }) => a.id);
    const uniqueIds = new Set(achievementIds);
    
    if (uniqueIds.size < achievementIds.length) {
      console.log(`⚠️ DUPLICATE ACHIEVEMENTS DETECTED!`);
      console.log(`  Total achievements: ${achievementIds.length}`);
      console.log(`  Unique achievement IDs: ${uniqueIds.size}`);
      
      // Count occurrences of each ID
      const counts: Record<string, number> = {};
      achievementIds.forEach((id: string) => {
        counts[id] = (counts[id] || 0) + 1;
      });
      
      // Report duplicates
      console.log(`  Duplicate achievements:`);
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .forEach(([id, count]) => {
          console.log(`    - "${id}" appears ${count} times`);
        });
        
      console.log(`  Please run the cleanup utility at /dashboard/achievements/cleanup`);
    } else {
      console.log(`✅ No duplicate achievements found`);
    }
    
    // 4. Check for achievement definitions
    for (const achievement of firebaseAchievements) {
      const achievementDef = getAchievementById(achievement.id);
      if (!achievementDef) {
        console.log(`⚠️ Achievement "${achievement.id}" exists in user data but has no definition!`);
      }
    }
    
    console.log(`🏆 Achievement debugging complete`);
  } catch (error) {
    console.error(`❌ Error debugging achievements:`, error);
  }
};
