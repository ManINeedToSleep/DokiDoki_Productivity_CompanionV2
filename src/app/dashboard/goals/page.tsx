"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { Goal, createGoal } from '@/lib/firebase/goals';
import { FaCheck, FaTrash, FaEdit, FaTrophy, FaSun, FaCalendarWeek, FaStar, FaUser } from 'react-icons/fa';
import Button from '@/components/Common/Button/Button';
import { useGoalsStore } from '@/lib/stores/goalsStore';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import { Timestamp } from 'firebase/firestore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { ACHIEVEMENTS, Achievement } from '@/lib/firebase/achievements';
import { refreshGoals, assignRandomCompanionGoal, updateGoal as updateGoalFirebase, removeGoal as removeGoalFirebase } from '@/lib/firebase/goals';
import Image from 'next/image';

export default function GoalsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [deadline, setDeadline] = useState(() => {
    // Initialize with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  // Get goals store
  const { 
    markComplete, 
    syncWithFirebase
  } = useGoalsStore();
  
  // Get achievements store
  const {
    achievements,
    setAchievements,
    syncWithFirebase: syncAchievements
  } = useAchievementsStore();
  
  // Add state for goal refreshing
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Add state for goal notifications
  const [goalNotification, setGoalNotification] = useState<{
    type: 'daily' | 'weekly' | 'challenge' | 'custom';
    title: string;
  } | null>(null);
  
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
  
  // Move fetchUserData outside of useEffect
  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoadingData(true);
      const data = await getUserDocument(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Call fetchUserData
    fetchUserData();
    
    // Sync goals with Firebase
    syncWithFirebase(user.uid);
    
    // Sync achievements with Firebase
    syncAchievements(user.uid);
  }, [user, router, syncWithFirebase, syncAchievements, fetchUserData]);
  
  // Sync with Firebase every 3 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        syncWithFirebase(user.uid);
      }, 3 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, syncWithFirebase]);
  
  // Initialize deadline when component mounts
  useEffect(() => {
    setDeadline(getTomorrowDateString());
  }, []);
  
  // Get character-specific colors for polka dots
  const getCharacterDotColor = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return '#F5C0DF';
      case 'natsuki':
        return '#FFCCD3';
      case 'yuri':
        return '#D1CFFF';
      case 'monika':
        return '#C5E8D1';
      default:
        return '#F5C0DF';
    }
  };
  
  // Get character-specific colors
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2',
          progress: '#FF9ED2'
        };
      case 'natsuki':
        return { 
          primary: '#FF8DA1',
          secondary: '#FFF0F0',
          text: '#D14D61',
          heading: '#FF8DA1',
          progress: '#FF8DA1'
        };
      case 'yuri':
        return { 
          primary: '#A49EFF',
          secondary: '#F0F0FF',
          text: '#6A61E0',
          heading: '#A49EFF',
          progress: '#A49EFF'
        };
      case 'monika':
        return { 
          primary: '#85CD9E',
          secondary: '#F0FFF5',
          text: '#4A9D64',
          heading: '#85CD9E',
          progress: '#85CD9E'
        };
      default:
        return { 
          primary: '#FF9ED2',
          secondary: '#FFEEF3',
          text: '#D76C95',
          heading: '#FF9ED2',
          progress: '#FF9ED2'
        };
    }
  };
  
  // Get character-specific input colors
  const getInputColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          bg: '#FFF5F9',
          border: '#FFD1E6',
          focus: '#FF9ED2',
          placeholder: '#FFAED9'
        };
      case 'natsuki':
        return { 
          bg: '#FFF5F5',
          border: '#FFCCD5',
          focus: '#FF8DA1',
          placeholder: '#FFA5B5'
        };
      case 'yuri':
        return { 
          bg: '#F5F5FF',
          border: '#D1D0FF',
          focus: '#A49EFF',
          placeholder: '#B8B5FF'
        };
      case 'monika':
        return { 
          bg: '#F5FFF8',
          border: '#C5E8D1',
          focus: '#85CD9E',
          placeholder: '#A0DCB4'
        };
      default:
        return { 
          bg: '#FFF5F9',
          border: '#FFD1E6',
          focus: '#FF9ED2',
          placeholder: '#FFAED9'
        };
    }
  };
  
  // Check for new goals on component mount
  useEffect(() => {
    if (user && userData) {
      const now = new Date();
      const lastUpdated = userData.goals?.lastUpdated?.toDate() || new Date(0);
      const hasExpiredGoals = userData.goals?.list?.some(goal => 
        !goal.completed && new Date(goal.deadline.toDate()) < now
      );
      
      // If goals haven't been updated today or there are expired goals, refresh them
      const isNewDay = lastUpdated.getDate() !== now.getDate() || 
                       lastUpdated.getMonth() !== now.getMonth() || 
                       lastUpdated.getFullYear() !== now.getFullYear();
      
      if (isNewDay || hasExpiredGoals) {
        handleRefreshGoals().then(() => {
          // Show notification about new goals
          setGoalNotification({
            type: 'daily',
            title: 'New goals have been assigned!'
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => {
            setGoalNotification(null);
          }, 5000);
        });
      }
    }
  }, [user, userData, handleRefreshGoals]);
  
  // Update the handleRequestCompanionGoal function to show the correct notification
  const handleRequestCompanionGoal = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
      const result = await assignRandomCompanionGoal(user.uid, selectedCompanion);
      
      // Show notification about new companion goal
      setGoalNotification({
        type: 'challenge',
        title: `${selectedCompanion.charAt(0).toUpperCase() + selectedCompanion.slice(1)} assigned you a new challenge: ${result.title}`
      });
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setGoalNotification(null);
      }, 5000);
      
      // Fetch updated user data
      const data = await getUserDocument(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error requesting companion goal:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add a function to get tomorrow's date as a string
  const getTomorrowDateString = () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    } catch (error) {
      console.error("Error generating tomorrow's date:", error);
      // Return today's date as a fallback
      const today = new Date();
      return today.toISOString().split('T')[0];
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
    !goal.completed && new Date(goal.deadline.toDate()) > new Date()
  ) || [];
  
  // Get completed goals
  const completedGoals = userData?.goals?.list?.filter(goal => 
    goal.completed
  ) || [];
  
  // Get expired goals (not completed and expired)
  const expiredGoals = userData?.goals?.list?.filter(goal => 
    !goal.completed && new Date(goal.deadline.toDate()) <= new Date()
  ) || [];
  
  // Sort by deadline (closest first)
  activeGoals.sort((a, b) => 
    a.deadline.toDate().getTime() - b.deadline.toDate().getTime()
  );
  
  // Sort by completion date (most recent first)
  completedGoals.sort((a, b) => 
    b.deadline.toDate().getTime() - a.deadline.toDate().getTime()
  );
  
  // Check if a goal is system-generated (not created by the user)
  const isSystemGoal = (goal: Goal) => {
    // If it has a companionId or is a daily/weekly/challenge goal that was auto-generated
    return !!goal.companionId || 
           (goal.type !== 'custom' && !goal.id.includes('user_'));
  };
  
  // Add a function to identify user-created goals
  const isUserCreatedGoal = (goal: Goal) => {
    return goal.type === 'custom' && goal.id.includes('user_');
  };
  
  // Update the handleAddGoal function to ensure goals appear immediately and handle errors properly
  const handleAddGoal = async () => {
    if (!user) return;
    
    if (!title.trim()) {
      alert("Please enter a title for your goal");
      return;
    }
    
    // Validate deadline
    if (!deadline) {
      alert("Please select a deadline for your goal");
      return;
    }
    
    try {
      // Validate that the deadline is a valid date
      let deadlineDate;
      try {
        deadlineDate = new Date(deadline);
        
        if (isNaN(deadlineDate.getTime())) {
          alert("Invalid deadline date. Please select a valid date.");
          return;
        }
      } catch (dateError) {
        console.error("Error parsing deadline date:", dateError);
        alert("Invalid deadline date format. Please select a valid date.");
        return;
      }
      
      // Ensure deadline is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        alert("Deadline cannot be in the past. Please select a future date.");
        return;
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
      
      // Reset form
      setTitle('');
      setDescription('');
      setTargetMinutes(30);
      setDeadline(getTomorrowDateString());
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("There was an error creating your goal. Please try again.");
    }
  };
  
  const handleUpdateGoal = async () => {
    if (!user || !editingGoal) return;
    
    if (!title.trim()) {
      alert("Please enter a title for your goal");
      return;
    }
    
    try {
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
      setTitle('');
      setDescription('');
      setTargetMinutes(25);
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("There was an error updating your goal. Please try again.");
    }
  };
  
  const handleEditClick = (goal: Goal) => {
    // Only allow editing user-created goals
    if (isSystemGoal(goal)) return;
    
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetMinutes(goal.targetMinutes);
  };
  
  const handleCancelEdit = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetMinutes(25);
  };
  
  // Add a function to handle showing the add form
  const handleShowAddForm = () => {
    setShowAddForm(true);
    setDeadline(getTomorrowDateString());
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Add function to get goal type badge
  const getGoalTypeBadge = (type: 'daily' | 'weekly' | 'challenge' | 'custom') => {
    switch (type) {
      case 'daily':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-yellow-100 text-yellow-800">
            <FaSun size={10} />
            Daily
          </span>
        );
      case 'weekly':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-blue-100 text-blue-800">
            <FaCalendarWeek size={10} />
            Weekly
          </span>
        );
      case 'challenge':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-purple-100 text-purple-800">
            <FaStar size={10} />
            Challenge
          </span>
        );
      case 'custom':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-[Halogen] bg-green-100 text-green-800">
            <FaUser size={10} />
            Custom
          </span>
        );
    }
  };
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.text }}
        >
          Your Goals
        </motion.h1>
        
        {goalNotification && (
          <motion.div 
            className="mb-4 p-3 rounded-lg text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              backgroundColor: colors.secondary,
              color: colors.text
            }}
          >
            <p className="font-[Halogen]">
              {goalNotification.type === 'daily' && '☀️ '}
              {goalNotification.type === 'weekly' && '📅 '}
              {goalNotification.type === 'challenge' && '🏆 '}
              {goalNotification.type === 'custom' && '🌟 '}
              {goalNotification.title}
            </p>
          </motion.div>
        )}
        
        <div className="mb-6 sticky top-0 z-10 bg-opacity-90 backdrop-blur-sm py-2">
          {!showAddForm && !editingGoal ? (
            <div className="flex flex-wrap gap-2">
              <Button
                label="Add New Goal"
                onClick={handleShowAddForm}
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
            <motion.div 
              className="bg-white rounded-xl shadow-md p-4 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
                Add New Goal
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                    style={{ 
                      backgroundColor: getInputColors(selectedCompanion).bg,
                      borderColor: getInputColors(selectedCompanion).border,
                      color: getInputColors(selectedCompanion).focus,
                      caretColor: getInputColors(selectedCompanion).focus,
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                    style={{ 
                      backgroundColor: getInputColors(selectedCompanion).bg,
                      borderColor: getInputColors(selectedCompanion).border,
                      color: getInputColors(selectedCompanion).focus,
                      caretColor: getInputColors(selectedCompanion).focus,
                    }}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                      Target Minutes
                    </label>
                    <input
                      type="number"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                      style={{ 
                        backgroundColor: getInputColors(selectedCompanion).bg,
                        borderColor: getInputColors(selectedCompanion).border,
                        color: getInputColors(selectedCompanion).focus,
                        caretColor: getInputColors(selectedCompanion).focus,
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                      style={{ 
                        backgroundColor: getInputColors(selectedCompanion).bg,
                        borderColor: getInputColors(selectedCompanion).border,
                        color: getInputColors(selectedCompanion).focus,
                        caretColor: getInputColors(selectedCompanion).focus,
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    label="Cancel"
                    onClick={() => setShowAddForm(false)}
                    companionId={selectedCompanion}
                    className="bg-gray-200 text-gray-700"
                  />
                  <Button
                    label="Add Goal"
                    onClick={handleAddGoal}
                    companionId={selectedCompanion}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {editingGoal && (
            <motion.div 
              className="bg-white rounded-xl shadow-md p-4 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
                Edit Goal
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                    style={{ 
                      backgroundColor: getInputColors(selectedCompanion).bg,
                      borderColor: getInputColors(selectedCompanion).border,
                      color: getInputColors(selectedCompanion).focus,
                      caretColor: getInputColors(selectedCompanion).focus,
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                    style={{ 
                      backgroundColor: getInputColors(selectedCompanion).bg,
                      borderColor: getInputColors(selectedCompanion).border,
                      color: getInputColors(selectedCompanion).focus,
                      caretColor: getInputColors(selectedCompanion).focus,
                    }}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                    Target Minutes
                  </label>
                  <input
                    type="number"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                    style={{ 
                      backgroundColor: getInputColors(selectedCompanion).bg,
                      borderColor: getInputColors(selectedCompanion).border,
                      color: getInputColors(selectedCompanion).focus,
                      caretColor: getInputColors(selectedCompanion).focus,
                    }}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    label="Cancel"
                    onClick={handleCancelEdit}
                    companionId={selectedCompanion}
                    className="bg-gray-200 text-gray-700"
                  />
                  <Button
                    label="Update Goal"
                    onClick={handleUpdateGoal}
                    companionId={selectedCompanion}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Daily Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
            Daily Goals
          </h2>
          
          {activeGoals.filter(goal => goal.type === 'daily').length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 font-[Halogen]">No active daily goals. Add a new daily goal to get started!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {activeGoals
                .filter(goal => goal.type === 'daily')
                .map((goal) => (
                  <motion.div 
                    key={goal.id}
                    className="bg-white rounded-xl shadow-md p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-[Riffic]" style={{ color: colors.text }}>
                            {goal.title}
                          </h3>
                          {getGoalTypeBadge(goal.type)}
                        </div>
                        <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Progress</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                    backgroundColor: colors.progress
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                                {goal.currentMinutes}/{goal.targetMinutes} min
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Deadline</span>
                            <div className="text-xs font-[Halogen] flex items-center gap-1" style={{ color: colors.text }}>
                              {formatDate(goal.deadline.toDate())}
                              {goal.type === 'daily' && <span className="text-yellow-500">· Today</span>}
                            </div>
                          </div>
                        </div>
                        
                        {goal.reward && (
                          <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                            style={{ backgroundColor: colors.secondary, color: colors.text }}>
                            <FaTrophy size={12} />
                            <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => user && markComplete(user.uid, goal.id)}
                          className="p-2 rounded-full hover:bg-green-100 transition-colors"
                          title="Mark as Complete"
                          disabled={goal.currentMinutes < goal.targetMinutes}
                          style={{ 
                            opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                            cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FaCheck className="text-green-500" />
                        </button>
                        
                        {!isSystemGoal(goal) && (
                          <>
                            <button
                              onClick={() => handleEditClick(goal)}
                              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit Goal"
                            >
                              <FaEdit className="text-blue-500" />
                            </button>
                            
                            <button
                              onClick={async () => {
                                if (!user) return;
                                try {
                                  // Delete directly in Firebase
                                  await removeGoalFirebase(user.uid, goal.id);
                                  
                                  // Fetch user data again to refresh the goals list
                                  await fetchUserData();
                                } catch (error) {
                                  console.error("Error deleting goal:", error);
                                  alert("There was an error deleting your goal. Please try again.");
                                }
                              }}
                              className="p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete Goal"
                            >
                              <FaTrash className="text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
        
        {/* Weekly Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
            Weekly Goals
          </h2>
          
          {activeGoals.filter(goal => goal.type === 'weekly').length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 font-[Halogen]">No active weekly goals. Add a new weekly goal to get started!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {activeGoals
                .filter(goal => goal.type === 'weekly')
                .map((goal) => (
                  <motion.div 
                    key={goal.id}
                    className="bg-white rounded-xl shadow-md p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-[Riffic]" style={{ color: colors.text }}>
                            {goal.title}
                          </h3>
                          {getGoalTypeBadge(goal.type)}
                        </div>
                        <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Progress</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                    backgroundColor: colors.progress
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                                {goal.currentMinutes}/{goal.targetMinutes} min
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Deadline</span>
                            <div className="text-xs font-[Halogen] flex items-center gap-1" style={{ color: colors.text }}>
                              {formatDate(goal.deadline.toDate())}
                              {goal.type === 'weekly' && <span className="text-blue-500">· This Week</span>}
                            </div>
                          </div>
                        </div>
                        
                        {goal.reward && (
                          <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                            style={{ backgroundColor: colors.secondary, color: colors.text }}>
                            <FaTrophy size={12} />
                            <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => user && markComplete(user.uid, goal.id)}
                          className="p-2 rounded-full hover:bg-green-100 transition-colors"
                          title="Mark as Complete"
                          disabled={goal.currentMinutes < goal.targetMinutes}
                          style={{ 
                            opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                            cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FaCheck className="text-green-500" />
                        </button>
                        
                        {!isSystemGoal(goal) && (
                          <>
                            <button
                              onClick={() => handleEditClick(goal)}
                              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit Goal"
                            >
                              <FaEdit className="text-blue-500" />
                            </button>
                            
                            <button
                              onClick={async () => {
                                if (!user) return;
                                try {
                                  // Delete directly in Firebase
                                  await removeGoalFirebase(user.uid, goal.id);
                                  
                                  // Fetch user data again to refresh the goals list
                                  await fetchUserData();
                                } catch (error) {
                                  console.error("Error deleting goal:", error);
                                  alert("There was an error deleting your goal. Please try again.");
                                }
                              }}
                              className="p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete Goal"
                            >
                              <FaTrash className="text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
        
        {/* Challenge Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
            Challenge Goals
          </h2>
          
          {activeGoals.filter(goal => goal.type === 'challenge' && !goal.companionId && !isUserCreatedGoal(goal)).length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 font-[Halogen]">No active challenge goals. System will assign challenging goals to push your limits!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {activeGoals
                .filter(goal => goal.type === 'challenge' && !goal.companionId && !isUserCreatedGoal(goal))
                .map((goal) => (
                  <motion.div 
                    key={goal.id}
                    className="bg-white rounded-xl shadow-md p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-[Riffic]" style={{ color: colors.text }}>
                            {goal.title}
                          </h3>
                          {getGoalTypeBadge(goal.type)}
                        </div>
                        <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Progress</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                    backgroundColor: colors.progress
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                                {goal.currentMinutes}/{goal.targetMinutes} min
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Deadline</span>
                            <div className="text-xs font-[Halogen] flex items-center gap-1" style={{ color: colors.text }}>
                              {formatDate(goal.deadline.toDate())}
                              {goal.type === 'daily' && <span className="text-yellow-500">· Today</span>}
                              {goal.type === 'weekly' && <span className="text-blue-500">· This Week</span>}
                              {goal.type === 'challenge' && <span className="text-purple-500">· Challenge</span>}
                              {goal.type === 'custom' && <span className="text-green-500">· Custom</span>}
                            </div>
                          </div>
                        </div>
                        
                        {goal.reward && (
                          <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                            style={{ backgroundColor: colors.secondary, color: colors.text }}>
                            <FaTrophy size={12} />
                            <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => user && markComplete(user.uid, goal.id)}
                          className="p-2 rounded-full hover:bg-green-100 transition-colors"
                          title="Mark as Complete"
                          disabled={goal.currentMinutes < goal.targetMinutes}
                          style={{ 
                            opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                            cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FaCheck className="text-green-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
        
        {/* Custom Goals Section */}
        <div className="mb-8">
          <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
            Your Custom Goals
          </h2>
          
          {activeGoals.filter(goal => isUserCreatedGoal(goal)).length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 font-[Halogen]">No custom goals yet. Click &quot;Add New Goal&quot; to create your own personalized goals!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {activeGoals
                .filter(goal => isUserCreatedGoal(goal))
                .map((goal) => (
                  <motion.div 
                    key={goal.id}
                    className="bg-white rounded-xl shadow-md p-4 border-l-4"
                    style={{ borderLeftColor: colors.primary }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-[Riffic]" style={{ color: colors.text }}>
                            {goal.title}
                          </h3>
                          {getGoalTypeBadge(goal.type)}
                        </div>
                        <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Progress</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                    backgroundColor: colors.progress
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                                {goal.currentMinutes}/{goal.targetMinutes} min
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Deadline</span>
                            <div className="text-xs font-[Halogen] flex items-center gap-1" style={{ color: colors.text }}>
                              {formatDate(goal.deadline.toDate())}
                              {goal.type === 'daily' && <span className="text-yellow-500">· Today</span>}
                              {goal.type === 'weekly' && <span className="text-blue-500">· This Week</span>}
                              {goal.type === 'challenge' && <span className="text-purple-500">· Challenge</span>}
                              {goal.type === 'custom' && <span className="text-green-500">· Custom</span>}
                            </div>
                          </div>
                        </div>
                        
                        {goal.reward && (
                          <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                            style={{ backgroundColor: colors.secondary, color: colors.text }}>
                            <FaTrophy size={12} />
                            <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => user && markComplete(user.uid, goal.id)}
                          className="p-2 rounded-full hover:bg-green-100 transition-colors"
                          title="Mark as Complete"
                          disabled={goal.currentMinutes < goal.targetMinutes}
                          style={{ 
                            opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                            cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FaCheck className="text-green-500" />
                        </button>
                        
                        {!isSystemGoal(goal) && (
                          <>
                            <button
                              onClick={() => handleEditClick(goal)}
                              className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit Goal"
                            >
                              <FaEdit className="text-blue-500" />
                            </button>
                            
                            <button
                              onClick={async () => {
                                if (!user) return;
                                try {
                                  // Delete directly in Firebase
                                  await removeGoalFirebase(user.uid, goal.id);
                                  
                                  // Fetch user data again to refresh the goals list
                                  await fetchUserData();
                                } catch (error) {
                                  console.error("Error deleting goal:", error);
                                  alert("There was an error deleting your goal. Please try again.");
                                }
                              }}
                              className="p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete Goal"
                            >
                              <FaTrash className="text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
        
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
          
          {activeGoals.filter(goal => goal.companionId === selectedCompanion && goal.type === 'challenge').length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500 font-[Halogen]">No active companion goals. Your companion will assign you special goals as you spend more time together!</p>
              <p className="text-gray-500 font-[Halogen] mt-2">Click the &quot;Request Goal&quot; button above to ask for a new challenge.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {activeGoals
                .filter(goal => goal.companionId === selectedCompanion && goal.type === 'challenge')
                .map((goal) => (
                  <motion.div 
                    key={goal.id}
                    className="bg-white rounded-xl shadow-md p-4 border-l-4"
                    style={{ borderLeftColor: colors.primary }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 relative" style={{ marginTop: '-4px' }}>
                          <Image
                            src={`/images/characters/sprites/${selectedCompanion}-Chibi.png`}
                            alt={selectedCompanion}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-[Riffic]" style={{ color: colors.text }}>
                              {goal.title}
                            </h3>
                            {getGoalTypeBadge(goal.type)}
                          </div>
                          <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                          
                          <div className="flex items-center gap-4 mb-2">
                            <div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Progress</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full"
                                    style={{ 
                                      width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                      backgroundColor: colors.progress
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                                  {goal.currentMinutes}/{goal.targetMinutes} min
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>Deadline</span>
                              <div className="text-xs font-[Halogen] flex items-center gap-1" style={{ color: colors.text }}>
                                {formatDate(goal.deadline.toDate())}
                                {goal.type === 'daily' && <span className="text-yellow-500">· Today</span>}
                                {goal.type === 'weekly' && <span className="text-blue-500">· This Week</span>}
                                {goal.type === 'challenge' && <span className="text-purple-500">· Challenge</span>}
                                {goal.type === 'custom' && <span className="text-green-500">· Custom</span>}
                              </div>
                            </div>
                          </div>
                          
                          {goal.reward && (
                            <div className="mt-2 text-xs font-[Halogen] inline-flex items-center gap-1 px-2 py-1 rounded-full" 
                              style={{ backgroundColor: colors.secondary, color: colors.text }}>
                              <FaTrophy size={12} />
                              <span>Reward: {goal.reward.type === 'affinity' ? `+${goal.reward.value} Affinity` : goal.reward.value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => user && markComplete(user.uid, goal.id)}
                          className="p-2 rounded-full hover:bg-green-100 transition-colors"
                          title="Mark as Complete"
                          disabled={goal.currentMinutes < goal.targetMinutes}
                          style={{ 
                            opacity: goal.currentMinutes >= goal.targetMinutes ? 1 : 0.5,
                            cursor: goal.currentMinutes >= goal.targetMinutes ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <FaCheck className="text-green-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
        
        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
              Completed Goals
            </h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {completedGoals.map((goal) => (
                <motion.div 
                  key={goal.id}
                  className="bg-white rounded-xl shadow-md p-4 opacity-75"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.75, y: 0 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-[Riffic] line-through" style={{ color: colors.text }}>
                        {goal.title}
                      </h3>
                      <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                      
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <span className="text-xs text-gray-500 font-[Halogen]">Progress</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: '100%',
                                  backgroundColor: colors.progress
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-[Halogen]" style={{ color: colors.text }}>
                              {goal.targetMinutes}/{goal.targetMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Expired Goals */}
        {expiredGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-[Riffic] mb-4" style={{ color: colors.heading }}>
              Expired Goals
            </h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
              {expiredGoals.map((goal) => (
                <motion.div 
                  key={goal.id}
                  className="bg-white rounded-xl shadow-md p-4 opacity-60"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.6, y: 0 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-[Riffic] text-red-500">
                        {goal.title}
                      </h3>
                      <p className="text-gray-600 font-[Halogen] text-sm mb-2">{goal.description}</p>
                      
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <span className="text-xs text-gray-500 font-[Halogen]">Progress</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-red-300"
                                style={{ 
                                  width: `${Math.min(100, (goal.currentMinutes / goal.targetMinutes) * 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-[Halogen] text-red-500">
                              {goal.currentMinutes}/{goal.targetMinutes} min
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-gray-500 font-[Halogen]">Expired</span>
                          <div className="text-sm font-[Halogen] text-red-500">
                            {formatDate(goal.deadline.toDate())}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!user) return;
                          try {
                            // Delete directly in Firebase
                            await removeGoalFirebase(user.uid, goal.id);
                            
                            // Fetch user data again to refresh the goals list
                            await fetchUserData();
                          } catch (error) {
                            console.error("Error deleting goal:", error);
                            alert("There was an error deleting your goal. Please try again.");
                          }
                        }}
                        className="p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete Goal"
                      >
                        <FaTrash className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
