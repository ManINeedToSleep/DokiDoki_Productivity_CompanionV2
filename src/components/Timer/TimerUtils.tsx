import { TimerState } from '@/components/Timer/types';

// Format time as MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get progress percentage for timer circle
export const getProgressPercentage = (
  timerState: TimerState,
  timeRemaining: number,
  workDuration: number,
  breakDuration: number,
  longBreakDuration: number,
  completedSessions: number,
  sessionsBeforeLongBreak: number
): number => {
  if (timerState === 'idle') return 0;
  
  const total = timerState === 'break' 
    ? (completedSessions % sessionsBeforeLongBreak === 0 ? longBreakDuration : breakDuration)
    : workDuration;
    
  const elapsed = total - timeRemaining;
  return Math.min(100, (elapsed / total) * 100);
}; 