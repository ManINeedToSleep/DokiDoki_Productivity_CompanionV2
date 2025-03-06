import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
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
      description: 'Reach affinity level 10 with Sayori',
      icon: '💕',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 },
      reward: {
        type: 'sprite',
        id: 'sayori_casual',
        description: 'Unlocks Sayori\'s casual outfit'
      }
    },
    sayori_bestie: {
      id: 'sayori_bestie',
      title: 'Sayori\'s Best Friend',
      description: 'Reach affinity level 50 with Sayori',
      icon: '💖',
      type: 'companion',
      requirement: { type: 'affinity', value: 50 },
      reward: {
        type: 'sprite',
        id: 'sayori_special',
        description: 'Unlocks Sayori\'s special outfit'
      }
    },
    natsuki_friend: {
      id: 'natsuki_friend',
      title: 'Natsuki\'s Friend',
      description: 'Reach affinity level 10 with Natsuki',
      icon: '💝',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 },
      reward: {
        type: 'sprite',
        id: 'natsuki_casual',
        description: 'Unlocks Natsuki\'s casual outfit'
      }
    },
    natsuki_bestie: {
      id: 'natsuki_bestie',
      title: 'Natsuki\'s Best Friend',
      description: 'Reach affinity level 50 with Natsuki',
      icon: '💘',
      type: 'companion',
      requirement: { type: 'affinity', value: 50 },
      reward: {
        type: 'sprite',
        id: 'natsuki_special',
        description: 'Unlocks Natsuki\'s special outfit'
      }
    },
    yuri_friend: {
      id: 'yuri_friend',
      title: 'Yuri\'s Friend',
      description: 'Reach affinity level 10 with Yuri',
      icon: '💜',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 },
      reward: {
        type: 'sprite',
        id: 'yuri_casual',
        description: 'Unlocks Yuri\'s casual outfit'
      }
    },
    yuri_bestie: {
      id: 'yuri_bestie',
      title: 'Yuri\'s Best Friend',
      description: 'Reach affinity level 50 with Yuri',
      icon: '💞',
      type: 'companion',
      requirement: { type: 'affinity', value: 50 },
      reward: {
        type: 'sprite',
        id: 'yuri_special',
        description: 'Unlocks Yuri\'s special outfit'
      }
    },
    monika_friend: {
      id: 'monika_friend',
      title: 'Monika\'s Friend',
      description: 'Reach affinity level 10 with Monika',
      icon: '💚',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 },
      reward: {
        type: 'sprite',
        id: 'monika_casual',
        description: 'Unlocks Monika\'s casual outfit'
      }
    },
    monika_bestie: {
      id: 'monika_bestie',
      title: 'Monika\'s Best Friend',
      description: 'Reach affinity level 50 with Monika',
      icon: '💓',
      type: 'companion',
      requirement: { type: 'affinity', value: 50 },
      reward: {
        type: 'sprite',
        id: 'monika_special',
        description: 'Unlocks Monika\'s special outfit'
      }
    },
    companion_collector: {
      id: 'companion_collector',
      title: 'Friend to All',
      description: 'Reach affinity level 10 with all companions',
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
    just_monika: {
      id: 'just_monika',
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

// Achievement unlock functions
export const unlockAchievement = async (
  uid: string,
  achievementId: string
): Promise<void> => {
  // Check if achievement is already unlocked
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  const userData = userDoc.data();
  const achievements = userData.achievements || [];
  
  // Check if already unlocked
  if (achievements.some((a: { id: string }) => a.id === achievementId)) {
    return; // Already unlocked
  }
  
  const achievement = {
    id: achievementId,
    unlockedAt: Timestamp.now()
  };

  await updateDoc(userRef, {
    achievements: arrayUnion(achievement)
  });
  
  // Apply rewards if applicable
  await applyAchievementReward(uid, achievementId);
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
  // Basic focus achievements
  if (sessionMinutes >= 1) {
    await unlockAchievement(uid, 'first_session');
  }
  
  if (sessionMinutes >= ACHIEVEMENTS.focus.master.requirement.value) {
    await unlockAchievement(uid, 'master');
  }
  
  if (sessionMinutes >= ACHIEVEMENTS.focus.marathon.requirement.value) {
    await unlockAchievement(uid, 'marathon');
  }
  
  if (totalMinutes >= ACHIEVEMENTS.focus.dedication.requirement.value) {
    await unlockAchievement(uid, 'dedication');
  }
  
  if (totalSessions >= ACHIEVEMENTS.focus.centurion.requirement.value) {
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
  // Friend level achievement
  const friendAchievementId = `${companionId}_friend`;
  if (affinityLevel >= 10) {
    await unlockAchievement(uid, friendAchievementId);
  }
  
  // Best friend level achievement
  const bestieAchievementId = `${companionId}_bestie`;
  if (affinityLevel >= 50) {
    await unlockAchievement(uid, bestieAchievementId);
  }
  
  // Check for "Friend to All" achievement if we have data for all companions
  if (allCompanionsData) {
    const allCompanions: CompanionId[] = ['sayori', 'natsuki', 'yuri', 'monika'];
    const allAtLeastLevel10 = allCompanions.every(id => 
      allCompanionsData[id] && allCompanionsData[id].affinityLevel >= 10
    );
    
    if (allAtLeastLevel10) {
      await unlockAchievement(uid, 'companion_collector');
    }
  }
  
  // Special hidden achievement for Monika
  if (companionId === 'monika' && affinityLevel >= 100) {
    await unlockAchievement(uid, 'just_monika');
  }
};

export const checkGoalAchievements = async (
  uid: string,
  completedGoals: Goal[],
  challengeGoals: Goal[]
): Promise<void> => {
  if (completedGoals.length >= 1) {
    await unlockAchievement(uid, 'your_first_goal');
  }
  
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
};

// Special time-based achievement checks
export const checkTimeBasedAchievements = async (
  uid: string,
  sessionStartTime: Date,
  sessionMinutes: number
): Promise<void> => {
  const hour = sessionStartTime.getHours();
  const day = sessionStartTime.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  
  // Night Owl (2 hours between 00:00 and 05:00)
  if (hour >= 0 && hour < 5 && sessionMinutes >= 120) {
    await unlockAchievement(uid, 'night_owl');
  }
  
  // Early Bird (any session before 7 AM)
  if (hour < 7 && sessionMinutes >= 1) {
    await unlockAchievement(uid, 'early_bird');
  }
  
  // Weekend Warrior (4 hours on weekend)
  if (isWeekend && sessionMinutes >= 240) {
    await unlockAchievement(uid, 'weekend_warrior');
  }
  
  // Holiday Hero
  const isHoliday = checkIfHoliday(sessionStartTime);
  if (isHoliday && sessionMinutes >= 30) {
    await unlockAchievement(uid, 'holiday_hero');
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
  sessionSeconds: number,
  sessionStartTime: Date
) => {
  const sessionMinutes = Math.floor(sessionSeconds / 60);
  
  // Check focus achievements for this specific session
  await checkFocusAchievements(uid, 0, sessionMinutes, 0);
  
  // Check time-based achievements
  await checkTimeBasedAchievements(uid, sessionStartTime, sessionMinutes);
};
