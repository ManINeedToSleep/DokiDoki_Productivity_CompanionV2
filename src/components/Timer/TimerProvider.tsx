"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUserData } from "@/hooks/useUserData";
import { updateGoalProgress } from "@/lib/firebase/goals";
import { updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkAllAchievements, checkSessionAchievements, checkTimeBasedAchievements } from '@/lib/firebase/achievements';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerContextType {
  time: number;
  mode: TimerMode;
  isRunning: boolean;
  sessionsCompleted: number;
  settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: TimerMode) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { userData, refreshUserData } = useUserData();
  const [mode, setMode] = useState<TimerMode>('work');
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  
  const settings = useMemo(() => ({
    workDuration: userData?.settings?.timerSettings?.workDuration || 25,
    shortBreakDuration: userData?.settings?.timerSettings?.shortBreakDuration || 5,
    longBreakDuration: userData?.settings?.timerSettings?.longBreakDuration || 15
  }), [userData?.settings?.timerSettings]);

  const updateGoals = useCallback(async (secondsCompleted: number) => {
    if (!userData?.base?.uid) return;
    
    // Update system stats
    await updateDoc(doc(db, 'users', userData.base.uid), {
      'focusStats.todaysFocusTime': increment(secondsCompleted),
      'focusStats.totalFocusTime': increment(secondsCompleted),
      'focusStats.weeklyFocusTime': increment(secondsCompleted)
    });

    // Check achievements after updating stats
    await checkAllAchievements(userData.base.uid, {
      ...userData.focusStats,
      totalFocusTime: (userData.focusStats.totalFocusTime || 0) + secondsCompleted,
      completedGoals: userData.goals?.list.filter(goal => goal.completed).length || 0
    });

    // Only update goals if we have at least a minute
    const minutesCompleted = Math.floor(secondsCompleted / 60);
    if (minutesCompleted > 0) {
      // Update user-created goals
      const activeGoals = userData.goals?.list || [];
      for (const goal of activeGoals) {
        await updateGoalProgress(
          userData.base.uid,
          goal.id,
          goal.currentMinutes + minutesCompleted
        );
      }
    }

    await refreshUserData();
  }, [userData, refreshUserData]);

  useEffect(() => {
    if (!isRunning || !userData?.base?.uid) return;

    const handleTimerComplete = async () => {
      setIsRunning(false);
      
      if (mode === 'work' && lastUpdateTime) {
        const secondsElapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
        await updateGoals(secondsElapsed);
        await checkSessionAchievements(userData.base.uid, secondsElapsed);
        await checkTimeBasedAchievements(userData.base.uid, new Date(lastUpdateTime), Math.floor(secondsElapsed / 60));
        setLastUpdateTime(null);
        setSessionsCompleted(prev => prev + 1);
        
        if (sessionsCompleted % 4 === 3) {
          setMode('longBreak');
          setTime(settings.longBreakDuration * 60);
        } else {
          setMode('shortBreak');
          setTime(settings.shortBreakDuration * 60);
        }
      } else {
        setMode('work');
        setTime(settings.workDuration * 60);
      }
    };

    if (isRunning && mode === 'work' && !lastUpdateTime) {
      setLastUpdateTime(Date.now());
    }

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, userData?.base?.uid, mode, settings, sessionsCompleted, updateGoals, lastUpdateTime]);

  const startTimer = () => {
    setIsRunning(true);
    if (mode === 'work') {
      setLastUpdateTime(Date.now());
    }
  };

  const pauseTimer = async () => {
    setIsRunning(false);
    if (mode === 'work' && lastUpdateTime) {
      const secondsElapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
      await updateGoals(secondsElapsed);
      setLastUpdateTime(null);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setLastUpdateTime(null);
    setTime(settings[`${mode}Duration`] * 60);
  };

  return (
    <TimerContext.Provider value={{
      time,
      mode,
      isRunning,
      sessionsCompleted,
      settings,
      startTimer,
      pauseTimer,
      resetTimer,
      setMode
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}; 