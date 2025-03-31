"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';

import { motion } from 'framer-motion';
import { Goal, createGoal } from '@/lib/firebase/goals';
import Button from '@/components/Common/Button/Button';
import { useGoalsStore } from '@/lib/stores/goalsStore';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import { Timestamp } from 'firebase/firestore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { ACHIEVEMENTS, Achievement } from '@/lib/firebase/achievements';
import { refreshGoals, assignRandomCompanionGoal, updateGoal as updateGoalFirebase, removeGoal as removeGoalFirebase } from '@/lib/firebase/goals';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { GoalForm, GoalSection, isSystemGoal, isUserCreatedGoal, getTomorrowDateString, getDeadlineDate } from '@/components/Goals';
import { useGoalNotifications, useAchievementNotifications } from '@/components/Common/Notifications';

export default function GoalsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Flag to prevent multiple simultaneous default goal setups
  const isSettingUpDefaultGoals = useRef(false);
  
  // Get goals store
  const { 
    markComplete, 
    syncWithFirebase,
    refreshAllGoals,
    addGoal
  } = useGoalsStore();
  
  // Get achievements store
  const {
    achievements,
    setAchievements,
    syncWithFirebase: syncAchievements
  } = useAchievementsStore();
  
  // Add state for goal refreshing
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get notification hooks
  const { 
    showGoalAdded, 
    showGoalUpdated, 
    showGoalCompleted 
  } = useGoalNotifications();
  
  const { showAchievement } = useAchievementNotifications();
  
  // First, add a state for the collapsible Completed Goals section
  const [completedGoalsCollapsed, setCompletedGoalsCollapsed] = useState(false);
  
  // Move this function before the useEffect that uses it
  // Function to show goal notification using the notification hook
  const showGoalNotification = useCallback((type: 'daily' | 'weekly' | 'challenge' | 'custom', title: string, action: 'added' | 'updated' | 'completed' = 'added') => {
    // Create a goal object with the notification data
    const notificationGoal: Goal = {
      id: `notification_${Date.now()}`,
      title,
      description: type === 'challenge' ? 
        'This is a special challenge from your companion!' : 
        type === 'daily' ? 
        'Complete daily goals to build consistency' : 
        type === 'weekly' ? 
        'Weekly goals help you achieve longer-term objectives' : 
        'Custom goals help you track personal objectives',
      targetMinutes: 0,
      currentMinutes: 0,
      deadline: Timestamp.now(),
      createdAt: Timestamp.now(),
      completed: false,
      type
    };
    
    const companionId = userData?.settings?.selectedCompanion || undefined;
    
    // Determine which notification to show based on action
    if (action === 'added') {
      showGoalAdded(notificationGoal);
    } else if (action === 'updated') {
      showGoalUpdated(notificationGoal);
    } else if (action === 'completed') {
      showGoalCompleted(notificationGoal, companionId);
    }
  }, [userData, showGoalAdded, showGoalUpdated, showGoalCompleted]);
  
  // Load goal achievements if not already loaded
  useEffect(() => {
    // If achievements aren't loaded yet, use the predefined ones
    if (!achievements || achievements.length === 0) {
      try {
        // Extract goal achievements from the ACHIEVEMENTS object
        const goalAchievements: Achievement[] = [];
        
        // Check if goals property exists and is an object
        if (ACHIEVEMENTS.goals && typeof ACHIEVEMENTS.goals === 'object') {
          // Convert each achievement to the Achievement type and add to array
          Object.values(ACHIEVEMENTS.goals).forEach(achievement => {
            if (achievement && typeof achievement === 'object' && 'id' in achievement) {
              goalAchievements.push(achievement as Achievement);
            }
          });
        }
        
        if (goalAchievements.length > 0) {
          console.log('Setting goal achievements:', goalAchievements);
          setAchievements(goalAchievements);
        } else {
          console.log('No goal achievements found in ACHIEVEMENTS');
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    } else {
      console.log('Achievements already loaded:', achievements.length);
      console.log('Goal achievements:', achievements.filter(a => a.type === 'goal').length);
    }
  }, [achievements, setAchievements]);
  
  // Sync achievements with Firebase when user is available
  useEffect(() => {
    if (user) {
      syncAchievements(user.uid);
    }
  }, [user, syncAchievements]);
  
  // Wrap handleRefreshGoals in useCallback
  const handleRefreshGoals = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      await refreshGoals(user.uid);
      const data = await getUserDocument(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error refreshing goals:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, setUserData, setIsRefreshing]);
  
  // Move fetchUserData useCallback to the top level
  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    // Move setupDefaultGoals inside the useCallback
    const setupDefaultGoals = async (userId: string): Promise<boolean> => {
      // If already setting up default goals, return early
      if (isSettingUpDefaultGoals.current) {
        console.log('Default goals setup already in progress, skipping duplicate call');
        return false;
      }
      
      try {
        isSettingUpDefaultGoals.current = true;
        console.log('Setting up default goals for user:', userId);
        // First refresh all goals to clear any expired ones
        await refreshAllGoals(userId);
        
        // Get current user data to check existing goals
        const currentData = await getUserDocument(userId);
        
        // Check if the first session goal already exists (completed or not)
        const hasFirstSessionGoal = currentData?.goals?.list?.some(goal => 
          goal.title === "Complete Your First Focus Session" || 
          (goal.description?.includes("first focus session") && goal.type === 'custom')
        );
        
        // Only add the default goal if it doesn't exist yet
        if (!hasFirstSessionGoal) {
          console.log('Adding first focus session goal');
          // Add a default "Get Started" goal
          await addGoal(userId, {
            title: "Complete Your First Focus Session",
            description: "Try the timer feature to complete a focus session",
            targetMinutes: 25,
            deadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
            type: 'custom'
          });
        } else {
          console.log('First focus session goal already exists, skipping creation');
        }
        
        console.log('Default goals created successfully');
        return true;
      } catch (error) {
        console.error('Error creating default goals:', error);
        return false;
      } finally {
        isSettingUpDefaultGoals.current = false;
      }
    };
    
    setIsLoadingData(true);
    try {
      const data = await getUserDocument(user.uid);
      setUserData(data);
      
      // Check if user has goals and create default ones if needed
      const hasGoals = data?.goals?.list && data.goals.list.length > 0;
      
      if (!hasGoals) {
        console.log('No goals found for user, ensuring default goals...');
        const created = await setupDefaultGoals(user.uid);
        if (created) {
          console.log('Default goals created successfully');
          // Fetch updated user data after creating goals
          const updatedData = await getUserDocument(user.uid);
          setUserData(updatedData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, refreshAllGoals, addGoal, setUserData]);
  
  // Move useEffect to the top level
  useEffect(() => {
    // This will run on component mount
    if (user) {
      fetchUserData();
      // Sync goals with Firebase
      syncWithFirebase(user.uid);
      // Sync achievements with Firebase
      syncAchievements(user.uid);
    } else if (!isLoading) {
      router.push('/auth');
    }
  }, [user, isLoading, router, syncWithFirebase, syncAchievements, fetchUserData]);
  
  // Check for new goals on component mount
  useEffect(() => {
    if (user && userData) {
      const now = new Date();
      const lastUpdated = userData.goals?.lastUpdated?.toDate() || new Date(0);
      const hasExpiredGoals = userData.goals?.list?.some(goal => 
        !goal.completed && getDeadlineDate(goal.deadline) < now
      );
      
      // If goals haven't been updated today or there are expired goals, refresh them
      const isNewDay = lastUpdated.getDate() !== now.getDate() || 
                       lastUpdated.getMonth() !== now.getMonth() || 
                       lastUpdated.getFullYear() !== now.getFullYear();
      
      if (isNewDay || hasExpiredGoals) {
        // Store the current goals count for comparison after refresh
        const currentDailyGoals = userData.goals?.list?.filter(goal => 
          goal.type === 'daily' && !goal.completed && getDeadlineDate(goal.deadline) > now
        ).length || 0;
        
        const currentWeeklyGoals = userData.goals?.list?.filter(goal => 
          goal.type === 'weekly' && !goal.completed && getDeadlineDate(goal.deadline) > now
        ).length || 0;
        
        const currentChallengeGoals = userData.goals?.list?.filter(goal => 
          goal.type === 'challenge' && !goal.completed && getDeadlineDate(goal.deadline) > now && !goal.companionId
        ).length || 0;
        
        const currentExpiredGoals = userData.goals?.list?.filter(goal => 
          !goal.completed && getDeadlineDate(goal.deadline) <= now
        ).length || 0;
        
        handleRefreshGoals().then(() => {
          // Get updated user data after refresh
          getUserDocument(user.uid).then(updatedData => {
            if (!updatedData) return;
            
            const newNow = new Date();
            
            // Count new goals after refresh
            const newDailyGoals = updatedData.goals?.list?.filter(goal => 
              goal.type === 'daily' && !goal.completed && getDeadlineDate(goal.deadline) > newNow
            ).length || 0;
            
            const newWeeklyGoals = updatedData.goals?.list?.filter(goal => 
              goal.type === 'weekly' && !goal.completed && getDeadlineDate(goal.deadline) > newNow
            ).length || 0;
            
            const newChallengeGoals = updatedData.goals?.list?.filter(goal => 
              goal.type === 'challenge' && !goal.completed && getDeadlineDate(goal.deadline) > newNow && !goal.companionId
            ).length || 0;
            
            const removedExpiredGoals = currentExpiredGoals;
            
            // Create a detailed notification message
            let notificationTitle = '';
            
            if (isNewDay) {
              notificationTitle = "Daily goals refreshed!";
            } else if (hasExpiredGoals) {
              notificationTitle = "Expired goals cleared!";
            }
            
            // Create summary of changes
            const changes = [];
            if (newDailyGoals > currentDailyGoals) {
              changes.push(`${newDailyGoals - currentDailyGoals} new daily goal(s)`);
            }
            if (newWeeklyGoals > currentWeeklyGoals) {
              changes.push(`${newWeeklyGoals - currentWeeklyGoals} new weekly goal(s)`);
            }
            if (newChallengeGoals > currentChallengeGoals) {
              changes.push(`${newChallengeGoals - currentChallengeGoals} new challenge goal(s)`);
            }
            if (removedExpiredGoals > 0) {
              changes.push(`${removedExpiredGoals} expired goal(s) removed`);
            }
            
            // Add summary to notification
            if (changes.length > 0) {
              notificationTitle += " " + changes.join(', ');
            }
            
            // Show notification about new goals using the hook
            showGoalNotification('daily', notificationTitle.trim(), 'added');
          });
        });
      }
    }
  }, [user, userData, handleRefreshGoals, showGoalNotification]);
  
  // Update the handleRequestCompanionGoal function to show the correct notification
  const handleRequestCompanionGoal = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
      
      // Check if the user already has an active challenge from this companion
      const hasUnfinishedCompanionGoal = userData?.goals?.list?.some(goal => 
        goal.companionId === selectedCompanion && 
        goal.type === 'challenge' && 
        !goal.completed && 
        getDeadlineDate(goal.deadline) > new Date()
      );
      
      if (hasUnfinishedCompanionGoal) {
        // Show notification that user already has an active challenge
        showGoalNotification(
          'challenge', 
          `You already have an active challenge from ${selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)}. Complete it first!`, 
          'updated'
        );
        setIsRefreshing(false);
        return;
      }
      
      // If no active challenge, proceed with assigning a new one
      const result = await assignRandomCompanionGoal(user.uid, selectedCompanion);
      
      // Show notification about new companion goal using the hook
      showGoalNotification(
        'challenge', 
        `${selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)} assigned you a new challenge: ${result.title}`, 
        'added'
      );
      
      // Fetch updated user data
      const data = await getUserDocument(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error requesting companion goal:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading your goals...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Get active goals (not completed and not expired)
  const activeGoals = userData?.goals?.list?.filter(goal => 
    !goal.completed && getDeadlineDate(goal.deadline) > new Date()
  ) || [];
  
  // Get completed goals
  const completedGoals = userData?.goals?.list?.filter(goal => 
    goal.completed
  ) || [];
  
  // Get expired goals (not completed and expired)
  const expiredGoals = userData?.goals?.list?.filter(goal => 
    !goal.completed && getDeadlineDate(goal.deadline) <= new Date()
  ) || [];
  
  // Sort by deadline (closest first)
  activeGoals.sort((a, b) => 
    getDeadlineDate(a.deadline).getTime() - getDeadlineDate(b.deadline).getTime()
  );
  
  // Sort by completion date (most recent first)
  completedGoals.sort((a, b) => 
    getDeadlineDate(b.deadline).getTime() - getDeadlineDate(a.deadline).getTime()
  );
  
  // Update the handleAddGoal function to ensure goals appear immediately and handle errors properly
  const handleAddGoal = async (title: string, description: string, targetMinutes: number, deadline?: string) => {
    if (!user) return;
    
    // Validate deadline
    let deadlineDate;
    try {
      deadlineDate = new Date(deadline || getTomorrowDateString());
      
      if (isNaN(deadlineDate.getTime())) {
        throw new Error("Invalid deadline date");
      }
    } catch (dateError) {
      console.error("Error parsing deadline date:", dateError);
      throw new Error("Invalid deadline date format. Please select a valid date.");
    }
    
    // Ensure deadline is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      throw new Error("Deadline cannot be in the past. Please select a future date.");
    }
    
    const newGoal: Omit<Goal, 'id' | 'createdAt' | 'currentMinutes' | 'completed'> = {
      title,
      description,
      targetMinutes,
      deadline: Timestamp.fromDate(deadlineDate),
      type: 'custom',
    };
    
    // Use createGoal directly from firebase/goals
    await createGoal(user.uid, newGoal);
    
    // Wait a moment before fetching updated data
    setTimeout(async () => {
      try {
        // Fetch user data again to refresh the goals list
        await fetchUserData();
      } catch (error) {
        console.error("Error refreshing data after goal creation:", error);
      }
    }, 500);
    
    // Hide the form
    setShowAddForm(false);
  };
  
  const handleUpdateGoal = async (title: string, description: string, targetMinutes: number) => {
    if (!user || !editingGoal) return;
    
    const updates = {
      title,
      description,
      targetMinutes
    };
    
    // Update directly in Firebase
    await updateGoalFirebase(user.uid, editingGoal.id, updates);
    
    // Fetch user data again to refresh the goals list
    await fetchUserData();
    
    // Reset form
    setEditingGoal(null);
  };
  
  const handleEditClick = (goal: Goal) => {
    // Only allow editing user-created goals
    if (isSystemGoal(goal)) return;
    
    setEditingGoal(goal);
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      // Delete directly in Firebase
      await removeGoalFirebase(user.uid, goalId);
      
      // Fetch user data again to refresh the goals list
      await fetchUserData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("There was an error deleting your goal. Please try again.");
    }
  };
  
  const handleCompleteGoal = (goalId: string) => {
    if (!user) return;
    
    // Find the goal to display in notification
    const goal = userData?.goals?.list.find(g => g.id === goalId);
    if (goal) {
      // Get companion ID safely
      const companionId = userData?.settings?.selectedCompanion || undefined;
      
      // Show goal completion notification using the hook
      showGoalCompleted(goal, companionId);
    }
    
    // Mark goal as complete in store
    markComplete(user.uid, goalId);
    
    // Check for achievements
    if (userData?.goals?.list) {
      const completedGoals = [...userData.goals.list.filter(g => g.completed), goal].filter(Boolean) as Goal[];
      const challengeGoals = completedGoals.filter(g => g.type === 'challenge');
      
      // Check if this completion unlocks any achievements
      const totalCompleted = completedGoals.length;
      
      // Check specific achievement thresholds
      if (totalCompleted === 1) {
        // First goal completed
        const firstGoalAchievement = achievements.find(a => a.id === 'your_first_goal');
        if (firstGoalAchievement) {
          showAchievement(firstGoalAchievement);
        }
      } else if (totalCompleted >= ACHIEVEMENTS.goals.achiever.requirement.value) {
        // Achiever (10 goals)
        const achieverAchievement = achievements.find(a => a.id === 'achiever');
        if (achieverAchievement && !achieverAchievement.unlockedAt) {
          showAchievement(achieverAchievement);
        }
      } else if (totalCompleted >= ACHIEVEMENTS.goals.overachiever.requirement.value) {
        // Overachiever (25 goals)
        const overachieverAchievement = achievements.find(a => a.id === 'overachiever');
        if (overachieverAchievement && !overachieverAchievement.unlockedAt) {
          showAchievement(overachieverAchievement);
        }
      }
      
      // Check for challenge goals
      if (goal?.type === 'challenge') {
        const challengeCount = challengeGoals.length;
        if (challengeCount >= ACHIEVEMENTS.goals.challenge_master.requirement.value) {
          const challengeMasterAchievement = achievements.find(a => a.id === 'challenge_master');
          if (challengeMasterAchievement && !challengeMasterAchievement.unlockedAt) {
            showAchievement(challengeMasterAchievement);
          }
        }
      }
    }
  };
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      
      <main className="container mx-auto px-4 py-6 max-h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.text }}
        >
          Your Goals
        </motion.h1>
        
        <div className="mb-6 sticky top-0 z-10 bg-opacity-90 backdrop-blur-sm py-2">
          {!showAddForm && !editingGoal ? (
            <div className="flex flex-wrap gap-2">
              <Button
                label="Add New Goal"
                onClick={() => setShowAddForm(true)}
                companionId={selectedCompanion}
                className="flex items-center gap-2"
              />
              
              <Button
                label={isRefreshing ? 'Refreshing...' : 'Refresh Goals'}
                onClick={handleRefreshGoals}
                companionId={selectedCompanion}
                className="flex items-center gap-2 bg-opacity-80"
                disabled={isRefreshing}
              />
            </div>
          ) : null}
          
          {showAddForm && (
            <GoalForm
              onSubmit={handleAddGoal}
              onCancel={() => setShowAddForm(false)}
              companionId={selectedCompanion}
              colors={colors}
            />
          )}
          
          {editingGoal && (
            <GoalForm
              onSubmit={handleUpdateGoal}
              onCancel={() => setEditingGoal(null)}
              companionId={selectedCompanion}
              colors={colors}
              editingGoal={editingGoal}
              isEdit={true}
            />
          )}
        </div>
        
        {/* Daily Goals Section */}
        <GoalSection
          title="Daily Goals"
          goals={activeGoals.filter(goal => goal.type === 'daily')}
          emptyMessage="No active daily goals. Add a new daily goal to get started!"
          colors={colors}
          onComplete={handleCompleteGoal}
          onEdit={handleEditClick}
          onDelete={handleDeleteGoal}
        />
        
        {/* Weekly Goals Section */}
        <GoalSection
          title="Weekly Goals"
          goals={activeGoals.filter(goal => goal.type === 'weekly')}
          emptyMessage="No active weekly goals. Add a new weekly goal to get started!"
          colors={colors}
          onComplete={handleCompleteGoal}
          onEdit={handleEditClick}
          onDelete={handleDeleteGoal}
        />
        
        {/* Challenge Goals Section */}
        <GoalSection
          title="Challenge Goals"
          goals={activeGoals.filter(goal => goal.type === 'challenge' && !goal.companionId && !isUserCreatedGoal(goal))}
          emptyMessage="No active challenge goals. System will assign challenging goals to push your limits!"
          colors={colors}
          onComplete={handleCompleteGoal}
        />
        
        {/* Custom Goals Section */}
        <GoalSection
          title="Your Custom Goals"
          goals={activeGoals.filter(goal => isUserCreatedGoal(goal))}
          emptyMessage='No custom goals yet. Click "Add New Goal" to create your own personalized goals!'
          colors={colors}
          onComplete={handleCompleteGoal}
          onEdit={handleEditClick}
          onDelete={handleDeleteGoal}
        />
        
        {/* Companion Goals Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-[Riffic]" style={{ color: colors.heading }}>
              {selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)}&apos;s Goals for You
            </h2>
            
            <Button
              label={isRefreshing ? 'Requesting...' : 'Request Goal'}
              onClick={handleRequestCompanionGoal}
              companionId={selectedCompanion}
              className="text-sm"
              disabled={isRefreshing}
            />
          </div>
          
          <GoalSection
            title=""
            goals={activeGoals.filter(goal => goal.companionId === selectedCompanion && goal.type === 'challenge')}
            emptyMessage="No active companion goals. Your companion will assign you special goals as you spend more time together!"
            colors={colors}
            onComplete={handleCompleteGoal}
            isCompanionSection={true}
            companionId={selectedCompanion}
          />
        </div>
        
        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mb-6">
            <div 
              className="flex justify-between items-center cursor-pointer mb-2" 
              onClick={() => setCompletedGoalsCollapsed(!completedGoalsCollapsed)}
            >
              <h3 
                className="text-lg font-[Riffic]"
                style={{ color: colors.heading }}
              >
                Completed Goals
              </h3>
              <div className="text-gray-500">
                {completedGoalsCollapsed ? '▼ Show' : '▲ Hide'} ({completedGoals.length})
              </div>
            </div>
            
            {!completedGoalsCollapsed && (
              <GoalSection
                title=""
                goals={completedGoals}
                emptyMessage="No completed goals yet."
                colors={colors}
                onComplete={() => {}}
              />
            )}
          </div>
        )}
        
        {/* Expired Goals */}
        {expiredGoals.length > 0 && (
          <GoalSection
            title="Expired Goals"
            goals={expiredGoals}
            emptyMessage="No expired goals."
            colors={colors}
            onComplete={() => {}}
            onDelete={handleDeleteGoal}
            isExpired={true}
          />
        )}
      </main>
    </div>
  );
}