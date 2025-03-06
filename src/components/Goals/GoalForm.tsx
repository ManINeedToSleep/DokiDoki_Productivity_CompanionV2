import React, { useState, useEffect } from 'react';
import { Goal } from '@/lib/firebase/goals';
import Button from '@/components/Common/Button/Button';
import { motion } from 'framer-motion';
import { getInputColors } from '@/components/Common/CharacterColor/CharacterColor';
import { getTomorrowDateString } from './GoalUtils';
import { CompanionId } from '@/lib/firebase/companion';

interface GoalFormProps {
  onSubmit: (title: string, description: string, targetMinutes: number, deadline?: string) => Promise<void>;
  onCancel: () => void;
  companionId: CompanionId;
  colors: {
    heading: string;
    text: string;
  };
  editingGoal?: Goal | null;
  isEdit?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  onCancel,
  companionId,
  colors,
  editingGoal = null,
  isEdit = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setTargetMinutes(editingGoal.targetMinutes);
    } else {
      setDeadline(getTomorrowDateString());
    }
  }, [editingGoal]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your goal");
      return;
    }

    if (!isEdit && !deadline) {
      alert("Please select a deadline for your goal");
      return;
    }

    try {
      await onSubmit(title, description, targetMinutes, deadline);
      
      // Reset form
      setTitle('');
      setDescription('');
      setTargetMinutes(25);
      if (!isEdit) {
        setDeadline(getTomorrowDateString());
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} goal:`, error);
      alert(`There was an error ${isEdit ? 'updating' : 'creating'} your goal. Please try again.`);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md p-4 mb-6"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      <h2 className="text-lg font-[Riffic] mb-4" style={{ color: colors.heading }}>
        {isEdit ? 'Edit Goal' : 'Add New Goal'}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
            style={{ 
              backgroundColor: getInputColors(companionId).bg,
              borderColor: getInputColors(companionId).border,
              color: getInputColors(companionId).focus,
              caretColor: getInputColors(companionId).focus,
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
            style={{ 
              backgroundColor: getInputColors(companionId).bg,
              borderColor: getInputColors(companionId).border,
              color: getInputColors(companionId).focus,
              caretColor: getInputColors(companionId).focus,
            }}
            rows={3}
          />
        </div>
        
        {isEdit ? (
          <div>
            <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
              Target Minutes
            </label>
            <input
              type="number"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
              min={1}
              className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
              style={{ 
                backgroundColor: getInputColors(companionId).bg,
                borderColor: getInputColors(companionId).border,
                color: getInputColors(companionId).focus,
                caretColor: getInputColors(companionId).focus,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                Target Minutes
              </label>
              <input
                type="number"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                min={1}
                className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                style={{ 
                  backgroundColor: getInputColors(companionId).bg,
                  borderColor: getInputColors(companionId).border,
                  color: getInputColors(companionId).focus,
                  caretColor: getInputColors(companionId).focus,
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-[Halogen] mb-1" style={{ color: colors.text }}>
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 font-[halogen]"
                style={{ 
                  backgroundColor: getInputColors(companionId).bg,
                  borderColor: getInputColors(companionId).border,
                  color: getInputColors(companionId).focus,
                  caretColor: getInputColors(companionId).focus,
                }}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            label="Cancel"
            onClick={onCancel}
            companionId={companionId}
            className="bg-gray-200 text-gray-700"
          />
          <Button
            label={isEdit ? "Update Goal" : "Add Goal"}
            onClick={handleSubmit}
            companionId={companionId}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default GoalForm; 