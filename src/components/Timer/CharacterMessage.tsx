"use client";

import { motion } from "framer-motion";
import { useTimer } from "./TimerProvider";
import { useUserData } from "@/hooks/useUserData";

export function CharacterMessage() {
  const { mode, isRunning } = useTimer();
  const { userData } = useUserData();
  const companion = userData?.settings?.selectedCompanion || 'sayori';

  const getMessage = () => {
    if (!isRunning) {
      return "Ready to start studying? I'll be here to support you!";
    }

    switch (mode) {
      case 'work':
        return "You're doing great! Keep focusing!";
      case 'shortBreak':
        return "Take a quick breather! You've earned it!";
      case 'longBreak':
        return "Time for a proper break! Let's chat!";
      default:
        return "I'm here to help you study!";
    }
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="text-xl font-[Riffic] text-pink-600 mb-4">
        {companion.charAt(0).toUpperCase() + companion.slice(1)} says:
      </h2>
      <p className="font-[Halogen] text-pink-700">{getMessage()}</p>
    </motion.div>
  );
}
