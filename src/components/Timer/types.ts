import { CompanionId, CompanionMood } from "@/lib/firebase/companion";

// Timer states
export type TimerState = 'idle' | 'running' | 'paused' | 'break' | 'completed';

// Color props used by multiple components
export interface TimerColorProps {
  colors: {
    text: string;
    primary: string;
    secondary: string;
    heading?: string;
  };
}

// Timer settings interface
export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

// Timer display props
export interface TimerDisplayProps extends TimerColorProps {
  timeRemaining: number;
  timerState: TimerState;
  progressPercentage: number;
  completedSessions: number;
}

// Timer controls props
export interface TimerControlsProps extends TimerColorProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onBreak: () => void;
  onShowSettings: () => void;
  companionId: CompanionId;
}

// Timer settings props
export interface TimerSettingsProps extends TimerColorProps {
  settings: TimerSettings;
  onSettingsChange: (key: keyof TimerSettings, value: number) => void;
  onSave: () => void;
  companionId: CompanionId;
}

// Timer stats props
export interface TimerStatsProps extends TimerColorProps {
  totalTimeWorked: number;
  completedSessions: number;
}

// Timer message props
export interface TimerMessageProps extends TimerColorProps {
  message: string;
  timerState: TimerState;
  companionId: CompanionId;
  mood?: CompanionMood;
  affinity?: number;
  sessionDuration?: number;
  consecutiveDays?: number;
  onClose?: () => void;
} 