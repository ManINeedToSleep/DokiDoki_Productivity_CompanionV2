"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/Common/Button/Button";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: { title: string; description: string; targetMinutes: number; type: 'daily' | 'weekly' | 'challenge' }) => void;
}

export default function AddGoalModal({ isOpen, onClose, onSubmit }: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("1");
  const [type, setType] = useState<'daily' | 'weekly' | 'challenge'>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      targetMinutes: parseInt(hours) * 60,
      type
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
        <h3 className="text-xl font-[Riffic] text-pink-700 mb-4">Create New Goal</h3>
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-pink-700 mb-2 font-[Halogen]">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'daily' | 'weekly' | 'challenge')}
                className={inputClasses}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="challenge">Challenge</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} label="Cancel" />
            <Button type="submit" label="Create Goal" />
          </div>
        </form>
      </motion.div>
    </div>
  );
} 