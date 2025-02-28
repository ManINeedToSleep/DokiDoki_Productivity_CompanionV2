"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardCard from "@/components/Common/Card/DashboardCard";
import Button from "@/components/Common/Button/Button";
import { formatTime } from "@/lib/utils/timeFormat";
import type { UserDocument } from "@/lib/firebase/user";
import { COMPANION_GOALS, createGoal, updateGoal, refreshGoals, removeGoal } from "@/lib/firebase/goals";
import { useUserData } from "@/hooks/useUserData";
import { Timestamp } from '@/lib/firebase';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface GoalItemProps {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  type: 'daily' | 'weekly' | 'challenge';
  isCompanionGoal?: boolean;
  index: number;
  onDelete?: (id: string) => void;
  allowEditing?: boolean;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: { title: string; description: string; targetMinutes: number }) => void;
  goal: {
    title: string;
    description: string;
    target: number;
  };
}

const EditGoalModal = ({ isOpen, onClose, onSubmit, goal }: EditGoalModalProps) => {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [hours, setHours] = useState(String(goal.target / 60));

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
};

const GoalItem = ({ 
  id, 
  title, 
  description, 
  current, 
  target, 
  type, 
  isCompanionGoal, 
  index,
  onDelete,
  allowEditing 
}: GoalItemProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { refreshUserData } = useUserData();
  const { userData } = useUserData();

  const progress = Math.min((current / target) * 100, 100);
  const isCompleted = progress >= 100;
  
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
        className={`p-4 rounded-lg ${
          isCompleted ? 'bg-green-100/50 border-2 border-green-200' :
          isCompanionGoal ? 'bg-pink-100/50' : 'bg-white/50'
        }`}
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
          <span className="text-sm text-pink-600">
            {formatTime(current * 60)} / {formatTime(target * 60)}
          </span>
        </div>
        <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isCompanionGoal ? 'bg-pink-400' : 'bg-pink-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className={`${type === 'daily' ? 'text-pink-500' : 'text-pink-400'}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <span className="text-pink-600">{Math.round(progress)}%</span>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          {allowEditing && !isCompanionGoal && (
            <>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                label="Edit"
                className="text-sm"
              />
              <Button
                onClick={() => onDelete?.(id)}
                label="Delete"
                className="text-sm bg-red-100 hover:bg-red-200 text-red-600"
              />
            </>
          )}
        </div>
      </motion.div>

      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        goal={{ title, description, target }}
      />
    </>
  );
};

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: { title: string; description: string; targetMinutes: number; type: 'daily' | 'weekly' | 'challenge' }) => void;
}

const AddGoalModal = ({ isOpen, onClose, onSubmit }: AddGoalModalProps) => {
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
    setTitle("");
    setDescription("");
    setHours("1");
    setType('daily');
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
              placeholder="Enter your goal title"
              required
            />
          </div>
          <div>
            <label className="block text-pink-700 mb-2 font-[Halogen]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClasses}
              placeholder="Describe your goal"
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
};

interface GoalsProps {
  userData: UserDocument | null;
  variant?: 'dashboard' | 'full';
  allowEditing?: boolean;
}

const SectionHeader = ({ 
  title, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  isOpen: boolean; 
  onToggle: () => void;
}) => (
  <div 
    onClick={onToggle}
    className="flex items-center justify-between cursor-pointer group"
  >
    <h3 className="font-[Halogen] text-pink-600 mb-2">{title}</h3>
    <button className="p-1 rounded-full group-hover:bg-pink-50">
      {isOpen ? (
        <ChevronUpIcon className="w-4 h-4 text-pink-400" />
      ) : (
        <ChevronDownIcon className="w-4 h-4 text-pink-400" />
      )}
    </button>
  </div>
);

export default function Goals({ userData, variant = 'dashboard', allowEditing = false }: GoalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshUserData } = useUserData();
  const [openSections, setOpenSections] = useState({
    daily: true,
    weekly: true,
    custom: true
  });

  const handleCreateGoal = async (goal: { 
    title: string; 
    description: string;
    targetMinutes: number;
    type: 'daily' | 'weekly' | 'challenge';
  }) => {
    if (!userData?.base?.uid) return;

    try {
      await createGoal(userData.base.uid, {
        ...goal,
        deadline: Timestamp.fromDate(
          new Date(Date.now() + (goal.type === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000)
        )
      });
      setIsModalOpen(false);
      await refreshUserData();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  useEffect(() => {
    if (!userData?.base?.uid) return;

    const refreshUserGoals = async () => {
      try {
        await refreshGoals(userData.base.uid);
        await refreshUserData();
      } catch (error) {
        console.error('Error refreshing goals:', error);
      }
    };

    refreshUserGoals();
    const interval = setInterval(refreshUserGoals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userData?.base?.uid, refreshUserData]);

  if (!userData) return null;

  const companion = userData.settings?.selectedCompanion || 'sayori';
  const companionGoals = COMPANION_GOALS[companion] || [];

  const goals: (GoalItemProps & { id: string })[] = [
    {
      id: 'daily_focus',
      title: "Daily Focus Goal",
      description: "Complete your daily focus time target",
      current: userData.focusStats?.todaysFocusTime || 0,
      target: userData.goals?.dailyGoal || 25,
      type: 'daily' as const,
      isCompanionGoal: true,
      index: 0
    },
    ...companionGoals.map((goal, i) => ({
      id: `companion_${goal.title}`,
      title: goal.title,
      description: goal.description,
      current: userData.focusStats?.todaysFocusTime || 0,
      target: goal.targetMinutes,
      type: goal.type,
      isCompanionGoal: true,
      index: i + 1
    })),
    ...(userData.goals?.list || []).map((goal, i) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      current: goal.currentMinutes,
      target: goal.targetMinutes,
      type: goal.type,
      index: i + companionGoals.length + 1
    }))
  ];

  const handleDeleteGoal = async (goalId: string) => {
    if (!userData?.base?.uid) return;
    try {
      await removeGoal(userData.base.uid, goalId);
      await refreshUserData();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Separate goals by type
  const systemDailyGoals = goals.filter(goal => goal.type === 'daily' && (goal.id === 'daily_focus' || goal.isCompanionGoal));
  const systemWeeklyGoals = [
    ...goals.filter(goal => goal.type === 'weekly' && goal.isCompanionGoal),
    {
      id: 'weekly_challenge',
      title: "Weekly Challenge",
      description: "Complete 5 hours of focused work this week",
      current: userData.focusStats?.totalFocusTime || 0,
      target: 300,
      type: 'weekly' as const,
      isCompanionGoal: true,
      index: goals.length
    }
  ];
  const userGoals = goals.filter(goal => !goal.isCompanionGoal && goal.id !== 'daily_focus');

  // Filter goals based on variant
  const filteredGoals = variant === 'dashboard' 
    ? [...systemDailyGoals, ...systemWeeklyGoals]
    : goals;

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-[Riffic] text-pink-700">Goals</h2>
        {allowEditing && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            label="Add Goal"
          />
        )}
      </div>

      {variant === 'full' ? (
        <div className="space-y-6">
          {/* Daily Goals Section */}
          <div>
            <SectionHeader
              title="Daily Goals"
              isOpen={openSections.daily}
              onToggle={() => setOpenSections(prev => ({ ...prev, daily: !prev.daily }))}
            />
            <AnimatePresence>
              {openSections.daily && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                  className="space-y-3"
                >
                  {systemDailyGoals.map((goal) => (
                    <GoalItem key={goal.id} {...goal} onDelete={handleDeleteGoal} allowEditing={false} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Weekly Goals Section */}
          <div>
            <SectionHeader
              title="Weekly Goals"
              isOpen={openSections.weekly}
              onToggle={() => setOpenSections(prev => ({ ...prev, weekly: !prev.weekly }))}
            />
            <AnimatePresence>
              {openSections.weekly && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                  className="space-y-3"
                >
                  {systemWeeklyGoals.map((goal) => (
                    <GoalItem key={goal.id} {...goal} onDelete={handleDeleteGoal} allowEditing={false} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User's Custom Goals Section */}
          <div>
            <SectionHeader
              title="Your Goals"
              isOpen={openSections.custom}
              onToggle={() => setOpenSections(prev => ({ ...prev, custom: !prev.custom }))}
            />
            <AnimatePresence>
              {openSections.custom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                  className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent"
                >
                  {userGoals.map((goal) => (
                    <GoalItem key={goal.id} {...goal} onDelete={handleDeleteGoal} allowEditing={allowEditing} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        // Dashboard layout (system daily and weekly only)
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalItem 
              key={goal.id} 
              {...goal} 
              onDelete={handleDeleteGoal}
              allowEditing={false}
            />
          ))}
        </div>
      )}

      {allowEditing && (
        <AddGoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateGoal}
        />
      )}
    </DashboardCard>
  );
}
