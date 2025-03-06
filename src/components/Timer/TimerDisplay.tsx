import React from 'react';
import { TimerDisplayProps } from './types';
import { formatTime } from './TimerUtils';

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  timerState,
  progressPercentage,
  completedSessions,
  colors
}) => {
  const getTimerStatusText = () => {
    switch (timerState) {
      case 'idle':
        return 'Ready to start';
      case 'running':
        return 'Focus session in progress';
      case 'paused':
        return 'Session paused';
      case 'break':
        return completedSessions % 4 === 0 ? 'Long break time' : 'Short break time';
      case 'completed':
        return 'Session completed!';
      default:
        return '';
    }
  };

  return (
    <div className="text-center">
      {/* Timer Status */}
      <div className="mb-2 font-[Halogen] text-sm text-gray-600">
        {getTimerStatusText()}
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
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
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
    </div>
  );
};

export default TimerDisplay; 