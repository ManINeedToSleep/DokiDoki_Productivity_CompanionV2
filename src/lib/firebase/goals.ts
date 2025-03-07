import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { UserDocument, incrementCompletedGoals } from '@/lib/firebase/user';
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
  type: 'daily' | 'weekly' | 'challenge' | 'custom';
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
    id: `user_${Date.now()}`,
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
  
  // Update only the specific goal's progress - INCREMENT minutes, don't set them
  const updatedGoals = goalsList.map(goal => {
    if (goal.id === goalId) {
      const newMinutes = goal.currentMinutes + minutes;
      console.log(`📊 Firebase: Updating goal progress for "${goal.title}": ${goal.currentMinutes} → ${newMinutes} minutes`);
      
      // Check if the goal is being completed with this update
      const nowCompleted = newMinutes >= goal.targetMinutes;
      
      return { 
        ...goal, 
        currentMinutes: newMinutes,
        completed: nowCompleted
      };
    }
    return goal;
  });

  await updateDoc(userRef, {
    'goals.list': updatedGoals
  });
  
  // Check if any goals were just completed with this update
  const justCompletedGoals = updatedGoals.filter(goal => 
    goal.currentMinutes >= goal.targetMinutes && 
    !goalsList.find(g => g.id === goal.id)?.completed
  );
  
  // If a goal was just completed, trigger the goal achievement check
  if (justCompletedGoals.length > 0) {
    console.log(`🏆 Goal(s) just completed, checking goal achievements...`);
    
    // Import and call the checkGoalAchievements function
    const { checkGoalAchievements } = await import('./achievements');
    
    // Get all completed goals for achievement check
    const allCompletedGoals = updatedGoals.filter(g => g.completed);
    const challengeGoals = updatedGoals.filter(g => g.type === 'challenge' && g.completed);
    
    // Check for goal-related achievements
    await checkGoalAchievements(uid, allCompletedGoals, challengeGoals);

    // Increment the completedGoals counter for each completed goal
    for (const goal of justCompletedGoals) {
      await incrementCompletedGoals(uid, goal.type === 'challenge');
    }
  }
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
  
  // If goal is already completed, don't process it again
  if (goal.completed) return {};

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

  // Increment the completedGoals counter
  await incrementCompletedGoals(uid, goal.type === 'challenge');

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
  
  // Track if we need to assign new goals
  let needNewDailyGoal = true;
  let needNewWeeklyGoal = true;
  let needNewCompanionGoal = true;
  let needNewChallengeGoal = true;
  const companionId = userData.settings?.selectedCompanion || 'sayori';
  
  // Count expired goals to calculate task completion rate accurately
  let expiredGoalsCount = 0;
  
  // Filter out expired goals and reset daily/weekly goals
  const updatedGoals = goalsList.filter(goal => {
    // Keep completed goals
    if (goal.completed) return true;
    
    // Check if goal has expired
    if (goal.deadline.toDate() < now.toDate()) {
      console.log(`🎯 Firebase: Goal expired: "${goal.title}"`);
      expiredGoalsCount++;
      // Don't keep expired goals
      return false;
    }
    
    // Check goal type for generating new goals
    if (goal.type === 'daily') {
      needNewDailyGoal = false;
    } else if (goal.type === 'weekly') {
      needNewWeeklyGoal = false;
    } else if (goal.type === 'challenge') {
      if (goal.companionId) {
        needNewCompanionGoal = false;
      } else {
        needNewChallengeGoal = false;
      }
    }
    
    return true;
  });

  // Assign new daily goal if needed
  if (needNewDailyGoal) {
    const dailyGoals = COMPANION_GOALS[companionId].filter(g => g.type === 'daily');
    if (dailyGoals.length > 0) {
      const randomIndex = Math.floor(Math.random() * dailyGoals.length);
      const selectedGoal = dailyGoals[randomIndex];
      
      // Set deadline to end of today
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const newGoal: Goal = {
        ...selectedGoal,
        id: `daily_${Date.now()}`,
        createdAt: Timestamp.now(),
        currentMinutes: 0,
        completed: false,
        deadline: Timestamp.fromDate(today),
        companionId: companionId
      };
      
      updatedGoals.push(newGoal);
    }
  }
  
  // Assign new weekly goal if needed
  if (needNewWeeklyGoal) {
    const weeklyGoals = COMPANION_GOALS[companionId].filter(g => g.type === 'weekly');
    if (weeklyGoals.length > 0) {
      const randomIndex = Math.floor(Math.random() * weeklyGoals.length);
      const selectedGoal = weeklyGoals[randomIndex];
      
      // Set deadline to end of this week (Sunday)
      const endOfWeek = new Date();
      const daysUntilSunday = 7 - endOfWeek.getDay();
      endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const newGoal: Goal = {
        ...selectedGoal,
        id: `weekly_${Date.now()}`,
        createdAt: Timestamp.now(),
        currentMinutes: 0,
        completed: false,
        deadline: Timestamp.fromDate(endOfWeek),
        companionId: companionId
      };
      
      updatedGoals.push(newGoal);
    }
  }
  
  // Assign new regular challenge goal if needed
  if (needNewChallengeGoal) {
    // Get challenge goals from all companions to have more variety
    const allChallengeGoals: Array<Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed' | 'deadline' | 'companionId'>> = [];
    
    Object.values(COMPANION_GOALS).forEach(goals => {
      const challenges = goals.filter(g => g.type === 'challenge');
      allChallengeGoals.push(...challenges);
    });
    
    if (allChallengeGoals.length > 0) {
      const randomIndex = Math.floor(Math.random() * allChallengeGoals.length);
      const selectedGoal = allChallengeGoals[randomIndex];
      
      // Set deadline to 3 weeks from now for regular challenges
      const threeWeeks = new Date();
      threeWeeks.setDate(threeWeeks.getDate() + 21);
      
      const newGoal: Goal = {
        ...selectedGoal,
        id: `challenge_${Date.now()}`,
        createdAt: Timestamp.now(),
        currentMinutes: 0,
        completed: false,
        deadline: Timestamp.fromDate(threeWeeks),
        // No companionId for regular challenges
      };
      
      updatedGoals.push(newGoal);
    }
  }
  
  // Assign new companion challenge goal if needed
  if (needNewCompanionGoal) {
    const challengeGoals = COMPANION_GOALS[companionId].filter(g => g.type === 'challenge');
    if (challengeGoals.length > 0) {
      const randomIndex = Math.floor(Math.random() * challengeGoals.length);
      const selectedGoal = challengeGoals[randomIndex];
      
      // Set deadline to 2 weeks from now
      const twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      
      const newGoal: Goal = {
        ...selectedGoal,
        id: `challenge_${companionId}_${Date.now()}`,
        createdAt: Timestamp.now(),
        currentMinutes: 0,
        completed: false,
        deadline: Timestamp.fromDate(twoWeeks),
        companionId: companionId
      };
      
      updatedGoals.push(newGoal);
    }
  }

  // Calculate the task completion rate 
  // (number of completed goals divided by total completed + expired goals)
  const completedGoals = userData.goals?.completedGoals || 0;
  const failedGoals = expiredGoalsCount;
  const totalGoalsAttempted = completedGoals + failedGoals;
  const taskCompletionRate = totalGoalsAttempted > 0 
    ? Math.round((completedGoals / totalGoalsAttempted) * 100) 
    : 100; // Default to 100% if no attempts
  
  console.log(`🎯 Firebase: Task completion rate - Completed: ${completedGoals}, Failed: ${failedGoals}, Rate: ${taskCompletionRate}%`);
  
  // Update goals list and task completion rate
  await updateDoc(userRef, {
    'goals.list': updatedGoals,
    'goals.lastUpdated': now,
    'focusStats.taskCompletionRate': taskCompletionRate
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
  
  // Filter to only get challenge goals or select a random goal and force it to be a challenge
  const challengeGoals = companionGoals.filter(goal => goal.type === 'challenge');
  const availableGoals = challengeGoals.length > 0 ? challengeGoals : companionGoals;
  
  // Select a random goal
  const randomIndex = Math.floor(Math.random() * availableGoals.length);
  const selectedGoal = availableGoals[randomIndex];
  
  // Set deadline to 2 weeks from now for companion challenges
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
  
  // Create the goal, ensuring it's a challenge type
  const goalId = await createCompanionGoal(uid, companionId, {
    ...selectedGoal,
    type: 'challenge', // Force it to be a challenge type
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
