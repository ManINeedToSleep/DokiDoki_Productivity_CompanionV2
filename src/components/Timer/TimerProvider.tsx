"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUserData } from "@/hooks/useUserData";
import { doc, increment, writeBatch } from "firebase/firestore";
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
  const [localTimeTracked, setLocalTimeTracked] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const settings = useMemo(() => ({
    workDuration: userData?.settings?.timerSettings?.workDuration || 25,
    shortBreakDuration: userData?.settings?.timerSettings?.shortBreakDuration || 5,
    longBreakDuration: userData?.settings?.timerSettings?.longBreakDuration || 15
  }), [userData?.settings?.timerSettings]);

  const updateGoals = useCallback(async (secondsCompleted: number) => {
    if (!userData?.base?.uid || secondsCompleted < 60) return;
    
    const minutesCompleted = Math.floor(secondsCompleted / 60);
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userData.base.uid);

    // Stats updates (in seconds)
    batch.update(userRef, {
      'focusStats.todaysFocusTime': increment(secondsCompleted),
      'focusStats.totalFocusTime': increment(secondsCompleted),
      'focusStats.weeklyFocusTime': increment(secondsCompleted),
    });

    // Goal updates (in minutes)
    const activeGoals = userData.goals?.list || [];
    activeGoals.forEach(goal => {
      batch.update(userRef, {
        [`goals.list.${goal.id}.currentMinutes`]: increment(1)
      });
    });

    await batch.commit();
    
    // Achievement checks
    await Promise.all([
      checkAllAchievements(userData.base.uid, {
        ...userData.focusStats,
        totalFocusTime: (userData.focusStats.totalFocusTime || 0) + secondsCompleted,
        completedGoals: userData.goals?.list.filter(goal => goal.completed).length || 0
      }),
      checkSessionAchievements(userData.base.uid, secondsCompleted),
      sessionStartTime && checkTimeBasedAchievements(
        userData.base.uid,
        sessionStartTime,
        minutesCompleted
      )
    ].filter(Boolean));

    await refreshUserData();
  }, [userData, refreshUserData, sessionStartTime]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'work') {
            // Don't update goals here - it will be handled by pauseTimer
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
          return 0;
        }
        // Just track time locally
        setLocalTimeTracked(tracked => tracked + 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, settings, sessionsCompleted, userData?.base?.uid]);

  const startTimer = () => {
    setIsRunning(true);
    setSessionStartTime(new Date());
  };

  const pauseTimer = async () => {
    setIsRunning(false);
    if (localTimeTracked > 0) {
      await updateGoals(localTimeTracked);
      setLocalTimeTracked(0);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
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