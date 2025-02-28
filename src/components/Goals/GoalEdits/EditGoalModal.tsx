"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/Common/Button/Button";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: { title: string; description: string; targetMinutes: number }) => void;
  goal: {
    title: string;
    description: string;
    targetMinutes: number;
  };
}

export default function EditGoalModal({ isOpen, onClose, onSubmit, goal }: EditGoalModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [hours, setHours] = useState(String(goal.targetMinutes / 60));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      targetMinutes: parseInt(hours) * 60
    });
    onClose();
  };

  const inputClasses = "w-full p-3 rounded-lg bg-white/50 border border-pink-200 focus:border-pink-400 focus:outline-none font-[Halogen] text-pink-900 placeholder:text-pink-300";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-[Riffic] text-pink-700 mb-4">Edit Goal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClasses}
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Target Hours</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={inputClasses}
              min="1"
              max="24"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} label="Cancel" />
            <Button type="submit" label="Save Changes" />
          </div>
        </form>
      </motion.div>
    </div>
  );
} 