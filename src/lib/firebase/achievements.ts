import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import type { Goal } from './goals';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp | null;
  type: 'focus' | 'companion' | 'goal' | 'hidden';
  requirement: {
    type: 'minutes' | 'streak' | 'goals' | 'affinity';
    value: number;
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
      requirement: { type: 'minutes', value: 1 }
    },
    dedication: {
      id: 'dedication',
      title: 'Dedicated Student',
      description: 'Accumulate 10 hours of focus time',
      icon: '📚',
      type: 'focus',
      requirement: { type: 'minutes', value: 600 }
    },
    master: {
      id: 'master',
      title: 'Focus Master',
      description: 'Complete a 50-minute session without breaks',
      icon: '🎯',
      type: 'focus',
      requirement: { type: 'minutes', value: 50 }
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
      requirement: { type: 'affinity', value: 10 }
    },
    natsuki_friend: {
      id: 'natsuki_friend',
      title: 'Natsuki\'s Friend',
      description: 'Reach affinity level 10 with Natsuki',
      icon: '💝',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 }
    },
    yuri_friend: {
      id: 'yuri_friend',
      title: 'Yuri\'s Friend',
      description: 'Reach affinity level 10 with Yuri',
      icon: '💜',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 }
    },
    monika_friend: {
      id: 'monika_friend',
      title: 'Monika\'s Friend',
      description: 'Reach affinity level 10 with Monika',
      icon: '💚',
      type: 'companion',
      requirement: { type: 'affinity', value: 10 }
    }
  },

  // Goal-based achievements
  goals: {
    goal_setter: {
      id: 'goal_setter',
      title: 'Goal Setter',
      description: 'Create your first study goal',
      icon: '📝',
      type: 'goal',
      requirement: { type: 'goals', value: 1 }
    },
    achiever: {
      id: 'achiever',
      title: 'Achiever',
      description: 'Complete 5 study goals',
      icon: '🏆',
      type: 'goal',
      requirement: { type: 'goals', value: 5 }
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
      requirement: { type: 'minutes', value: 120 }
    },
    early_bird: {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Start a session before 7 AM',
      icon: '🌅',
      type: 'hidden',
      requirement: { type: 'minutes', value: 1 }
    }
  }
};

// Achievement unlock functions
export const unlockAchievement = async (
  uid: string,
  achievementId: string
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;
  
  // Check if achievement already exists
  const userData = userDoc.data() as UserDocument;
  const existingAchievements = userData.achievements || [];
  
  // Don't add if already unlocked
  if (existingAchievements.some(a => a.id === achievementId)) {
    return;
  }

  const achievement = {
    id: achievementId,
    unlockedAt: Timestamp.now()
  };

  await updateDoc(userRef, {
    achievements: arrayUnion(achievement)
  });
};

// Check for achievement completion based on different criteria
export const checkFocusAchievements = async (
  uid: string,
  totalMinutes: number,
  sessionMinutes: number
): Promise<void> => {
  if (sessionMinutes >= ACHIEVEMENTS.focus.master.requirement.value) {
    await unlockAchievement(uid, 'master');
  }
  if (totalMinutes >= ACHIEVEMENTS.focus.dedication.requirement.value) {
    await unlockAchievement(uid, 'dedication');
  }
};

export const checkCompanionAchievements = async (
  uid: string,
  companionId: string,
  affinityLevel: number
): Promise<void> => {
  const achievementId = `${companionId}_friend` as keyof typeof ACHIEVEMENTS.companion;
  if (affinityLevel >= ACHIEVEMENTS.companion[achievementId].requirement.value) {
    await unlockAchievement(uid, achievementId);
  }
};

export const checkGoalAchievements = async (
  uid: string,
  completedGoals: Goal[]
): Promise<void> => {
  if (completedGoals.length >= ACHIEVEMENTS.goals.achiever.requirement.value) {
    await unlockAchievement(uid, 'achiever');
  }
};

// Special time-based achievement checks
export const checkTimeBasedAchievements = async (
  uid: string,
  sessionStartTime: Date,
  sessionMinutes: number
): Promise<void> => {
  const hour = sessionStartTime.getHours();
  
  // Night Owl (must complete full 2 hours between midnight and 5 AM)
  if (hour >= 0 && hour < 5 && sessionMinutes >= 120) {
    await unlockAchievement(uid, 'night_owl');
  }
  
  // Early Bird (must complete at least 15 minutes before 7 AM)
  if (hour < 7 && sessionMinutes >= 15) {
    await unlockAchievement(uid, 'early_bird');
  }
};
