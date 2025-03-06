"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/stores/userStore';
import { useGoalsStore } from '@/lib/stores/goalsStore';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import { Timestamp } from 'firebase/firestore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';
import { getCharacterDotColor, getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import {
  TimerDisplay,
  TimerControls,
  TimerSettings,
  TimerStats,
  TimerMessage,
  getProgressPercentage,
  TimerState
} from '@/components/Timer';
import type { TimerSettings as TimerSettingsType } from '@/components/Timer/types';
import AchievementNotification from '@/components/Common/Notifications/AchievementNotification';
import GoalNotification from '@/components/Common/Notifications/GoalNotification';


export default function TimerPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Timer settings
  const [workDuration, setWorkDuration] = useState(25 * 60); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes in seconds
  const [longBreakDuration, setLongBreakDuration] = useState(15 * 60); // 15 minutes in seconds
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(workDuration);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeWorked, setTotalTimeWorked] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs for timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  // Get stores
  const { recordFocusSession: userRecordFocusSession, updateCompanionMood, updateCompanionStats: userUpdateCompanionStats, updateCompanionAffinity, syncWithFirebase: userSyncWithFirebase, refreshUserData} = useUserStore();
  const { checkFocus, checkSession, syncWithFirebase: syncAchievements } = useAchievementsStore();
  const { updateProgress, syncWithFirebase: syncGoals } = useGoalsStore();
  
  // Session message
  const [sessionMessage, setSessionMessage] = useState('');
  
  // Track achievements and goals updates
  const recentlyUnlockedAchievement = useAchievementsStore(
    useCallback(state => state.recentlyUnlockedAchievement, [])
  );
  const clearRecentlyUnlockedAchievement = useAchievementsStore(
    useCallback(state => state.clearRecentlyUnlockedAchievement, [])
  );
  
  const recentlyUpdatedGoal = useGoalsStore(
    useCallback(state => state.recentlyUpdatedGoal, [])
  );
  const clearRecentlyUpdatedGoal = useGoalsStore(
    useCallback(state => state.clearRecentlyUpdatedGoal, [])
  );
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchUserData = async () => {
        setIsLoadingData(true);
        try {
          // Force sync data from stores to Firebase first to ensure we have the latest data
          console.log("🔄 Timer Page: Forcing sync of user data on page load");
          
          // Get the sync functions from the stores
          const userStore = useUserStore.getState();
          const goalsStore = useGoalsStore.getState();
          const achievementsStore = useAchievementsStore.getState();
          
          // First refresh user data from Firebase to ensure the store has it
          console.log("🔄 Timer Page: Explicitly refreshing user data in the UserStore");
          await userStore.refreshUserData(user.uid);
          console.log("✅ Timer Page: User data refreshed in UserStore");
          
          // Force sync all stores
          await userStore.syncWithFirebase(user.uid, true);
          await goalsStore.syncWithFirebase(user.uid, true);
          await achievementsStore.syncWithFirebase(user.uid, true);
          
          console.log("✅ Timer Page: All stores synced with Firebase");
          
          // Now fetch fresh user data
          console.log("🔄 Timer Page: Fetching fresh user data");
          const data = await getUserDocument(user.uid);
          console.log("📋 User data fetched:", data);
          
          // Check if we have goals data
          if (data?.goals?.list) {
            console.log(`📋 Found ${data.goals.list.length} goals in user data`);
            data.goals.list.forEach((goal, index) => {
              console.log(`📋 Goal ${index+1}: ${goal.title} - ${goal.currentMinutes}/${goal.targetMinutes} minutes (${goal.completed ? 'Completed' : 'In progress'})`);
            });
          } else {
            console.log("📋 No goals found in user data");
          }
          
          setUserData(data);
          
          // Set timer settings from user preferences
          if (data?.settings?.timerSettings) {
            const settings = data.settings.timerSettings;
            setWorkDuration(settings.workDuration * 60);
            setBreakDuration(settings.shortBreakDuration * 60);
            setLongBreakDuration(settings.longBreakDuration * 60);
            setSessionsBeforeLongBreak(settings.longBreakInterval);
            setTimeRemaining(settings.workDuration * 60);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchUserData();
    }
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, isLoading, router]);
  
  useEffect(() => {
    if (timerState === 'completed') {
      console.log('Session completed, checking for achievement and goal updates...');
    }
  }, [timerState]);
  
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PolkaDotBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-[Halogen]">Loading timer...</p>
        </div>
      </div>
    );
  }
  
  const selectedCompanion = userData?.settings?.selectedCompanion || 'sayori';
  const colors = getCharacterColors(selectedCompanion);
  const dotColor = getCharacterDotColor(selectedCompanion);
  
  // Start timer
  const startTimer = async () => {
    if (timerState === 'idle' || timerState === 'paused') {
      // If starting a new session
      if (timerState === 'idle') {
        startTimeRef.current = Date.now();
        setSessionStartTime(new Date());
        
        // We don't need to manually set a message anymore since TimerMessage will handle it
        setSessionMessage('');
      } else {
        // If resuming from pause
        startTimeRef.current = Date.now() - pausedTimeRef.current;
      }
      
      setTimerState('running');
      
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = workDuration - elapsedSeconds;
        
        if (remaining <= 1) {
          // Timer completed - trigger when reaching 1 or 0 seconds
          clearInterval(timerRef.current!);
          setTimeRemaining(0); // Force display to show 0:00
          completeSession();
        } else {
          setTimeRemaining(remaining);
          setTotalTimeWorked(prev => prev + 1);
        }
      }, 1000);
    }
  };
  
  // Pause timer
  const pauseTimer = () => {
    if (timerState === 'running' && timerRef.current) {
      clearInterval(timerRef.current);
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      setTimerState('paused');
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimerState('idle');
    setTimeRemaining(workDuration);
    setSessionStartTime(null);
    setSessionMessage('');
  };
  
  // Complete session
  const completeSession = async () => {
    console.log("🎉 Session completed! Starting cleanup and updates...");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimerState('completed');
    setCompletedSessions(prev => prev + 1);
    
    // Show completion message - use empty message as TimerMessage component will generate one
    setSessionMessage('');
    
    console.log("Session completed, checking for achievement and goal updates...");
    
    // Debug what's happening with user and sessionStartTime
    console.log("DEBUG: user exists?", !!user);
    console.log("DEBUG: sessionStartTime exists?", !!sessionStartTime);
    console.log("DEBUG: sessionStartTime value:", sessionStartTime);
    
    // Ensure we always have a session start time if user exists
    if (user && !sessionStartTime) {
      console.log("WARNING: sessionStartTime was missing, setting to 60 seconds ago");
      const fallbackStartTime = new Date(new Date().getTime() - 60000); // 60 seconds ago
      setSessionStartTime(fallbackStartTime);
      
      // Continue with the fallback time instead of waiting for state update
      if (user) {
        // Force the session duration to be the full work duration (e.g., 60 seconds for 1-minute timer)
        console.log(`⏱️ Forcing session duration to full work duration: ${workDuration} seconds`);
        const forcedSessionDuration = workDuration;
        
        // Record the focus session
        const session = {
          startTime: Timestamp.fromDate(fallbackStartTime),
          endTime: Timestamp.fromDate(new Date()),
          duration: forcedSessionDuration,
          completed: true,
          companionId: selectedCompanion,
          breaks: {
            count: 0,
            totalDuration: 0
          }
        };
        
        // Record the session (updates local state and prepares Firebase update)
        console.log("💾 Recording focus session with session data:", JSON.stringify(session));
        userRecordFocusSession(user.uid, session);
        
        // Update companion stats
        console.log(`🧠 Updating companion stats for: ${selectedCompanion}`);
        userUpdateCompanionStats(user.uid, selectedCompanion, forcedSessionDuration);
        updateCompanionAffinity(user.uid, selectedCompanion, forcedSessionDuration);
        updateCompanionMood(user.uid, selectedCompanion);
        
        // Check achievements
        console.log("🏆 Checking for achievements...");
        
        // Make sure we're properly adding sessionDuration to totalFocusTime
        const currentTotalFocusTime = userData?.focusStats?.totalFocusTime || 0;
        const newTotalFocusTime = currentTotalFocusTime + forcedSessionDuration;
        const currentTotalSessions = userData?.focusStats?.totalSessions || 0;
        const newTotalSessions = currentTotalSessions + 1;
        
        console.log(`📊 Focus stats: Total focus time ${currentTotalFocusTime}s → ${newTotalFocusTime}s`);
        console.log(`📊 Focus stats: Total sessions ${currentTotalSessions} → ${newTotalSessions}`);
        
        // Ensure that a 1-minute timer gets recognized as at least 1 minute for achievements
        let achievementMinutes = Math.floor(forcedSessionDuration / 60);
        if (workDuration === 60 && achievementMinutes < 1) {
          achievementMinutes = 1;
          console.log(`📊 Special case: This was a 1-minute timer, forcing to 1 minute for achievements`);
        }
        
        // Convert seconds to minutes for achievements
        const totalFocusMinutes = Math.floor(newTotalFocusTime / 60);
        
        // Check for focus achievements - using MINUTES not SECONDS
        console.log(`📊 Checking focus achievements with: Total minutes: ${totalFocusMinutes}, Session minutes: ${achievementMinutes}, Total sessions: ${newTotalSessions}`)
        checkFocus(
          user.uid, 
          totalFocusMinutes,  // Total minutes
          achievementMinutes, // This session's minutes
          newTotalSessions    // Total number of sessions
        );
        
        // Check session achievements - pass Date object and minutes
        console.log(`📊 Checking session achievements with: Duration: ${achievementMinutes} minutes, Start time: ${fallbackStartTime}`);
        checkSession(
          user.uid, 
          achievementMinutes, // Clearly pass minutes (not sessionSeconds) 
          fallbackStartTime
        );
        
        // Force sync ALL stores with Firebase - critically important
        console.log("🔄 Forcing explicit sync of ALL stores to Firebase...");
        
        // First sync user store to record the session
        console.log("🔄 Forcing sync of user store to Firebase...");
        await userSyncWithFirebase(user.uid, true);
        
        // Then sync achievements
        console.log("🔄 Forcing sync of achievements to Firebase...");
        await syncAchievements(user.uid, true);
        
        // Update active goals with focus time
        console.log("🎯 Updating active goals with focus time...");
        // Get all goals and update them with this session's focus time
        let minutesForGoals = Math.floor(forcedSessionDuration / 60);
        
        // Special case: If this was a 1-minute timer, ensure we count it as a full minute
        // even if the actual seconds would round down to 0
        if (workDuration <= 60 && minutesForGoals < 1) {
          minutesForGoals = 1;
          console.log(`⏱️ Special case: This was a ${workDuration}s timer, forcing to 1 minute for goals`);
        }
        
        console.log(`⏱️ Converting ${forcedSessionDuration} seconds to ${minutesForGoals} minute${minutesForGoals === 1 ? '' : 's'} for goals`);
        
        if (userData?.goals?.list) {
          console.log(`📌 Found ${userData.goals.list.length} goals, updating non-completed ones:`);
          console.log("");
          
          userData.goals.list.forEach(goal => {
            if (!goal.completed) {
              const newProgress = goal.currentMinutes + minutesForGoals;
              console.log(`${goal.title} (${goal.currentMinutes}/${goal.targetMinutes} minutes → ${newProgress}/${goal.targetMinutes} minutes)`);
              // Update goal progress with the same number of minutes for all goals
              updateProgress(user.uid, goal.id, minutesForGoals);
            }
          });
          console.log("");
        } else {
          console.log("No goals found in user data");
        }
        
        // Force sync goals with Firebase
        console.log("🔄 Forcing sync of goals to Firebase...");
        syncGoals(user.uid, true);
        
        // Force a refresh of all data from Firebase after all syncs complete
        console.log("🔄 Explicitly refreshing all user data from Firebase...");
        
        // Use a timeout to allow Firebase time to process all of the changes
        setTimeout(async () => {
          try {
            // First refresh user data directly from Firebase
            console.log("🔄 Refreshing user data from Firebase...");
            await refreshUserData(user.uid);
            console.log("✅ User data refreshed from Firebase");
            
            // Then fetch the updated document to update the local state in this component
            console.log("🔄 Fetching updated user data after refresh...");
            const updatedData = await getUserDocument(user.uid);
            setUserData(updatedData);
            
            // Check if goals were updated
            if (updatedData?.goals?.list) {
              console.log(`🔄 Updated goals data: Found ${updatedData.goals.list.length} goals`);
              updatedData.goals.list.forEach((goal, index) => {
                console.log(`🔄 Updated Goal ${index+1}: ${goal.title} - ${goal.currentMinutes}/${goal.targetMinutes} minutes (${goal.completed ? 'Completed' : 'In progress'})`);
              });
            }
            
            // Check updated focus stats
            if (updatedData?.focusStats) {
              console.log("📊 Updated focus stats from Firebase:");
              console.log(`- Total focus time: ${updatedData.focusStats.totalFocusTime}s`);
              console.log(`- Today's focus time: ${updatedData.focusStats.todaysFocusTime}s`);
              console.log(`- Total sessions: ${updatedData.focusStats.totalSessions}`);
              console.log(`- Completed sessions: ${updatedData.focusStats.completedSessions}`);
              console.log(`- Daily streak: ${updatedData.focusStats.dailyStreak}`);
            }
          } catch (error) {
            console.error("Error refreshing user data:", error);
          }
        }, 3000); // Wait 3 seconds for Firebase to update
      }
    } else if (user && sessionStartTime) {
      // Force the session duration to be the full work duration (e.g., 60 seconds for 1-minute timer)
      console.log(`⏱️ Forcing session duration to full work duration: ${workDuration} seconds`);
      const forcedSessionDuration = workDuration;
      
      // Record the focus session
      const session = {
        startTime: Timestamp.fromDate(sessionStartTime),
        endTime: Timestamp.fromDate(new Date()),
        duration: forcedSessionDuration,
        completed: true,
        companionId: selectedCompanion,
        breaks: {
          count: 0,
          totalDuration: 0
        }
      };
      
      // Record the session (updates local state and prepares Firebase update)
      console.log("💾 Recording focus session with session data:", JSON.stringify(session));
      userRecordFocusSession(user.uid, session);
      
      // Update companion stats
      console.log(`🧠 Updating companion stats for: ${selectedCompanion}`);
      userUpdateCompanionStats(user.uid, selectedCompanion, forcedSessionDuration);
      updateCompanionAffinity(user.uid, selectedCompanion, forcedSessionDuration);
      updateCompanionMood(user.uid, selectedCompanion);
      
      // Check achievements
      console.log("🏆 Checking for achievements...");
      
      // Make sure we're properly adding sessionDuration to totalFocusTime
      const currentTotalFocusTime = userData?.focusStats?.totalFocusTime || 0;
      const newTotalFocusTime = currentTotalFocusTime + forcedSessionDuration;
      const currentTotalSessions = userData?.focusStats?.totalSessions || 0;
      const newTotalSessions = currentTotalSessions + 1;
      
      console.log(`📊 Focus stats: Total focus time ${currentTotalFocusTime}s → ${newTotalFocusTime}s`);
      console.log(`📊 Focus stats: Total sessions ${currentTotalSessions} → ${newTotalSessions}`);
      
      // Ensure that a 1-minute timer gets recognized as at least 1 minute for achievements
      let achievementMinutes = Math.floor(forcedSessionDuration / 60);
      if (workDuration === 60 && achievementMinutes < 1) {
        achievementMinutes = 1;
        console.log(`📊 Special case: This was a 1-minute timer, forcing to 1 minute for achievements`);
      }
      
      // Convert seconds to minutes for achievements
      const totalFocusMinutes = Math.floor(newTotalFocusTime / 60);
      
      // Check for focus achievements - using MINUTES not SECONDS
      console.log(`📊 Checking focus achievements with: Total minutes: ${totalFocusMinutes}, Session minutes: ${achievementMinutes}, Total sessions: ${newTotalSessions}`)
      checkFocus(
        user.uid, 
        totalFocusMinutes,  // Total minutes
        achievementMinutes, // This session's minutes
        newTotalSessions    // Total number of sessions
      );
      
      // Check session achievements - pass Date object and minutes
      console.log(`📊 Checking session achievements with: Duration: ${achievementMinutes} minutes, Start time: ${sessionStartTime}`);
      checkSession(
        user.uid, 
        achievementMinutes, // Clearly pass minutes (not sessionSeconds) 
        sessionStartTime
      );
      
      // Force sync ALL stores with Firebase - critically important
      console.log("🔄 Forcing explicit sync of ALL stores to Firebase...");
      
      // First sync user store to record the session
      console.log("🔄 Forcing sync of user store to Firebase...");
      await userSyncWithFirebase(user.uid, true);
      
      // Then sync achievements
      console.log("🔄 Forcing sync of achievements to Firebase...");
      await syncAchievements(user.uid, true);
      
      // Update active goals with focus time
      console.log("🎯 Updating active goals with focus time...");
      // Get all goals and update them with this session's focus time
      let minutesForGoals = Math.floor(forcedSessionDuration / 60);
      
      // Special case: If this was a 1-minute timer, ensure we count it as a full minute
      // even if the actual seconds would round down to 0
      if (workDuration <= 60 && minutesForGoals < 1) {
        minutesForGoals = 1;
        console.log(`⏱️ Special case: This was a ${workDuration}s timer, forcing to 1 minute for goals`);
      }
      
      console.log(`⏱️ Converting ${forcedSessionDuration} seconds to ${minutesForGoals} minute${minutesForGoals === 1 ? '' : 's'} for goals`);
      
      if (userData?.goals?.list) {
        console.log(`📌 Found ${userData.goals.list.length} goals, updating non-completed ones:`);
        console.log("");
        
        userData.goals.list.forEach(goal => {
          if (!goal.completed) {
            const newProgress = goal.currentMinutes + minutesForGoals;
            console.log(`${goal.title} (${goal.currentMinutes}/${goal.targetMinutes} minutes → ${newProgress}/${goal.targetMinutes} minutes)`);
            // Update goal progress with the same number of minutes for all goals
            updateProgress(user.uid, goal.id, minutesForGoals);
          }
        });
        console.log("");
      } else {
        console.log("No goals found in user data");
      }
      
      // Force sync goals with Firebase
      console.log("🔄 Forcing sync of goals to Firebase...");
      syncGoals(user.uid, true);
      
      // Force a refresh of all data from Firebase after all syncs complete
      console.log("🔄 Explicitly refreshing all user data from Firebase...");
      
      // Use a timeout to allow Firebase time to process all of the changes
      setTimeout(async () => {
        try {
          // First refresh user data directly from Firebase
          console.log("🔄 Refreshing user data from Firebase...");
          await refreshUserData(user.uid);
          console.log("✅ User data refreshed from Firebase");
          
          // Then fetch the updated document to update the local state in this component
          console.log("🔄 Fetching updated user data after refresh...");
          const updatedData = await getUserDocument(user.uid);
          setUserData(updatedData);
          
          // Check if goals were updated
          if (updatedData?.goals?.list) {
            console.log(`🔄 Updated goals data: Found ${updatedData.goals.list.length} goals`);
            updatedData.goals.list.forEach((goal, index) => {
              console.log(`🔄 Updated Goal ${index+1}: ${goal.title} - ${goal.currentMinutes}/${goal.targetMinutes} minutes (${goal.completed ? 'Completed' : 'In progress'})`);
            });
          }
          
          // Check updated focus stats
          if (updatedData?.focusStats) {
            console.log("📊 Updated focus stats from Firebase:");
            console.log(`- Total focus time: ${updatedData.focusStats.totalFocusTime}s`);
            console.log(`- Today's focus time: ${updatedData.focusStats.todaysFocusTime}s`);
            console.log(`- Total sessions: ${updatedData.focusStats.totalSessions}`);
            console.log(`- Completed sessions: ${updatedData.focusStats.completedSessions}`);
            console.log(`- Daily streak: ${updatedData.focusStats.dailyStreak}`);
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }, 3000); // Wait 3 seconds for Firebase to update
    }
  };
  
  // Start break
  const startBreak = () => {
    if (timerState === 'completed') {
      const isLongBreak = completedSessions % sessionsBeforeLongBreak === 0;
      const breakTime = isLongBreak ? longBreakDuration : breakDuration;
      
      setTimeRemaining(breakTime);
      setTimerState('break');
      
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = breakTime - elapsedSeconds;
        
        if (remaining <= 0) {
          // Break completed
          clearInterval(timerRef.current!);
          setTimerState('idle');
          setTimeRemaining(workDuration);
          setSessionMessage('');
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    }
  };
  
  // Handle settings change
  const handleSettingsChange = (key: keyof TimerSettingsType, value: number) => {
    switch (key) {
      case 'workDuration':
        setWorkDuration(value);
        break;
      case 'breakDuration':
        setBreakDuration(value);
        break;
      case 'longBreakDuration':
        setLongBreakDuration(value);
        break;
      case 'sessionsBeforeLongBreak':
        setSessionsBeforeLongBreak(value);
        break;
    }
  };
  
  // Save settings
  const saveSettings = () => {
    setShowSettings(false);
    
    // If timer is idle, update the display
    if (timerState === 'idle') {
      setTimeRemaining(workDuration);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = getProgressPercentage(
    timerState,
    timeRemaining,
    workDuration,
    breakDuration,
    longBreakDuration,
    completedSessions,
    sessionsBeforeLongBreak
  );
  
  // Current timer settings
  const currentSettings: TimerSettingsType = {
    workDuration,
    breakDuration,
    longBreakDuration,
    sessionsBeforeLongBreak
  };
  
  return (
    <div className="min-h-screen">
      <PolkaDotBackground dotColor={dotColor} />
      <Navbar />
      
      {/* Achievement and Goal Notifications */}
      <AnimatePresence>
        {recentlyUnlockedAchievement && (
          <AchievementNotification
            achievement={recentlyUnlockedAchievement}
            position="bottom-right"
            onClose={() => clearRecentlyUnlockedAchievement()}
          />
        )}
        
        {recentlyUpdatedGoal && (
          <GoalNotification
            goal={recentlyUpdatedGoal.goal}
            action={recentlyUpdatedGoal.action}
            companionId={selectedCompanion}
            position="bottom-right"
            onClose={() => clearRecentlyUpdatedGoal()}
          />
        )}
      </AnimatePresence>
      
      <main className="container mx-auto px-4 py-6">
        <motion.h1 
          className="text-2xl font-[Riffic] mb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: colors.text }}
        >
          Focus Timer
        </motion.h1>
        
        <div className="max-w-2xl mx-auto">
          {/* Timer Display */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6 mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Session Message */}
            <TimerMessage
              message={sessionMessage}
              timerState={timerState}
              companionId={selectedCompanion}
              mood={userData?.companions?.[selectedCompanion]?.mood || 'happy'}
              affinity={userData?.companions?.[selectedCompanion]?.affinityLevel || 50}
              sessionDuration={totalTimeWorked}
              consecutiveDays={userData?.companions?.[selectedCompanion]?.stats?.consecutiveDays || 0}
              onClose={() => setSessionMessage('')}
              colors={colors}
            />
            
            {/* Timer Display */}
            <TimerDisplay
              timeRemaining={timeRemaining}
              timerState={timerState}
              progressPercentage={progressPercentage}
              completedSessions={completedSessions}
              colors={colors}
            />
            
            {/* Timer Controls */}
            <TimerControls
              timerState={timerState}
              onStart={startTimer}
              onPause={pauseTimer}
              onResume={startTimer}
              onReset={resetTimer}
              onBreak={startBreak}
              onShowSettings={() => setShowSettings(true)}
              companionId={selectedCompanion}
              colors={colors}
            />
          </motion.div>
          
          {/* Settings Panel */}
          {showSettings && (
            <TimerSettings
              settings={currentSettings}
              onSettingsChange={handleSettingsChange}
              onSave={saveSettings}
              companionId={selectedCompanion}
              colors={colors}
            />
          )}
          
          {/* Stats */}
          <TimerStats
            totalTimeWorked={totalTimeWorked}
            completedSessions={completedSessions}
            colors={colors}
          />
        </div>
      </main>
    </div>
  );
}
