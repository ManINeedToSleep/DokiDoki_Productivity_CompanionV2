"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import Button from "@/components/Common/Button/Button";
import { formatTime } from "@/lib/utils/timeFormat";
import type { UserDocument } from "@/lib/firebase/user";

interface GoalItemProps {
  title: string;
  current: number;
  target: number;
  index: number;
}

const GoalItem = ({ title, current, target, index }: GoalItemProps) => {
  const progress = Math.min((current / target) * 100, 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/50 p-4 rounded-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-[Halogen] text-pink-800">{title}</h3>
        <span className="text-sm text-pink-600">
          {formatTime(current * 60)} / {formatTime(target * 60)}
        </span>
      </div>
      <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-right text-sm mt-1">
        <span className="text-pink-600">{Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
};

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: { title: string; targetMinutes: number }) => void;
}

const AddGoalModal = ({ isOpen, onClose, onSubmit }: AddGoalModalProps) => {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      targetMinutes: parseInt(hours) * 60
    });
    onClose();
    setTitle("");
    setHours("1");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-[Riffic] text-pink-700 mb-4">Create New Goal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
              placeholder="Enter your goal title"
              required
            />
          </div>
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Target Hours</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full p-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
              min="1"
              max="24"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} label="Cancel" />
            <Button type="submit" label="Create Goal" />
          </div>
        </form>
      </motion.div>
    </div>
  );
};

interface GoalsProps {
  userData: UserDocument | null;
}

export default function Goals({ userData }: GoalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateGoal = async (goal: { title: string; targetMinutes: number }) => {
    // TODO: Implement goal creation with Firebase
    // Really very fucking annoying to make this work with the timer
    // I'm not even going to bother
    // Why? It's not even a priority
    console.log("Creating goal:", goal);
  };

  if (!userData) return null;

  const goals = [
    {
      title: "Daily Focus Goal",
      current: userData.focusStats?.todaysFocusTime || 0,
      target: userData.goals?.dailyGoal || 25, // Default 25 minutes if not set
      index: 0
    },
    {
      title: "Companion Challenge",
      current: userData.focusStats?.totalFocusTime || 0,
      target: 120,
      index: 1
    }
  ];

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-[Riffic] text-pink-700">Goals</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          label="Add Goal"
        />
      </div>
      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalItem key={goal.title} {...goal} />
        ))}
      </div>

      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
      />
    </DashboardCard>
  );
}
