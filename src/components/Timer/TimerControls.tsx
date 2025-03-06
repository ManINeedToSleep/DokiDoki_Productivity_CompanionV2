import React from 'react';
import Button from '@/components/Common/Button/Button';
import { TimerControlsProps } from './types';

const TimerControls: React.FC<TimerControlsProps> = ({
  timerState,
  onStart,
  onPause,
  onResume,
  onReset,
  onBreak,
  onShowSettings,
  companionId
}) => {
  return (
    <div className="flex justify-center gap-4">
      {timerState === 'idle' && (
        <Button
          label="Start Focus"
          onClick={onStart}
          companionId={companionId}
          className="flex items-center gap-2"
        />
      )}
      
      {timerState === 'running' && (
        <Button
          label="Pause"
          onClick={onPause}
          companionId={companionId}
          className="flex items-center gap-2"
        />
      )}
      
      {timerState === 'paused' && (
        <>
          <Button
            label="Resume"
            onClick={onResume}
            companionId={companionId}
            className="flex items-center gap-2"
          />
          
          <Button
            label="Reset"
            onClick={onReset}
            companionId={companionId}
            className="flex items-center gap-2 bg-gray-200 text-gray-700"
          />
        </>
      )}
      
      {timerState === 'completed' && (
        <Button
          label="Take a Break"
          onClick={onBreak}
          companionId={companionId}
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
          onClick={onShowSettings}
          companionId={companionId}
          className="flex items-center gap-2 bg-gray-200 text-gray-700"
        />
      )}
    </div>
  );
};

export default TimerControls; 