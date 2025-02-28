"use client";

import { useState, useEffect } from "react";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import Button from "@/components/Common/Button/Button";
import type { UserDocument } from "@/lib/firebase/user";
import { COMPANION_GOALS, createGoal, refreshGoals, removeGoal } from "@/lib/firebase/goals";
import { useUserData } from "@/hooks/useUserData";
import { Timestamp } from '@/lib/firebase';
import DailyGoals from "@/components/Goals/GoalTypes/DailyGoals";
import WeeklyGoals from "@/components/Goals/GoalTypes/WeeklyGoals";
import CompanionGoals from "@/components/Goals/GoalTypes/CompanionGoals";
import CustomGoals from "@/components/Goals/GoalTypes/CustomGoals";
import AddGoalModal from "@/components/Goals/GoalEdits/AddGoalModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GoalsProps {
  userData: UserDocument | null;
  variant?: 'dashboard' | 'full';
  allowEditing?: boolean;
}

export default function Goals({ userData, variant = 'dashboard', allowEditing = false }: GoalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshUserData } = useUserData();
  const [openSections, setOpenSections] = useState({
    daily: true,
    weekly: true,
    companion: true,
    custom: true
  });

  const handleCreateGoal = async (goal: { 
    title: string; 
    description: string;
    targetMinutes: number;
    type: 'daily' | 'weekly' | 'challenge';
  }) => {
    if (!userData?.base?.uid) return;

    try {
      // Initialize goals.list if it doesn't exist
      if (!userData.goals?.list) {
        await updateDoc(doc(db, 'users', userData.base.uid), {
          'goals.list': []
        });
      }

      await createGoal(userData.base.uid, {
        ...goal,
        deadline: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      });
      
      setIsModalOpen(false);
      await refreshUserData();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!userData?.base?.uid) return;
    try {
      await removeGoal(userData.base.uid, goalId);
      await refreshUserData();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  useEffect(() => {
    if (!userData?.base?.uid) return;

    const refreshUserGoals = async () => {
      try {
        await refreshGoals(userData.base.uid);
        await refreshUserData();
      } catch (error) {
        console.error('Error refreshing goals:', error);
      }
    };

    refreshUserGoals();
    const interval = setInterval(refreshUserGoals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userData?.base?.uid, refreshUserData]);

  if (!userData) return null;

  const companion = userData.settings?.selectedCompanion || 'sayori';
  const systemGoals = COMPANION_GOALS[companion] || [];

  // Transform goals to match Goal interface
  const transformedGoals = [
    // Daily Focus Goal (System)
    {
      id: 'daily_focus',
      title: "Daily Focus Goal",
      description: "Complete your daily focus time target",
      currentMinutes: Math.floor((userData.focusStats?.todaysFocusTime || 0) / 60),
      targetMinutes: userData.goals?.dailyGoal || 25,
      type: 'daily' as const,
      deadline: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.now(),
      completed: false,
      isSystemGoal: true,
    },
    // Weekly Focus Goal (System)
    {
      id: 'weekly_focus',
      title: "Weekly Focus Goal",
      description: "Complete 5 hours of focused work this week",
      currentMinutes: Math.floor((userData.focusStats?.weeklyFocusTime || 0) / 60),
      targetMinutes: 300,
      type: 'weekly' as const,
      deadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.now(),
      completed: false,
      isSystemGoal: true,
    },
    // Companion Goals
    ...(systemGoals?.map((goal) => ({
      id: `companion_${goal.title}`,
      title: goal.title,
      description: goal.description,
      currentMinutes: Math.floor((userData.focusStats?.todaysFocusTime || 0) / 60),
      targetMinutes: goal.targetMinutes,
      type: goal.type,
      deadline: Timestamp.fromDate(new Date(Date.now() + (goal.type === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000)),
      createdAt: Timestamp.now(),
      completed: false,
      isSystemGoal: true,
    })) || []),
    // User's custom goals
    ...((Array.isArray(userData.goals?.list) ? userData.goals.list : []).map(goal => ({
      ...goal,
      isSystemGoal: false,
    })))
  ];

  // Separate goals by type - update these filters
  const dailyGoals = transformedGoals.filter(goal => 
    goal.type === 'daily' && 
    goal.isSystemGoal && 
    !goal.id.startsWith('companion_')
  );
  
  const weeklyGoals = transformedGoals.filter(goal => 
    goal.type === 'weekly' && 
    goal.isSystemGoal && 
    !goal.id.startsWith('companion_')
  );
  
  const companionGoals = transformedGoals.filter(goal => 
    goal.id.startsWith('companion_')
  );
  
  const customGoals = transformedGoals.filter(goal => 
    !goal.isSystemGoal && 
    !goal.id.startsWith('companion_')
  );

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-[Riffic] text-pink-700">Goals</h2>
        {allowEditing && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            label="Add Custom Goal"
          />
        )}
      </div>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-none">
        <DailyGoals
          goals={dailyGoals}
          isOpen={openSections.daily}
          onToggle={() => setOpenSections(prev => ({ ...prev, daily: !prev.daily }))}
          allowEditing={false}
        />

        <WeeklyGoals
          goals={weeklyGoals}
          isOpen={openSections.weekly}
          onToggle={() => setOpenSections(prev => ({ ...prev, weekly: !prev.weekly }))}
          allowEditing={false}
        />

        <CompanionGoals
          goals={companionGoals}
          isOpen={openSections.companion}
          onToggle={() => setOpenSections(prev => ({ ...prev, companion: !prev.companion }))}
        />

        {variant === 'full' && (
          <CustomGoals
            goals={customGoals}
            isOpen={openSections.custom}
            onToggle={() => setOpenSections(prev => ({ ...prev, custom: !prev.custom }))}
            onDelete={handleDeleteGoal}
            allowEditing={true}
          />
        )}
      </div>

      {allowEditing && (
        <AddGoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateGoal}
        />
      )}
    </DashboardCard>
  );
}
