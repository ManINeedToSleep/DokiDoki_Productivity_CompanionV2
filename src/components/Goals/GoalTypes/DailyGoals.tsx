"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Goal } from "@/lib/firebase/goals";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import GoalItem from "../GoalEdits/GoalItem";

interface DailyGoalsProps {
  goals: Goal[];
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: (id: string) => void;
  allowEditing?: boolean;
}

export default function DailyGoals({ goals, isOpen, onToggle, onDelete, allowEditing = false }: DailyGoalsProps) {
  return (
    <div>
      <div 
        onClick={onToggle}
        className="flex items-center justify-between cursor-pointer group"
      >
        <h3 className="font-[Halogen] text-pink-600 mb-2">Daily Goals</h3>
        <button className="p-1 rounded-full group-hover:bg-pink-50">
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4 text-pink-400" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-pink-400" />
          )}
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {goals.map((goal, index) => (
              <GoalItem
                key={goal.id}
                {...goal}
                current={goal.currentMinutes}
                target={goal.targetMinutes}
                index={index}
                onDelete={onDelete}
                allowEditing={allowEditing}
                expiresAt={goal.deadline}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
