"use client";

import { motion } from "framer-motion";
import { useTimer } from "./TimerProvider";

export function TimerDisplay() {
  const { time, mode, sessionsCompleted } = useTimer();
  
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  const getModeLabel = () => {
    switch (mode) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  return (
    <div className="text-center mb-8">
      <motion.div
        className="text-6xl font-[Riffic] text-pink-700 mb-2"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
      </motion.div>
      <div className="text-xl font-[Halogen] text-pink-600">
        {getModeLabel()}
      </div>
      <div className="text-sm font-[Halogen] text-pink-500 mt-2">
        Session {sessionsCompleted + 1}
      </div>
    </div>
  );
}
