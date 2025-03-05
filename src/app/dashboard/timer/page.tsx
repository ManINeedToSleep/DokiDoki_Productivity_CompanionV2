"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getUserDocument } from '@/lib/firebase/user';
import { UserDocument } from '@/lib/firebase/user';
import Navbar from '@/components/Common/Navbar/Navbar';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import Button from '@/components/Common/Button/Button';
import { useUserStore } from '@/lib/stores/userStore';
import { useCompanionStore } from '@/lib/stores/companionStore';
import { useAchievementsStore } from '@/lib/stores/achievementsStore';
import { Timestamp } from 'firebase/firestore';
import PolkaDotBackground from '@/components/Common/BackgroundCustom/PolkadotBackground';

// Timer states
type TimerState = 'idle' | 'running' | 'paused' | 'break' | 'completed';

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
  const { getSessionStart, getSessionComplete } = useCompanionStore();
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
          text: '#4A9B68',
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
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start timer
  const startTimer = async () => {
    if (timerState === 'idle' || timerState === 'paused') {
      // If starting a new session
      if (timerState === 'idle') {
        startTimeRef.current = Date.now();
        setSessionStartTime(new Date());
        
        // Get session start message from companion
        if (user && userData) {
          try {
            const message = await getSessionStart(user.uid, selectedCompanion);
            setSessionMessage(message);
          } catch (error) {
            console.error('Error getting session start message:', error);
          }
        }
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
      
      // Get session complete message
      try {
        const message = await getSessionComplete(user.uid, selectedCompanion);
        setSessionMessage(message);
      } catch (error) {
        console.error('Error getting session complete message:', error);
      }
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
  
  // Save settings
  const saveSettings = () => {
    setShowSettings(false);
    setTimeRemaining(workDuration);
    
    // If timer is idle, update the display
    if (timerState === 'idle') {
      setTimeRemaining(workDuration);
    }
  };
  
  // Get progress percentage
  const getProgressPercentage = (): number => {
    if (timerState === 'idle') return 0;
    
    const total = timerState === 'break' 
      ? (completedSessions % sessionsBeforeLongBreak === 0 ? longBreakDuration : breakDuration)
      : workDuration;
      
    const elapsed = total - timeRemaining;
    return Math.min(100, (elapsed / total) * 100);
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
            {sessionMessage && (
              <motion.div 
                className="mb-6 p-4 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ backgroundColor: colors.secondary }}
              >
                <p className="font-[Halogen] text-sm" style={{ color: colors.text }}>
                  {sessionMessage}
                </p>
              </motion.div>
            )}
            
            {/* Timer Status */}
            <div className="mb-2 font-[Halogen] text-sm text-gray-600">
              {timerState === 'idle' && 'Ready to start'}
              {timerState === 'running' && 'Focus session in progress'}
              {timerState === 'paused' && 'Session paused'}
              {timerState === 'break' && (
                completedSessions % sessionsBeforeLongBreak === 0 
                  ? 'Long break time' 
                  : 'Short break time'
              )}
              {timerState === 'completed' && 'Session completed!'}
            </div>
            
            {/* Timer Circle */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              {/* Time display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl font-[Riffic]" style={{ color: colors.text }}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
            
            {/* Session Counter */}
            <div className="mb-6">
              <span className="text-sm font-[Halogen] text-gray-600">
                Sessions completed: {completedSessions}
              </span>
            </div>
            
            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              {timerState === 'idle' && (
                <Button
                  label="Start Focus"
                  onClick={startTimer}
                  companionId={selectedCompanion}
                  className="flex items-center gap-2"
                />
              )}
              
              {timerState === 'running' && (
                <Button
                  label="Pause"
                  onClick={pauseTimer}
                  companionId={selectedCompanion}
                  className="flex items-center gap-2"
                />
              )}
              
              {timerState === 'paused' && (
                <>
                  <Button
                    label="Resume"
                    onClick={startTimer}
                    companionId={selectedCompanion}
                    className="flex items-center gap-2"
                  />
                  
                  <Button
                    label="Reset"
                    onClick={resetTimer}
                    companionId={selectedCompanion}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700"
                  />
                </>
              )}
              
              {timerState === 'completed' && (
                <Button
                  label="Take a Break"
                  onClick={startBreak}
                  companionId={selectedCompanion}
                  className="flex items-center gap-2"
                />
              )}
              
              {timerState === 'break' && (
                <div className="text-sm font-[Halogen] text-gray-600">
                  Enjoy your break!
                </div>
              )}
              
              {(timerState === 'idle' || timerState === 'completed') && (
                <Button
                  label="Settings"
                  onClick={() => setShowSettings(true)}
                  companionId={selectedCompanion}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700"
                />
              )}
            </div>
          </motion.div>
          
          {/* Settings Panel */}
          {showSettings && (
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
                Timer Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
                    Focus Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={workDuration / 60}
                    onChange={(e) => setWorkDuration(parseInt(e.target.value) * 60)}
                    min={1}
                    max={120}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: colors.primary
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
                    Short Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={breakDuration / 60}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value) * 60)}
                    min={1}
                    max={30}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: colors.primary
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={longBreakDuration / 60}
                    onChange={(e) => setLongBreakDuration(parseInt(e.target.value) * 60)}
                    min={1}
                    max={60}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: colors.primary
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-[Halogen] text-gray-700 mb-1">
                    Sessions Before Long Break
                  </label>
                  <input
                    type="number"
                    value={sessionsBeforeLongBreak}
                    onChange={(e) => setSessionsBeforeLongBreak(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: colors.primary
                    }}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    label="Save Settings"
                    onClick={saveSettings}
                    companionId={selectedCompanion}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Stats */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
              Current Session Stats
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-[Halogen] text-gray-600 mb-1">
                  Time Focused
                </div>
                <div className="text-xl font-[Riffic]" style={{ color: colors.text }}>
                  {formatTime(totalTimeWorked)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-[Halogen] text-gray-600 mb-1">
                  Sessions Completed
                </div>
                <div className="text-xl font-[Riffic]" style={{ color: colors.text }}>
                  {completedSessions}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
