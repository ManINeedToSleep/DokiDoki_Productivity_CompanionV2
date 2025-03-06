"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion } from 'framer-motion';
import { useUserStore } from '@/lib/stores/userStore';
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
  const { recordFocusSession, updateCompanionMood, updateCompanionStats, updateCompanionAffinity } = useUserStore();
  const { checkFocus, checkSession } = useAchievementsStore();
  
  // Session message
  const [sessionMessage, setSessionMessage] = useState('');
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (user) {
      const fetchUserData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getUserDocument(user.uid);
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
        
        if (remaining <= 0) {
          // Timer completed
          clearInterval(timerRef.current!);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimerState('completed');
    setCompletedSessions(prev => prev + 1);
    
    // Record session in user data
    if (user && sessionStartTime) {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      
      // Record focus session
      const session = {
        startTime: Timestamp.fromDate(sessionStartTime),
        endTime: Timestamp.fromDate(new Date()),
        duration: sessionDuration,
        completed: true,
        companionId: selectedCompanion,
        breaks: {
          count: 0,
          totalDuration: 0
        }
      };
      
      recordFocusSession(user.uid, session);
      
      // Update companion stats
      updateCompanionStats(user.uid, selectedCompanion, sessionDuration);
      updateCompanionAffinity(user.uid, selectedCompanion, sessionDuration);
      updateCompanionMood(user.uid, selectedCompanion);
      
      // Check achievements
      checkFocus(
        user.uid, 
        userData?.focusStats?.totalFocusTime || 0 + sessionDuration,
        sessionDuration,
        userData?.focusStats?.totalSessions || 0 + 1
      );
      
      checkSession(user.uid, sessionDuration, sessionStartTime);
      
      // TimerMessage will handle getting the completion message
      setSessionMessage('');
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
