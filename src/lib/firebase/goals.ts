import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { UserDocument } from '@/lib/firebase/user';
import { checkAllAchievements } from '@/lib/firebase/achievements';
import { CompanionId } from '@/lib/firebase/companion';
import { updateCompanionAfterGoalComplete } from '@/lib/firebase/companion';
import { getCompanionDialogue } from '@/lib/firebase/dialogue';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetMinutes: number;
  currentMinutes: number;
  deadline: Timestamp;
  createdAt: Timestamp;
  completed: boolean;
  type: 'daily' | 'weekly' | 'challenge';
  companionId?: CompanionId; // Track which companion assigned this goal
  reward?: {
    type: 'background' | 'achievement' | 'affinity';
    value: string | number;
  };
}

export const createGoal = async (
  uid: string,
  goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed'>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const newGoal: Goal = {
    ...goal,
    id: `goal_${Date.now()}`,
    createdAt: Timestamp.now(),
    currentMinutes: 0,
    completed: false,
  };

  await updateDoc(userRef, {
    'goals.list': arrayUnion(newGoal)
  });
};

/**
 * Create a goal assigned by a companion
 */
export const createCompanionGoal = async (
  uid: string,
  companionId: CompanionId,
  goal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed' | 'companionId'>
): Promise<string> => {
  const userRef = doc(db, 'users', uid);
  const newGoal: Goal = {
    ...goal,
    id: `goal_${companionId}_${Date.now()}`,
    createdAt: Timestamp.now(),
    currentMinutes: 0,
    completed: false,
    companionId: companionId
  };

  await updateDoc(userRef, {
    'goals.list': arrayUnion(newGoal)
  });

  // Return the goal ID so it can be referenced later
  return newGoal.id;
};

export const updateGoalProgress = async (
  uid: string,
  goalId: string,
  minutes: number
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const goalsList = userData.goals?.list || [];
  
  // Update only the specific goal's progress
  const updatedGoals = goalsList.map(goal => 
    goal.id === goalId 
      ? { ...goal, currentMinutes: minutes }
      : goal
  );

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });
};

export const completeGoal = async (
  uid: string,
  goalId: string
): Promise<{message?: string}> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return {};

  const userData = userDoc.data() as UserDocument;
  const goal = userData.goals?.list.find(g => g.id === goalId);
  
  if (!goal) return {};

  let companionMessage: string | undefined;

  // Handle companion-specific logic if this was a companion goal
  if (goal.companionId) {
    // Update companion stats and affinity
    await updateCompanionAfterGoalComplete(uid, goal.companionId, true);
    
    // Get a special message from the companion
    const mood = userData.companions?.[goal.companionId]?.mood || 'happy';
    const affinity = userData.companions?.[goal.companionId]?.affinityLevel || 0;
    const consecutiveDays = userData.companions?.[goal.companionId]?.stats?.consecutiveDays || 0;
    
    companionMessage = getCompanionDialogue(
      goal.companionId,
      mood,
      affinity,
      consecutiveDays,
      { taskCompleted: true }
    );
  }

  if (goal?.reward) {
    // Handle rewards
    if (goal.reward.type === 'affinity' && goal.companionId) {
      // If a specific companion assigned this goal, give them the affinity
      const companionRef = doc(db, `users/${uid}/companions`, goal.companionId);
      await updateDoc(companionRef, {
        'affinityLevel': increment(goal.reward.value as number)
      });
    } else if (goal.reward.type === 'achievement') {
      await updateDoc(userRef, {
        'achievements': arrayUnion(goal.reward.value)
      });
    } else if (goal.reward.type === 'background') {
      await updateDoc(userRef, {
        'backgrounds': arrayUnion(goal.reward.value)
      });
    }
  }

  // Mark goal as completed
  const updatedGoals = userData.goals?.list.map(g => 
    g.id === goalId ? { ...g, completed: true } : g
  );

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });

  // Count challenge goals completed
  const challengeGoalsCompleted = (userData.goals?.list.filter(g => 
    g.completed && g.type === 'challenge'
  ).length || 0) + (goal.type === 'challenge' ? 1 : 0);

  // Check achievements after completing goal
  await checkAllAchievements(uid, {
    completedGoals: (userData.goals?.list.filter(g => g.completed).length || 0) + 1,
    totalFocusTime: userData.focusStats?.totalFocusTime || 0,
    weekStreak: userData.focusStats?.weekStreak || 0,
    longestStreak: userData.focusStats?.longestStreak || 0,
    totalSessions: userData.focusStats?.totalSessions || 0,
    challengeGoalsCompleted
  });

  return { message: companionMessage };
};

export const removeGoal = async (uid: string, goalId: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const updatedGoals = (userData.goals?.list || []).filter(goal => goal.id !== goalId);

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });
};

export const updateGoal = async (
  uid: string,
  goalId: string,
  updates: {
    title?: string;
    description?: string;
    targetMinutes?: number;
  }
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const goalsList = userData.goals?.list || [];
  
  // Find and update the goal
  const updatedGoals = goalsList.map(goal => 
    goal.id === goalId 
      ? { ...goal, ...updates }
      : goal
  );

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });
};

// Add goal refresh function
export const refreshGoals = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const now = Timestamp.now();
  const goalsList = userData.goals?.list || [];
  
  // Filter out expired goals and reset daily/weekly goals
  const updatedGoals = goalsList.map(goal => {
    // Skip if goal is completed or it's a challenge
    if (goal.completed || goal.type === 'challenge') return goal;

    // Check if goal has expired
    if (goal.deadline.toDate() < now.toDate()) {
      if (goal.type === 'daily') {
        // Reset daily goal for next day
        return {
          ...goal,
          currentMinutes: 0,
          deadline: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
        };
      } else if (goal.type === 'weekly') {
        // Reset weekly goal for next week
        return {
          ...goal,
          currentMinutes: 0,
          deadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        };
      }
    }
    return goal;
  });

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });
};

/**
 * Get goals assigned by a specific companion
 */
export const getCompanionGoals = async (
  uid: string,
  companionId: CompanionId
): Promise<Goal[]> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return [];

  const userData = userDoc.data() as UserDocument;
  return (userData.goals?.list || []).filter(goal => goal.companionId === companionId);
};

/**
 * Assign a random goal from a companion
 */
export const assignRandomCompanionGoal = async (
  uid: string,
  companionId: CompanionId
): Promise<{goalId: string, title: string}> => {
  // Get companion's available goals
  const companionGoals = COMPANION_GOALS[companionId];
  
  // Select a random goal
  const randomIndex = Math.floor(Math.random() * companionGoals.length);
  const selectedGoal = companionGoals[randomIndex];
  
  // Set deadline based on goal type
  let deadline: Date;
  if (selectedGoal.type === 'daily') {
    deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  } else if (selectedGoal.type === 'weekly') {
    deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  } else {
    deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days for challenges
  }
  
  // Create the goal
  const goalId = await createCompanionGoal(uid, companionId, {
    ...selectedGoal,
    deadline: Timestamp.fromDate(deadline)
  });
  
  return { goalId, title: selectedGoal.title };
};

// Predefined goals that companions can assign
export const COMPANION_GOALS: Record<CompanionId, Array<Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed' | 'deadline' | 'companionId'>>> = {
  sayori: [
    {
      title: "Morning Study Session",
      description: "Complete a 25-minute focus session before noon!",
      targetMinutes: 25,
      type: 'daily',
      reward: { type: 'affinity', value: 5 }
    },
    {
      title: "Positive Start",
      description: "Complete your first focus session within an hour of waking up",
      targetMinutes: 20,
      type: 'daily',
      reward: { type: 'affinity', value: 3 }
    },
    {
      title: "Friendship Study Circle",
      description: "Complete 3 focus sessions in one day - like studying with friends!",
      targetMinutes: 60,
      type: 'daily',
      reward: { type: 'achievement', value: 'study_circle' }
    },
    {
      title: "Breakfast Club Challenge",
      description: "Complete a full week of morning study sessions",
      targetMinutes: 120,
      type: 'weekly',
      reward: { type: 'background', value: 'sunrise_bg' }
    }
  ],
  natsuki: [
    {
      title: "Quick and Focused",
      description: "Complete 3 focus sessions in one day!",
      targetMinutes: 75,
      type: 'daily',
      reward: { type: 'affinity', value: 5 }
    },
    {
      title: "Baking Timer Challenge",
      description: "Complete a 25-minute session without any breaks - just like waiting for cupcakes to bake!",
      targetMinutes: 25,
      type: 'daily',
      reward: { type: 'affinity', value: 4 }
    },
    {
      title: "Manga Reading Marathon",
      description: "Complete a 2-hour study session with proper breaks",
      targetMinutes: 120,
      type: 'challenge',
      reward: { type: 'achievement', value: 'reading_marathon' }
    },
    {
      title: "Perfectionist's Challenge",
      description: "Complete 5 perfect focus sessions in a row without distractions",
      targetMinutes: 100,
      type: 'weekly',
      reward: { type: 'background', value: 'kitchen_bg' }
    }
  ],
  yuri: [
    {
      title: "Deep Focus Challenge",
      description: "Complete a 50-minute focus session without breaks",
      targetMinutes: 50,
      type: 'challenge',
      reward: { type: 'background', value: 'library_bg' }
    },
    {
      title: "Evening Reading",
      description: "Complete a focus session in the evening hours",
      targetMinutes: 40,
      type: 'daily',
      reward: { type: 'affinity', value: 5 }
    },
    {
      title: "Literary Analysis",
      description: "Complete a series of 3 long focus sessions in one day",
      targetMinutes: 120,
      type: 'daily',
      reward: { type: 'achievement', value: 'deep_thinker' }
    },
    {
      title: "Novel Completion",
      description: "Accumulate 5 hours of focus time in a week",
      targetMinutes: 300,
      type: 'weekly',
      reward: { type: 'background', value: 'bookstore_bg' }
    }
  ],
  monika: [
    {
      title: "Weekly Dedication",
      description: "Accumulate 3 hours of focus time this week",
      targetMinutes: 180,
      type: 'weekly',
      reward: { type: 'affinity', value: 10 }
    },
    {
      title: "Productivity Analysis",
      description: "Complete focus sessions at different times of day to analyze your productivity patterns",
      targetMinutes: 75,
      type: 'daily',
      reward: { type: 'affinity', value: 5 }
    },
    {
      title: "Perfect Week Challenge",
      description: "Complete at least one focus session every day for a week",
      targetMinutes: 175,
      type: 'weekly',
      reward: { type: 'achievement', value: 'perfect_attendance' }
    },
    {
      title: "Presidential Efficiency",
      description: "Complete 10 focused study sessions in a single week",
      targetMinutes: 250,
      type: 'weekly',
      reward: { type: 'background', value: 'classroom_bg' }
    }
  ]
};
