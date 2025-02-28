"use client";

import { motion } from "framer-motion";
import { useTimer } from "./TimerProvider";
import Button from "@/components/Common/Button/Button";

export function TimerControls() {
  const { mode, isRunning, settings, startTimer, pauseTimer, resetTimer, setMode } = useTimer();

  const isDisabled = isRunning && mode === 'work';

  const handleModeChange = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    if (isDisabled) return;
    setMode(newMode);
    resetTimer();
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => handleModeChange('work')}
          label={`Focus (${settings.workDuration}m)`}
          className={mode === 'work' ? 'bg-pink-200' : ''}
          disabled={isDisabled}
        />
        <Button
          onClick={() => handleModeChange('shortBreak')}
          label={`Short Break (${settings.shortBreakDuration}m)`}
          className={mode === 'shortBreak' ? 'bg-pink-200' : ''}
          disabled={isDisabled}
        />
        <Button
          onClick={() => handleModeChange('longBreak')}
          label={`Long Break (${settings.longBreakDuration}m)`}
          className={mode === 'longBreak' ? 'bg-pink-200' : ''}
          disabled={isDisabled}
        />
      </div>

      {/* Timer Controls */}
      <motion.div 
        className="flex justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={isRunning ? pauseTimer : startTimer}
          label={isRunning ? 'Pause' : 'Start'}
        />
        <Button
          onClick={resetTimer}
          label="Reset"
          disabled={isDisabled}
        />
      </motion.div>
    </div>
  );
} 