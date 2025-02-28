"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatTime } from "@/lib/utils/timeFormat";
import Button from "@/components/Common/Button/Button";
import { Timestamp } from '@/lib/firebase';
import EditGoalModal from "./EditGoalModal";
import { useUserData } from "@/hooks/useUserData";
import { updateGoal } from "@/lib/firebase/goals";

interface GoalItemProps {
  id: string;
  title: string;
  description: string;
  current: number;  // Changed from currentMinutes
  target: number;   // Changed from targetMinutes
  type: 'daily' | 'weekly' | 'challenge';
  isCompanionGoal?: boolean;
  index: number;
  onDelete?: (id: string) => void;
  allowEditing?: boolean;
  expiresAt?: Timestamp;
}

export default function GoalItem({
  id,
  title,
  description,
  current,
  target,
  type,
  isCompanionGoal,
  index,
  onDelete,
  allowEditing,
  expiresAt,
}: GoalItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { userData, refreshUserData } = useUserData();

  const progress = Math.min((current / target) * 100, 100);
  const isCompleted = progress >= 100;

  const getBackgroundColor = () => {
    if (isCompleted) return 'bg-green-100/50 border-2 border-green-200';
    if (isCompanionGoal) return 'bg-pink-100/50';
    if (type === 'daily') return 'bg-blue-100/50';
    if (type === 'weekly') return 'bg-purple-100/50';
    return 'bg-white/50';
  };

  const getProgressBarColor = () => {
    if (isCompanionGoal) return 'bg-pink-400';
    if (type === 'daily') return 'bg-blue-400';
    if (type === 'weekly') return 'bg-purple-400';
    return 'bg-pink-500';
  };

  // Calculate time remaining
  const now = new Date();
  const expirationDate = expiresAt?.toDate();
  const hoursRemaining = expirationDate
    ? Math.max(0, Math.round((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60)))
    : null;

  const handleEdit = async (updates: { title: string; description: string; targetMinutes: number }) => {
    if (!userData?.base?.uid) return;
    try {
      await updateGoal(userData.base.uid, id, updates);
      await refreshUserData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isCompleted ? 1.02 : 1,
        }}
        transition={{ delay: index * 0.1 }}
        className={`p-4 rounded-lg ${getBackgroundColor()}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-[Halogen] text-pink-800">{title}</h3>
              {isCompleted && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  ✓
                </motion.span>
              )}
            </div>
            <p className="text-sm text-pink-600 mt-1">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-pink-600">
              {formatTime(current * 60)} / {formatTime(target * 60)}
            </span>
            {expiresAt && (
              <p className="text-xs text-pink-400 mt-1">
                Expires in: {hoursRemaining}h
              </p>
            )}
          </div>
        </div>

        <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getProgressBarColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm ${type === 'daily' ? 'text-pink-500' : 'text-pink-400'}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <div className="flex gap-2">
            {allowEditing && !isCompanionGoal && (
              <>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  label="Edit"
                  className="text-sm"
                />
                {onDelete && (
                  <Button
                    onClick={() => onDelete(id)}
                    label="Delete"
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-600"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {allowEditing && !isCompanionGoal && (
        <EditGoalModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          goal={{ title, description, targetMinutes: target }}
        />
      )}
    </>
  );
} 