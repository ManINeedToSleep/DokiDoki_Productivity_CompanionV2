import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { UserDocument } from '@/lib/firebase/user';

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
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const currentGoals = userData.goals?.list || [];

  const newGoal: Goal = {
    ...goal,
    id: `goal_${Date.now()}`,
    createdAt: Timestamp.now(),
    currentMinutes: 0,
    completed: false,
  };

  // Initialize goals object if it doesn't exist
  if (!userData.goals) {
    await updateDoc(userRef, {
      goals: {
        list: [newGoal],
        dailyGoal: 25,
        lastUpdated: Timestamp.now()
      }
    });
    return;
  }

  await updateDoc(userRef, {
    'goals.list': [...currentGoals, newGoal]
  });
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
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserDocument;
  const goal = userData.goals?.list.find(g => g.id === goalId);

  if (goal?.reward) {
    // Handle rewards
    if (goal.reward.type === 'affinity') {
      await updateDoc(userRef, {
        'companion.affinity': increment(goal.reward.value as number)
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
  
  // Ensure goalsList is an array before mapping
  if (!Array.isArray(goalsList)) return;

  // Filter out expired goals and reset daily/weekly goals
  const updatedGoals = goalsList.map(goal => {
    // Skip if goal is completed or it's a challenge
    if (goal.completed || goal.type === 'challenge') return goal;

    // Check if goal has expired
    if (goal.deadline.toDate() < now.toDate()) {
      if (goal.type === 'daily') {
        return {
          ...goal,
          currentMinutes: 0,
          deadline: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
        };
      } else if (goal.type === 'weekly') {
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

// Predefined goals that companions can assign
export const COMPANION_GOALS = {
  sayori: [
    {
      title: "Morning Study Session",
      description: "Complete a 25-minute focus session before noon!",
      targetMinutes: 25,
      type: 'daily' as const,
      reward: { type: 'affinity' as const, value: 5 }
    },
    // Add more Sayori-specific goals
  ],
  natsuki: [
    {
      title: "Quick and Focused",
      description: "Complete 3 focus sessions in one day!",
      targetMinutes: 75,
      type: 'daily' as const,
      reward: { type: 'achievement' as const, value: 'efficient_student' }
    },
    // Add more Natsuki-specific goals
  ],
  yuri: [
    {
      title: "Deep Focus Challenge",
      description: "Complete a 50-minute focus session without breaks",
      targetMinutes: 50,
      type: 'challenge' as const,
      reward: { type: 'background' as const, value: 'library_bg' }
    },
    // Add more Yuri-specific goals
  ],
  monika: [
    {
      title: "Weekly Dedication",
      description: "Accumulate 3 hours of focus time this week",
      targetMinutes: 180,
      type: 'weekly' as const,
      reward: { type: 'affinity' as const, value: 10 }
    },
    // Add more Monika-specific goals
  ]
};
