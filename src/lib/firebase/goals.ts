import { db, Timestamp } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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

export const updateGoalProgress = async (
  uid: string,
  goalId: string,
  minutes: number
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  // Note: This is a simplified version. In reality, you'd need to
  // find the goal in the array and update its specific minutes
  await updateDoc(userRef, {
    [`goals.list.${goalId}.currentMinutes`]: minutes
  });
};

export const completeGoal = async (
  uid: string,
  goalId: string
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    [`goals.list.${goalId}.completed`]: true
  });
};

export const removeGoal = async (
  uid: string,
  goal: Goal
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'goals.list': arrayRemove(goal)
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
